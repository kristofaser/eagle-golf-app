# Test Upload Image - Guide de Debug

## Test maintenant avec Uint8Array

1. **Relance l'app** : `npx expo start -c --port 8082`

2. **Test dans l'app** :
   - Profil → Modifier le profil
   - "Changer la photo"
   - Sélectionner une image

3. **Vérifier les logs** :
   - Vous devriez voir :
     - `Blob created, size: [nombre]`
     - `Uint8Array created, length: [nombre]`
   - Les deux nombres doivent être identiques ou très proches

4. **Après sauvegarde**, vérifier dans Supabase si la taille n'est plus 0

## Si ça ne marche toujours pas

On essaiera avec base64 :

```typescript
// Au lieu de blob/arrayBuffer, on utilisera :
const result = await ImagePicker.launchImageLibraryAsync({
  mediaTypes: ['images'],
  allowsEditing: true,
  aspect: [1, 1],
  quality: 0.8,
  base64: true, // <-- Activer base64
});

// Puis upload avec :
const base64Data = result.assets[0].base64;
const { data, error } = await supabase.storage
  .from('profiles')
  .upload(filePath, decode(base64Data), {
    contentType: 'image/jpeg',
  });
```

## État actuel

✅ **Fonctionnel** :
- Sélection d'image
- Création du blob (4MB)
- Génération de l'URL
- Mise à jour du profil

❌ **Problème** :
- Image uploadée avec taille 0 dans Supabase
- Erreur d'affichage "Unknown image download error"

## Solution probable

Le problème semble venir du client Supabase React Native qui ne gère pas bien les blobs. L'utilisation de Uint8Array devrait résoudre ce problème.