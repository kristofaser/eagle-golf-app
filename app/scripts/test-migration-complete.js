const { createClient } = require('@supabase/supabase-js');

// Configuration
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Variables d\'environnement manquantes');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function testMigration() {
  console.log('🧪 TEST DE LA MIGRATION COMPLÈTE');
  console.log('===============================');
  
  try {
    // 1. Tester les données golf_parcours
    console.log('\n1️⃣ Test des données golf_parcours');
    const { data: parcours, error: parcoursError } = await supabase
      .from('golf_parcours')
      .select('id, name')
      .limit(5);
      
    if (parcoursError) {
      console.error('❌ Erreur golf_parcours:', parcoursError.message);
      return false;
    }
    
    console.log('✅ golf_parcours OK -', parcours.length, 'parcours trouvés');
    parcours.forEach(p => console.log('   -', p.name));
    
    // 2. Créer une disponibilité de test
    console.log('\n2️⃣ Test création disponibilité avec golf_parcours ID');
    
    // Créer un utilisateur/pro de test d'abord
    const { data: testUser, error: userError } = await supabase.auth.admin.createUser({
      email: 'test-pro@example.com',
      password: 'testpass123',
      email_confirm: true
    });
    
    if (userError && !userError.message.includes('already been registered')) {
      console.error('❌ Erreur création utilisateur:', userError.message);
      return false;
    }
    
    const userId = testUser?.user?.id || 'test-user-id';
    
    // Créer le profil pro
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: userId,
        first_name: 'Test',
        last_name: 'Pro',
        email: 'test-pro@example.com',
        user_type: 'pro'
      });
      
    if (profileError && !profileError.message.includes('duplicate key')) {
      console.error('❌ Erreur profil:', profileError.message);
    }
    
    const { error: proProfileError } = await supabase
      .from('pro_profiles')
      .upsert({
        user_id: userId,
        division: 'Professional',
        siret: 'TEST123'
      });
      
    if (proProfileError && !proProfileError.message.includes('duplicate key')) {
      console.error('❌ Erreur pro_profile:', proProfileError.message);
    }
    
    // Créer une disponibilité avec golf_course_id référençant golf_parcours
    const testAvailability = {
      pro_id: userId,
      golf_course_id: parcours[0].id, // ID venant de golf_parcours
      date: '2025-01-25',
      start_time: '09:00',
      end_time: '11:00',
      max_players: 4,
      current_bookings: 0
    };
    
    const { data: availability, error: availError } = await supabase
      .from('pro_availabilities')
      .insert(testAvailability)
      .select()
      .single();
      
    if (availError) {
      console.error('❌ Erreur création disponibilité:', availError.message);
      return false;
    }
    
    console.log('✅ Disponibilité créée avec golf_course_id:', availability.golf_course_id);
    
    // 3. Tester la jointure avec alias
    console.log('\n3️⃣ Test jointure pro_availabilities avec golf_parcours (alias golf_courses)');
    
    const { data: availWithCourse, error: joinError } = await supabase
      .from('pro_availabilities')
      .select(`
        *,
        golf_courses:golf_parcours(id, name, city)
      `)
      .eq('id', availability.id)
      .single();
      
    if (joinError) {
      console.error('❌ Erreur jointure:', joinError.message);
      return false;
    }
    
    console.log('✅ Jointure OK - Parcours:', availWithCourse.golf_courses?.name);
    
    // 4. Nettoyer les données de test
    console.log('\n4️⃣ Nettoyage des données de test');
    await supabase
      .from('pro_availabilities')
      .delete()
      .eq('id', availability.id);
      
    await supabase
      .from('pro_profiles')
      .delete()
      .eq('user_id', userId);
      
    await supabase
      .from('profiles')
      .delete()
      .eq('id', userId);
    
    console.log('✅ Nettoyage terminé');
    
    console.log('\n🎉 MIGRATION COMPLÈTE VALIDÉE !');
    return true;
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    return false;
  }
}

// Exécuter le test
testMigration().then(success => {
  console.log(success ? '\n✅ Tous les tests passent' : '\n❌ Tests échoués');
  process.exit(success ? 0 : 1);
});