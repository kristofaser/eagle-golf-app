import React, { memo, useRef, useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, Animated, StyleSheet, LayoutChangeEvent, Easing } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/constants/theme';
import { logger } from '@/utils/logger';

interface TravelNotificationFABProps {
  isEnabled: boolean;
  onPress: () => void;
}

export const TravelNotificationFAB = memo<TravelNotificationFABProps>(({ isEnabled, onPress }) => {
  const insets = useSafeAreaInsets();
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const bounceAnim = useRef(new Animated.Value(0)).current;
  const widthAnim = useRef(new Animated.Value(250)).current;
  const bellSwingAnim = useRef(new Animated.Value(0)).current;

  const [textWidths, setTextWidths] = useState({
    enabled: 0,
    disabled: 0,
  });
  const [hasMeasured, setHasMeasured] = useState(false);

  // Mesurer les largeurs des textes
  const handleEnabledTextLayout = (event: LayoutChangeEvent) => {
    const { width } = event.nativeEvent.layout;
    logger.dev(`📏 TravelFAB - Mesure "Alertes activées": ${width}px`);
    setTextWidths((prev) => ({ ...prev, enabled: width }));
  };

  const handleDisabledTextLayout = (event: LayoutChangeEvent) => {
    const { width } = event.nativeEvent.layout;
    logger.dev(`📏 TravelFAB - Mesure "M'alerter pour les prochains voyages": ${width}px`);
    setTextWidths((prev) => ({ ...prev, disabled: width }));
    setHasMeasured(true);
  };

  useEffect(() => {
    // Animation d'entrée avec bounce
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 1.1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 3,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();

    // Animation de pulsation subtile pour attirer l'attention
    Animated.loop(
      Animated.sequence([
        Animated.timing(bounceAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(bounceAnim, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [scaleAnim, bounceAnim]);

  // Animation de largeur quand l'état change
  useEffect(() => {
    if (!hasMeasured) return;

    const targetWidth = isEnabled
      ? textWidths.enabled + 70 // Texte + icône + padding
      : textWidths.disabled + 70; // Texte + icône + padding

    logger.dev(`🎯 TravelFAB - Animation vers largeur: ${targetWidth}px (isEnabled: ${isEnabled})`);
    logger.dev(`📊 TravelFAB - Largeurs mesurées: enabled=${textWidths.enabled}px, disabled=${textWidths.disabled}px`);

    Animated.timing(widthAnim, {
      toValue: targetWidth,
      duration: 300,
      useNativeDriver: false, // width ne supporte pas useNativeDriver
    }).start();
  }, [isEnabled, widthAnim, textWidths, hasMeasured]);

  // Animation de balancement de cloche pour le FAB inactif
  useEffect(() => {
    if (!isEnabled) {
      // Démarrer l'animation de balancement après un délai
      const startSwing = () => {
        Animated.loop(
          Animated.sequence([
            Animated.timing(bellSwingAnim, {
              toValue: 1,
              duration: 800,
              easing: Easing.inOut(Easing.sin),
              useNativeDriver: true,
            }),
            Animated.timing(bellSwingAnim, {
              toValue: -1,
              duration: 1600,
              easing: Easing.inOut(Easing.sin),
              useNativeDriver: true,
            }),
            Animated.timing(bellSwingAnim, {
              toValue: 0,
              duration: 800,
              easing: Easing.inOut(Easing.sin),
              useNativeDriver: true,
            }),
          ]),
          { iterations: -1 }
        ).start();
      };

      // Démarrer immédiatement le balancement
      startSwing();
    } else {
      // Arrêter l'animation et remettre à zéro
      bellSwingAnim.stopAnimation();
      Animated.timing(bellSwingAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [isEnabled, bellSwingAnim]);

  const pulseScale = bounceAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.05],
  });

  const bellRotation = bellSwingAnim.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: ['-15deg', '0deg', '15deg'],
  });

  return (
    <Animated.View
      style={[
        styles.container,
        {
          bottom: insets.bottom + 10, // Plus proche de la tab bar
          transform: [{ scale: scaleAnim }, { scale: pulseScale }],
        },
      ]}
    >
      <Animated.View
        style={[
          styles.fab,
          {
            backgroundColor: isEnabled ? Colors.primary.navy : Colors.neutral.mist,
            width: widthAnim,
          },
        ]}
      >
        <TouchableOpacity
          style={styles.touchable}
          onPress={onPress}
          activeOpacity={0.9}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel={
            isEnabled ? 'Alertes voyage activées' : 'Activer les alertes pour les prochains voyages'
          }
          accessibilityHint="Appuyez pour activer ou désactiver les alertes pour les prochains voyages"
        >
          <View style={styles.content}>
            <Animated.View
              style={[
                styles.iconContainer,
                {
                  transform: [
                    { translateY: -9 }, // Déplacer vers le haut
                    { rotate: bellRotation }, // Rotation depuis le haut
                    { translateY: 9 }, // Redescendre
                  ],
                },
              ]}
            >
              <Ionicons
                name={isEnabled ? 'notifications' : 'notifications-outline'}
                size={18}
                color={isEnabled ? Colors.neutral.white : Colors.neutral.charcoal}
              />
            </Animated.View>

            <Text
              style={[
                styles.text,
                { color: isEnabled ? Colors.neutral.white : Colors.neutral.charcoal },
              ]}
              numberOfLines={1}
            >
              {isEnabled ? 'Alertes activées' : "M'alerter pour les prochains voyages"}
            </Text>
          </View>
        </TouchableOpacity>
      </Animated.View>

      {/* Textes invisibles pour mesurer les largeurs */}
      <View style={styles.measureContainer}>
        <Text style={[styles.measureText]} onLayout={handleEnabledTextLayout} numberOfLines={1}>
          Alertes activées
        </Text>
        <Text style={[styles.measureText]} onLayout={handleDisabledTextLayout} numberOfLines={1}>
          M'alerter pour les prochains voyages
        </Text>
      </View>
    </Animated.View>
  );
});

TravelNotificationFAB.displayName = 'TravelNotificationFAB';

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    shadowColor: Colors.neutral.charcoal,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  fab: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 28,
  },
  touchable: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    marginRight: 8,
  },
  text: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  measureContainer: {
    position: 'absolute',
    opacity: 0,
    pointerEvents: 'none',
    top: -1000, // Hors écran
  },
  measureText: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
});
