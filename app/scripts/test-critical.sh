#!/bin/bash

# Script de test rapide pour développement local
# Usage: npm run test:critical

echo "🧪 Tests critiques rapides..."

# Tests essentiels uniquement (payment + booking)
npm test -- \
  --testPathPattern="(payment|booking)" \
  --passWithNoTests \
  --verbose=false \
  --silent \
  --maxWorkers=1

exit_code=$?

if [ $exit_code -eq 0 ]; then
  echo "✅ Tests critiques OK (payment + booking)"
else
  echo "❌ Échec des tests critiques"
  echo "💡 Lance 'npm test' pour voir les détails"
fi

exit $exit_code