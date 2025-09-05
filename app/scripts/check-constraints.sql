-- Script pour vérifier les contraintes sur la table bookings
-- À exécuter dans le SQL Editor de Supabase

-- 1. Vérifier les contraintes CHECK sur la table bookings
SELECT 
    conname AS constraint_name,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'bookings'::regclass
AND contype = 'c';

-- 2. Vérifier les colonnes et leurs types
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'bookings'
AND column_name IN ('status', 'payment_status', 'admin_validation_status')
ORDER BY ordinal_position;

-- 3. Vérifier s'il y a des réservations récentes
SELECT 
    id,
    status,
    payment_status,
    admin_validation_status,
    created_at
FROM bookings 
WHERE created_at > NOW() - INTERVAL '1 hour'
ORDER BY created_at DESC
LIMIT 5;