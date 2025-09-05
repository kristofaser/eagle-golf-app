# Instructions de déploiement - Gestion des utilisateurs

## Étapes obligatoires avant utilisation

### 1. Migration de la base de données

**Exécuter le script SQL suivant dans Supabase :**

```sql
-- Ajouter les colonnes de suspension à la table profiles
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS is_suspended boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS suspended_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS suspended_by uuid,
ADD COLUMN IF NOT EXISTS suspension_reason text;

-- Ajouter la contrainte de clé étrangère pour suspended_by
ALTER TABLE profiles 
ADD CONSTRAINT fk_profiles_suspended_by 
FOREIGN KEY (suspended_by) REFERENCES admin_profiles(id);

-- Créer les index pour les performances
CREATE INDEX IF NOT EXISTS idx_profiles_is_suspended ON profiles(is_suspended);
CREATE INDEX IF NOT EXISTS idx_profiles_suspended_at ON profiles(suspended_at);

-- Commentaires pour documentation
COMMENT ON COLUMN profiles.is_suspended IS 'Indique si le compte utilisateur est suspendu';
COMMENT ON COLUMN profiles.suspended_at IS 'Date et heure de la suspension';
COMMENT ON COLUMN profiles.suspended_by IS 'ID de l''administrateur ayant effectué la suspension';
COMMENT ON COLUMN profiles.suspension_reason IS 'Raison de la suspension';
```

### 2. Permissions administrateur

**S'assurer que les administrateurs ont les bonnes permissions :**

Les utilisateurs doivent avoir l'une de ces permissions dans `admin_profiles.permissions` :
- `manage_users` : Gestion des utilisateurs mobiles
- `manage_admin_users` : Gestion complète (inclut les utilisateurs mobiles)
- Ou avoir le rôle `super_admin`

### 3. Test des fonctionnalités

**Tester les actions suivantes :**

1. **Suspension** : Vérifier que l'utilisateur ne peut plus se connecter à l'app mobile
2. **Réactivation** : Vérifier que l'accès est restauré
3. **Suppression** : Vérifier que le compte est complètement supprimé
4. **Permissions** : Vérifier que seuls les admins autorisés peuvent effectuer ces actions

## Fonctionnalités implémentées

### Actions disponibles

- ✅ **Suspendre un utilisateur** : Empêche l'accès à l'application mobile
- ✅ **Réactiver un utilisateur** : Restaure l'accès à l'application
- ✅ **Supprimer définitivement** : Supprime le compte et toutes les données associées
- ✅ **Historique de suspension** : Traçabilité des actions administratives

### Sécurité

- ✅ **Vérification des permissions** avant chaque action
- ✅ **Validation côté serveur** avec server actions
- ✅ **Gestion des erreurs** et messages utilisateur
- ✅ **Confirmation obligatoire** pour les actions destructrices
- ✅ **Logs et traçabilité** des actions administratives

### Interface utilisateur

- ✅ **Sidebar détaillée** avec informations complètes
- ✅ **Statut visuel** dans le tableau (badges suspension)
- ✅ **Modals de confirmation** pour chaque action
- ✅ **Messages de succès/erreur** avec auto-masquage
- ✅ **États de loading** pendant les opérations

## Architecture technique

### Server Actions (`/users/actions.ts`)
- `suspendUser(userId, reason)` : Suspend un utilisateur
- `unsuspendUser(userId)` : Réactive un utilisateur
- `deleteUser(userId)` : Supprime définitivement

### Base de données
- Table `profiles` étendue avec colonnes de suspension
- Contraintes de clés étrangères pour traçabilité
- Index pour optimiser les performances

### Composants UI
- `UserDetailsSidebar` : Affichage détaillé avec actions admin
- `ConfirmationModal` : Confirmations sécurisées
- `UsersClient` : Gestion d'état et orchestration

## Gestion d'erreurs

### Cas d'erreurs gérés

- ❌ **Permissions insuffisantes**
- ❌ **Utilisateur non trouvé**
- ❌ **Utilisateur déjà suspendu/actif**
- ❌ **Réservations actives** (bloque la suppression)
- ❌ **Erreurs Supabase Auth/Database**
- ❌ **Erreurs réseau/timeout**

### Feedback utilisateur

- 🟢 **Messages de succès** : Confirmation des actions
- 🔴 **Messages d'erreur** : Explication des problèmes
- ⏳ **États de loading** : Indication du traitement
- 🔄 **Mise à jour automatique** : Synchronisation des données

## Notes importantes

⚠️ **Migration obligatoire** : Exécuter le script SQL avant la première utilisation
⚠️ **Permissions requises** : Vérifier que les admins ont les bonnes permissions
⚠️ **Actions irréversibles** : La suppression est définitive
⚠️ **Impact utilisateur** : La suspension bloque l'accès à l'application mobile