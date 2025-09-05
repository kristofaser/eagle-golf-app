import React from 'react';
import { View, ViewProps, StyleSheet, TouchableOpacity, TouchableOpacityProps } from 'react-native';
import { Colors, BorderRadius, Spacing, Elevation } from '@/constants/theme';

interface CardProps extends ViewProps {
  variant?: 'default' | 'bordered' | 'elevated';
  padding?: keyof typeof Spacing;
  pressable?: boolean;
  onPress?: () => void;
}

export const Card: React.FC<CardProps> = ({
  variant = 'default',
  padding = 'm',
  pressable = false,
  onPress,
  style,
  children,
  ...props
}) => {
  const cardStyle = [styles.base, styles[variant], { padding: Spacing[padding] }, style];

  if (pressable && onPress) {
    return (
      <TouchableOpacity
        style={cardStyle}
        onPress={onPress}
        activeOpacity={0.7}
        {...(props as TouchableOpacityProps)}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return (
    <View style={cardStyle} {...props}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  base: {
    backgroundColor: Colors.neutral.ball,
    borderRadius: BorderRadius.large,
  },
  default: {
    ...Elevation.medium,
  },
  bordered: {
    borderWidth: 1,
    borderColor: Colors.neutral.mist,
  },
  elevated: {
    ...Elevation.large,
  },
});
