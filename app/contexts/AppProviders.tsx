/**
 * AppProviders - Provider principal qui combine tous les contextes
 * Ordre important : Session -> User -> Auth -> PushNotifications
 */
import React from 'react';
import { SessionProvider } from './SessionContext';
import { UserProvider } from './UserContext';
import { AuthProvider } from './AuthContext.refactored';
import { PushNotificationProvider } from './PushNotificationContext';
import { FavoritesMigrationProvider } from './FavoritesMigrationProvider';

interface AppProvidersProps {
  children: React.ReactNode;
}

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <SessionProvider>
      <UserProvider>
        <AuthProvider>
          <FavoritesMigrationProvider>
            <PushNotificationProvider>{children}</PushNotificationProvider>
          </FavoritesMigrationProvider>
        </AuthProvider>
      </UserProvider>
    </SessionProvider>
  );
}

// Export des hooks pour utilisation simplifiée
// Note: useAuth doit être importé depuis /hooks/useAuth, pas depuis AuthContext.refactored
// export { useAuth } from './AuthContext.refactored'; // Commenté pour éviter confusion
export { useSession, useSessionUser } from './SessionContext';
export { useProfile } from './UserContext';
export {
  usePushNotificationContext,
  usePushNotificationStatus,
  usePushNotificationActions,
} from './PushNotificationContext';
