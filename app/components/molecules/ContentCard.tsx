import React, { useRef, useCallback, memo } from 'react';
import { StyleSheet, Pressable, View } from 'react-native';
import { Image } from 'expo-image';
import Animated from 'react-native-reanimated';
import { useResponsiveCardSize } from '@/hooks/useResponsiveCardSize';
import { IMAGE_CONFIG, RESPONSIVE_CONFIG } from '@/utils/constants/animations';
import { Colors, BorderRadius, Elevation, Spacing } from '@/constants/theme';
import { Text, Badge, Icon } from '@/components/atoms';
import { LinearGradient } from 'expo-linear-gradient';

export interface CardLayout {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface CardData {
  id: string;
  title: string;
  imageUrl: string;
  type?: 'parcours' | 'joueur';
}

export interface JoueurData extends CardData {
  type: 'joueur';
  age: number;
  region: string;
  handicap: string;
  scoreAverage: number;
  specialite: string;
  styleJeu: string;
  experience: number;
  circuits: string;
  meilleurResultat: string;
  victoires: number;
  tarif: string;
  rating?: number;
  isPremium?: boolean;
  isAvailable?: boolean;
  division?: string;
  worldRanking?: number;
  distance?: number;
}

interface ContentCardProps extends CardData {
  onCardPress: (data: CardData, layout: CardLayout) => void;
  isHidden?: boolean;
}

/**
 * Composant ContentCard optimisé avec:
 * - expo-image pour de meilleures performances
 * - Responsive design adaptatif
 * - Memoization pour éviter les re-renders
 * - Error handling pour les images
 */
const ContentCardComponent = (props: ContentCardProps) => {
  const { onCardPress, isHidden, ...cardData } = props;
  const viewRef = useRef<View>(null);
  const { cardWidth, cardHeight } = useResponsiveCardSize();

  const handlePress = useCallback(() => {
    viewRef.current?.measure((_x, _y, width, height, pageX, pageY) => {
      // Passer toutes les données de la carte
      onCardPress(cardData as CardData, { x: pageX, y: pageY, width, height });
    });
  }, [cardData, onCardPress]);

  const cardStyle = {
    width: cardWidth,
    height: cardHeight,
    opacity: isHidden ? 0 : 1,
  };

  return (
    <Pressable onPress={handlePress} style={styles.pressable}>
      <View style={[styles.card, cardStyle]} ref={viewRef}>
        <Animated.Image
          source={{ uri: cardData.imageUrl }}
          style={styles.image}
          sharedTransitionTag={`image-${cardData.id}`}
          cachePolicy={IMAGE_CONFIG.CACHE_POLICY}
          transition={IMAGE_CONFIG.TRANSITION_DURATION}
          contentFit={IMAGE_CONFIG.CONTENT_FIT}
          placeholder={IMAGE_CONFIG.PLACEHOLDER}
          onError={(error) => {
            console.warn('Image failed to load:', cardData.imageUrl, error);
          }}
        />
        <LinearGradient colors={['transparent', Colors.ui.overlay]} style={styles.gradient}>
          <View style={styles.contentContainer}>
            <View style={styles.titleRow}>
              <Animated.Text
                // @ts-expect-error - Animated.Text doesn't have variant prop
                variant="h4"
                color={Colors.neutral.ball}
                numberOfLines={1}
                style={styles.title}
                sharedTransitionTag={`title-${cardData.id}`}
              >
                {cardData.title}
              </Animated.Text>
              {cardData.type === 'joueur' && (cardData as JoueurData).isPremium && (
                <Icon
                  name="star"
                  size={16}
                  color={Colors.secondary.champion}
                  family="FontAwesome"
                />
              )}
            </View>
            {cardData.type === 'joueur' && (
              <View style={styles.metaRow}>
                <View style={styles.metaItem}>
                  <Icon
                    name="location-on"
                    size={14}
                    color={Colors.neutral.ball}
                    family="MaterialIcons"
                  />
                  <Text variant="caption" color={Colors.neutral.ball} style={styles.metaText}>
                    {(cardData as JoueurData).region}
                  </Text>
                </View>
                <Badge variant="success" size="small">
                  {(cardData as JoueurData).handicap}
                </Badge>
              </View>
            )}
          </View>
        </LinearGradient>
      </View>
    </Pressable>
  );
};

// Memoization pour éviter les re-renders inutiles
export const ContentCard = memo(ContentCardComponent);

const styles = StyleSheet.create({
  pressable: {
    marginRight: RESPONSIVE_CONFIG.SPACING.CARD_MARGIN,
  },
  card: {
    backgroundColor: Colors.neutral.ball,
    borderRadius: BorderRadius.large,
    overflow: 'hidden',
    ...Elevation.medium,
    // Performance optimization: use transform instead of changing layout
    backfaceVisibility: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  gradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingTop: Spacing.xl,
  },
  contentContainer: {
    padding: Spacing.m,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.xs,
  },
  title: {
    flex: 1,
    marginRight: Spacing.xs,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaText: {
    marginLeft: Spacing.xxs,
  },
});
