-- Script pour vérifier la structure de la table admin_booking_validations
-- À exécuter dans le SQL Editor de Supabase

-- 1. Afficher la structure de la table
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'admin_booking_validations'
ORDER BY ordinal_position;

-- 2. Alternative : Afficher toutes les colonnes avec un LIMIT 0
SELECT * FROM admin_booking_validations LIMIT 0;