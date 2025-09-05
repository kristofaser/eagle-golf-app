#!/bin/bash

# Test simple du webhook sans signature
echo "🧪 Test du webhook Stripe (sans signature)..."

# Créer un payload de test
PAYLOAD='{
  "id": "evt_test_webhook",
  "object": "event",
  "type": "payment_intent.succeeded",
  "data": {
    "object": {
      "id": "pi_test_123456",
      "amount": 10000,
      "currency": "eur",
      "status": "succeeded",
      "metadata": {}
    }
  }
}'

# Appeler le webhook sans signature (devrait retourner 401)
echo -e "\n📡 Test 1: Sans signature (devrait échouer avec 401):"
curl -X POST https://vrpsulmidpgxmkybgtwn.supabase.co/functions/v1/stripe-webhook \
  -H "Content-Type: application/json" \
  -d "$PAYLOAD" \
  -w "\nStatus: %{http_code}\n"

# Appeler avec une signature bidon
echo -e "\n📡 Test 2: Avec signature bidon (devrait aussi échouer):"
curl -X POST https://vrpsulmidpgxmkybgtwn.supabase.co/functions/v1/stripe-webhook \
  -H "Content-Type: application/json" \
  -H "stripe-signature: t=123456789,v1=fake_signature" \
  -d "$PAYLOAD" \
  -w "\nStatus: %{http_code}\n"

echo -e "\n✅ Si les deux tests retournent 401, le webhook vérifie bien la signature."
echo "⚠️  Il faut configurer le bon secret dans Stripe Dashboard."