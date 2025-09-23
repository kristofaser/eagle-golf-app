/**
 * AppProviders - Provider principal qui combine tous les contextes
 * Ordre important : Session -> User -> Auth -> PushNotifications
 */
import React from 'react';
import { SessionProvider } from './SessionContext';
import { UserProvider } from './UserContext';
import { AuthProvider } from './AuthContext.refactored';
import { PushNotificationProvider } from './PushNotificationContext';

interface AppProvidersProps {
  children: React.ReactNode;
}

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <SessionProvider>
      <UserProvider>
        <AuthProvider>
          <PushNotificationProvider>{children}</PushNotificationProvider>
        </AuthProvider>
      </UserProvider>
    </SessionProvider>
  );
}

// Export des hooks pour utilisation simplifiée
export { useAuth } from './AuthContext.refactored';
export { useSession, useSessionUser } from './SessionContext';
export { useProfile } from './UserContext';
export {
  usePushNotificationContext,
  usePushNotificationStatus,
  usePushNotificationActions,
} from './PushNotificationContext';

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
