import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Typography, BorderRadius, Elevation } from '@/constants/theme';
import { Text } from '@/components/atoms';
import { useAuth } from '@/hooks/useAuth';
import { useNotificationCount } from '@/hooks/useNotificationCount';
import { supabase } from '@/utils/supabase/client';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { logger } from '@/utils/logger';

interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  data?: any;
  read_at: string | null;
  created_at: string;
  updated_at: string;
}

export default function NotificationsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { refresh: refreshCount } = useNotificationCount();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const channelRef = useRef<any>(null);
  const refreshCountRef = useRef(refreshCount);

  // Garder la référence à jour
  useEffect(() => {
    refreshCountRef.current = refreshCount;
  }, [refreshCount]);

  const loadNotifications = async () => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        logger.error('Erreur chargement notifications:', error);
        return;
      }

      setNotifications(data || []);
    } catch (error) {
      logger.error('Erreur:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, [user?.id]);

  // Écouter les changements en temps réel sur les notifications
  useEffect(() => {
    if (!user?.id) return;

    logger.dev('🔗 NotificationsScreen: Setup realtime pour userId:', user.id);

    // Créer le channel Supabase Realtime
    const channel = supabase
      .channel(`notifications-screen-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          logger.dev('🆕 NotificationsScreen: Nouvelle notification:', payload.new);
          const newNotification = payload.new as Notification;
          setNotifications((prev) => [newNotification, ...prev]);
          refreshCountRef.current();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          logger.dev('🔄 NotificationsScreen: Notification mise à jour:', payload.new);
          const updatedNotification = payload.new as Notification;
          setNotifications((prev) =>
            prev.map((n) => (n.id === updatedNotification.id ? updatedNotification : n))
          );
          // Rafraîchir le compteur si le statut de lecture a changé
          const oldNotification = payload.old as Notification;
          if (!oldNotification.read_at && updatedNotification.read_at) {
            refreshCountRef.current();
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          logger.dev('🗑️ NotificationsScreen: Notification supprimée:', payload.old);
          const deletedNotification = payload.old as Notification;
          setNotifications((prev) => prev.filter((n) => n.id !== deletedNotification.id));
          // Rafraîchir le compteur si la notification était non lue
          if (!deletedNotification.read_at) {
            refreshCountRef.current();
          }
        }
      )
      .subscribe((status) => {
        logger.dev('🔌 NotificationsScreen: Statut subscription:', status);
      });

    channelRef.current = channel;

    // Nettoyage
    return () => {
      logger.dev('🔌 NotificationsScreen: Déconnexion channel');
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [user?.id]); // Retirer refreshCount pour éviter les reconnexions en boucle

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadNotifications();
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const now = new Date().toISOString();
      const { error } = await supabase
        .from('notifications')
        .update({ read_at: now })
        .eq('id', notificationId);

      if (error) {
        logger.error('Erreur mise à jour notification:', error);
        return;
      }

      // Mettre à jour l'état local
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, read_at: now } : n))
      );

      // Rafraîchir le compteur de notifications
      refreshCount();
    } catch (error) {
      logger.error('Erreur:', error);
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      // Vérifier si la notification était non lue avant de la supprimer
      const notification = notifications.find((n) => n.id === notificationId);
      const wasUnread = notification && !notification.read_at;

      // Supprimer immédiatement de l'UI pour un retour visuel instantané
      setNotifications((prev) => prev.filter((n) => n.id !== notificationId));

      const { error } = await supabase.from('notifications').delete().eq('id', notificationId);

      if (error) {
        logger.error('Erreur suppression notification:', error);
        // Restaurer la notification en cas d'erreur
        if (notification) {
          setNotifications((prev) =>
            [...prev, notification].sort(
              (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            )
          );
        }
        return;
      }

      logger.dev('✅ Notification supprimée:', notificationId);

      // Rafraîchir le compteur si la notification était non lue
      // Note: Le realtime va aussi déclencher un refresh, mais on le fait ici pour être sûr
      if (wasUnread) {
        refreshCount();
      }
    } catch (error) {
      logger.error('Erreur:', error);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'booking_confirmed':
        return 'checkmark-circle';
      case 'booking_cancelled':
        return 'close-circle';
      case 'payment_success':
        return 'card';
      case 'pro_request_approved':
        return 'trophy';
      case 'pro_request_rejected':
        return 'alert-circle';
      case 'message':
        return 'mail';
      default:
        return 'notifications';
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'booking_confirmed':
      case 'payment_success':
      case 'pro_request_approved':
        return Colors.semantic.success.default;
      case 'booking_cancelled':
      case 'pro_request_rejected':
        return Colors.semantic.error.default;
      default:
        return Colors.primary.accent;
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Custom Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
          <Ionicons name="close" size={24} color={Colors.neutral.charcoal} />
        </TouchableOpacity>
        <Text variant="h3" color="charcoal" weight="semiBold">
          Notifications
        </Text>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary.accent} />
        </View>
      ) : notifications.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="notifications-off-outline" size={64} color={Colors.neutral.course} />
          <Text variant="h3" color="charcoal" style={styles.emptyTitle}>
            Aucune notification
          </Text>
          <Text variant="body" color="charcoal" style={styles.emptyText}>
            Vous n'avez pas de notifications pour le moment
          </Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
        >
          {notifications.map((notification) => (
            <TouchableOpacity
              key={notification.id}
              style={[styles.notificationCard, !notification.read_at && styles.unreadCard]}
              onPress={() => !notification.read_at && markAsRead(notification.id)}
              activeOpacity={0.9}
            >
              <View style={styles.notificationContent}>
                <View
                  style={[
                    styles.iconContainer,
                    { backgroundColor: getNotificationColor(notification.type) + '20' },
                  ]}
                >
                  <Ionicons
                    name={getNotificationIcon(notification.type)}
                    size={24}
                    color={getNotificationColor(notification.type)}
                  />
                </View>
                <View style={styles.textContainer}>
                  <Text variant="bodyBold" color="charcoal">
                    {notification.title}
                  </Text>
                  <Text variant="caption" color="charcoal" style={styles.message}>
                    {notification.message}
                  </Text>
                  <Text variant="caption" color="iron" style={styles.time}>
                    {formatDistanceToNow(new Date(notification.created_at), {
                      addSuffix: true,
                      locale: fr,
                    })}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => deleteNotification(notification.id)}
                  style={styles.deleteButton}
                >
                  <Ionicons name="trash-outline" size={20} color={Colors.neutral.iron} />
                </TouchableOpacity>
              </View>
              {!notification.read_at && <View style={styles.unreadDot} />}
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.neutral.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.m,
    paddingVertical: Spacing.m,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral.divider,
    backgroundColor: Colors.neutral.white,
  },
  closeButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingVertical: Spacing.s,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
  },
  emptyTitle: {
    marginTop: Spacing.l,
    marginBottom: Spacing.m,
    textAlign: 'center',
  },
  emptyText: {
    textAlign: 'center',
    lineHeight: 22,
  },
  notificationCard: {
    backgroundColor: Colors.neutral.white,
    marginHorizontal: Spacing.m,
    marginVertical: Spacing.xs,
    paddingVertical: Spacing.m,
    paddingHorizontal: Spacing.m,
    borderRadius: BorderRadius.medium,
    position: 'relative',
    ...Elevation.small,
  },
  unreadCard: {
    backgroundColor: Colors.primary.light + '10',
    borderLeftWidth: 3,
    borderLeftColor: Colors.primary.accent,
  },
  notificationContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.m,
  },
  textContainer: {
    flex: 1,
    marginRight: Spacing.m,
  },
  message: {
    marginTop: Spacing.xs,
    lineHeight: 18,
  },
  time: {
    marginTop: Spacing.xs,
  },
  deleteButton: {
    padding: Spacing.xs,
  },
  unreadDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary.accent,
  },
});
