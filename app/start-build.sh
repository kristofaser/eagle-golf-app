#!/bin/bash

echo "🏌️ Eagle Golf - Development Build"
echo "================================="
echo ""
echo "Création d'un build de développement pour tester la carte..."
echo ""

# Lancer le build Android
eas build --profile development --platform android --non-interactive

echo ""
echo "Le build est en cours sur les serveurs EAS..."
echo "Vous recevrez un email quand il sera terminé (~15 min)"
echo ""
echo "Une fois terminé :"
echo "1. Téléchargez l'APK depuis le lien fourni"
echo "2. Installez-le sur votre téléphone/émulateur"
echo "3. Lancez : npx expo start --dev-client"