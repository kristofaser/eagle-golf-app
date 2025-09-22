import React, { useState, memo } from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { Image } from 'expo-image';
import { Colors, BorderRadius } from '@/constants/theme';
import { ProfileSkeleton } from './ProfileSkeleton';

interface OptimizedImageProps {
  uri: string;
  style?: ViewStyle;
  width?: number;
  height?: number;
  borderRadius?: number;
  placeholder?: React.ReactNode;
  fallback?: React.ReactNode;
  contentFit?: 'cover' | 'contain' | 'fill' | 'none' | 'scale-down';
  priority?: 'low' | 'normal' | 'high';
  onLoad?: () => void;
  onError?: (error: any) => void;
}

const OptimizedImageComponent: React.FC<OptimizedImageProps> = ({
  uri,
  style,
  width = 200,
  height = 200,
  borderRadius = BorderRadius.medium,
  placeholder,
  fallback,
  contentFit = 'cover',
  priority = 'normal',
  onLoad,
  onError,
}) => {
  const [imageError, setImageError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const handleLoad = () => {
    setIsLoading(false);
    onLoad?.();
  };

  const handleError = (error: any) => {
    console.warn('OptimizedImage failed to load:', uri, error);
    setImageError(true);
    setIsLoading(false);
    onError?.(error);
  };

  // Configuration cache intelligente basée sur la priorité
  const cachePolicy = priority === 'high' ? 'memory-disk' : 'memory';
  const transition = priority === 'high' ? 300 : 200;

  const imageStyle = [
    {
      width,
      height,
      borderRadius,
    },
    style,
  ];

  // Si erreur, afficher le fallback ou placeholder
  if (imageError) {
    return fallback || (
      <View style={[styles.fallback, imageStyle]}>
        {placeholder || <ProfileSkeleton />}
      </View>
    );
  }

  return (
    <View style={imageStyle}>
      {/* Skeleton pendant le chargement */}
      {isLoading && (
        <View style={[StyleSheet.absoluteFill, styles.skeleton]}>
          {placeholder || <ProfileSkeleton />}
        </View>
      )}

      {/* Image optimisée avec cache */}
      <Image
        source={{
          uri,
          cacheKey: `optimized-${uri}`, // Cache key pour éviter les doublons
        }}
        style={imageStyle}
        contentFit={contentFit}
        transition={transition}
        cachePolicy={cachePolicy}
        recyclingKey={uri} // Améliore le recyclage en liste
        onLoad={handleLoad}
        onError={handleError}
        // Préchargement progressif pour UX fluide
        placeholder={{
          blurhash: 'L6PZfSi_.AyE_3t7t7R**0o#DgR4', // Blur générique
        }}
        placeholderContentFit="cover"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  fallback: {
    backgroundColor: Colors.neutral.mist,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  skeleton: {
    backgroundColor: Colors.neutral.cloud,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: BorderRadius.medium,
  },
});

export const OptimizedImage = memo(OptimizedImageComponent, (prevProps, nextProps) => {
  // Custom comparison pour éviter les re-renders inutiles
  return (
    prevProps.uri === nextProps.uri &&
    prevProps.width === nextProps.width &&
    prevProps.height === nextProps.height &&
    prevProps.borderRadius === nextProps.borderRadius &&
    prevProps.contentFit === nextProps.contentFit &&
    prevProps.priority === nextProps.priority
  );
});