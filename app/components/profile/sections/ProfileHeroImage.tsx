import React, { memo } from 'react';
import { View } from 'react-native';
import Animated from 'react-native-reanimated';
import { Image } from 'expo-image';
import { profileStyles } from '../styles/profileStyles';

// Image par défaut si pas d'avatar
const DEFAULT_PRO_IMAGE =
  'https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=400&h=300&fit=crop&crop=center';

// Blurhash pour l'image de profil (généré depuis l'image par défaut)
const PROFILE_BLURHASH = 'L6PZfSi_.AyE_3t7t7R**0o#DgR4';

interface ProfileHeroImageProps {
  imageUrl?: string;
  profileId: string;
  profileName: string;
  parallaxImageStyle: any;
}

export const ProfileHeroImage = memo<ProfileHeroImageProps>(
  ({ imageUrl, profileId, profileName, parallaxImageStyle }) => {
    const imageSource = imageUrl || DEFAULT_PRO_IMAGE;

    return (
      <Animated.View
        style={[profileStyles.imageContainer, parallaxImageStyle]}
        pointerEvents="none"
      >
        <Image
          source={{
            uri: imageSource,
            cacheKey: `hero-${profileId}`,
          }}
          style={profileStyles.heroImage}
          contentFit="cover"
          priority="high"
          cachePolicy="memory-disk"
          transition={300}
          recyclingKey={`hero-${profileId}`}
          placeholder={PROFILE_BLURHASH}
          placeholderContentFit="cover"
          accessible={true}
          accessibilityRole="image"
          accessibilityLabel={`Photo de profil de ${profileName}`}
        />
      </Animated.View>
    );
  }
);

ProfileHeroImage.displayName = 'ProfileHeroImage';
