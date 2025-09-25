/**
 * PushNotificationContext - Provider pour les notifications push
 *
 * Gère l'initialisation et la coordination des push notifications
 * avec le système de notifications existant.
 *
 * ✅ INTÉGRÉ : S'initialise après authentification
 * ✅ COORDONNÉ : Travaille avec useNotificationRealtime
 * ✅ PERFORMANT : Auto-registration intelligente
 */
import React, { createContext, useContext, useEffect, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { useNotificationRealtime } from '@/hooks/useNotificationRealtime';
import { useAuth } from '@/hooks/useAuth';
import { logger } from '@/utils/logger';

interface PushNotificationContextValue {
  // État push notifications
  isPushEnabled: boolean;
  pushToken: string | null;
  pushPermission: 'granted' | 'denied' | 'undetermined';
  isPushLoading: boolean;
  pushError: string | null;

  // Actions
  enablePushNotifications: () => Promise<boolean>;
  disablePushNotifications: () => Promise<boolean>;

  // État app
  appState: AppStateStatus;
  isAppInForeground: boolean;

  // Coordination
  isRealtimeActive: boolean;
}

const PushNotificationContext = createContext<PushNotificationContextValue | null>(null);

interface PushNotificationProviderProps {
  children: React.ReactNode;
}

export function PushNotificationProvider({ children }: PushNotificationProviderProps) {
  const { user } = useAuth();
  const [appState, setAppState] = useState<AppStateStatus>(AppState.currentState);


  // Hook push notifications avec auto-registration
  const {
    token: pushToken,
    permission: pushPermission,
    isLoading: isPushLoading,
    error: pushError,
    isRegistered: isPushEnabled,
    registerForPushNotifications,
    unregisterPushNotifications,
  } = usePushNotifications(user?.id, {
    autoRegister: true, // Auto-register quand user connecté
    syncWithBackend: true,
    handleIncoming: true,
    debug: __DEV__,
  });

  // Hook notifications temps réel avec coordination intelligente
  const { isActive: isRealtimeActive } = useNotificationRealtime(user?.id, {
    debug: __DEV__,
    showInAppNotifications: true, // Toujours activé, la logique est dans le hook
    appState, // Passer l'état de l'app pour coordination
    isPushAvailable: isPushEnabled, // Indiquer si push est disponible
    onNewNotification: (notification) => {
      if (__DEV__) {
        logger.dev('🔔 PushNotificationContext: Notification reçue', {
          title: notification.title,
          appState,
          isPushEnabled,
          coordinationStrategy: isPushEnabled
            ? appState === 'active'
              ? 'in-app-only'
              : 'push-only'
            : 'in-app-fallback',
        });
      }

      // La logique de coordination push/in-app est maintenant gérée dans useNotificationRealtime :
      // - App foreground → In-app notification
      // - App background + push disponible → Push seulement
      // - App background + pas de push → In-app en fallback
    },
  });

  // Suivre l'état de l'application
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (__DEV__) {
        logger.dev('📱 App State changed:', { from: appState, to: nextAppState });
      }
      setAppState(nextAppState);
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription?.remove();
  }, [appState]);

  // Actions pour l'utilisateur
  const enablePushNotifications = async (): Promise<boolean> => {
    try {
      const success = await registerForPushNotifications();
      if (success && __DEV__) {
        logger.dev('✅ Push notifications activées par utilisateur');
      }
      return success;
    } catch (err) {
      logger.error('❌ Erreur activation push notifications:', err);
      return false;
    }
  };

  const disablePushNotifications = async (): Promise<boolean> => {
    try {
      const success = await unregisterPushNotifications();
      if (success && __DEV__) {
        logger.dev('🔕 Push notifications désactivées par utilisateur');
      }
      return success;
    } catch (err) {
      logger.error('❌ Erreur désactivation push notifications:', err);
      return false;
    }
  };

  // Log de l'état pour debug
  useEffect(() => {
    if (__DEV__ && user) {
      logger.dev('🔔 PushNotificationContext State:', {
        userId: user.id,
        isPushEnabled,
        pushToken: pushToken ? '***' + pushToken.slice(-10) : null,
        pushPermission,
        appState,
        isRealtimeActive,
      });
    }
  }, [user, isPushEnabled, pushToken, pushPermission, appState, isRealtimeActive]);

  const contextValue: PushNotificationContextValue = {
    // État push
    isPushEnabled,
    pushToken,
    pushPermission,
    isPushLoading,
    pushError,

    // Actions
    enablePushNotifications,
    disablePushNotifications,

    // État app
    appState,
    isAppInForeground: appState === 'active',

    // Coordination
    isRealtimeActive,
  };

  return (
    <PushNotificationContext.Provider value={contextValue}>
      {children}
    </PushNotificationContext.Provider>
  );
}

/**
 * Hook pour utiliser le contexte des push notifications
 */
export function usePushNotificationContext(): PushNotificationContextValue {
  const context = useContext(PushNotificationContext);

  if (!context) {
    throw new Error('usePushNotificationContext must be used within a PushNotificationProvider');
  }

  return context;
}

/**
 * Hook simplifié pour vérifier si les push sont disponibles
 */
export function usePushNotificationStatus() {
  const { isPushEnabled, pushPermission, isPushLoading, pushError, isAppInForeground } =
    usePushNotificationContext();

  return {
    isEnabled: isPushEnabled,
    canEnable: pushPermission !== 'denied' && !isPushLoading,
    hasPermission: pushPermission === 'granted',
    isLoading: isPushLoading,
    error: pushError,
    shouldShowInApp: isAppInForeground,
  };
}

/**
 * Hook pour les actions de push notifications
 */
export function usePushNotificationActions() {
  const { enablePushNotifications, disablePushNotifications } = usePushNotificationContext();

  return {
    enable: enablePushNotifications,
    disable: disablePushNotifications,
  };
}
