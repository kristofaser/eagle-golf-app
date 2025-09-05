#!/usr/bin/env node

/**
 * Script de test pour vérifier l'envoi d'emails via Supabase + Resend
 * Usage: node scripts/test-email.js votre-email@example.com
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

async function testEmail(email) {
  console.log('🚀 Test d\'envoi d\'email via Supabase + Resend');
  console.log('📧 Email de test:', email);
  console.log('');

  try {
    // Test 1: Envoyer un OTP pour connexion uniquement
    console.log('📨 Test 1: Envoi d\'un code OTP pour connexion...');
    console.log('ℹ️  Note: Ceci ne fonctionne que si l\'utilisateur existe déjà');
    const { data, error } = await supabase.auth.signInWithOtp({
      email: email,
      options: {
        shouldCreateUser: false, // Ne pas créer d'utilisateur
      }
    });

    if (error) {
      console.error('❌ Erreur lors de l\'envoi:', error.message);
      console.error('Détails:', error);
      
      // Conseils de débogage
      console.log('\n🔍 Points à vérifier:');
      console.log('1. Configuration SMTP dans Supabase Dashboard:');
      console.log('   - Authentication → Settings → SMTP Settings');
      console.log('   - Host: smtp.resend.com');
      console.log('   - Port: 465 (SSL) ou 587 (TLS)');
      console.log('   - Username: resend (PAS votre email!)');
      console.log('   - Password: Votre clé API Resend (re_...)');
      console.log('');
      console.log('2. Dans Resend:');
      console.log('   - Domaine vérifié');
      console.log('   - Clé API avec permissions "Send emails"');
      console.log('   - Pas de limite atteinte');
      console.log('');
      console.log('3. Dans Supabase:');
      console.log('   - Template "Magic Link" activé');
      console.log('   - "Enable Custom SMTP" activé');
      
      return;
    }

    console.log('✅ Email envoyé avec succès!');
    console.log('📬 Vérifiez votre boîte mail (et les spams)');
    console.log('');
    
    if (data) {
      console.log('ℹ️ Informations retournées:');
      console.log(JSON.stringify(data, null, 2));
    }

    // Test 2: Créer un utilisateur d'abord avec signUp
    console.log('\n📨 Test 2: Création d\'un utilisateur test avec mot de passe...');
    const testPassword = 'TestPassword123!';
    const { data: signupData, error: signupError } = await supabase.auth.signUp({
      email: email,
      password: testPassword,
      options: {
        data: {
          first_name: 'Test',
          last_name: 'User',
          user_type: 'amateur'
        }
      }
    });

    if (signupError) {
      console.error('❌ Erreur lors de la création:', signupError.message);
      if (signupError.message.includes('already registered') || signupError.message.includes('User already registered')) {
        console.log('ℹ️ L\'utilisateur existe déjà, on peut tester l\'envoi OTP');
        
        // Essayer d'envoyer un OTP maintenant que l'utilisateur existe
        console.log('\n📨 Test 3: Envoi OTP pour utilisateur existant...');
        const { error: otpError } = await supabase.auth.signInWithOtp({
          email: email,
          options: {
            shouldCreateUser: false
          }
        });
        
        if (otpError) {
          console.error('❌ Erreur OTP:', otpError.message);
        } else {
          console.log('✅ OTP envoyé avec succès!');
        }
      }
    } else if (signupData?.user) {
      console.log('✅ Utilisateur créé! Un email de confirmation a été envoyé.');
      console.log('ID utilisateur:', signupData.user.id);
    }

  } catch (err) {
    console.error('❌ Erreur inattendue:', err);
  }
}

// Récupérer l'email depuis les arguments
const email = process.argv[2];

if (!email) {
  console.log('Usage: node scripts/test-email.js votre-email@example.com');
  process.exit(1);
}

// Validation basique de l'email
if (!email.includes('@')) {
  console.error('❌ Email invalide');
  process.exit(1);
}

// Lancer le test
testEmail(email).then(() => {
  console.log('\n✨ Test terminé');
  process.exit(0);
}).catch(err => {
  console.error('Erreur:', err);
  process.exit(1);
});