const crypto = require('crypto');

// Configuration
const webhookSecret = 'whsec_z3gkYCotMbiFlUI5gHZZ3aJ9fCRCUxYc';
const webhookUrl = 'https://vrpsulmidpgxmkybgtwn.supabase.co/functions/v1/stripe-webhook-public';

// Payload de test
const event = {
  id: 'evt_test_' + Date.now(),
  object: 'event',
  api_version: '2023-10-16',
  created: Math.floor(Date.now() / 1000),
  type: 'payment_intent.succeeded',
  data: {
    object: {
      id: 'pi_test_' + Date.now(),
      object: 'payment_intent',
      amount: 10000, // 100€
      currency: 'eur',
      status: 'succeeded',
      metadata: {
        test: 'true',
        description: 'Test avec signature valide'
      }
    }
  }
};

// Générer une signature Stripe valide
function generateStripeSignature(payload, secret) {
  const timestamp = Math.floor(Date.now() / 1000);
  const signedPayload = `${timestamp}.${payload}`;
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(signedPayload, 'utf8')
    .digest('hex');
  
  return {
    header: `t=${timestamp},v1=${expectedSignature}`,
    timestamp
  };
}

async function testWebhook() {
  console.log('🚀 Test du webhook Stripe avec signature valide...\n');
  
  const body = JSON.stringify(event);
  const { header, timestamp } = generateStripeSignature(body, webhookSecret);
  
  console.log('📦 Événement:', event.type);
  console.log('💳 Payment Intent:', event.data.object.id);
  console.log('🔐 Signature générée:', header.substring(0, 50) + '...');
  console.log('🕐 Timestamp:', timestamp);
  
  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'stripe-signature': header
      },
      body: body
    });
    
    const result = await response.text();
    
    console.log('\n📨 Réponse du webhook:');
    console.log('   Status:', response.status);
    console.log('   Body:', result);
    
    if (response.ok) {
      console.log('\n✅ Webhook exécuté avec succès!');
      console.log('🎯 La signature a été vérifiée et acceptée.');
    } else {
      console.log('\n❌ Erreur du webhook');
      console.log('⚠️  Vérifiez le secret dans Stripe Dashboard');
    }
  } catch (error) {
    console.error('\n❌ Erreur lors de l\'appel:', error.message);
  }
}

testWebhook();