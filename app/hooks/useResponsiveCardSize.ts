import { useWindowDimensions } from 'react-native';
import { useMemo } from 'react';
import { RESPONSIVE_CONFIG } from '@/utils/constants/animations';

/**
 * Hook pour calculer les dimensions des cartes de manière responsive
 * Optimisé avec memoization pour éviter les recalculs
 */
export const useResponsiveCardSize = () => {
  const { width: screenWidth } = useWindowDimensions();

  const cardDimensions = useMemo(() => {
    const { CARD_SIZES, SPACING } = RESPONSIVE_CONFIG;

    // Calcul adaptatif basé sur la largeur d'écran
    const availableWidth = screenWidth - SPACING.HORIZONTAL_PADDING * 2;
    const isTablet = screenWidth >= RESPONSIVE_CONFIG.BREAKPOINTS.TABLET;

    // Ajuster le nombre de cartes pour l'effet "peek"
    // Mobile: ~2.3 cartes visibles (pour voir un bout de la 3ème)
    // Tablet: ~3.2 cartes visibles
    const cardsPerRow = isTablet ? 3.2 : 2.3;

    // Largeur optimale en tenant compte des marges pour l'effet peek
    const totalMargins = (Math.floor(cardsPerRow) - 1) * SPACING.CARD_MARGIN;
    const optimalWidth = (availableWidth - totalMargins) / cardsPerRow;

    // Contraindre entre min et max, mais privilégier l'effet peek
    const cardWidth = Math.max(CARD_SIZES.MIN_WIDTH, Math.min(CARD_SIZES.MAX_WIDTH, optimalWidth));

    const cardHeight = cardWidth * CARD_SIZES.ASPECT_RATIO;

    return {
      cardWidth,
      cardHeight,
      cardsPerRow: Math.floor(cardsPerRow),
      isTablet,
      screenWidth,
    };
  }, [screenWidth]);

  return cardDimensions;
};
