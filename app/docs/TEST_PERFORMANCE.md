# 🧪 Guide de Test des Améliorations de Performance

## 📊 Métriques à Observer

### 1. **Cache Hit Rate** (Taux de cache)
- **Avant** : 0% (aucun cache)
- **Après** : 70-90% après la première visite
- **Comment tester** : Naviguer entre les profils déjà visités

### 2. **Temps de Chargement**
- **Avant** : 2-3 secondes par profil
- **Après** : <500ms pour les profils en cache
- **Comment tester** : Chronométrer l'affichage du profil

### 3. **Nombre d'Appels API**
- **Avant** : 4 appels par profil (profile, availabilities, pricing, stats)
- **Après** : 1 appel agrégé
- **Comment tester** : Observer l'onglet Network

## 🎯 Tests à Effectuer

### Test 1 : Cache et Préchargement
```bash
1. Ouvrir l'app et aller sur l'écran "Pros"
2. Observer le Network dans Chrome DevTools
3. Survoler une carte ProCard (sans cliquer)
   → Le profil se précharge en arrière-plan
4. Cliquer sur la carte
   → Le profil s'affiche instantanément (depuis le cache)
5. Revenir en arrière et recliquer
   → Aucun appel API (100% cache)
```

### Test 2 : Optimistic UI des Favoris
```bash
1. Ouvrir un profil pro
2. Cliquer sur le cœur pour ajouter aux favoris
   → Changement instantané (pas d'attente)
3. Si erreur réseau → Rollback automatique
```

### Test 3 : Skeleton Screens
```bash
1. Forcer un refresh (pull-to-refresh)
2. Observer les skeleton loaders animés
   → Meilleure perception de vitesse
```

### Test 4 : Service Agrégé
```bash
1. Ouvrir Chrome DevTools > Network
2. Filtrer par "supabase"
3. Ouvrir un nouveau profil
   → 1 seule requête "get_aggregated_pro_profile" (si RPC existe)
   → Ou fallback avec appels parallèles
```

## 🛠️ Outils de Test

### Chrome DevTools
```bash
# Performance Tab
1. Ouvrir DevTools (F12)
2. Aller dans l'onglet "Performance"
3. Cliquer sur "Record" 🔴
4. Naviguer vers un profil
5. Arrêter l'enregistrement
6. Analyser :
   - FPS (doit rester à 60)
   - Network requests
   - Main thread activity
```

### React DevTools
```bash
# Profiler
1. Installer React DevTools
2. Aller dans l'onglet "Profiler"
3. Enregistrer une session
4. Observer :
   - Render times
   - Component updates
   - Wasted renders
```

### Network Throttling
```bash
# Tester sur réseau lent
1. DevTools > Network
2. Sélectionner "Slow 3G"
3. Naviguer dans l'app
4. Observer :
   - Cache efficace même en 3G
   - Skeleton screens pendant le chargement
   - Préchargement intelligent
```

## 📈 Métriques de Succès

| Test | Métrique | Objectif | Comment Mesurer |
|------|----------|----------|-----------------|
| Premier chargement | Time to Interactive | <1s | Performance tab |
| Navigation répétée | Cache Hit Rate | >80% | Network tab |
| Appels API | Requêtes par profil | 1 | Network tab |
| Favoris | Temps de réponse | Instantané | Visuel |
| Scroll liste | FPS | 60fps | Performance monitor |
| Préchargement | Profils préchargés | >3 | Console logs |

## 🔍 Debug et Logs

### Activer les logs de performance
```typescript
// Dans app/(tabs)/pros.tsx
const handleCardHover = (profileId: string) => {
  console.log(`📦 Préchargement du profil: ${profileId}`);
};

// Dans hooks/useProProfile.ts
console.log('✅ Cache HIT pour:', profileId);
console.log('❌ Cache MISS pour:', profileId);
console.log('⏱️ Temps de chargement:', Date.now() - startTime, 'ms');
```

### Observer React Query DevTools
```bash
npm install @tanstack/react-query-devtools
```

```typescript
// Dans app/_layout.tsx
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

// Ajouter dans le JSX
{__DEV__ && <ReactQueryDevtools />}
```

## 🎮 Scénarios de Test Complets

### Scénario 1 : Nouveau Visiteur
1. Clear cache (Settings > Clear Data)
2. Ouvrir l'app
3. Naviguer vers Pros
4. Cliquer sur 3 profils différents
5. Revenir et recliquer sur les mêmes
   → Doit être instantané la 2e fois

### Scénario 2 : Utilisateur Régulier
1. App déjà utilisée (cache chaud)
2. Pull-to-refresh sur la liste
3. Observer que seuls les nouveaux profils sont chargés
4. Les anciens restent en cache

### Scénario 3 : Mauvaise Connexion
1. Activer le mode Avion
2. Naviguer vers un profil déjà visité
   → Doit s'afficher depuis le cache
3. Essayer un nouveau profil
   → Message d'erreur avec "Réessayer"

## 💡 Tips de Test

1. **Vider le cache** : Settings > Storage > Clear Cache
2. **Forcer le refresh** : Pull-to-refresh ou Cmd+R
3. **Observer les animations** : Les skeletons doivent être fluides
4. **Tester sur device réel** : Les performances peuvent varier
5. **Mesurer plusieurs fois** : Faire une moyenne sur 5 tests

## 🐛 Problèmes Courants

### Cache non fonctionnel
- Vérifier que QueryClient est bien configuré
- Vérifier les staleTime et cacheTime

### Préchargement non déclenché
- Vérifier onPressIn sur ProCard
- Vérifier que prefetchProfile est appelé

### Skeleton qui reste bloqué
- Vérifier que isLoading passe bien à false
- Vérifier les erreurs dans la console

## 📱 Test sur Mobile

```bash
# iOS Simulator
1. Shake device (Cmd+D)
2. Show Performance Monitor
3. Observer FPS et RAM

# Android
1. adb shell dumpsys gfxinfo com.eagle
2. Observer frame time
```