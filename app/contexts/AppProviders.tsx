/**
 * AppProviders - Provider principal qui combine tous les contextes
 * Ordre important : Session -> User -> Auth
 */
import React from 'react';
import { SessionProvider } from './SessionContext';
import { UserProvider } from './UserContext';
import { AuthProvider } from './AuthContext.refactored';

interface AppProvidersProps {
  children: React.ReactNode;
}

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <SessionProvider>
      <UserProvider>
        <AuthProvider>{children}</AuthProvider>
      </UserProvider>
    </SessionProvider>
  );
}

// Export des hooks pour utilisation simplifiée
export { useAuth } from './AuthContext.refactored';
export { useSession, useSessionUser } from './SessionContext';
export { useProfile } from './UserContext';

// Hook combiné pour accès complet (compatibilité avec ancien code)
export function useAuthState() {
  const session = useSession();
  const user = useSessionUser();
  const profile = useProfile();

  return {
    session,
    user,
    profile,
    isAuthenticated: !!session,
    loading: false, // Géré individuellement dans chaque contexte
  };
}
