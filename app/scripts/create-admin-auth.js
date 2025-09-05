#!/usr/bin/env node

// Script pour créer un utilisateur admin via Supabase Auth Admin API
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://vrpsulmidpgxmkybgtwn.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZycHN1bG1pZHBneG1reWJndHduIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MjU4NDU3MiwiZXhwIjoyMDY4MTYwNTcyfQ.oCuTPSxWy6qellMYB4talX6qbfa3eabz556fX6J_Ruo';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function getAdminUser() {
  try {
    console.log('🔐 Récupération utilisateur admin existant...');
    
    const email = 'christophe@eagle.com';
    
    // Récupérer l'utilisateur existant via admin API
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
    
    if (listError) {
      console.error('❌ Erreur liste users:', listError);
      return null;
    }
    
    const adminUser = users.find(user => user.email === email);
    
    if (!adminUser) {
      console.error('❌ Utilisateur admin non trouvé');
      return null;
    }
    
    console.log('✅ Utilisateur admin trouvé:', {
      id: adminUser.id,
      email: adminUser.email
    });
    
    return adminUser;
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    return null;
  }
}

async function ensureAdminProfile(userId) {
  try {
    console.log('👤 Vérification profil admin...');
    
    // Vérifier si le profil existe
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .single();
    
    if (existingProfile) {
      console.log('✅ Profil admin existant confirmé');
      return true;
    }
    
    // Le profil n'existe pas, le créer
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: userId,
        first_name: 'Admin',
        last_name: 'Eagle',
        email: 'christophe@eagle.com',
        user_type: 'amateur'
      })
      .select('id')
      .single();
    
    if (profileError) {
      console.error('❌ Erreur profil:', profileError);
      return false;
    }
    
    console.log('✅ Profil admin créé:', profileData);
    return true;
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    return false;
  }
}

async function createAdminEntry(userId) {
  try {
    console.log('🔑 Création admin_users...');
    
    // Créer l'entrée admin_users
    const { data: adminData, error: adminError } = await supabase
      .from('admin_users')
      .insert({
        user_id: userId,
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
  console.log('🏗️ Configuration complète admin Eagle...\n');
  
  // Étape 1: Récupérer l'utilisateur auth existant
  const authUser = await getAdminUser();
  if (!authUser) {
    console.log('❌ Échec création auth user');
    return;
  }
  
  console.log('');
  
  // Étape 2: Vérifier le profil
  const profileSuccess = await ensureAdminProfile(authUser.id);
  if (!profileSuccess) {
    console.log('❌ Échec création profil');
    return;
  }
  
  console.log('');
  
  // Étape 3: Créer l'admin user
  const adminSuccess = await createAdminEntry(authUser.id);
  if (!adminSuccess) {
    console.log('❌ Échec création admin user');
    return;
  }
  
  console.log('\n🎉 Configuration terminée !');
  console.log('📧 Email: christophe@eagle.com');
  console.log('🔑 Mot de passe: Admin123!@#');
  console.log('👑 Rôle: super_admin');
  console.log('\n📌 Prochaines étapes:');
  console.log('   1. Connectez-vous au backoffice avec ces credentials');
  console.log('   2. Changez le mot de passe lors de la première connexion');
  console.log('   3. Testez la validation des réservations');
}

if (require.main === module) {
  main().catch(console.error);
}