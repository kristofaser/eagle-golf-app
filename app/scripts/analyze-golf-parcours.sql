-- Script pour analyser la structure de la table golf_parcours
-- À exécuter dans le SQL Editor de Supabase

-- 1. Structure complète de la table
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default,
  udt_name
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'golf_parcours'
ORDER BY ordinal_position;

-- 2. Vérifier les triggers existants sur golf_parcours
SELECT
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement,
  action_timing
FROM information_schema.triggers
WHERE event_object_table = 'golf_parcours';

-- 3. Vérifier les fonctions liées à golf_parcours
SELECT
  routine_name,
  routine_type,
  routine_definition
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name ILIKE '%golf%';

-- 4. Compter les parcours avec/sans coordonnées
SELECT
  COUNT(*) as total_parcours,
  COUNT(latitude) as avec_latitude,
  COUNT(longitude) as avec_longitude,
  COUNT(location) as avec_location,
  COUNT(CASE WHEN latitude IS NOT NULL AND longitude IS NOT NULL THEN 1 END) as avec_lat_lng,
  COUNT(CASE WHEN location IS NOT NULL THEN 1 END) as avec_location_postgis
FROM golf_parcours;

-- 5. Exemples de parcours avec leurs coordonnées
SELECT
  id,
  name,
  city,
  latitude,
  longitude,
  location,
  ST_AsText(location) as location_text,
  ST_X(location) as location_lng,
  ST_Y(location) as location_lat
FROM golf_parcours
WHERE latitude IS NOT NULL AND longitude IS NOT NULL
LIMIT 5;

-- 6. Vérifier s'il y a des incohérences entre lat/lng et location
SELECT
  id,
  name,
  latitude,
  longitude,
  location,
  CASE
    WHEN latitude IS NOT NULL AND longitude IS NOT NULL AND location IS NULL
      THEN 'INCOHERENT: lat/lng mais pas location'
    WHEN latitude IS NULL AND longitude IS NULL AND location IS NOT NULL
      THEN 'INCOHERENT: location mais pas lat/lng'
    WHEN latitude IS NOT NULL AND longitude IS NOT NULL AND location IS NOT NULL
      AND (ABS(ST_X(location) - longitude) > 0.0001 OR ABS(ST_Y(location) - latitude) > 0.0001)
      THEN 'INCOHERENT: lat/lng different de location'
    ELSE 'COHERENT'
  END as coherence_status
FROM golf_parcours
WHERE latitude IS NOT NULL OR longitude IS NOT NULL OR location IS NOT NULL
LIMIT 10;
