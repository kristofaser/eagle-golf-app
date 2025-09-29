# Guide de configuration des notifications push Web (VAPID)

## Introduction

Ce guide explique comment activer les notifications push sur la version web de l'application Eagle en utilisant VAPID (Voluntary Application Server Identification).

## Qu'est-ce que VAPID ?

VAPID est un protocole de sécurité requis pour les notifications push sur le web. Il utilise une paire de clés (publique/privée) pour :
- Authentifier votre serveur auprès des services push des navigateurs
- Garantir que seul votre serveur peut envoyer des notifications à vos utilisateurs
- Éviter le spam et les notifications non autorisées

## Prérequis

- Node.js installé sur votre machine de développement
- Accès au dashboard Supabase pour stocker la clé privée
- Application déployée avec HTTPS (requis pour les notifications web)

## Étape 1 : Générer une paire de clés VAPID

### Option A : Avec web-push (recommandé)

```bash
# Dans le dossier app/
npx web-push generate-vapid-keys
```

Vous obtiendrez une sortie comme :
```
=======================================
Public Key:
BKd0hNGE3Jk9vYl7Uz9EXAMPLE_PUBLIC_KEY_87_CHARACTERS_LONG

Private Key:
GpJQ2f-EXAMPLE_PRIVATE_KEY_43_CHARS
=======================================
```

### Option B : Sites web en ligne

- [vapidkeys.com](https://vapidkeys.com) - Générateur simple et rapide
- [web-push-codelab.glitch.me](https://web-push-codelab.glitch.me) - Outil Google

> ⚠️ **IMPORTANT** : Gardez toujours la paire de clés ensemble. Ne régénérez jamais les clés en production car cela cassera les souscriptions existantes.

## Étape 2 : Configurer la clé publique dans l'application

1. Ouvrez le fichier `app/app.json`
2. Trouvez la section `notification` et décommentez/ajoutez la clé publique :

```json
{
  "expo": {
    // ...
    "notification": {
      "icon": "./assets/images/icon.png",
      "color": "#3b82f6",
      "vapidPublicKey": "BKd0hNGE3Jk9vYl7Uz9VOTRE_CLE_PUBLIQUE_ICI"
    },
    // ...
  }
}
```

## Étape 3 : Stocker la clé privée dans Supabase

La clé privée doit être stockée de manière sécurisée côté serveur pour signer les notifications.

### Via le Dashboard Supabase :

1. Allez dans **Edge Functions** > **Secrets**
2. Ajoutez un nouveau secret :
   - Nom : `VAPID_PRIVATE_KEY`
   - Valeur : Votre clé privée (ex: `GpJQ2f-VOTRE_CLE_PRIVEE`)

### Via la CLI Supabase :

```bash
npx supabase secrets set VAPID_PRIVATE_KEY=GpJQ2f-VOTRE_CLE_PRIVEE --project-ref vrpsulmidpgxmkybgtwn
```

## Étape 4 : Ajouter le subject VAPID

Ajoutez également un email de contact (requis par le protocole VAPID) :

```bash
npx supabase secrets set VAPID_SUBJECT=mailto:contact@eagle-app.com --project-ref vrpsulmidpgxmkybgtwn
```

## Étape 5 : Mettre à jour la Edge Function send-push-notification

La fonction Edge Function `send-push-notification` doit être mise à jour pour utiliser les clés VAPID sur web :

```typescript
// Dans supabase/functions/send-push-notification/index.ts
import webpush from 'web-push';

// Configuration VAPID pour web
if (platform === 'web') {
  const vapidPublicKey = 'VOTRE_CLE_PUBLIQUE'; // Même que dans app.json
  const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY')!;
  const vapidSubject = Deno.env.get('VAPID_SUBJECT')!;

  webpush.setVapidDetails(
    vapidSubject,
    vapidPublicKey,
    vapidPrivateKey
  );

  // Envoyer la notification web
  await webpush.sendNotification(subscription, payload);
}
```

## Étape 6 : Tester les notifications web

1. **Relancer l'application web** :
```bash
cd app
npm run web
```

2. **Vérifier dans la console** :
   - L'erreur VAPID devrait avoir disparu
   - Vous devriez voir : "✅ usePushNotifications: Token obtenu: ExponentPushToken[...]"

3. **Tester l'envoi** :
   - Connectez-vous à l'app web
   - Autorisez les notifications quand demandé
   - Déclenchez une action qui génère une notification (ex: nouvelle réservation)

## Étape 7 : Déploiement

### Pour le développement local :
- Les clés VAPID fonctionnent en localhost avec HTTPS
- Expo dev server utilise HTTPS par défaut

### Pour la production :
1. Assurez-vous que votre site est en HTTPS
2. Vérifiez que les clés VAPID sont correctement configurées
3. Testez sur différents navigateurs (Chrome, Firefox, Safari)

## Limitations et considérations

### Navigateurs supportés :
- ✅ Chrome/Edge (Desktop & Mobile)
- ✅ Firefox (Desktop & Mobile)
- ⚠️ Safari (Support partiel, nécessite macOS 13+ / iOS 16.4+)

### Limitations connues :
- Les notifications web nécessitent que le navigateur soit ouvert (au moins en arrière-plan)
- iOS Safari a des restrictions supplémentaires (PWA requise)
- Les notifications peuvent être bloquées par des extensions navigateur

## Debugging

### L'erreur VAPID persiste ?
1. Vérifiez que la clé publique est correctement formatée (pas d'espaces, pas de retours à la ligne)
2. Assurez-vous d'avoir relancé le serveur Expo après modification de `app.json`
3. Vérifiez dans les DevTools : `Constants.expoConfig?.notification?.vapidPublicKey`

### Les notifications ne sont pas reçues ?
1. Vérifiez les permissions du navigateur
2. Testez avec `chrome://settings/content/notifications` (Chrome)
3. Consultez les logs de la Edge Function dans Supabase Dashboard

### Erreur "invalid VAPID key" ?
- Les clés doivent être générées avec la courbe elliptique P-256
- Utilisez l'outil `web-push` pour garantir le bon format

## Sécurité

⚠️ **IMPORTANT** :
- **Ne jamais** exposer la clé privée VAPID dans le code client
- **Ne jamais** commiter la clé privée dans Git
- **Toujours** utiliser des variables d'environnement côté serveur
- **Rotation des clés** : En cas de compromission, régénérez les clés et mettez à jour toutes les souscriptions

## Ressources supplémentaires

- [Documentation Expo Notifications](https://docs.expo.dev/push-notifications/web-notifications/)
- [Web Push Protocol](https://developers.google.com/web/fundamentals/push-notifications)
- [VAPID Specification](https://datatracker.ietf.org/doc/html/rfc8292)
- [Supabase Edge Functions Secrets](https://supabase.com/docs/guides/functions/secrets)

## Support

Pour toute question ou problème :
- Consultez les logs dans `app/utils/logger.ts`
- Vérifiez les erreurs dans la console du navigateur
- Contactez l'équipe technique Eagle