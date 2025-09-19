'use client';

import { useEffect, useCallback, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/components/ui/ToastProvider';

interface NotificationData {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  data: any;
  read_at: string | null;
  created_at: string;
  updated_at: string;
}

interface UseNotificationsOptions {
  autoConnect?: boolean;
  adminUserId?: string;
}

export function useNotifications(options: UseNotificationsOptions = {}) {
  const { autoConnect = true, adminUserId } = options;
  const [isConnected, setIsConnected] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const toast = useToast();
  const supabase = createClient();

  // Récupérer les notifications non lues au démarrage
  const fetchUnreadNotifications = useCallback(async () => {
    if (!adminUserId) return;

    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', adminUserId)
        .is('read_at', null)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) {
        console.error('Erreur lors de la récupération des notifications:', error);
        return;
      }

      setNotifications(data || []);
      setUnreadCount(data?.length || 0);
    } catch (error) {
      console.error('Erreur fetch notifications:', error);
    }
  }, [adminUserId, supabase]);

  // Connecter au channel Realtime
  const connectToRealtime = useCallback(() => {
    if (!adminUserId) {
      console.warn('useNotifications: adminUserId requis pour la connexion Realtime');
      return;
    }

    console.log('🔌 Connexion au channel Realtime pour admin:', adminUserId);

    const channel = supabase
      .channel('admin-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${adminUserId}`
        },
        (payload) => {
          console.log('🔔 Nouvelle notification reçue:', payload);

          const newNotification = payload.new as NotificationData;

          // Ajouter à la liste locale
          setNotifications(prev => [newNotification, ...prev.slice(0, 9)]);
          setUnreadCount(prev => prev + 1);

          // Afficher le toast selon le type
          switch (newNotification.type) {
            case 'admin_new_pro_request':
              toast.info(
                newNotification.title,
                newNotification.message
              );
              break;

            case 'admin_booking_validation_required':
              toast.warning(
                newNotification.title,
                newNotification.message
              );
              break;

            case 'admin_system_alert':
              toast.error(
                newNotification.title,
                newNotification.message
              );
              break;

            default:
              toast.info(
                newNotification.title,
                newNotification.message
              );
          }
        }
      )
      .subscribe((status) => {
        console.log('📡 Statut channel Realtime:', status);
        setIsConnected(status === 'SUBSCRIBED');

        if (status === 'SUBSCRIBED') {
          console.log('✅ Connecté au système de notifications en temps réel');
          // Récupérer les notifications existantes lors de la connexion
          fetchUnreadNotifications();
        }
      });

    return channel;
  }, [adminUserId, supabase, toast, fetchUnreadNotifications]);

  // Marquer une notification comme lue
  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read_at: new Date().toISOString() })
        .eq('id', notificationId)
        .eq('user_id', adminUserId);

      if (error) {
        console.error('Erreur markAsRead:', error);
        return false;
      }

      // Mettre à jour l'état local
      setNotifications(prev =>
        prev.map(notif =>
          notif.id === notificationId
            ? { ...notif, read_at: new Date().toISOString() }
            : notif
        )
      );

      setUnreadCount(prev => Math.max(0, prev - 1));
      return true;
    } catch (error) {
      console.error('Erreur markAsRead:', error);
      return false;
    }
  }, [adminUserId, supabase]);

  // Marquer toutes comme lues
  const markAllAsRead = useCallback(async () => {
    if (!adminUserId) return false;

    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read_at: new Date().toISOString() })
        .eq('user_id', adminUserId)
        .is('read_at', null);

      if (error) {
        console.error('Erreur markAllAsRead:', error);
        return false;
      }

      setNotifications(prev =>
        prev.map(notif => ({ ...notif, read_at: new Date().toISOString() }))
      );
      setUnreadCount(0);
      return true;
    } catch (error) {
      console.error('Erreur markAllAsRead:', error);
      return false;
    }
  }, [adminUserId, supabase]);

  // Effet pour la connexion automatique
  useEffect(() => {
    if (!autoConnect || !adminUserId) return;

    const channel = connectToRealtime();

    return () => {
      console.log('🔌 Déconnexion du channel Realtime');
      channel?.unsubscribe();
      setIsConnected(false);
    };
  }, [autoConnect, adminUserId, connectToRealtime]);

  return {
    isConnected,
    unreadCount,
    notifications,
    markAsRead,
    markAllAsRead,
    fetchUnreadNotifications,
    connectToRealtime
  };
}