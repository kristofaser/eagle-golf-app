/**
 * Hook useProRequest - Hook unifié pour gérer les demandes pro
 *
 * Combine la vérification du statut et l'écoute realtime des changements.
 * Fournit une interface simple pour gérer tout le cycle de vie d'une demande pro.
 *
 * ✅ UNIFIÉ : Combine service + realtime dans une seule interface
 * ✅ OPTIMISÉ : Cache intelligent et mise à jour temps réel
 * ✅ SIMPLE : État complet et actions dans un seul hook
 */
import { useState, useEffect, useCallback } from 'react';
import { useProRequestRealtime } from './useProRequestRealtime';
import {
  checkUserProRequestStatus,
  ProRequestStatus,
  UserProRequestResult
} from '@/services/pro-request-status.service';
import { logger } from '@/utils/logger';

export type ProRequestState = 'none' | 'pending' | 'approved' | 'rejected';

export interface UseProRequestOptions {
  /**
   * Activer les notifications in-app lors des changements
   * @default true
   */
  showInAppNotifications?: boolean;

  /**
   * Recharger automatiquement au montage
   * @default true
   */
  autoLoad?: boolean;

  /**
   * Debug mode
   * @default false
   */
  debug?: boolean;
}

export interface UseProRequestResult {
  // État
  status: ProRequestState;
  request: ProRequestStatus | null;
  isLoading: boolean;
  error: string | null;

  // Flags utiles
  hasRequest: boolean;
  canMakeNewRequest: boolean;
  isPending: boolean;
  isApproved: boolean;
  isRejected: boolean;

  // Actions
  refresh: () => Promise<void>;

  // Realtime
  isRealtimeActive: boolean;
}

/**
 * Hook unifié pour gérer les demandes professionnelles
 */
export function useProRequest(
  userId: string | null | undefined,
  options: UseProRequestOptions = {}
): UseProRequestResult {
  const {
    showInAppNotifications = true,
    autoLoad = true,
    debug = false
  } = options;

  // État local
  const [state, setState] = useState<{
    status: ProRequestState;
    request: ProRequestStatus | null;
    isLoading: boolean;
    error: string | null;
    hasRequest: boolean;
    canMakeNewRequest: boolean;
  }>({
    status: 'none',
    request: null,
    isLoading: true,
    error: null,
    hasRequest: false,
    canMakeNewRequest: true
  });

  // Hook realtime pour les changements
  const { isActive: isRealtimeActive } = useProRequestRealtime(userId, {
    showInAppNotifications,
    debug,
    onStatusChange: async (newStatus) => {
      if (debug) {
        logger.dev('🔄 useProRequest: Changement de statut détecté:', newStatus);
      }

      // Mettre à jour l'état local immédiatement
      setState(prev => ({
        ...prev,
        status: newStatus,
        hasRequest: true,
        canMakeNewRequest: newStatus === 'rejected'
      }));

      // Recharger les données complètes
      await loadProRequestStatus();
    }
  });

  /**
   * Charge le statut de la demande pro
   */
  const loadProRequestStatus = useCallback(async () => {
    if (!userId) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        status: 'none',
        hasRequest: false,
        request: null,
        canMakeNewRequest: true
      }));
      return;
    }

    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      if (debug) {
        logger.dev('📋 useProRequest: Chargement du statut pour:', userId);
      }

      const result: UserProRequestResult = await checkUserProRequestStatus(userId);

      setState({
        status: result.status || 'none',
        request: result.request,
        hasRequest: result.hasRequest,
        canMakeNewRequest: result.canMakeNewRequest,
        isLoading: false,
        error: null
      });

      if (debug) {
        logger.dev('✅ useProRequest: Statut chargé:', result.status);
      }
    } catch (error) {
      logger.error('❌ useProRequest: Erreur chargement:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Erreur inconnue'
      }));
    }
  }, [userId, debug]);

  // Chargement initial
  useEffect(() => {
    if (autoLoad) {
      loadProRequestStatus();
    }
  }, [userId, autoLoad, loadProRequestStatus]);

  // Interface de retour avec flags pratiques
  return {
    // État de base
    status: state.status,
    request: state.request,
    isLoading: state.isLoading,
    error: state.error,

    // Flags utiles pour l'UI
    hasRequest: state.hasRequest,
    canMakeNewRequest: state.canMakeNewRequest,
    isPending: state.status === 'pending',
    isApproved: state.status === 'approved',
    isRejected: state.status === 'rejected',

    // Actions
    refresh: loadProRequestStatus,

    // Realtime
    isRealtimeActive
  };
}

/**
 * Version simplifiée pour usage basique
 */
export function useProRequestSimple(userId: string | null | undefined) {
  return useProRequest(userId, {
    showInAppNotifications: true,
    autoLoad: true,
    debug: __DEV__
  });
}