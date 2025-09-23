import {
  useSharedValue,
  useAnimatedStyle,
  interpolate,
  useAnimatedScrollHandler,
  Extrapolation,
} from 'react-native-reanimated';
import { Colors } from '@/constants/theme';
import { PARALLAX_CONFIG } from '@/constants/animations';

// Constantes pour l'animation du header
const HEADER_HEIGHT = 60;
const IMAGE_HEIGHT = 300;
const HEADER_TRANSITION_START = 150;
const HEADER_TRANSITION_END = 250;

export const useProfileAnimations = () => {
  // Valeur partagée pour le scroll
  const scrollY = useSharedValue(0);

  // Handler pour le scroll optimisé
  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      'worklet';
      // Calculs directement sur thread UI (déjà dans un worklet)
      scrollY.value = event.contentOffset.y;
    },
  });

  // Styles animés pour le header
  const animatedHeaderStyle = useAnimatedStyle(() => {
    'worklet';
    const scrollValue = scrollY.value;
    const scrollProgress = interpolate(
      scrollValue,
      [HEADER_TRANSITION_START, HEADER_TRANSITION_END],
      [0, 1],
      Extrapolation.CLAMP
    );

    return {
      backgroundColor: `rgba(255, 255, 255, ${scrollProgress})`,
      borderBottomWidth: scrollProgress,
      borderBottomColor: Colors.neutral.mist,
    };
  });

  // Styles animés pour le contenu du header
  const animatedHeaderContentStyle = useAnimatedStyle(() => {
    'worklet';
    const scrollValue = scrollY.value;
    const opacity = interpolate(
      scrollValue,
      [HEADER_TRANSITION_START, HEADER_TRANSITION_END],
      [0, 1],
      Extrapolation.CLAMP
    );

    return {
      opacity: opacity,
    };
  });

  // Styles animés pour les icônes blanches
  const animatedHeaderIconsStyle = useAnimatedStyle(() => {
    'worklet';
    const scrollValue = scrollY.value;
    const opacity = interpolate(
      scrollValue,
      [HEADER_TRANSITION_START, HEADER_TRANSITION_END],
      [1, 0],
      Extrapolation.CLAMP
    );

    return {
      opacity: opacity,
    };
  });

  // Style animé pour l'image avec effet parallaxe optimisé
  const parallaxImageStyle = useAnimatedStyle(() => {
    'worklet';
    const scrollValue = scrollY.value;

    // Utiliser les constantes optimisées
    const maxScale = PARALLAX_CONFIG.MAX_SCALE;
    const maxTranslate = PARALLAX_CONFIG.MAX_TRANSLATE;

    // Étirer l'image quand on tire vers le bas (pull-to-refresh)
    // Optimisé avec des calculs pré-définis
    const scale = interpolate(
      scrollValue,
      [-150, 0, IMAGE_HEIGHT],
      [maxScale, 1, 1],
      Extrapolation.CLAMP
    );

    // Déplacer l'image uniquement quand on scrolle vers le haut
    // Utiliser la configuration optimisée
    const translateY = interpolate(
      scrollValue,
      [-100, 0, IMAGE_HEIGHT],
      [0, 0, -IMAGE_HEIGHT * maxTranslate],
      Extrapolation.CLAMP
    );

    return {
      transform: [{ scale }, { translateY }],
      transformOrigin: 'top',
    };
  });

  // Style animé pour le contenu - Désactivé pour éviter le rebond
  const contentAnimatedStyle = useAnimatedStyle(() => {
    'worklet';
    // Animation désactivée pour éviter l'effet de rebond
    return {};
  });

  return {
    // Valeurs
    scrollY,

    // Handlers
    scrollHandler,

    // Styles animés
    animatedHeaderStyle,
    animatedHeaderContentStyle,
    animatedHeaderIconsStyle,
    parallaxImageStyle,
    contentAnimatedStyle,

    // Constantes exportées pour les composants
    constants: {
      HEADER_HEIGHT,
      IMAGE_HEIGHT,
      HEADER_TRANSITION_START,
      HEADER_TRANSITION_END,
    },
  };
};
