-- Migration pour ajouter le système de validation des demandes professionnelles
-- Date: 2025-01-28

-- 1. Ajouter les champs manquants à pro_profiles
ALTER TABLE pro_profiles 
ADD COLUMN IF NOT EXISTS phone_number TEXT,
ADD COLUMN IF NOT EXISTS id_card_front_url TEXT,
ADD COLUMN IF NOT EXISTS id_card_back_url TEXT,
ADD COLUMN IF NOT EXISTS validation_status TEXT DEFAULT 'pending' CHECK (validation_status IN ('pending', 'approved', 'rejected')),
ADD COLUMN IF NOT EXISTS validation_notes TEXT,
ADD COLUMN IF NOT EXISTS validated_by UUID REFERENCES admin_profiles(id),
ADD COLUMN IF NOT EXISTS validated_at TIMESTAMPTZ;

-- 2. Créer la table pro_validation_requests pour l'historique des demandes
CREATE TABLE IF NOT EXISTS pro_validation_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    phone_number TEXT NOT NULL,
    id_card_front_url TEXT NOT NULL,
    id_card_back_url TEXT NOT NULL,
    siret TEXT NOT NULL,
    company_status TEXT NOT NULL,
    date_of_birth DATE,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    admin_id UUID REFERENCES admin_profiles(id),
    admin_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    validated_at TIMESTAMPTZ,
    
    -- Contraintes
    UNIQUE(user_id, created_at), -- Un utilisateur peut avoir plusieurs demandes mais pas au même moment
    CHECK (phone_number ~ '^0[1-9]( [0-9]{2}){4}$') -- Format français : 0X XX XX XX XX
);

-- 3. Créer les index pour les performances
CREATE INDEX IF NOT EXISTS idx_pro_validation_requests_status ON pro_validation_requests(status);
CREATE INDEX IF NOT EXISTS idx_pro_validation_requests_created_at ON pro_validation_requests(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_pro_validation_requests_user_id ON pro_validation_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_pro_profiles_validation_status ON pro_profiles(validation_status);

-- 4. Fonction pour créer une demande de validation pro
CREATE OR REPLACE FUNCTION create_pro_validation_request(
    p_user_id UUID,
    p_phone_number TEXT,
    p_siret TEXT,
    p_company_status TEXT,
    p_date_of_birth DATE,
    p_id_card_front_url TEXT,
    p_id_card_back_url TEXT
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    request_id UUID;
BEGIN
    -- Vérifier que l'utilisateur existe et est amateur
    IF NOT EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = p_user_id AND user_type = 'amateur'
    ) THEN
        RAISE EXCEPTION 'Utilisateur introuvable ou déjà professionnel';
    END IF;

    -- Vérifier qu'il n'y a pas de demande en cours
    IF EXISTS (
        SELECT 1 FROM pro_validation_requests 
        WHERE user_id = p_user_id AND status = 'pending'
    ) THEN
        RAISE EXCEPTION 'Une demande de validation est déjà en cours pour cet utilisateur';
    END IF;

    -- Créer la demande de validation
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
    ) RETURNING id INTO request_id;

    RETURN request_id;
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Erreur lors de la création de la demande: %', SQLERRM;
END;
$$;

-- 5. Fonction pour valider/rejeter une demande pro
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

    -- Si approuvée, convertir en pro et mettre à jour pro_profiles
    IF p_action = 'approve' THEN
        -- Utiliser la fonction existante convert_amateur_to_pro
        PERFORM convert_amateur_to_pro(
            request_record.user_id,
            request_record.date_of_birth,
            request_record.siret,
            request_record.company_status,
            request_record.phone_number,
            request_record.id_card_front_url,
            request_record.id_card_back_url
        );

        -- Mettre à jour le statut de validation dans pro_profiles
        UPDATE pro_profiles
        SET 
            validation_status = 'approved',
            validated_by = p_admin_id,
            validated_at = NOW(),
            validation_notes = p_admin_notes
        WHERE user_id = request_record.user_id;
    END IF;

    RETURN TRUE;
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Erreur lors de la validation: %', SQLERRM;
END;
$$;

-- 6. Politiques de sécurité Row Level Security (RLS)
ALTER TABLE pro_validation_requests ENABLE ROW LEVEL SECURITY;

-- Politique pour les admins (lecture/écriture complète)
CREATE POLICY "Admins peuvent gérer toutes les demandes pro"
ON pro_validation_requests
FOR ALL
TO service_role
USING (true);

-- Politique pour les utilisateurs (lecture seule de leurs demandes)
CREATE POLICY "Utilisateurs peuvent voir leurs demandes"
ON pro_validation_requests
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- 7. Accorder les permissions
GRANT EXECUTE ON FUNCTION create_pro_validation_request(UUID, TEXT, TEXT, TEXT, DATE, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION validate_pro_request(UUID, UUID, TEXT, TEXT) TO service_role;

-- 8. Commentaires pour documentation
COMMENT ON TABLE pro_validation_requests IS 'Table stockant l historique des demandes de validation professionnelle';
COMMENT ON FUNCTION create_pro_validation_request IS 'Crée une nouvelle demande de validation professionnelle';
COMMENT ON FUNCTION validate_pro_request IS 'Valide ou rejette une demande professionnelle par un admin';

-- 9. Mise à jour des profils existants pour avoir un statut par défaut
UPDATE pro_profiles 
SET validation_status = 'approved' 
WHERE validation_status IS NULL;