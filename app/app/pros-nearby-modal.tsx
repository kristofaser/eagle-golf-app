import {
  StyleSheet,
  View,
  FlatList,
  Platform,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useMemo } from 'react';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { JoueurData } from '@/components/molecules/ContentCard';
import { ProCard } from '@/components/molecules/ProCard';
import { Colors, Spacing } from '@/constants/theme';
import { Text, ErrorScreen } from '@/components/atoms';
import { commonStyles } from '@/utils/commonStyles';
import { profileService } from '@/services/profile.service';
import { golfCourseService } from '@/services/golf-course.service';
import { useGeolocation } from '@/hooks/useGeolocation';
import { calculateDistance } from '@/utils/location';
import { PostGISPoint } from '@/types/location';
import { Ionicons } from '@expo/vector-icons';

export default function NearbyProsScreen() {
  const router = useRouter();
  const { location: userLocation, isLoading: isLoadingLocation } = useGeolocation();

  // Charger tous les pros
  const {
    data: prosData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['proProfiles', 'nearby'],
    queryFn: async () => {
      const { data: pros, error: prosError } = await profileService.listProProfiles(
        {},
        { limit: 100 }
      );

      if (prosError) throw prosError;

      // Enrichir avec les données de localisation
      const prosWithData = await Promise.all(
        (pros || []).map(async (pro) => {
          try {
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
              golfCourseLocation,
            };
          } catch (error) {
            return {
              ...pro,
              golfCourseLocation: null,
            };
          }
        })
      );

      return prosWithData;
    },
    staleTime: 1000 * 60 * 5,
  });

  // Transformer et trier les pros par distance
  const sortedPros = useMemo(() => {
    if (!prosData || prosData.length === 0) return [];

    const transformedPros = prosData
      .map((pro) => {
        const proProfile = pro.pro_profiles;
        if (!proProfile) return null;

        const specialties = proProfile.specialties || [];
        const playStyle = proProfile.play_style || [];

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
          tarif: '120€',
          isPremium: false,
          isAvailable: true,
          division: proProfile.division || 'Circuit FR',
          worldRanking: proProfile.world_ranking,
          distance,
        };
      })
      .filter(Boolean) as (JoueurData & { distance?: number })[];

    // Trier par distance si on a la géolocalisation
    if (userLocation) {
      return transformedPros.sort((a, b) => {
        if (a.distance === undefined && b.distance === undefined) return 0;
        if (a.distance === undefined) return 1;
        if (b.distance === undefined) return -1;
        return a.distance - b.distance;
      });
    }

    // Sinon, prendre ceux de Paris en priorité
    return [
      ...transformedPros.filter((p) => p.region === 'Paris'),
      ...transformedPros.filter((p) => p.region !== 'Paris'),
    ];
  }, [prosData, userLocation]);

  const handleCardPress = (data: JoueurData) => {
    router.push(`/profile/${data.id}`);
  };

  const renderProItem = ({ item }: { item: JoueurData & { distance?: number } }) => (
    <View style={styles.cardContainer}>
      <ProCard
        data={item}
        onPress={handleCardPress}
        onCardPress={handleCardPress}
        isHidden={false}
        showDivisionBadge={true}
        onHover={(profileId) => {
          console.log(`📦 Préchargement du profil: ${profileId}`);
        }}
      />
      {item.distance !== undefined && (
        <View style={styles.distanceBadge}>
          <Ionicons name="location-outline" size={14} color={Colors.primary.accent} />
          <Text variant="caption" color="iron" style={styles.distanceText}>
            {item.distance < 1
              ? `${Math.round(item.distance * 1000)}m`
              : `${item.distance.toFixed(1)}km`}
          </Text>
        </View>
      )}
    </View>
  );

  const Container = Platform.OS === 'web' ? View : SafeAreaView;

  if (isLoading || isLoadingLocation) {
    return (
      <Container style={styles.container}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.closeButton}>
            <Ionicons name="close" size={28} color={Colors.text.charcoal} />
          </Pressable>
          <Text variant="h2" color="charcoal" style={styles.title}>
            Autour de moi
          </Text>
          <View style={styles.closeButton} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary.accent} />
        </View>
      </Container>
    );
  }

  if (error) {
    return (
      <Container style={styles.container}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.closeButton}>
            <Ionicons name="close" size={28} color={Colors.text.charcoal} />
          </Pressable>
          <Text variant="h2" color="charcoal" style={styles.title}>
            Autour de moi
          </Text>
          <View style={styles.closeButton} />
        </View>
        <ErrorScreen error={error.message || 'Une erreur est survenue'} onRetry={() => {}} />
      </Container>
    );
  }

  return (
    <Container style={styles.container} edges={Platform.OS === 'web' ? undefined : []}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.closeButton}>
          <Ionicons name="close" size={28} color={Colors.text.charcoal} />
        </Pressable>
        <Text variant="h2" color="charcoal" style={styles.title}>
          Autour de moi
        </Text>
        <View style={styles.closeButton} />
      </View>

      <View style={styles.countContainer}>
        <Text variant="body" color="course">
          {sortedPros.length} professionnel{sortedPros.length > 1 ? 's' : ''}
          {userLocation ? ' triés par distance' : ' dans votre région'}
        </Text>
      </View>

      <FlatList
        data={sortedPros}
        renderItem={renderProItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        numColumns={2}
        columnWrapperStyle={styles.columnWrapper}
      />
    </Container>
  );
}

const styles = StyleSheet.create({
  container: {
    ...commonStyles.container,
    backgroundColor: Colors.background.cream,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.m,
    paddingVertical: Spacing.m,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
    backgroundColor: Colors.background.cream,
  },
  closeButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    flex: 1,
    textAlign: 'center',
  },
  countContainer: {
    paddingHorizontal: Spacing.m,
    paddingVertical: Spacing.s,
    alignItems: 'center',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    padding: Spacing.m,
    paddingBottom: Spacing.xl,
  },
  columnWrapper: {
    justifyContent: 'space-between',
    gap: Spacing.m,
  },
  cardContainer: {
    flex: 1,
    maxWidth: '48%',
    position: 'relative',
  },
  distanceBadge: {
    position: 'absolute',
    top: Spacing.s,
    right: Spacing.s,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background.white,
    paddingHorizontal: Spacing.xs,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
    shadowColor: Colors.shadows.dark,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  distanceText: {
    fontSize: 11,
  },
});
