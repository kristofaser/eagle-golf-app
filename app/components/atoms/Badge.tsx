import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { Colors, BorderRadius, Spacing } from '@/constants/theme';
import { Text } from './Text';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'error' | 'premium';
  size?: 'small' | 'medium';
  style?: ViewStyle;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  size = 'medium',
  style,
}) => {
  return (
    <View style={[styles.base, styles[variant], styles[size], style]}>
      <Text
        variant={size === 'small' ? 'caption' : 'body'}
        color={variant === 'default' ? 'iron' : Colors.neutral.ball}
        weight="medium"
      >
        {children}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  base: {
    alignSelf: 'flex-start',
    borderRadius: BorderRadius.round,
  },

  // Variants
  default: {
    backgroundColor: Colors.neutral.background,
  },
  success: {
    backgroundColor: Colors.semantic.success,
  },
  warning: {
    backgroundColor: Colors.semantic.warning,
  },
  error: {
    backgroundColor: Colors.semantic.error,
  },
  premium: {
    backgroundColor: Colors.secondary.champion,
  },

  // Sizes
  small: {
    paddingHorizontal: Spacing.xs,
    paddingVertical: Spacing.xxs,
  },
  medium: {
    paddingHorizontal: Spacing.s,
    paddingVertical: Spacing.xs,
  },
});
