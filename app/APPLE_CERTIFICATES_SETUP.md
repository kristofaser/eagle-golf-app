# Configuration des Certificats Apple pour Eagle

## 🔐 Configuration requise

Pour déployer sur TestFlight, vous devez configurer les certificats Apple. Voici comment procéder :

## Option 1 : Configuration interactive (Recommandée)

Ouvrez un nouveau terminal et exécutez :

```bash
# Depuis le dossier du projet
cd /Users/christophe/Projets/Eagle

# Lancez la configuration interactive
eas build --platform ios --profile production
```

Vous devrez répondre aux questions suivantes :

1. **"Do you want to log in to your Apple account?"**
   - Répondez : `Y` (Oui)
   - Entrez votre Apple ID (email)
   - Entrez votre mot de passe Apple
   - Si vous avez l'authentification à deux facteurs, entrez le code reçu

2. **Sélection de l'équipe Apple Developer**
   - Choisissez votre équipe si vous en avez plusieurs

3. **Bundle Identifier**
   - Confirmez : `com.cigalo.eagle`

4. **Certificats et Profils**
   - Laissez EAS créer automatiquement tout ce qui est nécessaire
   - Répondez `Y` pour créer un nouveau certificat de distribution
   - Répondez `Y` pour créer un nouveau profil de provisioning

## Option 2 : Configuration manuelle dans App Store Connect

Si l'option 1 ne fonctionne pas, suivez ces étapes :

### 1. Créez votre app dans App Store Connect

1. Allez sur [App Store Connect](https://appstoreconnect.apple.com)
2. Cliquez sur "My Apps" puis "+"
3. Créez une nouvelle app avec :
   - **Platform:** iOS
   - **Name:** Eagle
   - **Primary Language:** French
   - **Bundle ID:** com.cigalo.eagle
   - **SKU:** eagle-app-2024

### 2. Récupérez vos identifiants

Dans App Store Connect, notez :
- **App Store Connect App ID** (commence par des chiffres)
- **Apple Team ID** (dans Membership)

### 3. Mettez à jour eas.json

Remplacez les valeurs dans `/Users/christophe/Projets/Eagle/eas.json` :

```json
"submit": {
  "production": {
    "ios": {
      "appleId": "VOTRE_APPLE_ID@email.com",
      "ascAppId": "VOTRE_APP_STORE_CONNECT_ID",
      "appleTeamId": "VOTRE_TEAM_ID"
    }
  }
}
```

### 4. Relancez le build

```bash
eas build --platform ios --profile production
```

## 🆘 Résolution de problèmes

### Erreur "Missing Distribution Certificate"

```bash
# Réinitialisez les certificats
eas credentials
# Choisissez iOS > Production > Remove all credentials
# Puis relancez le build
```

### Erreur "Bundle ID already exists"

- Vérifiez dans App Store Connect que le Bundle ID n'est pas déjà utilisé
- Si besoin, changez-le dans `app.json` et `ios/eagle/Info.plist`

### Authentification à deux facteurs

Si vous avez activé 2FA sur votre compte Apple :
1. Générez un mot de passe d'application sur [appleid.apple.com](https://appleid.apple.com)
2. Allez dans "Sign-In and Security" > "App-Specific Passwords"
3. Créez un nouveau mot de passe pour "EAS Build"
4. Utilisez ce mot de passe au lieu de votre mot de passe habituel

## 📝 Notes importantes

- Les certificats sont stockés de manière sécurisée par Expo
- Vous n'avez besoin de les configurer qu'une seule fois
- Pour les builds futurs, EAS utilisera automatiquement les certificats existants
- Si vous travaillez en équipe, partagez l'accès via App Store Connect

## ✅ Une fois configuré

Après la configuration réussie des certificats :

1. Le build se lancera automatiquement
2. Attendez 15-20 minutes pour la compilation
3. Vous recevrez un email quand c'est terminé
4. Suivez le guide TestFlight pour la suite

## 🔗 Ressources utiles

- [Documentation Expo sur les certificats](https://docs.expo.dev/app-signing/app-credentials/)
- [Guide Apple Developer](https://developer.apple.com/documentation/appstoreconnectapi)
- [Forum Expo](https://forums.expo.dev/)