/**
 * usePriceCalculation - Hook pour les calculs de prix des réservations
 *
 * ✅ EXTRAIT du BookingScreen pour améliorer la modularité
 */
import { useState, useEffect, useCallback } from 'react';

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
}

// Constantes de calcul des prix
const PRICING_CONFIG = {
  // Frais de plateforme (en pourcentage)
  PLATFORM_FEE_RATE: 0.2, // 20%

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
  const [isLoading, setIsLoading] = useState(false);

  // Prix total calculé automatiquement
  const totalAmount = calculatedPrice + proFee + platformFee;

  // Calcul des prix basé sur les paramètres
  const calculatePrices = useCallback((params: PriceCalculationParams): PriceBreakdown => {
    const { numberOfPlayers, holes, baseProPrice } = params;

    // Prix de base du pro (soit fourni, soit calculé)
    const basePrice = baseProPrice || PRICING_CONFIG.BASE_PRICE_PER_PLAYER_PER_HOLE[holes];
    const calculatedProFee = Math.max(basePrice * numberOfPlayers, PRICING_CONFIG.MIN_PRO_FEE);

    // Frais de plateforme
    const calculatedPlatformFee = Math.max(
      calculatedProFee * PRICING_CONFIG.PLATFORM_FEE_RATE,
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
  }, []);

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
  };
}

// Utilitaire pour calculer directement sans hook
export function calculateBookingPrice(params: PriceCalculationParams): PriceBreakdown {
  const { numberOfPlayers, holes, baseProPrice } = params;

  const basePrice = baseProPrice || PRICING_CONFIG.BASE_PRICE_PER_PLAYER_PER_HOLE[holes];
  const proFee = Math.max(basePrice * numberOfPlayers, PRICING_CONFIG.MIN_PRO_FEE);

  const platformFee = Math.max(
    proFee * 0.2, // 20% de commission
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
