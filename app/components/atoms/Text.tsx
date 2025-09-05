import React from 'react';
import { Text as RNText, TextProps as RNTextProps, StyleSheet } from 'react-native';
import { Colors, Typography } from '@/constants/theme';

interface TextProps extends RNTextProps {
  variant?: 'h1' | 'h2' | 'h3' | 'h4' | 'bodyLarge' | 'body' | 'caption' | 'small';
  color?: keyof typeof Colors.neutral | keyof typeof Colors.primary | string;
  weight?: keyof typeof Typography.fontWeight;
  align?: 'left' | 'center' | 'right' | 'justify';
  children: React.ReactNode;
}

export const Text: React.FC<TextProps> = ({
  variant = 'body',
  color = 'charcoal',
  weight,
  align,
  style,
  children,
  ...props
}) => {
  const colorValue =
    Colors.neutral[color as keyof typeof Colors.neutral] ||
    Colors.primary[color as keyof typeof Colors.primary] ||
    color;

  return (
    <RNText
      style={[
        styles.base,
        styles[variant],
        { color: colorValue },
        weight && { fontWeight: Typography.fontWeight[weight] },
        align && { textAlign: align },
        style,
      ]}
      {...props}
    >
      {children}
    </RNText>
  );
};

const styles = StyleSheet.create({
  base: {
    fontFamily: Typography.fontFamily.primary,
    color: Colors.neutral.charcoal,
  },
  h1: {
    fontSize: Typography.fontSize.h1,
    lineHeight: Typography.lineHeight.h1,
    fontWeight: Typography.fontWeight.bold,
    fontFamily: Typography.fontFamily.display,
  },
  h2: {
    fontSize: Typography.fontSize.h2,
    lineHeight: Typography.lineHeight.h2,
    fontWeight: Typography.fontWeight.semiBold,
  },
  h3: {
    fontSize: Typography.fontSize.h3,
    lineHeight: Typography.lineHeight.h3,
    fontWeight: Typography.fontWeight.semiBold,
  },
  h4: {
    fontSize: Typography.fontSize.h4,
    lineHeight: Typography.lineHeight.h4,
    fontWeight: Typography.fontWeight.medium,
  },
  bodyLarge: {
    fontSize: Typography.fontSize.bodyLarge,
    lineHeight: Typography.lineHeight.bodyLarge,
    fontWeight: Typography.fontWeight.regular,
  },
  body: {
    fontSize: Typography.fontSize.body,
    lineHeight: Typography.lineHeight.body,
    fontWeight: Typography.fontWeight.regular,
  },
  caption: {
    fontSize: Typography.fontSize.caption,
    lineHeight: Typography.lineHeight.caption,
    fontWeight: Typography.fontWeight.regular,
  },
  small: {
    fontSize: Typography.fontSize.small,
    lineHeight: Typography.lineHeight.small,
    fontWeight: Typography.fontWeight.regular,
  },
});
