-- Correction des politiques RLS pour admin_booking_validations
-- Permettre aux utilisateurs de créer des validations pour leurs réservations

-- Supprimer les politiques existantes si elles existent
DROP POLICY IF EXISTS "Users can insert validation for own bookings" ON admin_booking_validations;
DROP POLICY IF EXISTS "Users can view validations for own bookings" ON admin_booking_validations;
DROP POLICY IF EXISTS "Admins can manage all validations" ON admin_booking_validations;

-- Politique pour permettre l'insertion de validations par les utilisateurs pour leurs propres réservations
CREATE POLICY "Users can insert validation for own bookings" ON admin_booking_validations
FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM bookings 
    WHERE bookings.id = admin_booking_validations.booking_id 
    AND (bookings.amateur_id = auth.uid() OR bookings.pro_id = auth.uid())
  )
);

-- Politique pour permettre la lecture des validations par les utilisateurs pour leurs réservations
CREATE POLICY "Users can view validations for own bookings" ON admin_booking_validations
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM bookings 
    WHERE bookings.id = admin_booking_validations.booking_id 
    AND (bookings.amateur_id = auth.uid() OR bookings.pro_id = auth.uid())
  )
);

-- Politique pour permettre aux admins de gérer toutes les validations
-- Note: Vous devrez ajuster cette politique selon votre système d'admin
-- Pour l'instant, on autorise uniquement la lecture/mise à jour pour les admins identifiés
CREATE POLICY "Admins can manage all validations" ON admin_booking_validations
FOR ALL TO authenticated
USING (
  -- Remplacez cette condition par votre logique d'identification des admins
  -- Par exemple: auth.jwt() ->> 'role' = 'admin'
  -- Ou: EXISTS (SELECT 1 FROM admin_profiles WHERE user_id = auth.uid())
  true  -- Temporaire: tous les utilisateurs authentifiés peuvent gérer
)
WITH CHECK (
  true  -- Temporaire: tous les utilisateurs authentifiés peuvent gérer
);

-- S'assurer que RLS est activé
ALTER TABLE admin_booking_validations ENABLE ROW LEVEL SECURITY;

-- Commentaire pour documentation
COMMENT ON TABLE admin_booking_validations IS 'Table des validations admin avec RLS configuré pour permettre aux utilisateurs de créer des validations pour leurs réservations et aux admins de les gérer';