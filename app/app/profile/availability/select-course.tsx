import {
  SafeAreaView,
  StyleSheet,
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import React, { useState, useEffect } from 'react';
import { Stack, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Typography, BorderRadius } from '@/constants/theme';
import { useAuth } from '@/hooks/useAuth';
import { golfParcoursService, GolfParcours } from '@/services/golf-parcours.service';

export default function SelectCourseScreen() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [golfCourses, setGolfCourses] = useState<GolfParcours[]>([]);
  const [filteredCourses, setFilteredCourses] = useState<GolfParcours[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    loadGolfCourses();
  }, []);

  useEffect(() => {
    // Filtrer les parcours selon le terme de recherche
    if (searchTerm.trim() === '') {
      setFilteredCourses(golfCourses);
    } else {
      const filtered = golfCourses.filter(
        (course) =>
          course.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          course.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          course.department?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredCourses(filtered);
    }
  }, [searchTerm, golfCourses]);

  const loadGolfCourses = async () => {
    try {
      setLoading(true);
      const response = await golfParcoursService.listGolfCourses(
        {},
        { page: 1, limit: 100 }, // Charger les 100 premiers parcours
        { sortBy: 'name', sortOrder: 'asc' }
      );

      if (response.error) {
        throw response.error;
      }

      setGolfCourses(response.data || []);
    } catch (error) {
      console.error('Erreur chargement parcours:', error);
      Alert.alert('Erreur', 'Impossible de charger la liste des parcours');
    } finally {
      setLoading(false);
    }
  };

  const handleCourseSelect = (course: GolfParcours) => {
    router.push({
      pathname: '/profile/availability/select-dates/[courseId]',
      params: {
        courseId: course.id,
        courseName: course.name,
        courseCity: course.city,
      },
    });
  };

  const formatHolesCount = (holes?: number) => {
    if (!holes) return '';
    return holes === 18 ? '18 trous' : `${holes} trous`;
  };

  if (!user) {
    return null;
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Choisir un parcours',
          headerBackTitle: 'Retour',
        }}
      />
      <SafeAreaView style={styles.container}>
        {/* Barre de recherche */}
        <View style={styles.searchContainer}>
          <View style={styles.searchInputContainer}>
            <Ionicons name="search" size={20} color={Colors.ui.subtleGray} />
            <TextInput
              style={styles.searchInput}
              placeholder="Rechercher un parcours..."
              value={searchTerm}
              onChangeText={setSearchTerm}
              autoCapitalize="none"
              autoCorrect={false}
            />
            {searchTerm.length > 0 && (
              <TouchableOpacity onPress={() => setSearchTerm('')} style={styles.clearButton}>
                <Ionicons name="close-circle" size={20} color={Colors.ui.subtleGray} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Instructions */}
        <View style={styles.instructionsContainer}>
          <Ionicons name="information-circle-outline" size={20} color={Colors.primary.accent} />
          <Text style={styles.instructionsText}>
            Choisissez un parcours de golf pour définir vos disponibilités
          </Text>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.primary.accent} />
            <Text style={styles.loadingText}>Chargement des parcours...</Text>
          </View>
        ) : (
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {filteredCourses.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons
                  name="golf-outline"
                  size={64}
                  color={Colors.ui.subtleGray}
                  style={styles.emptyIcon}
                />
                <Text style={styles.emptyTitle}>
                  {searchTerm ? 'Aucun parcours trouvé' : 'Aucun parcours disponible'}
                </Text>
                {searchTerm && (
                  <Text style={styles.emptySubtitle}>
                    Essayez avec d'autres termes de recherche
                  </Text>
                )}
              </View>
            ) : (
              <>
                <Text style={styles.resultsCount}>
                  {filteredCourses.length} parcours{filteredCourses.length > 1 ? '' : ''} trouvé
                  {filteredCourses.length > 1 ? 's' : ''}
                </Text>

                {filteredCourses.map((course) => (
                  <TouchableOpacity
                    key={course.id}
                    style={styles.courseCard}
                    onPress={() => handleCourseSelect(course)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.courseHeader}>
                      <View style={styles.courseInfo}>
                        <Text style={styles.courseName}>{course.name}</Text>
                        <View style={styles.courseLocation}>
                          <Ionicons
                            name="location-outline"
                            size={16}
                            color={Colors.ui.subtleGray}
                          />
                          <Text style={styles.courseCity}>{course.city}</Text>
                          {course.department && (
                            <>
                              <Text style={styles.courseSeparator}>•</Text>
                              <Text style={styles.courseDepartment}>{course.department}</Text>
                            </>
                          )}
                        </View>
                        {course.holes_count && (
                          <View style={styles.courseDetails}>
                            <Ionicons name="golf" size={14} color={Colors.primary.accent} />
                            <Text style={styles.courseHoles}>
                              {formatHolesCount(course.holes_count)}
                            </Text>
                          </View>
                        )}
                      </View>
                      <View style={styles.courseAction}>
                        <Ionicons name="chevron-forward" size={20} color={Colors.ui.subtleGray} />
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
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
  searchContainer: {
    padding: Spacing.m,
    borderBottomWidth: 1,
    borderBottomColor: Colors.ui.inputBorder,
    backgroundColor: Colors.neutral.white,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.ui.lightBackground,
    borderRadius: BorderRadius.medium,
    paddingHorizontal: Spacing.m,
    paddingVertical: Spacing.s,
    gap: Spacing.s,
  },
  searchInput: {
    flex: 1,
    fontSize: Typography.fontSize.body,
    color: Colors.neutral.charcoal,
  },
  clearButton: {
    padding: Spacing.xs,
  },
  instructionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.ui.lightBackground,
    padding: Spacing.m,
    gap: Spacing.s,
  },
  instructionsText: {
    flex: 1,
    fontSize: 14,
    color: Colors.neutral.charcoal,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: Spacing.m,
    fontSize: Typography.fontSize.body,
    color: Colors.ui.subtleGray,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.m,
  },
  resultsCount: {
    fontSize: Typography.fontSize.caption,
    color: Colors.ui.subtleGray,
    marginBottom: Spacing.m,
    fontWeight: Typography.fontWeight.medium,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    marginBottom: Spacing.l,
  },
  emptyTitle: {
    fontSize: Typography.fontSize.h3,
    fontWeight: Typography.fontWeight.semiBold,
    color: Colors.neutral.charcoal,
    marginBottom: Spacing.s,
  },
  emptySubtitle: {
    fontSize: Typography.fontSize.body,
    color: Colors.ui.subtleGray,
    textAlign: 'center',
    paddingHorizontal: Spacing.xl,
  },
  courseCard: {
    backgroundColor: Colors.neutral.white,
    borderRadius: BorderRadius.medium,
    padding: Spacing.m,
    marginBottom: Spacing.m,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  courseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  courseInfo: {
    flex: 1,
  },
  courseName: {
    fontSize: Typography.fontSize.h4,
    fontWeight: Typography.fontWeight.semiBold,
    color: Colors.neutral.charcoal,
    marginBottom: Spacing.xs,
  },
  courseLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xs,
    gap: Spacing.xs,
  },
  courseCity: {
    fontSize: Typography.fontSize.body,
    color: Colors.ui.subtleGray,
  },
  courseSeparator: {
    fontSize: Typography.fontSize.body,
    color: Colors.ui.subtleGray,
    marginHorizontal: Spacing.xs,
  },
  courseDepartment: {
    fontSize: Typography.fontSize.body,
    color: Colors.ui.subtleGray,
  },
  courseDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  courseHoles: {
    fontSize: Typography.fontSize.caption,
    color: Colors.primary.accent,
    fontWeight: Typography.fontWeight.medium,
  },
  courseAction: {
    padding: Spacing.s,
  },
});
