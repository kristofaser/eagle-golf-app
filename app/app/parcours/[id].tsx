import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Text,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { useLocalSearchParams, Stack } from 'expo-router';
import Animated, {
  FadeInDown,
  useSharedValue,
  useAnimatedStyle,
  interpolate,
  useAnimatedScrollHandler,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { golfCourseService, GolfCourseWithAvailabilities } from '@/services/golf-course.service';
import { bookingService, AvailabilityWithDetails } from '@/services/booking.service';
import { Colors, Spacing } from '@/constants/theme';

// Constantes pour l'animation du header
const HEADER_HEIGHT = 60;
const SAFE_AREA_TOP = 40;
const IMAGE_HEIGHT = 300;
const HEADER_TRANSITION_START = 150;
const HEADER_TRANSITION_END = 250;

// Image par défaut si pas d'image
const DEFAULT_COURSE_IMAGE =
  'https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=400&h=300&fit=crop&crop=center';

export default function ParcoursScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const parcoursId = Array.isArray(id) ? id[0] : id;

  // États pour les données
  const [golfCourse, setGolfCourse] = useState<GolfCourseWithAvailabilities | null>(null);
  const [availabilities, setAvailabilities] = useState<AvailabilityWithDetails[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Charger les données du parcours
  useEffect(() => {
    if (parcoursId) {
      loadCourseData();
    }
  }, [parcoursId]);

  const loadCourseData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Charger le parcours
      const { data: course, error: courseError } = await golfCourseService.getGolfCourse(
        parcoursId!
      );

      if (courseError || !course) {
        throw new Error('Parcours non trouvé');
      }

      setGolfCourse(course);

      // Charger les statistiques du parcours
      const { data: statsData } = await golfCourseService.getCourseStats(parcoursId!);
      if (statsData) {
        setStats(statsData);
      }

      // Charger les disponibilités des pros pour ce parcours aujourd'hui
      const today = new Date().toISOString().split('T')[0];
      const { data: availData } = await bookingService.getProAvailabilities({
        golfCourseId: parcoursId!,
        date: today,
        hasSlots: true,
      });

      if (availData) {
        setAvailabilities(availData);
      }
    } catch (err) {
      console.error('Erreur chargement parcours:', err);
      setError('Impossible de charger le parcours');
    } finally {
      setLoading(false);
    }
  };

  // Fonction pour voir les pros disponibles
  const handleViewPros = () => {
    router.push({
      pathname: '/search',
      params: { courseId: parcoursId, mode: 'by-course' },
    });
  };

  // Valeur partagée pour le scroll
  const scrollY = useSharedValue(0);

  // Handler pour le scroll
  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      'worklet';
      scrollY.value = event.contentOffset.y;
    },
  });

  // Styles animés pour le header
  const animatedHeaderStyle = useAnimatedStyle(() => {
    'worklet';
    const scrollValue = scrollY.value;
    const scrollProgress = interpolate(
      scrollValue,
      [HEADER_TRANSITION_START, HEADER_TRANSITION_END],
      [0, 1],
      'clamp'
    );

    return {
      backgroundColor: `rgba(255, 255, 255, ${scrollProgress})`,
      borderBottomWidth: scrollProgress,
      borderBottomColor: Colors.ui.inputBorder,
    };
  });

  // Styles animés pour le contenu du header (titre et icônes noires)
  const animatedHeaderContentStyle = useAnimatedStyle(() => {
    'worklet';
    const scrollValue = scrollY.value;
    const opacity = interpolate(
      scrollValue,
      [HEADER_TRANSITION_START, HEADER_TRANSITION_END],
      [0, 1],
      'clamp'
    );

    return {
      opacity: opacity,
    };
  });

  // Styles animés pour les icônes blanches (visibles quand pas scrollé)
  const animatedHeaderIconsStyle = useAnimatedStyle(() => {
    'worklet';
    const scrollValue = scrollY.value;
    const opacity = interpolate(
      scrollValue,
      [HEADER_TRANSITION_START, HEADER_TRANSITION_END],
      [1, 0],
      'clamp'
    );

    return {
      opacity: opacity,
    };
  });

  // Style animé pour l'image avec effet parallaxe
  const parallaxImageStyle = useAnimatedStyle(() => {
    'worklet';
    const scrollValue = scrollY.value;
    const translateY = interpolate(
      scrollValue,
      [-IMAGE_HEIGHT, 0, IMAGE_HEIGHT],
      [-IMAGE_HEIGHT / 2, 0, IMAGE_HEIGHT * 0.75]
    );
    const scale = interpolate(scrollValue, [-IMAGE_HEIGHT, 0, IMAGE_HEIGHT], [2, 1, 1]);

    return {
      transform: [{ translateY }, { scale }],
    };
  });

  // Afficher un loader pendant le chargement
  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color={Colors.primary.accent} />
        <Text style={styles.loadingText}>Chargement du parcours...</Text>
      </View>
    );
  }

  // Afficher une erreur si nécessaire
  if (error || !golfCourse) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Text style={styles.errorText}>{error || 'Parcours non trouvé'}</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backButtonText}>Retour</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />
      <View style={styles.container}>
        <Animated.ScrollView
          style={styles.scrollView}
          onScroll={scrollHandler}
          scrollEventThrottle={16}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.imageContainer}>
            <Animated.Image
              source={{ uri: golfCourse.images?.[0] || DEFAULT_COURSE_IMAGE }}
              style={[styles.heroImage, parallaxImageStyle]}
              sharedTransitionTag={`image-${parcoursId}`}
              resizeMode="cover"
            />
          </View>

          <View style={styles.content}>
            <Animated.Text style={styles.title} sharedTransitionTag={`title-${parcoursId}`}>
              {golfCourse.name}
            </Animated.Text>

            {/* Bouton pour voir les pros disponibles */}
            {availabilities.length > 0 && (
              <TouchableOpacity style={styles.prosButton} onPress={handleViewPros}>
                <Ionicons name="people" size={20} color="white" />
                <Text style={styles.prosButtonText}>
                  {availabilities.length} pros disponibles aujourd'hui
                </Text>
              </TouchableOpacity>
            )}

            <Animated.View entering={FadeInDown.delay(300)} style={styles.section}>
              <Animated.Text style={styles.sectionTitle}>Description</Animated.Text>
              <Animated.Text style={styles.description}>
                {golfCourse.description ||
                  "Un parcours d'exception offrant une expérience de golf unique dans un cadre naturel préservé."}
              </Animated.Text>
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(500)} style={styles.section}>
              <Animated.Text style={styles.sectionTitle}>Informations pratiques</Animated.Text>
              <Animated.Text style={styles.info}>
                • Nombre de trous : {golfCourse.hole_count || 18}
                {golfCourse.par && `\n• Par : ${golfCourse.par}`}
                {'\n'}• Green Fee (semaine) :{' '}
                {golfCourse.green_fee_weekday
                  ? `${golfCourse.green_fee_weekday / 100}€`
                  : 'Sur demande'}
                {'\n'}• Green Fee (weekend) :{' '}
                {golfCourse.green_fee_weekend
                  ? `${golfCourse.green_fee_weekend / 100}€`
                  : 'Sur demande'}
                {golfCourse.booking_required && '\n• Réservation obligatoire'}
              </Animated.Text>
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(700)} style={styles.section}>
              <Animated.Text style={styles.sectionTitle}>Coordonnées</Animated.Text>
              <Animated.Text style={styles.info}>
                • Adresse : {golfCourse.address}
                {'\n'}• Ville : {golfCourse.city} {golfCourse.postal_code}
                {golfCourse.phone && `\n• Téléphone : ${golfCourse.phone}`}
                {golfCourse.email && `\n• Email : ${golfCourse.email}`}
                {golfCourse.website && `\n• Site web : ${golfCourse.website}`}
              </Animated.Text>
            </Animated.View>

            {golfCourse.amenities && golfCourse.amenities.length > 0 && (
              <Animated.View entering={FadeInDown.delay(900)} style={styles.section}>
                <Animated.Text style={styles.sectionTitle}>Équipements</Animated.Text>
                <View style={styles.amenitiesContainer}>
                  {golfCourse.amenities.map((amenity, index) => (
                    <View key={index} style={styles.amenityItem}>
                      <Ionicons
                        name={getAmenityIcon(amenity)}
                        size={20}
                        color={Colors.primary.accent}
                      />
                      <Text style={styles.amenityText}>{getAmenityLabel(amenity)}</Text>
                    </View>
                  ))}
                </View>
              </Animated.View>
            )}

            {stats && (
              <Animated.View entering={FadeInDown.delay(1100)} style={styles.section}>
                <Animated.Text style={styles.sectionTitle}>Statistiques</Animated.Text>
                <Animated.Text style={styles.info}>
                  • Parties jouées : {stats.totalBookings}
                  {'\n'}• Pros actifs : {stats.activePros}
                  {stats.averageRating > 0 &&
                    `\n• Note moyenne : ${stats.averageRating}/5 (${stats.totalReviews} avis)`}
                </Animated.Text>
              </Animated.View>
            )}
          </View>
        </Animated.ScrollView>

        {/* Header animé qui apparaît lors du scroll */}
        <Animated.View style={[styles.header, animatedHeaderStyle]}>
          {/* Contenu du header avec fond blanc (visible quand scrollé) */}
          <Animated.View style={[styles.headerContent, animatedHeaderContentStyle]}>
            <Ionicons name="arrow-back" size={28} color="black" onPress={() => router.back()} />
            <Text style={styles.headerTitle}>{golfCourse.name}</Text>
            <Ionicons name="heart-outline" size={28} color="black" />
          </Animated.View>

          {/* Icônes blanches (visibles quand pas scrollé) */}
          <Animated.View
            style={[styles.headerContent, styles.headerIcons, animatedHeaderIconsStyle]}
          >
            <Ionicons name="arrow-back" size={28} color="white" onPress={() => router.back()} />
            <Ionicons name="heart-outline" size={28} color="white" />
          </Animated.View>
        </Animated.View>
      </View>
    </>
  );
}

