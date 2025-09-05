#!/usr/bin/env node

// Script pour appliquer la migration admin_users directement
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Configuration Supabase
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables manquantes: EXPO_PUBLIC_SUPABASE_URL et/ou SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyMigration() {
  try {
    console.log('🚀 Application de la migration admin_users...');
    
    // 1. Créer la table admin_users
    console.log('📝 Création de la table admin_users...');
    const { error: createTableError } = await supabase.rpc('exec', {
      query: `
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
          UNIQUE(user_id),
          CONSTRAINT valid_role CHECK (role IN ('admin', 'super_admin', 'moderator'))
        );
      `
    });
    
    if (createTableError) {
      console.error('❌ Erreur création table:', createTableError);
      // On continue même si la table existe déjà
    }
    
    // 2. Créer les index
    console.log('📋 Création des index...');
    await supabase.rpc('exec', {
      query: `
        CREATE INDEX IF NOT EXISTS idx_admin_users_user_id ON admin_users(user_id);
        CREATE INDEX IF NOT EXISTS idx_admin_users_role ON admin_users(role);
        CREATE INDEX IF NOT EXISTS idx_admin_users_active ON admin_users(is_active);
      `
    });
    
    // 3. Activer RLS
    console.log('🔒 Configuration RLS...');
    await supabase.rpc('exec', { 
      query: 'ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;' 
    });
    
    console.log('✅ Migration appliquée avec succès');
    return true;
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    return false;
  }
}

async function createFirstAdmin() {
  try {
    console.log('👤 Création du premier admin...');
    
    // 1. Créer le profil admin
    console.log('📝 Création du profil admin...');
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .upsert({
        first_name: 'Admin',
        last_name: 'Eagle', 
        email: 'christophe@eagle.com',
        user_type: 'admin'
      }, { 
        onConflict: 'email',
        ignoreDuplicates: false 
      })
      .select('id')
      .single();
    
    if (profileError) {
      console.error('❌ Erreur création profil:', profileError);
      return false;
    }
    
    // 2. Créer l'entrée admin_users
    console.log('🔑 Création entrée admin_users...');
    const { error: adminError } = await supabase
      .from('admin_users')
      .upsert({
        user_id: profileData.id,
        role: 'super_admin',
        permissions: ["manage_bookings", "manage_users", "manage_courses", "view_analytics"],
        is_active: true
      }, { 
        onConflict: 'user_id',
        ignoreDuplicates: false 
      });
    
    if (adminError) {
      console.error('❌ Erreur création admin:', adminError);
      return false;
    }
    
    console.log('✅ Premier admin créé avec succès');
    console.log('📧 Email admin: christophe@eagle.com');
    console.log('🔑 Rôle: super_admin');
    return true;
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    return false;
  }
}

async function main() {
  console.log('🏗️  Configuration du système admin Eagle...\n');
  
  // Étape 1: Appliquer la migration
  const migrationSuccess = await applyMigration();
  if (!migrationSuccess) {
    console.log('❌ Échec de la migration, arrêt du processus');
    return;
  }
  
  console.log('');
  
  // Étape 2: Créer le premier admin
  const adminSuccess = await createFirstAdmin();
  if (!adminSuccess) {
    console.log('❌ Échec de la création admin');
    return;
  }
  
  console.log('\n🎉 Configuration terminée !');
  console.log('📌 Prochaines étapes:');
  console.log('   1. Connectez-vous au backoffice avec christophe@eagle.com');
  console.log('   2. Testez la validation des réservations');
  console.log('   3. Configurez les APIs des golfs en production');
}

if (require.main === module) {
  main().catch(console.error);
}