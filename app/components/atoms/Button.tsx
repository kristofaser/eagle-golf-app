import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacityProps,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { Colors, Typography, Spacing, BorderRadius, Elevation } from '@/constants/theme';

interface ButtonProps extends TouchableOpacityProps {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'small' | 'medium' | 'large';
  loading?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'medium',
  loading = false,
  disabled = false,
  children,
  style,
  textStyle,
  ...props
}) => {
  const isDisabled = disabled || loading;

  return (
    <TouchableOpacity
      style={[styles.base, styles[variant], styles[size], isDisabled && styles.disabled, style]}
      disabled={isDisabled}
      activeOpacity={0.7}
      {...props}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === 'primary' ? Colors.neutral.white : Colors.primary.electric}
          size="small"
        />
      ) : (
        <Text
          style={[
            styles.text,
            styles[`${variant}Text`],
            styles[`${size}Text`],
            isDisabled && styles.disabledText,
            textStyle,
          ]}
        >
          {children}
        </Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: BorderRadius.medium,
  },

  // Variants
  primary: {
    backgroundColor: Colors.primary.electric,
    ...Elevation.small,
  },
  secondary: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: Colors.primary.navy,
  },
  ghost: {
    backgroundColor: 'transparent',
  },

  // Sizes
  small: {
    paddingHorizontal: Spacing.m,
    paddingVertical: Spacing.xs,
    minHeight: 32,
  },
  medium: {
    paddingHorizontal: Spacing.l,
    paddingVertical: Spacing.s,
    minHeight: 44,
  },
  large: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.m,
    minHeight: 56,
  },

  // States
  disabled: {
    opacity: 0.5,
  },

  // Text styles
  text: {
    fontFamily: Typography.fontFamily.primary,
    fontWeight: Typography.fontWeight.semiBold,
  },
  primaryText: {
    color: Colors.neutral.white,
  },
  secondaryText: {
    color: Colors.primary.navy,
  },
  ghostText: {
    color: Colors.primary.electric,
  },

  // Text sizes
  smallText: {
    fontSize: Typography.fontSize.caption,
    lineHeight: Typography.lineHeight.caption,
  },
  mediumText: {
    fontSize: Typography.fontSize.body,
    lineHeight: Typography.lineHeight.body,
  },
  largeText: {
    fontSize: Typography.fontSize.bodyLarge,
    lineHeight: Typography.lineHeight.bodyLarge,
  },

  disabledText: {
    color: Colors.neutral.course,
  },
});