// Fonctions utilitaires pour les équipements
function getAmenityIcon(amenity: string): any {
  const icons: { [key: string]: any } = {
    practice: 'golf',
    restaurant: 'restaurant',
    proshop: 'storefront',
    cart: 'car',
    academy: 'school',
    parking: 'car',
    locker: 'lock-closed',
    shower: 'water',
  };
  return icons[amenity] || 'checkmark-circle';
}

function getAmenityLabel(amenity: string): string {
  const labels: { [key: string]: string } = {
    practice: 'Practice',
    restaurant: 'Restaurant',
    proshop: 'Pro Shop',
    cart: 'Voiturettes',
    academy: 'Académie',
    parking: 'Parking',
    locker: 'Vestiaires',
    shower: 'Douches',
  };
  return labels[amenity] || amenity;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.neutral.white,
  },
  scrollView: {
    flex: 1,
  },
  imageContainer: {
    width: '100%',
    height: IMAGE_HEIGHT,
    overflow: 'hidden',
  },
  heroImage: {
    width: '100%',
    height: IMAGE_HEIGHT,
    backgroundColor: Colors.ui.veryLightGray,
  },
  content: {
    padding: 20,
    backgroundColor: Colors.neutral.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    marginTop: -20,
    minHeight: 600,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.neutral.charcoal,
    marginBottom: 20,
  },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.neutral.charcoal,
    marginBottom: 10,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    color: Colors.ui.secondaryText,
  },
  info: {
    fontSize: 16,
    lineHeight: 22,
    color: Colors.ui.secondaryText,
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: HEADER_HEIGHT + SAFE_AREA_TOP,
    paddingTop: SAFE_AREA_TOP,
    zIndex: 10,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    height: HEADER_HEIGHT,
  },
  headerIcons: {
    position: 'absolute',
    top: SAFE_AREA_TOP,
    left: 0,
    right: 0,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.neutral.dark,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: Spacing.m,
    fontSize: 16,
    color: Colors.neutral.gray,
  },
  errorText: {
    fontSize: 16,
    color: Colors.semantic.error,
    textAlign: 'center',
    marginHorizontal: Spacing.xl,
  },
  backButton: {
    marginTop: Spacing.l,
    paddingVertical: Spacing.s,
    paddingHorizontal: Spacing.xl,
    backgroundColor: Colors.primary.accent,
    borderRadius: 8,
  },
  backButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  prosButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary.accent,
    paddingVertical: Spacing.m,
    paddingHorizontal: Spacing.l,
    borderRadius: 12,
    marginBottom: Spacing.l,
  },
  prosButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: Spacing.s,
  },
  amenitiesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.m,
  },
  amenityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.ui.extraLightGray,
    paddingVertical: Spacing.s,
    paddingHorizontal: Spacing.m,
    borderRadius: 20,
  },
  amenityText: {
    fontSize: 14,
    color: Colors.ui.secondaryText,
    marginLeft: Spacing.xs,
  },
});
