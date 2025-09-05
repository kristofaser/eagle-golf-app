# 🚀 Migration Supabase - Fonction d'Agrégation

## Instructions pour appliquer la migration

### Option 1 : Via le Dashboard Supabase (Recommandé)

1. **Ouvre ton Dashboard Supabase** : https://app.supabase.com
2. **Sélectionne ton projet** Eagle
3. **Va dans l'éditeur SQL** : Menu latéral → SQL Editor
4. **Crée une nouvelle requête** : Bouton "New query"
5. **Copie-colle le SQL** du fichier `/supabase/migrations/20250113_create_aggregated_profile_function.sql`
6. **Exécute** : Bouton "Run" ou Cmd+Enter

### Option 2 : Via Supabase CLI (si configuré)

```bash
# Si tu as Supabase CLI configuré
npx supabase db push
```

## Vérification

Après avoir exécuté la migration, vérifie que la fonction existe :

1. Dans le SQL Editor, exécute :
```sql
-- Tester que la fonction existe
SELECT 
  proname as function_name,
  pronargs as num_arguments
FROM pg_proc 
WHERE proname = 'get_aggregated_pro_profile';
```

2. Test de la fonction (remplace l'UUID par un vrai ID de profil) :
```sql
-- Tester la fonction avec un profil existant
SELECT get_aggregated_pro_profile(
  'REMPLACE_PAR_UN_UUID_DE_PROFIL'::uuid,
  CURRENT_DATE,
  CURRENT_DATE + INTERVAL '7 days'
);
```

## Bénéfices de cette migration

✅ **Performance** : 1 seule requête au lieu de 4
✅ **Optimisation** : Indexes créés pour accélérer les requêtes
✅ **Sécurité** : SECURITY DEFINER pour les permissions
✅ **Cache** : Résultats plus facilement cachables

## En cas d'erreur

Si la fonction existe déjà :
```sql
DROP FUNCTION IF EXISTS public.get_aggregated_pro_profile(UUID, DATE, DATE);
```

Puis réexécute la migration.

## Fallback automatique

Pas d'inquiétude ! Le code a un **fallback automatique** :
- Si la fonction RPC existe → Utilisation optimisée (1 requête)
- Si elle n'existe pas → Fallback sur les 4 requêtes séparées

L'app fonctionne dans les deux cas, mais avec la fonction RPC, elle sera **4x plus rapide** ! 🚀