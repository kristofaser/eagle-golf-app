/**
 * ParcoursCard - Carte de parcours de golf avec favoris
 *
 * Composant molecule pour afficher les informations d'un parcours de golf
 * avec possibilité d'ajouter/retirer des favoris.
 */
import React, { useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Pressable } from 'react-native';
import { Image } from 'expo-image';
import { Colors, BorderRadius, Spacing, Typography } from '@/constants/theme';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { FavouriteIcon, LocationPin01Icon, GolfHoleIcon } from '@hugeicons/core-free-icons';
import { useParcoursFavorite } from '@/hooks/useParcoursFavorite';

export interface ParcoursData {
  id: string;
  name: string;
  address?: {
    city?: string;
    department?: string;
    postcode?: string;
  };
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  holes_count?: number;
  course_type?: string;
  images?: string[];
  distance?: number; // Distance depuis la position utilisateur
}

interface ParcoursCardProps {
  /**
   * Données du parcours de golf
   */
  data: ParcoursData;

  /**
   * Callback lors du clic sur la carte
   */
  onPress: (data: ParcoursData) => void;

  /**
   * Afficher la distance depuis la position utilisateur
   * @default false
   */
  showDistance?: boolean;

  /**
   * Style personnalisé de la carte
   */
  style?: any;

  /**
   * Taille de la carte
   * @default 'medium'
   */
  size?: 'small' | 'medium' | 'large';
}

// Images par défaut pour les parcours
const defaultCourseImages = [
  'https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=400&h=300&fit=crop&crop=center',
  'https://images.unsplash.com/photo-1593111774240-d529f12cf4bb?w=400&h=300&fit=crop&crop=center',
  'https://images.unsplash.com/photo-1540979388789-6cee28a1cdc9?w=400&h=300&fit=crop&crop=center',
];

// Blurhash pour les images de parcours (vert/nature)
const COURSE_BLURHASH = 'L9F5?I00~W?F00-;IURj_Nt7M{t7';

export const ParcoursCard: React.FC<ParcoursCardProps> = ({
  data,
  onPress,
  showDistance = false,
  style,
  size = 'medium',
}) => {
  const { isFavorite, toggleFavorite, isToggling } = useParcoursFavorite(data.id);

  const handlePress = useCallback(() => {
    onPress(data);
  }, [data, onPress]);

  const handleFavoritePress = useCallback(
    (e: any) => {
      e.stopPropagation();
      if (!isToggling) {
        toggleFavorite();
      }
    },
    [toggleFavorite, isToggling]
  );

  // Obtenir l'image du parcours
  const courseImage =
    data.images?.[0] || defaultCourseImages[Math.floor(Math.random() * defaultCourseImages.length)];

  // Formatage de la distance
  const formatDistance = (distance?: number) => {
    if (!distance) return null;
    return distance < 1000 ? `${Math.round(distance)}m` : `${(distance / 1000).toFixed(1)}km`;
  };

  // Styles conditionnels selon la taille
  const cardStyles = [styles.card, styles[`card_${size}`], style];

  const imageStyles = [styles.image, styles[`image_${size}`]];

  return (
    <Pressable style={cardStyles} onPress={handlePress}>
      {/* Image du parcours */}
      <View style={styles.imageContainer}>
        <Image
          source={{
            uri: courseImage,
            cacheKey: `course-${data.id}`,
          }}
          style={imageStyles}
          contentFit="cover"
          placeholder={COURSE_BLURHASH}
          placeholderContentFit="cover"
          transition={250}
          cachePolicy="memory-disk"
          priority={size === 'large' ? 'high' : 'normal'}
        />

        {/* Bouton favori en overlay */}
        <TouchableOpacity
          style={styles.favoriteButton}
          onPress={handleFavoritePress}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <HugeiconsIcon
            icon={FavouriteIcon}
            size={24}
            color={isFavorite ? Colors.status.error : Colors.neutral.ball}
            style={isFavorite ? undefined : styles.favoriteIconOutline}
          />
        </TouchableOpacity>

        {/* Badge nombre de trous */}
        {data.holes_count && (
          <View style={styles.holesBadge}>
            <HugeiconsIcon icon={GolfHoleIcon} size={12} color={Colors.neutral.ball} />
            <Text style={styles.holesBadgeText}>{data.holes_count}</Text>
          </View>
        )}
      </View>

      {/* Informations du parcours */}
      <View style={styles.content}>
        <Text style={styles.name} numberOfLines={2}>
          {data.name}
        </Text>

        {/* Localisation */}
        {data.address && (
          <View style={styles.locationContainer}>
            <HugeiconsIcon icon={LocationPin01Icon} size={14} color={Colors.neutral.course} />
            <Text style={styles.location} numberOfLines={1}>
              {data.address.city}
              {data.address.department && `, ${data.address.department}`}
            </Text>
          </View>
        )}

        {/* Type de parcours */}
        {data.course_type && <Text style={styles.courseType}>{data.course_type}</Text>}

        {/* Distance si disponible */}
        {showDistance && data.distance && (
          <Text style={styles.distance}>{formatDistance(data.distance)}</Text>
        )}
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  // Carte de base
  card: {
    backgroundColor: Colors.neutral.ball,
    borderRadius: BorderRadius.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },

  // Tailles de carte
  card_small: {
    width: 150,
  },
  card_medium: {
    width: '100%',
    marginBottom: Spacing.md,
  },
  card_large: {
    width: '100%',
    marginBottom: Spacing.lg,
  },

  // Container image
  imageContainer: {
    position: 'relative',
  },

  // Image
  image: {
    width: '100%',
    backgroundColor: Colors.neutral.mist,
  },
  image_small: {
    height: 100,
  },
  image_medium: {
    height: 140,
  },
  image_large: {
    height: 180,
  },

  // Bouton favori
  favoriteButton: {
    position: 'absolute',
    top: Spacing.sm,
    right: Spacing.sm,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 20,
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  favoriteIconOutline: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
  },

  // Badge nombre de trous
  holesBadge: {
    position: 'absolute',
    bottom: Spacing.sm,
    left: Spacing.sm,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    flexDirection: 'row',
    alignItems: 'center',
  },
  holesBadgeText: {
    fontSize: Typography.fontSize.caption,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.neutral.ball,
    marginLeft: 4,
  },

  // Contenu
  content: {
    padding: Spacing.md,
  },

  // Nom du parcours
  name: {
    fontSize: Typography.fontSize.h3,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.neutral.charcoal,
    fontFamily: Typography.fontFamily.primary,
    marginBottom: Spacing.xs,
    lineHeight: 20,
  },

  // Container localisation
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },

  // Localisation
  location: {
    fontSize: Typography.fontSize.body,
    color: Colors.neutral.course,
    fontFamily: Typography.fontFamily.primary,
    marginLeft: 4,
    flex: 1,
  },

  // Type de parcours
  courseType: {
    fontSize: Typography.fontSize.caption,
    color: Colors.primary.accent,
    fontFamily: Typography.fontFamily.primary,
    fontWeight: Typography.fontWeight.medium,
    textTransform: 'uppercase',
    marginBottom: Spacing.xs,
  },

  // Distance
  distance: {
    fontSize: Typography.fontSize.caption,
    color: Colors.neutral.course,
    fontFamily: Typography.fontFamily.primary,
    fontWeight: Typography.fontWeight.medium,
  },
});
