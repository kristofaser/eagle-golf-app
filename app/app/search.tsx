import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  TextInput,
  FlatList,
  Modal,
} from 'react-native';
import { useRouter, Stack, usePathname } from 'expo-router';
import { Text } from '@/components/atoms';
import { Colors, Spacing, BorderRadius, Typography } from '@/constants/theme';
import { ProCard } from '@/components/molecules/ProCard';
import { JoueurData } from '@/components/molecules/ContentCard';
import { Ionicons } from '@expo/vector-icons';
import { useSearch } from '@/hooks/useSearch';
import { useGeolocation } from '@/hooks/useGeolocation';
import { calculateDistance, formatDistance } from '@/utils/location';
import { GolfCourse } from '@/services/golf-course.service';
import { ProProfileWithDetails } from '@/services/profile.service';
import { proAvailabilityService } from '@/services/pro-availability.service';
import { CircleAvatar } from '@/components/atoms/CircleAvatar';
import { CourseAlertToggle } from '@/components/molecules/CourseAlertToggle';
import { DivisionBadge } from '@/components/atoms/DivisionBadge';
import { useAppStore } from '@/stores/useAppStore';
import { useProFavorite } from '@/hooks/useProProfile';

// Composant pour chaque pro dans la modal (nécessaire pour utiliser les hooks)
const ModalProItem = ({ item, onPress }: { item: any; onPress: (item: any) => void }) => {
  const router = useRouter();
  const pathname = usePathname();
  const { isFavorite, toggleFavorite } = useProFavorite(item.id, router, pathname);
  const worldRanking = item.pro_profiles?.world_ranking;

  return (
    <TouchableOpacity
      key={item.id}
      style={styles.modalProCard}
      onPress={() => onPress(item)}
      activeOpacity={0.7}
    >
      {/* Avatar */}
      <CircleAvatar
        avatarUrl={item.avatar_url}
        firstName={item.first_name}
        lastName={item.last_name}
        size={40}
        style={styles.modalProAvatar}
      />

      {/* Informations principales */}
      <View style={styles.modalProInfo}>
        <View style={styles.modalProMainInfo}>
          <Text
            variant="h4"
            color="charcoal"
            numberOfLines={1}
            style={styles.modalProName}
          >
            {item.first_name} {item.last_name}
          </Text>

          <View style={styles.modalProBadges}>
            <DivisionBadge
              division={item.pro_profiles?.division}
              size="small"
              style={styles.modalDivisionBadge}
            />

            {worldRanking && (
              <Text variant="caption" color="course" style={styles.modalWorldRanking}>
                RW: {worldRanking}
              </Text>
            )}
          </View>
        </View>
      </View>

      {/* Actions */}
      <View style={styles.modalProActions}>
        {/* Bouton Favoris */}
        <TouchableOpacity
          onPress={(e) => {
            e.stopPropagation();
            toggleFavorite();
          }}
          style={styles.modalFavoriteButton}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons
            name={isFavorite ? 'heart' : 'heart-outline'}
            size={20}
            color={isFavorite ? Colors.semantic.error.default : Colors.neutral.course}
          />
        </TouchableOpacity>

        {/* Flèche navigation */}
        <Ionicons name="chevron-forward" size={16} color={Colors.neutral.course} />
      </View>
    </TouchableOpacity>
  );
};

type SearchCategory = 'all' | 'pros' | 'courses';

interface CourseCardData extends GolfCourse {
  active_pros?: number;
}

interface TransformedProData extends JoueurData {
  original: ProProfileWithDetails;
}

