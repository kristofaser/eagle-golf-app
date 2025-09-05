# CLAUDE.md

Ce fichier fournit des conseils à Claude Code (claude.ai/code) pour travailler avec le code dans ce dépôt. nous sommes en juillet 2025.

## Commandes de Développement

### Exécution de l'Application

- `npm start` - Démarre le serveur de développement Expo
- `npm run android` - Démarre sur un appareil/émulateur Android
- `npm run ios` - Démarre sur un appareil/simulateur iOS
- `npm run web` - Démarre la version web

### Outils de Développement

- `npm test` - Exécute les tests Jest en mode watch
- `npx eslint .` - Exécute le linting ESLint
- `npx prettier --check .` - Vérifie le formatage Prettier
- `npx prettier --write .` - Formate le code avec Prettier

Note : Le projet utilise à la fois ESLint et Prettier avec une configuration TypeScript stricte.

## Architecture

### Structure du Projet

Il s'agit d'une application Expo React Native utilisant les principes de Clean Architecture :

- `app/` - Routage basé sur les fichiers Expo Router
  - `(tabs)/` - Écrans de navigation par onglets (index, parcours, profile)
  - `(auth)/` - Écrans d'authentification (login, register, forgot-password)
  - `profile/[id].tsx` - Écran de détail de profil dynamique
  - `parcours/` - Pages de parcours (listing et détails)
  - `_layout.tsx` - Layout racine avec navigation Stack
- `components/` - Pattern Atomic Design
  - `atoms/` - Composants UI de base
  - `molecules/` - Composants composites (ContentCard, SearchBar)
  - `organisms/` - Composants complexes (SearchOverlay, BlurredContent, SplashScreen)
- `hooks/` - Hooks React personnalisés (useResponsiveCardSize, useSupabase)
- `utils/` - Fonctions utilitaires organisées par catégorie
- `__tests__/` - Fichiers de tests

### Détails Techniques Clés

**Configuration TypeScript :**

- Mode strict activé avec des vérifications supplémentaires (noImplicitReturns, noFallthroughCasesInSwitch, etc.)
- Alias de chemins configurés pour des imports propres :
  - `@/*` correspond à la racine
  - `@/components/*` correspond aux composants
  - `@/hooks/*`, `@/utils/*`, etc.

**Navigation :**

- Utilise Expo Router avec routage basé sur les fichiers
- Layout par onglets avec 3 écrans : Accueil, Parcours, Profil
- Navigation Stack pour les détails de profil avec présentation card
- Route initiale est `(tabs)`

**Styles & Animation :**

- Animations de cartes personnalisées avec gestion des gestes
- Utilise React Native Reanimated v3 et Gesture Handler
- Effets Expo Blur disponibles

**Gestion d'État :**

- Utilise actuellement l'état local
- Migration prévue vers Zustand pour l'état global
- Contexte d'authentification avec Supabase (AuthProvider)

**Backend & Authentification :**

- Supabase pour le backend (auth, database, storage, realtime)
- Hooks d'authentification disponibles :
  - `useAuth()` - Connexion, inscription, déconnexion
  - `useUser()` - Données utilisateur et profil
  - `useSession()` - Gestion de session et tokens
  - `usePermissions()` - Vérification des permissions
  - `useProtectedRoute()` - Protection des routes

### Contexte de Développement

Ce projet suit une approche de développement par phases :

- Phase 1 : Fondations (✅ Terminé)
- Phase 2 : Développement UI-First (✅ Terminé)
- Phase 3 : Intégration Backend Supabase (🚧 En cours)

L'application utilise maintenant de vraies données depuis Supabase. Les principales fonctionnalités (authentification, profils, parcours, disponibilités) sont opérationnelles. L'application utilise la langue française pour les libellés UI.

### Règles de Qualité du Code

**Configuration ESLint :**

- Règles TypeScript strictes sans `any` explicite
- Intégration Prettier pour un formatage cohérent
- Vérification exhaustive des deps des hooks React
- Préférer const à let/var

**Paramètres Prettier :**

- Indentation 2 espaces
- Largeur de ligne 100 caractères
- Guillemets simples
- Virgules finales dans les contextes ES5
- Points-virgules activés

Lors du travail avec cette base de code, toujours exécuter les commandes de linting et de formatage après avoir effectué des modifications pour maintenir les standards de qualité du code.
