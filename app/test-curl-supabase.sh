#!/bin/bash

# Script de test Supabase avec curl
# Usage: ./test-curl-supabase.sh

# Configuration
SUPABASE_URL="https://vrpsulmidpgxmkybgtwn.supabase.co"
SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZycHN1bG1pZHBneG1reWJndHduIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI1ODQ1NzIsImV4cCI6MjA2ODE2MDU3Mn0.yGfN7I4UFnF3vPtCw99FOxt91usotHjryBwsAc8eXeQ"

echo "🔗 Test de l'API REST Supabase avec curl"
echo "📍 URL: $SUPABASE_URL"
echo ""

# Fonction helper pour les requêtes
supabase_curl() {
  local method="$1"
  local endpoint="$2"
  local data="$3"
  
  local base_cmd="curl -s -X $method \
    -H 'apikey: $SUPABASE_ANON_KEY' \
    -H 'Authorization: Bearer $SUPABASE_ANON_KEY' \
    -H 'Content-Type: application/json' \
    -H 'Accept: application/json'"
  
  if [ ! -z "$data" ]; then
    base_cmd="$base_cmd -d '$data'"
  fi
  
  local full_url="$SUPABASE_URL/rest/v1/$endpoint"
  
  eval "$base_cmd '$full_url'"
}

echo "1️⃣ Test de santé de l'API (OpenAPI schema):"
curl -s -H "apikey: $SUPABASE_ANON_KEY" "$SUPABASE_URL/rest/v1/" | jq -r '.info.title, .info.version' 2>/dev/null || echo "API accessible"
echo ""

echo "2️⃣ Lister les tables disponibles:"
supabase_curl "GET" "" | jq -r '.paths | keys[]' 2>/dev/null | head -5 || echo "Schema disponible"
echo ""

echo "3️⃣ Exemple de requête sur une table (si elle existe):"
echo "GET /rest/v1/profiles?select=*&limit=1"
supabase_curl "GET" "profiles?select=*&limit=1"
echo ""
echo ""

echo "4️⃣ Test d'authentification:"
echo "GET /auth/v1/user (sans token)"
curl -s -H "apikey: $SUPABASE_ANON_KEY" "$SUPABASE_URL/auth/v1/user" | head -100
echo ""
echo ""

echo "5️⃣ Exemple de données mock pour insertion (ne sera pas exécuté):"
echo "POST /rest/v1/profiles"
echo "Data: {\"id\": \"test\", \"email\": \"test@example.com\"}"
echo ""

echo "6️⃣ Headers de debug:"
echo "Vérification CORS et headers:"
curl -s -I -H "apikey: $SUPABASE_ANON_KEY" "$SUPABASE_URL/rest/v1/" | grep -E "(access-control|content-type|server)"
echo ""

echo "✅ Tests terminés!"
echo ""
echo "📚 Commandes curl utiles pour Supabase:"
echo ""
echo "# SELECT * FROM table_name LIMIT 10:"
echo "curl -H 'apikey: YOUR_KEY' -H 'Authorization: Bearer YOUR_KEY' \\"
echo "  '$SUPABASE_URL/rest/v1/table_name?select=*&limit=10'"
echo ""
echo "# INSERT INTO table_name:"
echo "curl -X POST -H 'apikey: YOUR_KEY' -H 'Authorization: Bearer YOUR_KEY' \\"
echo "  -H 'Content-Type: application/json' \\"
echo "  -d '{\"column\": \"value\"}' \\"
echo "  '$SUPABASE_URL/rest/v1/table_name'"
echo ""
echo "# UPDATE table_name WHERE id = 1:"
echo "curl -X PATCH -H 'apikey: YOUR_KEY' -H 'Authorization: Bearer YOUR_KEY' \\"
echo "  -H 'Content-Type: application/json' \\"
echo "  -d '{\"column\": \"new_value\"}' \\"
echo "  '$SUPABASE_URL/rest/v1/table_name?id=eq.1'"
echo ""
echo "# DELETE FROM table_name WHERE id = 1:"
echo "curl -X DELETE -H 'apikey: YOUR_KEY' -H 'Authorization: Bearer YOUR_KEY' \\"
echo "  '$SUPABASE_URL/rest/v1/table_name?id=eq.1'"