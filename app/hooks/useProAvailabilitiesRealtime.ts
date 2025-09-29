/**
 * Hook useProAvailabilitiesRealtime - Écoute spécifique pour les disponibilités pro
 *
 * Hook spécialisé pour écouter les changements sur les tables de disponibilités
 * et invalider automatiquement le cache React Query de la section disponibilités.
 */
import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useProProfileRealtime } from './useProProfileRealtime';
import { logger } from '@/utils/logger';

interface ProAvailabilitiesRealtimeOptions {
  /**
   * Activer les logs de debug
   * @default __DEV__
   */
  debug?: boolean;

  /**
   * Callback appelé lors d'un changement de disponibilité
   */
  onAvailabilityChange?: (table: string, profileId: string, payload: any) => void;
}

/**
 * Hook pour écouter les changements temps réel des disponibilités pro
 * et invalider automatiquement le cache de la section disponibilités
 */
export function useProAvailabilitiesRealtime(
  profileId: string | null | undefined,
  options: ProAvailabilitiesRealtimeOptions = {}
) {
  const { debug = __DEV__, onAvailabilityChange } = options;
  const queryClient = useQueryClient();

  // Callback spécialisé pour les changements de disponibilités
  const handleAvailabilityChange = useCallback(
    (table: string, affectedProfileId: string, payload: any) => {
      if (debug) {
        logger.dev(`📅 Changement disponibilité [${table}]:`, {
          profileId: affectedProfileId,
          event: payload.eventType,
          changes: payload.new,
        });
      }

      // Callback personnalisé
      onAvailabilityChange?.(table, affectedProfileId, payload);

      // Forcer le re-fetch immédiat du cache des disponibilités (ignore le staleTime)
      queryClient.refetchQueries({
        queryKey: ['proCourses', affectedProfileId],
        exact: false, // Permet de matcher toutes les clés qui commencent par ['proCourses', profileId]
      });

      // Invalider aussi le cache du profil complet (au cas où)
      queryClient.invalidateQueries({
        queryKey: ['proProfile', affectedProfileId],
      });

      if (debug) {
        logger.dev(`♻️ Cache disponibilités invalidé pour: ${affectedProfileId}`);
      }
    },
    [queryClient, onAvailabilityChange, debug]
  );

  // Utiliser le hook générique avec les tables spécifiques aux disponibilités
  const realtimeHook = useProProfileRealtime(profileId, {
    debug,
    onChange: handleAvailabilityChange,
    tables: ['pro_availabilities', 'pro_daily_availabilities', 'pro_availability_settings'],
    debounceMs: 300, // Plus réactif pour les disponibilités
  });

  return {
    /**
     * Forcer une reconnexion aux channels Realtime
     */
    reconnect: realtimeHook.reconnect,

    /**
     * Indique si le hook est actif
     */
    isActive: realtimeHook.isActive,

    /**
     * Tables surveillées pour les disponibilités
     */
    watchedTables: realtimeHook.watchedTables,
  };
}

/**
 * Version simplifiée pour usage basique
 */
export function useProAvailabilitiesRealtimeSimple(profileId: string | null | undefined) {
  return useProAvailabilitiesRealtime(profileId, {
    debug: __DEV__,
  });
}