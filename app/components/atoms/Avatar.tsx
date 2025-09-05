import React, { useState } from 'react';
import {
  View,
  Image,
  StyleSheet,
  ViewStyle,
  ImageErrorEventData,
  NativeSyntheticEvent,
  TouchableOpacity,
} from 'react-native';
import { Colors, BorderRadius, Typography, Elevation } from '@/constants/theme';
import { Text } from './Text';
import { AuthUser } from '@/utils/supabase/auth.types';
import { Ionicons } from '@expo/vector-icons';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

interface AvatarProps {
  source?: { uri: string };
  imageUrl?: string; // Support pour imageUrl
  name?: string;
  size?: 'small' | 'medium' | 'large' | 'xlarge';
  variant?: 'default' | 'bordered' | 'elevated' | 'status';
  statusColor?: string;
  borderColor?: string;
  borderWidth?: number;
  style?: ViewStyle;
  onPress?: () => void;
  // Nouvelles props pour compatibilité
  user?: AuthUser | null;
  showOnlineIndicator?: boolean;
  fallback?: React.ReactNode;
}

const sizeMap = {
  small: 36, // +4px pour meilleure visibilité
  medium: 52, // +4px
  large: 72, // +8px
  xlarge: 104, // +8px
};

export const Avatar: React.FC<AvatarProps> = ({
  source,
  imageUrl,
  name = '',
  size = 'medium',
  variant = 'default',
  statusColor,
  borderColor,
  borderWidth,
  style,
  onPress,
  user,
  showOnlineIndicator = false,
  fallback,
}) => {
  const dimension = sizeMap[size];
  const [imageError, setImageError] = useState(false);
  const scale = useSharedValue(1);

  // Support pour imageUrl ET source
  const avatarSource =
    source ||
    (imageUrl ? { uri: imageUrl } : undefined) ||
    (user?.profile?.avatar_url ? { uri: user.profile.avatar_url } : undefined);
  const displayName =
    name || (user?.profile ? `${user.profile.first_name} ${user.profile.last_name}`.trim() : '');

  const initials = displayName
    .split(' ')
    .map((word) => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const handleImageError = (error: NativeSyntheticEvent<ImageErrorEventData>) => {
    console.warn('Avatar image failed to load:', error.nativeEvent.error);
    setImageError(true);
  };

  const handlePressIn = () => {
    if (onPress) {
      scale.value = withSpring(0.95);
    }
  };

  const handlePressOut = () => {
    if (onPress) {
      scale.value = withSpring(1);
    }
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  // Styles de variante
  const getVariantStyles = (): ViewStyle => {
    switch (variant) {
      case 'bordered':
        return {
          borderWidth: borderWidth || 3,
          borderColor: borderColor || Colors.neutral.white,
          ...Elevation.medium,
        };
      case 'elevated':
        return {
          borderWidth: 2,
          borderColor: Colors.neutral.white,
          ...Elevation.large,
        };
      case 'status':
        return {
          borderWidth: 3,
          borderColor: statusColor || Colors.semantic.success,
        };
      default:
        return {
          borderWidth: 1,
          borderColor: Colors.neutral.pearl,
          ...Elevation.small,
        };
    }
  };

  // Si fallback fourni et pas d'avatar
  if (fallback && !avatarSource?.uri) {
    return (
      <View style={[{ position: 'relative' }, style]} pointerEvents="box-none">
        {fallback}
        {showOnlineIndicator && user && (
          <View
            style={[
              styles.onlineIndicator,
              {
                width: dimension * 0.25,
                height: dimension * 0.25,
                right: 0,
                bottom: 0,
              },
            ]}
          />
        )}
      </View>
    );
  }

  // Conteneur principal avec dimensions fixes et isolation du contexte de rendu
  const AvatarContent = (
    <Animated.View style={[animatedStyle]}>
      <View
        style={[
          styles.outerContainer,
          {
            width: dimension,
            height: dimension,
          },
          style,
        ]}
        pointerEvents="box-none"
      >
        <View
          style={[
            styles.innerContainer,
            {
              width: dimension,
              height: dimension,
              borderRadius: dimension / 2,
            },
            getVariantStyles(),
          ]}
        >
          {avatarSource?.uri && !imageError ? (
            <Image
              source={avatarSource}
              style={[
                styles.image,
                {
                  width: dimension,
                  height: dimension,
                  borderRadius: dimension / 2,
                },
              ]}
              onError={handleImageError}
              resizeMode="cover"
            />
          ) : (
            <View
              style={[
                styles.placeholder,
                {
                  width: dimension,
                  height: dimension,
                  borderRadius: dimension / 2,
                },
              ]}
            >
              {initials ? (
                <Text
                  variant={size === 'small' ? 'caption' : 'body'}
                  style={{ color: Colors.neutral.white }}
                  weight="semiBold"
                >
                  {initials}
                </Text>
              ) : (
                <Ionicons name="person" size={dimension * 0.4} color={Colors.neutral.white} />
              )}
            </View>
          )}
        </View>

        {/* Indicateur en ligne - Positionné en dehors du conteneur avec overflow */}
        {showOnlineIndicator && user && (
          <View
            style={[
              styles.onlineIndicator,
              {
                width: dimension * 0.25,
                height: dimension * 0.25,
                right: -2,
                bottom: -2,
              },
            ]}
          />
        )}
      </View>
    </Animated.View>
  );

  // Wrapper avec TouchableOpacity si onPress est défini
  if (onPress) {
    return (
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
      >
        {AvatarContent}
      </TouchableOpacity>
    );
  }

  return AvatarContent;
};

const styles = StyleSheet.create({
  outerContainer: {
    position: 'relative',
    // Pas d'overflow hidden ici pour permettre l'indicateur
  },
  innerContainer: {
    overflow: 'hidden',
    backgroundColor: Colors.neutral.white,
    // Isolation du contexte de rendu sans translateZ (non supporté)
  },
  image: {
    // resizeMode déplacé dans le composant pour éviter les conflits
  },
  placeholder: {
    backgroundColor: Colors.primary.navy,
    justifyContent: 'center',
    alignItems: 'center',
  },
  onlineIndicator: {
    position: 'absolute',
    backgroundColor: Colors.semantic.success,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: Colors.neutral.white,
    zIndex: 10,
    elevation: 3,
  },
});
