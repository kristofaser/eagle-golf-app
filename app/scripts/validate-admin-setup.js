#!/usr/bin/env node

// Script pour valider la configuration admin après migration manuelle
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://vrpsulmidpgxmkybgtwn.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZycHN1bG1pZHBneG1reWJndHduIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MjU4NDU3MiwiZXhwIjoyMDY4MTYwNTcyfQ.oCuTPSxWy6qellMYB4talX6qbfa3eabz556fX6J_Ruo';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function validateAdminSystem() {
  try {
    console.log('🔍 Validation du système admin...\n');
    
    // 1. Vérifier la table admin_users
    console.log('📋 Vérification table admin_users...');
    const { data: adminUsers, error: adminError } = await supabase
      .from('admin_users')
      .select('*')
      .limit(5);
    
    if (adminError) {
      console.log('❌ Table admin_users non trouvée:', adminError.message);
      console.log('💡 Vous devez d\'abord appliquer la migration dans Supabase SQL Editor');
      return false;
    }
    
    console.log(`✅ Table admin_users existe (${adminUsers.length} admins)`);
    
    // 2. Vérifier les fonctions
    console.log('🔧 Test de la fonction has_role...');
    const { data: hasRoleResult, error: roleError } = await supabase
      .rpc('has_role', { 
        user_uuid: 'def53ea2-04db-40c8-94ef-d58c5f38a2cb', // ID créé précédemment
        role_name: 'super_admin' 
      });
    
    if (roleError) {
      console.log('❌ Fonction has_role non trouvée:', roleError.message);
      return false;
    }
    
    console.log('✅ Fonction has_role fonctionne:', hasRoleResult);
    
    // 3. Lister les admins existants
    if (adminUsers.length > 0) {
      console.log('\n👥 Admins existants:');
      adminUsers.forEach(admin => {
        console.log(`   - ${admin.role}: user_id=${admin.user_id.slice(0,8)}...`);
      });
    }
    
    // 4. Vérifier les réservations en attente
    console.log('\n📚 Vérification réservations en attente...');
    const { data: pendingBookings, error: bookingsError } = await supabase
      .from('bookings')
      .select('id, status, admin_validation_status')
      .eq('status', 'pending')
      .limit(5);
    
    if (bookingsError) {
      console.log('⚠️ Erreur lecture bookings:', bookingsError.message);
    } else {
      console.log(`📊 ${pendingBookings.length} réservations en attente de validation`);
    }
    
    return true;
    
  } catch (error) {
    console.error('❌ Erreur validation:', error.message);
    return false;
  }
}

async function main() {
  const isValid = await validateAdminSystem();
  
  if (isValid) {
    console.log('\n🎉 Système admin configuré et fonctionnel !');
    console.log('📌 Prochaines étapes:');
    console.log('   1. Connectez-vous au backoffice: http://localhost:3000');
    console.log('   2. Email: christophe@eagle.com');
    console.log('   3. Mot de passe: Admin123!@#');
    console.log('   4. Testez la validation des réservations');
  } else {
    console.log('\n⚠️ Configuration incomplète');
    console.log('📋 Appliquez d\'abord la migration SQL dans Supabase Dashboard');
  }
}

if (require.main === module) {
  main().catch(console.error);
}