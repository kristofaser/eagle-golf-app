/**
 * NotificationPanel - Panneau des notifications
 *
 * Composant organism pour afficher la liste complète des notifications
 * avec pagination, filtres et actions groupées.
 */
import React, { useEffect, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { NotificationItem } from '@/components/molecules/NotificationItem';
import { NotificationUIItem, useNotificationActions, useNotificationItems } from '@/stores/useUIStore';
import { useNotificationList } from '@/hooks/useNotificationList';
import { useAuth } from '@/hooks/useAuth';

export interface NotificationPanelProps {
  /**
   * Callback à la fermeture du panneau
   */
  onClose?: () => void;

  /**
   * Callback lors du tap sur une notification
   */
  onNotificationPress?: (notification: NotificationUIItem) => void;

  /**
   * Affichage modal complet ou overlay
   * @default false
   */
  fullScreen?: boolean;

  /**
   * Style personnalisé du container
   */
  style?: object;
}

export const NotificationPanel: React.FC<NotificationPanelProps> = ({
  onClose,
  onNotificationPress,
  fullScreen = false,
  style,
}) => {
  const { user } = useAuth();
  const notificationActions = useNotificationActions();
  const notificationItems = useNotificationItems();

  // Hook pour la gestion de la liste depuis la base
  const {
    notifications: dbNotifications,
    isLoading,
    isLoadingMore,
    hasMore,
    totalUnread,
    loadMore,
    refresh,
    markAsRead,
    markAllAsRead,
    error,
  } = useNotificationList(user?.id, {
    pageSize: 20,
    autoRefresh: true,
  });

  // Synchroniser le compteur avec la base
  useEffect(() => {
    if (totalUnread !== undefined) {
      notificationActions.setUnreadCount(totalUnread);
    }
  }, [totalUnread, notificationActions]);

  // Fusionner les notifications du store (temps réel) avec celles de la base
  const allNotifications = useMemo(() => {
    const storeIds = new Set(notificationItems.map(n => n.id));
    const dbOnly = dbNotifications.filter(db => !storeIds.has(db.id));

    // Convertir les notifications DB au format UI
    const dbUINotifications: NotificationUIItem[] = dbOnly.map(db => ({
      id: db.id,
      type: getUIType(db.type),
      title: db.title,
      message: db.message,
      data: db.data,
      timestamp: new Date(db.created_at),
      read: !!db.read_at,
    }));

    // Fusionner et trier par date
    return [...notificationItems, ...dbUINotifications]
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }, [notificationItems, dbNotifications]);

  const handleNotificationPress = async (notification: NotificationUIItem) => {
    // Marquer comme lue dans la base si nécessaire
    if (!notification.read) {
      await markAsRead(notification.id);
      notificationActions.markNotificationAsRead(notification.id);
    }

    // Callback personnalisé
    onNotificationPress?.(notification);
  };

  const handleMarkAllAsRead = async () => {
    await markAllAsRead();
    notificationActions.markAllNotificationsAsRead();
  };

  const handleRefresh = () => {
    refresh();
  };

  const renderNotification = ({ item }: { item: NotificationUIItem }) => (
    <NotificationItem
      notification={item}
      onPress={handleNotificationPress}
      onMarkAsRead={(id) => {
        markAsRead(id);
        notificationActions.markNotificationAsRead(id);
      }}
      compact={!fullScreen}
    />
  );

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.headerLeft}>
        <Text style={styles.title}>Notifications</Text>
        {totalUnread > 0 && (
          <View style={styles.unreadBadge}>
            <Text style={styles.unreadBadgeText}>{totalUnread}</Text>
          </View>
        )}
      </View>

      <View style={styles.headerActions}>
        {totalUnread > 0 && (
          <TouchableOpacity
            style={styles.markAllButton}
            onPress={handleMarkAllAsRead}
          >
            <Text style={styles.markAllButtonText}>Tout marquer comme lu</Text>
          </TouchableOpacity>
        )}

        {onClose && (
          <TouchableOpacity
            style={styles.closeButton}
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel="Fermer le panneau de notifications"
            accessibilityHint="Ferme la liste des notifications et retourne à l'écran précédent"
          >
            <Text style={styles.closeButtonText}>×</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyTitle}>Aucune notification</Text>
      <Text style={styles.emptyMessage}>
        Vous êtes à jour ! Les nouvelles notifications apparaîtront ici.
      </Text>
    </View>
  );

  const renderFooter = () => {
    if (!isLoadingMore) return null;

    return (
      <View style={styles.loadingFooter}>
        <ActivityIndicator size="small" color={Colors.primary.electric} />
      </View>
    );
  };

  if (error) {
    return (
      <View style={[styles.container, style]}>
        {renderHeader()}
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Erreur de chargement</Text>
          <Text style={styles.errorMessage}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={handleRefresh}>
            <Text style={styles.retryButtonText}>Réessayer</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, fullScreen && styles.fullScreenContainer, style]}>
      {renderHeader()}

      <FlashList
        data={allNotifications}
        renderItem={renderNotification}
        keyExtractor={(item) => item.id}
        estimatedItemSize={80}
        ListEmptyComponent={!isLoading ? renderEmpty : null}
        ListFooterComponent={renderFooter}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={handleRefresh}
            tintColor={Colors.primary.electric}
          />
        }
        onEndReached={hasMore && !isLoadingMore ? loadMore : undefined}
        onEndReachedThreshold={0.5}
        showsVerticalScrollIndicator={true}
        contentContainerStyle={styles.listContent}
      />
    </SafeAreaView>
  );
};

// Helper pour convertir les types DB en types UI
function getUIType(dbType: string): NotificationUIItem['type'] {
  switch (dbType) {
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.neutral.cloud,
  },
  fullScreenContainer: {
    backgroundColor: Colors.neutral.white,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1e293b',
  },
  unreadBadge: {
    marginLeft: 8,
    backgroundColor: '#ef4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  unreadBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ffffff',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  markAllButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#e2e8f0',
    borderRadius: 8,
    marginRight: 8,
  },
  markAllButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 20,
    fontWeight: '300',
    color: '#64748b',
  },
  listContent: {
    paddingVertical: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#64748b',
    marginBottom: 8,
  },
  emptyMessage: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
    lineHeight: 20,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ef4444',
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 20,
  },
  retryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#3b82f6',
    borderRadius: 8,
  },
  retryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
  loadingFooter: {
    paddingVertical: 16,
    alignItems: 'center',
  },
});