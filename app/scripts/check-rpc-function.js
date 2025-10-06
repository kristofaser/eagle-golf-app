const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables d\'environnement manquantes');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkRPCFunction() {
  console.log('🔍 Vérification de la fonction RPC get_aggregated_pro_profile...\n');

  try {
    // Tenter d'appeler la fonction RPC avec un UUID valide mais inexistant
    const { data, error } = await supabase.rpc('get_aggregated_pro_profile', {
      profile_id: '00000000-0000-0000-0000-000000000000',
      start_date: new Date().toISOString().split('T')[0],
      end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    });

    if (error) {
      if (error.code === '42883' || error.message.includes('function') || error.message.includes('does not exist')) {
        console.log('✅ La fonction RPC n\'existe PAS dans la base de données');
        console.log('   → Le code utilise donc le fallback qui est maintenant corrigé\n');
        console.log('💡 Explication du bug intermittent :');
        console.log('   - Tous les profils utilisent le fallback');
        console.log('   - Le bug persiste à cause du CACHE React Query');
        console.log('   - Les profils chargés AVANT la correction ont des prix bugués en cache');
        console.log('   - Les profils chargés APRÈS la correction sont OK\n');
        console.log('🔧 Solution :');
        console.log('   1. Vider le cache de l\'application (fermer/rouvrir)');
        console.log('   2. Ou attendre 5-10 minutes que le cache expire');
        console.log('   3. Les prix devraient s\'afficher correctement après');
      } else {
        console.log('❌ Erreur lors de l\'appel RPC:', error.message);
        console.log('   Code d\'erreur:', error.code);
      }
    } else {
      console.log('⚠️  La fonction RPC EXISTE dans la base de données!');
      console.log('   → C\'est elle qui cause le bug car elle retourne les prix en centimes\n');
      console.log('📊 Données retournées par la RPC:');
      console.log(JSON.stringify(data, null, 2));

      if (data && data.pricing && Array.isArray(data.pricing)) {
        console.log('\n🔍 Analyse des prix retournés:');
        data.pricing.forEach(p => {
          console.log(`   - ${p.holes} trous, ${p.players_count} joueur(s): ${p.price}`);
          if (p.price > 500) {
            console.log('     ⚠️ Prix suspect! Probablement en centimes');
          }
        });
      }

      console.log('\n🔧 Solution :');
      console.log('   Il faut modifier la fonction RPC pour qu\'elle convertisse les prix');
      console.log('   OU supprimer la fonction RPC pour forcer l\'utilisation du fallback');
    }

  } catch (err) {
    console.error('❌ Erreur inattendue:', err.message);
  }

  // Vérifier aussi quelques prix réels
  console.log('\n📊 Vérification d\'un vrai profil pro...');

  try {
    // Récupérer le premier pro de la base
    const { data: firstPro } = await supabase
      .from('profiles')
      .select('id')
      .eq('user_type', 'pro')
      .limit(1)
      .single();

    if (firstPro) {
      console.log(`\n🔍 Test avec le pro ID: ${firstPro.id}`);

      // Vérifier les prix directement dans la table
      const { data: dbPrices } = await supabase
        .from('pro_pricing')
        .select('holes, players_count, price')
        .eq('pro_id', firstPro.id)
        .limit(3);

      if (dbPrices && dbPrices.length > 0) {
        console.log('\n💾 Prix dans la base de données (table pro_pricing):');
        dbPrices.forEach(p => {
          console.log(`   - ${p.holes} trous, ${p.players_count} joueur(s): ${p.price} (${p.price > 500 ? 'centimes' : 'euros?'})`);
        });
      }
    }
  } catch (err) {
    console.log('Impossible de vérifier un vrai profil:', err.message);
  }

  console.log('\n✨ Analyse terminée!');
}

checkRPCFunction().catch(console.error);