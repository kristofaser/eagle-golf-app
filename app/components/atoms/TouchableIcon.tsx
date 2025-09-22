import React from 'react';
import { TouchableOpacity, TouchableOpacityProps, View } from 'react-native';
import { FontAwesome, MaterialIcons, Ionicons } from '@expo/vector-icons';
import { Colors, TouchTarget } from '@/constants/theme';

interface TouchableIconProps extends Omit<TouchableOpacityProps, 'children'> {
  name: string;
  size?: number;
  iconSize?: number;
  color?: string;
  family?: 'FontAwesome' | 'MaterialIcons' | 'Ionicons';
  backgroundColor?: string;
  rounded?: boolean;
}

/**
 * TouchableIcon - Bouton icône avec zone tactile minimale garantie (44x44)
 * Respecte les guidelines iOS et Android pour l'accessibilité
 */
export const TouchableIcon: React.FC<TouchableIconProps> = ({
  name,
  size = 44, // Taille minimale recommandée
  iconSize = 24,
  color = Colors.neutral.charcoal,
  family = 'FontAwesome',
  backgroundColor,
  rounded = false,
  style,
  ...touchableProps
}) => {
  // Garantir une zone tactile minimale de 44x44
  const touchSize = Math.max(size, 44);

  const IconComponent = {
    FontAwesome,
    MaterialIcons,
    Ionicons,
  }[family];

  return (
    <TouchableOpacity
      style={[
        {
          width: touchSize,
          height: touchSize,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: backgroundColor,
          borderRadius: rounded ? touchSize / 2 : 0,
        },
        style,
      ]}
      hitSlop={size < 44 ? TouchTarget.hitSlop : undefined}
      activeOpacity={0.7}
      accessibilityRole="button"
      {...touchableProps}
    >
      <IconComponent
        name={name as any}
        size={iconSize}
        color={color}
      />
    </TouchableOpacity>
  );
};