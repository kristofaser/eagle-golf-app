/**
 * NotificationBadge - Badge pour afficher le nombre de notifications non lues
 *
 * Composant atom pour afficher le compteur de notifications dans la navigation.
 * S'intègre avec useNotificationBadge pour les données temps réel.
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '@/constants/theme';

export interface NotificationBadgeProps {
  /**
   * Nombre de notifications non lues
   */
  count: number;

  /**
   * Afficher même si le compte est 0
   * @default false
   */
  showZero?: boolean;

  /**
   * Taille du badge
   * @default 'medium'
   */
  size?: 'small' | 'medium' | 'large';

  /**
   * Couleur personnalisée du badge
   */
  color?: string;

  /**
   * Position du badge (pour overlay)
   */
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';

  /**
   * Style personnalisé du container
   */
  style?: any;

  /**
   * Style personnalisé du texte
   */
  textStyle?: any;
}

export const NotificationBadge: React.FC<NotificationBadgeProps> = ({
  count,
  showZero = false,
  size = 'medium',
  color = Colors.semantic.error.default,
  position = 'top-right',
  style,
  textStyle,
}) => {
  // Ne pas afficher si count = 0 et showZero = false
  if (count === 0 && !showZero) {
    return null;
  }

  // Texte à afficher (99+ si > 99)
  const displayText = count > 99 ? '99+' : count.toString();

  // Styles dynamiques selon la taille
  const badgeSize = getBadgeSize(size);
  const fontSize = getFontSize(size);

  // Styles de position
  const positionStyle = getPositionStyle(position);

  return (
    <View style={[styles.badge, badgeSize, positionStyle, { backgroundColor: color }, style]}>
      <Text style={[styles.text, { fontSize }, textStyle]} numberOfLines={1}>
        {displayText}
      </Text>
    </View>
  );
};

// Helpers pour les tailles
function getBadgeSize(size: 'small' | 'medium' | 'large') {
  switch (size) {
    case 'small':
      return { width: 16, height: 16, minWidth: 16 };
    case 'large':
      return { width: 24, height: 24, minWidth: 24 };
    case 'medium':
    default:
      return { width: 20, height: 20, minWidth: 20 };
  }
}

function getFontSize(size: 'small' | 'medium' | 'large') {
  switch (size) {
    case 'small':
      return 10;
    case 'large':
      return 14;
    case 'medium':
    default:
      return 12;
  }
}

function getPositionStyle(position: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left') {
  const base = { position: 'absolute' as const };

  switch (position) {
    case 'top-left':
      return { ...base, top: -8, left: -8 };
    case 'bottom-right':
      return { ...base, bottom: -8, right: -8 };
    case 'bottom-left':
      return { ...base, bottom: -8, left: -8 };
    case 'top-right':
    default:
      return { ...base, top: -8, right: -8 };
  }
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 2,
  },
  text: {
    color: Colors.neutral.white,
    fontWeight: '600',
    textAlign: 'center',
  },
});
