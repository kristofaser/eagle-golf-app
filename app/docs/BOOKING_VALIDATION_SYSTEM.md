# Système de Validation des Réservations Eagle

## Vue d'Ensemble

Le système de validation des réservations Eagle permet aux administrateurs de valider manuellement chaque réservation avant qu'elle soit confirmée auprès du golf.

## Workflow

```
Amateur → Paiement → Réservation pending → Admin validation → Réservation golf → Confirmation
```

## Architecture

### 1. Modification du Service de Paiement

**Fichier :** `services/payment.service.ts:167`

```typescript
// Avant : Confirmation automatique
status: 'confirmed'

// Après : Validation manuelle requise
status: 'pending',
admin_validation_status: 'pending'
```

### 2. Edge Function (Contournement RLS)

**Fichier :** `supabase/functions/create-booking-validation/index.ts`

- Contourne les politiques RLS avec `service_role`
- Crée les entrées `admin_booking_validations`
- Gère les doublons et erreurs

### 3. API de Validation Backoffice

**Fichier :** `eagle-admin/src/app/api/bookings/[id]/validate/route.ts`

**Actions disponibles :**
- `confirm` : Valide et réserve auprès du golf
- `reject` : Rejette la réservation
- `checking` : Met en statut vérification
- `alternative` : Propose une alternative

### 4. Interface Admin

**Fichier :** `eagle-admin/src/app/(admin)/bookings/BookingsClient.tsx:165`

- Boutons d'action pour chaque réservation pending
- Gestion erreurs et feedback utilisateur
- Statistiques des validations

### 5. Service API Golf

**Fichier :** `eagle-admin/src/lib/golf-api.ts`

- Support multi-providers (CronoGolf, TeeTime, Golf Manager)
- Mode simulation pour développement
- Gestion erreurs et retry automatique

## Système d'Authentification Admin

### Table admin_users

```sql
CREATE TABLE admin_users (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES profiles(id),
  role TEXT CHECK (role IN ('admin', 'super_admin', 'moderator')),
  permissions JSONB,
  is_active BOOLEAN
);
```

### Fonctions de Sécurité

```sql
-- Vérifie si un utilisateur a un rôle
has_role(user_uuid UUID, role_name TEXT) → BOOLEAN

-- Vérifie si l'utilisateur actuel est admin  
is_admin() → BOOLEAN

-- Récupère les infos admin complètes
get_admin_info(user_uuid UUID) → TABLE(...)
```

### Admin Configuré

- **Email :** christophe@eagle.com
- **Mot de passe :** Admin123!@#
- **Rôle :** super_admin
- **Permissions :** manage_bookings, manage_users, manage_courses, view_analytics

## Sécurité

### RLS Policies

- **admin_users :** Seuls les super_admins voient tous les admins
- **admin_booking_validations :** Seuls les admins peuvent gérer
- **Middleware :** Vérifie `has_role()` pour protéger les routes

### Protection API

- Routes `/api/*` exclues du middleware
- Validation admin dans chaque endpoint
- Service client avec privilèges élevés

## Points d'Intégration

### 1. Application Mobile (Eagle)

- **Payment Service :** Crée réservations en `pending`
- **Edge Function :** Appel automatique après paiement
- **Notifications :** Amateur informé du statut pending

### 2. Backoffice Admin (eagle-admin)

- **Dashboard :** Affiche réservations pending
- **Actions :** Validation/rejet en un clic
- **Golf API :** Réservation automatique lors validation

### 3. Golf Courses

- **API Integration :** Booking automatique via service
- **Multi-Provider :** Support différentes plateformes
- **Fallback :** Gestion erreurs gracieuse

## Troubleshooting

### Erreurs Communes

1. **RLS Violation :** Utiliser Edge Function avec service_role
2. **401 Unauthorized :** Vérifier middleware et authentification admin
3. **UUID Invalid :** Utiliser vrais admin_id de la table admin_users

### Scripts de Diagnostic

- `scripts/validate-admin-setup.js` : Valide configuration
- `scripts/create-admin-auth.js` : Crée admin complet
- `scripts/create-table-admin.js` : Instructions migration

## Évolutions Futures

### Phase 1 : Améliorations UX
- Notifications push pour admins
- Interface mobile admin
- Batch validation

### Phase 2 : Automatisation
- Règles de validation automatique
- ML pour suggestions
- Intégration calendrier golf

### Phase 3 : Analytics
- Dashboard métriques validation
- Temps de réponse admin
- Satisfaction client