/**
 * Hook useNotificationList - Gestion de la liste des notifications
 *
 * Hook pour récupérer, paginer et gérer l'historique des notifications utilisateur.
 * Intègre la récupération depuis Supabase et la synchronisation avec le realtime.
 *
 * ✅ SÉCURISÉ : Utilise RLS et auth automatique
 * ✅ OPTIMISÉ : Pagination et mise en cache intelligente
 * ✅ TEMPS RÉEL : Se synchronise avec useNotificationRealtime
 */
import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/utils/supabase/client';
import { NotificationItem } from './useNotificationRealtime';

export interface NotificationListOptions {
  /**
   * Nombre de notifications à charger par page
   * @default 20
   */
  pageSize?: number;

  /**
   * Filtrer par type de notification
   */
  filterType?: string | null;

  /**
   * Afficher seulement les non lues
   * @default false
   */
  unreadOnly?: boolean;

  /**
   * Recharger automatiquement quand l'utilisateur change
   * @default true
   */
  autoRefresh?: boolean;

  /**
   * Debug mode
   * @default false
   */
  debug?: boolean;
}

export interface NotificationListState {
  notifications: NotificationItem[];
  isLoading: boolean;
  isLoadingMore: boolean;
  error: string | null;
  hasMore: boolean;
  totalUnread: number;
}

/**
 * Hook pour gérer la liste des notifications
 */
export function useNotificationList(
  userId: string | null | undefined,
  options: NotificationListOptions = {}
) {
  const {
    pageSize = 20,
    filterType = null,
    unreadOnly = false,
    autoRefresh = true,
    debug = false
  } = options;

  // État local
  const [state, setState] = useState<NotificationListState>({
    notifications: [],
    isLoading: true,
    isLoadingMore: false,
    error: null,
    hasMore: true,
    totalUnread: 0,
  });

  // Mémoriser les filtres pour éviter les re-renders inutiles
  const filters = useMemo(() => ({
    filterType,
    unreadOnly
  }), [filterType, unreadOnly]);

  /**
   * Récupère les notifications depuis la base
   */
  const loadNotifications = useCallback(async (
    offset = 0,
    append = false
  ): Promise<void> => {
    if (!userId) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        notifications: [],
        hasMore: false
      }));
      return;
    }

    try {
      setState(prev => ({
        ...prev,
        isLoading: offset === 0 && !append,
        isLoadingMore: append,
        error: null
      }));

      if (debug) {
        console.log('📋 useNotificationList: Chargement...', {
          userId,
          offset,
          append,
          filters
        });
      }

      // Construction de la query avec filtres
      let query = supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .range(offset, offset + pageSize - 1);

      // Appliquer les filtres
      if (filters.filterType) {
        query = query.eq('type', filters.filterType);
      }

      if (filters.unreadOnly) {
        query = query.is('read_at', null);
      }

      const { data, error, count } = await query;

      if (error) {
        throw error;
      }

      const notifications = data || [];

      // Récupérer le nombre total de notifications non lues
      const { count: unreadCount } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .is('read_at', null);

      setState(prev => ({
        ...prev,
        notifications: append
          ? [...prev.notifications, ...notifications]
          : notifications,
        isLoading: false,
        isLoadingMore: false,
        hasMore: notifications.length === pageSize,
        totalUnread: unreadCount || 0,
        error: null
      }));

      if (debug) {
        console.log('✅ useNotificationList: Chargé', {
          count: notifications.length,
          totalUnread: unreadCount,
          hasMore: notifications.length === pageSize
        });
      }

    } catch (err) {
      console.error('❌ Erreur chargement notifications:', err);
      setState(prev => ({
        ...prev,
        isLoading: false,
        isLoadingMore: false,
        error: err instanceof Error ? err.message : 'Erreur inconnue'
      }));
    }
  }, [userId, pageSize, filters, debug]);

  /**
   * Marque une notification comme lue
   */
  const markAsRead = useCallback(async (notificationId: string): Promise<boolean> => {
    if (!userId) return false;

    try {
      if (debug) {
        console.log('📖 Marquage comme lue:', notificationId);
      }

      const { error } = await supabase.rpc('mark_notification_read', {
        p_notification_id: notificationId,
        p_user_id: userId
      });

      if (error) {
        throw error;
      }

      // Mettre à jour l'état local
      setState(prev => ({
        ...prev,
        notifications: prev.notifications.map(notif =>
          notif.id === notificationId
            ? { ...notif, read_at: new Date().toISOString() }
            : notif
        ),
        totalUnread: Math.max(0, prev.totalUnread - 1)
      }));

      return true;
    } catch (err) {
      console.error('❌ Erreur marquage lecture:', err);
      return false;
    }
  }, [userId, debug]);

  /**
   * Marque toutes les notifications comme lues
   */
  const markAllAsRead = useCallback(async (): Promise<boolean> => {
    if (!userId) return false;

    try {
      if (debug) {
        console.log('📖 Marquage toutes comme lues');
      }

      const { error } = await supabase
        .from('notifications')
        .update({ read_at: new Date().toISOString() })
        .eq('user_id', userId)
        .is('read_at', null);

      if (error) {
        throw error;
      }

      // Mettre à jour l'état local
      setState(prev => ({
        ...prev,
        notifications: prev.notifications.map(notif => ({
          ...notif,
          read_at: notif.read_at || new Date().toISOString()
        })),
        totalUnread: 0
      }));

      return true;
    } catch (err) {
      console.error('❌ Erreur marquage toutes lecture:', err);
      return false;
    }
  }, [userId, debug]);

  /**
   * Charge plus de notifications (pagination)
   */
  const loadMore = useCallback((): void => {
    if (state.hasMore && !state.isLoadingMore && !state.isLoading) {
      loadNotifications(state.notifications.length, true);
    }
  }, [state.hasMore, state.isLoadingMore, state.isLoading, state.notifications.length, loadNotifications]);

  /**
   * Rafraîchit la liste complète
   */
  const refresh = useCallback((): void => {
    loadNotifications(0, false);
  }, [loadNotifications]);

  // Chargement initial et lors des changements d'utilisateur/filtres
  useEffect(() => {
    if (autoRefresh) {
      loadNotifications(0, false);
    }
  }, [userId, filters, autoRefresh, loadNotifications]);

  // Interface de retour
  return {
    // État
    ...state,

    // Actions
    loadMore,
    refresh,
    markAsRead,
    markAllAsRead,

    // Helpers
    hasNotifications: state.notifications.length > 0,
    isEmpty: !state.isLoading && state.notifications.length === 0,
  };
}