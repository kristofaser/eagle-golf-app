import React from 'react';
import { Text as RNText, TextProps as RNTextProps, StyleSheet } from 'react-native';
import { Colors, Typography } from '@/constants/theme';
import { getFontStyle } from '@/utils/fontMapping';

interface TextProps extends RNTextProps {
  variant?:
    | 'h1'
    | 'h2'
    | 'h3'
    | 'h4'
    | 'h5'
    | 'h6'
    | 'bodyLarge'
    | 'body'
    | 'bodySmall'
    | 'caption'
    | 'overline'
    | 'label'
    | 'small';
  color?:
    | keyof typeof Colors.neutral
    | keyof typeof Colors.primary
    | keyof typeof Colors.semantic
    | string;
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
    Colors.semantic[color as keyof typeof Colors.semantic] ||
    color;

  // Obtenir le style de police correct basé sur le poids
  const fontStyle = weight ? getFontStyle(weight) : {};

  return (
    <RNText
      style={[
        styles.base,
        styles[variant],
        { color: colorValue },
        fontStyle,
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
    fontFamily: 'Inter-Regular',
    color: Colors.neutral.charcoal,
  },
  h1: {
    fontSize: Typography.fontSize.h1,
    lineHeight: Typography.lineHeight.h1,
    fontFamily: 'Inter-Bold',
  },
  h2: {
    fontSize: Typography.fontSize.h2,
    lineHeight: Typography.lineHeight.h2,
    fontFamily: 'Inter-SemiBold',
  },
  h3: {
    fontSize: Typography.fontSize.h3,
    lineHeight: Typography.lineHeight.h3,
    fontFamily: 'Inter-SemiBold',
  },
  h4: {
    fontSize: Typography.fontSize.h4,
    lineHeight: Typography.lineHeight.h4,
    fontFamily: 'Inter-Medium',
  },
  bodyLarge: {
    fontSize: Typography.fontSize.bodyLarge,
    lineHeight: Typography.lineHeight.bodyLarge,
    fontFamily: 'Inter-Regular',
  },
  body: {
    fontSize: Typography.fontSize.body,
    lineHeight: Typography.lineHeight.body,
    fontFamily: 'Inter-Regular',
  },
  caption: {
    fontSize: Typography.fontSize.caption,
    lineHeight: Typography.lineHeight.caption,
    fontFamily: 'Inter-Regular',
  },
  h5: {
    fontSize: Typography.fontSize.h5,
    lineHeight: Typography.lineHeight.h5,
    fontFamily: 'Inter-Medium',
  },
  h6: {
    fontSize: Typography.fontSize.h6,
    lineHeight: Typography.lineHeight.h6,
    fontFamily: 'Inter-Medium',
  },
  bodySmall: {
    fontSize: Typography.fontSize.bodySmall,
    lineHeight: Typography.lineHeight.bodySmall,
    fontFamily: 'Inter-Regular',
  },
  overline: {
    fontSize: Typography.fontSize.overline,
    lineHeight: Typography.lineHeight.overline,
    fontFamily: 'Inter-SemiBold',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  label: {
    fontSize: Typography.fontSize.label,
    lineHeight: Typography.lineHeight.label,
    fontFamily: 'Inter-Medium',
  },
  small: {
    fontSize: Typography.fontSize.small,
    lineHeight: Typography.lineHeight.small,
    fontFamily: 'Inter-Regular',
  },
});
