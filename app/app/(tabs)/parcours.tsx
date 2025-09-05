import React, { useState, useEffect, useCallback, useRef } from 'react';
import { StyleSheet, View, RefreshControl, TouchableOpacity, FlatList, Image } from 'react-native';
import { GolfCoursesMapExpo } from '@/components/organisms/GolfCoursesMapExpo';
import { CourseBottomSheet } from '@/components/organisms/CourseBottomSheet';
import { BottomSheetModal } from '@gorhom/bottom-sheet';
import { Colors, Spacing, BorderRadius, Elevation } from '@/constants/theme';
import { Text, Icon, Badge, LoadingScreen, ErrorScreen } from '@/components/atoms';
import { commonStyles } from '@/utils/commonStyles';
import { useLoadingState } from '@/hooks/useLoadingState';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { golfParcoursService, GolfParcours } from '@/services/golf-parcours.service';
import { MapData, DepartmentCluster } from '@/types/clustering';
import * as Location from 'expo-location';

const defaultCourseImages = [
  'https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=400&h=300&fit=crop&crop=center',
  'https://images.unsplash.com/photo-1593111774240-d529f12cf4bb?w=400&h=300&fit=crop&crop=center',
  'https://images.unsplash.com/photo-1540979388789-6cee28a1cdc9?w=400&h=300&fit=crop&crop=center',
  'https://images.unsplash.com/photo-1633328761239-8d45c3b77de9?w=400&h=300&fit=crop&crop=center',
];

interface CourseCardData extends GolfParcours {
  active_pros?: number;
}

type ViewMode = 'list' | 'map';

function ParcoursScreen() {
  const insets = useSafeAreaInsets();
  const TAB_BAR_HEIGHT = 60; // Hauteur de la tab bar sans les safe areas
  const router = useRouter();

  const [coursesData, setCoursesData] = useState<CourseCardData[]>([]);
  const [allClusters, setAllClusters] = useState<DepartmentCluster[]>([]);
  const [allGolfs, setAllGolfs] = useState<GolfParcours[]>([]);
  const [userLocation, setUserLocation] = useState<Location.LocationObject | null>(null);
  const { loading, error, setSuccess, setFailed } = useLoadingState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('map'); // Map par défaut
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [selectedCourseData, setSelectedCourseData] = useState<GolfParcours | CourseCardData | null>(
    null
  );
  const [, forceUpdate] = useState(0);
  const selectedCourseRef = useRef<string | null>(null);
  const bottomSheetRef = useRef<BottomSheetModal>(null);
  const selectedCourseDataRef = useRef<GolfParcours | CourseCardData | null>(null);

  const loadCourses = async () => {
    try {
      console.log('🔄 Chargement des données de carte...');

      // Obtenir la géolocalisation utilisateur
      let userCoords = null;
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const location = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          });
          setUserLocation(location);
          userCoords = {
            userLatitude: location.coords.latitude,
            userLongitude: location.coords.longitude,
          };
          console.log('📍 Position utilisateur obtenue:', location.coords.latitude, location.coords.longitude);
        }
      } catch (locError) {
        console.warn('⚠️ Erreur géolocalisation:', locError);
      }

      // Récupérer toutes les données pour le système dynamique
      const { data: allGolfs, error: golfsError } = await golfParcoursService.listGolfCoursesWithLocation();
      
      if (golfsError) throw golfsError;
      
      if (!allGolfs || allGolfs.length === 0) {
        throw new Error('Aucun golf trouvé');
      }

      // Générer les données complètes pour le système zoom dynamique
      const fullMapData = golfParcoursService.generateFullMapData(allGolfs);
      
      setAllClusters(fullMapData.allClusters);
      setAllGolfs(fullMapData.allGolfs);
      
      console.log('✅ Données de carte chargées (système dynamique):', {
        totalGolfs: fullMapData.totalGolfs,
        clusters: fullMapData.allClusters.length,
        userLocation: !!userCoords,
      });

      // Pour la vue liste, utiliser les golfs proches ou un échantillon
      let golfsForList = allGolfs;
      if (userCoords && allGolfs.length > 20) {
        // Si on a une position utilisateur, prioriser les golfs proches
        const nearbyGolfs = allGolfs
          .filter(golf => golf.latitude && golf.longitude)
          .map(golf => {
            const distance = golfParcoursService.calculateDistance(
              userCoords.userLatitude,
              userCoords.userLongitude,
              golf.latitude!,
              golf.longitude!
            );
            return { ...golf, distance };
          })
          .sort((a, b) => a.distance - b.distance)
          .slice(0, 20);
        golfsForList = nearbyGolfs;
      } else {
        // Sinon, prendre un échantillon pour la performance
        golfsForList = allGolfs.slice(0, 20);
      }

      // Ajouter les stats de pros pour la vue liste
      const coursesWithStats = await Promise.all(
        golfsForList.map(async (course) => {
          const { data: stats } = await golfParcoursService.getCourseStats(course.id);
          return {
            ...course,
            active_pros: stats?.activePros || 0,
          };
        })
      );

      setCoursesData(coursesWithStats);
    } catch (err) {
      console.error('❌ Erreur chargement parcours:', err);
      setFailed('Impossible de charger les parcours');
    } finally {
      if (!error) setSuccess();
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadCourses();
  }, []);

  // Fermer la bottomsheet quand on quitte cet écran
  useFocusEffect(
    useCallback(() => {
      return () => {
        // Cette fonction s'exécute quand l'écran perd le focus
        handleBottomSheetClose();
      };
    }, [])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadCourses();
  }, []);

  const handleCoursePress = useCallback(
    (course: GolfParcours | CourseCardData) => {
      if (viewMode === 'map') {
        // Stocker dans l'état ET la ref
        setSelectedCourseData(course);
        selectedCourseDataRef.current = course;
        selectedCourseRef.current = course.id;
        setSelectedCourseId(course.id);

        // Forcer le re-render PUIS ouvrir la bottom sheet
        forceUpdate((prev) => prev + 1);

        setTimeout(() => {
          // Passer le course directement à la bottomsheet
          (bottomSheetRef.current as any)?.setCourse?.(course);
          bottomSheetRef.current?.present();
        }, 100);
      } else {
        router.push(`/parcours/${course.id}`);
      }
    },
    [viewMode, router]
  );

  const handleBottomSheetClose = useCallback(() => {
    selectedCourseRef.current = null;
    selectedCourseDataRef.current = null;
    setSelectedCourseData(null);
    setSelectedCourseId(null);
    bottomSheetRef.current?.dismiss();
    forceUpdate((prev) => prev + 1);
  }, []);

  // Le clic sur cluster n'est plus nécessaire avec le système dynamique Airbnb
  // Le zoom se fait automatiquement selon le niveau de zoom de la carte

  const renderCourse = ({ item, index }: { item: CourseCardData; index: number }) => (
    <TouchableOpacity
      style={styles.courseCard}
      onPress={() => handleCoursePress(item)}
      activeOpacity={0.9}
    >
      <Image
        source={{
          uri: item.images?.[0] || defaultCourseImages[index % defaultCourseImages.length],
        }}
        style={styles.courseImage}
      />
      <View style={styles.courseInfo}>
        <Text variant="h4" color="charcoal" numberOfLines={1} style={styles.courseName}>
          {item.name}
        </Text>
        <View style={styles.locationRow}>
          <Icon name="location-on" size={14} color={Colors.neutral.course} family="MaterialIcons" />
          <Text variant="caption" color="course">
            {item.city}
          </Text>
        </View>
        <View style={styles.courseDetails}>
          {item.hole_count && (
            <Badge variant="default" size="small">
              {item.hole_count} trous
            </Badge>
          )}
          {item.par && (
            <Badge variant="default" size="small">
              Par {item.par}
            </Badge>
          )}
          {item.active_pros && item.active_pros > 0 && (
            <Badge variant="success" size="small">
              {item.active_pros} pros
            </Badge>
          )}
        </View>
        {item.green_fee_weekday && (
          <Text variant="caption" color="accent" weight="semiBold" style={styles.price}>
            À partir de {item.green_fee_weekday / 100}€
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );

  if (loading && !refreshing) {
    return <LoadingScreen message="Chargement des parcours..." />;
  }

  if (error && !loading) {
    return <ErrorScreen error={error} onRetry={loadCourses} />;
  }

  return (
    <View style={styles.container}>
      {viewMode === 'list' ? (
        <View style={styles.container}>
          <FlatList
            data={coursesData}
            renderItem={renderCourse}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={Colors.primary.accent}
              />
            }
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Text variant="h3" color="course">
                  Aucun parcours disponible
                </Text>
              </View>
            }
          />
        </View>
      ) : (
        <>
          <View style={styles.mapContainerFullScreen}>
            <GolfCoursesMapExpo
              allGolfs={allGolfs}
              userLocation={userLocation?.coords}
              onCoursePress={handleCoursePress}
              selectedCourseId={selectedCourseId || undefined}
              onMapPress={handleBottomSheetClose}
            />
          </View>
          {/* SearchBar flottante sur la carte */}
          <View style={[styles.floatingSearchContainer, { top: insets.top + Spacing.m }]}></View>
        </>
      )}

      {/* Bottom Sheet pour les détails du parcours */}
      {viewMode === 'map' && (
        <CourseBottomSheet
          ref={bottomSheetRef}
          course={selectedCourseDataRef.current}
          onClose={handleBottomSheetClose}
        />
      )}
    </View>
  );
}

