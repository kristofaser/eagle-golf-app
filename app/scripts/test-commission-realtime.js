/**
 * Script de test pour vérifier la mise à jour en temps réel de la commission
 *
 * Usage:
 * 1. Lancer ce script: node scripts/test-commission-realtime.js
 * 2. Dans un autre terminal, modifier la commission depuis l'admin
 * 3. Observer la mise à jour en temps réel dans ce script
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Variables d\'environnement manquantes');
  console.error('Assurez-vous que EXPO_PUBLIC_SUPABASE_URL et EXPO_PUBLIC_SUPABASE_ANON_KEY sont définies');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testRealtimeCommission() {
  console.log('🚀 Test de la mise à jour en temps réel de la commission\n');

  // 1. Charger la commission actuelle
  console.log('📊 Chargement de la commission actuelle...');
  const { data: currentData, error: currentError } = await supabase
    .from('commission_settings')
    .select('percentage, effective_date')
    .lte('effective_date', new Date().toISOString())
    .order('effective_date', { ascending: false })
    .limit(1)
    .single();

  if (currentError) {
    console.error('❌ Erreur:', currentError);
    return;
  }

  console.log(`✅ Commission actuelle: ${currentData.percentage}%`);
  console.log(`📅 Date d'effet: ${currentData.effective_date}\n`);

  // 2. S'abonner aux changements en temps réel
  console.log('👂 Écoute des changements en temps réel...');
  console.log('💡 Modifiez la commission depuis l\'admin pour voir la mise à jour\n');

  const channel = supabase
    .channel('commission_test')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'commission_settings',
      },
      (payload) => {
        console.log('\n🔔 Nouvelle commission reçue en temps réel !');
        console.log(`📊 Ancien: ${currentData.percentage}% → Nouveau: ${payload.new.percentage}%`);
        console.log(`📅 Date d'effet: ${payload.new.effective_date}`);
        console.log('✅ Mise à jour automatique effectuée\n');
      }
    )
    .subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        console.log('✅ Abonnement Realtime actif\n');
      } else if (status === 'CHANNEL_ERROR') {
        console.error('❌ Erreur d\'abonnement Realtime');
      } else if (status === 'TIMED_OUT') {
        console.error('⏱️  Timeout de l\'abonnement Realtime');
      }
    });

  // Garder le script en vie
  console.log('⏳ En attente de modifications... (Ctrl+C pour arrêter)');
}

// Gestion de l'arrêt propre
process.on('SIGINT', () => {
  console.log('\n\n👋 Arrêt du test...');
  process.exit(0);
});

testRealtimeCommission();
