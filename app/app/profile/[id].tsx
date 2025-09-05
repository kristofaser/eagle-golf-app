import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Text,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  TextInput,
  Image,
} from 'react-native';
import { useLocalSearchParams, Stack } from 'expo-router';
import Animated, {
  FadeIn,
  useSharedValue,
  useAnimatedStyle,
  interpolate,
  useAnimatedScrollHandler,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { HugeiconsIcon } from '@hugeicons/react-native';
import {
  BombIcon,
  GolfBatIcon,
  Target02Icon,
  AiBrain01Icon,
  Clapping02Icon,
  GolfHoleIcon,
} from '@hugeicons/core-free-icons';
import { useRouter } from 'expo-router';
import { profileService, FullProfile } from '@/services/profile.service';
import { bookingService, AvailabilityWithDetails } from '@/services/booking.service';
import { golfCourseService, GolfCourse } from '@/services/golf-course.service';
import { proAvailabilityService } from '@/services/pro-availability.service';
import { useAuth } from '@/hooks/useAuth';
import { Colors, Spacing, Elevation, Typography, BorderRadius } from '@/constants/theme';
import { ProPricingManager } from '@/components/organisms/ProPricingManager';
import { useProProfile } from '@/hooks/useProProfile';
import { ProfileSkeleton } from '@/components/atoms/ProfileSkeleton';
import { useQuery } from '@tanstack/react-query';

// Image par défaut si pas d'avatar
const DEFAULT_PRO_IMAGE =
  'https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=400&h=300&fit=crop&crop=center';

// Constantes pour l'animation du header
const HEADER_HEIGHT = 60;
const SAFE_AREA_TOP = 40;
const IMAGE_HEIGHT = 300;
const HEADER_TRANSITION_START = 150;
const HEADER_TRANSITION_END = 250;

export default function ProfileScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const profileId = Array.isArray(id) ? id[0] : id;

  // Utiliser le hook optimisé avec cache
  const {
    profile,
    availabilities,
    pricing,
    isLoading,
    error: queryError,
    refetch,
  } = useProProfile(profileId || '', !!profileId);

  // Récupérer les paramètres de disponibilité du pro (incluant is_globally_available)
  const { data: proAvailabilitySettings } = useQuery({
    queryKey: ['proAvailability', profileId],
    queryFn: async () => {
      // La méthode getProAvailabilitySettings n'existe plus dans le nouveau système
      // TODO: Implémenter récupération des settings depuis pro-availability si nécessaire
      const settings = null;
      return settings;
    },
    enabled: !!profileId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // États locaux pour l'édition
  const [golfCourses, setGolfCourses] = useState<GolfCourse[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editedProfile, setEditedProfile] = useState<FullProfile | null>(null);
  const [numberOfPlayers, setNumberOfPlayers] = useState(1); // Par défaut 1 joueur

  // Vérifier si c'est mon profil
  const isMyProfile = user?.id === profileId;
  const isPro = profile?.user_type === 'pro';

  // Charger les parcours de golf
  useEffect(() => {
    if (profileId) {
      loadGolfCourses();
    }
  }, [profileId]);

  // Mettre à jour editedProfile quand le profil change
  useEffect(() => {
    if (profile) {
      setEditedProfile(profile);
    }
  }, [profile]);

  const loadGolfCourses = async () => {
    try {
      const { data } = await golfCourseService.listGolfCourses();
      if (data) {
        setGolfCourses(data);
      }
    } catch (err) {
      console.error('Erreur chargement parcours:', err);
    }
  };

  // Calculer le prix minimum parmi tous les tarifs (avec commission de 20%)
  const getMinPrice = (playersCount?: number) => {
    if (!pricing || pricing.length === 0) {
      // Fallback sur l'ancien prix si pas de pricing
      const basePrice = profile?.pro_profiles?.price_18_holes_1_player || 0;
      // Ajouter la commission de 20%
      return Math.round(basePrice * 1.2);
    }

    // Si un nombre de joueurs est spécifié, filtrer pour ce nombre
    if (playersCount) {
      const pricesForPlayers = pricing
        .filter((p) => p.price > 0 && p.players_count === playersCount)
        .map((p) => p.price);

      if (pricesForPlayers.length > 0) {
        const minPrice = Math.min(...pricesForPlayers);
        // Ajouter la commission de 20% et convertir en centimes
        return Math.round(minPrice * 1.2 * 100);
      }

      // Si pas de prix pour ce nombre de joueurs, prendre le minimum global
    }

    // Filtrer les prix valides (> 0) et prendre le minimum
    const validPrices = pricing.filter((p) => p.price > 0).map((p) => p.price);

    if (validPrices.length === 0) {
      return 0;
    }

    const minPrice = Math.min(...validPrices);
    // Ajouter la commission de 20% et convertir en centimes
    return Math.round(minPrice * 1.2 * 100);
  };

  // Fonction pour gérer la réservation
  const handleBooking = () => {
    const minPrice = getMinPrice(numberOfPlayers);

    if (!isAuthenticated) {
      Alert.alert(
        'Connexion requise',
        'Vous devez être connecté pour réserver une partie avec ce professionnel.',
        [
          { text: 'Annuler', style: 'cancel' },
          {
            text: 'Se connecter',
            onPress: () =>
              router.push({
                pathname: '/(auth)/register',
                params: { returnTo: `/profile/${profileId}` },
              }),
          },
        ]
      );
    } else {
      const proDetails = profile?.pro_profiles;
      router.push({
        pathname: '/book-pro/[proId]',
        params: {
          proId: profileId,
          proName: `${profile?.first_name} ${profile?.last_name}`,
          price: Math.round(minPrice / 100).toString(),
          players: numberOfPlayers.toString(),
        },
      });
    }
  };

  // Fonction pour sauvegarder le profil édité
  const handleSave = async () => {
    if (!editedProfile || !isMyProfile) return;

    try {
      const updateData: any = {
        profile: {
          first_name: editedProfile.first_name,
          last_name: editedProfile.last_name,
          phone: editedProfile.phone,
          city: editedProfile.city,
        },
      };

      if (profile?.user_type === 'amateur' && editedProfile.amateur_profiles) {
        updateData.amateurProfile = {
          handicap: editedProfile.amateur_profiles.handicap,
          club_affiliation: editedProfile.amateur_profiles.club_affiliation,
          golf_course_id: editedProfile.amateur_profiles.golf_course_id,
          license_number: editedProfile.amateur_profiles.license_number,
        };
      } else if (profile?.user_type === 'pro' && editedProfile.pro_profiles) {
        updateData.proProfile = {
          date_of_birth: editedProfile.pro_profiles.date_of_birth,
          siret: editedProfile.pro_profiles.siret,
          company_status: editedProfile.pro_profiles.company_status,
          division: editedProfile.pro_profiles.division,
          world_ranking: editedProfile.pro_profiles.world_ranking,
          skills: editedProfile.pro_profiles.skills,
          experience: editedProfile.pro_profiles.experience,
        };
      }

      const { error } = await profileService.updateProfile(profileId!, updateData);

      if (error) {
        Alert.alert('Erreur', 'Impossible de sauvegarder les modifications');
      } else {
        setProfile(editedProfile);
        setIsEditing(false);
        Alert.alert('Succès', 'Profil mis à jour');
      }
    } catch (err) {
      console.error('Erreur sauvegarde:', err);
      Alert.alert('Erreur', 'Une erreur est survenue');
    }
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

  // Styles animés pour le contenu du header
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

  // Styles animés pour les icônes blanches
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

    // Étirer l'image quand on tire vers le bas (pull-to-refresh)
    // Plus on tire, plus l'image s'agrandit pour rester collée au contenu
    const scale = interpolate(
      scrollValue,
      [-150, 0, IMAGE_HEIGHT],
      [1.5, 1, 1], // Scale up to 1.5x when pulling down
      'clamp'
    );

    // Déplacer l'image uniquement quand on scrolle vers le haut
    // Pas de translation lors du pull-to-refresh pour éviter de voir le bas
    const translateY = interpolate(
      scrollValue,
      [-100, 0, IMAGE_HEIGHT],
      [0, 0, -IMAGE_HEIGHT * 0.5], // Réduit le déplacement pour garder l'image plus proche
      'clamp'
    );

    return {
      transform: [{ scale }, { translateY }],
      // Point d'ancrage en haut pour que l'étirement se fasse vers le bas
      transformOrigin: 'top',
    };
  });

  // Style animé pour le contenu - Désactivé pour éviter le rebond
  const contentAnimatedStyle = useAnimatedStyle(() => {
    'worklet';
    // Animation désactivée pour éviter l'effet de rebond
    return {};
  });

  // Fonction pour afficher une barre de compétence
  const renderSkillBar = (label: string, value: number | null | undefined, icon?: any) => {
    // Les valeurs sont stockées sur une échelle de 0-100 dans la DB
    const skillValue = value || 0;
    const percentage = Math.min(100, Math.max(0, skillValue)); // Clamp entre 0 et 100

    return (
      <View style={styles.skillRow} key={label}>
        <View style={styles.skillLabelContainer}>
          <View style={styles.skillLabelWithIcon}>
            {icon && (
              <View style={styles.skillIconContainer}>
                <HugeiconsIcon
                  icon={icon}
                  size={18}
                  color={Colors.neutral.charcoal}
                  strokeWidth={1.5}
                />
              </View>
            )}
            <Text style={styles.skillLabel}>{label}</Text>
          </View>
        </View>
        <View style={styles.skillBarContainer}>
          <View style={styles.skillBarBackground}>
            <View
              style={[
                styles.skillBarFill,
                {
                  width: `${percentage}%`,
                  backgroundColor: Colors.primary.accent,
                },
              ]}
            />
          </View>
          <Text style={styles.skillValue}>{Math.round(percentage)}%</Text>
        </View>
      </View>
    );
  };

  // Fonction pour rendre le mode édition pour "Mon profil"
  const renderEditableField = (
    label: string,
    value: string | number | null | undefined,
    onChangeText: (text: string) => void,
    keyboardType: 'default' | 'numeric' | 'email-address' = 'default',
    editable: boolean = true
  ) => (
    <View style={styles.fieldContainer}>
      <Text style={styles.fieldLabel}>{label}</Text>
      {isEditing && editable ? (
        <TextInput
          style={styles.input}
          value={value?.toString() || ''}
          onChangeText={onChangeText}
          keyboardType={keyboardType}
          placeholder={`Entrez ${label.toLowerCase()}`}
        />
      ) : (
        <Text style={styles.fieldValue}>{value || 'Non renseigné'}</Text>
      )}
    </View>
  );

  // Afficher un skeleton loader pendant le chargement
  if (isLoading) {
    return <ProfileSkeleton />;
  }

  // Afficher une erreur si nécessaire
  if (queryError || !profile) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Text style={styles.errorText}>{queryError?.message || 'Profil non trouvé'}</Text>
        <TouchableOpacity onPress={() => refetch()} style={styles.backButton}>
          <Text style={styles.backButtonText}>Réessayer</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => router.back()}
          style={[styles.backButton, { marginTop: 10 }]}
        >
          <Text style={styles.backButtonText}>Retour</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const proDetails = profile.pro_profiles;
  const amateurDetails = profile.amateur_profiles;

  // Utiliser getMinPrice définie plus haut avec le nombre de joueurs sélectionné
  const minPrice = getMinPrice(numberOfPlayers);

  // Déterminer si le pro est disponible basé sur is_globally_available
  const isProAvailable = proAvailabilitySettings?.is_globally_available ?? false;

  // Si c'est un profil pro, afficher le beau design vitrine (peu importe qui le consulte)
  if (isPro) {
    return (
      <>
        <Stack.Screen
          options={{
            headerShown: false,
          }}
        />
        <View style={styles.container}>
          {/* Image fixée en position absolue */}
          <Animated.View style={[styles.imageContainer, parallaxImageStyle]} pointerEvents="none">
            <Animated.Image
              source={{ uri: profile.avatar_url || DEFAULT_PRO_IMAGE }}
              style={styles.heroImage}
              sharedTransitionTag={`image-${profileId}`}
              resizeMode="cover"
            />
          </Animated.View>

          <Animated.ScrollView
            style={styles.scrollView}
            onScroll={scrollHandler}
            scrollEventThrottle={16}
            showsVerticalScrollIndicator={false}
          >
            {/* Spacer pour le contenu scrollable */}
            <View style={{ height: IMAGE_HEIGHT }} />

            <Animated.View style={[styles.content, contentAnimatedStyle]}>
              {/* Ligne avec Nom et Disponibilité */}
              <View style={styles.headerRow}>
                <View style={styles.titleContainer}>
                  <Animated.Text style={styles.title} sharedTransitionTag={`title-${profileId}`}>
                    {profile.first_name} {profile.last_name}
                  </Animated.Text>

                  {/* Division et Ranking sur la même ligne */}
                  <Animated.View
                    entering={FadeIn.delay(250).duration(300)}
                    style={styles.badgesRow}
                  >
                    {proDetails?.division && (
                      <Text style={styles.divisionText}>{proDetails.division}</Text>
                    )}
                    {proDetails?.world_ranking && (
                      <Text style={styles.rankingText}>WR {proDetails.world_ranking}</Text>
                    )}
                  </Animated.View>
                </View>

                <Animated.View
                  style={styles.availabilityIndicator}
                  entering={FadeIn.delay(200).duration(300)}
                >
                  <View
                    style={[styles.availabilityDot, !isProAvailable && styles.unavailableDot]}
                  />
                  <Text
                    style={[styles.availabilityText, !isProAvailable && styles.unavailableText]}
                  >
                    {isProAvailable ? 'Disponible' : 'Indisponible'}
                  </Text>
                </Animated.View>
              </View>

              <Animated.View
                entering={FadeIn.delay(300).duration(300)}
                style={[styles.card, { backgroundColor: sectionColors.level.background }]}
              >
                <View style={styles.cardHeader}>
                  <Text style={styles.cardTitle}>Compétences</Text>
                </View>
                <View style={[styles.accentLine, { backgroundColor: Colors.primary.accent }]} />

                {/* Skills avec barres de progression */}
                <View style={styles.skillsContainer}>
                  {renderSkillBar('Driving', proDetails?.skill_driving, BombIcon)}
                  {renderSkillBar('Fers', proDetails?.skill_irons, GolfBatIcon)}
                  {renderSkillBar('Wedging', proDetails?.skill_wedging, Target02Icon)}
                  {renderSkillBar('Chipping', proDetails?.skill_chipping, Clapping02Icon)}
                  {renderSkillBar('Putting', proDetails?.skill_putting, GolfHoleIcon)}
                  {renderSkillBar('Mental', proDetails?.skill_mental, AiBrain01Icon)}
                </View>
              </Animated.View>

              {/* Expérience */}
              {proDetails?.experience &&
                Array.isArray(proDetails.experience) &&
                proDetails.experience.length > 0 && (
                  <Animated.View
                    entering={FadeIn.delay(350).duration(300)}
                    style={[styles.card, { backgroundColor: sectionColors.experience.background }]}
                  >
                    <View style={styles.cardHeader}>
                      <Text style={styles.cardTitle}>Expérience</Text>
                    </View>
                    <View style={[styles.accentLine, { backgroundColor: Colors.primary.accent }]} />
                    <View style={styles.experienceList}>
                      {proDetails.experience.map((exp: any, index: number) => (
                        <View key={index} style={styles.experienceItem}>
                          <View
                            style={[
                              styles.experienceBadge,
                              exp.type === 'winner' && styles.winnerBadge,
                              exp.type === 'top5' && styles.top5Badge,
                              exp.type === 'top10' && styles.top10Badge,
                              exp.type === 'top20' && styles.top20Badge,
                              exp.type === 'top30' && styles.top30Badge,
                            ]}
                          >
                            <Ionicons
                              name={exp.type === 'winner' ? 'trophy' : 'medal'}
                              size={14}
                              color="white"
                            />
                            <Text style={styles.experienceBadgeText}>
                              {exp.type === 'winner' ? 'Victoire' : exp.type.toUpperCase()}
                            </Text>
                          </View>
                          <Text style={styles.experienceDescription}>{exp.description}</Text>
                        </View>
                      ))}
                    </View>
                  </Animated.View>
                )}

              {/* Bloc Golfs */}
              <Animated.View
                entering={FadeIn.delay(400).duration(300)}
                style={[styles.card, { backgroundColor: '#FFFFFF' }]}
              >
                <View style={styles.cardHeader}>
                  <Text style={styles.cardTitle}>Golf</Text>
                </View>
                <View style={[styles.accentLine, { backgroundColor: Colors.primary.accent }]} />

                {/* Conteneur de la carte */}
                <View style={styles.mapContainer}>
                  <Text style={styles.mapPlaceholder}>Map à intégrer</Text>
                </View>
              </Animated.View>
            </Animated.View>
          </Animated.ScrollView>

          {/* Header animé */}
          <Animated.View style={[styles.header, animatedHeaderStyle]}>
            {/* Contenu noir (visible quand scrollé) */}
            <Animated.View style={[styles.headerContent, animatedHeaderContentStyle]}>
              <Ionicons name="arrow-back" size={28} color="black" onPress={() => router.back()} />
              <View style={styles.headerCenter}>
                <Text style={styles.headerTitle}>
                  {profile.first_name} {profile.last_name}
                </Text>
                <View style={styles.headerAvailability}>
                  <View
                    style={[styles.availabilityDotSmall, !isProAvailable && styles.unavailableDot]}
                  />
                  <Text style={styles.availabilityTextSmall}>
                    {isProAvailable ? 'Disponible' : 'Indisponible'}
                  </Text>
                </View>
              </View>
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

          {/* Bouton de réservation fixe */}
          <View style={styles.bookingButtonContainer}>
            <View style={styles.bookingPriceInfo}>
              {minPrice > 0 ? (
                <>
                  <Text style={styles.bookingPricePrefix}>À partir de</Text>
                  <Text style={styles.bookingPrice}>{Math.round(minPrice / 100)}€</Text>
                </>
              ) : (
                <Text style={styles.bookingPrice}>Sur devis</Text>
              )}
            </View>

            {/* Sélecteur de nombre de joueurs */}
            <View style={styles.playersSelector}>
              <TouchableOpacity
                style={[styles.playerButton, numberOfPlayers === 1 && styles.playerButtonDisabled]}
                onPress={() => setNumberOfPlayers(Math.max(1, numberOfPlayers - 1))}
                disabled={numberOfPlayers === 1}
                activeOpacity={0.7}
              >
                <Ionicons
                  name="remove"
                  size={20}
                  color={numberOfPlayers === 1 ? Colors.neutral.mist : Colors.neutral.charcoal}
                />
              </TouchableOpacity>

              <View style={styles.playersDisplay}>
                <Text style={styles.playersNumber}>{numberOfPlayers}</Text>
                <Text style={styles.playersLabel}>
                  {numberOfPlayers === 1 ? 'joueur' : 'joueurs'}
                </Text>
              </View>

              <TouchableOpacity
                style={[styles.playerButton, numberOfPlayers === 3 && styles.playerButtonDisabled]}
                onPress={() => setNumberOfPlayers(Math.min(3, numberOfPlayers + 1))}
                disabled={numberOfPlayers === 3}
                activeOpacity={0.7}
              >
                <Ionicons
                  name="add"
                  size={20}
                  color={numberOfPlayers === 3 ? Colors.neutral.mist : Colors.neutral.charcoal}
                />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.bookingButton}
              onPress={handleBooking}
              activeOpacity={0.7}
            >
              <Text style={styles.bookingButtonText}>
                {isAuthenticated ? 'Réserver' : 'Se connecter'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </>
    );
  }

  // Si c'est un profil amateur, ils n'ont pas de page vitrine publique
  // Seuls les pros ont une page vitrine accessible via /profile/[id]
  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Profil non disponible',
        }}
      />

      <View style={[styles.container, styles.centerContent]}>
        <Ionicons name="person-circle-outline" size={80} color={Colors.neutral.mist} />
        <Text style={styles.notAvailableTitle}>Profil non disponible</Text>
        <Text style={styles.notAvailableText}>
          Seuls les professionnels ont une page vitrine publique.
        </Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backButtonText}>Retour</Text>
        </TouchableOpacity>
      </View>
    </>
  );
}

