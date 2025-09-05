# 🔌 API REST Supabase - Exemples avec curl

Ce fichier contient des exemples pratiques pour interagir avec votre base Supabase via curl.

## 🔧 Configuration

```bash
export SUPABASE_URL="https://vrpsulmidpgxmkybgtwn.supabase.co"
export SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZycHN1bG1pZHBneG1reWJndHduIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI1ODQ1NzIsImV4cCI6MjA2ODE2MDU3Mn0.yGfN7I4UFnF3vPtCw99FOxt91usotHjryBwsAc8eXeQ"
```

## 📊 Requêtes de lecture (SELECT)

### Lister tous les profils
```bash
curl -H "apikey: $SUPABASE_ANON_KEY" \
     -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
     "$SUPABASE_URL/rest/v1/profiles?select=*"
```

### Lister seulement les professionnels
```bash
curl -H "apikey: $SUPABASE_ANON_KEY" \
     -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
     "$SUPABASE_URL/rest/v1/profiles?select=first_name,last_name,city&user_type=eq.pro&limit=5"
```

### Obtenir un profil spécifique
```bash
curl -H "apikey: $SUPABASE_ANON_KEY" \
     -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
     "$SUPABASE_URL/rest/v1/profiles?select=*&id=eq.ac2b1c14-a244-4053-ab1a-b47ea34526cb"
```

### Recherche par ville
```bash
curl -H "apikey: $SUPABASE_ANON_KEY" \
     -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
     "$SUPABASE_URL/rest/v1/profiles?select=first_name,last_name,city&city=ilike.*Paris*"
```

### Jointures - Profil + détails pro
```bash
curl -H "apikey: $SUPABASE_ANON_KEY" \
     -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
     "$SUPABASE_URL/rest/v1/profiles?select=first_name,last_name,pro_profiles(division,skill_driving,skill_putting)&user_type=eq.pro&limit=3"
```

## 🎯 Filtres avancés

### Professionnels avec compétences élevées
```bash
curl -H "apikey: $SUPABASE_ANON_KEY" \
     -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
     "$SUPABASE_URL/rest/v1/pro_profiles?select=user_id,skill_putting,skill_driving&skill_putting=gte.80&order=skill_putting.desc"
```

### Pros pouvant se déplacer
```bash
curl -H "apikey: $SUPABASE_ANON_KEY" \
     -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
     "$SUPABASE_URL/rest/v1/pro_profiles?select=user_id,can_travel,travel_radius_km&can_travel=eq.true"
```

### Recherche textuelle (si FTS activé)
```bash
curl -H "apikey: $SUPABASE_ANON_KEY" \
     -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
     "$SUPABASE_URL/rest/v1/profiles?select=*&first_name=ilike.*Thomas*"
```

## 📈 Agrégations et comptages

### Compter les profils par type
```bash
curl -H "apikey: $SUPABASE_ANON_KEY" \
     -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
     -H "Prefer: count=exact" \
     "$SUPABASE_URL/rest/v1/profiles?select=*&user_type=eq.pro"
```

### Statistiques (avec functions PostgreSQL)
```bash
curl -H "apikey: $SUPABASE_ANON_KEY" \
     -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
     "$SUPABASE_URL/rest/v1/rpc/get_pro_stats" \
     -X POST
```

## ✏️ Opérations d'écriture (avec authentification)

> ⚠️ **Important**: Ces opérations nécessitent une authentification utilisateur valide

### Connexion utilisateur
```bash
curl -X POST \
     -H "apikey: $SUPABASE_ANON_KEY" \
     -H "Content-Type: application/json" \
     -d '{"email": "user@example.com", "password": "motdepasse"}' \
     "$SUPABASE_URL/auth/v1/token?grant_type=password"
```

### Inscription utilisateur
```bash
curl -X POST \
     -H "apikey: $SUPABASE_ANON_KEY" \
     -H "Content-Type: application/json" \
     -d '{"email": "nouvelutilisateur@example.com", "password": "motdepasse"}' \
     "$SUPABASE_URL/auth/v1/signup"
```

### Insérer un nouveau profil (avec token d'auth)
```bash
# D'abord, récupérer le token d'authentification
AUTH_TOKEN="votre_token_jwt_ici"

curl -X POST \
     -H "apikey: $SUPABASE_ANON_KEY" \
     -H "Authorization: Bearer $AUTH_TOKEN" \
     -H "Content-Type: application/json" \
     -H "Prefer: return=representation" \
     -d '{"first_name": "Nouveau", "last_name": "Utilisateur", "user_type": "amateur"}' \
     "$SUPABASE_URL/rest/v1/profiles"
```

