-- Migration: Ajout des champs de suspension utilisateur
-- Date: 2024-12-XX
-- Description: Ajoute les colonnes nécessaires pour gérer la suspension des utilisateurs

-- Ajouter les colonnes de suspension à la table profiles
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS is_suspended boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS suspended_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS suspended_by uuid,
ADD COLUMN IF NOT EXISTS suspension_reason text;

-- Ajouter la contrainte de clé étrangère pour suspended_by
ALTER TABLE profiles 
ADD CONSTRAINT fk_profiles_suspended_by 
FOREIGN KEY (suspended_by) REFERENCES admin_profiles(id);

-- Créer un index pour les requêtes de suspension
CREATE INDEX IF NOT EXISTS idx_profiles_is_suspended ON profiles(is_suspended);
CREATE INDEX IF NOT EXISTS idx_profiles_suspended_at ON profiles(suspended_at);

-- Commentaires pour documentation
COMMENT ON COLUMN profiles.is_suspended IS 'Indique si le compte utilisateur est suspendu';
COMMENT ON COLUMN profiles.suspended_at IS 'Date et heure de la suspension';
COMMENT ON COLUMN profiles.suspended_by IS 'ID de l''administrateur ayant effectué la suspension';
COMMENT ON COLUMN profiles.suspension_reason IS 'Raison de la suspension';