export { useAuth } from '../useAuth';
export { useUser } from '../useUser';
export { useProtectedRoute, usePublicRoute } from '../useProtectedRoute';
// L'ancien AuthProvider et useAuthContext ne sont plus exportés
// Utiliser AppProviders depuis @/contexts/AppProviders à la place

// Re-export types
export type {
  AuthUser,
  AuthState,
  AuthContextType,
  SignUpData,
  AuthProvider as AuthProviderType,
  AuthError,
  Profile,
  AmateurProfile,
  ProProfile,
} from '@/utils/supabase/auth.types';
