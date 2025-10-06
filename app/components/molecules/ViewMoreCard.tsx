import React from 'react';
import { StyleSheet, Pressable, ImageBackground } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, Elevation } from '@/constants/theme';
import { Text } from '@/components/atoms';
import { LinearGradient } from 'expo-linear-gradient';
import { useResponsiveCardSize } from '@/hooks/useResponsiveCardSize';

interface ViewMoreCardProps {
  count: number;
  onPress: () => void;
  previewAvatars?: string[];
}

export function ViewMoreCard({ count, onPress, previewAvatars = [] }: ViewMoreCardProps) {
  const { cardWidth, cardHeight } = useResponsiveCardSize();

  const backgroundImage =
    previewAvatars[0] ||
    'https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=400&h=300&fit=crop&crop=center';

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        {
          width: cardWidth,
          height: cardHeight,
          marginRight: Spacing.m,
          borderRadius: BorderRadius.large,
          overflow: 'hidden',
          opacity: pressed ? 0.8 : 1,
          ...Elevation.medium,
        },
      ]}
    >
      <ImageBackground
        source={{ uri: backgroundImage }}
        style={styles.backgroundImage}
        blurRadius={3}
      >
        <LinearGradient
          colors={['rgba(4, 114, 178, 0.85)', 'rgba(2, 33, 66, 0.90)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={styles.content}
        >
          <Text variant="h4" color="white" weight="semiBold" style={styles.mainText}>
            Voir tout
          </Text>
          <Text variant="bodySmall" color="white" style={styles.subText}>
            {count} pro{count > 1 ? 's' : ''}
          </Text>
        </LinearGradient>
      </ImageBackground>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  backgroundImage: {
    width: '100%',
    height: '100%',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.l,
  },
  mainText: {
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  subText: {
    textAlign: 'center',
    opacity: 0.9,
  },
});
