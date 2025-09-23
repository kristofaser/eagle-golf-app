import {
  StyleSheet,
  View,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { JoueurData } from '@/components/molecules/ContentCard';
import { ProCard } from '@/components/molecules/ProCard';
import { Colors, Spacing } from '@/constants/theme';
import { Text, LoadingScreen, ErrorScreen } from '@/components/atoms';
import { commonStyles } from '@/utils/commonStyles';
import { profileService } from '@/services/profile.service';
import { proAvailabilityService } from '@/services/pro-availability.service';
import { golfCourseService } from '@/services/golf-course.service';
import { useResponsiveCardSize } from '@/hooks/useResponsiveCardSize';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { useGeolocation } from '@/hooks/useGeolocation';
import { calculateDistance } from '@/utils/location';
import { PostGISPoint } from '@/types/location';

function ProsScreen() {
  const { isTablet } = useResponsiveCardSize();
  const router = useRouter();
  const { location: userLocation, isLoading: isLoadingLocation } = useGeolocation();

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

      // Récupérer les settings de disponibilité et les parcours affiliés pour chaque pro
      const prosWithAvailability = await Promise.all(
        (pros || []).map(async (pro) => {
          try {
            // La méthode getProAvailabilitySettings n'existe plus dans le nouveau système
            const settings = { is_globally_available: true };

            // Récupérer les parcours affiliés du pro
            let golfCourseLocation = null;
            if (pro.pro_profiles?.golf_course_id) {
              const { data: course } = await golfCourseService.getCourse(
                pro.pro_profiles.golf_course_id
              );
              if (course?.location) {
                golfCourseLocation = course.location;
              }
            }

            return {
              ...pro,
              availabilitySettings: settings,
              golfCourseLocation,
            };
          } catch (error) {
            console.warn(`⚠️ Impossible de récupérer les données pour ${pro.id}`);
            return {
              ...pro,
              availabilitySettings: null,
              golfCourseLocation: null,
            };
          }
        })
      );

      return prosWithAvailability;
    },
    staleTime: 1000 * 60 * 5, // Considérer les données comme fraîches pendant 5 minutes
    gcTime: 1000 * 60 * 10, // Garder en cache pendant 10 minutes
  });

  // Transformer les données des pros
  const { prosNearMe, prosByDivision } = useMemo(() => {
    if (!prosData || prosData.length === 0) {
      return {
        prosNearMe: [],
        prosByDivision: {
          'DP World Tour': [],
          'HotelPlanner Tour': [],
          'Ladies European Tour': [],
          'Circuit Français': [],
          'Challenge Tour': [],
          'Elite Tour': [],
          'Alps Tour': [],
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

        // Calculer la distance si on a la localisation de l'utilisateur et du parcours du pro
        let distance: number | undefined;
        if (userLocation && pro.golfCourseLocation) {
          const location = pro.golfCourseLocation as PostGISPoint;
          if (location.coordinates && Array.isArray(location.coordinates)) {
            const [longitude, latitude] = location.coordinates;
            distance = calculateDistance(
              userLocation.latitude,
              userLocation.longitude,
              latitude,
              longitude
            );
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
          rating: 4.5 + Math.random() * 0.5,
          isPremium: false, // \u00c0 d\u00e9terminer selon les prix dans pro_pricing
          isAvailable: pro.availabilitySettings?.is_globally_available ?? false,
          division: proProfile.division || 'Circuit Français',
          worldRanking: proProfile.world_ranking,
          distance,
        };
      })
      .filter(Boolean) as (JoueurData & { distance?: number })[]; // Filtrer les nulls

    // Pour "autour de moi", trier par distance si on a la localisation
    let nearMe: (JoueurData & { distance?: number })[];

    if (userLocation) {
      // Trier par distance croissante, en mettant ceux sans distance à la fin
      nearMe = [...transformedPros]
        .sort((a, b) => {
          if (a.distance === undefined && b.distance === undefined) return 0;
          if (a.distance === undefined) return 1;
          if (b.distance === undefined) return -1;
          return a.distance - b.distance;
        })
        .slice(0, 10);
    } else {
      // Sans géolocalisation, prendre ceux de Paris en priorité
      nearMe = [
        ...transformedPros.filter((p) => p.region === 'Paris'),
        ...transformedPros.filter((p) => p.region !== 'Paris'),
      ].slice(0, 10);
    }

    // Diviser les pros par division
    const divisionGroups: { [key: string]: JoueurData[] } = {
      'DP World Tour': [],
      'HotelPlanner Tour': [],
      'Ladies European Tour': [],
      'Circuit Français': [],
      'Challenge Tour': [],
      'Elite Tour': [],
      'Alps Tour': [],
    };

    // Grouper les pros par division
    prosWithAvailability.forEach((pro) => {
      const proProfile = pro.pro_profiles;
      if (!proProfile) return;

      const division = proProfile.division || 'Circuit Français';
      const transformedPro = transformedPros.find((p) => p.id === pro.id);

      if (transformedPro && divisionGroups[division]) {
        divisionGroups[division].push(transformedPro);
      }
    });

    // Limiter à 10 pros par division
    Object.keys(divisionGroups).forEach((division) => {
      divisionGroups[division] = divisionGroups[division].slice(0, 10);
    });

    return {
      prosNearMe: nearMe,
      prosByDivision: divisionGroups,
    };
  }, [prosData]);

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

  return (
    <SafeAreaView style={styles.container} edges={[]}>
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
          </View>
          {prosNearMe.length > 0 ? (
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
              initialNumToRender={3}
              maxToRenderPerBatch={2}
              removeClippedSubviews={true}
              snapToInterval={CARD_WIDTH + CARD_SPACING}
              snapToAlignment="start"
              decelerationRate="fast"
            />
          ) : (
            <View style={styles.emptyState}>
              <Text variant="body" color="course">
                Aucun professionnel à proximité
              </Text>
            </View>
          )}
        </View>

        {/* Sections par division */}
        {Object.entries(prosByDivision).map(([division, pros]) => {
          // Ne pas afficher les divisions sans pros
          if (pros.length === 0) return null;

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
                initialNumToRender={3}
                maxToRenderPerBatch={2}
                removeClippedSubviews={true}
                snapToInterval={CARD_WIDTH + CARD_SPACING}
                snapToAlignment="start"
                decelerationRate="fast"
              />
            </View>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

export default ProsScreen;

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
});
