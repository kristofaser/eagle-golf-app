#!/bin/bash

# Script de déploiement des Edge Functions Supabase
# Usage: ./scripts/deploy-edge-functions.sh

echo "🚀 Déploiement des Edge Functions Supabase..."

# Vérifier si Supabase CLI est installé
if ! command -v supabase &> /dev/null
then
    echo "❌ Supabase CLI n'est pas installé. Installation..."
    npm install -g supabase
fi

# Demander le projet ref si non fourni
PROJECT_REF="fupohozuocumprrlfzfq"

echo "📦 Projet: $PROJECT_REF"

# Vérifier si l'utilisateur est connecté
if ! supabase projects list &> /dev/null; then
    echo "🔐 Connexion requise. Veuillez vous connecter à Supabase..."
    supabase login
fi

# Déployer la fonction delete-user-account
echo "📤 Déploiement de delete-user-account..."
supabase functions deploy delete-user-account \
  --project-ref $PROJECT_REF \
  --no-verify-jwt

if [ $? -eq 0 ]; then
    echo "✅ delete-user-account déployée avec succès!"
else
    echo "❌ Erreur lors du déploiement de delete-user-account"
    exit 1
fi

echo "✨ Déploiement terminé avec succès!"
echo ""
echo "📝 Pour tester la fonction:"
echo "1. Créez un utilisateur de test"
echo "2. Connectez-vous avec cet utilisateur"
echo "3. Supprimez le compte depuis les paramètres"
echo ""
echo "🔍 Pour voir les logs:"
echo "supabase functions logs delete-user-account --project-ref $PROJECT_REF"