# Guide de Migration PostGIS pour Eagle Golf

## 🎯 Objectif

Migrer la table `golf_parcours` de coordonnées séparées (latitude/longitude) vers PostGIS pour des performances géospatiales optimales.

## 📋 Étapes de migration

### 1. Préparation

```bash
# Vérifier l'état actuel
npm run test:postgis
```

### 2. Appliquer la migration SQL

**Option A: Via Supabase Dashboard**
1. Se connecter à Supabase Dashboard
2. Aller dans "SQL Editor"
3. Copier le contenu de `supabase/migrations/add_postgis_to_golf_parcours.sql`
4. Exécuter la requête

**Option B: Via Supabase CLI**
```bash
supabase db reset
# ou
supabase migration up
```

### 3. Valider la migration

```bash
# Test de base
npm run test:postgis

# Test complet avec données de test
npm run test:postgis-full
```

## 🔍 Vérifications post-migration

### Cohérence des données
```sql
-- Vérifier que tous les parcours avec lat/lng ont une location PostGIS
SELECT 
  COUNT(*) as total,
  COUNT(CASE WHEN latitude IS NOT NULL AND longitude IS NOT NULL THEN 1 END) as with_coords,
  COUNT(CASE WHEN location IS NOT NULL THEN 1 END) as with_postgis
FROM golf_parcours;
```

### Performance des requêtes
```sql
-- Test de recherche par proximité (doit être < 50ms)
EXPLAIN ANALYZE
SELECT name, ST_Distance(location::geography, ST_Point(2.35, 48.85)::geography) / 1000 as distance_km
FROM golf_parcours 
WHERE ST_DWithin(location::geography, ST_Point(2.35, 48.85)::geography, 50000)
ORDER BY location::geography <-> ST_Point(2.35, 48.85)::geography
LIMIT 20;
```

## ⚡ Nouvelles fonctionnalités disponibles

### 1. Recherche par proximité ultra-rapide
```typescript
// Avant (lent - calcul côté client)
const nearby = await golfParcoursService.searchNearbyGolfCourses(48.85, 2.35, 50);

// Après (rapide - index spatial PostGIS)
// Même API, mais utilise automatiquement PostGIS si disponible
```

### 2. Clustering géographique
```sql
-- Statistiques par département avec centres géographiques
SELECT * FROM get_golf_parcours_department_stats();
```

### 3. Requêtes géospatiales avancées
```sql
-- Parcours dans un polygone
SELECT name FROM golf_parcours 
WHERE ST_Within(location, ST_GeomFromText('POLYGON(...)'));

-- Distance entre deux parcours
SELECT ST_Distance(a.location::geography, b.location::geography) / 1000 as km
FROM golf_parcours a, golf_parcours b
WHERE a.id = 'uuid1' AND b.id = 'uuid2';
```

## 🔄 Compatibilité

### Avant migration
- ✅ Recherches basiques fonctionnent
- ❌ Performances lentes pour les recherches géographiques
- ❌ Pas de requêtes géospatiales avancées

### Après migration
- ✅ Toutes les fonctions existantes continuent de fonctionner
- ✅ Performance optimisée automatiquement
- ✅ Nouvelles fonctionnalités PostGIS disponibles
- ✅ Fallback automatique si PostGIS indisponible

## 🐛 Résolution de problèmes

### Migration échoue
```sql
-- Vérifier que PostGIS est installé
SELECT PostGIS_Version();

-- Vérifier les permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
```

### Données incohérentes
```sql
-- Re-synchroniser location à partir de lat/lng
UPDATE golf_parcours 
SET location = ST_Point(longitude, latitude)
WHERE latitude IS NOT NULL 
  AND longitude IS NOT NULL;
```

### Performance dégradée
```sql
-- Vérifier les index spatiaux
SELECT schemaname, tablename, indexname, indexdef
FROM pg_indexes 
WHERE tablename = 'golf_parcours' 
  AND indexname LIKE '%location%';

-- Recréer les index si nécessaire
REINDEX INDEX idx_golf_parcours_location;
```

## 📊 Métriques de performance attendues

| Opération | Avant | Après | Amélioration |
|-----------|-------|-------|--------------|
| Recherche 20 parcours proches | ~200-500ms | ~10-30ms | **10-20x plus rapide** |
| Clustering par département | ~1-2s | ~50-100ms | **20x plus rapide** |
| Calcul de distance | Côté client | Côté serveur | **Précision géodésique** |

## 🎉 Bénéfices

1. **Performance** : Recherches géographiques 10-20x plus rapides
2. **Précision** : Calculs géodésiques professionnels
3. **Évolutivité** : Prêt pour fonctionnalités avancées (zones, routes)
4. **Compatibilité** : Aucune régression, amélioration transparente
5. **Standards** : Utilisation d'OGC et standards géospatiaux

## 🚀 Prochaines étapes

1. **Phase 1** : Migration de base ✅
2. **Phase 2** : Optimisation des requêtes de clustering
3. **Phase 3** : Fonctionnalités avancées (zones de couverture des pros)
4. **Phase 4** : Calcul d'itinéraires et temps de trajet

---

*Cette migration améliore significativement les performances sans impact sur le code existant.*