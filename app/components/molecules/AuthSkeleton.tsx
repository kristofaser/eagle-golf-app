import React, { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';

interface AuthSkeletonProps {
  type: 'login' | 'register';
}

/**
 * Fond dégradé animé avec effet de "respiration" subtil
 * Indique le chargement sans être intrusif
 */
export const AuthSkeleton: React.FC<AuthSkeletonProps> = ({ type }) => {
  const breatheOpacity = useSharedValue(0.3);

  useEffect(() => {
    // Animation de "respiration" douce et lente (3 secondes par cycle)
    breatheOpacity.value = withRepeat(
      withSequence(
        withTiming(0.5, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.3, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
      ),
      -1, // Répétition infinie
      false,
    );
  }, [breatheOpacity]);

  const breatheStyle = useAnimatedStyle(() => {
    return {
      opacity: breatheOpacity.value,
    };
  });

  return (
    <Animated.View style={[styles.container, breatheStyle]}>
      {/* Fond semi-transparent avec effet de respiration */}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.4)', // Fond semi-transparent noir
  },
});
