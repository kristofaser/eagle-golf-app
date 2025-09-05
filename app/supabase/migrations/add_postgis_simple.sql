-- Migration PostGIS simplifiée pour golf_parcours
-- Version compatible avec toutes les versions de PostgreSQL/PostGIS

-- 1. Activer PostGIS
CREATE EXTENSION IF NOT EXISTS postgis;

-- 2. Ajouter la colonne location
ALTER TABLE golf_parcours 
ADD COLUMN IF NOT EXISTS location GEOMETRY(POINT, 4326);

-- 3. Peupler avec les données existantes
UPDATE golf_parcours 
SET location = ST_Point(longitude, latitude)
WHERE latitude IS NOT NULL 
  AND longitude IS NOT NULL 
  AND location IS NULL;

-- 4. Créer l'index spatial de base
CREATE INDEX IF NOT EXISTS idx_golf_parcours_location 
ON golf_parcours 
USING GIST (location);

-- 5. Fonction simple pour recherche par proximité
CREATE OR REPLACE FUNCTION get_nearby_golf_parcours_simple(
  user_lat DECIMAL,
  user_lng DECIMAL,
  radius_km INTEGER DEFAULT 50
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
      ST_Distance_Sphere(gp.location, ST_Point(user_lng, user_lat)) / 1000, 2
    ) AS distance_km
  FROM golf_parcours gp
  WHERE gp.location IS NOT NULL
    AND ST_Distance_Sphere(gp.location, ST_Point(user_lng, user_lat)) <= (radius_km * 1000)
  ORDER BY ST_Distance_Sphere(gp.location, ST_Point(user_lng, user_lat))
  LIMIT 20;
END;
$$ LANGUAGE plpgsql;

-- 6. Vérification finale
DO $$
DECLARE
  total_parcours INTEGER;
  parcours_with_location INTEGER;
  parcours_with_coordinates INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_parcours FROM golf_parcours;
  SELECT COUNT(*) INTO parcours_with_location FROM golf_parcours WHERE location IS NOT NULL;
  SELECT COUNT(*) INTO parcours_with_coordinates FROM golf_parcours WHERE latitude IS NOT NULL AND longitude IS NOT NULL;
  
  RAISE NOTICE 'Migration PostGIS simplifiée terminée:';
  RAISE NOTICE '- Total parcours: %', total_parcours;
  RAISE NOTICE '- Parcours avec coordonnées lat/lng: %', parcours_with_coordinates;
  RAISE NOTICE '- Parcours avec location PostGIS: %', parcours_with_location;
  
  IF parcours_with_location = parcours_with_coordinates AND parcours_with_location > 0 THEN
    RAISE NOTICE '✅ Migration réussie - Cohérence validée';
  ELSE
    RAISE WARNING 'Attention: Incohérence détectée';
  END IF;
END;
$$;