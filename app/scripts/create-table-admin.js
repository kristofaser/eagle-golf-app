#!/usr/bin/env node

// Script pour créer la table admin_users via l'API REST
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://vrpsulmidpgxmkybgtwn.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZycHN1bG1pZHBneG1reWJndHduIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MjU4NDU3MiwiZXhwIjoyMDY4MTYwNTcyfQ.oCuTPSxWy6qellMYB4talX6qbfa3eabz556fX6J_Ruo';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createAdminTable() {
  try {
    console.log('🗂️ Création de la table admin_users...');
    
    // Vérifier si la table existe
    const { data: tables, error: tableError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_name', 'admin_users')
      .eq('table_schema', 'public');
    
    if (tableError) {
      console.error('❌ Erreur vérification table:', tableError);
    } else if (tables && tables.length > 0) {
      console.log('✅ La table admin_users existe déjà');
      return true;
    }
    
    console.log('📝 La table admin_users n\'existe pas, création nécessaire...');
    console.log('🚨 IMPORTANT: Vous devez créer la table manuellement dans Supabase SQL Editor');
    console.log('');
    console.log('🔗 Allez sur: https://supabase.com/dashboard/project/vrpsulmidpgxmkybgtwn/sql');
    console.log('');
    console.log('📋 Copiez et exécutez ce SQL:');
    console.log('');
    console.log(`-- Créer la table admin_users
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
  UNIQUE(user_id)
);

-- Index pour les performances
CREATE INDEX IF NOT EXISTS idx_admin_users_user_id ON admin_users(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_users_role ON admin_users(role);
CREATE INDEX IF NOT EXISTS idx_admin_users_active ON admin_users(is_active);

-- Activer RLS
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Fonction has_role
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

-- Fonction is_admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'super_admin');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Permissions
GRANT EXECUTE ON FUNCTION has_role(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION is_admin() TO authenticated;`);
    
    return false; // Indique que l'utilisateur doit le faire manuellement
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    return false;
  }
}

async function main() {
  console.log('🏗️ Vérification système admin Eagle...\n');
  
  const tableExists = await createAdminTable();
  if (!tableExists) {
    console.log('\n⏳ Après avoir créé la table, relancez: node scripts/create-admin-auth.js');
    return;
  }
  
  console.log('✅ Table admin_users prête !');
}

if (require.main === module) {
  main().catch(console.error);
}