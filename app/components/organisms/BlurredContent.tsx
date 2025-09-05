import React, { memo, ReactNode } from 'react';
import { StyleSheet } from 'react-native';
import Animated, { useAnimatedStyle, interpolate, useDerivedValue } from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { ANIMATION_CONFIG } from '@/utils/constants/animations';

interface BlurredContentProps {
  children: ReactNode;
  dragY: Animated.SharedValue<number>;
  isCardSelected: boolean;
}

/**
 * Composant qui applique un flou sur son contenu quand on tire une carte
 * Implémentation simplifiée selon les bonnes pratiques Expo
 */
const BlurredContentComponent = ({ children, dragY, isCardSelected }: BlurredContentProps) => {
  // Intensité du flou dérivée du dragY
  const blurIntensity = useDerivedValue(() => {
    'worklet';
    if (!isCardSelected || dragY.value <= 0) {
      return 0;
    }

    return interpolate(
      dragY.value,
      [0, ANIMATION_CONFIG.BLUR_CONFIG.DRAG_THRESHOLD],
      [0, ANIMATION_CONFIG.BLUR_CONFIG.MAX_INTENSITY],
      'clamp'
    );
  }, [isCardSelected]);

  // Style animé pour le BlurView
  const blurStyle = useAnimatedStyle(() => {
    'worklet';
    const intensity = blurIntensity.value;

    return {
      opacity: intensity > 0 ? 1 : 0,
    };
  }, []);

  // Animation du tint clair progressif
  const tintStyle = useAnimatedStyle(() => {
    'worklet';
    if (!isCardSelected || dragY.value <= 0) {
      return { opacity: 0 };
    }

    const opacity = interpolate(
      dragY.value,
      [0, ANIMATION_CONFIG.BLUR_CONFIG.DRAG_THRESHOLD],
      [0, ANIMATION_CONFIG.BLUR_CONFIG.TINT_OPACITY],
      'clamp'
    );

    return { opacity };
  }, [isCardSelected]);

  // Rendu simplifié avec BlurView toujours présent
  return (
    <>
      {children}
      {/* BlurView en overlay avec intensité animée */}
      <Animated.View style={[styles.blurContainer, blurStyle]} pointerEvents="none">
        <BlurView
          style={styles.blur}
          tint="light"
          intensity={ANIMATION_CONFIG.BLUR_CONFIG.MAX_INTENSITY}
        />
        {/* Overlay tint clair progressif */}
        <Animated.View
          style={[
            styles.tintOverlay,
            tintStyle,
            {
              backgroundColor: ANIMATION_CONFIG.COLORS.BLUR_TINT_LIGHT,
            },
          ]}
        />
      </Animated.View>
    </>
  );
};

export const BlurredContent = memo(BlurredContentComponent);

const styles = StyleSheet.create({
  blurContainer: {
    ...StyleSheet.absoluteFillObject,
  },
  blur: {
    flex: 1,
  },
  tintOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
});
