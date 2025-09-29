/**
 * Composant RealtimeIndicator - Indicateur visuel discret pour les mises à jour temps réel
 *
 * Affiche un petit point vert pendant quelques secondes quand des données
 * sont mises à jour via Realtime pour donner un feedback à l'utilisateur.
 */
import React, { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withDelay,
  withSequence,
} from 'react-native-reanimated';
import { Colors } from '@/constants/theme';
import { Text } from '@/components/atoms';

interface RealtimeIndicatorProps {
  /**
   * Déclenche l'animation quand cette valeur change
   */
  trigger?: number;

  /**
   * Position de l'indicateur
   * @default 'top-right'
   */
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';

  /**
   * Afficher un texte explicatif
   * @default true
   */
  showText?: boolean;
}

export function RealtimeIndicator({
  trigger = 0,
  position = 'top-right',
  showText = true
}: RealtimeIndicatorProps) {
  const [isVisible, setIsVisible] = useState(false);
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (trigger > 0) {
      setIsVisible(true);

      // Animation d'apparition
      scale.value = 0;
      opacity.value = 0;

      scale.value = withSpring(1, { tension: 250, friction: 8 });
      opacity.value = withSpring(1, { tension: 200, friction: 10 });

      // Animation de disparition après 2.5 secondes
      setTimeout(() => {
        scale.value = withSpring(0, { tension: 150, friction: 8 });
        opacity.value = withSpring(0, { tension: 150, friction: 8 });

        setTimeout(() => setIsVisible(false), 300);
      }, 2500);
    }
  }, [trigger, scale, opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const getPositionStyle = () => {
    switch (position) {
      case 'top-left':
        return { top: 16, left: 16 };
      case 'bottom-right':
        return { bottom: 16, right: 16 };
      case 'bottom-left':
        return { bottom: 16, left: 16 };
      default:
        return { top: 16, right: 16 };
    }
  };

  if (!isVisible) return null;

  return (
    <Animated.View style={[styles.container, getPositionStyle(), animatedStyle]}>
      <View style={styles.indicator}>
        <View style={styles.dot} />
        {showText && (
          <Text variant="caption" color="white" weight="medium" style={styles.text}>
            Mis à jour
          </Text>
        )}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    zIndex: 1000,
  },
  indicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.semantic.success.default,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    shadowColor: Colors.neutral.charcoal,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.neutral.white,
    marginRight: 4,
  },
  text: {
    fontSize: 10,
  },
});