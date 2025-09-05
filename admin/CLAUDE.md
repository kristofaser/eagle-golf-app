# CLAUDE.md

Ce fichier fournit des directives à Claude Code (claude.ai/code) pour travailler avec le code de ce dépôt.

## Vue d'ensemble du projet

Eagle Admin est une application backoffice Next.js 15 pour la plateforme Eagle Golf, qui met en relation les golfeurs amateurs avec des professionnels. Elle utilise Supabase pour l'authentification, la base de données et le stockage.

## Commandes de développement

```bash
# Installer les dépendances
npm install

# Lancer le serveur de développement avec Turbopack
npm run dev

# Build pour la production
npm run build

# Démarrer le serveur de production
npm start

# Lancer le linting
npm lint
```

## Configuration Tailwind CSS v4

Le projet utilise Tailwind CSS v4 avec une approche zero-config. Pas de fichier `tailwind.config.ts` nécessaire. Toute la configuration se fait dans `src/app/globals.css` via les directives `@theme` pour les couleurs personnalisées et `@layer base` pour les styles de base.

## Architecture

### Stack technique
- **Framework**: Next.js 15 avec App Router et Turbopack
- **Styling**: Tailwind CSS v4 (configuration CSS-first, zero-config) avec class-variance-authority
  - Utilise `@theme` pour les couleurs personnalisées
  - Plugins: `@tailwindcss/forms` et `@tailwindcss/typography`
  - Variables CSS pour le support du mode sombre
- **Base de données/Auth**: Supabase avec support SSR
- **Formulaires**: React Hook Form + validation Zod
- **Tables**: TanStack Table
- **Graphiques**: Recharts
- **Icônes**: Lucide React

### Patterns architecturaux clés

#### 1. Architecture des clients Supabase
L'application utilise trois configurations de client Supabase différentes :
- **Client navigateur** (`src/lib/supabase/client.ts`) : Pour les composants côté client
- **Client serveur** (`src/lib/supabase/server.ts`) : Pour les composants serveur avec gestion des cookies
- **Client service** (`src/lib/supabase/server.ts`) : Pour les opérations admin avec la clé de rôle de service

#### 2. Protection des routes
Toutes les routes admin sont protégées via un middleware (`src/middleware.ts`) qui :
- Valide la session utilisateur via Supabase Auth
- Redirige les utilisateurs non authentifiés vers `/login`
- Redirige les utilisateurs authentifiés de `/login` vers `/dashboard`
- Routes protégées : `/dashboard`, `/users`, `/bookings`, `/courses`, `/payments`, `/analytics`, `/support`, `/settings`

#### 3. Structure des layouts
L'application utilise des layouts imbriqués :
- Layout racine : Styles globaux et providers
- Layout auth (`/app/(auth)/layout.tsx`) : Style des pages d'authentification
- Layout admin (`/app/(admin)/layout.tsx`) : Structure Sidebar + Header + Contenu pour les pages protégées

#### 4. Organisation des composants
- `components/ui/` : Composants UI réutilisables
- `components/layout/` : Composants de layout (Sidebar, Header)
- `components/features/` : Composants métier spécifiques

### Variables d'environnement

Requises dans `.env.local` :
```
NEXT_PUBLIC_SUPABASE_URL=votre_url_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=votre_clé_anon_supabase
SUPABASE_SERVICE_ROLE_KEY=votre_clé_service_role
```

### Configuration TypeScript

Le projet utilise TypeScript strict avec tous les flags stricts activés. L'alias de chemin `@/*` correspond à `./src/*`.

### Notes de développement

1. **Flux d'authentification** : Toute la logique d'auth passe par Supabase. Le middleware gère le rafraîchissement de session et la protection des routes.

2. **Récupération des données** : Utiliser le client Supabase approprié selon le contexte :
   - Composants serveur : Utiliser `createClient()` de `server.ts`
   - Composants client : Utiliser `createClient()` de `client.ts`
   - Opérations admin : Utiliser `createServiceClient()` de `server.ts`

3. **Styling** : Le projet utilise Tailwind CSS v4 en mode zero-config (pas de fichier tailwind.config.ts). Configuration dans `globals.css` :
   - Import: `@import "tailwindcss"` avec plugins `@tailwindcss/forms` et `@tailwindcss/typography`
   - Couleurs personnalisées définies dans `@theme` (ex: `--color-primary`, `--color-background`)
   - Variables CSS maintenues pour compatibilité (ex: `--primary`, `--background`)
   - Classes disponibles: `bg-primary`, `text-primary`, `border-primary`, etc.
   - Utilise l'utilitaire `cn()` de `@/lib/utils/cn` pour les classes conditionnelles

4. **Formulaires** : Tous les formulaires doivent utiliser React Hook Form avec des schémas Zod pour la validation.

5. **Routes protégées** : Les nouvelles pages admin doivent être ajoutées sous `src/app/(admin)/` pour hériter automatiquement du layout admin et de la protection.