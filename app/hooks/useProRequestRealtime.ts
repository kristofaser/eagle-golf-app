/**
 * Hook useProRequestRealtime - Écoute en temps réel les changements de statut des demandes pro
 *
 * Utilise Supabase Realtime pour détecter quand l'admin valide/rejette une demande.
 * Se connecte automatiquement aux changements de la table pro_validation_requests.
 *
 * ✅ SÉCURISÉ : Utilise uniquement les méthodes existantes du UserContext
 * ✅ NON INVASIF : Hook séparé, aucun impact sur l'architecture existante
 * ✅ PERFORMANT : Se désabonne automatiquement au démontage
 */
import { useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/utils/supabase/client';
import { useUserContext } from '@/contexts/UserContext';
import { Alert } from 'react-native';
import { logger } from '@/utils/logger';

interface ProRequestRealtimeOptions {
  /**
   * Activer les notifications in-app lors des changements
   * @default true
   */
  showInAppNotifications?: boolean;

  /**
   * Callback appelé lors d'un changement de statut
   */
  onStatusChange?: (newStatus: 'pending' | 'approved' | 'rejected', oldStatus?: string) => void;

  /**
   * Debug mode pour voir les logs
   * @default false
   */
  debug?: boolean;
}

/**
 * Hook pour écouter les changements en temps réel des demandes professionnelles
 *
 * @param userId - ID de l'utilisateur à surveiller
 * @param options - Options de configuration
 */
export function useProRequestRealtime(
  userId: string | null | undefined,
  options: ProRequestRealtimeOptions = {}
) {
  const { showInAppNotifications = true, onStatusChange, debug = false } = options;

  const { loadUserProfile } = useUserContext();
  const channelRef = useRef<any>(null);

  const handleStatusChange = useCallback(
    async (payload: any) => {
      const newStatus = payload.new.status;
      const oldStatus = payload.old?.status;

      if (debug) {
        logger.dev('🔄 Realtime Pro Request:', {
          userId,
          oldStatus,
          newStatus,
          payload: payload.new,
        });
      }

      // Callback personnalisé
      onStatusChange?.(newStatus, oldStatus);

      // Notifications in-app basées sur le statut
      if (showInAppNotifications && newStatus !== oldStatus) {
        switch (newStatus) {
          case 'approved':
            Alert.alert(
              'Félicitations ! 🎉',
              'Votre demande professionnelle a été approuvée ! Votre compte sera mis à jour automatiquement.',
              [{ text: 'Super !', style: 'default' }]
            );

            // Recharger le profil utilisateur pour mettre à jour le user_type
            if (userId) {
              try {
                logger.dev('🔄 Rechargement du profil après approbation...');
                await loadUserProfile(userId);
                logger.dev('✅ Profil rechargé avec succès');
              } catch (error) {
                logger.error('❌ Erreur rechargement profil', error);
              }
            }
            break;

          case 'rejected':
            Alert.alert(
              'Demande mise à jour',
              'Votre demande professionnelle a été examinée. Consultez les détails dans votre profil.',
              [{ text: 'Voir les détails', style: 'default' }]
            );
            break;

          case 'pending':
            if (oldStatus && oldStatus !== 'pending') {
              Alert.alert(
                'Demande en cours',
                "Votre demande professionnelle est en cours d'examen.",
                [{ text: 'OK', style: 'default' }]
              );
            }
            break;
        }
      }
    },
    [userId, onStatusChange, showInAppNotifications, loadUserProfile, debug]
  );

  useEffect(() => {
    // Ne pas s'abonner si pas d'utilisateur
    if (!userId) {
      if (debug) {
        logger.dev("⏭️ Realtime Pro Request: Pas d'userId, skip subscription");
      }
      return;
    }

    if (debug) {
      logger.dev('🔗 Realtime Pro Request: Connexion pour userId:', userId);
    }

    // Créer le channel Supabase Realtime
    const channelName = `pro-request-${userId}`;
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE', // Écouter seulement les mises à jour
          schema: 'public',
          table: 'pro_validation_requests',
          filter: `user_id=eq.${userId}`, // Filtrer par utilisateur
        },
        handleStatusChange
      )
      .subscribe((status) => {
        if (debug) {
          logger.dev('🔗 Realtime Pro Request: Statut subscription:', status);
        }
      });

    channelRef.current = channel;

    // Nettoyage à la destruction du composant
    return () => {
      if (debug) {
        logger.dev('🔌 Realtime Pro Request: Déconnexion channel');
      }

      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [userId, handleStatusChange, debug]);

  // Fonction utilitaire pour forcer une reconnexion
  const reconnect = useCallback(() => {
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }

    if (userId) {
      const channelName = `pro-request-${userId}-reconnect`;
      const channel = supabase
        .channel(channelName)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'pro_validation_requests',
            filter: `user_id=eq.${userId}`,
          },
          handleStatusChange
        )
        .subscribe();

      channelRef.current = channel;

      if (debug) {
        logger.dev('🔄 Realtime Pro Request: Reconnexion forcée');
      }
    }
  }, [userId, handleStatusChange, debug]);

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
export function useProRequestRealtimeSimple(userId: string | null | undefined) {
  return useProRequestRealtime(userId, {
    showInAppNotifications: true,
    debug: __DEV__, // Debug en mode développement seulement
  });
}
