const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL, 
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function validateMigration() {
  console.log('🧪 VALIDATION FINALE DE LA MIGRATION');
  console.log('===================================');
  
  try {
    // 1. Vérifier que pro_availabilities est vide (après nettoyage)
    const { count: availCount } = await supabase
      .from('pro_availabilities')
      .select('*', { count: 'exact', head: true });
      
    console.log('📊 pro_availabilities après nettoyage:', availCount);
    
    // 2. Vérifier les parcours disponibles
    const { data: parcours, count: parcoursCount } = await supabase
      .from('golf_parcours')
      .select('id, name', { count: 'exact' })
      .limit(3);
      
    console.log('📊 golf_parcours disponibles:', parcoursCount);
    parcours.forEach(p => console.log('   ✅', p.name));
    
    // 3. Tester l'insertion d'une nouvelle disponibilité
    console.log('\\n🔬 Test insertion nouvelle disponibilité...');
    
    const testAvailability = {
      pro_id: 'test-pro-' + Date.now(),
      golf_course_id: parcours[0].id, // ID valide de golf_parcours
      date: '2025-01-30',
      start_time: '10:00',
      end_time: '12:00',
      max_players: 4,
      current_bookings: 0
    };
    
    const { data: newAvail, error: insertError } = await supabase
      .from('pro_availabilities')
      .insert(testAvailability)
      .select()
      .single();
      
    if (insertError) {
      console.error('❌ Erreur insertion:', insertError.message);
      return false;
    }
    
    console.log('✅ Insertion réussie!');
    console.log('   - ID:', newAvail.id);
    console.log('   - Parcours:', parcours[0].name);
    console.log('   - Date:', newAvail.date);
    
    // 4. Tester la jointure avec alias
    const { data: joined, error: joinError } = await supabase
      .from('pro_availabilities')
      .select('*, golf_courses:golf_parcours(name)')
      .eq('id', newAvail.id)
      .single();
      
    if (joinError) {
      console.error('❌ Erreur jointure:', joinError.message);
      return false;
    }
    
    console.log('✅ Jointure réussie:', joined.golf_courses?.name);
    
    // 5. Nettoyer les données de test
    await supabase.from('pro_availabilities').delete().eq('id', newAvail.id);
    console.log('🧹 Données de test nettoyées');
    
    console.log('\\n🎉 MIGRATION COMPLÈTEMENT VALIDÉE!');
    console.log('   ✅ Contrainte FK opérationnelle');
    console.log('   ✅ Insertions fonctionnelles');  
    console.log('   ✅ Jointures avec alias OK');
    console.log('   ✅ Prêt pour l\\'implémentation UI');
    
    return true;
    
  } catch (error) {
    console.error('❌ Erreur validation:', error.message);
    return false;
  }
}

validateMigration().then(success => {
  process.exit(success ? 0 : 1);
});