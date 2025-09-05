# Eagle Admin - Backoffice

Backoffice pour l'application Eagle Golf - Plateforme de mise en relation entre golfeurs amateurs et professionnels.

## 🚀 Installation

```bash
# Installer les dépendances
npm install

# Configurer les variables Supabase dans .env.local
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Lancer le serveur de développement
npm run dev
```

Ouvrir [http://localhost:3000](http://localhost:3000) dans votre navigateur.

## 📁 Structure du projet

```
src/
├── app/
│   ├── (auth)/          # Pages d'authentification
│   │   └── login/
│   ├── (admin)/         # Pages admin protégées
│   │   ├── dashboard/   # Dashboard principal
│   │   ├── users/       # Gestion utilisateurs
│   │   ├── bookings/    # Gestion réservations
│   │   ├── courses/     # Gestion parcours
│   │   ├── payments/    # Gestion paiements
│   │   ├── analytics/   # Analytics
│   │   ├── support/     # Support client
│   │   └── settings/    # Paramètres
│   └── api/
│       └── webhooks/    # Webhooks Stripe, etc.
├── components/
│   ├── ui/             # Composants UI réutilisables
│   ├── layout/         # Layout components (Sidebar, Header)
│   └── features/       # Composants métier
├── lib/
│   ├── supabase/       # Configuration Supabase
│   └── utils/          # Fonctions utilitaires
├── types/              # Types TypeScript
└── hooks/              # React hooks personnalisés
```

## 🔑 Authentification

L'authentification est gérée via Supabase Auth avec un middleware Next.js qui protège les routes admin.

## 🛠️ Technologies

- **Framework**: Next.js 15 avec App Router et Turbopack
- **UI**: Tailwind CSS v4
- **Backend**: Supabase (Auth, Database, Storage)
- **Forms**: React Hook Form + Zod
- **Tables**: TanStack Table
- **Charts**: Recharts
- **Icons**: Lucide React

## 📊 Modules disponibles

- ✅ Dashboard avec KPIs
- ✅ Page de connexion
- ✅ Layout admin avec sidebar
- 🚧 Gestion utilisateurs
- 🚧 Gestion réservations
- 🚧 Gestion parcours
- 🚧 Module financier
- 🚧 Analytics
- 🚧 Support client

## 🚀 Déploiement

```bash
# Build pour production
npm run build

# Démarrer en production
npm start
```

Recommandé: Déployer sur Vercel pour une intégration optimale avec Next.js.