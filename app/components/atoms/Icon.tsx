import React from 'react';
import { FontAwesome, MaterialIcons, Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/theme';

interface IconProps {
  name: string;
  size?: number;
  color?: string;
  family?: 'FontAwesome' | 'MaterialIcons' | 'Ionicons';
}

export const Icon: React.FC<IconProps> = ({
  name,
  size = 24,
  color = Colors.neutral.charcoal,
  family = 'FontAwesome',
}) => {
  const iconProps = { name, size, color };

  switch (family) {
    case 'MaterialIcons':
      return <MaterialIcons {...iconProps} name={name as any} />;
    case 'Ionicons':
      return <Ionicons {...iconProps} name={name as any} />;
    case 'FontAwesome':
    default:
      return <FontAwesome {...iconProps} name={name as any} />;
  }
};
