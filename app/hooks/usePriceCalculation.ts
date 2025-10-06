/**
 * usePriceCalculation - Hook pour les calculs de prix des réservations
 *
 * ✅ EXTRAIT du BookingScreen pour améliorer la modularité
 * ✅ REALTIME : Utilise CommissionContext pour les mises à jour temps réel
 */
import { useState, useCallback } from 'react';
import { useCommission } from '@/contexts/CommissionContext';

interface PriceCalculationParams {
  numberOfPlayers: number;
  holes: 9 | 18;
  baseProPrice?: number;
}

interface PriceBreakdown {
  calculatedPrice: number;
  proFee: number;
  platformFee: number;
  totalAmount: number;
}

interface UsePriceCalculationReturn extends PriceBreakdown {
  setPrices: (prices: Partial<PriceBreakdown>) => void;
  calculatePrices: (params: PriceCalculationParams) => PriceBreakdown;
  formatPrice: (price: number) => string;
  getPriceInCents: (price: number) => number;
  isLoading: boolean;
  commissionRate: number;
}

// Constantes de calcul des prix
const PRICING_CONFIG = {
  // Prix de base par joueur par trou (en euros)
  BASE_PRICE_PER_PLAYER_PER_HOLE: {
    9: 15, // 15€ par joueur pour 9 trous
    18: 25, // 25€ par joueur pour 18 trous
  },

  // Frais minimums
  MIN_PRO_FEE: 50,
  MIN_PLATFORM_FEE: 5,
} as const;

export function usePriceCalculation(): UsePriceCalculationReturn {
  const [calculatedPrice, setCalculatedPrice] = useState(0);
  const [proFee, setProFee] = useState(0);
  const [platformFee, setPlatformFee] = useState(0);

  // Utiliser la commission depuis le CommissionContext (temps réel automatique)
  const { commissionRate, isLoading } = useCommission();

  // Prix total calculé automatiquement
  const totalAmount = calculatedPrice + proFee + platformFee;

  // Calcul des prix basé sur les paramètres
  const calculatePrices = useCallback((params: PriceCalculationParams): PriceBreakdown => {
    const { numberOfPlayers, holes, baseProPrice } = params;

    // Prix de base du pro (soit fourni, soit calculé)
    const basePrice = baseProPrice || PRICING_CONFIG.BASE_PRICE_PER_PLAYER_PER_HOLE[holes];
    const calculatedProFee = Math.max(basePrice * numberOfPlayers, PRICING_CONFIG.MIN_PRO_FEE);

    // Frais de plateforme (utilise la commission dynamique depuis Supabase)
    const calculatedPlatformFee = Math.max(
      calculatedProFee * commissionRate,
      PRICING_CONFIG.MIN_PLATFORM_FEE
    );

    // Prix total
    const total = calculatedProFee + calculatedPlatformFee;

    return {
      calculatedPrice: total,
      proFee: calculatedProFee,
      platformFee: calculatedPlatformFee,
      totalAmount: total,
    };
  }, [commissionRate]);

  // Mise à jour manuelle des prix
  const setPrices = useCallback((prices: Partial<PriceBreakdown>) => {
    if (prices.calculatedPrice !== undefined) {
      setCalculatedPrice(prices.calculatedPrice);
    }
    if (prices.proFee !== undefined) {
      setProFee(prices.proFee);
    }
    if (prices.platformFee !== undefined) {
      setPlatformFee(prices.platformFee);
    }
  }, []);

  // Formatage du prix pour l'affichage
  const formatPrice = (price: number): string => {
    return `${price.toFixed(0)}€`;
  };

  // Conversion en centimes pour les API de paiement
  const getPriceInCents = (price: number): number => {
    return Math.round(price * 100);
  };

  return {
    calculatedPrice,
    proFee,
    platformFee,
    totalAmount,
    setPrices,
    calculatePrices,
    formatPrice,
    getPriceInCents,
    isLoading,
    commissionRate,
  };
}

// Utilitaire pour calculer directement sans hook
// ⚠️ ATTENTION: Cette fonction utilise une commission par défaut de 20%
// Pour une commission dynamique, utilisez le hook usePriceCalculation() à la place
export function calculateBookingPrice(
  params: PriceCalculationParams,
  commissionRate: number = 0.2 // Fallback 20% si non fourni
): PriceBreakdown {
  const { numberOfPlayers, holes, baseProPrice } = params;

  const basePrice = baseProPrice || PRICING_CONFIG.BASE_PRICE_PER_PLAYER_PER_HOLE[holes];
  const proFee = Math.max(basePrice * numberOfPlayers, PRICING_CONFIG.MIN_PRO_FEE);

  const platformFee = Math.max(
    proFee * commissionRate,
    PRICING_CONFIG.MIN_PLATFORM_FEE
  );

  const totalAmount = proFee + platformFee;

  return {
    calculatedPrice: totalAmount,
    proFee,
    platformFee,
    totalAmount,
  };
}
