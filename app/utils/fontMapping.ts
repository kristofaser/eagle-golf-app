/**
 * Mapping des polices Inter pour React Native
 * Associe les fontWeight aux polices chargées
 */

import { Platform } from 'react-native';
import { Typography } from '@/constants/theme';

/**
 * Sur iOS et Android, les polices avec différents poids doivent être
 * référencées par leur nom de famille spécifique, pas par fontWeight
 */
export const getFontFamily = (weight?: keyof typeof Typography.fontWeight, base: string = 'Inter') => {
  if (base === 'SpaceMono') {
    return 'SpaceMono';
  }

  if (base === 'Playfair Display') {
    // Si on ajoute Playfair Display plus tard
    return Platform.select({
      ios: 'System',
      android: 'sans-serif',
      default: 'System'
    });
  }

  // Mapping pour Inter en fonction du poids
  switch (weight) {
    case 'light':
      return 'Inter-Light';
    case 'regular':
      return 'Inter-Regular';
    case 'medium':
      return 'Inter-Medium';
    case 'semiBold':
      return 'Inter-SemiBold';
    case 'bold':
      return 'Inter-Bold';
    case 'extraBold':
      return 'Inter-ExtraBold';
    default:
      return 'Inter-Regular';
  }
};

/**
 * Helper pour obtenir les styles de police complets
 */
export const getFontStyle = (weight?: keyof typeof Typography.fontWeight, family: string = 'Inter') => {
  const fontFamily = getFontFamily(weight, family);

  // Sur React Native, on doit utiliser fontFamily, pas fontWeight avec les polices custom
  return {
    fontFamily,
    // On peut quand même garder fontWeight pour la compatibilité avec les polices système
    fontWeight: Platform.select({
      ios: undefined, // iOS gère mieux avec juste fontFamily
      android: undefined, // Android aussi
      default: Typography.fontWeight[weight || 'regular']
    })
  };
};