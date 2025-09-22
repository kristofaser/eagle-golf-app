import React, { memo, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, Animated, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/constants/theme';

interface BookingFABProps {
  price: number;
  players: number;
  onPress: () => void;
  isAuthenticated: boolean;
}

export const BookingFAB = memo<BookingFABProps>(({
  price,
  players,
  onPress,
  isAuthenticated,
}) => {
  const insets = useSafeAreaInsets();
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const bounceAnim = useRef(new Animated.Value(0)).current;

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

  const pulseScale = bounceAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.05],
  });

  return (
    <Animated.View
      style={[
        styles.container,
        {
          bottom: insets.bottom + 20,
          transform: [
            { scale: scaleAnim },
            { scale: pulseScale },
          ],
        },
      ]}
    >
      <TouchableOpacity
        style={styles.fab}
        onPress={onPress}
        activeOpacity={0.9}
        accessible={true}
        accessibilityRole="button"
        accessibilityLabel={
          isAuthenticated
            ? `Réserver une leçon pour ${players} ${players === 1 ? 'joueur' : 'joueurs'} - Total: ${price > 0 ? `${price * players} euros` : 'prix sur devis'}`
            : 'Se connecter pour réserver'
        }
        accessibilityHint="Appuyez pour configurer et réserver votre leçon"
      >
        {/* Texte principal */}
        <Text style={styles.mainText}>Réserver</Text>

        {/* Prix total */}
        {price > 0 ? (
          <Text style={styles.priceText}>{price * players}€</Text>
        ) : (
          <Text style={styles.priceText}>Sur devis</Text>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
});

BookingFAB.displayName = 'BookingFAB';

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    right: 20,
    shadowColor: Colors.neutral.charcoal,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  fab: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary.navy, // Bleu marine profond pour la visibilité
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 28,
    minWidth: 120,
  },
  mainText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.neutral.white,
    letterSpacing: 0.3,
    marginBottom: 4,
  },
  priceText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.neutral.white,
    opacity: 0.9,
  },
});