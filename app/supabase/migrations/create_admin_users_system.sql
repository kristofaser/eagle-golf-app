-- Migration pour créer le système d'authentification admin sécurisé
-- Option 2: Table admin_users séparée pour plus de sécurité

-- 1. Créer la table admin_users
CREATE TABLE IF NOT EXISTS admin_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'admin' CHECK (role IN ('admin', 'super_admin', 'moderator')),
  permissions JSONB DEFAULT '[]'::jsonb,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by UUID REFERENCES admin_users(id),
  last_login TIMESTAMP,
  
  -- Contraintes
  UNIQUE(user_id), -- Un profile ne peut être admin qu'une seule fois
  CONSTRAINT valid_role CHECK (role IN ('admin', 'super_admin', 'moderator'))
);

-- 2. Index pour les performances
CREATE INDEX IF NOT EXISTS idx_admin_users_user_id ON admin_users(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_users_role ON admin_users(role);
CREATE INDEX IF NOT EXISTS idx_admin_users_active ON admin_users(is_active);

-- 3. RLS pour la table admin_users
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Seuls les super_admins peuvent voir tous les admins
CREATE POLICY "Super admins can view all admin users" ON admin_users
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM admin_users 
    WHERE user_id = auth.uid() 
    AND role = 'super_admin' 
    AND is_active = true
  )
);

-- Les admins peuvent voir leur propre entrée
CREATE POLICY "Admins can view their own entry" ON admin_users
FOR SELECT TO authenticated
USING (user_id = auth.uid());

-- Seuls les super_admins peuvent modifier les admins
CREATE POLICY "Super admins can manage admin users" ON admin_users
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM admin_users 
    WHERE user_id = auth.uid() 
    AND role = 'super_admin' 
    AND is_active = true
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM admin_users 
    WHERE user_id = auth.uid() 
    AND role = 'super_admin' 
    AND is_active = true
  )
);

-- 4. Fonction pour vérifier si un utilisateur a un rôle admin
CREATE OR REPLACE FUNCTION has_role(user_uuid UUID, role_name TEXT DEFAULT 'admin')
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM admin_users 
    WHERE user_id = user_uuid 
    AND role = role_name 
    AND is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Fonction pour vérifier si l'utilisateur actuel est admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'super_admin');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Fonction pour obtenir le rôle admin d'un utilisateur
CREATE OR REPLACE FUNCTION get_admin_role(user_uuid UUID DEFAULT auth.uid())
RETURNS TEXT AS $$
DECLARE
  admin_role TEXT;
BEGIN
  SELECT role INTO admin_role
  FROM admin_users 
  WHERE user_id = user_uuid 
  AND is_active = true;
  
  RETURN admin_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Fonction pour obtenir les infos admin complètes
CREATE OR REPLACE FUNCTION get_admin_info(user_uuid UUID DEFAULT auth.uid())
RETURNS TABLE (
  admin_id UUID,
  role TEXT,
  permissions JSONB,
  first_name TEXT,
  last_name TEXT,
  email TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    au.id as admin_id,
    au.role,
    au.permissions,
    p.first_name,
    p.last_name,
    p.email
  FROM admin_users au
  JOIN profiles p ON au.user_id = p.id
  WHERE au.user_id = user_uuid 
  AND au.is_active = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Trigger pour updated_at
CREATE OR REPLACE FUNCTION update_admin_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_admin_users_updated_at ON admin_users;
CREATE TRIGGER update_admin_users_updated_at
  BEFORE UPDATE ON admin_users
  FOR EACH ROW
  EXECUTE FUNCTION update_admin_updated_at();

-- 9. Mettre à jour les politiques RLS de admin_booking_validations
-- pour utiliser la nouvelle table admin_users
DROP POLICY IF EXISTS "Admins can manage all validations" ON admin_booking_validations;

CREATE POLICY "Admins can manage all validations" ON admin_booking_validations
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM admin_users 
    WHERE user_id = auth.uid() 
    AND is_active = true
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM admin_users 
    WHERE user_id = auth.uid() 
    AND is_active = true
  )
);

-- 10. Commentaires pour documentation
COMMENT ON TABLE admin_users IS 'Table des utilisateurs administrateurs avec rôles et permissions. Sépare les admins des utilisateurs normaux pour plus de sécurité.';
COMMENT ON FUNCTION has_role(UUID, TEXT) IS 'Vérifie si un utilisateur a un rôle admin spécifique';
COMMENT ON FUNCTION is_admin() IS 'Vérifie si l utilisateur actuel est un admin';
COMMENT ON FUNCTION get_admin_info(UUID) IS 'Retourne les informations complètes d un admin';

-- 11. Permissions pour les fonctions (permettre aux utilisateurs authentifiés de les appeler)
GRANT EXECUTE ON FUNCTION has_role(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION get_admin_role(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_admin_info(UUID) TO authenticated;