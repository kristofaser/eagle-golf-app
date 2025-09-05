-- Migration pour corriger les relations FK vers golf_parcours au lieu de golf_courses
-- Créé le 2025-09-03 pour résoudre les erreurs PGRST200

-- Étape 1: Supprimer les anciennes contraintes FK qui pointent vers golf_courses

-- Supprimer la FK de bookings vers golf_courses
ALTER TABLE public.bookings
DROP CONSTRAINT IF EXISTS bookings_golf_course_id_fkey;

-- Supprimer la FK de pro_availabilities vers golf_courses  
ALTER TABLE public.pro_availabilities
DROP CONSTRAINT IF EXISTS pro_availabilities_golf_course_id_fkey;

-- Étape 2: Créer les nouvelles contraintes FK qui pointent vers golf_parcours

-- Ajouter la FK de bookings vers golf_parcours
ALTER TABLE public.bookings
ADD CONSTRAINT bookings_golf_course_id_fkey
FOREIGN KEY (golf_course_id)
REFERENCES public.golf_parcours(id)
ON DELETE CASCADE;

-- Ajouter la FK de pro_availabilities vers golf_parcours
ALTER TABLE public.pro_availabilities
ADD CONSTRAINT pro_availabilities_golf_course_id_fkey
FOREIGN KEY (golf_course_id)
REFERENCES public.golf_parcours(id)
ON DELETE CASCADE;

-- Étape 3: Vérifier que les relations sont correctes
-- (Ces SELECT ne modifient rien, juste pour vérification)

SELECT 
  'bookings' as table_name,
  constraint_name,
  column_name,
  referenced_table_name,
  referenced_column_name
FROM information_schema.key_column_usage
WHERE constraint_name LIKE '%bookings_golf_course_id_fkey%';

SELECT 
  'pro_availabilities' as table_name,
  constraint_name,
  column_name,
  referenced_table_name,
  referenced_column_name
FROM information_schema.key_column_usage
WHERE constraint_name LIKE '%pro_availabilities_golf_course_id_fkey%';

-- Étape 4: Tester les jointures qui échouaient avant

-- Test jointure bookings avec golf_parcours
SELECT 
  b.id as booking_id,
  gp.name as golf_name
FROM public.bookings b
JOIN public.golf_parcours gp ON b.golf_course_id = gp.id
LIMIT 1;

-- Test jointure pro_availabilities avec golf_parcours  
SELECT 
  pa.id as availability_id,
  gp.name as golf_name
FROM public.pro_availabilities pa
JOIN public.golf_parcours gp ON pa.golf_course_id = gp.id
LIMIT 5;

COMMENT ON TABLE public.bookings IS 'Table des réservations - FK corrigée vers golf_parcours';
COMMENT ON TABLE public.pro_availabilities IS 'Table des disponibilités pro - FK corrigée vers golf_parcours';