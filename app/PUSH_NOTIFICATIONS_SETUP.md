# 📱 Push Notifications Setup - Eagle App

## ✅ Phase 1 Terminée : Infrastructure Push Notifications

### 🎯 Ce qui a été implémenté

#### 1. **Dependencies & Configuration**
- ✅ `expo-notifications`, `expo-device`, `expo-constants` installés
- ✅ `app.json` configuré avec permissions Android + plugin notifications
- ✅ Configuration channels, sons et icônes

#### 2. **Hook Principal : `usePushNotifications.ts`**
```typescript
const {
  token,
  permission,
  isRegistered,
  registerForPushNotifications,
  unregisterPushNotifications
} = usePushNotifications(user?.id);
```

**Fonctionnalités :**
- 🔐 Gestion automatique des permissions iOS/Android
- 🔑 Récupération et stockage du token Expo Push
- 💾 Persistance AsyncStorage + Supabase
- 🔄 Synchronisation automatique avec la base
- 📱 Détection appareil physique vs simulateur
- 🎯 Gestion des listeners de notifications reçues

#### 3. **Base de Données : Table `device_tokens`**
```sql
CREATE TABLE device_tokens (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES profiles(id),
  expo_push_token TEXT NOT NULL,
  platform TEXT CHECK (platform IN ('ios', 'android', 'web')),
  device_info JSONB,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, expo_push_token)
);
```

**Sécurité :**
- ✅ RLS policies activées
- ✅ Index optimisés pour performance
- ✅ Fonctions helper pour nettoyage automatique
- ✅ Trigger auto-update timestamps

#### 4. **Service Client : `push-notification.service.ts`**
```typescript
// Envoi à un utilisateur
await pushNotificationService.sendToUser(userId, {
  title: 'Paiement confirmé',
  body: 'Votre leçon a été réservée !',
  type: 'payment_received',
  data: { bookingId: '...' }
});

// Envoi à plusieurs utilisateurs
await pushNotificationService.sendToUsers(userIds, notification);

// Envoi à des tokens spécifiques
await pushNotificationService.sendToTokens(tokens, notification);
```

**Fonctionnalités :**
- 🚀 Batch sending (100 tokens par requête)
- 🔄 Retry automatique avec backoff exponentiel
- 🧹 Nettoyage automatique des tokens invalides
- 🎨 Types de notifications prédéfinis
- 📊 Métriques de livraison détaillées

#### 5. **Edge Function : `send-push-notification`**
```bash
# Déploiement
npx supabase functions deploy send-push-notification --project-ref vrpsulmidpgxmkybgtwn
```

**API :**
```typescript
// POST https://vrpsulmidpgxmkybgtwn.supabase.co/functions/v1/send-push-notification
{
  "userId": "uuid",      // OU
  "userIds": ["uuid"],   // OU
  "tokens": ["token"],   // Tokens directs
  "title": "Titre",
  "body": "Message",
  "type": "payment_received",
  "data": { "bookingId": "..." },
  "priority": "high"
}
```

#### 6. **Exemples d'Intégration**
- ✅ `examples/usePushNotifications.example.tsx`
- ✅ Intégration avec `useNotificationRealtime` existant
- ✅ Tests fonctionnels inclus

---

## 🚀 Phase 2 : Intégration avec le Système Existant

### **Prochaines Étapes**

#### 1. **Déployer l'Edge Function**
```bash
cd app
npx supabase functions deploy send-push-notification --project-ref vrpsulmidpgxmkybgtwn
```

#### 2. **Intégrer dans App.tsx**
```typescript
import { usePushNotifications } from '@/hooks/usePushNotifications';

export default function App() {
  const { user } = useAuth();

  // Auto-register pour les push notifications
  usePushNotifications(user?.id, {
    autoRegister: true,
    syncWithBackend: true,
    debug: __DEV__
  });

  return <YourAppContent />;
}
```

#### 3. **Modifier les Webhooks Stripe**
```typescript
// Dans stripe-webhook/index.ts
if (paymentIntent.status === 'succeeded') {
  // Créer la notification DB (existant)
  await supabase.from('notifications').insert({...});

  // NOUVEAU: Envoyer push notification
  await supabase.functions.invoke('send-push-notification', {
    body: {
      userId: booking.amateur_id,
      title: '💳 Paiement confirmé',
      body: 'Votre leçon de golf a été réservée !',
      type: 'payment_received',
      data: { bookingId: booking.id }
    }
  });
}
```

#### 4. **Modifier les Triggers de Booking**
```typescript
// Quand un booking est validé par l'admin
await supabase.functions.invoke('send-push-notification', {
  body: {
    userId: booking.amateur_id,
    title: '✅ Réservation confirmée',
    body: `Votre leçon avec ${pro.name} est confirmée`,
    type: 'booking_confirmed',
    data: {
      bookingId: booking.id,
      screen: '/bookings/details'
    }
  }
});
```

---

## 🔧 Configuration Avancée

### **1. Certificates iOS (Production)**
Pour la production iOS, vous devez :
1. Générer un certificat push dans Apple Developer
2. Configurer EAS avec `eas credentials`
3. Upload du certificat via EAS CLI

### **2. Firebase Android (Production)**
Pour Android :
1. Créer un projet Firebase
2. Ajouter `google-services.json`
3. Configurer dans `app.json` :
```json
{
  "expo": {
    "android": {
      "googleServicesFile": "./google-services.json"
    }
  }
}
```

### **3. Channels de Notifications**
Configuré dans `app.json` :
```json
{
  "expo": {
    "plugins": [
      ["expo-notifications", {
        "defaultChannel": "default",
        "sounds": ["./assets/sounds/notification.wav"]
      }]
    ]
  }
}
```

---

## 📊 Monitoring & Analytics

### **Métriques Disponibles**
- ✅ Tokens actifs par utilisateur
- ✅ Taux de livraison par platform
- ✅ Tokens invalides détectés
- ✅ Erreurs d'envoi avec retry

### **Fonctions de Nettoyage**
```sql
-- Nettoyer les anciens tokens (manuel ou cron)
SELECT cleanup_inactive_device_tokens();

-- Statistiques tokens
SELECT
  platform,
  COUNT(*) as total_tokens,
  COUNT(CASE WHEN is_active THEN 1 END) as active_tokens
FROM device_tokens
GROUP BY platform;
```

---

## 🎯 Tests

### **Test Manuel**
1. Utiliser `examples/usePushNotifications.example.tsx`
2. Tester sur appareil physique (pas simulateur)
3. Vérifier permissions iOS/Android

### **Test Edge Function**
```bash
curl -X POST "https://vrpsulmidpgxmkybgtwn.supabase.co/functions/v1/send-push-notification" \
  -H "Authorization: Bearer YOUR_JWT" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "your-user-id",
    "title": "Test",
    "body": "Message de test",
    "type": "custom"
  }'
```

---

## ✅ Status Phase 1

| Composant | Status | Notes |
|-----------|--------|-------|
| Dependencies | ✅ | expo-notifications installé |
| Configuration | ✅ | app.json mis à jour |
| Hook Principal | ✅ | usePushNotifications.ts complet |
| Base de Données | ✅ | Table device_tokens créée |
| Service Client | ✅ | push-notification.service.ts |
| Edge Function | ✅ | send-push-notification prête |
| Exemples | ✅ | Documentation complète |
| Tests | 🟡 | À tester sur device physique |
| Production | 🟡 | Certificates iOS/Android requis |

**Phase 1 = 100% Complete ✅**

Prêt pour la phase 2 : Intégration avec le système existant !