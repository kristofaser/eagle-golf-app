import React, { useEffect, useRef } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withDelay,
  withSequence,
  Easing,
  withTiming,
  withRepeat,
} from 'react-native-reanimated';
import { Colors, Spacing } from '@/constants/theme';
import { Logo, Text } from '@/components/atoms';

interface SplashScreenProps {
  onFinish?: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onFinish }) => {
  const logoScale = useSharedValue(0);
  const logoRotation = useSharedValue(0);
  const titleOpacity = useSharedValue(0);
  const subtitleOpacity = useSharedValue(0);
  const hasStartedRef = useRef(false);
  const onFinishRef = useRef(onFinish);

  // Configuration de l'animation
  const LOGO_APPEAR_DURATION = 500; // Temps d'apparition du logo
  const WAIT_BEFORE_HEARTBEAT = 800; // Attente avant le battement
  const HEARTBEAT_CYCLE_DURATION = 1400; // Un cycle complet (300+300+800)
  const HEARTBEAT_CYCLES = 1; // Nombre de battements souhaités

  // Calcul de la durée totale
  const TOTAL_ANIMATION_DURATION =
    LOGO_APPEAR_DURATION + WAIT_BEFORE_HEARTBEAT + HEARTBEAT_CYCLE_DURATION * HEARTBEAT_CYCLES;

  // Mettre à jour la ref à chaque render
  useEffect(() => {
    onFinishRef.current = onFinish;
  }, [onFinish]);

  useEffect(() => {
    // Éviter de redémarrer l'animation si elle a déjà commencé
    if (hasStartedRef.current) {
      return;
    }

    hasStartedRef.current = true;
    console.log('SplashScreen: Starting animations... (first time)');

    // Le logo apparaît normalement d'abord
    logoScale.value = withSpring(1, {
      damping: 12,
      stiffness: 100,
    });

    // Puis battement de cœur après la période d'attente
    setTimeout(() => {
      logoScale.value = withRepeat(
        withSequence(
          withTiming(1.08, { duration: 300 }),
          withTiming(1, { duration: 300 }),
          withTiming(1, { duration: 800 }) // Pause plus longue
        ),
        HEARTBEAT_CYCLES, // Nombre exact de cycles au lieu d'infini
        false // Pas de reverse
      );
    }, WAIT_BEFORE_HEARTBEAT);

    // Rotation supprimée - logoRotation reste à 0

    titleOpacity.value = withDelay(500, withTiming(1, { duration: 800 }));

    subtitleOpacity.value = withDelay(800, withTiming(1, { duration: 800 }));

    // Call onFinish après l'animation complète
    const timer = setTimeout(() => {
      console.log(
        `SplashScreen: Animation complète après ${TOTAL_ANIMATION_DURATION}ms (${HEARTBEAT_CYCLES} battements), calling onFinish`
      );
      if (onFinishRef.current) {
        onFinishRef.current();
      }
    }, TOTAL_ANIMATION_DURATION);

    return () => {
      console.log('SplashScreen: Cleaning up timer');
      clearTimeout(timer);
    };
  }, []); // Pas de dépendances pour éviter les re-exécutions

  const logoAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: logoScale.value }],
    };
  });

  const titleAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: titleOpacity.value,
    };
  });

  const subtitleAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: subtitleOpacity.value,
    };
  });

  return (
    <View style={styles.container}>
      <Animated.View style={logoAnimatedStyle}>
        <Logo size={250} variant="primary" />
      </Animated.View>

      <Animated.View style={[styles.titleContainer, titleAnimatedStyle, styles.textOverlay]}>
        <Text variant="h1" color="charcoal" align="center" style={styles.logoText}>
          EAGLE
        </Text>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.neutral.background,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
  },
  titleContainer: {
    marginTop: Spacing.xl,
    marginBottom: Spacing.s,
  },
  logoText: {
    fontSize: 42, // Réduit de 48 à 42
    fontWeight: 'bold',
    letterSpacing: 4,
  },
  textOverlay: {
    zIndex: 10, // Au-dessus du logo
    elevation: 10, // Pour Android
  },
});
