import React from 'react';
import {
  View,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { Stack, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text, LoadingScreen } from '@/components/atoms';
import type { JoueurData } from '@/components/molecules/ContentCard';
import { ProCard } from '@/components/molecules/ProCard';
import { useFavorites } from '@/hooks/useFavorites';
import { Colors, Spacing, BorderRadius, Typography } from '@/constants/theme';
import { HugeiconsIcon } from '@hugeicons/react-native';
import {
  ArrowLeft01Icon,
  Search01Icon,
} from '@hugeicons/core-free-icons';
import { useQuery } from '@tanstack/react-query';
import { profileService } from '@/services/profile.service';
import { useAuth } from '@/hooks/useAuth';
import { useUser } from '@/hooks/useUser';
import { useTotalFavorites } from '@/hooks/useFavorites';

export default function FavoritesScreen() {
  const router = useRouter();
  const favorites = useFavorites();
  const { isAuthenticated } = useAuth();
  const { profile } = useUser();
  const totalFavorites = useTotalFavorites();


  // Récupérer les données des pros favoris
  const {
    data: prosData,
    isLoading,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ['favoriteProProfiles', favorites.ids],
    queryFn: async () => {
      if (favorites.ids.length === 0) return [];

      console.log('🔍 Favorite IDs to load:', favorites.ids);

      const profiles = await Promise.allSettled(
        favorites.ids.map((id) => profileService.getFullProfile(id))
      );

      const results = profiles
        .filter((result): result is PromiseFulfilledResult<any> => result.status === 'fulfilled')
        .map((result) => {
          const serviceResponse = result.value;

          // Vérifier si c'est une réponse de service avec erreur
          if (serviceResponse?.error) {
            console.log('❌ Service error for profile:', serviceResponse.error);
            return null;
          }

          const profile = serviceResponse?.data || serviceResponse;
          if (!profile) {
            console.log('❌ Profile is null/undefined');
            return null;
          }

          // Validation des données critiques
          if (!profile.id || (!profile.first_name && !profile.last_name)) {
            console.log('❌ Profile missing critical data:', profile.id);
            return null;
          }

          console.log('✅ Profile loaded:', {
            id: profile.id,
            name: `${profile.first_name || ''} ${profile.last_name || ''}`.trim(),
            avatar_url: profile.avatar_url,
            pro_profiles: profile.pro_profiles
          });

          return {
            id: profile.id,
            title: (() => {
              const firstName = profile.first_name || '';
              const lastName = profile.last_name || '';
              return firstName || lastName
                ? `${firstName} ${lastName}`.trim()
                : 'Profil Utilisateur';
            })(),
            imageUrl: profile.avatar_url || null,
            type: 'joueur' as const,
            age: 30,
            region: profile.city || 'Non spécifiée',
            handicap: 'Pro',
            scoreAverage: 72,
            specialite: 'Golf professionnel',
            styleJeu: 'Complet',
            experience: 10,
            circuits: profile.pro_profiles?.[0]?.division || 'Alps Tour',
            meilleurResultat: 'Victoire professionnelle',
            victoires: 1,
            tarif: '', // Sera r\u00e9cup\u00e9r\u00e9 depuis pro_pricing
            isPremium: false, // \u00c0 d\u00e9terminer selon les prix dans pro_pricing
            isAvailable: profile.pro_profiles?.[0]?.is_globally_available || false,
            division: profile.pro_profiles?.[0]?.division || 'Alps Tour',
            worldRanking: profile.pro_profiles?.[0]?.world_ranking || null,
            distance: 0,
          };
        })
        .filter(Boolean);

      return results;
    },
    enabled: favorites.hasAny,
    // Cache intelligent pour les favoris
    staleTime: 5 * 60 * 1000, // 5 minutes au lieu de 30
    gcTime: 15 * 60 * 1000, // 15 minutes de conservation
    // Validation des données
    select: (data) => {
      return data?.filter(item =>
        item &&
        item.title &&
        item.title !== 'undefined undefined'
      ) || [];
    },
  });

  const handleGoBack = () => {
    router.back();
  };


  const handleProPress = (proData: JoueurData) => {
    router.push(`/profile/${proData.id}`);
  };

  const renderProItem = ({ item }: { item: JoueurData }) => (
    <ProCard
      data={item}
      onPress={handleProPress}
      isHorizontal={true}
      showDivisionBadge={true}
      showDeleteButton={true}
    />
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconWrapper}>
        <Ionicons name="heart-outline" size={64} color={Colors.neutral.mist} />
      </View>
      <Text variant="h3" color="charcoal" weight="semiBold" style={styles.emptyTitle}>
        Aucun favori
      </Text>
      <Text variant="body" color="course" style={styles.emptyMessage}>
        Ajoutez des pros à vos favoris pour les retrouver rapidement ici
      </Text>
      <TouchableOpacity style={styles.browseButton} onPress={() => router.push('/(tabs)/pros')}>
        <Text variant="body" color="ball" weight="semiBold">
          Parcourir les pros
        </Text>
      </TouchableOpacity>
    </View>
  );

  const hasData = prosData && prosData.length > 0;

  const handleSearchPress = () => {
    router.push('/search');
  };

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen
        options={{
          headerShown: true,
          headerStyle: {
            backgroundColor: Colors.neutral.ball,
            elevation: 0,
            shadowOpacity: 0,
            borderBottomWidth: 1,
            borderBottomColor: Colors.neutral.mist,
          },
          headerTitleStyle: {
            fontFamily: Typography.fontFamily.primary,
            fontSize: Typography.fontSize.h2,
            fontWeight: Typography.fontWeight.bold,
            color: Colors.neutral.charcoal,
          },
          headerTitle: 'Mes Favoris',
          headerLeft: () => (
            <TouchableOpacity onPress={handleGoBack} style={{ marginLeft: 16 }}>
              <HugeiconsIcon icon={ArrowLeft01Icon} size={24} color={Colors.primary.accent} />
            </TouchableOpacity>
          ),
          headerRight: () => (
            <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: 16 }}>
              {/* Bouton Search */}
              <TouchableOpacity onPress={handleSearchPress}>
                <HugeiconsIcon icon={Search01Icon} size={24} color={Colors.primary.accent} />
              </TouchableOpacity>
            </View>
          ),
        }}
      />

      {/* Contenu */}
      <View style={styles.content}>
        {isLoading ? (
          <LoadingScreen message="Chargement de vos favoris..." />
        ) : hasData ? (
          <FlashList
            data={prosData}
            renderItem={renderProItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
            estimatedItemSize={120}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
            refreshControl={
              <RefreshControl
                refreshing={isRefetching}
                onRefresh={refetch}
                tintColor={Colors.primary.accent}
              />
            }
          />
        ) : (
          renderEmptyState()
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.neutral.background,
  },
  content: {
    flex: 1,
  },
  listContainer: {
    paddingTop: Spacing.m,
    paddingBottom: Spacing.xl,
  },
  separator: {
    height: Spacing.m,
    marginHorizontal: Spacing.m,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
  },
  emptyIconWrapper: {
    marginBottom: Spacing.l,
  },
  emptyTitle: {
    marginBottom: Spacing.s,
    textAlign: 'center',
  },
  emptyMessage: {
    textAlign: 'center',
    marginBottom: Spacing.l,
    lineHeight: 22,
  },
  browseButton: {
    backgroundColor: Colors.primary.accent,
    paddingHorizontal: Spacing.l,
    paddingVertical: Spacing.m,
    borderRadius: BorderRadius.round,
  },
});
