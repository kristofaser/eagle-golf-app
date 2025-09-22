/**
 * Animation Design System Eagle Golf
 * Système centralisé pour toutes les animations et transitions
 */
import { Easing } from 'react-native-reanimated';

/**
 * Courbes d'easing standardisées pour cohérence et performance
 */
export const EASING_CURVES = {
  // Courbes principales
  SPRING: Easing.bezier(0.68, -0.55, 0.265, 1.55), // Bounce naturel - micro-interactions
  EASE_OUT: Easing.bezier(0.25, 0.46, 0.45, 0.94), // Décélération douce - sorties
  EASE_IN_OUT: Easing.bezier(0.645, 0.045, 0.355, 1), // Symétrique - transitions
  EASE_IN: Easing.bezier(0.55, 0.085, 0.68, 0.53), // Accélération - entrées

  // Courbes spécialisées
  ELASTIC: Easing.bezier(0.68, -0.6, 0.32, 1.6), // Effet élastique prononcé
  SMOOTH: Easing.bezier(0.4, 0, 0.2, 1), // Google Material Design
  SWIFT: Easing.bezier(0.4, 0, 0.6, 1), // Apple-like transitions

  // Performance optimisée
  LINEAR: Easing.linear, // Pour animations continues
  QUAD: Easing.quad, // Simple et performant
} as const;

/**
 * Durées standardisées basées sur Material Design et Human Interface Guidelines
 */
export const DURATIONS = {
  // Micro-interactions (100-200ms)
  MICRO: 150, // Button press, input focus, ripple
  QUICK: 200, // Tooltip, badge appearance

  // Transitions standard (200-400ms)
  FAST: 250, // Tab switch, simple state change
  NORMAL: 300, // Page transition, modal appearance
  MEDIUM: 400, // Complex transition, parallax

  // Animations complexes (400ms+)
  SLOW: 500, // Shared element transition
  COMPLEX: 800, // Multi-step animation
  SPLASH: 1200, // Splash screen, onboarding
} as const;

/**
 * Configuration parallax et scroll
 */
export const PARALLAX_CONFIG = {
  // Performance targets
  TARGET_FPS: 60,
  FRAME_BUDGET: 16, // 1000ms / 60fps = 16.67ms per frame

  // Scroll thresholds
  SCROLL_THRESHOLD: 50, // Minimum scroll before effects
  VELOCITY_THRESHOLD: 1000, // High velocity scroll detection

  // Transform limits
  MAX_SCALE: 1.5, // Maximum pull-to-refresh scale
  MAX_TRANSLATE: 0.5, // Maximum parallax translation ratio
  MIN_OPACITY: 0.1, // Minimum opacity for readability

  // Worklet optimization
  USE_NATIVE_DRIVER: true,
  OPTIMIZE_FOR_60FPS: true,
} as const;

/**
 * Spring configurations standardisées
 */
export const SPRING_CONFIGS = {
  // Gentle springs
  SOFT: {
    damping: 20,
    stiffness: 100,
    mass: 1,
    overshootClamping: false,
  },

  // Medium responsiveness
  MEDIUM: {
    damping: 15,
    stiffness: 150,
    mass: 0.8,
    overshootClamping: false,
  },

  // Snappy interactions
  BOUNCY: {
    damping: 10,
    stiffness: 200,
    mass: 0.6,
    overshootClamping: false,
  },

  // No overshoot
  PRECISE: {
    damping: 25,
    stiffness: 200,
    mass: 1,
    overshootClamping: true,
  },
} as const;

/**
 * Delays pour animations séquentielles (staggered)
 */
export const STAGGER_DELAYS = {
  VERY_FAST: 50, // List items, rapid succession
  FAST: 100, // Cards, medium-paced
  NORMAL: 150, // Sections, comfortable pace
  SLOW: 250, // Major elements, dramatic effect
} as const;

/**
 * Configuration performance par device
 */
export const PERFORMANCE_CONFIG = {
  // Animation quality levels
  HIGH_QUALITY: {
    enableAllAnimations: true,
    useComplexEasing: true,
    allowOvershoot: true,
    targetFPS: 60,
  },

  MEDIUM_QUALITY: {
    enableAllAnimations: true,
    useComplexEasing: false,
    allowOvershoot: false,
    targetFPS: 30,
  },

  LOW_QUALITY: {
    enableAllAnimations: false,
    useComplexEasing: false,
    allowOvershoot: false,
    targetFPS: 30,
  },
} as const;

/**
 * Presets pour animations communes
 */
export const ANIMATION_PRESETS = {
  // Entrées
  FADE_IN: {
    duration: DURATIONS.NORMAL,
    easing: EASING_CURVES.EASE_OUT,
  },

  SLIDE_UP: {
    duration: DURATIONS.NORMAL,
    easing: EASING_CURVES.EASE_OUT,
  },

  SCALE_IN: {
    duration: DURATIONS.FAST,
    easing: EASING_CURVES.SPRING,
  },

  // Sorties
  FADE_OUT: {
    duration: DURATIONS.FAST,
    easing: EASING_CURVES.EASE_IN,
  },

  SLIDE_DOWN: {
    duration: DURATIONS.FAST,
    easing: EASING_CURVES.EASE_IN,
  },

  // Interactions
  BUTTON_PRESS: {
    duration: DURATIONS.MICRO,
    easing: EASING_CURVES.EASE_OUT,
    scale: 0.95,
  },

  MODAL_PRESENT: {
    duration: DURATIONS.MEDIUM,
    easing: EASING_CURVES.EASE_OUT,
  },

  // Navigation
  SCREEN_TRANSITION: {
    duration: DURATIONS.NORMAL,
    easing: EASING_CURVES.EASE_IN_OUT,
  },

  TAB_SWITCH: {
    duration: DURATIONS.FAST,
    easing: EASING_CURVES.EASE_OUT,
  },
} as const;

/**
 * Helpers pour calculs de performance
 */
export const ANIMATION_HELPERS = {
  /**
   * Calcule la durée optimale basée sur la distance
   */
  calculateDuration: (distance: number, minDuration = DURATIONS.FAST, maxDuration = DURATIONS.SLOW) => {
    const ratio = Math.min(distance / 500, 1); // Normalize to 500px max
    return minDuration + (maxDuration - minDuration) * ratio;
  },

  /**
   * Détermine si on peut utiliser des animations complexes
   */
  canUseComplexAnimations: () => {
    // Simplified device performance detection
    // In real app, you'd check device specs, battery level, etc.
    return true;
  },

  /**
   * Calcule le délai pour animations staggered
   */
  calculateStaggerDelay: (index: number, baseDelay = STAGGER_DELAYS.NORMAL) => {
    return index * baseDelay;
  },
} as const;

/**
 * Types pour TypeScript
 */
export type EasingCurve = keyof typeof EASING_CURVES;
export type AnimationDuration = keyof typeof DURATIONS;
export type SpringConfig = keyof typeof SPRING_CONFIGS;
export type AnimationPreset = keyof typeof ANIMATION_PRESETS;