export default ParcoursScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: Spacing.m,
  },
  errorText: {
    textAlign: 'center',
    marginHorizontal: Spacing.xl,
  },
  retryButton: {
    marginTop: Spacing.m,
    paddingVertical: Spacing.s,
    paddingHorizontal: Spacing.l,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.primary.accent,
  },
  listContent: {
    paddingHorizontal: Spacing.m,
    paddingBottom: Spacing.xl,
  },
  courseCard: {
    backgroundColor: Colors.neutral.ball,
    borderRadius: BorderRadius.large,
    marginBottom: Spacing.m,
    ...Elevation.medium,
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
    marginBottom: Spacing.s,
  },
  price: {
    marginTop: Spacing.xs,
  },
  emptyState: {
    padding: Spacing.xxl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewModeToggle: {
    flexDirection: 'row',
    marginHorizontal: Spacing.m,
    marginBottom: Spacing.m,
    backgroundColor: Colors.neutral.mist,
    borderRadius: BorderRadius.medium,
    padding: Spacing.xxs,
  },
  toggleButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.s,
    borderRadius: BorderRadius.small,
  },
  toggleButtonActive: {
    backgroundColor: Colors.primary.accent,
  },
  mapContainer: {
    flex: 1,
    marginHorizontal: Spacing.m,
    marginBottom: Spacing.m,
    borderRadius: BorderRadius.large,
    overflow: 'hidden',
    ...Elevation.medium,
  },
  mapContainerFullScreen: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  floatingSearchContainer: {
    position: 'absolute',
    left: Spacing.m,
    right: Spacing.m,
    zIndex: 10,
    ...Elevation.large,
  },
});
