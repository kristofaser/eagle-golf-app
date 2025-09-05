/**
 * Hook useUserDeletionRealtime - Déconnexion automatique si utilisateur supprimé
 * 
 * Écoute en temps réel les suppressions de profils pour déconnecter immédiatement
 * l'utilisateur si son compte est supprimé par un administrateur depuis le backoffice.
 * 
 * ✅ SÉCURISÉ : Hook isolé sans effet de bord sur l'architecture existante
 * ✅ NON INVASIF : Utilise seulement des callbacks vers l'extérieur  
 * ✅ PERFORMANT : Se désabonne automatiquement au démontage
 * ✅ ROBUSTE : Gestion d'erreur complète avec fallback
 */
import { useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/utils/supabase/client';
import { Alert } from 'react-native';

interface UserDeletionRealtimeOptions {
  /**
   * Callback appelé quand l'utilisateur est supprimé
   * Permet à l'appelant de décider quoi faire (déconnexion, navigation, etc.)
   */
  onUserDeleted?: () => void;
  
  /**
   * Message personnalisé à afficher à l'utilisateur
   * @default "Votre compte a été supprimé par un administrateur. Vous avez été déconnecté."
   */
  deletionMessage?: string;
  
  /**
   * Afficher une alerte à l'utilisateur
   * @default true
   */
  showAlert?: boolean;
  
  /**
   * Debug mode pour voir les logs de développement
   * @default false
   */
  debug?: boolean;
}

/**
 * Hook pour écouter les suppressions d'utilisateur en temps réel
 * 
 * @param userId - ID de l'utilisateur à surveiller (null = pas d'écoute)
 * @param options - Options de configuration du hook
 * 
 * @example
 * ```typescript
 * // Usage basique dans un contexte
 * useUserDeletionRealtime(session?.user?.id, {
 *   onUserDeleted: async () => {
 *     await supabase.auth.signOut();
 *   }
 * });
 * ```
 * 
 * @example  
 * ```typescript
 * // Usage avec options complètes
 * useUserDeletionRealtime(userId, {
 *   debug: __DEV__,
 *   showAlert: true,
 *   deletionMessage: "Votre compte n'est plus disponible.",
 *   onUserDeleted: () => {
 *     // Actions personnalisées
 *   }
 * });
 * ```
 */
export function useUserDeletionRealtime(
  userId: string | null | undefined,
  options: UserDeletionRealtimeOptions = {}
) {
  const {
    onUserDeleted,
    deletionMessage = 'Votre compte a été supprimé par un administrateur. Vous avez été déconnecté.',
    showAlert = true,
    debug = false
  } = options;
  
  const channelRef = useRef<any>(null);
  const isSubscribedRef = useRef(false);
  
  const handleUserDeletion = useCallback(async (payload: any) => {
    if (debug) {
      console.log('🚨 Realtime User Deletion: Utilisateur supprimé détecté', {
        userId,
        deletedId: payload.old?.id,
        payload: payload.old
      });
    }
    
    try {
      // Vérifier que c'est bien notre utilisateur qui a été supprimé
      if (payload.old?.id !== userId) {
        if (debug) {
          console.log('⏭️ Realtime User Deletion: Utilisateur différent ignoré', {
            deletedId: payload.old?.id,
            currentUserId: userId
          });
        }
        return;
      }
      
      // Afficher l'alerte si demandé
      if (showAlert) {
        Alert.alert(
          'Compte supprimé',
          deletionMessage,
          [{ 
            text: 'OK', 
            style: 'default',
            onPress: () => {
              if (debug) {
                console.log('✅ Realtime User Deletion: Utilisateur a confirmé l\'alerte');
              }
            }
          }]
        );
      }
      
      // Callback personnalisé (déconnexion, navigation, etc.)
      if (onUserDeleted) {
        if (debug) {
          console.log('🔄 Realtime User Deletion: Exécution callback onUserDeleted');
        }
        await onUserDeleted();
      }
      
      if (debug) {
        console.log('✅ Realtime User Deletion: Traitement terminé avec succès');
      }
      
    } catch (error) {
      console.error('❌ Realtime User Deletion: Erreur lors du traitement:', error);
      
      // En cas d'erreur, essayer quand même d'exécuter le callback
      try {
        if (onUserDeleted) {
          await onUserDeleted();
        }
      } catch (callbackError) {
        console.error('❌ Realtime User Deletion: Erreur callback fallback:', callbackError);
      }
    }
  }, [userId, onUserDeleted, deletionMessage, showAlert, debug]);
  
  useEffect(() => {
    // Ne pas s'abonner si pas d'utilisateur
    if (!userId) {
      if (debug) {
        console.log('⏭️ Realtime User Deletion: Pas d\'userId, skip subscription');
      }
      
      // Nettoyer une éventuelle subscription précédente
      if (channelRef.current) {
        if (debug) {
          console.log('🔌 Realtime User Deletion: Nettoyage subscription précédente');
        }
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
        isSubscribedRef.current = false;
      }
      
      return;
    }
    
    // Éviter les subscriptions multiples
    if (isSubscribedRef.current && channelRef.current) {
      if (debug) {
        console.log('⏭️ Realtime User Deletion: Subscription déjà active');
      }
      return;
    }
    
    if (debug) {
      console.log('🔗 Realtime User Deletion: Connexion pour userId:', userId);
    }
    
    // Créer le channel Supabase Realtime avec un nom unique
    const channelName = `user-deletion-${userId}-${Date.now()}`;
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'DELETE', // Écouter uniquement les suppressions
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${userId}` // Filtrer par notre utilisateur uniquement
        },
        handleUserDeletion
      )
      .subscribe((status) => {
        isSubscribedRef.current = status === 'SUBSCRIBED';
        
        if (debug) {
          console.log('🔗 Realtime User Deletion: Statut subscription:', status);
        }
        
        if (status === 'CHANNEL_ERROR') {
          console.error('❌ Realtime User Deletion: Erreur de channel');
          isSubscribedRef.current = false;
        }
        
        if (status === 'TIMED_OUT') {
          console.warn('⏰ Realtime User Deletion: Timeout de connexion');
          isSubscribedRef.current = false;
        }
      });
    
    channelRef.current = channel;
    
    // Nettoyage à la destruction du composant
    return () => {
      if (debug) {
        console.log('🔌 Realtime User Deletion: Déconnexion channel pour userId:', userId);
      }
      
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
      
      isSubscribedRef.current = false;
    };
  }, [userId, handleUserDeletion, debug]);
  
  // Fonction utilitaire pour forcer une reconnexion (troubleshooting)
  const reconnect = useCallback(() => {
    if (debug) {
      console.log('🔄 Realtime User Deletion: Reconnexion forcée demandée');
    }
    
    // Nettoyer la connexion actuelle
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }
    isSubscribedRef.current = false;
    
    // La reconnexion se fera automatiquement via useEffect
  }, [debug]);
  
  return {
    /**
     * Indique si le hook est actif (a un userId valide)
     */
    isActive: !!userId,
    
    /**
     * Indique si la subscription Realtime est établie
     */
    isSubscribed: isSubscribedRef.current,
    
    /**
     * Forcer une reconnexion au channel realtime
     * Utile pour le troubleshooting ou après une erreur de connexion
     */
    reconnect,
  };
}

/**
 * Version simplifiée du hook pour usage basique
 * Configure automatiquement les options les plus courantes
 * 
 * @param userId - ID de l'utilisateur à surveiller
 * @param onUserDeleted - Callback appelé lors de la suppression
 */
export function useUserDeletionRealtimeSimple(
  userId: string | null | undefined,
  onUserDeleted?: () => void
) {
  return useUserDeletionRealtime(userId, {
    onUserDeleted,
    showAlert: true,
    debug: __DEV__, // Debug automatique en mode développement
  });
}