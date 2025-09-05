# Configuration Stripe pour Eagle Golf

## 🚀 Installation et Configuration

### 1. Compte Stripe

1. Créer un compte sur [stripe.com](https://stripe.com)
2. Récupérer les clés API depuis le dashboard Stripe
3. Configurer les webhooks pour les paiements

### 2. Variables d'environnement

Ajouter dans `.env.local` :

```env
# Stripe Configuration
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...  # Clé publique (côté client)
STRIPE_SECRET_KEY=sk_test_...                   # Clé secrète (côté serveur)
STRIPE_WEBHOOK_SECRET=whsec_...                 # Secret webhook
```

### 3. Configuration des Webhooks

Dans le dashboard Stripe, configurer les webhooks :

**URL d'endpoint** : `https://[PROJET].supabase.co/functions/v1/stripe-webhook`

**Événements à écouter** :
- `payment_intent.succeeded`
- `payment_intent.payment_failed`
- `charge.dispute.created`

### 4. Déployer les Edge Functions

```bash
# Se connecter à Supabase
supabase login

# Déployer les fonctions
supabase functions deploy create-payment-intent
supabase functions deploy check-payment-status
supabase functions deploy stripe-webhook

# Configurer les secrets
supabase secrets set STRIPE_SECRET_KEY=sk_test_...
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_...
```

### 5. Appliquer les migrations

```bash
# Appliquer la migration pour les logs de paiement
supabase db push
```

## 🏗️ Architecture

### Flow de paiement

1. **Étape 1** : L'utilisateur clique sur "Confirmer et payer"
2. **Étape 2** : Création d'un Payment Intent via Edge Function
3. **Étape 3** : Affichage du Payment Sheet mobile
4. **Étape 4** : Traitement du paiement par Stripe
5. **Étape 5** : Confirmation et création de la réservation
6. **Étape 6** : Webhook de confirmation (optionnel)

### Composants

- **PaymentSheet.tsx** : Composant UI pour le paiement
- **payment.service.ts** : Service client pour les paiements
- **Edge Functions** : Fonctions serveur sécurisées

## 📱 Utilisation

### Dans un composant React Native

```tsx
import { PaymentSheet } from '@/components/organisms/PaymentSheet';

<PaymentSheet
  amount={25000} // 250.00€ en centimes
  currency="eur"
  metadata={{
    pro_id: "uuid-pro",
    amateur_id: "uuid-amateur",
    booking_date: "2025-09-18",
    start_time: "09:00",
    description: "Réservation golf avec Jean Bernard"
  }}
  onPaymentSuccess={(paymentIntentId) => {
    console.log('Paiement réussi:', paymentIntentId);
    // Créer la réservation
  }}
  onPaymentError={(error) => {
    console.error('Erreur paiement:', error);
  }}
  buttonText="Payer maintenant"
/>
```

## 🔒 Sécurité

### Best Practices

1. **Clés secrètes** : Jamais exposées côté client
2. **Webhooks** : Vérification des signatures Stripe
3. **Authentification** : Utilisateurs authentifiés uniquement
4. **Logs** : Traçabilité des paiements via `payment_logs`
5. **RLS** : Sécurité au niveau base de données

### Environnements

- **Test** : Utiliser les clés `pk_test_` et `sk_test_`
- **Production** : Utiliser les clés `pk_live_` et `sk_live_`

## 🛠️ Développement

### Tests locaux

```bash
# Démarrer Supabase localement
supabase start

# Tester les fonctions
supabase functions serve

# Tests avec curl
curl -X POST 'http://localhost:54321/functions/v1/create-payment-intent' \
  -H 'Authorization: Bearer [USER_TOKEN]' \
  -H 'Content-Type: application/json' \
  -d '{
    "amount": 25000,
    "currency": "eur",
    "metadata": {
      "pro_id": "test",
      "amateur_id": "test",
      "description": "Test booking"
    }
  }'
```

### Logs de debug

Les logs sont disponibles dans :
- Dashboard Supabase : Edge Functions logs
- Dashboard Stripe : Webhook logs
- Table `payment_logs` : Historique complet

## 📞 Support

En cas de problème :

1. Vérifier les logs Supabase
2. Vérifier les logs Stripe
3. Consulter la table `payment_logs`
4. Tester avec les clés de test