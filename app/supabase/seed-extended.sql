-- Seed pour les nouvelles tables Eagle
-- Ce script ajoute des données de test pour les tables manquantes

-- 1. Insérer des tarifs pour les pros existants
INSERT INTO pro_pricing (pro_id, holes, players_count, price) VALUES
-- Tarifs pour Alex Martin (pro_id à récupérer)
((SELECT user_id FROM pro_profiles LIMIT 1 OFFSET 0), 9, 1, 150.00),
((SELECT user_id FROM pro_profiles LIMIT 1 OFFSET 0), 9, 2, 130.00),
((SELECT user_id FROM pro_profiles LIMIT 1 OFFSET 0), 9, 3, 110.00),
((SELECT user_id FROM pro_profiles LIMIT 1 OFFSET 0), 18, 1, 280.00),
((SELECT user_id FROM pro_profiles LIMIT 1 OFFSET 0), 18, 2, 240.00),
((SELECT user_id FROM pro_profiles LIMIT 1 OFFSET 0), 18, 3, 200.00),

-- Tarifs pour Sarah Johnson (pro_id à récupérer)
((SELECT user_id FROM pro_profiles LIMIT 1 OFFSET 1), 9, 1, 180.00),
((SELECT user_id FROM pro_profiles LIMIT 1 OFFSET 1), 9, 2, 160.00),
((SELECT user_id FROM pro_profiles LIMIT 1 OFFSET 1), 9, 3, 140.00),
((SELECT user_id FROM pro_profiles LIMIT 1 OFFSET 1), 18, 1, 350.00),
((SELECT user_id FROM pro_profiles LIMIT 1 OFFSET 1), 18, 2, 300.00),
((SELECT user_id FROM pro_profiles LIMIT 1 OFFSET 1), 18, 3, 250.00),

-- Tarifs pour Michel Bernard (pro_id à récupérer)
((SELECT user_id FROM pro_profiles LIMIT 1 OFFSET 2), 9, 1, 120.00),
((SELECT user_id FROM pro_profiles LIMIT 1 OFFSET 2), 9, 2, 100.00),
((SELECT user_id FROM pro_profiles LIMIT 1 OFFSET 2), 9, 3, 90.00),
((SELECT user_id FROM pro_profiles LIMIT 1 OFFSET 2), 18, 1, 220.00),
((SELECT user_id FROM pro_profiles LIMIT 1 OFFSET 2), 18, 2, 180.00),
((SELECT user_id FROM pro_profiles LIMIT 1 OFFSET 2), 18, 3, 160.00)
ON CONFLICT (pro_id, holes, players_count) DO UPDATE
SET price = EXCLUDED.price;

-- 2. Ajouter des adhésions pour les pros
INSERT INTO pro_memberships (pro_id, start_date, end_date, amount, status) VALUES
((SELECT user_id FROM pro_profiles LIMIT 1 OFFSET 0), '2025-01-01', '2025-12-31', 69.00, 'active'),
((SELECT user_id FROM pro_profiles LIMIT 1 OFFSET 1), '2025-01-15', '2026-01-14', 69.00, 'active'),
((SELECT user_id FROM pro_profiles LIMIT 1 OFFSET 2), '2024-06-01', '2025-05-31', 69.00, 'expired')
ON CONFLICT DO NOTHING;

-- 3. Mettre à jour les réservations existantes avec les nouvelles colonnes
UPDATE bookings
SET 
  holes = CASE 
    WHEN estimated_duration >= 240 THEN 18
    ELSE 9
  END,
  admin_validation_status = CASE
    WHEN status = 'confirmed' THEN 'confirmed'
    WHEN status = 'cancelled' THEN 'rejected'
    ELSE 'pending'
  END,
  commission_percentage = 20.00,
  commission_amount = platform_fee
WHERE holes IS NULL;

-- 4. Ajouter des validations admin pour les réservations existantes
INSERT INTO admin_booking_validations (booking_id, status, created_at, validated_at)
SELECT 
  id,
  CASE 
    WHEN status = 'confirmed' THEN 'confirmed'
    WHEN status = 'cancelled' THEN 'rejected'
    ELSE 'pending'
  END,
  created_at,
  CASE 
    WHEN status IN ('confirmed', 'cancelled') THEN confirmed_at
    ELSE NULL
  END
FROM bookings
WHERE NOT EXISTS (
  SELECT 1 FROM admin_booking_validations WHERE booking_id = bookings.id
);

-- 5. Mettre à jour les disponibilités pour utiliser le nouveau système
UPDATE pro_availabilities
SET 
  period = CASE
    WHEN EXTRACT(HOUR FROM start_time) < 12 THEN 'morning'
    WHEN EXTRACT(HOUR FROM start_time) >= 12 AND EXTRACT(HOUR FROM start_time) < 14 THEN 'afternoon'
    ELSE 'full_day'
  END,
  is_available = true
WHERE period IS NULL;

-- 6. Ajouter des exemples de disponibilités simplifiées pour les prochains jours
INSERT INTO pro_availabilities (pro_id, golf_course_id, date, start_time, end_time, period, is_available)
SELECT 
  p.user_id,
  (SELECT id FROM golf_courses ORDER BY RANDOM() LIMIT 1),
  CURRENT_DATE + interval '1 day' * generate_series(1, 14),
  '08:00:00'::time,
  '18:00:00'::time,
  CASE 
    WHEN RANDOM() < 0.3 THEN 'morning'
    WHEN RANDOM() < 0.6 THEN 'afternoon'
    ELSE 'full_day'
  END,
  true
FROM pro_profiles p
WHERE NOT EXISTS (
  SELECT 1 FROM pro_availabilities 
  WHERE pro_id = p.user_id 
  AND date > CURRENT_DATE
)
LIMIT 30;

-- 7. Message de confirmation
DO $$
BEGIN
  RAISE NOTICE 'Seed des données étendues terminé avec succès !';
  RAISE NOTICE 'Tables mises à jour: pro_pricing, pro_memberships, bookings, admin_booking_validations, pro_availabilities';
END $$;