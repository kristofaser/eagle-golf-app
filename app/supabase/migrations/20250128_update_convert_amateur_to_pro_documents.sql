-- Migration: Mise à jour de la fonction convert_amateur_to_pro pour gérer les documents
-- Date: 2025-01-28
-- Description: Ajouter la gestion des URLs des documents d'identité lors de la conversion amateur -> pro

-- Vérifier si la table pro_profiles a les colonnes pour les documents
DO $$ 
BEGIN
    -- Ajouter la colonne id_card_front_url si elle n'existe pas
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'pro_profiles' 
                   AND column_name = 'id_card_front_url') THEN
        ALTER TABLE pro_profiles ADD COLUMN id_card_front_url TEXT;
    END IF;

    -- Ajouter la colonne id_card_back_url si elle n'existe pas
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'pro_profiles' 
                   AND column_name = 'id_card_back_url') THEN
        ALTER TABLE pro_profiles ADD COLUMN id_card_back_url TEXT;
    END IF;

    -- Ajouter la colonne document_status si elle n'existe pas
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'pro_profiles' 
                   AND column_name = 'document_status') THEN
        ALTER TABLE pro_profiles ADD COLUMN document_status TEXT DEFAULT 'pending';
    END IF;
END $$;

-- Créer un type ENUM pour le statut des documents
CREATE TYPE document_status_enum AS ENUM ('pending', 'submitted', 'approved', 'rejected');

-- Mettre à jour la colonne pour utiliser le type ENUM
ALTER TABLE pro_profiles ALTER COLUMN document_status TYPE document_status_enum 
    USING document_status::document_status_enum;

-- Mettre à jour la fonction convert_amateur_to_pro
CREATE OR REPLACE FUNCTION convert_amateur_to_pro(
  p_user_id UUID,
  p_date_of_birth DATE,
  p_siret TEXT,
  p_company_status TEXT,
  p_division TEXT,
  p_id_card_front_url TEXT DEFAULT NULL,
  p_id_card_back_url TEXT DEFAULT NULL
) RETURNS BOOLEAN AS $$
DECLARE
  amateur_handicap INTEGER;
BEGIN
  -- Vérifier que l'utilisateur est bien amateur
  IF NOT EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = p_user_id AND user_type = 'amateur'
  ) THEN
    RAISE EXCEPTION 'User is not an amateur or does not exist';
  END IF;

  -- Récupérer le handicap depuis amateur_profiles
  SELECT handicap INTO amateur_handicap 
  FROM amateur_profiles 
  WHERE user_id = p_user_id;

  -- Mettre à jour le type dans profiles
  UPDATE profiles
  SET user_type = 'pro',
      updated_at = NOW()
  WHERE id = p_user_id;

  -- Créer l'entrée dans pro_profiles avec les documents
  INSERT INTO pro_profiles (
    user_id,
    date_of_birth,
    siret,
    company_status,
    division,
    handicap,
    id_card_front_url,
    id_card_back_url,
    document_status,
    professional_status,
    created_at,
    updated_at
  ) VALUES (
    p_user_id,
    p_date_of_birth,
    p_siret,
    p_company_status,
    p_division,
    COALESCE(amateur_handicap, 0),
    p_id_card_front_url,
    p_id_card_back_url,
    CASE 
      WHEN p_id_card_front_url IS NOT NULL AND p_id_card_back_url IS NOT NULL 
      THEN 'submitted'::document_status_enum 
      ELSE 'pending'::document_status_enum 
    END,
    'pending', -- professional_status en attente de validation
    NOW(),
    NOW()
  );

  -- Log de l'action
  RAISE NOTICE 'User % converted from amateur to pro. Documents: front=%, back=%', 
    p_user_id, 
    CASE WHEN p_id_card_front_url IS NOT NULL THEN 'uploaded' ELSE 'missing' END,
    CASE WHEN p_id_card_back_url IS NOT NULL THEN 'uploaded' ELSE 'missing' END;

  RETURN TRUE;

EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Error converting amateur to pro: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ajouter des commentaires
COMMENT ON FUNCTION convert_amateur_to_pro IS 'Convertit un utilisateur amateur en professionnel avec gestion des documents d''identité';
COMMENT ON COLUMN pro_profiles.id_card_front_url IS 'URL sécurisée du recto de la carte d''identité';
COMMENT ON COLUMN pro_profiles.id_card_back_url IS 'URL sécurisée du verso de la carte d''identité'; 
COMMENT ON COLUMN pro_profiles.document_status IS 'Statut de validation des documents : pending, submitted, approved, rejected';

-- Politique RLS pour les documents (seuls les propriétaires et admins peuvent voir)
DROP POLICY IF EXISTS "pro_profiles_documents_policy" ON pro_profiles;
CREATE POLICY "pro_profiles_documents_policy" 
ON pro_profiles FOR SELECT 
USING (
  user_id = auth.uid() OR 
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND user_type = 'admin'
  )
);

-- Index pour optimiser les recherches par statut de document
CREATE INDEX IF NOT EXISTS idx_pro_profiles_document_status 
ON pro_profiles(document_status);

-- Index pour les URLs de documents (utile pour les recherches d'orphelins)
CREATE INDEX IF NOT EXISTS idx_pro_profiles_documents 
ON pro_profiles(id_card_front_url, id_card_back_url) 
WHERE id_card_front_url IS NOT NULL OR id_card_back_url IS NOT NULL;