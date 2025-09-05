-- Migration: Ajout de PostGIS à la table golf_parcours
-- Date: 2025-01-14

BEGIN;

-- 1. Vérifier que l'extension PostGIS est activée
CREATE EXTENSION IF NOT EXISTS postgis;

-- 2. Ajouter la colonne location (PostGIS POINT)
ALTER TABLE golf_parcours 
ADD COLUMN IF NOT EXISTS location GEOMETRY(POINT, 4326);

-- 3. Peupler la colonne location avec les données existantes
UPDATE golf_parcours 
SET location = ST_Point(longitude, latitude)
WHERE latitude IS NOT NULL 
  AND longitude IS NOT NULL 
  AND location IS NULL;

-- 4. Créer un index spatial pour optimiser les requêtes géographiques
CREATE INDEX IF NOT EXISTS idx_golf_parcours_location 
ON golf_parcours 
USING GIST (location);

-- 5. Créer un index spatial géographique pour les calculs de distance
CREATE INDEX IF NOT EXISTS idx_golf_parcours_location_geog 
ON golf_parcours 
USING GIST (CAST(location AS geography));

-- 6. Ajouter une contrainte pour s'assurer de la cohérence
-- (Si latitude/longitude sont renseignés, location doit l'être aussi)
ALTER TABLE golf_parcours 
ADD CONSTRAINT check_location_consistency 
CHECK (
  (latitude IS NULL AND longitude IS NULL AND location IS NULL) 
  OR 
  (latitude IS NOT NULL AND longitude IS NOT NULL AND location IS NOT NULL)
);

-- 7. Créer une fonction trigger pour maintenir la cohérence automatiquement
CREATE OR REPLACE FUNCTION sync_golf_parcours_location()
RETURNS TRIGGER AS $$
BEGIN
  -- Si latitude/longitude sont modifiés, mettre à jour location
  IF NEW.latitude IS NOT NULL AND NEW.longitude IS NOT NULL THEN
    NEW.location := ST_Point(NEW.longitude, NEW.latitude);
  ELSIF NEW.latitude IS NULL OR NEW.longitude IS NULL THEN
    NEW.location := NULL;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 8. Créer le trigger
DROP TRIGGER IF EXISTS trigger_sync_golf_parcours_location ON golf_parcours;
CREATE TRIGGER trigger_sync_golf_parcours_location
  BEFORE INSERT OR UPDATE ON golf_parcours
  FOR EACH ROW
  EXECUTE FUNCTION sync_golf_parcours_location();

-- 9. Créer des fonctions helper pour les requêtes courantes
CREATE OR REPLACE FUNCTION get_nearby_golf_parcours(
  user_lat DECIMAL,
  user_lng DECIMAL,
  radius_km INTEGER DEFAULT 50,
  limit_count INTEGER DEFAULT 20
)
RETURNS TABLE(
  id UUID,
  name TEXT,
  city TEXT,
  department TEXT,
  latitude DECIMAL,
  longitude DECIMAL,
  distance_km DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    gp.id,
    gp.name,
    gp.city,
    gp.department,
    gp.latitude,
    gp.longitude,
    ROUND(
      ST_Distance(
        CAST(gp.location AS geography), 
        CAST(ST_Point(user_lng, user_lat) AS geography)
      ) / 1000, 2
    ) AS distance_km
  FROM golf_parcours gp
  WHERE gp.location IS NOT NULL
    AND ST_DWithin(
      CAST(gp.location AS geography), 
      CAST(ST_Point(user_lng, user_lat) AS geography), 
      radius_km * 1000
    )
  ORDER BY CAST(gp.location AS geography) <-> CAST(ST_Point(user_lng, user_lat) AS geography)
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- 10. Fonction pour calculer les clusters par département
CREATE OR REPLACE FUNCTION get_golf_parcours_department_stats()
RETURNS TABLE(
  department TEXT,
  course_count BIGINT,
  center_lat DECIMAL,
  center_lng DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    gp.department,
    COUNT(*) as course_count,
    ROUND(CAST(ST_Y(ST_Centroid(ST_Collect(gp.location))) AS DECIMAL), 6) as center_lat,
    ROUND(CAST(ST_X(ST_Centroid(ST_Collect(gp.location))) AS DECIMAL), 6) as center_lng
  FROM golf_parcours gp
  WHERE gp.location IS NOT NULL
    AND gp.department IS NOT NULL
  GROUP BY gp.department
  HAVING COUNT(*) > 0
  ORDER BY course_count DESC;
END;
$$ LANGUAGE plpgsql;

COMMIT;

-- Vérifications post-migration
DO $$
DECLARE
  total_parcours INTEGER;
  parcours_with_location INTEGER;
  parcours_with_coordinates INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_parcours FROM golf_parcours;
  SELECT COUNT(*) INTO parcours_with_location FROM golf_parcours WHERE location IS NOT NULL;
  SELECT COUNT(*) INTO parcours_with_coordinates FROM golf_parcours WHERE latitude IS NOT NULL AND longitude IS NOT NULL;
  
  RAISE NOTICE 'Migration PostGIS terminée:';
  RAISE NOTICE '- Total parcours: %', total_parcours;
  RAISE NOTICE '- Parcours avec coordonnées lat/lng: %', parcours_with_coordinates;
  RAISE NOTICE '- Parcours avec location PostGIS: %', parcours_with_location;
  
  IF parcours_with_location != parcours_with_coordinates THEN
    RAISE WARNING 'Incohérence détectée entre les coordonnées lat/lng et PostGIS!';
  ELSE
    RAISE NOTICE '✅ Migration réussie - Cohérence validée';
  END IF;
END;
$$;