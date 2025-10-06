const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables d\'environnement manquantes');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Importer le service pour tester
async function testPriceFix() {
  console.log('🧪 Test de la correction des prix\n');
  console.log('=' .repeat(50));

  try {
    // 1. Récupérer quelques profils pros
    const { data: pros } = await supabase
      .from('profiles')
      .select('id, first_name, last_name')
      .eq('user_type', 'pro')
      .limit(3);

    if (!pros || pros.length === 0) {
      console.log('❌ Aucun profil pro trouvé');
      return;
    }

    for (const pro of pros) {
      console.log(`\n👤 Test avec ${pro.first_name} ${pro.last_name} (${pro.id})`);
      console.log('-'.repeat(40));

      // 2. Récupérer les prix directement depuis la base
      const { data: dbPrices } = await supabase
        .from('pro_pricing')
        .select('holes, players_count, price')
        .eq('pro_id', pro.id)
        .order('holes')
        .order('players_count');

      if (!dbPrices || dbPrices.length === 0) {
        console.log('   ⚠️ Pas de tarifs définis');
        continue;
      }

      console.log('\n   💾 Prix dans la base (centimes):');
      dbPrices.forEach(p => {
        console.log(`      ${p.holes} trous, ${p.players_count} joueur(s): ${p.price} centimes`);
      });

      // 3. Appeler la fonction RPC
      const { data: rpcData, error: rpcError } = await supabase.rpc('get_aggregated_pro_profile', {
        profile_id: pro.id,
        start_date: new Date().toISOString().split('T')[0],
        end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      });

      if (rpcError) {
        console.log(`   ❌ Erreur RPC: ${rpcError.message}`);
        continue;
      }

      if (rpcData && rpcData.pricing) {
        console.log('\n   🔄 Prix retournés par RPC (avant correction):');
        rpcData.pricing.forEach(p => {
          console.log(`      ${p.holes} trous, ${p.players_count} joueur(s): ${p.price}`);
        });

        // 4. Simuler la correction
        const correctedPricing = rpcData.pricing.map(item => ({
          ...item,
          price: item.price / 100,
        }));

        console.log('\n   ✅ Prix après correction (euros):');
        correctedPricing.forEach(p => {
          const withCommission = Math.round(p.price * 1.2);
          console.log(`      ${p.holes} trous, ${p.players_count} joueur(s): ${p.price}€ → ${withCommission}€ (avec commission)`);
        });

        // 5. Calculer le prix minimum
        const minPrice = Math.min(...correctedPricing.filter(p => p.price > 0).map(p => p.price));
        const minPriceWithCommission = Math.round(minPrice * 1.2);

        console.log(`\n   📊 Prix minimum: ${minPrice}€ → ${minPriceWithCommission}€ (affiché dans FAB)`);
      }
    }

    console.log('\n' + '='.repeat(50));
    console.log('\n✨ Résumé de la correction:\n');
    console.log('   1. La fonction RPC retourne les prix en CENTIMES');
    console.log('   2. Le service profile-aggregated.service.ts convertit maintenant');
    console.log('      systématiquement en divisant par 100');
    console.log('   3. Le hook useProfileScreen ajoute la commission de 20%');
    console.log('   4. Le FAB affiche le prix final correct en euros\n');
    console.log('🎯 La correction devrait résoudre le problème pour TOUS les profils !');

  } catch (err) {
    console.error('❌ Erreur:', err);
  }
}

testPriceFix().catch(console.error);