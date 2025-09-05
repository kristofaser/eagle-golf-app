# Guide de Publication sur TestFlight

## Prérequis
- Xcode installé et configuré
- Compte Apple Developer actif
- Certificats et provisioning profiles configurés

## Étapes de Publication

### 1. Incrémenter le numéro de build
Avant chaque nouvelle publication, incrémentez le numéro de build dans `ios/eagle/Info.plist` :
```xml
<key>CFBundleVersion</key>
<string>2</string> <!-- Incrémenter ce numéro -->
```

### 2. Ouvrir le projet dans Xcode
```bash
open ios/eagle.xcworkspace
```

### 3. Créer l'archive dans Xcode
- Sélectionnez le schéma **"eagle"**
- Sélectionnez **"Any iOS Device (arm64)"** comme destination
- Menu **Product → Archive**
- Attendez que l'archive soit créée (environ 5-10 minutes)

### 4. Distribuer l'application
Une fois l'archive créée :
- La fenêtre **Organizer** s'ouvrira automatiquement
- Sélectionnez votre archive
- Cliquez sur **"Distribute App"**
- Choisissez **"App Store Connect"**
- Suivez les étapes :
  - Validation automatique
  - Signature de l'application
  - Upload vers App Store Connect

### 5. Vérifier sur App Store Connect
- L'app apparaîtra dans TestFlight après le traitement (15-30 minutes)
- Elle sera automatiquement disponible pour les testeurs internes
- Pour les testeurs externes, vous devrez soumettre pour review

## Alternative : Via EAS Build (Expo)

### Build et soumission automatique
```bash
# Créer un nouveau build
eas build --platform ios --profile preview

# Soumettre le dernier build à TestFlight
eas submit --platform ios --latest
```

## Notes importantes

- **Numéro de build** : Doit être unique et incrémenté à chaque soumission
- **Version** : Format X.Y.Z (ex: 1.0.0), à modifier pour les nouvelles versions majeures
- **Temps de traitement** : Apple prend généralement 15-30 minutes pour traiter l'upload
- **Testeurs externes** : Nécessitent une review Apple (24-48h généralement)

## Troubleshooting

### Erreur "Build number already exists"
→ Incrémentez le CFBundleVersion dans Info.plist

### Archive ne s'affiche pas dans Organizer
→ Vérifiez que vous avez sélectionné "Any iOS Device" et non un simulateur

### Upload échoue
→ Vérifiez votre connexion internet et vos credentials App Store Connect