// Couleurs pour les différentes sections
const sectionColors = {
  about: {
    background: '#E3F2FD',
    accent: '#1976D2',
    icon: '#2196F3',
  },
  level: {
    background: '#FFFFFF',
    accent: '#388E3C',
    icon: '#4CAF50',
  },
  experience: {
    background: '#FFFFFF',
    accent: '#F57C00',
    icon: '#FF9800',
  },
  pricing: {
    background: '#F3E5F5',
    accent: '#7B1FA2',
    icon: '#9C27B0',
  },
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.neutral.white,
  },
  scrollView: {
    flex: 1,
  },
  imageContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
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
    padding: 16,
    backgroundColor: Colors.neutral.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    marginTop: -20,
    minHeight: 600,
    paddingBottom: 100,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.neutral.charcoal,
  },
  availabilityIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  badgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 12,
  },
  rankingText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.neutral.course,
  },
  divisionText: {
    backgroundColor: Colors.neutral.charcoal,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 14,
    alignSelf: 'flex-start',
    fontSize: 14,
    fontWeight: '600',
    color: Colors.neutral.white,
  },
  availabilityDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.semantic.success,
    marginRight: 6,
  },
  unavailableDot: {
    backgroundColor: Colors.neutral.course,
  },
  availabilityText: {
    fontSize: 12,
    color: Colors.semantic.success,
    fontWeight: '500',
  },
  unavailableText: {
    color: Colors.neutral.course,
  },
  card: {
    marginBottom: 16,
    padding: 20,
    borderRadius: 16,
    backgroundColor: 'white',
    ...Elevation.small,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.neutral.charcoal,
    flex: 1,
  },
  accentLine: {
    height: 3,
    width: 40,
    borderRadius: 2,
    marginBottom: 16,
  },
  cardContent: {
    fontSize: 16,
    lineHeight: 24,
    color: Colors.neutral.iron,
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  infoText: {
    fontSize: 14,
    color: Colors.neutral.iron,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    ...Elevation.small,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.neutral.charcoal,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.neutral.course,
    textTransform: 'uppercase',
  },
  pillsContainer: {
    marginBottom: 16,
  },
  sectionSubtitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.neutral.charcoal,
    marginBottom: 12,
  },
  pillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  pill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  pillText: {
    fontSize: 14,
    fontWeight: '500',
  },
  pricingRow: {
    alignItems: 'center',
  },
  priceAmount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: Colors.neutral.charcoal,
    marginBottom: 4,
  },
  priceLabel: {
    fontSize: 16,
    color: Colors.neutral.iron,
  },
  availabilityList: {
    marginTop: 12,
  },
  availabilityItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.ui.inputBorder,
  },
  availabilityDate: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.neutral.charcoal,
    marginBottom: 4,
  },
  availabilityTime: {
    fontSize: 14,
    color: Colors.neutral.iron,
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: HEADER_HEIGHT + SAFE_AREA_TOP,
    paddingTop: SAFE_AREA_TOP,
    zIndex: 100,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    height: HEADER_HEIGHT,
  },
  headerIcons: {
    position: 'absolute',
    top: SAFE_AREA_TOP,
    left: 0,
    right: 0,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 16,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.neutral.charcoal,
  },
  headerAvailability: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  availabilityDotSmall: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.semantic.success,
    marginRight: 4,
  },
  availabilityTextSmall: {
    fontSize: 12,
    color: Colors.semantic.success,
  },
  bookingButtonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: Colors.ui.inputBorder,
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: 32,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...Elevation.medium,
  },
  bookingPriceInfo: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  bookingPricePrefix: {
    fontSize: 12,
    color: Colors.neutral.iron,
    marginBottom: 2,
  },
  bookingPrice: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.neutral.charcoal,
  },
  bookingPriceLabel: {
    fontSize: 14,
    color: Colors.neutral.iron,
  },
  bookingButton: {
    backgroundColor: Colors.primary.accent,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 8,
  },
  bookingButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  playersSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  playerButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.neutral.background,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.neutral.mist,
  },
  playerButtonDisabled: {
    opacity: 0.5,
  },
  playersDisplay: {
    alignItems: 'center',
    minWidth: 60,
  },
  playersNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.neutral.charcoal,
  },
  playersLabel: {
    fontSize: 11,
    color: Colors.neutral.iron,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: Colors.neutral.iron,
  },
  errorText: {
    fontSize: 16,
    color: Colors.semantic.error,
    textAlign: 'center',
    marginBottom: 20,
  },
  backButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: Colors.primary.accent,
    borderRadius: 8,
  },
  backButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  notAvailableTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: Colors.neutral.charcoal,
    marginTop: 20,
    marginBottom: 10,
  },
  notAvailableText: {
    fontSize: 16,
    color: Colors.neutral.iron,
    textAlign: 'center',
    paddingHorizontal: 40,
    marginBottom: 30,
  },

  // Styles pour les barres de compétences
  skillsContainer: {
    marginTop: 12,
  },
  skillRow: {
    marginBottom: 16,
  },
  skillLabelContainer: {
    marginBottom: 8,
  },
  skillLabelWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  skillIconContainer: {
    width: 28,
    alignItems: 'flex-start',
  },
  skillLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.neutral.charcoal,
  },
  skillBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  skillBarBackground: {
    flex: 1,
    height: 8,
    backgroundColor: Colors.neutral.mist,
    borderRadius: 4,
    overflow: 'hidden',
  },
  skillBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  skillValue: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.neutral.iron,
    minWidth: 45,
    textAlign: 'right',
  },

  // Styles pour l'expérience
  experienceList: {
    marginTop: 4,
  },
  experienceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  experienceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: Colors.neutral.iron,
    marginRight: 12,
  },
  winnerBadge: {
    backgroundColor: '#FFD700', // Or
  },
  top5Badge: {
    backgroundColor: '#FF6B6B', // Rouge clair
  },
  top10Badge: {
    backgroundColor: '#4ECDC4', // Turquoise
  },
  top20Badge: {
    backgroundColor: '#95E77E', // Vert clair
  },
  top30Badge: {
    backgroundColor: '#A8DADC', // Bleu clair
  },
  experienceBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'white',
    marginLeft: 4,
  },
  experienceDescription: {
    flex: 1,
    fontSize: 15,
    color: Colors.neutral.iron,
  },

  // Styles pour le bloc carte
  mapContainer: {
    height: 200,
    backgroundColor: Colors.neutral.background,
    borderRadius: BorderRadius.medium,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 4,
  },
  mapPlaceholder: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.neutral.charcoal,
    marginBottom: 8,
  },
  mapDescription: {
    fontSize: 14,
    color: Colors.neutral.course,
    textAlign: 'center',
    paddingHorizontal: 32,
  },

  // Styles pour le mode édition (Mon profil)
  editContentContainer: {
    paddingBottom: Spacing.xl * 2,
  },
  editHeader: {
    alignItems: 'center',
    padding: Spacing.xl,
    backgroundColor: Colors.neutral.ball,
  },
  editAvatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Colors.neutral.mist,
  },
  changePhotoButton: {
    marginTop: Spacing.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.primary.accent,
    borderRadius: BorderRadius.small,
  },
  changePhotoText: {
    color: Colors.neutral.ball,
    fontSize: Typography.fontSize.caption,
  },
  section: {
    backgroundColor: Colors.neutral.ball,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.h3,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.neutral.ink,
    marginBottom: Spacing.lg,
  },
  fieldContainer: {
    marginBottom: Spacing.md,
  },
  fieldLabel: {
    fontSize: Typography.fontSize.caption,
    color: Colors.neutral.course,
    marginBottom: Spacing.xs,
  },
  fieldValue: {
    fontSize: Typography.fontSize.body,
    color: Colors.neutral.ink,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.neutral.mist,
    borderRadius: BorderRadius.small,
    padding: Spacing.md,
    fontSize: Typography.fontSize.body,
    color: Colors.neutral.ink,
    backgroundColor: Colors.neutral.ball,
  },
  convertButton: {
    marginTop: Spacing.xl,
    backgroundColor: Colors.primary.accent,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.medium,
    alignItems: 'center',
  },
  convertButtonText: {
    color: Colors.neutral.ball,
    fontSize: Typography.fontSize.body,
    fontWeight: Typography.fontWeight.medium,
  },
  headerButton: {
    marginRight: Spacing.md,
  },
  headerButtonText: {
    color: Colors.primary.accent,
    fontSize: Typography.fontSize.body,
    fontWeight: Typography.fontWeight.medium,
  },
  cancelButton: {
    margin: Spacing.lg,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.medium,
    borderWidth: 1,
    borderColor: Colors.neutral.course,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: Colors.neutral.course,
    fontSize: Typography.fontSize.body,
  },
  // Styles pour le badge de disponibilité
  headerAvailability: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  availabilityDotSmall: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.semantic.success,
    marginRight: 6,
  },
  unavailableDot: {
    backgroundColor: Colors.neutral.course,
  },
  availabilityTextSmall: {
    fontSize: Typography.fontSize.caption,
    color: Colors.neutral.iron,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: Typography.fontSize.h4,
    fontWeight: Typography.fontWeight.semiBold,
    color: Colors.neutral.charcoal,
  },
});
