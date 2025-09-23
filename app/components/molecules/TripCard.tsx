import React, { useRef, useCallback, memo, useState } from 'react';
import { View, StyleSheet, Pressable, TouchableOpacity } from 'react-native';
import Animated from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { Colors, BorderRadius, Spacing } from '@/constants/theme';
import { Text, Icon } from '@/components/atoms';
import { useResponsiveCardSize } from '@/hooks/useResponsiveCardSize';
import { IMAGE_CONFIG, RESPONSIVE_CONFIG } from '@/utils/constants/animations';

export interface TripData {
  id: string;
  title: string;
  country: string;
  imageUrl: string;
  duration: string;
  price: string;
  rating: number;
  golfCourses: number;
  description: string;
  featured?: boolean;
  status: 'completed' | 'full';
  date: string;
}

interface TripCardProps {
  data: TripData;
  onPress: (data: TripData) => void;
  isHidden?: boolean;
  onHover?: (tripId: string) => void;
}

const TripCardComponent: React.FC<TripCardProps> = ({ data, onPress, isHidden, onHover }) => {
  const viewRef = useRef<View>(null);
  const { cardWidth, cardHeight } = useResponsiveCardSize();
  const [hasHovered, setHasHovered] = useState(false);

  const handlePress = useCallback(() => {
    onPress(data);
  }, [data, onPress]);

  // Précharger des données lors du premier hover
  const handlePressIn = useCallback(() => {
    if (!hasHovered) {
      setHasHovered(true);
      onHover?.(data.id);
    }
  }, [hasHovered, data.id, onHover]);

  const cardStyle = {
    width: cardWidth,
    opacity: isHidden ? 0 : 1,
  };

  return (
    <Pressable onPress={handlePress} onPressIn={handlePressIn} style={styles.pressable}>
      <View style={[cardStyle]} ref={viewRef}>
        {/* Image avec badges */}
        <View style={[styles.imageContainer, { height: cardHeight }]}>
          <Animated.Image
            source={{ uri: data.imageUrl }}
            style={styles.image}
            sharedTransitionTag={`trip-image-${data.id}`}
            cachePolicy={IMAGE_CONFIG.CACHE_POLICY}
            transition={IMAGE_CONFIG.TRANSITION_DURATION}
            contentFit={IMAGE_CONFIG.CONTENT_FIT}
            placeholder={IMAGE_CONFIG.PLACEHOLDER}
            onError={(error) => {
              console.warn('Image failed to load:', data.imageUrl, error);
            }}
          />

          {/* Badge Status */}
          <View
            style={[
              styles.statusBadge,
              data.status === 'completed' ? styles.completedBadge : styles.fullBadge,
            ]}
          >
            <Text variant="caption" color="ball" weight="medium" style={styles.statusText}>
              {data.status === 'completed' ? 'Voyage terminé' : 'Complet'}
            </Text>
          </View>
        </View>

        {/* Informations sous l'image */}
        <View style={styles.infoContainer}>
          <View style={styles.locationRow}>
            <Icon
              name="location-on"
              size={12}
              color={Colors.neutral.course}
              family="MaterialIcons"
            />
            <Text variant="caption" color="course" numberOfLines={1} style={styles.locationText}>
              {data.country}
            </Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
};

export const TripCard = memo(TripCardComponent);

const styles = StyleSheet.create({
  pressable: {
    marginRight: RESPONSIVE_CONFIG.SPACING.CARD_MARGIN,
  },
  imageContainer: {
    position: 'relative',
    backgroundColor: Colors.neutral.mist,
    borderRadius: BorderRadius.medium,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  featuredBadge: {
    position: 'absolute',
    top: Spacing.s,
    left: Spacing.s,
    backgroundColor: Colors.primary.accent,
    paddingHorizontal: Spacing.xs,
    paddingVertical: 2,
    borderRadius: BorderRadius.small,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  featuredText: {
    fontSize: 8,
    letterSpacing: 0.3,
  },
  statusBadge: {
    position: 'absolute',
    top: Spacing.s,
    right: Spacing.s,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BorderRadius.small,
  },
  completedBadge: {
    backgroundColor: 'rgba(100, 116, 139, 0.9)', // Gris pour terminé
  },
  fullBadge: {
    backgroundColor: 'rgba(239, 68, 68, 0.9)', // Rouge pour complet
  },
  statusText: {
    fontSize: 10,
  },
  ratingContainer: {
    position: 'absolute',
    bottom: Spacing.s,
    left: Spacing.s,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BorderRadius.small,
  },
  ratingText: {
    marginLeft: Spacing.xxs,
    fontSize: 11,
  },
  priceContainer: {
    position: 'absolute',
    bottom: Spacing.s,
    right: Spacing.s,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    paddingHorizontal: Spacing.xs,
    paddingVertical: Spacing.xxs,
    borderRadius: BorderRadius.small,
  },
  priceText: {
    fontSize: 12,
    color: Colors.neutral.ball,
  },
  infoContainer: {
    paddingTop: Spacing.s,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xxs,
  },
  name: {
    flex: 1,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xxs,
    marginBottom: Spacing.xxs,
  },
  locationText: {
    marginLeft: Spacing.xxs,
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Spacing.xxs,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xxs,
  },
  detailText: {
    fontSize: 11,
  },
});
