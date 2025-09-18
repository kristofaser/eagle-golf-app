/**
 * Hook useNotificationBadge - Gestion du compteur de notifications non lues
 *
 * Hook optimisé pour afficher et mettre à jour le badge/compteur de notifications
 * non lues. Se synchronise avec le realtime et les actions utilisateur.
 *
 * ✅ PERFORMANT : Requête légère, cache intelligent
 * ✅ TEMPS RÉEL : Se synchronise automatiquement
 * ✅ OPTIMISÉ : Évite les re-renders inutiles
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/utils/supabase/client';

export interface NotificationBadgeState {
  count: number;
  isLoading: boolean;
  error: string | null;
  lastUpdated: Date | null;
}

export interface NotificationBadgeOptions {
  /**
   * Intervalle de polling en millisecondes (fallback si realtime fail)
   * @default 30000 (30s)
   */
  pollingInterval?: number;

  /**
   * Activer le polling en fallback
   * @default true
   */
  enablePolling?: boolean;

  /**
   * Debug mode
   * @default false
   */
  debug?: boolean;
}

/**
 * Hook pour gérer le badge de notifications non lues
 */
export function useNotificationBadge(
  userId: string | null | undefined,
  options: NotificationBadgeOptions = {}
) {
  const {
    pollingInterval = 30000, // 30 secondes
    enablePolling = true,
    debug = false
  } = options;

  // État du badge
  const [state, setState] = useState<NotificationBadgeState>({
    count: 0,
    isLoading: true,
    error: null,
    lastUpdated: null,
  });

  // Références pour le polling et cache
  const pollingIntervalRef = useRef<NodeJS.Timeout>();
  const lastFetchRef = useRef<number>(0);
  const CACHE_DURATION = 10000; // 10 secondes de cache

  /**
   * Récupère le nombre de notifications non lues
   */
  const fetchUnreadCount = useCallback(async (forceRefresh = false): Promise<number> => {
    if (!userId) return 0;

    // Vérifier le cache (sauf si refresh forcé)
    const now = Date.now();
    if (!forceRefresh && (now - lastFetchRef.current) < CACHE_DURATION) {
      if (debug) {
        console.log('🔄 useNotificationBadge: Utilisation du cache');
      }
      return state.count;
    }

    try {
      if (debug) {
        console.log('📊 useNotificationBadge: Récupération du compteur...', userId);
      }

      // Utiliser la fonction SQL optimisée
      const { data, error } = await supabase.rpc('get_unread_notification_count', {
        p_user_id: userId
      });

      if (error) {
        throw error;
      }

      const count = data || 0;
      lastFetchRef.current = now;

      setState(prev => ({
        ...prev,
        count,
        isLoading: false,
        error: null,
        lastUpdated: new Date()
      }));

      if (debug) {
        console.log('✅ useNotificationBadge: Compteur mis à jour:', count);
      }

      return count;

    } catch (err) {
      console.error('❌ Erreur récupération compteur notifications:', err);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: err instanceof Error ? err.message : 'Erreur inconnue'
      }));
      return state.count; // Retourner la valeur en cache en cas d'erreur
    }
  }, [userId, debug, state.count]);

  /**
   * Incrémente le compteur localement (appelé par realtime)
   */
  const incrementCount = useCallback((amount = 1) => {
    setState(prev => ({
      ...prev,
      count: prev.count + amount,
      lastUpdated: new Date()
    }));

    if (debug) {
      console.log('➕ useNotificationBadge: Incrément local +', amount);
    }
  }, [debug]);

  /**
   * Décrémente le compteur localement (appelé lors de lectures)
   */
  const decrementCount = useCallback((amount = 1) => {
    setState(prev => ({
      ...prev,
      count: Math.max(0, prev.count - amount),
      lastUpdated: new Date()
    }));

    if (debug) {
      console.log('➖ useNotificationBadge: Décrément local -', amount);
    }
  }, [debug]);

  /**
   * Remet à zéro le compteur
   */
  const resetCount = useCallback(() => {
    setState(prev => ({
      ...prev,
      count: 0,
      lastUpdated: new Date()
    }));

    if (debug) {
      console.log('🔄 useNotificationBadge: Reset compteur');
    }
  }, [debug]);

  /**
   * Force un refresh du compteur depuis la base
   */
  const refresh = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true }));
    await fetchUnreadCount(true);
  }, [fetchUnreadCount]);

  // Setup du polling (fallback)
  useEffect(() => {
    if (!userId || !enablePolling) return;

    if (debug) {
      console.log('⏰ useNotificationBadge: Setup polling', pollingInterval + 'ms');
    }

    pollingIntervalRef.current = setInterval(async () => {
      await fetchUnreadCount(false); // Respecter le cache
    }, pollingInterval);

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, [userId, enablePolling, pollingInterval, fetchUnreadCount, debug]);

  // Chargement initial
  useEffect(() => {
    fetchUnreadCount(true);
  }, [userId, fetchUnreadCount]);

  // Cleanup à la destruction
  useEffect(() => {
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, []);

  return {
    // État
    ...state,

    // Actions
    refresh,
    incrementCount,
    decrementCount,
    resetCount,

    // Helpers
    hasUnread: state.count > 0,
    displayCount: state.count > 99 ? '99+' : state.count.toString(),
    badgeColor: state.count > 0 ? '#ef4444' : '#9ca3af', // Rouge si non lues, gris sinon
  };
}

/**
 * Version simplifiée pour un usage basique
 */
export function useNotificationBadgeSimple(userId: string | null | undefined) {
  return useNotificationBadge(userId, {
    debug: __DEV__
  });
}