### Mettre à jour un profil
```bash
curl -X PATCH \
     -H "apikey: $SUPABASE_ANON_KEY" \
     -H "Authorization: Bearer $AUTH_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"city": "Nouvelle Ville"}' \
     "$SUPABASE_URL/rest/v1/profiles?id=eq.votre_user_id"
```

## 📅 Gestion des réservations

### Lister les réservations
```bash
curl -H "apikey: $SUPABASE_ANON_KEY" \
     -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
     "$SUPABASE_URL/rest/v1/bookings?select=*&limit=10&order=created_at.desc"
```

### Créer une réservation (authentifié)
```bash
curl -X POST \
     -H "apikey: $SUPABASE_ANON_KEY" \
     -H "Authorization: Bearer $AUTH_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{
       "pro_user_id": "ac2b1c14-a244-4053-ab1a-b47ea34526cb",
       "start_time": "2025-08-15T10:00:00Z",
       "duration_minutes": 60,
       "status": "pending"
     }' \
     "$SUPABASE_URL/rest/v1/bookings"
```

## 🔐 Edge Functions

### Appeler une Edge Function
```bash
curl -X POST \
     -H "apikey: $SUPABASE_ANON_KEY" \
     -H "Authorization: Bearer $AUTH_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"param1": "value1"}' \
     "$SUPABASE_URL/functions/v1/your-function-name"
```

## 🗄️ Storage (fichiers)

### Lister les fichiers dans un bucket
```bash
curl -H "apikey: $SUPABASE_ANON_KEY" \
     -H "Authorization: Bearer $AUTH_TOKEN" \
     "$SUPABASE_URL/storage/v1/object/list/avatars"
```

### Uploader un fichier
```bash
curl -X POST \
     -H "apikey: $SUPABASE_ANON_KEY" \
     -H "Authorization: Bearer $AUTH_TOKEN" \
     -F 'file=@/path/to/your/file.jpg' \
     "$SUPABASE_URL/storage/v1/object/avatars/filename.jpg"
```

## 📊 Monitoring et Debug

### Health check de l'API
```bash
curl -I -H "apikey: $SUPABASE_ANON_KEY" "$SUPABASE_URL/rest/v1/"
```

### Vérifier la structure des données (OpenAPI)
```bash
curl -H "apikey: $SUPABASE_ANON_KEY" "$SUPABASE_URL/rest/v1/" | jq '.definitions | keys'
```

### Debug avec headers verbeux
```bash
curl -v -H "apikey: $SUPABASE_ANON_KEY" "$SUPABASE_URL/rest/v1/profiles?limit=1"
```

## 🎛️ Options avancées

### Préférences personnalisées
```bash
# Retourner la représentation complète après INSERT
-H "Prefer: return=representation"

# Compter le nombre total de lignes
-H "Prefer: count=exact"

# Résolution des conflits lors des INSERT
-H "Prefer: resolution=merge-duplicates"
```

### Pagination
```bash
# Offset-based
curl "$SUPABASE_URL/rest/v1/profiles?offset=20&limit=10"

# Range-based (plus efficace)
-H "Range: 20-29"
```

## 🐛 Gestion d'erreurs courantes

### 401 Unauthorized
- Vérifiez que l'apikey est correcte
- Pour les opérations d'écriture, assurez-vous d'avoir un token d'authentification valide

### 404 Not Found
- Vérifiez l'URL et le nom de la table
- Assurez-vous que la table existe et est accessible

### 406 Not Acceptable / 415 Unsupported Media Type
- Ajoutez les headers `Content-Type: application/json` et `Accept: application/json`

### Row Level Security (RLS) errors
- Vérifiez les politiques RLS sur vos tables
- Assurez-vous d'être authentifié pour les opérations qui le nécessitent

---

## 💡 Conseils pratiques

1. **Utilisez jq pour formater le JSON** : `| jq .`
2. **Sauvegardez vos requêtes fréquentes** dans un script
3. **Testez toujours avec limit** pour éviter de gros résultats
4. **Utilisez les filtres** plutôt que de tout récupérer côté client
5. **Consultez la documentation PostgREST** pour les options avancées