import {
  StyleSheet,
  View,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  FlatList,
  Platform,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { BottomSheetModal } from '@gorhom/bottom-sheet';
import { JoueurData } from '@/components/molecules/ContentCard';
import { ProCard } from '@/components/molecules/ProCard';
import { Colors, Spacing, BorderRadius } from '@/constants/theme';
import { Text, LoadingScreen, ErrorScreen } from '@/components/atoms';
import { ViewMoreCard } from '@/components/molecules';
import { RadiusBottomSheet } from '@/components/organisms';
import { commonStyles } from '@/utils/commonStyles';
import { profileService } from '@/services/profile.service';
import { proAvailabilityService } from '@/services/pro-availability.service';
import { golfCourseService } from '@/services/golf-course.service';
import { useResponsiveCardSize } from '@/hooks/useResponsiveCardSize';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { useGeolocation } from '@/hooks/useGeolocation';
import { calculateDistance } from '@/utils/location';
import { useLocationPreferences } from '@/stores/useLocationPreferences';
import { Ionicons } from '@expo/vector-icons';

export default function ProsScreen() {
  const { isTablet } = useResponsiveCardSize();
  const router = useRouter();
  const { location: userLocation, isLoading: isLoadingLocation } = useGeolocation();
  const { radiusKm, setRadiusKm } = useLocationPreferences();
  const radiusBottomSheetRef = useRef<BottomSheetModal>(null);

  // Utiliser React Query pour charger les pros
  const {
    data: prosData,
    isLoading,
    error,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ['proProfiles'],
    queryFn: async () => {
      console.log('🔍 Chargement des pros via React Query...');
      const { data: pros, error: prosError } = await profileService.listProProfiles(
        {},
        { limit: 50 }
      );

      if (prosError) {
        console.error('❌ Erreur lors du chargement des pros:', prosError);
        throw prosError;
      }

      // Récupérer tous les parcours de chaque pro depuis leurs disponibilités FUTURES
      const proIds = (pros || []).map((pro) => pro.id);
      const today = new Date().toISOString().split('T')[0];

      console.log(`📍 Chargement des parcours avec disponibilités futures pour ${proIds.length} pros...`);

      // Récupérer tous les parcours utilisés par les pros (uniquement disponibilités futures)
      const { data: availabilities, error: availError } = await golfCourseService.supabase
        .from('pro_availabilities')
        .select('pro_id, golf_course_id')
        .in('pro_id', proIds)
        .gte('date', today); // Filtrer uniquement les disponibilités futures ou d'aujourd'hui

      // Créer un Map pro_id → [golf_course_ids]
      const proCoursesByPro: Record<string, string[]> = {};

      if (!availError && availabilities) {
        availabilities.forEach((avail) => {
          if (!proCoursesByPro[avail.pro_id]) {
            proCoursesByPro[avail.pro_id] = [];
          }
          if (!proCoursesByPro[avail.pro_id].includes(avail.golf_course_id)) {
            proCoursesByPro[avail.pro_id].push(avail.golf_course_id);
          }
        });

        console.log(`✅ ${Object.keys(proCoursesByPro).length} pros ont des parcours`);
      }

      // Récupérer les IDs uniques de tous les parcours
      const allGolfCourseIds = [...new Set(availabilities?.map((a) => a.golf_course_id) || [])];

      // Charger tous les parcours en une seule requête
      let golfCoursesMap: Record<string, { latitude: number; longitude: number }> = {};

      if (allGolfCourseIds.length > 0) {
        const { data: courses, error: coursesError } = await golfCourseService.supabase
          .from('golf_parcours')
          .select('id, latitude, longitude')
          .in('id', allGolfCourseIds);

        if (!coursesError && courses) {
          // Créer un Map pour accès rapide par ID
          golfCoursesMap = courses.reduce(
            (acc, course) => {
              if (course.latitude && course.longitude) {
                acc[course.id] = {
                  latitude: Number(course.latitude),
                  longitude: Number(course.longitude),
                };
              }
              return acc;
            },
            {} as Record<string, { latitude: number; longitude: number }>
          );
          console.log(`✅ ${Object.keys(golfCoursesMap).length} parcours chargés avec succès`);
        } else {
          console.error('❌ Erreur lors du chargement des parcours:', coursesError);
        }
      }

      // Enrichir les pros avec TOUS leurs parcours (on choisira le plus proche après selon la géoloc)
      const prosWithAvailability = (pros || []).map((pro) => {
        const settings = { is_globally_available: true };
        const courseIds = proCoursesByPro[pro.id] || [];
        const allCourseCoords = courseIds
          .map((id) => golfCoursesMap[id])
          .filter((coords) => coords !== undefined);

        return {
          ...pro,
          availabilitySettings: settings,
          allGolfCourseLocations: allCourseCoords, // Tous les parcours du pro
        };
      });

      return prosWithAvailability;
    },
    staleTime: 1000 * 60 * 5, // Considérer les données comme fraîches pendant 5 minutes
    gcTime: 1000 * 60 * 10, // Garder en cache pendant 10 minutes
  });

  // Transformer les données des pros
  const { prosNearMe, fullProsNearMe, prosByDivision, fullProsByDivision } = useMemo(() => {
    if (!prosData || prosData.length === 0) {
      return {
        prosNearMe: [],
        fullProsNearMe: [],
        prosByDivision: {
          'DP World': [],
          'Ladies European Tour': [],
          'Legends Tour': [],
          'Hotel Planner': [],
          'Alps Tour & Pro Golf': [],
          'Circuit FR': [],
        },
        fullProsByDivision: {
          'DP World': [],
          'Ladies European Tour': [],
          'Legends Tour': [],
          'Hotel Planner': [],
          'Alps Tour & Pro Golf': [],
          'Circuit FR': [],
        },
      };
    }

    // Utiliser les settings de disponibilité récupérés
    const prosWithAvailability = prosData;

    const transformedPros: (JoueurData & { distance?: number })[] = prosWithAvailability
      .map((pro) => {
        const proProfile = pro.pro_profiles;

        // Vérifier que pro_profiles existe
        if (!proProfile) {
          console.warn(`⚠️ Pas de pro_profiles pour le profil ${pro.id}`);
          return null;
        }
        const specialties = proProfile.specialties || [];
        const playStyle = proProfile.play_style || [];

        // Calculer la distance minimale parmi tous les parcours du pro
        let distance: number | undefined;
        if (userLocation && pro.allGolfCourseLocations) {
          const allCourses = pro.allGolfCourseLocations as {
            latitude: number;
            longitude: number;
          }[];

          if (allCourses.length > 0) {
            // Calculer la distance pour chaque parcours et garder la plus petite
            const distances = allCourses
              .map((coords) => {
                if (coords.latitude && coords.longitude) {
                  return calculateDistance(
                    userLocation.latitude,
                    userLocation.longitude,
                    coords.latitude,
                    coords.longitude
                  );
                }
                return Infinity;
              })
              .filter((d) => d !== Infinity);

            if (distances.length > 0) {
              distance = Math.min(...distances);
            }
          }
        }

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
          tarif: '120€', // Prix par d\u00e9faut, sera remplac\u00e9 par les vrais prix depuis pro_pricing
          isPremium: false, // \u00c0 d\u00e9terminer selon les prix dans pro_pricing
          isAvailable: pro.availabilitySettings?.is_globally_available ?? false,
          division: proProfile.division || 'Circuit FR',
          worldRanking: proProfile.world_ranking,
          distance,
        };
      })
      .filter(Boolean) as (JoueurData & { distance?: number })[]; // Filtrer les nulls

    // Pour "autour de moi", trier par distance si on a la localisation
    let fullNearMe: (JoueurData & { distance?: number })[];
    let nearMe: (JoueurData & { distance?: number })[];

    if (userLocation) {
      // Trier par distance croissante, en mettant ceux sans distance à la fin
      fullNearMe = [...transformedPros].sort((a, b) => {
        if (a.distance === undefined && b.distance === undefined) return 0;
        if (a.distance === undefined) return 1;
        if (b.distance === undefined) return -1;
        return a.distance - b.distance;
      });

      // Filtrer par rayon
      console.log(`🔍 Rayon sélectionné: ${radiusKm} km`);
      console.log(`📊 Pros avant filtre: ${fullNearMe.length}`);

      fullNearMe = fullNearMe.filter(
        (pro) => pro.distance !== undefined && pro.distance <= radiusKm
      );
      console.log(`📊 Pros après filtre (≤${radiusKm}km): ${fullNearMe.length}`);

      // Log des 3 premiers pros avec leur distance
      fullNearMe.slice(0, 3).forEach((pro, i) => {
        console.log(`  ${i + 1}. ${pro.title}: ${pro.distance?.toFixed(1)} km`);
      });

      // Limiter à 5 pour l'affichage initial
      nearMe = fullNearMe.slice(0, 5);
    } else {
      // Sans géolocalisation, prendre ceux de Paris en priorité
      fullNearMe = [
        ...transformedPros.filter((p) => p.region === 'Paris'),
        ...transformedPros.filter((p) => p.region !== 'Paris'),
      ];
      // Limiter à 5 pour l'affichage initial
      nearMe = fullNearMe.slice(0, 5);
    }

    // Diviser les pros par division (6 divisions officielles synchronisées avec la DB)
    const divisionGroups: { [key: string]: JoueurData[] } = {
      'DP World': [],
      'Ladies European Tour': [],
      'Legends Tour': [],
      'Hotel Planner': [],
      'Alps Tour & Pro Golf': [],
      'Circuit FR': [],
    };

    // Grouper les pros par division
    prosWithAvailability.forEach((pro) => {
      const proProfile = pro.pro_profiles;
      if (!proProfile) return;

      // Mapper les divisions "Alps Tour" et "Pro Golf" vers "Alps Tour & Pro Golf"
      let division = proProfile.division || 'Circuit FR';
      if (division === 'Alps Tour' || division === 'Pro Golf') {
        division = 'Alps Tour & Pro Golf';
      }

      const transformedPro = transformedPros.find((p) => p.id === pro.id);

      if (transformedPro && divisionGroups[division]) {
        divisionGroups[division].push(transformedPro);
      }
    });

    // Conserver la liste complète avant de limiter
    const fullDivisionGroups = { ...divisionGroups };

    // Limiter à 5 pros par division pour l'affichage initial
    const limitedDivisionGroups: { [key: string]: JoueurData[] } = {};
    Object.keys(divisionGroups).forEach((division) => {
      limitedDivisionGroups[division] = divisionGroups[division].slice(0, 5);
    });

    return {
      prosNearMe: nearMe,
      fullProsNearMe: fullNearMe,
      prosByDivision: limitedDivisionGroups,
      fullProsByDivision: fullDivisionGroups,
    };
  }, [prosData, userLocation, radiusKm]);

  const onRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  const handleCardPress = useCallback(
    (data: JoueurData) => {
      console.log(`🚀 Navigation vers le profil: ${data.id}`);
      const startNav = Date.now();

      // Naviguer vers la page de profil du pro
      router.push(`/profile/${data.id}`);

      // Log pour mesurer le temps
      setTimeout(() => {
        console.log(`⏱️ Temps de navigation: ${Date.now() - startNav}ms`);
      }, 100);
    },
    [router]
  );

  const renderCard = useCallback(
    (item: JoueurData, showDivision: boolean = true) => (
      <ProCard
        key={item.id}
        data={item}
        onPress={handleCardPress}
        onCardPress={handleCardPress}
        isHidden={false}
        showDivisionBadge={showDivision}
        onHover={(profileId) => {
          console.log(`📦 Préchargement du profil: ${profileId}`);
        }}
      />
    ),
    [handleCardPress]
  );

  // Render function pour FlatList
  const renderProItem = useCallback(
    ({ item, index }: { item: JoueurData; index: number }, showDivision: boolean = true) => (
      <ProCard
        data={item}
        onPress={handleCardPress}
        onCardPress={handleCardPress}
        isHidden={false}
        showDivisionBadge={showDivision}
        onHover={(profileId) => {
          console.log(`📦 Préchargement du profil: ${profileId}`);
        }}
      />
    ),
    [handleCardPress]
  );

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

  if (isLoading && !isRefetching) {
    return <LoadingScreen message="Chargement des professionnels..." />;
  }

  if (error && !isLoading) {
    return (
      <ErrorScreen error={error.message || 'Une erreur est survenue'} onRetry={() => refetch()} />
    );
  }

  const Container = Platform.OS === 'web' ? View : SafeAreaView;

  return (
    <Container style={styles.container} edges={Platform.OS === 'web' ? undefined : []}>
      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={onRefresh}
            tintColor={Colors.primary.accent}
          />
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Section Autour de moi */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text variant="h3" color="charcoal" style={styles.sectionTitle}>
              Autour de moi
            </Text>
            {isLoadingLocation && <ActivityIndicator size="small" color={Colors.primary.accent} />}
            {userLocation && !isLoadingLocation && (
              <Pressable
                style={({ pressed }) => [styles.radiusButton, pressed && styles.radiusButtonPressed]}
                onPress={() => radiusBottomSheetRef.current?.present()}
              >
                <Text variant="bodySmall" color="accent" weight="medium" style={styles.radiusText}>
                  {radiusKm} km
                </Text>
                <Ionicons name="settings-outline" size={18} color={Colors.primary.accent} />
              </Pressable>
            )}
          </View>
          {!userLocation && !isLoadingLocation ? (
            <View style={styles.emptyState}>
              <Ionicons name="location-outline" size={48} color={Colors.neutral.course} />
              <Text variant="body" color="course" style={styles.emptyStateText}>
                Activez la géolocalisation
              </Text>
              <Text variant="bodySmall" color="mist" style={styles.emptyStateSubtext}>
                pour voir les pros autour de vous
              </Text>
            </View>
          ) : prosNearMe.length > 0 ? (
            <FlatList
              data={prosNearMe}
              renderItem={({ item }) => renderProItem({ item, index: 0 }, true)}
              keyExtractor={(item) => item.id}
              horizontal={true}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={[
                styles.scrollViewContent,
                isTablet && styles.scrollViewContentTablet,
              ]}
              getItemLayout={getItemLayout}
              windowSize={5}
              initialNumToRender={5}
              maxToRenderPerBatch={2}
              removeClippedSubviews={true}
              snapToInterval={CARD_WIDTH + CARD_SPACING}
              snapToAlignment="start"
              decelerationRate="fast"
              ListFooterComponent={
                fullProsNearMe.length > 5 ? (
                  <ViewMoreCard
                    count={fullProsNearMe.length}
                    onPress={() => router.push('/pros-nearby-modal')}
                    previewAvatars={fullProsNearMe.slice(5, 9).map((p) => p.imageUrl)}
                  />
                ) : null
              }
            />
          ) : userLocation ? (
            <View style={styles.emptyState}>
              <Text variant="body" color="course" style={styles.emptyStateText}>
                Aucun professionnel dans un rayon de {radiusKm} km
              </Text>
              <Text variant="bodySmall" color="mist" style={styles.emptyStateSubtext}>
                Essayez d'augmenter le rayon de recherche
              </Text>
            </View>
          ) : null}
        </View>

        {/* Sections par division */}
        {Object.entries(prosByDivision).map(([division, pros]) => {
          // Ne pas afficher les divisions sans pros
          if (pros.length === 0) return null;

          const totalPros = fullProsByDivision[division]?.length || 0;
          const hasMore = totalPros > 5;

          return (
            <View key={division} style={styles.sectionContainer}>
              <View style={styles.sectionHeader}>
                <Text variant="h3" color="charcoal" style={styles.sectionTitle}>
                  {division}
                </Text>
              </View>
              <FlatList
                data={pros}
                renderItem={({ item }) => renderProItem({ item, index: 0 }, false)}
                keyExtractor={(item) => item.id}
                horizontal={true}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={[
                  styles.scrollViewContent,
                  isTablet && styles.scrollViewContentTablet,
                ]}
                getItemLayout={getItemLayout}
                windowSize={5}
                initialNumToRender={5}
                maxToRenderPerBatch={2}
                removeClippedSubviews={true}
                snapToInterval={CARD_WIDTH + CARD_SPACING}
                snapToAlignment="start"
                decelerationRate="fast"
                ListFooterComponent={
                  hasMore ? (
                    <ViewMoreCard
                      count={totalPros}
                      onPress={() =>
                        router.push({
                          pathname: '/pros-division-modal',
                          params: { division },
                        })
                      }
                      previewAvatars={fullProsByDivision[division]?.slice(5, 9).map((p) => p.imageUrl) || []}
                    />
                  ) : null
                }
              />
            </View>
          );
        })}
      </ScrollView>

      {/* Bottom Sheet pour sélection du rayon */}
      <RadiusBottomSheet
        ref={radiusBottomSheetRef}
        selectedRadius={radiusKm}
        onSelectRadius={setRadiusKm}
      />
    </Container>
  );
}

const styles = StyleSheet.create({
  container: commonStyles.container,
  scrollContent: {
    paddingBottom: Spacing.xl, // Espace pour éviter la tab bar
  },
  sectionContainer: {
    marginTop: Spacing.l,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.m,
    marginBottom: Spacing.m,
  },
  sectionTitle: {
    flex: 1,
  },
  scrollViewContent: {
    paddingLeft: Spacing.m,
    paddingRight: Spacing.m,
  },
  scrollViewContentTablet: {
    paddingHorizontal: Spacing.m * 2,
  },
  emptyState: {
    padding: Spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 200,
  },
  emptyStateText: {
    textAlign: 'center',
    marginTop: Spacing.s,
  },
  emptyStateSubtext: {
    textAlign: 'center',
    marginTop: Spacing.xs,
  },
  radiusButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.s,
    paddingVertical: Spacing.xs,
    backgroundColor: Colors.primary.light,
    borderRadius: BorderRadius.medium,
    gap: Spacing.xs,
  },
  radiusButtonPressed: {
    opacity: 0.7,
  },
  radiusText: {
    marginLeft: 2,
  },
});
