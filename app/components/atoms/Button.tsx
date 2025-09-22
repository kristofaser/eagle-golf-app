import React from 'react';
import {
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacityProps,
  ViewStyle,
  TextStyle,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { Colors, Typography, Spacing, BorderRadius, Elevation } from '@/constants/theme';
import { ANIMATION_PRESETS, SPRING_CONFIGS } from '@/constants/animations';

interface ButtonProps extends TouchableOpacityProps {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'success' | 'warning' | 'danger';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  loading?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  children,
  style,
  textStyle,
  onPress,
  ...props
}) => {
  const isDisabled = disabled || loading;

  // Animation values
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  const getLoaderColor = () => {
    switch (variant) {
      case 'primary':
      case 'success':
      case 'warning':
      case 'danger':
        return Colors.neutral.white;
      default:
        return Colors.primary.electric;
    }
  };

  // Animated styles
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }), []);

  // Gesture handling with premium micro-interactions
  const tapGesture = Gesture.Tap()
    .enabled(!isDisabled)
    .onBegin(() => {
      'worklet';
      // Press down animation with spring bounce
      scale.value = withSpring(ANIMATION_PRESETS.BUTTON_PRESS.scale, SPRING_CONFIGS.BOUNCY);
      opacity.value = withSpring(0.8, SPRING_CONFIGS.MEDIUM);
    })
    .onFinalize((event) => {
      'worklet';
      // Release animation back to normal
      scale.value = withSpring(1, SPRING_CONFIGS.MEDIUM);
      opacity.value = withSpring(1, SPRING_CONFIGS.MEDIUM);

      // Trigger onPress if gesture was successful
      if (event.state === 5 && onPress) { // 5 = END state
        runOnJS(onPress)(event as any);
      }
    });

  return (
    <GestureDetector gesture={tapGesture}>
      <Animated.View
        style={[
          styles.base,
          styles[variant],
          styles[size],
          isDisabled && styles.disabled,
          animatedStyle,
          style,
        ]}
        accessibilityRole="button"
        accessibilityState={{
          disabled: isDisabled,
          busy: loading
        }}
        accessibilityLabel={loading ? "Chargement en cours..." : (typeof children === 'string' ? children : undefined)}
        {...props}
      >
        {loading ? (
          <ActivityIndicator
            color={getLoaderColor()}
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
      </Animated.View>
    </GestureDetector>
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
    backgroundColor: Colors.neutral.cloud,
    borderWidth: 1,
    borderColor: Colors.neutral.mist,
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: Colors.primary.electric,
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  success: {
    backgroundColor: Colors.semantic.success.default,
    ...Elevation.small,
  },
  warning: {
    backgroundColor: Colors.semantic.warning.default,
    ...Elevation.small,
  },
  danger: {
    backgroundColor: Colors.semantic.error.default,
    ...Elevation.small,
  },

  // Sizes
  xs: {
    paddingHorizontal: Spacing.xs,
    paddingVertical: Spacing.xxs,
    minHeight: 28,
  },
  sm: {
    paddingHorizontal: Spacing.s,
    paddingVertical: Spacing.xs,
    minHeight: 32,
  },
  md: {
    paddingHorizontal: Spacing.m,
    paddingVertical: Spacing.s,
    minHeight: 40,
  },
  lg: {
    paddingHorizontal: Spacing.l,
    paddingVertical: Spacing.s,
    minHeight: 44,
  },
  xl: {
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
    textAlign: 'center',
  },
  primaryText: {
    color: Colors.neutral.white,
  },
  secondaryText: {
    color: Colors.neutral.charcoal,
  },
  outlineText: {
    color: Colors.primary.electric,
  },
  ghostText: {
    color: Colors.primary.electric,
  },
  successText: {
    color: Colors.neutral.white,
  },
  warningText: {
    color: Colors.neutral.white,
  },
  dangerText: {
    color: Colors.neutral.white,
  },

  // Text sizes
  xsText: {
    fontSize: Typography.fontSize.small,
    lineHeight: Typography.lineHeight.small,
  },
  smText: {
    fontSize: Typography.fontSize.caption,
    lineHeight: Typography.lineHeight.caption,
  },
  mdText: {
    fontSize: Typography.fontSize.body,
    lineHeight: Typography.lineHeight.body,
  },
  lgText: {
    fontSize: Typography.fontSize.body,
    lineHeight: Typography.lineHeight.body,
  },
  xlText: {
    fontSize: Typography.fontSize.bodyLarge,
    lineHeight: Typography.lineHeight.bodyLarge,
  },

  disabledText: {
    color: Colors.neutral.course,
  },
});
