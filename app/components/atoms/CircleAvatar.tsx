import React from 'react';
import { View, Image, Text, StyleSheet } from 'react-native';
import { Colors } from '@/constants/theme';

export interface CircleAvatarProps {
  /**
   * URL de l'image avatar
   */
  avatarUrl?: string | null;

  /**
   * Taille du cercle en pixels
   * @default 32
   */
  size?: number;

  /**
   * Initiales à afficher si pas d'image
   * Par défaut : première lettre du prénom + nom
   */
  fallbackInitials?: string;

  /**
   * Prénom et nom pour générer automatiquement les initiales
   */
  firstName?: string;
  lastName?: string;

  /**
   * Style personnalisé du container
   */
  style?: object;

  /**
   * Couleur de fond du fallback
   * @default Colors.primary.electric
   */
  fallbackColor?: string;

  /**
   * Couleur du texte des initiales
   * @default Colors.neutral.white
   */
  textColor?: string;

  /**
   * Style de bordure
   */
  borderWidth?: number;
  borderColor?: string;
}

export const CircleAvatar: React.FC<CircleAvatarProps> = ({
  avatarUrl,
  size = 32,
  fallbackInitials,
  firstName,
  lastName,
  style,
  fallbackColor = Colors.primary.electric,
  textColor = Colors.neutral.white,
  borderWidth = 0,
  borderColor = Colors.neutral.cloud,
}) => {
  // Générer les initiales automatiquement
  const getInitials = (): string => {
    if (fallbackInitials) return fallbackInitials;

    if (firstName && lastName) {
      return `${firstName.charAt(0).toUpperCase()}${lastName.charAt(0).toUpperCase()}`;
    }

    if (firstName) {
      return firstName.charAt(0).toUpperCase();
    }

    return '?';
  };

  const containerStyle = [
    styles.container,
    {
      width: size,
      height: size,
      borderRadius: size / 2,
      borderWidth,
      borderColor,
    },
    style,
  ];

  const fallbackStyle = [
    styles.fallback,
    {
      backgroundColor: fallbackColor,
    },
  ];

  const textStyle = [
    styles.text,
    {
      fontSize: size * 0.4, // Taille de police proportionnelle
      color: textColor,
    },
  ];

  const imageStyle = [
    styles.image,
    {
      width: size,
      height: size,
      borderRadius: size / 2,
    },
  ];

  return (
    <View style={containerStyle}>
      {avatarUrl ? (
        <Image source={{ uri: avatarUrl }} style={imageStyle} resizeMode="cover" />
      ) : (
        <View style={fallbackStyle}>
          <Text style={textStyle}>{getInitials()}</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
  image: {
    // Style sera appliqué dynamiquement
  },
  fallback: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    fontWeight: '600',
    textAlign: 'center',
  },
});
