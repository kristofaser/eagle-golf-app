/**
 * Hook useNotificationRealtime - Écoute en temps réel les nouvelles notifications
 *
 * Utilise Supabase Realtime pour détecter les nouvelles notifications et coordonne
 * intelligemment avec le système de push notifications pour éviter les doublons.
 *
 * ✅ SÉCURISÉ : Utilise RLS et filtre par utilisateur connecté
 * ✅ NON INVASIF : Hook séparé basé sur le pattern useProRequestRealtime
 * ✅ PERFORMANT : Se désabonne automatiquement au démontage
 * ✅ INTÉGRÉ : Synchronise avec useUIStore pour l'affichage
 * ✅ COORDONNÉ : Évite les doublons avec les push notifications
 */
import { useEffect, useCallback, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { supabase } from '@/utils/supabase/client';
import { useUIStore } from '@/stores/useUIStore';
import { logger } from '@/utils/logger';

export interface NotificationItem {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  data: Record<string, any>;
  read_at: string | null;
  created_at: string;
}

interface NotificationRealtimeOptions {
  /**
   * Activer les notifications in-app lors des changements
   * @default true
   */
  showInAppNotifications?: boolean;

  /**
   * Callback appelé lors d'une nouvelle notification
   */
  onNewNotification?: (notification: NotificationItem) => void;

  /**
   * Callback appelé lors d'une mise à jour (lecture) de notification
   */
  onNotificationUpdated?: (notification: NotificationItem) => void;

  /**
   * Debug mode pour voir les logs
   * @default false
   */
  debug?: boolean;

  /**
   * État de l'application pour coordination push/in-app
   * Si fourni, utilise cet état au lieu de détecter automatiquement
   */
  appState?: AppStateStatus;

  /**
   * Indique si les push notifications sont disponibles
   * Permet d'optimiser l'affichage in-app en conséquence
   * @default false
   */
  isPushAvailable?: boolean;
}

/**
 * Hook pour écouter les notifications en temps réel
 *
 * @param userId - ID de l'utilisateur à surveiller
 * @param options - Options de configuration
 */
export function useNotificationRealtime(
  userId: string | null | undefined,
  options: NotificationRealtimeOptions = {}
) {
  const {
    showInAppNotifications = true,
    onNewNotification,
    onNotificationUpdated,
    debug = false,
    appState: providedAppState,
    isPushAvailable = false,
  } = options;

  const {
    addNotification,
    incrementUnreadCount,
    markNotificationAsRead,
    decrementUnreadCount,
    removeNotification
  } = useUIStore();
  const channelRef = useRef<any>(null);
  const currentAppState = useRef<AppStateStatus>(AppState.currentState);

  // Suivre l'état de l'application
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      currentAppState.current = nextAppState;
      if (debug) {
        logger.dev('📱 App State changed in useNotificationRealtime:', {
          from: currentAppState.current,
          to: nextAppState,
          isPushAvailable,
        });
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription?.remove();
  }, [debug, isPushAvailable]);

  const handleNewNotification = useCallback(
    async (payload: any) => {
      const notification: NotificationItem = payload.new;
      const effectiveAppState = providedAppState || currentAppState.current;
      const isAppInForeground = effectiveAppState === 'active';

      if (debug) {
        logger.dev('🔔 Realtime Notification - INSERT:', {
          userId,
          notification,
          appState: effectiveAppState,
          isAppInForeground,
          isPushAvailable,
          shouldShowInApp: showInAppNotifications && isAppInForeground,
        });
      }

      // Callback personnalisé (toujours appelé)
      onNewNotification?.(notification);

      // Logique de coordination push/in-app :
      // - App en foreground → affichage in-app
      // - App en background ET push disponible → skip in-app (push géré par l'OS)
      // - App en background MAIS pas de push → affichage in-app quand même
      const shouldShowInApp = showInAppNotifications && (isAppInForeground || !isPushAvailable);

      if (shouldShowInApp) {
        addNotification({
          id: notification.id,
          type: getNotificationDisplayType(notification.type),
          title: notification.title,
          message: notification.message,
          data: notification.data,
          timestamp: new Date(notification.created_at),
          read: false,
        });

        // Incrémenter le compteur des notifications non lues
        incrementUnreadCount();

        if (debug) {
          logger.dev('✅ Notification in-app ajoutée:', {
            id: notification.id,
            title: notification.title,
            reason: isAppInForeground ? 'app_foreground' : 'no_push_available',
          });
        }
      } else if (debug) {
        logger.dev('⏭️ Notification in-app skippée (push handling):', {
          id: notification.id,
          title: notification.title,
          appState: effectiveAppState,
          isPushAvailable,
        });
      }
    },
    [
      userId,
      onNewNotification,
      showInAppNotifications,
      addNotification,
      incrementUnreadCount,
      debug,
      providedAppState,
      isPushAvailable,
    ]
  );

  const handleNotificationUpdate = useCallback(
    async (payload: any) => {
      const notification: NotificationItem = payload.new;
      const oldNotification: NotificationItem = payload.old;

      if (debug) {
        logger.dev('🔄 Realtime Notification - UPDATE:', {
          userId,
          old: oldNotification,
          new: notification,
        });
      }

      // Callback personnalisé
      onNotificationUpdated?.(notification);

      // Si la notification vient d'être marquée comme lue
      if (!oldNotification.read_at && notification.read_at) {
        if (debug) {
          logger.dev('📖 Notification marquée comme lue via realtime:', notification.id);
        }

        // Mettre à jour le store UI pour synchroniser l'affichage
        markNotificationAsRead(notification.id);
        decrementUnreadCount();
      }
    },
    [userId, onNotificationUpdated, debug, markNotificationAsRead, decrementUnreadCount]
  );

  const handleNotificationDelete = useCallback(
    async (payload: any) => {
      const notification: NotificationItem = payload.old;

      if (debug) {
        logger.dev('🗑️ Realtime Notification - DELETE:', {
          userId,
          deleted: notification,
        });
      }

      // Supprimer du store UI
      removeNotification(notification.id);

      // Décrémenter le compteur si la notification n'était pas lue
      if (!notification.read_at) {
        decrementUnreadCount();
      }
    },
    [userId, debug, removeNotification, decrementUnreadCount]
  );

  useEffect(() => {
    // Ne pas s'abonner si pas d'utilisateur
    if (!userId) {
      if (debug) {
        logger.dev("⏭️ Realtime Notifications: Pas d'userId, skip subscription");
      }
      return;
    }

    if (debug) {
      logger.dev('🔗 Realtime Notifications: Connexion pour userId:', userId);
    }

    // Créer le channel Supabase Realtime unique par utilisateur
    const channelName = `user-notifications-${userId}`;
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT', // Nouvelles notifications
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`, // Filtrer par utilisateur connecté
        },
        handleNewNotification
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE', // Notifications mises à jour (lecture)
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        handleNotificationUpdate
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE', // Notifications supprimées
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        handleNotificationDelete
      )
      .subscribe((status) => {
        if (debug) {
          logger.dev('🔗 Realtime Notifications: Statut subscription:', status);
        }
      });

    channelRef.current = channel;

    // Nettoyage à la destruction du composant
    return () => {
      if (debug) {
        logger.dev('🔌 Realtime Notifications: Déconnexion channel');
      }

      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [userId, handleNewNotification, handleNotificationUpdate, handleNotificationDelete, debug]);

  // Fonction utilitaire pour forcer une reconnexion
  const reconnect = useCallback(() => {
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }

    if (userId) {
      const channelName = `user-notifications-${userId}-reconnect`;
      const channel = supabase
        .channel(channelName)
        .on(
          'postgres_changes',
          {
            event: '*', // Tous les événements
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${userId}`,
          },
          (payload) => {
            if (payload.eventType === 'INSERT') {
              handleNewNotification(payload);
            } else if (payload.eventType === 'UPDATE') {
              handleNotificationUpdate(payload);
            }
          }
        )
        .subscribe();

      channelRef.current = channel;

      if (debug) {
        logger.dev('🔄 Realtime Notifications: Reconnexion forcée');
      }
    }
  }, [userId, handleNewNotification, handleNotificationUpdate, debug]);

  return {
    /**
     * Forcer une reconnexion au channel realtime
     * Utile en cas de problème de connexion
     */
    reconnect,

    /**
     * Indique si le hook est actif (a un userId valide)
     */
    isActive: !!userId,

    /**
     * État actuel de l'application
     */
    currentAppState: currentAppState.current,

    /**
     * Indique si l'app est en foreground
     */
    isAppInForeground: (providedAppState || currentAppState.current) === 'active',
  };
}

/**
 * Version simplifiée du hook pour usage basique
 * Active automatiquement les notifications in-app
 */
export function useNotificationRealtimeSimple(userId: string | null | undefined) {
  return useNotificationRealtime(userId, {
    showInAppNotifications: true,
    debug: __DEV__, // Debug en mode développement seulement
  });
}

/**
 * Convertit le type de notification backend en type d'affichage UI
 */
function getNotificationDisplayType(backendType: string): 'success' | 'error' | 'info' | 'warning' {
  switch (backendType) {
    case 'booking_confirmed':
    case 'payment_received':
    case 'pro_approved':
      return 'success';

    case 'booking_cancelled':
    case 'payment_failed':
    case 'pro_rejected':
      return 'error';

    case 'booking_modified':
    case 'pro_document_required':
    case 'travel_alert':
      return 'warning';

    case 'system_maintenance':
    case 'custom':
    default:
      return 'info';
  }
}
