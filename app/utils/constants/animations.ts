import { Easing } from 'react-native-reanimated';
import { Colors } from '@/constants/theme';

/**
 * Animation constants pour le système de cartes Eagle Golf
 * Centralisé pour cohérence et maintenance
 */
export const ANIMATION_CONFIG = {
  // Durées d'animation
  DURATION: 400,
  CONTENT_FADE_DURATION: 200,
  SPRING_DURATION: 300,

  // Dimensions
  IMAGE_HEIGHT: 300,
  HEADER_HEIGHT: 60,
  SAFE_AREA_TOP: 40,

  // Seuils de gestes
  CLOSE_THRESHOLD: 150,
  VELOCITY_THRESHOLD: 500,

  // Transitions du header
  HEADER_TRANSITION_START: 300 - 60 * 2, // IMAGE_HEIGHT - HEADER_HEIGHT * 2
  HEADER_TRANSITION_END: 300 - 60, // IMAGE_HEIGHT - HEADER_HEIGHT

  // Courbes d'easing optimisées
  EASING: {
    OPEN: Easing.bezier(0.33, 1, 0.68, 1), // Smooth open
    CLOSE: Easing.bezier(0.32, 0, 0.67, 0), // Quick close
    SPRING: Easing.bezier(0.68, -0.55, 0.265, 1.55), // Bounce effect
  },

  // Valeurs d'interpolation pour performance
  DRAG_SCALE_RANGE: [0, 1] as const,
  OPACITY_RANGE: [0, 1] as const,
  BORDER_RADIUS_RANGE: [0, 20] as const,

  // Couleurs constantes (évite re-création de strings)
  COLORS: {
    BACKGROUND_OVERLAY: '#000000', // Legacy - remplacé par blur
    BLUR_TINT: Colors.ui.cardBackground,
    BLUR_TINT_LIGHT: Colors.neutral.background,
    CARD_BACKGROUND: Colors.ui.cardBackground,
    HEADER_BACKGROUND: Colors.ui.cardBackground,
  },

  // Configuration du flou pour performance optimale
  BLUR_CONFIG: {
    MAX_INTENSITY: 15, // Intensité réduite pour un effet plus subtil
    MIN_INTENSITY: 0, // Pas de flou au début
    TINT_OPACITY: 0.1, // Opacité du tint clair encore réduite
    DRAG_THRESHOLD: 50, // Distance pour début du blur
  },
} as const;

/**
 * Configuration responsive pour les cartes
 */
export const RESPONSIVE_CONFIG = {
  // Breakpoints
  BREAKPOINTS: {
    MOBILE: 0,
    TABLET: 768,
    DESKTOP: 1024,
  },

  // Tailles de cartes
  CARD_SIZES: {
    MIN_WIDTH: 150,
    MAX_WIDTH: 200,
    ASPECT_RATIO: 1, // 1:1 square cards
  },

  // Espacements
  SPACING: {
    HORIZONTAL_PADDING: 15,
    CARD_MARGIN: 15,
    SCROLL_PADDING: 15,
  },
} as const;

/**
 * Configuration pour les images
 */
export const IMAGE_CONFIG = {
  CACHE_POLICY: 'memory-disk' as const,
  TRANSITION_DURATION: 200,
  CONTENT_FIT: 'cover' as const,
  PLACEHOLDER: require('@/assets/images/splash-icon.png'), // Fallback vers asset existant
} as const;
