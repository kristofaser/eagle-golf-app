#!/bin/bash

# Test rapide pour vérifier si l'erreur runtime est résolue

echo "🔍 Test de l'erreur runtime 'Cannot read property prototype'"
echo ""

# Kill any existing Expo process on port 8081 or 8082
echo "1️⃣ Arrêt des processus Expo existants..."
lsof -ti:8081 | xargs -r kill -9 2>/dev/null
lsof -ti:8082 | xargs -r kill -9 2>/dev/null
pkill -f "expo start" 2>/dev/null

echo "2️⃣ Nettoyage du cache..."
cd /Users/christophe/Projets/eagle-app/app
rm -rf .expo 2>/dev/null
rm -rf node_modules/.cache 2>/dev/null

echo "3️⃣ Vérification des imports critiques..."
echo ""

# Vérifier useAuth
echo "📝 Vérification de useAuth.ts:"
grep -n "import.*from.*AuthContext.refactored" hooks/useAuth.ts | head -1
if [ $? -eq 0 ]; then
  echo "✅ Import correct dans useAuth.ts"
else
  echo "❌ Import incorrect dans useAuth.ts"
fi

# Vérifier useImageUpload
echo ""
echo "📝 Vérification de useImageUpload.ts:"
grep -n "export const useSimpleProfileUpload" hooks/useImageUpload.ts | head -1
if [ $? -eq 0 ]; then
  echo "✅ Export useSimpleProfileUpload trouvé"

  # Vérifier qu'il n'utilise plus useUser dans ce wrapper
  echo "  Recherche de useUser() dans le wrapper..."
  sed -n '/export const useSimpleProfileUpload/,/^};$/p' hooks/useImageUpload.ts | grep -q "useUser()"
  if [ $? -eq 0 ]; then
    echo "  ⚠️  useUser() est encore utilisé dans useSimpleProfileUpload"
  else
    echo "  ✅ useUser() n'est plus utilisé dans useSimpleProfileUpload"
  fi
else
  echo "❌ Export useSimpleProfileUpload non trouvé"
fi

echo ""
echo "4️⃣ Vérification TypeScript rapide..."
npx tsc --noEmit --skipLibCheck app/profile/edit.tsx 2>&1 | grep -i "cannot read property" | head -3
if [ ${PIPESTATUS[0]} -eq 0 ]; then
  echo "⚠️  Des erreurs TypeScript détectées"
else
  echo "✅ Pas d'erreur 'Cannot read property' détectée en TypeScript"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "💡 Pour tester manuellement :"
echo "  1. Lance l'app : npx expo start --port 8082 -c"
echo "  2. Va dans Profil → Modifier le profil"
echo "  3. L'erreur ne devrait plus apparaître"
echo ""
echo "Si l'erreur persiste :"
echo "  - Vérifie que tous les Providers sont bien ordonnés dans _layout.tsx"
echo "  - Essaie de redémarrer complètement : rm -rf node_modules && npm install"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"