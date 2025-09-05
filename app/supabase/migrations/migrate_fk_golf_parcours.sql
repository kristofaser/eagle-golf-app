-- Migration: Rediriger pro_availabilities vers golf_parcours
-- Date: 2025-01-20
-- Objectif: Modifier la contrainte FK pour pointer vers golf_parcours au lieu de golf_courses

-- 1. Supprimer la contrainte FK actuelle
ALTER TABLE pro_availabilities 
DROP CONSTRAINT IF EXISTS pro_availabilities_golf_course_id_fkey;

-- 2. Créer la nouvelle contrainte vers golf_parcours
ALTER TABLE pro_availabilities 
ADD CONSTRAINT pro_availabilities_golf_course_id_fkey 
FOREIGN KEY (golf_course_id) REFERENCES golf_parcours(id)
ON DELETE CASCADE;

-- 3. Créer un index pour améliorer les performances des jointures
CREATE INDEX IF NOT EXISTS idx_pro_availabilities_golf_course_id 
ON pro_availabilities(golf_course_id);

-- 4. Créer une vue pour maintenir la compatibilité avec l'ancien nom
CREATE OR REPLACE VIEW pro_availabilities_with_courses AS
SELECT 
    pa.*,
    row_to_json(gp.*) as golf_courses
FROM pro_availabilities pa
LEFT JOIN golf_parcours gp ON pa.golf_course_id = gp.id;

-- 5. Créer des fonctions RPC de compatibilité si nécessaire
-- (Ces fonctions seront ajoutées selon les besoins identifiés)

-- Commentaire de migration
COMMENT ON CONSTRAINT pro_availabilities_golf_course_id_fkey ON pro_availabilities 
IS 'FK vers golf_parcours - migré le 2025-01-20 pour utiliser les données réelles des parcours';