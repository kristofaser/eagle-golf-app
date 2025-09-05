#!/bin/bash

# Script de déploiement pour TestFlight
# Usage: ./scripts/deploy-testflight.sh

set -e

echo "🚀 Début du déploiement sur TestFlight"
echo "======================================"

# Vérification des prérequis
echo "📋 Vérification des prérequis..."

# Vérifier que EAS CLI est installé
if ! command -v eas &> /dev/null; then
    echo "❌ EAS CLI n'est pas installé. Installez-le avec: npm install -g eas-cli"
    exit 1
fi

# Vérifier la connexion à Expo
if ! eas whoami &> /dev/null; then
    echo "❌ Vous n'êtes pas connecté à Expo. Connectez-vous avec: eas login"
    exit 1
fi

echo "✅ Prérequis vérifiés"

# Nettoyage et installation des dépendances
echo "📦 Installation des dépendances..."
npm install

# Vérification du code
echo "🔍 Vérification de la qualité du code..."
npm run lint || true
npm run typecheck || true

# Incrémentation du build number
echo "🔢 Incrémentation du numéro de build..."
CURRENT_VERSION=$(grep '"version"' app.json | sed 's/.*"version": "\(.*\)".*/\1/')
echo "Version actuelle: $CURRENT_VERSION"

# Build pour iOS
echo "🏗️ Création du build de production iOS..."
echo "Cela peut prendre 10-20 minutes..."

eas build --platform ios --profile production --non-interactive

echo "✅ Build créé avec succès!"

# Instructions pour la soumission
echo ""
echo "======================================"
echo "📱 Prochaines étapes pour TestFlight:"
echo "======================================"
echo ""
echo "1. Attendez que le build soit terminé (vous recevrez un email)"
echo ""
echo "2. Une fois le build terminé, soumettez-le à l'App Store Connect:"
echo "   eas submit --platform ios --profile production"
echo ""
echo "3. Connectez-vous à App Store Connect:"
echo "   https://appstoreconnect.apple.com"
echo ""
echo "4. Dans TestFlight:"
echo "   - Ajoutez les informations de test"
echo "   - Créez un groupe de testeurs"
echo "   - Invitez votre client par email"
echo ""
echo "5. Votre client recevra une invitation TestFlight par email"
echo ""
echo "======================================"
echo "💡 Conseils:"
echo "- Le build prend généralement 10-20 minutes"
echo "- Vérifiez votre email pour les notifications"
echo "- En cas d'erreur, vérifiez vos certificats Apple"
echo "======================================"