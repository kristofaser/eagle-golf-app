# Guide TestFlight pour Eagle

## 📱 Prérequis

### Compte Apple Developer
- [ ] Compte Apple Developer actif (99$/an)
- [ ] Accès à App Store Connect
- [ ] Certificats et profils de provisioning configurés

### Configuration locale
- [ ] EAS CLI installé (`npm install -g eas-cli`)
- [ ] Connecté à Expo (`eas login`)
- [ ] Xcode installé (pour les certificats)

## 🚀 Étapes de déploiement

### 1. Préparation du build

Avant de créer le build, mettez à jour les informations dans `eas.json` :

```json
"submit": {
  "production": {
    "ios": {
      "appleId": "votre-email@apple.com",
      "ascAppId": "ID_APP_STORE_CONNECT",
      "appleTeamId": "VOTRE_TEAM_ID"
    }
  }
}
```

### 2. Création du build

```bash
# Option 1: Utiliser le script automatisé
./scripts/deploy-testflight.sh

# Option 2: Commandes manuelles
eas build --platform ios --profile production
```

Le build prendra environ 10-20 minutes. Vous recevrez un email quand il sera terminé.

### 3. Soumission à App Store Connect

Une fois le build terminé :

```bash
eas submit --platform ios --profile production
```

### 4. Configuration dans App Store Connect

1. Connectez-vous à [App Store Connect](https://appstoreconnect.apple.com)
2. Sélectionnez votre app
3. Allez dans l'onglet "TestFlight"

#### Informations de test requises

**Informations de conformité à l'exportation :**
- L'app utilise-t-elle le chiffrement ? Non (déjà configuré dans app.json)

**Informations de test :**
- **Description du test :** "Application de réservation de cours de golf avec des professionnels certifiés"
- **Email de feedback :** votre-email@example.com
- **Coordonnées du testeur :** Vos informations

**Groupe de testeurs :**
1. Créez un nouveau groupe (ex: "Beta Testeurs")
2. Ajoutez les emails de vos testeurs
3. Définissez la durée du test (90 jours max)

### 5. Invitation des testeurs

#### Pour inviter votre client :

1. Dans TestFlight > Testeurs externes
2. Cliquez sur "+" pour ajouter un testeur
3. Entrez l'email du client
4. Le client recevra une invitation par email

#### Instructions pour le client :

1. **Installer TestFlight** depuis l'App Store
2. **Ouvrir l'email d'invitation** sur son iPhone
3. **Cliquer sur "View in TestFlight"**
4. **Accepter l'invitation** et installer l'app

## 📊 Suivi et feedback

### Dans App Store Connect

- **Crashes :** Visualisez les rapports de crash
- **Feedback :** Lisez les retours des testeurs
- **Statistiques :** Nombre d'installations et sessions

### Collecte de feedback

Le client peut envoyer du feedback directement depuis TestFlight :
1. Ouvrir TestFlight
2. Sélectionner Eagle
3. Appuyer sur "Send Beta Feedback"
4. Prendre une capture d'écran et ajouter des commentaires

## 🔄 Mises à jour

Pour publier une nouvelle version :

1. Incrémentez la version dans `app.json`
2. Créez un nouveau build : `eas build --platform ios --profile production`
3. Soumettez à App Store Connect : `eas submit --platform ios`
4. La mise à jour sera automatiquement disponible pour les testeurs

## ⚠️ Limitations TestFlight

- **Durée :** Les builds expirent après 90 jours
- **Testeurs :** Maximum 10 000 testeurs externes
- **Builds :** Maximum 100 builds actifs
- **Délai :** La première soumission peut prendre 24-48h pour validation

## 🆘 Résolution de problèmes

### Erreurs courantes

**"Missing compliance" :**
- Vérifiez les informations d'exportation dans App Store Connect

**"Invalid provisioning profile" :**
```bash
eas credentials
# Sélectionnez "iOS" puis "production" et régénérez les certificats
```

**"Build failed" :**
- Vérifiez les logs dans Expo Dashboard
- Assurez-vous que le bundle identifier est unique

### Support

- [Documentation Expo](https://docs.expo.dev/distribution/app-stores/)
- [Guide TestFlight Apple](https://developer.apple.com/testflight/)
- [Forum Expo](https://forums.expo.dev/)

## ✅ Checklist finale

- [ ] Build créé avec succès
- [ ] Build soumis à App Store Connect
- [ ] Informations de test complétées
- [ ] Groupe de testeurs créé
- [ ] Client invité par email
- [ ] Instructions envoyées au client
- [ ] Feedback configuré