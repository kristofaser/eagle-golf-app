/**
 * Hook useProProfileRealtime - Écoute en temps réel les changements des profils pro
 *
 * Utilise Supabase Realtime pour détecter les changements sur :
 * - profiles (nom, avatar, etc.)
 * - pro_profiles (division, skills, photos, vidéos)
 * - pro_pricing (tarifs)
 *
 * ✅ PERFORMANT : Invalide automatiquement le cache React Query
 * ✅ SÉCURISÉ : Respecte les RLS policies existantes
 * ✅ ROBUSTE : Gestion reconnexion automatique et error handling
 */
import { useEffect, useCallback, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/utils/supabase/client';
import { logger } from '@/utils/logger';

interface ProProfileRealtimeOptions {
  /**
   * Activer les logs de debug
   * @default __DEV__
   */
  debug?: boolean;

  /**
   * Callback appelé lors d'un changement détecté
   */
  onChange?: (table: string, profileId: string, payload: any) => void;

  /**
   * Tables à écouter
   * @default ['profiles', 'pro_profiles', 'pro_pricing']
   */
  tables?: ('profiles' | 'pro_profiles' | 'pro_pricing' | 'amateur_profiles' | 'pro_availabilities' | 'pro_daily_availabilities' | 'pro_availability_settings')[];

  /**
   * Délai avant invalidation du cache (ms)
   * Permet d'éviter les invalidations trop fréquentes
   * @default 500
   */
  debounceMs?: number;
}

/**
 * Hook pour écouter les changements temps réel des profils pro
 *
 * @param profileId - ID du profil à surveiller (null pour désactiver)
 * @param options - Options de configuration
 */
export function useProProfileRealtime(
  profileId: string | null | undefined,
  options: ProProfileRealtimeOptions = {}
) {
  const {
    debug = __DEV__,
    onChange,
    tables = ['profiles', 'pro_profiles', 'pro_pricing'],
    debounceMs = 500,
  } = options;

  const queryClient = useQueryClient();
  const channelsRef = useRef<any[]>([]);
  const invalidateTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Fonction d'invalidation intelligente avec debounce
  const invalidateProfileCache = useCallback(
    (targetProfileId: string) => {
      // Annuler l'invalidation précédente si elle existe
      if (invalidateTimeoutRef.current) {
        clearTimeout(invalidateTimeoutRef.current);
      }

      // Programmer une nouvelle invalidation
      invalidateTimeoutRef.current = setTimeout(() => {
        if (debug) {
          logger.dev(`♻️ Invalidation cache profil: ${targetProfileId}`);
        }

        // Invalider le cache React Query pour ce profil
        queryClient.invalidateQueries({
          queryKey: ['proProfile', targetProfileId],
        });

        invalidateTimeoutRef.current = null;
      }, debounceMs);
    },
    [queryClient, debug, debounceMs]
  );

  // Handler générique pour tous les changements
  const handleChange = useCallback(
    (table: string, payload: any) => {
      if (!profileId) return;

      const { new: newRecord, old: oldRecord } = payload;

      // Déterminer l'ID du profil affecté selon la table
      let affectedProfileId: string | null = null;

      switch (table) {
        case 'profiles':
          affectedProfileId = newRecord?.id || oldRecord?.id;
          break;
        case 'pro_profiles':
          affectedProfileId = newRecord?.user_id || oldRecord?.user_id;
          break;
        case 'pro_pricing':
          affectedProfileId = newRecord?.pro_id || oldRecord?.pro_id;
          break;
        case 'amateur_profiles':
          affectedProfileId = newRecord?.user_id || oldRecord?.user_id;
          break;
        case 'pro_availabilities':
        case 'pro_daily_availabilities':
          affectedProfileId = newRecord?.pro_id || oldRecord?.pro_id;
          break;
        case 'pro_availability_settings':
          affectedProfileId = newRecord?.pro_id || oldRecord?.pro_id;
          break;
      }

      // Vérifier si c'est le profil qu'on surveille
      if (affectedProfileId === profileId) {
        if (debug) {
          logger.dev(`🔄 Changement détecté [${table}]:`, {
            profileId: affectedProfileId,
            event: payload.eventType,
            changes: newRecord,
          });
        }

        // Callback personnalisé
        onChange?.(table, affectedProfileId, payload);

        // Invalider le cache
        invalidateProfileCache(affectedProfileId);
      }
    },
    [profileId, onChange, invalidateProfileCache, debug]
  );

  useEffect(() => {
    // Ne pas s'abonner si pas de profil à surveiller
    if (!profileId) {
      if (debug) {
        logger.dev("⏭️ Realtime Pro Profile: Pas de profileId, skip subscription");
      }
      return;
    }

    if (debug) {
      logger.dev('🔗 Realtime Pro Profile: Connexion pour profileId:', profileId);
    }

    // Nettoyer les channels précédents
    channelsRef.current.forEach((channel) => {
      supabase.removeChannel(channel);
    });
    channelsRef.current = [];

    // Créer un channel pour chaque table à surveiller
    tables.forEach((table, index) => {
      const channelName = `pro-profile-${table}-${profileId}`;

      // Construire le filtre selon la table
      let filter: string;
      switch (table) {
        case 'profiles':
          filter = `id=eq.${profileId}`;
          break;
        case 'pro_profiles':
          filter = `user_id=eq.${profileId}`;
          break;
        case 'pro_pricing':
          filter = `pro_id=eq.${profileId}`;
          break;
        case 'amateur_profiles':
          filter = `user_id=eq.${profileId}`;
          break;
        case 'pro_availabilities':
        case 'pro_daily_availabilities':
        case 'pro_availability_settings':
          filter = `pro_id=eq.${profileId}`;
          break;
        default:
          return; // Skip si table inconnue
      }

      const channel = supabase
        .channel(channelName)
        .on(
          'postgres_changes',
          {
            event: '*', // Écouter INSERT, UPDATE, DELETE
            schema: 'public',
            table,
            filter,
          },
          (payload) => handleChange(table, payload)
        )
        .subscribe((status) => {
          if (debug) {
            logger.dev(`🔗 Realtime Pro Profile [${table}]: Statut subscription:`, status);
          }
        });

      channelsRef.current.push(channel);
    });

    // Nettoyage à la destruction
    return () => {
      if (debug) {
        logger.dev('🔌 Realtime Pro Profile: Déconnexion channels');
      }

      // Annuler l'invalidation en attente
      if (invalidateTimeoutRef.current) {
        clearTimeout(invalidateTimeoutRef.current);
        invalidateTimeoutRef.current = null;
      }

      // Supprimer tous les channels
      channelsRef.current.forEach((channel) => {
        supabase.removeChannel(channel);
      });
      channelsRef.current = [];
    };
  }, [profileId, tables, handleChange, debug]);

  // Fonction pour forcer une reconnexion
  const reconnect = useCallback(() => {
    if (!profileId) return;

    if (debug) {
      logger.dev('🔄 Realtime Pro Profile: Reconnexion forcée');
    }

    // Nettoyer les channels existants
    channelsRef.current.forEach((channel) => {
      supabase.removeChannel(channel);
    });
    channelsRef.current = [];

    // Récréer les subscriptions
    tables.forEach((table) => {
      const channelName = `pro-profile-${table}-${profileId}-reconnect`;

      let filter: string;
      switch (table) {
        case 'profiles':
          filter = `id=eq.${profileId}`;
          break;
        case 'pro_profiles':
          filter = `user_id=eq.${profileId}`;
          break;
        case 'pro_pricing':
          filter = `pro_id=eq.${profileId}`;
          break;
        case 'amateur_profiles':
          filter = `user_id=eq.${profileId}`;
          break;
        case 'pro_availabilities':
        case 'pro_daily_availabilities':
        case 'pro_availability_settings':
          filter = `pro_id=eq.${profileId}`;
          break;
        default:
          return;
      }

      const channel = supabase
        .channel(channelName)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table,
            filter,
          },
          (payload) => handleChange(table, payload)
        )
        .subscribe();

      channelsRef.current.push(channel);
    });
  }, [profileId, tables, handleChange, debug]);

  return {
    /**
     * Forcer une reconnexion aux channels Realtime
     */
    reconnect,

    /**
     * Indique si le hook est actif
     */
    isActive: !!profileId,

    /**
     * Tables surveillées
     */
    watchedTables: tables,
  };
}

/**
 * Version simplifiée pour usage basique
 * Surveille les 3 tables principales avec debug automatique
 */
export function useProProfileRealtimeSimple(profileId: string | null | undefined) {
  return useProProfileRealtime(profileId, {
    debug: __DEV__,
    tables: ['profiles', 'pro_profiles', 'pro_pricing'],
  });
}