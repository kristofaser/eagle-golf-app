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
import { useLocalSearchParams, useRouter } from 'expo-router';
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

export default function DivisionProListScreen() {
  const { division } = useLocalSearchParams<{ division: string }>();
  const router = useRouter();
  const { location: userLocation } = useGeolocation();

  // Charger tous les pros de la division
  const {
    data: prosData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['proProfiles', division],
    queryFn: async () => {
      const { data: pros, error: prosError } = await profileService.listProProfiles(
        {},
        { limit: 100 }
      );

      if (prosError) throw prosError;

      // Filtrer par division et enrichir avec les données
      const prosWithData = await Promise.all(
        (pros || [])
          .filter((pro) => {
            // Exception pour "Alps Tour & Pro Golf" : inclure "Alps Tour" et "Pro Golf"
            if (division === 'Alps Tour & Pro Golf') {
              return (
                pro.pro_profiles?.division === 'Alps Tour' ||
                pro.pro_profiles?.division === 'Pro Golf'
              );
            }
            return pro.pro_profiles?.division === division;
          })
          .map(async (pro) => {
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

  // Transformer les données
  const transformedPros = useMemo(() => {
    if (!prosData || prosData.length === 0) return [];

    return prosData
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
      .filter(Boolean) as JoueurData[];
  }, [prosData, userLocation]);

  const handleCardPress = (data: JoueurData) => {
    router.push(`/profile/${data.id}`);
  };

  const renderProItem = ({ item }: { item: JoueurData }) => (
    <View style={styles.cardContainer}>
      <ProCard
        data={item}
        onPress={handleCardPress}
        onCardPress={handleCardPress}
        isHidden={false}
        showDivisionBadge={false}
        onHover={(profileId) => {
          console.log(`📦 Préchargement du profil: ${profileId}`);
        }}
      />
    </View>
  );

  const Container = Platform.OS === 'web' ? View : SafeAreaView;

  if (isLoading) {
    return (
      <Container style={styles.container}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.closeButton}>
            <Ionicons name="close" size={28} color={Colors.text.charcoal} />
          </Pressable>
          <Text variant="h2" color="charcoal" style={styles.title}>
            {division}
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
            {division}
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
          {division}
        </Text>
        <View style={styles.closeButton} />
      </View>

      <View style={styles.countContainer}>
        <Text variant="body" color="course">
          {transformedPros.length} professionnel{transformedPros.length > 1 ? 's' : ''}
        </Text>
      </View>

      <FlatList
        data={transformedPros}
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
  },
});
