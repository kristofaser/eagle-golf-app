-- Migration pour supprimer le paramètre division de la fonction convert_amateur_to_pro
-- Date: 2025-01-28

-- Supprimer l'ancienne fonction
DROP FUNCTION IF EXISTS convert_amateur_to_pro(UUID, DATE, TEXT, TEXT, TEXT, TEXT, TEXT);

-- Recréer la fonction sans le paramètre division mais avec le téléphone
CREATE OR REPLACE FUNCTION convert_amateur_to_pro(
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

    -- Création du profil professionnel (sans division, avec téléphone)
    INSERT INTO pro_profiles (
        user_id,
        date_of_birth,
        siret,
        company_status,
        phone_number,
        id_card_front_url,
        id_card_back_url,
        created_at
    ) VALUES (
        p_user_id,
        p_date_of_birth,
        p_siret,
        p_company_status,
        p_phone_number,
        p_id_card_front_url,
        p_id_card_back_url,
        NOW()
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

-- Accorder les permissions appropriées
GRANT EXECUTE ON FUNCTION convert_amateur_to_pro(UUID, DATE, TEXT, TEXT, TEXT, TEXT, TEXT) TO authenticated;

-- Commentaire pour documenter la fonction
COMMENT ON FUNCTION convert_amateur_to_pro IS 'Convertit un profil amateur en professionnel avec téléphone, sans champ division';