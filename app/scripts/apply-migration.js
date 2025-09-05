const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

// Configuration Supabase
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Variables d\'environnement manquantes');
  console.log('EXPO_PUBLIC_SUPABASE_URL:', !!supabaseUrl);
  console.log('SUPABASE_SERVICE_ROLE_KEY:', !!serviceRoleKey);
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function applyMigration() {
  console.log('🚀 APPLICATION DE LA MIGRATION');
  console.log('==============================');
  
  try {
    // 1. Insérer quelques données golf_parcours pour tester
    console.log('📝 Insertion de données de test golf_parcours...');
    const testData = [
      {
        name: 'Le Golf National',
        city: 'Guyancourt',
        postal_code: '78114',
        department: '78',
        phone: '01 30 43 36 00',
        email: 'accueil@golf-national.com',
        website: 'www.legolfnational.com',
        latitude: 48.7667,
        longitude: 2.0833,
        holes_count: 36,
        description: '36 trous (Albatros, Aigle, Oiselet)'
      },
      {
        name: 'Golf de Saint-Nom-la-Bretèche',
        city: 'Saint-Nom-la-Bretèche',
        postal_code: '78860',
        department: '78',
        phone: '01 30 80 04 40',
        email: 'direction@golfsaintnom.com',
        website: 'www.golfdesaintnomlabreteche.com',
        latitude: 48.8833,
        longitude: 2.1333,
        holes_count: 36,
        description: '36 trous (Parcours Rouge et Bleu)'
      },
      {
        name: 'Monte-Carlo Golf Club',
        city: 'La Turbie',
        postal_code: '06320',
        department: '06',
        phone: '04 92 41 50 70',
        website: 'golfdemontecarlo.com',
        latitude: 43.7667,
        longitude: 7.4167,
        holes_count: 18,
        description: '18 trous'
      }
    ];

    const { data: insertData, error: insertError } = await supabase
      .from('golf_parcours')
      .insert(testData)
      .select();

    if (insertError) {
      console.error('❌ Erreur insertion:', insertError.message);
      return false;
    }

    console.log('✅ Données insérées:', insertData.length, 'parcours');
    
    // 2. Vérifier que les données sont bien là
    const { count } = await supabase
      .from('golf_parcours')
      .select('*', { count: 'exact', head: true });
      
    console.log('📊 Total golf_parcours:', count);
    
    return true;

  } catch (error) {
    console.error('❌ Erreur:', error.message);
    return false;
  }
}

// Exécuter
applyMigration().then(success => {
  console.log(success ? '🏁 Migration réussie' : '💥 Migration échouée');
  process.exit(success ? 0 : 1);
});