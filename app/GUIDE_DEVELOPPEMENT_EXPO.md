# 📱 Guide de Développement Expo - Guide Junior

Un guide simple et pratique pour développer avec Expo, du développement jusqu'à la mise en production.

## 🎯 Vue d'ensemble

Expo est un framework qui simplifie le développement d'applications React Native. Il vous aide à créer des apps iOS et Android avec un seul code JavaScript/TypeScript.

## 🔧 Les Commandes Essentielles

### 1. Développement Local

```bash
# Démarrer le serveur de développement
npm start

# Tester sur iPhone (simulateur)
npm run ios

# Tester sur Android (émulateur)
npm run android

# Version web (dans le navigateur)
npm run web
```

**Quand utiliser** : Pendant le développement quotidien pour tester vos modifications.

### 2. PreBuild - Préparer les Fichiers Natifs

```bash
# Générer les fichiers iOS et Android
npx expo prebuild

# Nettoyer et régénérer (si problème)
npx expo prebuild --clean
```

**À quoi ça sert** :
- Crée les dossiers `ios/` et `android/`
- Configure automatiquement les permissions, icônes, splash screen
- Nécessaire avant de build pour TestFlight/Google Play

**Quand utiliser** :
- Après avoir ajouté de nouvelles permissions dans `app.json`
- Avant de faire un build pour les stores
- Après avoir ajouté des plugins natifs
- Quand vous avez des erreurs de modules natifs

### 3. Build - Créer l'App pour les Stores

```bash
# Build pour TestFlight (iOS test)
eas build --platform ios --profile preview

# Build pour App Store (iOS production)
eas build --platform ios --profile production

# Build pour Google Play
eas build --platform android --profile production
```

**À quoi ça sert** :
- Compile votre code en vraie app installable
- Génère les fichiers `.ipa` (iOS) ou `.apk/.aab` (Android)
- Nécessaire pour publier sur les stores

**Durée** : 15-30 minutes par build

### 4. EAS Credentials - Gérer les Certificats

```bash
# Configurer les certificats iOS/Android
eas credentials

# Voir les certificats actuels
eas credentials --platform ios
```

**À quoi ça sert** :
- Gère automatiquement les certificats Apple et Google
- Configure les push notifications
- S'occupe des clés de signature

**Quand utiliser** :
- Première fois que vous publiez l'app
- Quand les push notifications ne marchent pas
- Pour renouveler des certificats expirés

## 📋 Workflow de Développement Type

### Développement Quotidien

1. **Coder votre fonctionnalité**
2. **Tester** : `npm start` + scan QR code
3. **Répéter** jusqu'à satisfaction

### Avant de Publier

1. **PreBuild** : `npx expo prebuild --clean`
2. **Build de test** : `eas build --platform ios --profile preview`
3. **Tester sur TestFlight**
4. **Corriger les bugs**
5. **Build production** : `eas build --platform ios --profile production`

## 🔍 Résolution de Problèmes

### "Cannot find native module"
```bash
npx expo prebuild --clean
```
*Solution* : Régénère les fichiers natifs

### "Invalid credentials" / Push notifications ne marchent pas
```bash
eas credentials
```
*Solution* : Reconfigure les certificats

### App plante au démarrage
```bash
# Vérifier les logs
npx expo start --dev-client
```
*Solution* : Regarder les erreurs dans la console

### Build échoue
1. Vérifier que `app.json` est correct
2. Vérifier les dépendances dans `package.json`
3. Essayer `npx expo prebuild --clean`

## 📁 Structure des Fichiers Importants

```
votre-app/
├── app.json              # Configuration principale
├── package.json          # Dépendances
├── eas.json              # Configuration des builds
├── app/                  # Votre code React Native
├── ios/                  # Fichiers iOS (généré)
└── android/              # Fichiers Android (généré)
```

## ⚙️ Configuration des Profils (eas.json)

```json
{
  "build": {
    "development": {
      "developmentClient": true
    },
    "preview": {
      "distribution": "internal"
    },
    "production": {
      "distribution": "store"
    }
  }
}
```

**Profils expliqués** :
- **development** : Pour tester avec Expo Go
- **preview** : Pour TestFlight/Google Play Internal
- **production** : Pour App Store/Google Play public

## 🎯 Bonnes Pratiques

### Avant Chaque Build
1. ✅ Tester sur simulateur/émulateur
2. ✅ Vérifier que l'app fonctionne hors ligne
3. ✅ Tester les notifications push
4. ✅ Vérifier les permissions (camera, localisation, etc.)

### Gestion des Versions
```json
// app.json
{
  "version": "1.2.3",           // Version affichée
  "ios": {
    "buildNumber": "123"        // Numéro de build (incrémenté à chaque build)
  },
  "android": {
    "versionCode": 123          // Code version Android
  }
}
```

**Important** : Incrémentez toujours ces numéros avant un nouveau build !

## 🚀 Checklist de Publication

### TestFlight (iOS)
- [ ] `eas build --platform ios --profile preview`
- [ ] Upload automatique sur TestFlight
- [ ] Tester sur vraie appli TestFlight
- [ ] Inviter les testeurs

### App Store (iOS)
- [ ] `eas build --platform ios --profile production`
- [ ] Aller sur App Store Connect
- [ ] Créer une nouvelle version
- [ ] Remplir les métadonnées
- [ ] Soumettre pour review

### Google Play (Android)
- [ ] `eas build --platform android --profile production`
- [ ] Aller sur Google Play Console
- [ ] Upload de l'AAB
- [ ] Tester en interne
- [ ] Publier

## 🆘 Aide et Support

### Ressources Utiles
- [Documentation Expo](https://docs.expo.dev)
- [EAS Build](https://docs.expo.dev/build/introduction/)
- [Troubleshooting](https://docs.expo.dev/troubleshooting/build-errors/)

### Commandes de Debug
```bash
# Voir les logs détaillés
npx expo start --dev-client --clear

# Informations sur l'environnement
npx expo doctor

# Voir les builds en cours
eas build:list
```

## 💡 Conseils pour Débutants

1. **Commencez petit** : Testez d'abord avec `expo start`
2. **Build souvent** : Ne attendez pas la fin pour tester sur device
3. **Gardez des builds de sauvegarde** : Si un build marche, notez la version
4. **Documentez vos changements** : Tenez un changelog
5. **Testez sur vrais appareils** : Les simulateurs ne suffisent pas

---

*Ce guide couvre 90% des cas d'usage. Pour des besoins spécifiques, consultez la documentation officielle Expo.*