const crypto = require('crypto');

// Configuration
const webhookUrl = 'https://vrpsulmidpgxmkybgtwn.supabase.co/functions/v1/stripe-webhook';
const webhookSecret = 'votre_webhook_secret'; // À remplacer si vous l'avez

// Simuler un événement Stripe de paiement réussi
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
        booking_id: 'test_booking_' + Date.now(),
        pro_id: 'test_pro_id',
        amateur_id: 'test_amateur_id',
        booking_date: new Date().toISOString().split('T')[0],
        start_time: '09:00',
        description: 'Test booking'
      }
    }
  }
};

async function testWebhook() {
  console.log('🚀 Test du webhook Stripe...\n');
  console.log('📦 Événement simulé:', event.type);
  console.log('💳 Payment Intent ID:', event.data.object.id);
  
  const body = JSON.stringify(event);
  
  // Créer une signature fictive (normalement générée par Stripe)
  const timestamp = Math.floor(Date.now() / 1000);
  const payload = `${timestamp}.${body}`;
  const signature = `t=${timestamp},v1=test_signature`;
  
  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'stripe-signature': signature
      },
      body: body
    });
    
    const result = await response.text();
    
    console.log('\n📨 Réponse du webhook:');
    console.log('   Status:', response.status);
    console.log('   Body:', result);
    
    if (response.ok) {
      console.log('\n✅ Webhook exécuté avec succès!');
      console.log('⚠️  Note: La signature est fictive, donc le webhook pourrait rejeter la requête en production.');
    } else {
      console.log('\n❌ Erreur du webhook');
    }
  } catch (error) {
    console.error('\n❌ Erreur lors de l\'appel:', error.message);
  }
}

testWebhook();