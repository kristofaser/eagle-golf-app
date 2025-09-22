#!/bin/bash

# Script pour mettre à jour les secrets Stripe dans Supabase
# Usage: ./scripts/update-stripe-secrets.sh

echo "🔐 Mise à jour des secrets Stripe dans Supabase..."
echo ""

# Demander le webhook secret
echo "📋 Collez le Signing Secret depuis Stripe Dashboard (format: whsec_...):"
read -r WEBHOOK_SECRET

# Demander la clé secrète Stripe
echo ""
echo "🔑 Collez votre clé secrète Stripe (format: sk_test_...):"
read -r STRIPE_KEY

# Confirmer
echo ""
echo "Voulez-vous mettre à jour ces secrets dans Supabase ? (y/n)"
read -r CONFIRM

if [ "$CONFIRM" = "y" ]; then
    echo "🚀 Mise à jour en cours..."

    # Mettre à jour les secrets
    npx supabase secrets set STRIPE_WEBHOOK_SECRET="$WEBHOOK_SECRET" --project-ref vrpsulmidpgxmkybgtwn
    npx supabase secrets set STRIPE_SECRET_KEY="$STRIPE_KEY" --project-ref vrpsulmidpgxmkybgtwn

    echo "✅ Secrets mis à jour avec succès !"
else
    echo "❌ Annulé"
fi