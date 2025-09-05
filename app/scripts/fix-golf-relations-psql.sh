#!/bin/bash

# Script pour corriger les relations FK vers golf_parcours
# Utilise psql pour se connecter directement à PostgreSQL

echo "🚀 Correction des relations FK golf_course_id..."

# Charger les variables depuis .env.local
if [ -f ".env.local" ]; then
    export $(grep -v '^#' .env.local | xargs)
fi

# Vérifier que l'URL Supabase est définie
if [ -z "$EXPO_PUBLIC_SUPABASE_URL" ]; then
    echo "❌ EXPO_PUBLIC_SUPABASE_URL non définie dans .env.local"
    exit 1
fi

# Extraire les informations de connexion de l'URL Supabase
# Format: https://PROJECT_ID.supabase.co
PROJECT_ID=$(echo $EXPO_PUBLIC_SUPABASE_URL | sed 's/https:\/\/\([^.]*\).*/\1/')

echo "📡 Connexion au projet Supabase: $PROJECT_ID"

# Construire l'URL de connexion PostgreSQL
# Format: postgresql://postgres:[password]@db.[project-id].supabase.co:5432/postgres
DB_URL="postgresql://postgres:[YOUR_DATABASE_PASSWORD]@db.$PROJECT_ID.supabase.co:5432/postgres"

echo ""
echo "⚠️  ATTENTION: Vous devez remplacer [YOUR_DATABASE_PASSWORD] par votre vrai mot de passe de base de données."
echo "    1. Allez sur https://supabase.com/dashboard/project/$PROJECT_ID/settings/database"
echo "    2. Copiez le mot de passe ou générez-en un nouveau"
echo "    3. Modifiez ce script ou passez-le en variable d'environnement"
echo ""

# Commandes SQL à exécuter
SQL_COMMANDS="
-- Migration pour corriger les relations FK vers golf_parcours
BEGIN;

-- Supprimer les anciennes contraintes FK
ALTER TABLE public.bookings 
DROP CONSTRAINT IF EXISTS bookings_golf_course_id_fkey;

ALTER TABLE public.pro_availabilities 
DROP CONSTRAINT IF EXISTS pro_availabilities_golf_course_id_fkey;

-- Créer les nouvelles contraintes FK vers golf_parcours
ALTER TABLE public.bookings 
ADD CONSTRAINT bookings_golf_course_id_fkey 
FOREIGN KEY (golf_course_id) REFERENCES public.golf_parcours(id) ON DELETE CASCADE;

ALTER TABLE public.pro_availabilities 
ADD CONSTRAINT pro_availabilities_golf_course_id_fkey 
FOREIGN KEY (golf_course_id) REFERENCES public.golf_parcours(id) ON DELETE CASCADE;

-- Vérifier les nouvelles contraintes
SELECT 
  tc.table_name,
  tc.constraint_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.constraint_name LIKE '%golf_course_id_fkey%';

COMMIT;

-- Test des jointures
SELECT 'Test jointure pro_availabilities' as test;
SELECT pa.id, gp.name 
FROM public.pro_availabilities pa
JOIN public.golf_parcours gp ON pa.golf_course_id = gp.id
LIMIT 3;
"

echo "📄 Commandes SQL préparées:"
echo "$SQL_COMMANDS"
echo ""
echo "💡 Pour exécuter manuellement:"
echo "   1. Connectez-vous à votre base Supabase via l'interface web"
echo "   2. Allez dans 'SQL Editor'"
echo "   3. Collez et exécutez les commandes SQL ci-dessus"
echo ""
echo "⚡ Ou utilisez psql (si vous avez le mot de passe):"
echo "   psql 'postgresql://postgres:[PASSWORD]@db.$PROJECT_ID.supabase.co:5432/postgres' -c \"$SQL_COMMANDS\""