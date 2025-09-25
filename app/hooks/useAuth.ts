/**
 * Hook useAuth - Wrapper pour compatibilité avec les nouveaux contextes
 * Synchronise automatiquement les favoris avec l'état d'authentification
 */
import { useEffect } from 'react';
import { useAuth as useAuthContext } from '@/contexts/AuthContext.refactored';
import { useSession, useSessionUser } from '@/contexts/SessionContext';
import { useUserContext } from '@/contexts/UserContext';
import { useSessionContext } from '@/contexts/SessionContext';
import { useAppStore } from '@/stores/useAppStore';

export function useAuth() {
  const auth = useAuthContext();
  const session = useSession();
  const user = useSessionUser();
  const userContext = useUserContext();
  const sessionContext = useSessionContext();

  // Store actions pour la gestion des favoris
  const { setCurrentUser, clearCurrentUserFavorites } = useAppStore();

  // Synchroniser les favoris avec l'état d'authentification
  useEffect(() => {
    if (session?.user?.id) {
      // Utilisateur connecté - charger ses favoris
      setCurrentUser(session.user.id);
    } else {
      // Utilisateur déconnecté - vider les favoris
      clearCurrentUserFavorites();
    }
  }, [session?.user?.id, setCurrentUser, clearCurrentUserFavorites]);

  // Wrapper personnalisé pour signOut qui vide les favoris
  const handleSignOut = async () => {
    // Vider les favoris avant la déconnexion
    clearCurrentUserFavorites();
    // Procéder à la déconnexion
    await auth.signOut();
  };

  return {
    // État
    user,
    session,
    loading: auth.loading || userContext.loading || sessionContext.loading,
    error: auth.error || userContext.error || sessionContext.error,
    isAuthenticated: !!session,

    // Méthodes d'authentification (signOut personnalisé)
    signIn: auth.signIn,
    signInWithProvider: auth.signInWithProvider,
    signInWithMagicLink: auth.signInWithMagicLink,
    signUp: auth.signUp,
    signOut: handleSignOut,
    verifyOtp: auth.verifyOtp,
    resendOtp: auth.resendOtp,

    // Méthodes de session
    refreshSession: sessionContext.refreshSession,

    // Méthodes utilisateur
    deleteAccount: userContext.deleteAccount,
    loadUserProfile: userContext.loadUserProfile,
  };
}
