#!/usr/bin/env node

// Script simplifié pour créer le système admin
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://vrpsulmidpgxmkybgtwn.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZycHN1bG1pZHBneG1reWJndHduIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MjU4NDU3MiwiZXhwIjoyMDY4MTYwNTcyfQ.oCuTPSxWy6qellMYB4talX6qbfa3eabz556fX6J_Ruo';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createAdminProfile() {
  try {
    console.log('👤 Création du profil admin...');
    
    // Vérifier si le profil existe déjà
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', 'christophe@eagle.com')
      .single();
    
    if (existingProfile) {
      console.log('📧 Profil admin existant trouvé');
      return existingProfile.id;
    }
    
    // Générer un UUID pour le profil
    const profileId = crypto.randomUUID();
    
    // Créer le nouveau profil admin
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: profileId,
        first_name: 'Admin',
        last_name: 'Eagle',
        email: 'christophe@eagle.com',
        user_type: 'amateur'
      })
      .select('id')
      .single();
    
    if (profileError) {
      console.error('❌ Erreur profil:', profileError);
      return null;
    }
    
    console.log('✅ Profil admin créé:', profileData);
    return profileData.id;
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    return null;
  }
}

async function createAdminUser(profileId) {
  try {
    console.log('🔑 Création admin_users...');
    
    // Vérifier si admin_users existe déjà
    const { data: existingAdmin } = await supabase
      .from('admin_users')
      .select('id')
      .eq('user_id', profileId)
      .single();
    
    if (existingAdmin) {
      console.log('🔑 Admin user existant trouvé');
      return true;
    }
    
    // Créer l'entrée admin_users
    const { data: adminData, error: adminError } = await supabase
      .from('admin_users')
      .insert({
        user_id: profileId,
        role: 'super_admin',
        permissions: ["manage_bookings", "manage_users", "manage_courses", "view_analytics"],
        is_active: true
      })
      .select()
      .single();
    
    if (adminError) {
      console.error('❌ Erreur admin_users:', adminError);
      return false;
    }
    
    console.log('✅ Admin user créé:', adminData);
    return true;
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    return false;
  }
}

async function main() {
  console.log('🏗️ Configuration du système admin Eagle...\n');
  
  // Étape 1: Créer le profil
  const profileId = await createAdminProfile();
  if (!profileId) {
    console.log('❌ Échec création profil');
    return;
  }
  
  // Étape 2: Créer l'admin user
  const adminSuccess = await createAdminUser(profileId);
  if (!adminSuccess) {
    console.log('❌ Échec création admin user');
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