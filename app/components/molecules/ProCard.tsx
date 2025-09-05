import React, { useRef, useCallback, memo, useState } from 'react';
import { View, StyleSheet, Pressable, TouchableOpacity } from 'react-native';
import Animated from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { Colors, BorderRadius, Spacing } from '@/constants/theme';
import { Text, Icon } from '@/components/atoms';
import { JoueurData, CardLayout } from './ContentCard';
import { useResponsiveCardSize } from '@/hooks/useResponsiveCardSize';
import { IMAGE_CONFIG, RESPONSIVE_CONFIG } from '@/utils/constants/animations';
import { useProProfile, useProFavorite } from '@/hooks/useProProfile';
import { formatDistance } from '@/utils/location';

interface ProCardProps {
  data: JoueurData;
  onPress: (data: JoueurData) => void;
  onCardPress?: (data: JoueurData, layout: CardLayout) => void;
  isHidden?: boolean;
  onHover?: (profileId: string) => void;
  showDivisionBadge?: boolean;
}

// Fonction pour obtenir le nom court de la division
const getDivisionShortName = (division: string): string => {
  const shortNames: { [key: string]: string } = {
    'DP World Tour': 'DP WORLD',
    'HotelPlanner Tour': 'HOTELPLANNER',
    'Ladies European Tour': 'LET',
    'Circuit Français': 'CIRCUIT FR',
    'Challenge Tour': 'CHALLENGE',
    'Elite Tour': 'ELITE',
    'Alps Tour': 'ALPS',
  };
  return shortNames[division] || division.toUpperCase();
};

// Fonction pour obtenir le style du badge selon la division
const getDivisionBadgeStyle = (division: string) => {
  const divisionColors: { [key: string]: any } = {
    'DP World Tour': { backgroundColor: '#1E3A8A' }, // Bleu foncé prestigieux
    'HotelPlanner Tour': { backgroundColor: '#7C3AED' }, // Violet
    'Ladies European Tour': { backgroundColor: '#EC4899' }, // Rose
    'Circuit Français': { backgroundColor: '#0891B2' }, // Cyan
    'Challenge Tour': { backgroundColor: '#F59E0B' }, // Orange
    'Elite Tour': { backgroundColor: '#10B981' }, // Vert
    'Alps Tour': { backgroundColor: '#6366F1' }, // Indigo
  };
  return divisionColors[division] || { backgroundColor: '#64748B' };
};

const ProCardComponent: React.FC<ProCardProps> = ({
  data,
  onPress,
  onCardPress,
  isHidden,
  onHover,
  showDivisionBadge = false,
}) => {
  const viewRef = useRef<View>(null);
  const { cardWidth, cardHeight } = useResponsiveCardSize();
  const { prefetchProfile } = useProProfile(data.id, false);
  const { isFavorite, toggleFavorite, isToggling } = useProFavorite(data.id);
  const [hasHovered, setHasHovered] = useState(false);

  const handlePress = useCallback(() => {
    if (onCardPress) {
      viewRef.current?.measure((_x, _y, width, height, pageX, pageY) => {
        onCardPress(data, { x: pageX, y: pageY, width, height });
      });
    } else {
      onPress(data);
    }
  }, [data, onPress, onCardPress]);

  // Précharger le profil lors du premier hover
  const handlePressIn = useCallback(() => {
    if (!hasHovered) {
      setHasHovered(true);
      prefetchProfile(data.id);
      onHover?.(data.id);
    }
  }, [hasHovered, data.id, prefetchProfile, onHover]);

  const handleFavoritePress = useCallback(
    (e: any) => {
      e.stopPropagation();
      if (!isToggling) {
        toggleFavorite();
      }
    },
    [toggleFavorite, isToggling]
  );

  const cardStyle = {
    width: cardWidth,
    opacity: isHidden ? 0 : 1,
  };

  return (
    <Pressable onPress={handlePress} onPressIn={handlePressIn} style={styles.pressable}>
      <View style={[cardStyle]} ref={viewRef}>
        {/* Image avec coeur favori */}
        <View style={[styles.imageContainer, { height: cardHeight }]}>
          <Animated.Image
            source={{ uri: data.imageUrl }}
            style={styles.image}
            sharedTransitionTag={`image-${data.id}`}
            cachePolicy={IMAGE_CONFIG.CACHE_POLICY}
            transition={IMAGE_CONFIG.TRANSITION_DURATION}
            contentFit={IMAGE_CONFIG.CONTENT_FIT}
            placeholder={IMAGE_CONFIG.PLACEHOLDER}
            onError={(error) => {
              console.warn('Image failed to load:', data.imageUrl, error);
            }}
          />

          {/* Bouton favori */}
          <TouchableOpacity
            style={styles.favoriteButton}
            onPress={handleFavoritePress}
            activeOpacity={0.7}
          >
            <View style={[styles.heartContainer, isToggling && styles.heartAnimating]}>
              <Ionicons
                name="heart"
                size={22}
                color={isFavorite ? Colors.semantic.error : Colors.ui.favoriteHeart}
              />
              <Ionicons
                name="heart-outline"
                size={22}
                color={Colors.neutral.ball}
                style={styles.heartOutline}
              />
            </View>
          </TouchableOpacity>

          {/* Badge de division */}
          {showDivisionBadge && data.division && (
            <View style={[styles.divisionBadge, getDivisionBadgeStyle(data.division)]}>
              <Text variant="caption" color="ball" weight="semiBold" style={styles.divisionText}>
                {getDivisionShortName(data.division)}
              </Text>
            </View>
          )}

          {/* Note en bas à gauche */}
          {data.rating && (
            <View style={styles.ratingContainer}>
              <Icon name="star" size={12} color={Colors.neutral.ball} family="FontAwesome" />
              <Text variant="caption" color="ball" weight="medium" style={styles.ratingText}>
                {data.rating.toFixed(1)}
              </Text>
            </View>
          )}

        </View>

        {/* Informations sous l'image */}
        <View style={styles.infoContainer}>
          <View style={styles.titleRow}>
            {data.isAvailable && <View style={styles.statusDot} />}
            <Text
              variant="body"
              color="charcoal"
              weight="semiBold"
              numberOfLines={1}
              style={styles.name}
            >
              {data.title}
            </Text>
          </View>
          <View style={styles.locationRow}>
            <Icon
              name="location-on"
              size={12}
              color={Colors.neutral.course}
              family="MaterialIcons"
            />
            <Text variant="caption" color="course" numberOfLines={1} style={styles.locationText}>
              {data.region}
              {data.distance !== undefined && ` • ${formatDistance(data.distance)}`}
            </Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
};

export const ProCard = memo(ProCardComponent);

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
  favoriteButton: {
    position: 'absolute',
    top: Spacing.s,
    right: Spacing.s,
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heartContainer: {
    position: 'relative',
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heartOutline: {
    position: 'absolute',
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
  infoContainer: {
    paddingTop: Spacing.s,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xxs,
    gap: Spacing.xs,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.semantic.success,
  },
  name: {
    flex: 1,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xxs,
    marginTop: Spacing.xxs,
  },
  locationText: {
    marginLeft: Spacing.xxs,
  },
  heartAnimating: {
    opacity: 0.5,
  },
  divisionBadge: {
    position: 'absolute',
    top: Spacing.s,
    left: Spacing.s,
    paddingHorizontal: Spacing.xs,
    paddingVertical: 2,
    borderRadius: BorderRadius.small,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  divisionText: {
    fontSize: 8,
    letterSpacing: 0.3,
  },
});
