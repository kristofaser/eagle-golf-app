#!/usr/bin/env node

/**
 * Script de débogage pour comprendre l'erreur OTP
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

// Configuration Supabase depuis les variables d'environnement
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Variables d\'environnement manquantes dans .env.local');
  console.log('Vérifiez que EXPO_PUBLIC_SUPABASE_URL et EXPO_PUBLIC_SUPABASE_ANON_KEY sont définis');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function debugAuth(email) {
  console.log('🔍 Débogage de l\'authentification Supabase');
  console.log('=' .repeat(50));
  console.log('📧 Email de test:', email);
  console.log('🔗 URL Supabase:', SUPABASE_URL);
  console.log('');

  // Test 1: Vérifier si l'utilisateur existe
  console.log('📋 Test 1: Vérifier si l\'utilisateur existe déjà...');
  try {
    const { data: userData, error: userError } = await supabase.auth.signInWithPassword({
      email: email,
      password: 'dummy-password-to-check'
    });
    
    if (userError) {
      if (userError.message.includes('Invalid login credentials')) {
        console.log('✅ L\'utilisateur existe (mauvais mot de passe)');
      } else if (userError.message.includes('Email not confirmed')) {
        console.log('⚠️ L\'utilisateur existe mais l\'email n\'est pas confirmé');
      } else {
        console.log('❌ L\'utilisateur n\'existe probablement pas');
        console.log('   Message:', userError.message);
      }
    }
  } catch (e) {
    console.log('❌ Erreur lors du test:', e.message);
  }

  console.log('');

  // Test 2: Essayer signInWithOtp avec shouldCreateUser: false
  console.log('📋 Test 2: signInWithOtp avec shouldCreateUser: false...');
  try {
    const { data, error } = await supabase.auth.signInWithOtp({
      email: email,
      options: {
        shouldCreateUser: false
      }
    });

    if (error) {
      console.log('❌ Erreur:', error.message);
      console.log('   Code:', error.code);
      console.log('   Status:', error.status);
      if (error.code === 'otp_disabled') {
        console.log('   ⚠️ Les OTP semblent désactivés pour ce mode');
      }
    } else {
      console.log('✅ Succès! OTP envoyé');
      if (data) {
        console.log('   Data:', JSON.stringify(data, null, 2));
      }
    }
  } catch (e) {
    console.log('❌ Exception:', e.message);
  }

  console.log('');

  // Test 3: Essayer signInWithOtp avec shouldCreateUser: true
  console.log('📋 Test 3: signInWithOtp avec shouldCreateUser: true...');
  try {
    const { data, error } = await supabase.auth.signInWithOtp({
      email: email,
      options: {
        shouldCreateUser: true,
        data: {
          first_name: 'Test',
          last_name: 'Debug'
        }
      }
    });

    if (error) {
      console.log('❌ Erreur:', error.message);
      console.log('   Code:', error.code);
      console.log('   Status:', error.status);
      if (error.code === 'otp_disabled') {
        console.log('   ⚠️ Les OTP avec création d\'utilisateur semblent désactivés');
      }
    } else {
      console.log('✅ Succès! OTP envoyé (avec création utilisateur)');
      if (data) {
        console.log('   Data:', JSON.stringify(data, null, 2));
      }
    }
  } catch (e) {
    console.log('❌ Exception:', e.message);
  }

  console.log('');

  // Test 4: Essayer signUp classique
  console.log('📋 Test 4: signUp classique avec mot de passe...');
  try {
    const randomSuffix = Math.random().toString(36).substring(7);
    const testEmail = `test-${randomSuffix}@example.com`;
    const { data, error } = await supabase.auth.signUp({
      email: testEmail,
      password: 'TestPassword123!',
      options: {
        data: {
          first_name: 'Test',
          last_name: 'Classic'
        }
      }
    });

    if (error) {
      console.log('❌ Erreur:', error.message);
      console.log('   Code:', error.code);
    } else {
      console.log('✅ Succès! Inscription classique fonctionne');
      if (data?.user) {
        console.log('   User ID:', data.user.id);
        console.log('   Email confirmé:', data.user.email_confirmed_at ? 'Oui' : 'Non');
        
        // Nettoyer - supprimer l'utilisateur test
        if (data.session) {
          await supabase.auth.admin.deleteUser(data.user.id);
        }
      }
    }
  } catch (e) {
    console.log('❌ Exception:', e.message);
  }

  console.log('');

  // Test 5: Essayer Magic Link
  console.log('📋 Test 5: Magic Link (signInWithOtp sans options)...');
  try {
    const { data, error } = await supabase.auth.signInWithOtp({
      email: email
    });

    if (error) {
      console.log('❌ Erreur:', error.message);
      console.log('   Code:', error.code);
      console.log('   Status:', error.status);
    } else {
      console.log('✅ Succès! Magic Link envoyé');
      if (data) {
        console.log('   Data:', JSON.stringify(data, null, 2));
      }
    }
  } catch (e) {
    console.log('❌ Exception:', e.message);
  }

  console.log('');
  console.log('=' .repeat(50));
  console.log('📊 Résumé du diagnostic:');
  console.log('');
  console.log('Si tous les tests OTP échouent avec "otp_disabled":');
  console.log('→ Vérifiez dans Dashboard > Authentication > Providers');
  console.log('→ Section "Email" doit avoir une option pour activer les OTP/Magic Links');
  console.log('');
  console.log('Si seulement shouldCreateUser: true échoue:');
  console.log('→ Les inscriptions par OTP sont peut-être désactivées');
  console.log('→ Vérifiez les paramètres de sécurité et les rate limits');
  console.log('');
  console.log('Configuration SMTP:');
  console.log('→ Dashboard > Project Settings > Auth > SMTP Settings');
  console.log('→ Vérifiez que Resend est bien configuré');
}

// Récupérer l'email depuis les arguments
const email = process.argv[2];

if (!email) {
  console.log('Usage: node scripts/debug-auth.js votre-email@example.com');
  process.exit(1);
}

// Validation basique de l'email
if (!email.includes('@')) {
  console.error('❌ Email invalide');
  process.exit(1);
}

// Lancer le débogage
debugAuth(email).then(() => {
  console.log('\n✨ Débogage terminé');
  process.exit(0);
}).catch(err => {
  console.error('Erreur:', err);
  process.exit(1);
});