# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Structure

Eagle is a monorepo containing two main applications:
- `app/` - React Native mobile application using Expo (includes web version via Expo Web)
- `admin/` - Next.js 15 backoffice web application

Each application has its own package.json, dependencies, and build system.

**Note**: The mobile app (`app/`) supports iOS, Android, and Web platforms through Expo. The web version is generated using Expo Web (React Native Web), ensuring 100% code reuse across all platforms.

## Development Commands

### Mobile App (app/)
```bash
cd app
npm install
npm start                    # Start Expo development server
npm run android             # Run on Android device/emulator
npm run ios                 # Run on iOS device/simulator
npm run web                 # Run web version (Expo Web - React Native Web)
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
│   └── logger.ts        # Centralized logging system
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

## Supabase Edge Functions

Located in `app/supabase/functions/`:

### Deployed Functions
- `stripe-webhook` - Handles Stripe payment webhooks (no JWT verification)
- `create-payment-intent` - Creates Stripe payment intents
- `check-payment-status` - Verifies payment status
- `create-booking-validation` - Creates booking validation entries
- `delete-user-account` - Handles account deletion
- `create-availability` - Creates pro availability slots
- `test-create-availability` - Test function for availability

### Function Deployment
```bash
# Deploy single function
npx supabase functions deploy <function-name> --project-ref vrpsulmidpgxmkybgtwn

# Deploy without JWT verification (for webhooks)
npx supabase functions deploy stripe-webhook --no-verify-jwt --project-ref vrpsulmidpgxmkybgtwn
```

## Google Maps API Configuration

### Obtaining an API Key

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create or select a project
3. Enable **Maps SDK for Android**
4. Create credentials → API Key
5. **CRITICAL**: Add restrictions:
   - **API restrictions**: Maps SDK for Android ONLY
   - **Application restrictions**: Android apps → Package `com.cigalo.eagle`
   - **Quotas**: Limit to 10,000 requests/day

### Local Configuration

1. Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```

2. Add your Google Maps API key to `.env.local`:
   ```bash
   GOOGLE_MAPS_API_KEY=your_key_here
   ```

3. **NEVER** commit `.env.local` to Git (already in `.gitignore`)

### How it Works

- The API key is loaded from `.env.local` via `app.config.js`
- At build time, Expo generates `google_maps_api.xml` automatically
- The generated file is ignored by Git (see `.gitignore`)
- On Android: Uses Google Maps SDK with your key
- On iOS: Uses Apple Maps (no Google key needed)
- On Web: Shows a placeholder (maps not supported yet)

### Troubleshooting

**Problem**: "Map not loading" or "Authorization failure"
- Check that `GOOGLE_MAPS_API_KEY` is set in `.env.local`
- Verify the key has correct restrictions in Google Cloud Console
- Rebuild the app: `npm run android`

**Problem**: "API key exposed in Git"
- The key should NEVER be in `google_maps_api.xml` in Git
- Only `.env.local` should contain the key (and it's gitignored)
- If exposed: Revoke immediately and create a new key

## Stripe Integration

### Account Configuration
- **Account**: EAGLE GOLF (acct_1S14QO9rmqqgNzm9)
- **Mode**: Test mode for development
- **Keys**: Stored in `.env.local` (never commit!)

### Payment Flow
1. Client creates payment intent via Edge Function
2. Payment processed through Stripe Payment Element
3. Webhook receives payment confirmation
4. Booking status updated in database
5. Admin manually validates booking after contacting golf course

### Webhook Configuration
- **URL**: `https://vrpsulmidpgxmkybgtwn.supabase.co/functions/v1/stripe-webhook`
- **Events**: `payment_intent.succeeded`, `payment_intent.payment_failed`, `charge.dispute.created`
- **Secret**: Stored in Supabase Edge Function secrets

### Test Scripts
Located in `app/scripts/`:
- `test-stripe-complete.js` - Complete Stripe configuration test
- `test-stripe-signature.js` - Webhook signature validation test
- `test-stripe-webhook.js` - Basic webhook test
- `update-stripe-secrets.sh` - Script to update secrets in Supabase

## Business Process

### Booking Flow
1. **Amateur books a lesson** - Selects pro, date, time
2. **Payment processing** - Stripe handles payment
3. **Automatic payment confirmation** - Webhook updates payment status
4. **Manual validation** - Eagle admin:
   - Calls golf course to confirm availability
   - Validates booking in admin panel
   - Updates status to confirmed
5. **Notification** - Users receive confirmation

### User Roles
- **Amateur** - Can book lessons, make payments
- **Pro** - Golf professionals offering lessons
- **Admin** - Eagle staff managing bookings and validations

## Environment Variables

### Mobile App (`app/.env.local`)
```env
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### Admin Panel (`admin/.env.local`)
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
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
- Centralized logging with `utils/logger.ts` (auto-disabled in production)

### Testing Strategy
- Mobile app: Comprehensive Jest setup with unit, integration, and e2e test organization
- Admin: Next.js built-in testing support
- Coverage thresholds enforced in mobile app

### Git Workflow
- Feature branches from `main`
- Pull requests required for merging
- Run tests and linting before committing
- Keep commits focused and well-described

## Security Considerations

### API Security
- All Edge Functions use JWT verification (except webhooks)
- Stripe webhook signature validation required
- Row Level Security (RLS) enabled on all Supabase tables
- Service role keys only used server-side

### Data Protection
- Sensitive data never logged
- Environment variables never committed
- Payment information handled only by Stripe
- User data protected by Supabase RLS

## Documentation Files

Key documentation in the repository:
- `NOTIFICATIONS_IMPLEMENTATION.md` - Notification system details
- `STRIPE_WEBHOOK_CONFIG.md` - Webhook configuration guide
- `SECURITY_WEBHOOK_FIX.md` - Security vulnerability fix documentation
- `STRIPE_DASHBOARD_WEBHOOK_SETUP.md` - Dashboard webhook setup guide
- `SUPABASE_SECRETS_UPDATE.md` - Guide for updating Supabase secrets

## Important Notes

- Always run linting and type checking before committing changes
- Test payment flows in Stripe test mode before production
- Manual booking validation is required - this is by design
- Keep both applications' dependencies in sync where applicable
- Use the centralized logger instead of console.log statements