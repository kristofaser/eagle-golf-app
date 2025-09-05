-- Migration pour corriger le problème de fonctions multiples convert_amateur_to_pro
-- Date: 2025-01-28

-- D'abord, lister et supprimer toutes les versions existantes de convert_amateur_to_pro
-- Supprimer explicitement toutes les signatures possibles

-- Version originale (si elle existe)
DROP FUNCTION IF EXISTS convert_amateur_to_pro(UUID, DATE, TEXT, TEXT, TEXT, TEXT, TEXT);

-- Version avec hourly_rate (si elle existe)  
DROP FUNCTION IF EXISTS convert_amateur_to_pro(UUID, DATE, TEXT, NUMERIC, TEXT, TEXT, TEXT);

-- Version avec division (si elle existe)
DROP FUNCTION IF EXISTS convert_amateur_to_pro(UUID, DATE, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT);

-- Version avec d'autres paramètres possibles
DROP FUNCTION IF EXISTS convert_amateur_to_pro(p_user_id UUID, p_date_of_birth DATE, p_siret TEXT, p_company_status TEXT, p_division TEXT, p_hourly_rate NUMERIC, p_professional_status TEXT);

-- Rechercher et supprimer toutes les autres versions possibles
DO $$ 
DECLARE
    func_record RECORD;
BEGIN
    -- Supprimer toutes les fonctions nommées convert_amateur_to_pro
    FOR func_record IN 
        SELECT proname, oidvectortypes(proargtypes) as args
        FROM pg_proc 
        WHERE proname = 'convert_amateur_to_pro' 
        AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
    LOOP
        EXECUTE format('DROP FUNCTION IF EXISTS public.convert_amateur_to_pro(%s)', func_record.args);
        RAISE NOTICE 'Supprimée: convert_amateur_to_pro(%)', func_record.args;
    END LOOP;
END $$;

-- Maintenant créer la nouvelle fonction avec la signature exacte attendue par l'app mobile
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
BEGIN
    -- Vérifier que l'utilisateur existe et est amateur
    IF NOT EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = p_user_id AND user_type = 'amateur'
    ) THEN
        RAISE EXCEPTION 'Utilisateur introuvable ou déjà professionnel';
    END IF;

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
        p_phone_number,
        p_id_card_front_url,
        p_id_card_back_url,
        p_siret,
        p_company_status,
        p_date_of_birth,
        'pending',
        NOW()
    )
    ON CONFLICT (user_id, created_at) 
    DO NOTHING; -- Éviter les doublons si appelée plusieurs fois

    -- Vérifier si l'insertion a réussi ou si un conflit s'est produit
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

-- Créer la fonction pour la conversion finale (après approbation admin)
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
BEGIN
    -- Vérifier que l'utilisateur existe et est amateur
    IF NOT EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = p_user_id AND user_type = 'amateur'
    ) THEN
        RAISE EXCEPTION 'Utilisateur introuvable ou déjà professionnel';
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
        p_phone_number,
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

-- Accorder les permissions appropriées
GRANT EXECUTE ON FUNCTION convert_amateur_to_pro(UUID, DATE, TEXT, TEXT, TEXT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION complete_amateur_to_pro_conversion(UUID, DATE, TEXT, TEXT, TEXT, TEXT, TEXT) TO service_role;

-- Commentaires pour documentation
COMMENT ON FUNCTION convert_amateur_to_pro IS 'Crée une demande de validation professionnelle - Version corrigée 2025-01-28';
COMMENT ON FUNCTION complete_amateur_to_pro_conversion IS 'Conversion finale amateur->pro après validation admin';

-- Vérification finale
DO $$
BEGIN
    RAISE NOTICE 'Migration terminée. Fonction convert_amateur_to_pro recréée avec la nouvelle logique.';
    RAISE NOTICE 'Les demandes créent maintenant des entrées dans pro_validation_requests avec statut pending.';
END $$;