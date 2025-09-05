-- Script pour créer le premier utilisateur admin
-- À exécuter dans le SQL Editor de Supabase après avoir appliqué la migration

-- 1. Créer un profil utilisateur pour l'admin
INSERT INTO profiles (id, first_name, last_name, email, user_type) 
VALUES (
  gen_random_uuid(),
  'Admin',
  'Eagle',
  'admin@eagle.com', -- Remplacez par votre email
  'admin' -- Nouveau type d'utilisateur
) 
ON CONFLICT (email) DO UPDATE SET
  user_type = 'admin',
  first_name = EXCLUDED.first_name,
  last_name = EXCLUDED.last_name
RETURNING id;

-- 2. Créer l'entrée admin_users (récupérer l'id du profil créé ci-dessus)
INSERT INTO admin_users (user_id, role, permissions, is_active)
SELECT 
  p.id,
  'super_admin', -- Premier admin = super_admin
  '["manage_bookings", "manage_users", "manage_courses", "view_analytics"]'::jsonb,
  true
FROM profiles p 
WHERE p.email = 'admin@eagle.com'; -- Remplacez par votre email

-- 3. Vérification - afficher les admins créés
SELECT 
  au.id as admin_id,
  au.role,
  au.permissions,
  p.first_name,
  p.last_name,
  p.email,
  au.is_active
FROM admin_users au
JOIN profiles p ON au.user_id = p.id;

-- 4. Test des fonctions
SELECT 
  'Test has_role:' as test_name,
  has_role((SELECT user_id FROM admin_users LIMIT 1), 'super_admin') as result;

SELECT 
  'Test is_admin pour le premier admin:' as test_name,
  is_admin() as result; -- Cette fonction utilise auth.uid(), donc testera l'utilisateur connecté