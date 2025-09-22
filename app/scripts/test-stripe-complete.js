#!/usr/bin/env node

/**
 * Script de test complet de la configuration Stripe
 * Vérifie les clés, le webhook et la connexion
 */

const https = require('https');
const crypto = require('crypto');
require('dotenv').config({ path: '.env.local' });

// Configuration depuis .env.local
const STRIPE_PK = process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY;
const STRIPE_SK = process.env.STRIPE_SECRET_KEY;
const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;

console.log('🧪 Test complet de la configuration Stripe pour EAGLE GOLF\n');
console.log('═══════════════════════════════════════════════════════\n');

// 1. Vérifier les variables d'environnement
console.log('1️⃣  Vérification des variables d\'environnement :');
console.log('   Clé publique :', STRIPE_PK ? `✅ ${STRIPE_PK.substring(0, 30)}...` : '❌ Non trouvée');
console.log('   Clé secrète  :', STRIPE_SK ? `✅ ${STRIPE_SK.substring(0, 30)}...` : '❌ Non trouvée');
console.log('   Webhook secret:', WEBHOOK_SECRET ? `✅ ${WEBHOOK_SECRET.substring(0, 30)}...` : '❌ Non trouvée');
console.log('   Supabase URL :', SUPABASE_URL ? `✅ ${SUPABASE_URL}` : '❌ Non trouvée');

if (!STRIPE_PK || !STRIPE_SK || !WEBHOOK_SECRET || !SUPABASE_URL) {
  console.log('\n❌ Variables manquantes. Vérifiez votre fichier .env.local');
  process.exit(1);
}

// 2. Vérifier que les clés correspondent au bon compte (EAGLE GOLF)
console.log('\n2️⃣  Vérification du compte Stripe :');
if (STRIPE_PK.includes('9rmqqgNzm9')) {
  console.log('   ✅ Clés correspondant au compte EAGLE GOLF (acct_1S14QO9rmqqgNzm9)');
} else {
  console.log('   ⚠️  Les clés ne semblent pas correspondre au compte EAGLE GOLF');
}

// 3. Tester la connexion à l'API Stripe
console.log('\n3️⃣  Test de connexion à l\'API Stripe :');

const testStripeAPI = () => {
  return new Promise((resolve) => {
    const auth = Buffer.from(STRIPE_SK + ':').toString('base64');

    const options = {
      hostname: 'api.stripe.com',
      port: 443,
      path: '/v1/charges?limit=1',
      method: 'GET',
      headers: {
        'Authorization': `Basic ${auth}`
      }
    };

    const req = https.request(options, (res) => {
      if (res.statusCode === 200) {
        console.log('   ✅ Connexion à l\'API Stripe réussie');
        resolve(true);
      } else {
        console.log(`   ❌ Erreur de connexion (code ${res.statusCode})`);
        resolve(false);
      }
    });

    req.on('error', (error) => {
      console.log('   ❌ Erreur de connexion:', error.message);
      resolve(false);
    });

    req.end();
  });
};

// 4. Générer une signature de test
console.log('\n4️⃣  Test de signature webhook :');

const generateTestSignature = () => {
  const timestamp = Math.floor(Date.now() / 1000);
  const payload = JSON.stringify({
    id: 'evt_test_webhook',
    object: 'event',
    type: 'payment_intent.succeeded'
  });

  const signedPayload = `${timestamp}.${payload}`;
  const expectedSignature = crypto
    .createHmac('sha256', WEBHOOK_SECRET)
    .update(signedPayload, 'utf8')
    .digest('hex');

  console.log('   Timestamp    :', timestamp);
  console.log('   Signature    :', expectedSignature.substring(0, 20) + '...');
  console.log('   ✅ Signature générée avec succès');

  return { timestamp, signature: expectedSignature, payload };
};

// 5. Tester le webhook Supabase
console.log('\n5️⃣  Test du webhook Supabase :');

const testWebhook = (data) => {
  return new Promise((resolve) => {
    const url = new URL(`${SUPABASE_URL}/functions/v1/stripe-webhook`);
    const header = `t=${data.timestamp},v1=${data.signature}`;

    const options = {
      hostname: url.hostname,
      port: 443,
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'stripe-signature': header,
        'Content-Length': Buffer.byteLength(data.payload)
      }
    };

    console.log(`   Envoi vers : ${url.href}`);

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          console.log('   ✅ Webhook répondu avec succès (200)');
        } else if (res.statusCode === 401) {
          console.log('   ⚠️  Webhook retourne 401 - Vérifiez les secrets dans Supabase');
        } else if (res.statusCode === 400) {
          console.log('   ⚠️  Webhook retourne 400 - Erreur de validation');
        } else {
          console.log(`   ❌ Webhook retourne ${res.statusCode}`);
        }
        console.log('   Réponse:', body.substring(0, 100));
        resolve();
      });
    });

    req.on('error', (error) => {
      console.log('   ❌ Erreur d\'appel webhook:', error.message);
      resolve();
    });

    req.write(data.payload);
    req.end();
  });
};

// Exécuter les tests
(async () => {
  await testStripeAPI();
  const signatureData = generateTestSignature();
  await testWebhook(signatureData);

  console.log('\n═══════════════════════════════════════════════════════');
  console.log('\n📊 Résumé de la configuration :');
  console.log('   • Compte : EAGLE GOLF (acct_1S14QO9rmqqgNzm9)');
  console.log('   • Webhook : https://vrpsulmidpgxmkybgtwn.supabase.co/functions/v1/stripe-webhook');
  console.log('   • Mode : Test');

  console.log('\n📝 Prochaines étapes :');
  console.log('   1. Mettre à jour les secrets dans Supabase Dashboard');
  console.log('   2. Vérifier le webhook dans Stripe Dashboard');
  console.log('   3. Tester un paiement réel dans l\'app');

  console.log('\n✨ Test terminé !');
})();