-- Migration pour mettre à jour convert_amateur_to_pro avec les nouveaux paramètres
-- Date: 2025-01-28

-- Supprimer l'ancienne fonction
DROP FUNCTION IF EXISTS convert_amateur_to_pro(UUID, DATE, TEXT, TEXT, TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS convert_amateur_to_pro(UUID, DATE, TEXT, NUMERIC, TEXT, TEXT, TEXT);

-- Créer la nouvelle fonction avec les paramètres attendus par l'app mobile
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

    -- Au lieu de convertir directement, créer une demande de validation
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
    );

    -- Retourner true pour indiquer que la demande a été créée avec succès
    -- Note: L'utilisateur n'est PAS encore converti en pro, il faut l'approbation admin
    RETURN TRUE;

EXCEPTION
    WHEN unique_violation THEN
        RAISE EXCEPTION 'Une demande de validation est déjà en cours pour cet utilisateur';
    WHEN OTHERS THEN
        -- En cas d'erreur, rollback et renvoyer false
        RAISE EXCEPTION 'Erreur lors de la création de la demande: %', SQLERRM;
        RETURN FALSE;
END;
$$;

-- Créer aussi une fonction pour la conversion finale (utilisée après approbation admin)
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

    -- Création du profil professionnel avec les nouvelles données
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
        division -- Valeur par défaut pour éviter les erreurs
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
        'Pro' -- Division par défaut
    );

    -- Supprimer le profil amateur s'il existe
    DELETE FROM amateur_profiles WHERE user_id = p_user_id;

    RETURN TRUE;
EXCEPTION
    WHEN OTHERS THEN
        -- En cas d'erreur, rollback et renvoyer false
        RAISE EXCEPTION 'Erreur lors de la conversion: %', SQLERRM;
        RETURN FALSE;
END;
$$;

-- Mettre à jour la fonction validate_pro_request pour utiliser la nouvelle fonction
CREATE OR REPLACE FUNCTION validate_pro_request(
    p_request_id UUID,
    p_admin_id UUID,
    p_action TEXT, -- 'approve' ou 'reject'
    p_admin_notes TEXT DEFAULT NULL
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    request_record pro_validation_requests%ROWTYPE;
    new_status TEXT;
BEGIN
    -- Valider l'action
    IF p_action NOT IN ('approve', 'reject') THEN
        RAISE EXCEPTION 'Action non valide: %', p_action;
    END IF;

    new_status := CASE 
        WHEN p_action = 'approve' THEN 'approved'
        WHEN p_action = 'reject' THEN 'rejected'
    END;

    -- Récupérer la demande
    SELECT * INTO request_record
    FROM pro_validation_requests
    WHERE id = p_request_id AND status = 'pending';

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Demande de validation introuvable ou déjà traitée';
    END IF;

    -- Mettre à jour la demande
    UPDATE pro_validation_requests
    SET 
        status = new_status,
        admin_id = p_admin_id,
        admin_notes = p_admin_notes,
        validated_at = NOW()
    WHERE id = p_request_id;

    -- Si approuvée, effectuer la conversion complète
    IF p_action = 'approve' THEN
        PERFORM complete_amateur_to_pro_conversion(
            request_record.user_id,
            request_record.date_of_birth,
            request_record.siret,
            request_record.company_status,
            request_record.phone_number,
            request_record.id_card_front_url,
            request_record.id_card_back_url
        );
    END IF;

    RETURN TRUE;
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Erreur lors de la validation: %', SQLERRM;
END;
$$;

-- Accorder les permissions appropriées
GRANT EXECUTE ON FUNCTION convert_amateur_to_pro(UUID, DATE, TEXT, TEXT, TEXT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION complete_amateur_to_pro_conversion(UUID, DATE, TEXT, TEXT, TEXT, TEXT, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION validate_pro_request(UUID, UUID, TEXT, TEXT) TO service_role;

-- Commentaires pour documentation
COMMENT ON FUNCTION convert_amateur_to_pro IS 'Crée une demande de validation pro au lieu de convertir directement - NOUVELLE VERSION';
COMMENT ON FUNCTION complete_amateur_to_pro_conversion IS 'Effectue la conversion finale amateur->pro après approbation admin';
COMMENT ON FUNCTION validate_pro_request IS 'Valide ou rejette une demande professionnelle par un admin - VERSION MISE À JOUR';