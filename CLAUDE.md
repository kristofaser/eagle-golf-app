# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Structure

Eagle is a monorepo containing two main applications:
- `app/` - React Native mobile application using Expo
- `admin/` - Next.js 15 backoffice web application

Each application has its own package.json, dependencies, and build system.

## Development Commands

### Mobile App (app/)
```bash
cd app
npm install
npm start                    # Start Expo development server
npm run android             # Run on Android device/emulator
npm run ios                 # Run on iOS device/simulator  
npm run web                 # Run web version
npm test                    # Run Jest tests
npm run test:watch          # Run tests in watch mode
npm run test:coverage       # Run tests with coverage report
npm run test:ci             # Run tests for CI (with coverage, max 2 workers)
npm run lint                # Run ESLint
npm run format              # Format code with Prettier
npm run type-check          # TypeScript type checking
```

### Admin Panel (admin/)
```bash
cd admin
npm install
npm run dev                 # Start Next.js dev server with Turbopack
npm run build              # Build for production
npm start                  # Start production server
npm run lint               # Run Next.js linting
```

## Mobile App Architecture (app/)

### Tech Stack
- **Framework**: Expo 53 with React Native 0.79.5
- **Routing**: Expo Router with file-based routing
- **State Management**: Zustand + React Query for server state
- **Backend**: Supabase (auth, database, storage, realtime)
- **Styling**: React Native with custom animations
- **Testing**: Jest with React Native Testing Library
- **Language**: TypeScript (strict mode)

### Key Directory Structure
```
app/
├── app/                    # Expo Router file-based routing
│   ├── (tabs)/            # Tab navigation (index, parcours, profile)
│   ├── (auth)/            # Auth screens (login, register, forgot-password)  
│   ├── booking/           # Booking flow screens
│   ├── parcours/          # Golf course screens
│   └── _layout.tsx        # Root layout with Stack navigation
├── components/            # Atomic Design pattern
│   ├── atoms/            # Basic UI components
│   ├── molecules/        # Composite components
│   └── organisms/        # Complex components
├── contexts/             # React contexts (AuthProvider)
├── hooks/                # Custom React hooks
├── utils/                # Utility functions
├── types/                # TypeScript type definitions
└── __tests__/            # Test files organized by type
```

### Authentication System
Uses Supabase Auth with comprehensive React hooks:
- `useAuth()` - Login, signup, logout
- `useUser()` - User data and profile
- `useSession()` - Session management and tokens  
- `usePermissions()` - Permission checking
- `useProtectedRoute()` - Route protection

### Testing Structure
Jest configuration with comprehensive test organization:
- `__tests__/unit/` - Unit tests
- `__tests__/integration/` - Integration tests  
- `__tests__/e2e/` - End-to-end tests
- `__tests__/contexts/` - Context provider tests
- Coverage thresholds: 60% for branches, functions, lines, statements

### TypeScript Configuration
- Strict mode enabled with additional checks
- Path aliases configured: `@/*` maps to root directory
- Import aliases for clean imports: `@/components/*`, `@/hooks/*`, etc.

### Special Scripts
- `npm run migrate:postgis` - Run PostGIS migration script
- `npm run test:postgis` - Test PostGIS migration
- `npm run test:postgis-full` - Full PostGIS migration test with creation

## Admin Panel Architecture (admin/)

### Tech Stack  
- **Framework**: Next.js 15 with App Router and Turbopack
- **Styling**: Tailwind CSS v4 (zero-config)
- **Backend**: Supabase with SSR support
- **Forms**: React Hook Form + Zod validation
- **Tables**: TanStack Table
- **Charts**: Recharts
- **Language**: TypeScript (strict mode)

### Key Directory Structure
```
admin/src/
├── app/
│   ├── (auth)/           # Auth pages (login)
│   ├── (admin)/          # Protected admin pages
│   │   ├── dashboard/    # Main dashboard
│   │   ├── users/        # User management  
│   │   ├── bookings/     # Booking management
│   │   ├── courses/      # Course management
│   │   ├── payments/     # Payment management
│   │   ├── analytics/    # Analytics
│   │   ├── support/      # Support
│   │   └── settings/     # Settings
│   └── api/              # API routes and webhooks
├── components/
│   ├── ui/              # Reusable UI components
│   ├── layout/          # Layout components (Sidebar, Header)
│   └── features/        # Business-specific components  
├── lib/
│   └── supabase/        # Supabase client configurations
└── types/               # TypeScript definitions
```

### Authentication & Route Protection
- Middleware-based route protection (`src/middleware.ts`)
- Three Supabase client configurations:
  - Browser client for client components
  - Server client for server components with cookie management
  - Service client for admin operations
- Protected routes: `/dashboard`, `/users`, `/bookings`, `/courses`, `/payments`, `/analytics`, `/support`, `/settings`

### Tailwind CSS v4 Configuration
- Zero-config approach (no tailwind.config.ts needed)
- Configuration via CSS in `src/app/globals.css`:
  - Custom colors defined in `@theme` directive
  - CSS variables maintained for compatibility
  - Plugins: `@tailwindcss/forms` and `@tailwindcss/typography`

### Environment Variables
Required in both applications:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key  
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key (admin only)
```

## Development Workflow

### Getting Started
1. Clone repository
2. Set up environment variables in both `app/.env.local` and `admin/.env.local`
3. Install dependencies in both directories: `npm install`
4. Start development servers as needed

### Code Quality Standards
Both applications enforce:
- TypeScript strict mode
- ESLint with TypeScript rules
- Prettier formatting (2 spaces, single quotes, 100 character line width)
- No explicit `any` types allowed

### Testing Strategy
- Mobile app: Comprehensive Jest setup with unit, integration, and e2e test organization
- Admin: Next.js built-in testing support
- Coverage thresholds enforced in mobile app

Always run linting and type checking before committing changes to maintain code quality standards.