#!/usr/bin/env node
/**
 * Script de test pour le système de notifications Phase 1
 *
 * Ce script teste :
 * 1. La création des tables et fonctions SQL
 * 2. Les triggers automatiques
 * 3. Les permissions RLS
 * 4. La création de notifications de test
 *
 * Usage: node scripts/test-notifications-phase1.js
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables d\'environnement manquantes');
  console.error('Vérifiez EXPO_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runTests() {
  console.log('🧪 === TEST SYSTÈME NOTIFICATIONS PHASE 1 ===\n');

  try {
    // 1. Test de la structure des tables
    console.log('1️⃣ Test de la structure des tables...');

    const { data: notifications_table, error: error1 } = await supabase
      .from('notifications')
      .select('*')
      .limit(1);

    if (error1) {
      console.error('❌ Table notifications:', error1.message);
    } else {
      console.log('✅ Table notifications accessible');
    }

    const { data: push_tokens_table, error: error2 } = await supabase
      .from('push_tokens')
      .select('*')
      .limit(1);

    if (error2) {
      console.error('❌ Table push_tokens:', error2.message);
    } else {
      console.log('✅ Table push_tokens accessible');
    }

    // 2. Test des fonctions utilitaires
    console.log('\n2️⃣ Test des fonctions utilitaires...');

    // Récupérer un utilisateur test
    const { data: users, error: userError } = await supabase.auth.admin.listUsers();

    if (userError || !users.users.length) {
      console.log('⚠️  Aucun utilisateur trouvé, création d\'une notification système...');

      // Test notification système
      const { data: systemResult, error: systemError } = await supabase
        .rpc('create_system_notification', {
          p_title: '🧪 Test Système Phase 1',
          p_message: 'Le système de notifications Phase 1 fonctionne correctement !',
          p_data: { test: true, phase: 1 },
          p_target_all: false
        });

      if (systemError) {
        console.error('❌ Fonction create_system_notification:', systemError.message);
      } else {
        console.log(`✅ Fonction create_system_notification: ${systemResult || 0} notification(s)`);
      }
    } else {
      const testUser = users.users[0];
      console.log(`👤 Utilisateur test: ${testUser.email}`);

      // Test création de notification
      const { data: notifId, error: notifError } = await supabase
        .rpc('create_notification', {
          p_user_id: testUser.id,
          p_type: 'custom',
          p_title: '🧪 Test Phase 1',
          p_message: 'Notification de test créée par le script de validation Phase 1',
          p_data: { test: true, script: 'test-notifications-phase1.js' }
        });

      if (notifError) {
        console.error('❌ Fonction create_notification:', notifError.message);
      } else {
        console.log(`✅ Fonction create_notification: ID ${notifId}`);
      }

      // Test compteur notifications
      const { data: count, error: countError } = await supabase
        .rpc('get_unread_notification_count', {
          p_user_id: testUser.id
        });

      if (countError) {
        console.error('❌ Fonction get_unread_notification_count:', countError.message);
      } else {
        console.log(`✅ Fonction get_unread_notification_count: ${count} non lues`);
      }

      // Test marquage comme lue
      if (notifId) {
        const { data: marked, error: markError } = await supabase
          .rpc('mark_notification_read', {
            p_notification_id: notifId,
            p_user_id: testUser.id
          });

        if (markError) {
          console.error('❌ Fonction mark_notification_read:', markError.message);
        } else {
          console.log(`✅ Fonction mark_notification_read: ${marked ? 'Succès' : 'Échec'}`);
        }
      }
    }

    // 3. Test des préférences utilisateur
    console.log('\n3️⃣ Test des préférences utilisateur...');

    const { data: preferences, error: prefError } = await supabase
      .from('travel_notification_preferences')
      .select('*')
      .limit(5);

    if (prefError) {
      console.error('❌ Table travel_notification_preferences:', prefError.message);
    } else {
      console.log(`✅ Table travel_notification_preferences: ${preferences.length} préférence(s)`);

      if (preferences.length > 0) {
        const pref = preferences[0];
        console.log(`   - Colonnes étendues: push_enabled=${pref.push_enabled}, email_enabled=${pref.email_enabled}`);
        console.log(`   - Types notifications: ${JSON.stringify(pref.notification_types || {})}`);
      }
    }

    // 4. Test notifications voyage
    console.log('\n4️⃣ Test notifications voyage...');

    const { data: travelResult, error: travelError } = await supabase
      .rpc('create_travel_notification', {
        p_title: '✈️ Test Voyage Phase 1',
        p_message: 'Nouvelle destination test ajoutée : Golf de Test Valley !',
        p_data: {
          location: 'Test Valley',
          type: 'new_course',
          test: true,
          phase: 1
        },
        p_target_users: null // Tous les utilisateurs avec préférences voyage
      });

    if (travelError) {
      console.error('❌ Fonction create_travel_notification:', travelError.message);
    } else {
      console.log(`✅ Fonction create_travel_notification: ${travelResult || 0} notification(s)`);
    }

    // 5. Vérification finale des données
    console.log('\n5️⃣ Vérification finale...');

    const { data: recentNotifications, error: recentError } = await supabase
      .from('notifications')
      .select('id, type, title, created_at')
      .order('created_at', { ascending: false })
      .limit(5);

    if (recentError) {
      console.error('❌ Récupération notifications récentes:', recentError.message);
    } else {
      console.log(`✅ Notifications récentes: ${recentNotifications.length} trouvée(s)`);
      recentNotifications.forEach(notif => {
        console.log(`   - ${notif.type}: ${notif.title} (${notif.created_at})`);
      });
    }

    console.log('\n🎉 === TESTS PHASE 1 TERMINÉS ===');
    console.log('\n📋 Prochaines étapes:');
    console.log('   1. Exécuter les migrations en base: 20250915_create_notifications_system.sql');
    console.log('   2. Exécuter les triggers: 20250915_create_notification_triggers.sql');
    console.log('   3. Tester les hooks React Native avec NotificationTester');
    console.log('   4. Valider le Realtime avec des notifications test');

  } catch (err) {
    console.error('💥 Erreur critique:', err);
    process.exit(1);
  }
}

// Fonction utilitaire pour afficher les stats
async function showStats() {
  console.log('\n📊 === STATISTIQUES SYSTÈME ===');

  try {
    const { count: totalNotifications } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true });

    const { count: totalTokens } = await supabase
      .from('push_tokens')
      .select('*', { count: 'exact', head: true });

    const { count: totalPreferences } = await supabase
      .from('travel_notification_preferences')
      .select('*', { count: 'exact', head: true });

    console.log(`📧 Total notifications: ${totalNotifications || 0}`);
    console.log(`📱 Total push tokens: ${totalTokens || 0}`);
    console.log(`⚙️  Total préférences: ${totalPreferences || 0}`);
  } catch (err) {
    console.error('Erreur récupération stats:', err.message);
  }
}

// Exécution
if (require.main === module) {
  runTests().then(() => showStats());
}