-- Migration: Système de divisions professionnelles officielles
-- Date: 2025-08-11
-- Description: Remplace le champ texte libre par un ENUM avec 7 divisions officielles

-- Étape 1: Créer le nouveau type ENUM avec les divisions officielles
CREATE TYPE pro_division AS ENUM (
  'DP World Tour',
  'HotelPlanner Tour', 
  'Alps Tour',
  'Pro Golf Tour',
  'Ladies European Tour',
  'Legends Tour',
  'Circuit Français'
);

-- Étape 2: Ajouter une nouvelle colonne temporaire avec le type ENUM
ALTER TABLE pro_profiles 
ADD COLUMN division_new pro_division;

-- Étape 3: Migrer les données existantes vers les nouvelles divisions
-- Mapping des anciennes valeurs vers les nouvelles divisions officielles
UPDATE pro_profiles 
SET division_new = CASE 
  WHEN division = 'LPGA Tour' THEN 'Ladies European Tour'::pro_division
  WHEN division = 'PGA Professional' THEN 'Circuit Français'::pro_division  
  WHEN division = 'PGA Master Professional' THEN 'Circuit Français'::pro_division
  ELSE 'Circuit Français'::pro_division -- Valeur par défaut pour autres cas
END
WHERE division IS NOT NULL;

-- Étape 4: Supprimer l'ancienne colonne et renommer la nouvelle
ALTER TABLE pro_profiles DROP COLUMN division;
ALTER TABLE pro_profiles RENAME COLUMN division_new TO division;

-- Commentaire pour documentation
COMMENT ON TYPE pro_division IS 'Divisions professionnelles officielles pour les pros de golf';
COMMENT ON COLUMN pro_profiles.division IS 'Division professionnelle officielle du joueur';