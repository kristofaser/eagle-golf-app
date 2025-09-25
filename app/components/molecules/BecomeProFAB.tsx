/**
 * BecomeProFAB - Floating Action Button pour devenir professionnel
 *
 * FAB conditionnel qui change d'apparence selon le statut de la demande :
 * - Vert : Pas de demande → "Devenir Pro"
 * - Orange : Demande en attente → "En attente"
 * - Gris : Demande rejetée → Possibilité de refaire
 *
 * Utilise les mêmes animations que le FAB Pro existant
 */
import React, { useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withDelay,
} from 'react-native-reanimated';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { TrophyIcon, Time01Icon, RefreshIcon } from '@hugeicons/core-free-icons';
import { Colors, Spacing, Elevation } from '@/constants/theme';
import { Text } from '@/components/atoms';
import { ProRequestState } from '@/hooks/useProRequest';

interface BecomeProFABProps {
  status: ProRequestState;
  isLoading: boolean;
  onPress: () => void;
}

export function BecomeProFAB({ status, isLoading, onPress }: BecomeProFABProps) {
  // Animations FAB
  const fabScale = useSharedValue(0);
  const fabTranslateY = useSharedValue(50);

  // Style d'animation FAB
  const fabAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: fabScale.value },
      { translateY: fabTranslateY.value }
    ],
  }));

  // Animation d'entrée au montage
  useEffect(() => {
    // Reset initial
    fabScale.value = 0;
    fabTranslateY.value = 50;

    // Animation Pop-in avec délai
    fabScale.value = withDelay(
      300,
      withSpring(1, {
        tension: 100,
        friction: 8,
      })
    );

    fabTranslateY.value = withDelay(
      300,
      withSpring(0, {
        tension: 80,
        friction: 8,
      })
    );
  }, []);

  // Configuration selon le statut
  const getConfig = () => {
    switch (status) {
      case 'pending':
        return {
          backgroundColor: Colors.semantic.warning.default, // Orange
          icon: Time01Icon,
          iconColor: Colors.neutral.white,
          text: 'En attente',
          disabled: true,
        };
      case 'rejected':
        return {
          backgroundColor: Colors.neutral.iron, // Gris
          icon: RefreshIcon,
          iconColor: Colors.neutral.white,
          text: 'Refaire la demande',
          disabled: false,
        };
      case 'approved':
        // Ne devrait pas apparaître car l'utilisateur devient pro
        return {
          backgroundColor: Colors.semantic.success.default,
          icon: TrophyIcon,
          iconColor: Colors.neutral.white,
          text: 'Approuvé',
          disabled: true,
        };
      case 'none':
      default:
        return {
          backgroundColor: Colors.semantic.success.default, // Vert
          icon: TrophyIcon,
          iconColor: Colors.neutral.white,
          text: 'Devenir Pro',
          disabled: false,
        };
    }
  };

  const config = getConfig();

  // Si loading, afficher un loader
  if (isLoading) {
    return (
      <View style={styles.fabContainer}>
        <Animated.View
          style={[
            styles.fab,
            fabAnimatedStyle,
            { backgroundColor: Colors.neutral.mist }
          ]}
        >
          <ActivityIndicator size="small" color={Colors.neutral.white} />
        </Animated.View>
      </View>
    );
  }

  // Ne pas afficher si approuvé (l'utilisateur devient pro)
  if (status === 'approved') {
    return null;
  }

  return (
    <View style={styles.fabContainer}>
      <Animated.View
        style={[
          styles.fab,
          fabAnimatedStyle,
          {
            backgroundColor: config.backgroundColor,
            opacity: config.disabled ? 0.8 : 1
          }
        ]}
      >
        <TouchableOpacity
          style={styles.fabButton}
          onPress={onPress}
          activeOpacity={config.disabled ? 1 : 0.8}
          disabled={config.disabled}
        >
          <HugeiconsIcon
            icon={config.icon}
            size={20}
            color={config.iconColor}
          />
          {/* Optionnel : afficher le texte à côté de l'icône */}
          {status === 'pending' && (
            <Text style={styles.fabText}>
              {config.text}
            </Text>
          )}
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  fabContainer: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    zIndex: 1000,
  },
  fab: {
    minWidth: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.neutral.charcoal,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 12,
    paddingHorizontal: 16,
  },
  fabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  fabText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.neutral.white,
  },
});