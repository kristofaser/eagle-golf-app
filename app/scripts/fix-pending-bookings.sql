-- Script pour corriger les réservations bloquées en "pending" après paiement réussi
-- À exécuter dans le SQL Editor de Supabase

-- 1. Identifier les réservations payées mais non confirmées
SELECT 
  b.id,
  b.payment_intent_id,
  b.status,
  b.payment_status,
  b.admin_validation_status,
  b.created_at
FROM bookings b
WHERE b.payment_status = 'paid' 
  AND b.status = 'pending'
  AND b.created_at > NOW() - INTERVAL '7 days'; -- Limiter aux 7 derniers jours

-- 2. Corriger ces réservations
UPDATE bookings 
SET 
  status = 'confirmed',
  admin_validation_status = 'approved', -- Utiliser 'approved' au lieu de 'auto_approved'
  confirmed_at = NOW()
WHERE payment_status = 'paid' 
  AND status = 'pending'
  AND created_at > NOW() - INTERVAL '7 days'
RETURNING id, status, admin_validation_status;

-- 3. Mettre à jour la table de validation admin si elle existe
-- Note: La table a une structure minimale (booking_id, status, created_at)
UPDATE admin_booking_validations abv
SET 
  status = 'approved'
FROM bookings b
WHERE abv.booking_id = b.id
  AND b.payment_status = 'paid'
  AND b.status = 'confirmed'
  AND abv.status = 'pending';