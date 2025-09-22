/**
 * FavoriteBadge - Badge pour afficher le nombre de favoris
 *
 * Composant atom pour afficher un badge avec le nombre total de favoris.
 * Utilisé dans le header à côté du bouton favoris.
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Typography } from '@/constants/theme';

interface FavoriteBadgeProps {
  /**
   * Nombre de favoris à afficher
   */
  count: number;

  /**
   * Taille du badge
   * @default 'medium'
   */
  size?: 'small' | 'medium' | 'large';

  /**
   * Couleur du badge
   * @default 'red'
   */
  color?: 'red' | 'blue' | 'green' | 'orange';

  /**
   * Style personnalisé
   */
  style?: any;
}

export const FavoriteBadge: React.FC<FavoriteBadgeProps> = ({
  count,
  size = 'medium',
  color = 'red',
  style,
}) => {
  // Ne rien afficher si le compteur est 0
  if (count <= 0) {
    return null;
  }

  // Limiter l'affichage à 99+ pour éviter un badge trop large
  const displayCount = count > 99 ? '99+' : count.toString();

  const badgeStyles = [
    styles.badge,
    styles[size],
    styles[color],
    style,
  ];

  const textStyles = [
    styles.text,
    styles[`text_${size}`],
  ];

  return (
    <View style={badgeStyles}>
      <Text style={textStyles}>{displayCount}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  // Badge de base
  badge: {
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 20,
    paddingHorizontal: 6,
    position: 'absolute',
    top: 2,
    right: 2,
    zIndex: 10,
  },

  // Tailles
  small: {
    height: 16,
    minWidth: 16,
    borderRadius: 8,
    paddingHorizontal: 4,
  },
  medium: {
    height: 20,
    minWidth: 20,
    borderRadius: 10,
    paddingHorizontal: 6,
  },
  large: {
    height: 24,
    minWidth: 24,
    borderRadius: 12,
    paddingHorizontal: 8,
  },

  // Couleurs
  red: {
    backgroundColor: Colors.semantic.error.default,
  },
  blue: {
    backgroundColor: Colors.primary.accent,
  },
  green: {
    backgroundColor: Colors.semantic.success.default,
  },
  orange: {
    backgroundColor: Colors.semantic.warning.default,
  },

  // Texte de base
  text: {
    color: Colors.neutral.white,
    fontFamily: Typography.fontFamily.primary,
    fontWeight: Typography.fontWeight.bold,
    textAlign: 'center',
  },

  // Tailles de texte
  text_small: {
    fontSize: 10,
    lineHeight: 12,
  },
  text_medium: {
    fontSize: 12,
    lineHeight: 14,
  },
  text_large: {
    fontSize: 14,
    lineHeight: 16,
  },
});