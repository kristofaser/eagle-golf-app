/**
 * Hook useAuth - Wrapper pour compatibilité avec les nouveaux contextes
 */
import { useAuth as useAuthContext } from '@/contexts/AppProviders';
import { useSession, useSessionUser } from '@/contexts/AppProviders';
import { useUserContext } from '@/contexts/UserContext';
import { useSessionContext } from '@/contexts/SessionContext';

export function useAuth() {
  const auth = useAuthContext();
  const session = useSession();
  const user = useSessionUser();
  const userContext = useUserContext();
  const sessionContext = useSessionContext();

  return {
    // État
    user,
    session,
    loading: auth.loading || userContext.loading || sessionContext.loading,
    error: auth.error || userContext.error || sessionContext.error,
    isAuthenticated: !!session,

    // Méthodes d'authentification
    signIn: auth.signIn,
    signInWithProvider: auth.signInWithProvider,
    signInWithMagicLink: auth.signInWithMagicLink,
    signUp: auth.signUp,
    signOut: auth.signOut,
    verifyOtp: auth.verifyOtp,
    resendOtp: auth.resendOtp,

    // Méthodes de session
    refreshSession: sessionContext.refreshSession,

    // Méthodes utilisateur
    deleteAccount: userContext.deleteAccount,
    loadUserProfile: userContext.loadUserProfile,
  };
}
