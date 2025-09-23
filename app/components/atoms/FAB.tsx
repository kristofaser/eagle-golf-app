import React, { memo } from 'react';
import { View, StyleSheet, Pressable, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing } from '@/constants/theme';
import { Text } from './Text';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface FABProps {
  onPress: () => void;
  icon: keyof typeof Ionicons.glyphMap;
  label?: string;
  isActive?: boolean;
  size?: 'small' | 'normal' | 'large';
  style?: ViewStyle;
  disabled?: boolean;
}

const FABComponent: React.FC<FABProps> = ({
  onPress,
  icon,
  label,
  isActive = false,
  size = 'normal',
  style,
  disabled = false,
}) => {
  const scale = useSharedValue(1);
  const elevation = useSharedValue(isActive ? 8 : 4);

  const sizes = {
    small: { width: 40, height: 40, iconSize: 20 },
    normal: { width: 56, height: 56, iconSize: 24 },
    large: { width: 72, height: 72, iconSize: 28 },
  };

  const currentSize = sizes[size];

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
      elevation: elevation.value,
      shadowOpacity: elevation.value / 10,
    };
  });

  const handlePressIn = () => {
    scale.value = withSpring(0.95, { damping: 15, stiffness: 300 });
    elevation.value = withTiming(2, { duration: 150 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 300 });
    elevation.value = withTiming(isActive ? 8 : 4, { duration: 150 });
  };

  const fabStyle = [
    styles.fab,
    {
      width: currentSize.width,
      height: currentSize.height,
      backgroundColor: isActive ? Colors.primary.accent : Colors.neutral.ball,
    },
    disabled && styles.disabled,
    style,
  ];

  const iconColor = isActive ? Colors.neutral.ball : Colors.neutral.charcoal;

  return (
    <AnimatedPressable
      style={[fabStyle, animatedStyle]}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label || 'Floating action button'}
      accessibilityState={{ selected: isActive }}
    >
      <View style={styles.content}>
        <Ionicons name={icon} size={currentSize.iconSize} color={iconColor} />
        {label && (
          <Text
            variant="caption"
            color={isActive ? 'ball' : 'charcoal'}
            weight="medium"
            style={styles.label}
            numberOfLines={1}
          >
            {label}
          </Text>
        )}
      </View>
    </AnimatedPressable>
  );
};

export const FAB = memo(FABComponent);

const styles = StyleSheet.create({
  fab: {
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 4,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.s,
  },
  label: {
    marginLeft: Spacing.xs,
    fontSize: 12,
  },
  disabled: {
    opacity: 0.5,
  },
});
