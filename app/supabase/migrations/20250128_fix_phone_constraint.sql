-- Migration pour corriger la contrainte de validation du téléphone
-- Date: 2025-01-28

-- Supprimer la contrainte trop stricte sur le téléphone
ALTER TABLE pro_validation_requests 
DROP CONSTRAINT IF EXISTS pro_validation_requests_phone_number_check;

-- Ajouter une contrainte plus flexible qui accepte différents formats français
ALTER TABLE pro_validation_requests 
ADD CONSTRAINT pro_validation_requests_phone_number_check 
CHECK (
    phone_number IS NULL OR 
    phone_number ~ '^0[1-9]( ?[0-9]{2}){4}$' OR           -- Format avec espaces optionnels: 01 23 45 67 89 ou 0123456789
    phone_number ~ '^0[1-9][0-9]{8}$' OR                  -- Format compact: 0123456789
    phone_number ~ '^0[1-9](\.[0-9]{2}){4}$' OR           -- Format avec points: 01.23.45.67.89
    phone_number ~ '^0[1-9](-[0-9]{2}){4}$' OR            -- Format avec tirets: 01-23-45-67-89
    phone_number ~ '^\+33[1-9][0-9]{8}$'                  -- Format international: +33123456789
);

-- Mettre à jour la fonction convert_amateur_to_pro pour normaliser le format du téléphone
CREATE OR REPLACE FUNCTION convert_amateur_to_pro(
    p_user_id UUID,
    p_date_of_birth DATE,
    p_siret TEXT,
    p_company_status TEXT,
    p_phone_number TEXT,
    p_id_card_front_url TEXT,
    p_id_card_back_url TEXT
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    normalized_phone TEXT;
BEGIN
    -- Vérifier que l'utilisateur existe et est amateur
    IF NOT EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = p_user_id AND user_type = 'amateur'
    ) THEN
        RAISE EXCEPTION 'Utilisateur introuvable ou déjà professionnel';
    END IF;

    -- Normaliser le numéro de téléphone pour le stockage
    normalized_phone := p_phone_number;
    
    -- Si le numéro commence par +33, le convertir en format français
    IF normalized_phone ~ '^\+33[1-9][0-9]{8}$' THEN
        normalized_phone := '0' || substring(normalized_phone from 4);
    END IF;
    
    -- Supprimer tous les caractères non numériques sauf le premier 0
    normalized_phone := regexp_replace(normalized_phone, '[^0-9]', '', 'g');
    
    -- Vérifier que c'est un numéro français valide (10 chiffres commençant par 0)
    IF normalized_phone !~ '^0[1-9][0-9]{8}$' THEN
        RAISE EXCEPTION 'Format de téléphone invalide. Attendu: numéro français à 10 chiffres commençant par 0.';
    END IF;
    
    -- Reformater avec des espaces pour l'affichage: 0X XX XX XX XX
    normalized_phone := substring(normalized_phone from 1 for 2) || ' ' ||
                       substring(normalized_phone from 3 for 2) || ' ' ||
                       substring(normalized_phone from 5 for 2) || ' ' ||
                       substring(normalized_phone from 7 for 2) || ' ' ||
                       substring(normalized_phone from 9 for 2);

    -- Créer une demande de validation au lieu de convertir directement
    INSERT INTO pro_validation_requests (
        user_id,
        phone_number,
        id_card_front_url,
        id_card_back_url,
        siret,
        company_status,
        date_of_birth,
        status,
        created_at
    ) VALUES (
        p_user_id,
        normalized_phone,
        p_id_card_front_url,
        p_id_card_back_url,
        p_siret,
        p_company_status,
        p_date_of_birth,
        'pending',
        NOW()
    );

    -- Vérifier si l'insertion a réussi
    IF NOT FOUND THEN
        -- Vérifier s'il y a déjà une demande en cours
        IF EXISTS (
            SELECT 1 FROM pro_validation_requests 
            WHERE user_id = p_user_id AND status = 'pending'
        ) THEN
            RAISE EXCEPTION 'Une demande de validation est déjà en cours pour cet utilisateur';
        END IF;
    END IF;

    RETURN TRUE;

EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Erreur lors de la création de la demande: %', SQLERRM;
END;
$$;

-- Ajouter aussi la normalisation dans complete_amateur_to_pro_conversion
CREATE OR REPLACE FUNCTION complete_amateur_to_pro_conversion(
    p_user_id UUID,
    p_date_of_birth DATE,
    p_siret TEXT,
    p_company_status TEXT,
    p_phone_number TEXT,
    p_id_card_front_url TEXT DEFAULT NULL,
    p_id_card_back_url TEXT DEFAULT NULL
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    normalized_phone TEXT;
BEGIN
    -- Vérifier que l'utilisateur existe et est amateur
    IF NOT EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = p_user_id AND user_type = 'amateur'
    ) THEN
        RAISE EXCEPTION 'Utilisateur introuvable ou déjà professionnel';
    END IF;

    -- Normaliser le numéro de téléphone
    normalized_phone := p_phone_number;
    
    -- Si le numéro commence par +33, le convertir en format français
    IF normalized_phone ~ '^\+33[1-9][0-9]{8}$' THEN
        normalized_phone := '0' || substring(normalized_phone from 4);
    END IF;
    
    -- Supprimer tous les caractères non numériques sauf le premier 0
    normalized_phone := regexp_replace(normalized_phone, '[^0-9]', '', 'g');
    
    -- Reformater avec des espaces: 0X XX XX XX XX
    IF normalized_phone ~ '^0[1-9][0-9]{8}$' THEN
        normalized_phone := substring(normalized_phone from 1 for 2) || ' ' ||
                           substring(normalized_phone from 3 for 2) || ' ' ||
                           substring(normalized_phone from 5 for 2) || ' ' ||
                           substring(normalized_phone from 7 for 2) || ' ' ||
                           substring(normalized_phone from 9 for 2);
    END IF;

    -- Mise à jour du profil utilisateur vers type pro
    UPDATE profiles 
    SET 
        user_type = 'pro',
        updated_at = NOW()
    WHERE id = p_user_id;

    -- Création du profil professionnel
    INSERT INTO pro_profiles (
        user_id,
        date_of_birth,
        siret,
        company_status,
        phone_number,
        id_card_front_url,
        id_card_back_url,
        validation_status,
        validated_at,
        created_at,
        division -- Garder ce champ pour la compatibilité
    ) VALUES (
        p_user_id,
        p_date_of_birth,
        p_siret,
        p_company_status,
        normalized_phone,
        p_id_card_front_url,
        p_id_card_back_url,
        'approved',
        NOW(),
        NOW(),
        'Professional' -- Valeur par défaut
    );

    -- Supprimer le profil amateur s'il existe
    DELETE FROM amateur_profiles WHERE user_id = p_user_id;

    RETURN TRUE;
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Erreur lors de la conversion: %', SQLERRM;
END;
$$;

-- Commentaires pour documentation
COMMENT ON CONSTRAINT pro_validation_requests_phone_number_check ON pro_validation_requests 
IS 'Validation flexible du téléphone français - accepte différents formats et normalise automatiquement';

-- Message de confirmation
DO $$
BEGIN
    RAISE NOTICE 'Migration terminée: contrainte téléphone assouplie et normalisation automatique ajoutée.';
    RAISE NOTICE 'Formats acceptés: 0123456789, 01 23 45 67 89, 01.23.45.67.89, 01-23-45-67-89, +33123456789';
END $$;