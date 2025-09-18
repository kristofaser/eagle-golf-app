/**
 * Hook useNotificationRealtime - Écoute en temps réel les nouvelles notifications
 *
 * Utilise Supabase Realtime pour détecter les nouvelles notifications et mettre à jour
 * automatiquement le store UI et les compteurs non lus.
 *
 * ✅ SÉCURISÉ : Utilise RLS et filtre par utilisateur connecté
 * ✅ NON INVASIF : Hook séparé basé sur le pattern useProRequestRealtime
 * ✅ PERFORMANT : Se désabonne automatiquement au démontage
 * ✅ INTÉGRÉ : Synchronise avec useUIStore pour l'affichage
 */
import { useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/utils/supabase/client';
import { useUIStore } from '@/stores/useUIStore';

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
    debug = false
  } = options;

  const { addNotification, incrementUnreadCount } = useUIStore();
  const channelRef = useRef<any>(null);

  const handleNewNotification = useCallback(async (payload: any) => {
    const notification: NotificationItem = payload.new;

    if (debug) {
      console.log('🔔 Realtime Notification - INSERT:', {
        userId,
        notification
      });
    }

    // Callback personnalisé
    onNewNotification?.(notification);

    // Ajouter au store UI pour affichage
    if (showInAppNotifications) {
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
    }
  }, [userId, onNewNotification, showInAppNotifications, addNotification, incrementUnreadCount, debug]);

  const handleNotificationUpdate = useCallback(async (payload: any) => {
    const notification: NotificationItem = payload.new;
    const oldNotification: NotificationItem = payload.old;

    if (debug) {
      console.log('🔄 Realtime Notification - UPDATE:', {
        userId,
        old: oldNotification,
        new: notification
      });
    }

    // Callback personnalisé
    onNotificationUpdated?.(notification);

    // Si la notification vient d'être marquée comme lue
    if (!oldNotification.read_at && notification.read_at) {
      // Logique pour décrémenter le compteur sera gérée par useNotificationBadge
      if (debug) {
        console.log('📖 Notification marquée comme lue:', notification.id);
      }
    }
  }, [userId, onNotificationUpdated, debug]);

  useEffect(() => {
    // Ne pas s'abonner si pas d'utilisateur
    if (!userId) {
      if (debug) {
        console.log('⏭️ Realtime Notifications: Pas d\'userId, skip subscription');
      }
      return;
    }

    if (debug) {
      console.log('🔗 Realtime Notifications: Connexion pour userId:', userId);
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
          filter: `user_id=eq.${userId}` // Filtrer par utilisateur connecté
        },
        handleNewNotification
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE', // Notifications mises à jour (lecture)
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`
        },
        handleNotificationUpdate
      )
      .subscribe((status) => {
        if (debug) {
          console.log('🔗 Realtime Notifications: Statut subscription:', status);
        }
      });

    channelRef.current = channel;

    // Nettoyage à la destruction du composant
    return () => {
      if (debug) {
        console.log('🔌 Realtime Notifications: Déconnexion channel');
      }

      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [userId, handleNewNotification, handleNotificationUpdate, debug]);

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
            filter: `user_id=eq.${userId}`
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
        console.log('🔄 Realtime Notifications: Reconnexion forcée');
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