export default function SearchScreen() {
  const router = useRouter();
  const pathname = usePathname();
  const inputRef = useRef<TextInput>(null);

  // Hook de recherche principal
  const {
    query,
    setQuery,
    category,
    setCategory,
    data: searchData,
    isLoading,
    prosCount,
    coursesCount,
    totalCount,
  } = useSearch({
    initialCategory: 'all',
    debounceMs: 300,
  });

  // Hook de géolocalisation
  const { location: userLocation } = useGeolocation();

  // Hook favoris - garder pour la compatibilité avec le code existant
  const { favoritePros } = useAppStore();

  // État pour la modal pros disponibles
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<CourseCardData | null>(null);
  const [availablePros, setAvailablePros] = useState<any[]>([]);
  const [loadingPros, setLoadingPros] = useState(false);

  // État pour stocker les pros de chaque parcours (pour les avatars dans les cards)
  const [coursesPros, setCoursesPros] = useState<Record<string, any[]>>({});

  // Fonctions utilitaires (déplacées avant leur utilisation)
  const calculateAge = useCallback((dateOfBirth: string): number => {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    return age;
  }, []);

  const calculateExperienceYears = useCallback((experience: any): number => {
    if (!experience || typeof experience !== 'object') return 5;

    // Si l'experience est un objet avec des années, calculer la moyenne
    const years = Object.values(experience).filter((val) => typeof val === 'number');
    if (years.length > 0) {
      return Math.round(years.reduce((sum, year) => sum + year, 0) / years.length);
    }

    // Estimation par défaut
    return 5;
  }, []);

  // Fonction pour charger les pros de tous les parcours (pour les avatars dans les cards)
  const loadProsForAllCourses = useCallback(async (courses: CourseCardData[]) => {
    const prosPromises = courses.map(async (course) => {
      try {
        const { data: pros, error } = await proAvailabilityService.getProsAvailableOnCourse(
          course.id
        );
        return {
          courseId: course.id,
          pros: error ? [] : pros || [],
        };
      } catch (error) {
        console.error('Erreur chargement pros pour parcours:', course.id, error);
        return {
          courseId: course.id,
          pros: [],
        };
      }
    });

    try {
      const results = await Promise.all(prosPromises);
      const newCoursesPros: Record<string, any[]> = {};
      results.forEach(({ courseId, pros }) => {
        newCoursesPros[courseId] = pros;
      });
      setCoursesPros(newCoursesPros);
    } catch (error) {
      console.error('Erreur chargement pros pour tous les parcours:', error);
    }
  }, []);

  // Transformation des données pour l'affichage
  const { prosResults, coursesResults } = React.useMemo(() => {
    if (!searchData) {
      return { prosResults: [], coursesResults: [] };
    }

    // Transformer les pros en JoueurData avec vraies données
    const transformedPros: TransformedProData[] = (searchData.pros || []).map((pro) => {
      const proProfile = pro.pro_profiles;

      // Calculer la moyenne des compétences pour un score global
      const skills = [
        proProfile?.skill_driving,
        proProfile?.skill_irons,
        proProfile?.skill_wedging,
        proProfile?.skill_chipping,
        proProfile?.skill_putting,
        proProfile?.skill_mental,
      ].filter(Boolean) as number[];

      const averageSkill =
        skills.length > 0 ? skills.reduce((sum, skill) => sum + skill, 0) / skills.length : 0;

      // Extraire les spécialités basées sur les scores les plus élevés
      const skillNames = ['driving', 'irons', 'wedging', 'chipping', 'putting', 'mental'];
      const skillScores = [
        proProfile?.skill_driving || 0,
        proProfile?.skill_irons || 0,
        proProfile?.skill_wedging || 0,
        proProfile?.skill_chipping || 0,
        proProfile?.skill_putting || 0,
        proProfile?.skill_mental || 0,
      ];

      const topSkills = skillNames
        .map((name, index) => ({ name, score: skillScores[index] }))
        .filter((skill) => skill.score >= 7)
        .sort((a, b) => b.score - a.score)
        .slice(0, 2)
        .map((skill) => skill.name);

      return {
        id: pro.id,
        title: `${pro.first_name} ${pro.last_name}`,
        imageUrl:
          pro.avatar_url ||
          'https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=400&h=300&fit=crop&crop=center',
        type: 'joueur' as const,
        age: proProfile?.date_of_birth ? calculateAge(proProfile.date_of_birth) : undefined,
        region: pro.city || 'Non spécifié',
        handicap: proProfile?.division ? `Division ${proProfile.division}` : 'Pro',
        scoreAverage: averageSkill > 0 ? Math.round(72 - (averageSkill - 5)) : undefined,
        specialite: topSkills.length > 0 ? topSkills.join(', ') : 'Polyvalent',
        styleJeu: proProfile?.experience
          ? Object.keys(proProfile.experience).join(', ')
          : 'Adaptatif',
        experience: calculateExperienceYears(proProfile?.experience),
        circuits:
          proProfile?.company_status === 'auto_entrepreneur'
            ? 'Indépendant'
            : proProfile?.company_status === 'micro_entreprise'
              ? 'Micro-entreprise'
              : 'Professionnel',
        meilleurResultat: proProfile?.world_ranking
          ? `Classement mondial: ${proProfile.world_ranking}`
          : 'Professionnel certifié',
        victoires: Math.floor(averageSkill / 2), // Estimation basée sur les compétences
        tarif: '120€', // TODO: récupérer depuis pro_pricing
        rating: Math.min(5, Math.max(3, averageSkill / 2)),
        isPremium: proProfile?.world_ranking ? proProfile.world_ranking <= 1000 : false,
        isAvailable: proProfile?.is_globally_available ?? true,
        original: pro,
      };
    });

    // Transformer les parcours avec vraies données
    const transformedCourses: CourseCardData[] = (searchData.golfCourses || []).map((course) => ({
      ...course,
      // Utiliser les vraies données de la base
      holes_count: course.holes_count || 18,
      par: course.par || 72,
      active_pros: 0, // TODO: implémenter un comptage réel via une query
    }));

    return {
      prosResults: transformedPros,
      coursesResults: transformedCourses,
    };
  }, [searchData, calculateAge, calculateExperienceYears]);

  // Focus automatique sur le champ de recherche
  React.useEffect(() => {
    const timer = setTimeout(() => {
      inputRef.current?.focus();
    }, 300);
    return () => clearTimeout(timer);
  }, []);

  // Charger les pros pour tous les parcours quand les résultats changent
  React.useEffect(() => {
    if (coursesResults.length > 0) {
      loadProsForAllCourses(coursesResults);
    }
  }, [coursesResults, loadProsForAllCourses]);

  // Gestionnaire de changement de texte
  const handleTextChange = useCallback(
    (text: string) => {
      const safeText = text || '';
      setQuery(safeText);
    },
    [setQuery]
  );

  // Gestionnaire de sélection de catégorie
  const handleCategoryChange = useCallback(
    (newCategory: SearchCategory) => {
      setCategory(newCategory === 'parcours' ? 'courses' : newCategory);
    },
    [setCategory]
  );

  // Fonction pour charger les pros disponibles sur un parcours (pour la modal)
  const loadProsForCourse = useCallback(async (course: CourseCardData) => {
    setLoadingPros(true);
    try {
      const { data: pros, error } = await proAvailabilityService.getProsAvailableOnCourse(
        course.id
      );
      if (error) {
        console.error('Erreur chargement pros:', error);
        setAvailablePros([]);
      } else {
        setAvailablePros(pros || []);
      }
    } catch (error) {
      console.error('Erreur chargement pros:', error);
      setAvailablePros([]);
    } finally {
      setLoadingPros(false);
    }
  }, []);

  // Handlers de navigation
  const handleProPress = useCallback(
    (pro: TransformedProData) => {
      router.push(`/profile/${pro.id}`);
    },
    [router]
  );

  const handleCoursePress = useCallback(
    async (course: CourseCardData) => {
      setSelectedCourse(course);
      setIsModalVisible(true);
      await loadProsForCourse(course);
    },
    [loadProsForCourse]
  );

  const handleModalProPress = useCallback(
    (pro: any) => {
      setIsModalVisible(false);
      router.push(`/profile/${pro.id}`);
    },
    [router]
  );

  // Render des résultats
  const renderProResult = useCallback(
    (pro: TransformedProData) => (
      <ProCard
        key={pro.id}
        data={pro}
        onPress={() => handleProPress(pro)}
        onCardPress={() => handleProPress(pro)}
        isHidden={false}
      />
    ),
    [handleProPress]
  );

  const renderCourseResult = useCallback(
    (course: CourseCardData, index: number) => {
      // Calculer la distance réelle
      const distance =
        userLocation && course.latitude && course.longitude
          ? formatDistance(
              calculateDistance(
                userLocation.latitude,
                userLocation.longitude,
                parseFloat(course.latitude.toString()),
                parseFloat(course.longitude.toString())
              )
            )
          : '-- km';

      // Récupérer les pros disponibles pour ce parcours
      const coursePros = coursesPros[course.id] || [];

      // Construire le nom avec département
      const nameWithDepartment = course.department
        ? `${course.name} - ${course.department}`
        : course.name;

      return (
        <TouchableOpacity
          key={course.id}
          style={styles.courseCard}
          onPress={() => handleCoursePress(course)}
          activeOpacity={0.7}
        >
          <View style={styles.courseHeader}>
            <Text variant="body" color="charcoal" numberOfLines={1} style={styles.courseName}>
              {nameWithDepartment}
            </Text>
            <Text variant="caption" color="accent" style={styles.courseDistance}>
              {distance}
            </Text>
          </View>

          {/* Section des avatars des pros */}
          <View style={styles.prosSection}>
            {coursePros.length > 0 ? (
              <View style={styles.prosAvatars}>
                {coursePros.slice(0, 4).map((pro, idx) => (
                  <CircleAvatar
                    key={pro.id}
                    avatarUrl={pro.avatar_url}
                    firstName={pro.first_name}
                    lastName={pro.last_name}
                    size={36}
                    style={[
                      styles.proAvatar,
                      idx > 0 && { marginLeft: -10 }, // Superposition légère ajustée
                    ]}
                    borderWidth={2}
                    borderColor={Colors.neutral.white}
                  />
                ))}
                {coursePros.length > 4 && (
                  <View style={[styles.moreProsBadge, { marginLeft: -10 }]}>
                    <Text style={styles.moreProsBadgeText}>+{coursePros.length - 4}</Text>
                  </View>
                )}
              </View>
            ) : (
              <View style={styles.noProsContainer}>
                <Text variant="caption" color="course" style={styles.noProsText}>
                  Aucun pro disponible
                </Text>
                <CourseAlertToggle
                  golfCourseId={course.id}
                  courseName={course.name}
                  compact={true}
                  style={styles.compactAlertToggle}
                />
              </View>
            )}
          </View>
        </TouchableOpacity>
      );
    },
    [handleCoursePress, userLocation, coursesPros]
  );

  const hasResults = prosResults.length > 0 || coursesResults.length > 0;
  const showEmptyState = query.length >= 2 && !isLoading && !hasResults;

  // Dimensions pour optimisation FlatList
  const CARD_WIDTH = 280;
  const CARD_SPACING = Spacing.m;

  const getItemLayout = useCallback(
    (data: any, index: number) => ({
      length: CARD_WIDTH + CARD_SPACING,
      offset: (CARD_WIDTH + CARD_SPACING) * index,
      index,
    }),
    []
  );

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Recherche',
          headerShown: true,
          headerBackVisible: false,
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} style={{ marginLeft: 16, padding: 8 }}>
              <Ionicons name="arrow-back" size={24} color={Colors.neutral.charcoal} />
            </TouchableOpacity>
          ),
          headerStyle: {
            backgroundColor: Colors.neutral.white,
          },
          headerTitleStyle: {
            color: Colors.neutral.charcoal,
            fontSize: 18,
            fontWeight: '600',
          },
          headerShadowVisible: false,
        }}
      />
      <SafeAreaView style={styles.container}>
        {/* Header avec barre de recherche */}
        <View style={styles.searchHeader}>
          <View style={styles.searchInputContainer}>
            <Ionicons
              name="search"
              size={20}
              color={Colors.neutral.course}
              style={styles.searchIcon}
            />
            <TextInput
              ref={inputRef}
              value={query}
              onChangeText={handleTextChange}
              placeholder="Rechercher des pros ou des parcours..."
              placeholderTextColor={Colors.neutral.course}
              style={styles.searchInput}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="search"
              enablesReturnKeyAutomatically
              editable={true}
              keyboardType="default"
            />
            {query.length > 0 && (
              <TouchableOpacity onPress={() => setQuery('')} style={styles.clearButton}>
                <Ionicons name="close-circle" size={20} color={Colors.neutral.course} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Filtres de catégorie */}
        <View style={styles.categoryContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <TouchableOpacity
              style={[styles.categoryButton, category === 'all' && styles.categoryButtonActive]}
              onPress={() => handleCategoryChange('all')}
            >
              <Text variant="body" color={category === 'all' ? 'white' : 'charcoal'}>
                Tous
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.categoryButton, category === 'pros' && styles.categoryButtonActive]}
              onPress={() => handleCategoryChange('pros')}
            >
              <Text variant="body" color={category === 'pros' ? 'white' : 'charcoal'}>
                Pros
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.categoryButton, category === 'courses' && styles.categoryButtonActive]}
              onPress={() => handleCategoryChange('parcours')}
            >
              <Text variant="body" color={category === 'courses' ? 'white' : 'charcoal'}>
                Parcours
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

        {/* Résultats */}
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.primary.accent} />
            <Text variant="caption" color="course" style={{ marginTop: Spacing.s }}>
              Recherche en cours...
            </Text>
          </View>
        ) : query.length < 2 ? (
          <View style={styles.emptyState}>
            <Ionicons name="search" size={48} color={Colors.neutral.mist} />
            <Text variant="body" color="course" style={styles.emptyStateText}>
              Tapez au moins 2 caractères pour lancer la recherche
            </Text>
          </View>
        ) : showEmptyState ? (
          <View style={styles.emptyState}>
            <Ionicons name="search-outline" size={48} color={Colors.neutral.mist} />
            <Text variant="h3" color="course">
              Aucun résultat
            </Text>
            <Text variant="body" color="course" style={styles.emptyStateSubtext}>
              Essayez avec d'autres mots-clés
            </Text>
          </View>
        ) : (
          <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
            <View style={styles.resultsContainer}>
              {/* Résultats des pros */}
              {prosResults.length > 0 && (category === 'all' || category === 'pros') && (
                <View style={styles.section}>
                  <Text variant="h3" color="charcoal" style={styles.sectionTitle}>
                    Professionnels ({prosCount})
                  </Text>
                  <FlatList
                    data={prosResults}
                    renderItem={({ item }) => renderProResult(item)}
                    keyExtractor={(item) => item.id}
                    horizontal={true}
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.horizontalScroll}
                    getItemLayout={getItemLayout}
                    windowSize={5}
                    initialNumToRender={3}
                    maxToRenderPerBatch={2}
                    removeClippedSubviews={true}
                    snapToInterval={CARD_WIDTH + CARD_SPACING}
                    snapToAlignment="start"
                    decelerationRate="fast"
                  />
                </View>
              )}

              {/* Résultats des parcours */}
              {coursesResults.length > 0 && (category === 'all' || category === 'courses') && (
                <View style={styles.section}>
                  <Text variant="h3" color="charcoal" style={styles.sectionTitle}>
                    Parcours ({coursesCount})
                  </Text>
                  <FlatList
                    data={coursesResults}
                    renderItem={({ item, index }) => renderCourseResult(item, index)}
                    keyExtractor={(item) => item.id}
                    scrollEnabled={false}
                    initialNumToRender={5}
                    maxToRenderPerBatch={3}
                    removeClippedSubviews={true}
                  />
                </View>
              )}
            </View>
          </ScrollView>
        )}
      </SafeAreaView>

      {/* Modal pros disponibles */}
      <Modal
        visible={isModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setIsModalVisible(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          {/* Header de la modal */}
          <View style={styles.modalHeader}>
            <View style={styles.modalTitleContainer}>
              <Text variant="h3" color="charcoal" style={styles.modalTitle}>
                {selectedCourse?.name || 'Pros disponibles'}
              </Text>
              {selectedCourse &&
                userLocation &&
                selectedCourse.latitude &&
                selectedCourse.longitude && (
                  <View style={styles.modalDistanceBadge}>
                    <Text style={styles.modalDistanceText}>
                      {formatDistance(
                        calculateDistance(
                          userLocation.latitude,
                          userLocation.longitude,
                          parseFloat(selectedCourse.latitude.toString()),
                          parseFloat(selectedCourse.longitude.toString())
                        )
                      )}
                    </Text>
                  </View>
                )}
            </View>
            <TouchableOpacity onPress={() => setIsModalVisible(false)} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={Colors.neutral.charcoal} />
            </TouchableOpacity>
          </View>

          {/* Contenu de la modal */}
          {loadingPros ? (
            <View style={styles.modalLoadingContainer}>
              <ActivityIndicator size="large" color={Colors.primary.accent} />
              <Text variant="caption" color="course" style={{ marginTop: Spacing.s }}>
                Chargement des pros...
              </Text>
            </View>
          ) : availablePros.length === 0 ? (
            <View style={styles.modalEmptyState}>
              <Ionicons name="person-outline" size={48} color={Colors.neutral.mist} />
              <Text variant="h3" color="course" style={styles.modalEmptyTitle}>
                Aucun pro disponible
              </Text>
              <Text variant="body" color="course" style={styles.modalEmptySubtext}>
                Aucun professionnel n'a de créneaux disponibles sur ce parcours pour le moment.
              </Text>
              {selectedCourse && (
                <CourseAlertToggle
                  golfCourseId={selectedCourse.id}
                  courseName={selectedCourse.name}
                  compact={false}
                  style={styles.modalAlertToggle}
                />
              )}
            </View>
          ) : (
            <FlatList
              data={availablePros}
              renderItem={({ item }) => (
                <ModalProItem item={item} onPress={handleModalProPress} />
              )}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.modalList}
              showsVerticalScrollIndicator={false}
            />
          )}
        </SafeAreaView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.neutral.background,
  },
  searchHeader: {
    paddingHorizontal: Spacing.m,
    paddingVertical: Spacing.m,
    backgroundColor: Colors.neutral.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral.mist,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.neutral.background,
    borderRadius: BorderRadius.medium,
    paddingHorizontal: Spacing.m,
    height: 44,
  },
  searchIcon: {
    marginRight: Spacing.s,
  },
  searchInput: {
    flex: 1,
    fontSize: Typography.fontSize.body,
    fontFamily: Typography.fontFamily.primary,
    color: Colors.neutral.ink,
  },
  clearButton: {
    padding: Spacing.xs,
  },
  categoryContainer: {
    paddingVertical: Spacing.s,
    paddingHorizontal: Spacing.m,
    backgroundColor: 'transparent',
  },
  categoryButton: {
    paddingHorizontal: Spacing.l,
    paddingVertical: Spacing.s,
    marginRight: Spacing.s,
    borderRadius: 20,
    backgroundColor: Colors.neutral.mist,
    shadowColor: Colors.neutral.charcoal,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  categoryButtonActive: {
    backgroundColor: Colors.primary.accent,
    shadowColor: Colors.primary.accent,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: Spacing.xxl,
  },
  scrollContainer: {
    flex: 1,
  },
  resultsContainer: {
    backgroundColor: 'transparent',
    paddingBottom: Spacing.xl,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: Spacing.xxl * 2,
  },
  emptyStateText: {
    marginTop: Spacing.m,
    textAlign: 'center',
    paddingHorizontal: Spacing.xl,
  },
  emptyStateSubtext: {
    marginTop: Spacing.s,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    paddingHorizontal: Spacing.m,
    paddingVertical: Spacing.m,
  },
  horizontalScroll: {
    paddingHorizontal: Spacing.m,
  },
  courseCard: {
    backgroundColor: Colors.neutral.white,
    borderRadius: BorderRadius.large,
    marginHorizontal: Spacing.m,
    marginBottom: Spacing.s,
    paddingHorizontal: Spacing.m,
    paddingVertical: Spacing.m,
    borderWidth: 1,
    borderColor: Colors.neutral.mist,
  },
  courseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  courseName: {
    flex: 1,
    marginRight: Spacing.s,
  },
  courseDistance: {
    fontWeight: '600',
  },
  courseLocation: {
    marginBottom: Spacing.xs,
  },
  courseDetails: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  prosSection: {
    marginTop: Spacing.xs,
  },
  prosAvatars: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  proAvatar: {
    // Styles appliqués dans le composant CircleAvatar
  },
  moreProsBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.neutral.charcoal,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.neutral.white,
  },
  moreProsBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.neutral.white,
  },
  noProsContainer: {
    // Conteneur pour l'état vide avec toggle
  },
  noProsText: {
    fontStyle: 'italic',
    marginBottom: Spacing.xs,
  },
  compactAlertToggle: {
    backgroundColor: 'transparent',
    borderWidth: 0,
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
  // Styles Modal
  modalContainer: {
    flex: 1,
    backgroundColor: Colors.neutral.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: Spacing.m,
    paddingVertical: Spacing.m,
    backgroundColor: Colors.neutral.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral.mist,
  },
  modalTitleContainer: {
    flex: 1,
    marginRight: Spacing.m,
  },
  modalTitle: {
    marginBottom: Spacing.xs,
  },
  modalDistanceBadge: {
    backgroundColor: Colors.primary.electric,
    paddingHorizontal: Spacing.xs,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  modalDistanceText: {
    color: Colors.neutral.white,
    fontSize: 11,
    fontWeight: '600',
  },
  closeButton: {
    padding: Spacing.xs,
  },
  modalLoadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalEmptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
  },
  modalEmptyTitle: {
    marginTop: Spacing.m,
    textAlign: 'center',
  },
  modalEmptySubtext: {
    marginTop: Spacing.s,
    textAlign: 'center',
    marginBottom: Spacing.m,
  },
  modalAlertToggle: {
    marginTop: Spacing.m,
    marginHorizontal: Spacing.m,
  },
  modalList: {
    padding: Spacing.m,
  },
  modalProCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.neutral.white,
    padding: Spacing.m,
    marginBottom: Spacing.s,
    borderRadius: BorderRadius.large,
    borderWidth: 1,
    borderColor: Colors.neutral.mist,
  },
  modalProAvatar: {
    marginRight: Spacing.s,
  },
  modalProInfo: {
    flex: 1,
    marginRight: Spacing.s,
  },
  modalProMainInfo: {
    // Container pour nom et badges
  },
  modalProName: {
    marginBottom: Spacing.xs,
  },
  modalProBadges: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  modalDivisionBadge: {
    marginRight: Spacing.xs,
  },
  modalWorldRanking: {
    fontWeight: '600',
    fontSize: 11,
  },
  modalProActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modalFavoriteButton: {
    paddingHorizontal: Spacing.xs,
    paddingVertical: Spacing.xs,
    marginRight: Spacing.xs,
  },
});
