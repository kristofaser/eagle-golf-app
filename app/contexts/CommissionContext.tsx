/**
 * CommissionContext - Provider pour la commission dynamique
 *
 * Gère le chargement et les mises à jour temps réel de la commission
 * depuis la table commission_settings.
 *
 * ✅ CENTRALISÉ : Une seule source de vérité pour toute l'app
 * ✅ TEMPS RÉEL : Écoute les changements via Supabase Realtime
 * ✅ PERFORMANT : Chargement initial + mise à jour automatique
 */
import React, { createContext, useContext, useEffect, useState } from 'react';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '@/utils/supabase/client';
import { pricingService } from '@/services/pricing.service';
import { logger } from '@/utils/logger';

interface CommissionContextValue {
  /**
   * Taux de commission actuel (en décimal, ex: 0.2 pour 20%)
   */
  commissionRate: number;

  /**
   * Commission en pourcentage (ex: 20 pour 20%)
   */
  commissionPercentage: number;

  /**
   * Indique si le chargement initial est en cours
   */
  isLoading: boolean;

  /**
   * Erreur éventuelle lors du chargement
   */
  error: Error | null;

  /**
   * Forcer le rechargement de la commission
   */
  refresh: () => Promise<void>;
}

const CommissionContext = createContext<CommissionContextValue | null>(null);

interface CommissionProviderProps {
  children: React.ReactNode;
}

export function CommissionProvider({ children }: CommissionProviderProps) {
  const [commissionRate, setCommissionRate] = useState<number>(0.2); // 20% par défaut
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  /**
   * Charge la commission depuis Supabase
   */
  const loadCommission = async () => {
    try {
      setIsLoading(true);
      setError(null);

      logger.dev('[CommissionContext] Chargement de la commission...');

      const currentCommission = await pricingService.getCurrentCommission();

      // Convertir en décimal (20 → 0.2)
      const rate = currentCommission / 100;
      setCommissionRate(rate);

      logger.dev('[CommissionContext] Commission chargée:', {
        percentage: currentCommission,
        rate,
      });
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Erreur chargement commission');
      logger.error('[CommissionContext] Erreur chargement commission:', error);
      setError(error);
      // Garder la valeur par défaut (20%) en cas d'erreur
      setCommissionRate(0.2);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Gestionnaire des changements temps réel
   */
  const handleCommissionChange = (payload: any) => {
    logger.dev('[CommissionContext] Changement détecté:', payload);

    if (payload.new && typeof payload.new.percentage === 'number') {
      const newRate = payload.new.percentage / 100;
      setCommissionRate(newRate);

      logger.dev('[CommissionContext] Commission mise à jour:', {
        percentage: payload.new.percentage,
        rate: newRate,
      });
    }
  };

  /**
   * Chargement initial de la commission
   */
  useEffect(() => {
    loadCommission();
  }, []);

  /**
   * Écoute temps réel des changements de commission
   */
  useEffect(() => {
    logger.dev('[CommissionContext] Initialisation écoute Realtime');

    let channel: RealtimeChannel;

    const setupRealtimeSubscription = () => {
      channel = supabase
        .channel('commission_settings_changes')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'commission_settings',
          },
          handleCommissionChange
        )
        .subscribe((status) => {
          logger.dev('[CommissionContext] Statut subscription Realtime:', status);
        });
    };

    setupRealtimeSubscription();

    // Cleanup
    return () => {
      if (channel) {
        logger.dev('[CommissionContext] Nettoyage écoute Realtime');
        supabase.removeChannel(channel);
      }
    };
  }, []);

  const contextValue: CommissionContextValue = {
    commissionRate,
    commissionPercentage: commissionRate * 100,
    isLoading,
    error,
    refresh: loadCommission,
  };

  return <CommissionContext.Provider value={contextValue}>{children}</CommissionContext.Provider>;
}

/**
 * Hook pour utiliser le contexte de commission
 */
export function useCommission(): CommissionContextValue {
  const context = useContext(CommissionContext);

  if (!context) {
    throw new Error('useCommission must be used within a CommissionProvider');
  }

  return context;
}

/**
 * Hook simplifié pour obtenir uniquement le taux
 */
export function useCommissionRate(): number {
  const { commissionRate } = useCommission();
  return commissionRate;
}

/**
 * Hook simplifié pour obtenir uniquement le pourcentage
 */
export function useCommissionPercentage(): number {
  const { commissionPercentage } = useCommission();
  return commissionPercentage;
}
