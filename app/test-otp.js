// Script de test pour debug OTP

// Charger les variables d'environnement en premier
require('dotenv').config({ path: '.env.local' });

const { createClient } = require('@supabase/supabase-js');

// Récupérer les clés
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

console.log('URL:', supabaseUrl);
console.log('Key:', supabaseKey ? 'Found' : 'Missing');

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testOTP() {
  const email = 'test-' + Date.now() + '@example.com';
  console.log('\n=== TEST OTP FLOW ===');
  console.log('Email:', email);

  // 1. Envoyer OTP
  console.log('\n1. Envoi OTP...');
  const { error: otpError } = await supabase.auth.signInWithOtp({
    email,
    options: {
      shouldCreateUser: true,
      data: {
        first_name: 'Test',
        last_name: 'User',
      },
    },
  });

  if (otpError) {
    console.error('Erreur envoi OTP:', otpError);
    return;
  }

  console.log('✓ OTP envoyé');
  
  // 2. Attendre que l'utilisateur entre le code
  const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  readline.question('\nEntrez le code OTP reçu par email: ', async (token) => {
    console.log('\n2. Vérification du code:', token);
    
    // Essayer différents types
    const types = ['email', 'signup', 'magiclink'];
    
    for (const type of types) {
      console.log(`\nEssai avec type: ${type}`);
      
      try {
        const { data, error } = await supabase.auth.verifyOtp({
          email,
          token: token.trim(),
          type: type,
        });

        if (error) {
          console.error(`  ❌ Erreur avec type ${type}:`, error.message);
        } else {
          console.log(`  ✓ SUCCÈS avec type ${type}!`);
          console.log('  User ID:', data.user?.id);
          console.log('  Session:', !!data.session);
          
          // Nettoyer
          if (data.session) {
            await supabase.auth.signOut();
          }
          
          readline.close();
          return;
        }
      } catch (err) {
        console.error(`  ❌ Exception avec type ${type}:`, err.message);
      }
    }
    
    console.log('\n❌ Aucun type n\'a fonctionné');
    readline.close();
  });
}

testOTP().catch(console.error);