# Guide de Test - Unification des Hooks d'Upload d'Images

## ✅ Ce qui a été fait

### 🔄 Migration complète
- **7 hooks supprimés** (1234 lignes) → **1 hook unifié** (460 lignes)
- **774 lignes de code économisées**
- Tous les composants migrés avec succès
- Wrappers de compatibilité pour éviter de casser le code existant

### 📁 Fichiers modifiés
1. `app/profile/edit.tsx` - Photo de profil
2. `app/become-pro.tsx` - Documents d'identité
3. `services/document-upload.service.ts` - Service d'upload

## 🧪 Tests Manuels à Effectuer

### 1. Démarrer l'application
```bash
cd app
npm start
```
Puis scanner le QR code avec Expo Go ou lancer sur simulateur.

### 2. Test de la Photo de Profil

**Où tester :** Profil → Modifier le profil → "Changer la photo"

**Étapes :**
1. Connectez-vous à l'app
2. Allez dans l'onglet Profil
3. Tapez sur "Modifier le profil"
4. Tapez sur "Changer la photo"
5. **Vérifier que le menu apparaît avec 3 options :**
   - Prendre une photo
   - Choisir dans la galerie
   - Annuler
6. Testez les deux options (photo et galerie)
7. **Vérifier que :**
   - L'image s'affiche correctement en preview
   - Le texte change en "Photo sélectionnée ✓"
   - Après sauvegarde, l'image est uploadée vers Supabase
   - L'avatar se met à jour dans le profil

### 3. Test du Become Pro (Documents)

**Où tester :** Profil → "Devenir Pro"

**Étapes :**
1. Allez dans "Devenir Pro" depuis le profil
2. Remplissez l'étape 1 (infos)
3. À l'étape 2 (Documents) :
   - Tapez sur "Recto de la pièce d'identité"
   - **Vérifier que la sélection d'image fonctionne**
   - Tapez sur "Verso de la pièce d'identité"
   - **Vérifier que la sélection fonctionne aussi**
4. **Vérifier que :**
   - Les images s'affichent en preview
   - Les documents sont uploadés vers Supabase
   - Pas d'erreurs dans la console

### 4. Vérifications dans Supabase

1. Connectez-vous à [Supabase Dashboard](https://supabase.com/dashboard)
2. Allez dans Storage → Buckets
3. **Vérifiez que :**
   - Les avatars sont dans le bucket `avatars`
   - Les documents sont dans le bucket `documents`
   - Les URLs sont accessibles

## 🐛 Débogage

### Si ça ne marche pas :

1. **Vérifier les logs :**
```bash
# Dans le terminal Expo
# Regardez s'il y a des erreurs rouges
```

2. **Vérifier les permissions :**
- iOS : Settings → Eagle → Photos (doit être autorisé)
- Android : Settings → Apps → Eagle → Permissions → Camera/Storage

3. **Vérifier les imports :**
```bash
# Le script de test devrait tout valider
node scripts/test-image-upload-unification.js
```

4. **Si erreur TypeScript :**
```bash
npx tsc --noEmit --skipLibCheck
```

## 📊 Métriques de Succès

✅ **Fonctionnel si :**
- Photo de profil s'upload correctement
- Documents dans become-pro s'uploadent
- Pas d'erreurs dans la console
- Images visibles dans Supabase

## 🚀 Commandes Utiles

```bash
# Lancer l'app
npm start

# Tester l'unification
node scripts/test-image-upload-unification.js

# Voir les logs en temps réel
npm start -- --clear

# Relancer si problème
npx expo start -c  # Clear cache
```

## ⚠️ Points d'Attention

1. **Cache** : Si comportement bizarre, clear le cache avec `npx expo start -c`
2. **Permissions** : Toujours vérifier que l'app a les permissions caméra/photos
3. **Network** : Les uploads nécessitent une connexion internet
4. **Supabase** : Vérifier que les buckets existent (avatars, documents)

## 💡 Améliorations Futures

- [ ] Ajouter une barre de progression pour l'upload
- [ ] Compression automatique des images trop lourdes
- [ ] Retry automatique en cas d'échec réseau
- [ ] Support des formats HEIC sur iOS