# Configuration d'un utilisateur administrateur

## 🔐 Création d'un administrateur

Pour créer un utilisateur administrateur dans Eagle Admin, suivez ces étapes :

### 1. Créer l'utilisateur dans Supabase Auth

1. Allez dans le [Dashboard Supabase](https://supabase.com/dashboard/project/vrpsulmidpgxmkybgtwn)
2. Naviguez vers **Authentication > Users**
3. Cliquez sur **Invite User** ou **Create New User**
4. Utilisez ces informations :
   - **Email** : `admin@eagle.golf` (ou votre email)
   - **Password** : Choisissez un mot de passe sécurisé
5. Notez l'**User ID** (UUID) généré

### 2. Assigner le rôle admin

Une fois l'utilisateur créé, exécutez cette requête SQL dans **SQL Editor** :

```sql
-- Remplacez 'USER_ID_HERE' par l'UUID de l'utilisateur créé
DO $$
DECLARE
  admin_role_id UUID;
BEGIN
  -- Récupérer l'ID du rôle admin
  SELECT id INTO admin_role_id FROM public.roles WHERE name = 'admin';
  
  -- Assigner le rôle admin à l'utilisateur
  INSERT INTO public.user_roles (user_id, role_id, granted_at)
  VALUES ('USER_ID_HERE', admin_role_id, NOW())
  ON CONFLICT (user_id, role_id) DO NOTHING;
  
  RAISE NOTICE 'Rôle admin assigné avec succès';
END $$;
```

### 3. Vérifier l'installation

Pour vérifier que l'utilisateur a bien le rôle admin :

```sql
-- Vérifier les rôles d'un utilisateur
SELECT 
  p.email,
  p.first_name,
  p.last_name,
  r.name as role_name,
  ur.granted_at
FROM public.profiles p
JOIN public.user_roles ur ON p.id = ur.user_id
JOIN public.roles r ON ur.role_id = r.id
WHERE p.email = 'admin@eagle.golf';
```

## 📊 Structure des rôles

Le système de rôles créé comprend :

### Rôles disponibles

1. **admin** - Accès complet
   - Gestion des utilisateurs
   - Gestion des réservations
   - Accès aux paiements
   - Analytics
   - Paramètres

2. **support** - Support client
   - Lecture des utilisateurs
   - Gestion des réservations
   - Gestion du support

3. **accountant** - Comptable
   - Lecture des paiements
   - Lecture des réservations
   - Accès aux analytics

### Fonctions utiles

```sql
-- Vérifier si un utilisateur a un rôle spécifique
SELECT public.has_role('USER_ID_HERE', 'admin');

-- Obtenir toutes les permissions d'un utilisateur
SELECT public.get_user_permissions('USER_ID_HERE');
```

## 🔒 Sécurité

- Les politiques RLS sont en place pour protéger les tables
- Seuls les admins peuvent gérer les rôles
- Les utilisateurs peuvent voir uniquement leurs propres rôles
- Le middleware Next.js vérifiera ces rôles pour protéger les routes

## 🚀 Prochaines étapes

1. Créer au moins un utilisateur admin
2. Tester la connexion sur `/login`
3. Vérifier l'accès au dashboard admin
4. Configurer d'autres utilisateurs selon les besoins