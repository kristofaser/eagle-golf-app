# 📚 Guide de Migration - Refactoring AuthContext

## 🎯 Objectif
Diviser le monolithique AuthContext (725 lignes) en 3 contextes spécialisés pour améliorer la maintenabilité et les performances.

## 🏗️ Nouvelle Architecture

### Avant (1 contexte monolithique)
```
AuthContext (725 lignes)
├── Authentification
├── Gestion profil
├── Session
└── Tout mélangé
```

### Après (3 contextes spécialisés)
```
AppProviders
├── SessionContext (~100 lignes)
│   ├── État session
│   ├── Listener auth state
│   └── Refresh token
├── UserContext (~250 lignes)
│   ├── Chargement profil
│   ├── Mise à jour profil
│   └── Gestion compte
└── AuthContext (~350 lignes)
    ├── Connexion/Inscription
    ├── OAuth/Magic Link
    └── Réinitialisation
```

## 📝 Changements d'API

### Imports - Avant
```typescript
import { useAuthContext } from '@/contexts/AuthContext';

const {
  user,
  session,
  loading,
  signIn,
  updateProfile,
  // ... tout dans un seul hook
} = useAuthContext();
```

### Imports - Après
```typescript
// Option 1 : Hooks spécialisés (recommandé)
import { useAuth } from '@/contexts/AppProviders';
import { useSession, useSessionUser } from '@/contexts/AppProviders';
import { useProfile } from '@/contexts/AppProviders';

const { signIn, signOut } = useAuth();
const session = useSession();
const user = useSessionUser();
const profile = useProfile();

// Option 2 : Hook combiné (compatibilité)
import { useAuthState } from '@/contexts/AppProviders';

const { session, user, profile, isAuthenticated } = useAuthState();
```

## 🔄 Guide de Migration

### 1. Mise à jour du Provider Principal

**Avant (_layout.tsx)**
```typescript
import { AuthProvider } from '@/contexts/AuthContext';

export default function RootLayout() {
  return (
    <AuthProvider>
      {/* ... */}
    </AuthProvider>
  );
}
```

**Après (_layout.tsx)**
```typescript
import { AppProviders } from '@/contexts/AppProviders';

export default function RootLayout() {
  return (
    <AppProviders>
      {/* ... */}
    </AppProviders>
  );
}
```

### 2. Migration des Composants

#### Composants d'Authentification
```typescript
// Avant
const { signIn, signUp, signOut } = useAuthContext();

// Après
import { useAuth } from '@/contexts/AppProviders';
const { signIn, signUp, signOut } = useAuth();
```

#### Composants de Profil
```typescript
// Avant
const { user, updateProfile } = useAuthContext();

// Après
import { useSessionUser } from '@/contexts/AppProviders';
import { useUserContext } from '@/contexts/UserContext';

const user = useSessionUser();
const { updateProfile } = useUserContext();
```

#### Gardes de Route
```typescript
// Avant
const { session, loading } = useAuthContext();

// Après
import { useSession } from '@/contexts/AppProviders';
const session = useSession();
```

## 📊 Mapping des Fonctions

| Fonction | Ancien Contexte | Nouveau Contexte |
|----------|----------------|------------------|
| signIn | AuthContext | AuthContext |
| signUp | AuthContext | AuthContext |
| signOut | AuthContext | AuthContext |
| signInWithProvider | AuthContext | AuthContext |
| signInWithMagicLink | AuthContext | AuthContext |
| verifyOtp | AuthContext | AuthContext |
| resendOtp | AuthContext | AuthContext |
| resetPassword | AuthContext | AuthContext |
| updateProfile | AuthContext | UserContext |
| deleteAccount | AuthContext | UserContext |
| updateEmail | AuthContext | UserContext |
| updatePassword | AuthContext | UserContext |
| refreshSession | AuthContext | SessionContext |
| session (state) | AuthContext | SessionContext |
| user (state) | AuthContext | SessionContext |
| loading (state) | AuthContext | Chaque contexte |

## ⚠️ Breaking Changes

1. **useAuthContext()** n'existe plus - utiliser les hooks spécialisés
2. **loading** est maintenant géré par chaque contexte séparément
3. **error** est maintenant géré par chaque contexte séparément
4. Les imports doivent être mis à jour dans tous les fichiers

## 🚀 Étapes de Migration

### Phase 1 : Préparation (Fait ✅)
- [x] Créer SessionContext.tsx
- [x] Créer UserContext.tsx
- [x] Créer AuthContext.refactored.tsx
- [x] Créer AppProviders.tsx

### Phase 2 : Migration (En cours)
- [x] Remplacer AuthProvider par AppProviders dans _layout.tsx
- [x] Migrer les hooks useAuth et useUser
- [x] Migrer les écrans d'authentification
- [x] Migrer les écrans de profil
- [ ] Vérifier tous les composants
- [ ] Supprimer l'ancien AuthContext.tsx

### Phase 3 : Tests (À faire)
- [ ] Tester la connexion/inscription
- [ ] Tester la mise à jour profil
- [ ] Tester la navigation avec gardes
- [ ] Vérifier les performances
- [ ] Tester la persistance de session
- [ ] Vérifier les re-renders

## 📈 Bénéfices Attendus

### Performance
- **Réduction re-renders** : Chaque contexte ne déclenche que ses propres updates
- **Charge mémoire réduite** : Contextes plus petits et spécialisés
- **Lazy loading** : Possibilité de charger les contextes à la demande

### Maintenabilité
- **Séparation des responsabilités** : Chaque contexte a un rôle unique
- **Code plus lisible** : Fichiers de 100-350 lignes vs 725 lignes
- **Tests simplifiés** : Contextes isolés plus faciles à tester

### Évolutivité
- **Ajouts facilités** : Nouveaux contextes sans toucher aux existants
- **Modifications isolées** : Changements localisés par domaine
- **Réutilisabilité** : Contextes peuvent être utilisés indépendamment

## 🔍 Validation

### Checklist de Validation
- [ ] Connexion email/password fonctionne
- [ ] Connexion OAuth fonctionne
- [ ] Inscription avec OTP fonctionne
- [ ] Mise à jour profil fonctionne
- [ ] Déconnexion fonctionne
- [ ] Navigation protégée fonctionne
- [ ] Pas de régression de performance
- [ ] Pas d'erreurs console

## 📞 Support

En cas de problème durant la migration :
1. Vérifier l'ordre des providers dans AppProviders
2. Vérifier les imports dans les composants
3. Consulter le mapping des fonctions ci-dessus
4. Revenir temporairement à l'ancien AuthContext si blocage

## 🔄 État de la Migration

### ✅ Complété
- Création des 3 nouveaux contextes
- Mise à jour du provider principal (_layout.tsx)
- Migration des hooks useAuth et useUser
- Suppression des imports de l'ancien AuthContext

### 🚧 En cours
- Vérification de tous les composants
- Tests de non-régression

### 📅 Prochaines étapes
- Supprimer l'ancien AuthContext.tsx après validation complète
- Optimiser les re-renders avec React.memo
- Documenter les nouveaux patterns d'utilisation