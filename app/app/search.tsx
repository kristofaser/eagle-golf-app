import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  SafeAreaView,
  TextInput,
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { Text, Icon, Badge } from '@/components/atoms';
import { Colors, Spacing, BorderRadius, Elevation, Typography } from '@/constants/theme';
import { ProCard } from '@/components/molecules/ProCard';
import { profileService } from '@/services/profile.service';
import { golfCourseService, GolfCourse } from '@/services/golf-course.service';
import { JoueurData } from '@/components/molecules/ContentCard';
import { Ionicons } from '@expo/vector-icons';

type SearchCategory = 'all' | 'pros' | 'parcours';

interface CourseCardData extends GolfCourse {
  active_pros?: number;
}

const defaultCourseImages = [
  'https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=400&h=300&fit=crop&crop=center',
  'https://images.unsplash.com/photo-1593111774240-d529f12cf4bb?w=400&h=300&fit=crop&crop=center',
  'https://images.unsplash.com/photo-1540979388789-6cee28a1cdc9?w=400&h=300&fit=crop&crop=center',
  'https://images.unsplash.com/photo-1633328761239-8d45c3b77de9?w=400&h=300&fit=crop&crop=center',
];

export default function SearchScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<SearchCategory>('all');
  const [loading, setLoading] = useState(false);
  const [prosResults, setProsResults] = useState<JoueurData[]>([]);
  const [coursesResults, setCoursesResults] = useState<CourseCardData[]>([]);
  const inputRef = React.useRef<TextInput>(null);

  // Focus sur le champ de recherche après le montage
  useEffect(() => {
    // Délai pour éviter les conflits avec l'animation de navigation
    const timer = setTimeout(() => {
      inputRef.current?.focus();
    }, 300);
    return () => clearTimeout(timer);
  }, []);

  // Gestionnaire de changement de texte robuste
  const handleTextChange = useCallback((text: string) => {
    // S'assurer que le texte est bien une chaîne
    const safeText = text || '';
    setSearchQuery(safeText);
  }, []);

  // Fonction de recherche
  const performSearch = useCallback(async (query: string, category: SearchCategory) => {
    if (query.trim().length < 2) {
      setProsResults([]);
      setCoursesResults([]);
      return;
    }

    setLoading(true);
    try {
      // Recherche des pros
      if (category === 'all' || category === 'pros') {
        const { data: pros, error: prosError } = await profileService.listProProfiles(
          {},
          { limit: 50 }
        );

        if (!prosError && pros) {
          // Filtrer les pros par nom
          const filteredPros = pros.filter((pro) => {
            const fullName = `${pro.first_name} ${pro.last_name}`.toLowerCase();
            const cityName = (pro.city || '').toLowerCase();
            const searchLower = query.toLowerCase();
            return fullName.includes(searchLower) || cityName.includes(searchLower);
          });

          // Transformer en JoueurData
          const transformedPros: JoueurData[] = filteredPros
            .map((pro) => {
              const proProfile = pro.pro_profiles;

              if (!proProfile) return null;

              const specialties = proProfile.specialties || [];
              const playStyle = proProfile.play_style || [];

              return {
                id: pro.id,
                title: `${pro.first_name} ${pro.last_name}`,
                imageUrl:
                  pro.avatar_url ||
                  'https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=400&h=300&fit=crop&crop=center',
                type: 'joueur' as const,
                age: 30 + Math.floor(Math.random() * 15),
                region: pro.city || 'Paris',
                handicap: proProfile.handicap ? `+${proProfile.handicap}` : '+0',
                scoreAverage: 72 - (proProfile.handicap || 0),
                specialite: specialties.join(', ') || 'Polyvalent',
                styleJeu: playStyle.join(', ') || 'Adaptatif',
                experience: proProfile.years_experience || 5,
                circuits: proProfile.professional_status || 'Professionnel',
                meilleurResultat: proProfile.certifications?.join(', ') || 'Certifié PGA',
                victoires: Math.floor(Math.random() * 10) + 1,
                tarif: '120€', // Prix par défaut, sera remplacé par les vrais prix depuis pro_pricing
                rating: 4.5 + Math.random() * 0.5,
                isPremium: false, // À déterminer selon les prix dans pro_pricing
                isAvailable: false,
              };
            })
            .filter(Boolean) as JoueurData[];

          setProsResults(transformedPros);
        }
      }

      // Recherche des parcours
      if (category === 'all' || category === 'parcours') {
        const { data: courses, error: coursesError } =
          await golfCourseService.listGolfCoursesWithLocation();

        if (!coursesError && courses) {
          // Filtrer les parcours par nom ou ville
          const filteredCourses = courses.filter((course) => {
            const courseName = (course.name || '').toLowerCase();
            const cityName = (course.city || '').toLowerCase();
            const searchLower = query.toLowerCase();
            return courseName.includes(searchLower) || cityName.includes(searchLower);
          });

          // Ajouter les stats
          const coursesWithStats = await Promise.all(
            filteredCourses.map(async (course) => {
              const { data: stats } = await golfCourseService.getCourseStats(course.id);
              return {
                ...course,
                active_pros: stats?.activePros || 0,
              };
            })
          );

          setCoursesResults(coursesWithStats);
        }
      }
    } catch (error) {
      console.error('Erreur lors de la recherche:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Débounce la recherche
  useEffect(() => {
    const timer = setTimeout(() => {
      performSearch(searchQuery, selectedCategory);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, selectedCategory, performSearch]);

  // Handlers
  const handleProPress = useCallback(
    (pro: JoueurData) => {
      router.push(`/profile/${pro.id}`);
    },
    [router]
  );

  const handleCoursePress = useCallback(
    (course: CourseCardData) => {
      router.push(`/parcours/${course.id}`);
    },
    [router]
  );

  // Render des résultats
  const renderProResult = (pro: JoueurData) => (
    <ProCard
      key={pro.id}
      data={pro}
      onPress={handleProPress}
      onCardPress={handleProPress}
      isHidden={false}
    />
  );

  const renderCourseResult = (course: CourseCardData, index: number) => (
    <TouchableOpacity
      key={course.id}
      style={styles.courseCard}
      onPress={() => handleCoursePress(course)}
      activeOpacity={0.9}
    >
      <Image
        source={{
          uri: course.images?.[0] || defaultCourseImages[index % defaultCourseImages.length],
        }}
        style={styles.courseImage}
      />
      <View style={styles.courseInfo}>
        <Text variant="h4" color="charcoal" numberOfLines={1} style={styles.courseName}>
          {course.name}
        </Text>
        <View style={styles.locationRow}>
          <Icon name="location-on" size={14} color={Colors.neutral.course} family="MaterialIcons" />
          <Text variant="caption" color="course">
            {course.city}
          </Text>
        </View>
        <View style={styles.courseDetails}>
          {course.hole_count && (
            <Badge variant="default" size="small">
              {course.hole_count} trous
            </Badge>
          )}
          {course.par && (
            <Badge variant="default" size="small">
              Par {course.par}
            </Badge>
          )}
          {course.active_pros > 0 && (
            <Badge variant="success" size="small">
              {course.active_pros} pros
            </Badge>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  const hasResults = prosResults.length > 0 || coursesResults.length > 0;

  return (
    <>
      <Stack.Screen 
        options={{ 
          title: 'Recherche',
          headerShown: true,
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
            value={searchQuery}
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
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearButton}>
              <Ionicons name="close-circle" size={20} color={Colors.neutral.course} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Filtres de catégorie */}
      <View style={styles.categoryContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <TouchableOpacity
            style={[
              styles.categoryButton,
              selectedCategory === 'all' && styles.categoryButtonActive,
            ]}
            onPress={() => setSelectedCategory('all')}
          >
            <Text variant="body" color={selectedCategory === 'all' ? 'white' : 'charcoal'}>
              Tous
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.categoryButton,
              selectedCategory === 'pros' && styles.categoryButtonActive,
            ]}
            onPress={() => setSelectedCategory('pros')}
          >
            <Text variant="body" color={selectedCategory === 'pros' ? 'white' : 'charcoal'}>
              Pros
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.categoryButton,
              selectedCategory === 'parcours' && styles.categoryButtonActive,
            ]}
            onPress={() => setSelectedCategory('parcours')}
          >
            <Text variant="body" color={selectedCategory === 'parcours' ? 'white' : 'charcoal'}>
              Parcours
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Résultats */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary.accent} />
        </View>
      ) : (
        <ScrollView
          style={styles.resultsContainer}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 20 }}
        >
          {searchQuery.length < 2 ? (
            <View style={styles.emptyState}>
              <Ionicons name="search" size={48} color={Colors.neutral.mist} />
              <Text variant="body" color="course" style={styles.emptyStateText}>
                Tapez au moins 2 caractères pour lancer la recherche
              </Text>
            </View>
          ) : !hasResults ? (
            <View style={styles.emptyState}>
              <Text variant="h3" color="course">
                Aucun résultat
              </Text>
              <Text variant="body" color="course" style={styles.emptyStateSubtext}>
                Essayez avec d'autres mots-clés
              </Text>
            </View>
          ) : (
            <>
              {/* Résultats des pros */}
              {prosResults.length > 0 &&
                (selectedCategory === 'all' || selectedCategory === 'pros') && (
                  <View style={styles.section}>
                    <Text variant="h3" color="charcoal" style={styles.sectionTitle}>
                      Professionnels ({prosResults.length})
                    </Text>
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={styles.horizontalScroll}
                    >
                      {prosResults.map(renderProResult)}
                    </ScrollView>
                  </View>
                )}

              {/* Résultats des parcours */}
              {coursesResults.length > 0 &&
                (selectedCategory === 'all' || selectedCategory === 'parcours') && (
                  <View style={styles.section}>
                    <Text variant="h3" color="charcoal" style={styles.sectionTitle}>
                      Parcours ({coursesResults.length})
                    </Text>
                    {coursesResults.map((course, index) => renderCourseResult(course, index))}
                  </View>
                )}
            </>
          )}
        </ScrollView>
      )}
      </SafeAreaView>
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
    backgroundColor: Colors.neutral.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral.mist,
  },
  categoryButton: {
    paddingHorizontal: Spacing.l,
    paddingVertical: Spacing.s,
    marginRight: Spacing.s,
    borderRadius: BorderRadius.medium,
    backgroundColor: Colors.neutral.mist,
  },
  categoryButtonActive: {
    backgroundColor: Colors.primary.accent,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: Spacing.xxl,
  },
  resultsContainer: {
    flex: 1,
    backgroundColor: Colors.neutral.white,
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
    marginBottom: Spacing.m,
    borderWidth: 1,
    borderColor: Colors.ui.inputBorder,
    overflow: 'hidden',
  },
  courseImage: {
    width: '100%',
    height: 180,
    backgroundColor: Colors.neutral.mist,
  },
  courseInfo: {
    padding: Spacing.m,
  },
  courseName: {
    marginBottom: Spacing.xs,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xxs,
    marginBottom: Spacing.s,
  },
  courseDetails: {
    flexDirection: 'row',
    gap: Spacing.s,
  },
});