import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import { premiumService } from '@/services/premium.service';
import { PremiumSubscription, SkillType } from '@/types/premium';
import { supabase } from '@/utils/supabase/client';
import { logger } from '@/utils/logger';
import type { RealtimeChannel } from '@supabase/supabase-js';

/**
 * Hook pour gérer le statut premium d'un utilisateur
 * Avec écoute temps réel des changements de subscription
 */
export function usePremium() {
  const { user } = useAuth();
  const [isPremium, setIsPremium] = useState<boolean>(false);
  const [subscription, setSubscription] = useState<PremiumSubscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  /**
   * Vérifie le statut premium de l'utilisateur
   */
  const checkPremiumStatus = useCallback(async () => {
    if (!user?.id) {
      setIsPremium(false);
      setSubscription(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      logger.dev('[usePremium] Vérification statut premium pour user:', user.id);

      // Vérifier si l'utilisateur est premium
      const { data: isPremiumData, error: premiumError } = await premiumService.checkUserPremium(
        user.id
      );

      if (premiumError) {
        throw premiumError;
      }

      setIsPremium(isPremiumData || false);

      // Si premium, récupérer les détails de l'abonnement
      if (isPremiumData) {
        const { data: subData, error: subError } = await premiumService.getPremiumSubscription(
          user.id
        );

        if (subError) {
          logger.error('[usePremium] Erreur récupération subscription:', subError);
        } else {
          setSubscription(subData);
        }
      } else {
        setSubscription(null);
      }

      logger.dev('[usePremium] Statut premium:', isPremiumData, 'Subscription:', subscription);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Erreur inconnue');
      logger.error('[usePremium] Erreur checkPremiumStatus:', error);
      setError(error);
      setIsPremium(false);
      setSubscription(null);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  /**
   * Gestionnaire des changements temps réel de subscription
   */
  const handlePremiumChange = useCallback(
    (payload: any) => {
      logger.dev('[usePremium] Changement détecté:', payload);

      // Invalider le cache et re-vérifier
      if (user?.id) {
        premiumService.invalidatePremiumCache(user.id);
        checkPremiumStatus();
      }
    },
    [user?.id, checkPremiumStatus]
  );

  /**
   * Vérifie si l'utilisateur peut accéder à une vidéo de skill
   */
  const canAccessSkill = useCallback(
    async (skill: SkillType): Promise<boolean> => {
      if (!user?.id) {
        return false;
      }

      const { data, error } = await premiumService.canAccessSkillVideo(user.id, skill);

      if (error) {
        logger.error('[usePremium] Erreur canAccessSkill:', error);
        return false;
      }

      return data || false;
    },
    [user?.id]
  );

  /**
   * Vérifie le statut premium au mount et quand l'utilisateur change
   */
  useEffect(() => {
    checkPremiumStatus();
  }, [checkPremiumStatus]);

  /**
   * Écoute temps réel des changements de subscription
   */
  useEffect(() => {
    if (!user?.id) {
      return;
    }

    logger.dev('[usePremium] Initialisation écoute temps réel pour user:', user.id);

    let channel: RealtimeChannel;

    const setupRealtimeSubscription = async () => {
      channel = supabase
        .channel(`premium_changes_${user.id}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'premium_subscriptions',
            filter: `user_id=eq.${user.id}`,
          },
          handlePremiumChange
        )
        .subscribe((status) => {
          logger.dev('[usePremium] Statut subscription realtime:', status);
        });
    };

    setupRealtimeSubscription();

    return () => {
      if (channel) {
        logger.dev('[usePremium] Nettoyage écoute temps réel');
        supabase.removeChannel(channel);
      }
    };
  }, [user?.id, handlePremiumChange]);

  return {
    isPremium,
    subscription,
    loading,
    error,
    refresh: checkPremiumStatus,
    canAccessSkill,
  };
}
