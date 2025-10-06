import React, { useRef, useCallback, memo, useState, useMemo } from 'react';
import { View, StyleSheet, Pressable, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { Colors, BorderRadius, Spacing } from '@/constants/theme';
import { Text, Icon } from '@/components/atoms';
import { JoueurData, CardLayout } from './ContentCard';
import { useResponsiveCardSize } from '@/hooks/useResponsiveCardSize';
import { RESPONSIVE_CONFIG } from '@/utils/constants/animations';
import { useProProfile, useProFavorite } from '@/hooks/useProProfile';
import { formatDistance } from '@/utils/location';
import { useRouter, usePathname } from 'expo-router';

interface ProCardProps {
  data: JoueurData;
  onPress: (data: JoueurData) => void;
  onCardPress?: (data: JoueurData, layout: CardLayout) => void;
  isHidden?: boolean;
  onHover?: (profileId: string) => void;
  showDivisionBadge?: boolean;
  isHorizontal?: boolean;
  showDeleteButton?: boolean;
}

// Fonction pour obtenir le nom de la division (nom complet pour affichage)
const getDivisionShortName = (division: string): string => {
  // Retourner le nom complet de la division tel quel
  return division;
};

// Fonction pour obtenir le style du badge selon la division
const getDivisionBadgeStyle = (division: string) => {
  const divisionConfig =
    Colors.division[division as keyof typeof Colors.division] || Colors.division.default;
  return {
    backgroundColor: divisionConfig.background,
    borderColor: divisionConfig.border,
    borderWidth: 1,
  };
};

const ProCardComponent: React.FC<ProCardProps> = ({
  data,
  onPress,
  onCardPress,
  isHidden,
  onHover,
  showDivisionBadge = false,
  isHorizontal = false,
  showDeleteButton = false,
}) => {
  const viewRef = useRef<View>(null);
  const router = useRouter();
  const pathname = usePathname();
  const { cardWidth, cardHeight } = useResponsiveCardSize();
  const { prefetchProfile } = useProProfile(data.id, false);
  const { isFavorite, toggleFavorite, isToggling } = useProFavorite(data.id, router, pathname);
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
      void prefetchProfile(data.id);
      onHover?.(data.id);
    }
  }, [hasHovered, data.id, prefetchProfile, onHover]);

  const handleFavoritePress = useCallback(
    (e: { stopPropagation: () => void }) => {
      e.stopPropagation();
      if (!isToggling) {
        toggleFavorite();
      }
    },
    [toggleFavorite, isToggling]
  );

  // Mémoriser les styles calculés pour éviter les re-calculs
  const divisionBadgeStyle = useMemo(() => getDivisionBadgeStyle(data.division), [data.division]);

  const cardStyle = useMemo(
    () => ({
      width: cardWidth,
      opacity: isHidden ? 0 : 1,
    }),
    [cardWidth, isHidden]
  );

  if (isHorizontal) {
    return (
      <Pressable onPress={handlePress} onPressIn={handlePressIn} style={styles.horizontalPressable}>
        <View style={[styles.horizontalContainer, { opacity: isHidden ? 0 : 1 }]} ref={viewRef}>
          {/* Image à gauche - propre sans overlays */}
          <View style={styles.horizontalImageContainer}>
            <Image
              source={data.imageUrl ? { uri: data.imageUrl } : undefined}
              style={styles.horizontalImage}
              cachePolicy="memory-disk"
              transition={200}
              contentFit="cover"
              placeholder={{ blurhash: 'L6PZfSjE00yI_3R*00Dg~qM{R*WB' }}
              onError={(error) => {
                console.warn('Image failed to load:', data.imageUrl, error);
              }}
            />
          </View>

          {/* Informations à droite */}
          <View style={styles.horizontalInfoContainer}>
            <View style={styles.horizontalTitleRow}>
              {data.isAvailable && <View style={styles.statusDot} />}
              <Text
                variant="body"
                color="charcoal"
                weight="semiBold"
                numberOfLines={1}
                style={styles.horizontalName}
              >
                {data.title}
              </Text>
            </View>

            {/* Division */}
            {data.division && (
              <View style={[styles.horizontalDivisionBadge, divisionBadgeStyle]}>
                <Text
                  variant="caption"
                  color="ball"
                  weight="semiBold"
                  style={styles.horizontalDivisionText}
                >
                  {getDivisionShortName(data.division)}
                </Text>
              </View>
            )}

            {/* Localisation */}
            <View style={styles.horizontalLocationRow}>
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

          {/* Bouton favori ou supprimer */}
          <TouchableOpacity
            style={styles.horizontalFavoriteButton}
            onPress={handleFavoritePress}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel={
              showDeleteButton
                ? 'Supprimer'
                : isFavorite
                  ? 'Retirer des favoris'
                  : 'Ajouter aux favoris'
            }
            accessibilityHint={
              showDeleteButton
                ? `Supprimer ${data.title}`
                : `${isFavorite ? 'Retirer' : 'Ajouter'} ${data.title} de votre liste de favoris`
            }
            accessibilityState={{ selected: !showDeleteButton && isFavorite }}
          >
            {showDeleteButton ? (
              <Ionicons name="trash-outline" size={20} color={Colors.semantic.error.default} />
            ) : (
              <View style={[styles.heartContainer, isToggling && styles.heartAnimating]}>
                <Ionicons
                  name="heart"
                  size={20}
                  color={isFavorite ? Colors.semantic.error.default : Colors.neutral.course}
                />
                <Ionicons
                  name="heart-outline"
                  size={20}
                  color={Colors.neutral.course}
                  style={styles.heartOutline}
                />
              </View>
            )}
          </TouchableOpacity>
        </View>
      </Pressable>
    );
  }

  return (
    <Pressable onPress={handlePress} onPressIn={handlePressIn} style={styles.pressable}>
      <View style={[cardStyle]} ref={viewRef}>
        {/* Image avec coeur favori */}
        <View style={[styles.imageContainer, { height: cardHeight }]}>
          <Image
            source={data.imageUrl ? { uri: data.imageUrl } : undefined}
            style={styles.image}
            cachePolicy="memory-disk"
            transition={200}
            contentFit="cover"
            placeholder={{ blurhash: 'L6PZfSjE00yI_3R*00Dg~qM{R*WB' }}
            onError={(error) => {
              console.warn('Image failed to load:', data.imageUrl, error);
            }}
          />

          {/* Bouton favori */}
          <TouchableOpacity
            style={styles.favoriteButton}
            onPress={handleFavoritePress}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel={isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
            accessibilityHint={`${isFavorite ? 'Retirer' : 'Ajouter'} ${data.title} de votre liste de favoris`}
            accessibilityState={{ selected: isFavorite }}
          >
            <View style={[styles.heartContainer, isToggling && styles.heartAnimating]}>
              <Ionicons
                name="heart"
                size={22}
                color={isFavorite ? Colors.semantic.error.default : Colors.ui.favoriteHeart}
              />
              <Ionicons
                name="heart-outline"
                size={22}
                color={Colors.neutral.white}
                style={styles.heartOutline}
              />
            </View>
          </TouchableOpacity>

          {/* Badge de division */}
          {showDivisionBadge && data.division && (
            <View style={[styles.divisionBadge, divisionBadgeStyle]}>
              <Text
                variant="caption"
                weight="semiBold"
                style={[
                  styles.divisionText,
                  {
                    color:
                      Colors.division[data.division as keyof typeof Colors.division]?.text ||
                      Colors.division.default.text,
                  },
                ]}
              >
                {getDivisionShortName(data.division)}
              </Text>
            </View>
          )}
        </View>

        {/* Informations sous l'image */}
        <View style={styles.infoContainer}>
          <View style={styles.titleRow}>
            {data.isAvailable && <View style={styles.statusDot} />}
            <Text variant="body" color="charcoal" numberOfLines={1} style={styles.name}>
              {data.title}
            </Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
};

export const ProCard = memo(ProCardComponent, (prevProps, nextProps) => {
  // Custom comparison pour éviter les re-renders inutiles
  return (
    prevProps.data.id === nextProps.data.id &&
    prevProps.data.title === nextProps.data.title &&
    prevProps.data.imageUrl === nextProps.data.imageUrl &&
    prevProps.data.isAvailable === nextProps.data.isAvailable &&
    prevProps.data.distance === nextProps.data.distance &&
    prevProps.data.division === nextProps.data.division &&
    prevProps.isHidden === nextProps.isHidden &&
    prevProps.showDivisionBadge === nextProps.showDivisionBadge &&
    prevProps.isHorizontal === nextProps.isHorizontal &&
    prevProps.showDeleteButton === nextProps.showDeleteButton
  );
});

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
    top: Spacing.xs,
    right: Spacing.s,
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 22,
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
    bottom: Spacing.s,
    left: Spacing.s,
    paddingHorizontal: Spacing.s,
    paddingVertical: 4,
    borderRadius: BorderRadius.medium,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    minHeight: 22,
    maxWidth: 180,
    justifyContent: 'center',
    alignItems: 'center',
  },
  divisionText: {
    fontSize: 9,
    letterSpacing: 0.1,
    lineHeight: 12,
    textAlign: 'center',
  },
  // Styles horizontaux
  horizontalPressable: {
    marginHorizontal: Spacing.m,
  },
  horizontalContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.neutral.white,
    borderRadius: BorderRadius.large,
    borderWidth: 0,
    borderColor: 'transparent',
    padding: Spacing.m,
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 1,
  },
  horizontalImageContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    overflow: 'hidden',
    backgroundColor: Colors.neutral.mist,
  },
  horizontalImage: {
    width: '100%',
    height: '100%',
  },
  horizontalInfoContainer: {
    flex: 1,
    paddingLeft: Spacing.m,
    justifyContent: 'center',
  },
  horizontalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: 4,
  },
  horizontalName: {
    flex: 1,
    fontSize: 17,
  },
  horizontalDivisionBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.s,
    paddingVertical: 4,
    borderRadius: BorderRadius.medium,
    marginBottom: 6,
    minHeight: 22,
    maxWidth: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  horizontalDivisionText: {
    fontSize: 9,
    letterSpacing: 0.1,
    lineHeight: 12,
    textAlign: 'center',
  },
  horizontalLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xxs,
    marginBottom: Spacing.xs,
  },
  horizontalFavoriteButton: {
    position: 'absolute',
    top: Spacing.m,
    right: Spacing.m,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
});
