import React, { useState, useCallback } from 'react';
import { View, StyleSheet, TouchableOpacity, Animated, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, BorderRadius, Spacing, Typography } from '@/constants/theme';
import { Text } from '@/components/atoms';
import { useAuth } from '@/hooks/useAuth';

interface TravelNotificationToggleProps {
  isEnabled?: boolean;
  onToggle?: (enabled: boolean) => void;
}

export const TravelNotificationToggle: React.FC<TravelNotificationToggleProps> = ({
  isEnabled = false,
  onToggle,
}) => {
  const { user } = useAuth();
  const [enabled, setEnabled] = useState(isEnabled);
  const [animatedValue] = useState(new Animated.Value(isEnabled ? 1 : 0));

  const handleToggle = useCallback(() => {
    if (!user) {
      Alert.alert(
        'Connexion requise',
        'Connectez-vous pour être alerté des prochains voyages',
        [{ text: 'OK' }]
      );
      return;
    }

    const newValue = !enabled;
    setEnabled(newValue);
    onToggle?.(newValue);

    // Animation du toggle
    Animated.spring(animatedValue, {
      toValue: newValue ? 1 : 0,
      useNativeDriver: false,
      tension: 100,
      friction: 8,
    }).start();

    // Feedback utilisateur
    Alert.alert(
      newValue ? 'Alertes activées !' : 'Alertes désactivées',
      newValue 
        ? 'Vous serez notifié dès qu\'un nouveau voyage sera disponible.'
        : 'Vous ne recevrez plus d\'alertes pour les voyages.',
      [{ text: 'OK' }]
    );
  }, [enabled, user, onToggle, animatedValue]);

  const toggleBackgroundColor = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [Colors.neutral.mist, Colors.primary.accent],
  });

  const toggleTranslateX = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [2, 22],
  });

  return (
    <View style={styles.container}>
      <TouchableOpacity 
        style={styles.toggleContainer} 
        onPress={handleToggle}
        activeOpacity={0.8}
      >
        <View style={styles.textContainer}>
          <Text
            variant="body"
            color="charcoal"
            weight="medium"
            style={styles.toggleText}
          >
            M'alerter pour les prochains voyages
          </Text>
          {enabled && (
            <View style={styles.activeIndicator}>
              <Ionicons name="notifications" size={14} color={Colors.primary.accent} />
              <Text variant="caption" color="accent" weight="medium" style={styles.activeText}>
                Activé
              </Text>
            </View>
          )}
        </View>

        <View style={styles.switch}>
          <Animated.View style={[styles.switchTrack, { backgroundColor: toggleBackgroundColor }]}>
            <Animated.View 
              style={[
                styles.switchThumb, 
                { transform: [{ translateX: toggleTranslateX }] }
              ]} 
            />
          </Animated.View>
        </View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.neutral.white,
    paddingHorizontal: Spacing.m,
    paddingVertical: Spacing.s,
    borderTopWidth: 1,
    borderTopColor: Colors.ui.inputBorder,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  toggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.xs,
  },
  textContainer: {
    flex: 1,
    marginRight: Spacing.m,
  },
  toggleText: {
    fontSize: Typography.fontSize.body,
    lineHeight: 20,
  },
  activeIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.xxs,
    gap: Spacing.xxs,
  },
  activeText: {
    fontSize: 12,
  },
  switch: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  switchTrack: {
    width: 48,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    position: 'relative',
  },
  switchThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.neutral.white,
    position: 'absolute',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
});