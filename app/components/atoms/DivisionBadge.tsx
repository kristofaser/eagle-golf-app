import React from 'react';
import {
  View,
  Text,
  StyleSheet,
} from 'react-native';
import { Colors } from '@/constants/theme';

export interface DivisionBadgeProps {
  /**
   * Division du professionnel
   */
  division?: string | null;

  /**
   * Taille du badge
   * @default 'small'
   */
  size?: 'small' | 'medium';

  /**
   * Style personnalisé du container
   */
  style?: object;
}

export const DivisionBadge: React.FC<DivisionBadgeProps> = ({
  division,
  size = 'small',
  style,
}) => {
  // Ne rien afficher si pas de division
  if (!division) {
    return null;
  }

  // Obtenir les couleurs pour cette division
  const divisionStyle = getDivisionStyle(division);

  const containerStyle = [
    styles.container,
    styles[size],
    {
      backgroundColor: divisionStyle.background,
      borderColor: divisionStyle.border,
    },
    style,
  ];

  const textStyle = [
    styles.text,
    styles[`text_${size}`],
    {
      color: divisionStyle.text,
    },
  ];

  return (
    <View style={containerStyle}>
      <Text style={textStyle} numberOfLines={1}>
        {division}
      </Text>
    </View>
  );
};

/**
 * Obtient le style de couleur pour une division donnée
 */
function getDivisionStyle(division: string) {
  const normalizedDivision = division.trim();

  // Vérifier les divisions définies dans le theme
  if (Colors.division && Colors.division[normalizedDivision]) {
    return Colors.division[normalizedDivision];
  }

  // Fallback pour les divisions non définies
  return {
    background: Colors.neutral.cloud,
    text: Colors.neutral.charcoal,
    border: Colors.neutral.mist,
  };
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 2,
    alignSelf: 'flex-start',
  },
  small: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  medium: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  text: {
    fontWeight: '600',
    textAlign: 'center',
  },
  text_small: {
    fontSize: 10,
    lineHeight: 12,
  },
  text_medium: {
    fontSize: 12,
    lineHeight: 14,
  },
});