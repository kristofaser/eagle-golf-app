#!/usr/bin/env node

/**
 * Script pour tester directement l'API Resend et vérifier les domaines
 */

require('dotenv').config({ path: '.env.local' });

// Récupérer la clé API depuis les variables d'environnement
// Assurez-vous d'avoir défini API_RESEND_SUPABASE_SMTP dans votre fichier .env.local
const RESEND_API_KEY = process.env.API_RESEND_SUPABASE_SMTP;

if (!RESEND_API_KEY) {
  console.error('❌ Erreur: API_RESEND_SUPABASE_SMTP non définie dans .env.local');
  console.log('Créez un fichier .env.local avec:');
  console.log('API_RESEND_SUPABASE_SMTP=votre_clé_api_resend');
  process.exit(1);
}

async function testResendAPI() {
  console.log('🔍 Test de l\'API Resend');
  console.log('=' .repeat(50));
  console.log('');

  // Test 1: Vérifier les domaines configurés
  console.log('📋 Test 1: Récupération des domaines...');
  try {
    const domainsResponse = await fetch('https://api.resend.com/domains', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    if (!domainsResponse.ok) {
      const error = await domainsResponse.text();
      console.error('❌ Erreur API:', domainsResponse.status, error);
    } else {
      const domains = await domainsResponse.json();
      console.log('✅ Domaines trouvés:');
      
      if (domains.data && domains.data.length > 0) {
        domains.data.forEach(domain => {
          console.log('');
          console.log(`  📧 Domaine: ${domain.name}`);
          console.log(`     Status: ${domain.status}`);
          console.log(`     Région: ${domain.region}`);
          console.log(`     Créé le: ${domain.created_at}`);
          
          if (domain.status === 'verified') {
            console.log(`     ✅ VÉRIFIÉ - Vous pouvez utiliser: noreply@${domain.name}`);
          } else if (domain.status === 'pending') {
            console.log(`     ⚠️  EN ATTENTE - Configuration DNS requise`);
            if (domain.records) {
              console.log(`     📝 Records DNS à ajouter:`);
              domain.records.forEach(record => {
                console.log(`        - ${record.type}: ${record.name} → ${record.value}`);
              });
            }
          } else {
            console.log(`     ❌ NON VÉRIFIÉ`);
          }
        });
      } else {
        console.log('  ⚠️  Aucun domaine configuré');
        console.log('  → Ajoutez un domaine sur https://resend.com/domains');
      }
    }
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }

  console.log('');
  console.log('=' .repeat(50));
  console.log('');

  // Test 2: Envoyer un email de test
  console.log('📋 Test 2: Envoi d\'un email de test...');
  
  // Utiliser l'email par défaut de Resend pour le test
  const testEmail = {
    from: 'onboarding@resend.dev', // Email de test fourni par Resend
    to: 'christophe.marshall.pro@gmail.com',
    subject: 'Test API Resend - Eagle Golf',
    html: `
      <h2>Test de l'API Resend</h2>
      <p>Si vous recevez cet email, votre clé API fonctionne correctement !</p>
      <p>Envoyé le: ${new Date().toLocaleString('fr-FR')}</p>
      <hr>
      <p><small>Eagle Golf - Test d'intégration</small></p>
    `
  };

  try {
    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testEmail)
    });

    if (!emailResponse.ok) {
      const error = await emailResponse.text();
      console.error('❌ Erreur envoi:', emailResponse.status, error);
    } else {
      const result = await emailResponse.json();
      console.log('✅ Email envoyé avec succès !');
      console.log('   ID:', result.id);
      console.log('   De:', testEmail.from);
      console.log('   À:', testEmail.to);
      console.log('');
      console.log('📬 Vérifiez votre boîte mail (et les spams)');
    }
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }

  console.log('');
  console.log('=' .repeat(50));
  console.log('');

  // Test 3: Vérifier les limites API
  console.log('📋 Test 3: Vérification des limites API...');
  try {
    const apiKeysResponse = await fetch('https://api.resend.com/api-keys', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    if (apiKeysResponse.ok) {
      console.log('✅ Clé API valide et active');
    } else if (apiKeysResponse.status === 401) {
      console.error('❌ Clé API invalide ou expirée');
    } else if (apiKeysResponse.status === 429) {
      console.error('⚠️  Limite de taux dépassée (Rate limit)');
    }
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }

  console.log('');
  console.log('=' .repeat(50));
  console.log('📊 Résumé:');
  console.log('');
  console.log('Pour utiliser Resend avec Supabase:');
  console.log('1. Votre domaine doit être vérifié (status: verified)');
  console.log('2. Utilisez un email de ce domaine comme "Sender email" dans Supabase');
  console.log('3. Si aucun domaine n\'est vérifié, utilisez temporairement: onboarding@resend.dev');
  console.log('');
  console.log('Configuration Supabase SMTP:');
  console.log('  Host: smtp.resend.com');
  console.log('  Port: 465');
  console.log('  Username: resend');
  console.log(`  Password: ${RESEND_API_KEY}`);
  console.log('  Sender email: [email d\'un domaine vérifié ou onboarding@resend.dev]');
}

// Lancer le test
testResendAPI().then(() => {
  console.log('\n✨ Test terminé');
  process.exit(0);
}).catch(err => {
  console.error('Erreur:', err);
  process.exit(1);
});