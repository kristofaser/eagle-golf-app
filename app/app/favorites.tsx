/**
 * FavoritesScreen - Écran de gestion des favoris pros
 *
 * Écran principal pour afficher et gérer les favoris pros.
 * Liste simple avec possibilité de supprimer et naviguer.
 */
import React from 'react';
import {
  View,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text, LoadingScreen } from '@/components/atoms';
import { ProCard } from '@/components/molecules';
import type { JoueurData } from '@/components/molecules/ContentCard';
import { useFavorites } from '@/hooks/useFavorites';
import { Colors, Spacing, Typography } from '@/constants/theme';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { ArrowLeft01Icon, Delete01Icon } from '@hugeicons/core-free-icons';
import { useQuery } from '@tanstack/react-query';
import { profileService } from '@/services/profile.service';

export default function FavoritesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const favorites = useFavorites();

  // Récupérer les données des pros favoris
  const { data: prosData, isLoading } = useQuery({
    queryKey: ['favoriteProProfiles', favorites.ids],
    queryFn: async () => {
      if (favorites.ids.length === 0) return [];

      // Récupérer les profils pros un par un
      const profiles = await Promise.allSettled(
        favorites.ids.map(id => profileService.getFullProfile(id))
      );

      const results = profiles
        .filter((result): result is PromiseFulfilledResult<any> => result.status === 'fulfilled')
        .map(result => {
          const profile = result.value?.data || result.value;
          if (!profile) return null;

          // Transformer les données du profil en format JoueurData
          return {
            id: profile.id,
            title: `${profile.first_name} ${profile.last_name}`,
            imageUrl: profile.avatar_url || '',
            type: 'joueur' as const,
            age: 30, // Valeur par défaut si pas d'âge
            region: profile.city || 'Non spécifié',
            handicap: 'Pro',
            scoreAverage: 72,
            specialite: 'Golf professionnel',
            styleJeu: 'Complet',
            experience: 10,
            circuits: profile.pro_profiles?.division || 'Alps Tour',
            meilleurResultat: 'Victoire professionnelle',
            victoires: 1,
            tarif: '150€/h',
            rating: 4.8,
            isPremium: true,
            isAvailable: profile.pro_profiles?.is_globally_available || false,
            division: profile.pro_profiles?.division || 'Alps Tour',
            worldRanking: profile.pro_profiles?.world_ranking || 2500,
            distance: 0,
          };
        })
        .filter(Boolean);

      return results;
    },
    enabled: favorites.hasAny,
  });

  const handleGoBack = () => {
    router.back();
  };

  const handleClearAllFavorites = () => {
    Alert.alert(
      'Effacer tous les favoris',
      'Êtes-vous sûr de vouloir supprimer tous vos pros favoris ? Cette action est irréversible.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Effacer',
          style: 'destructive',
          onPress: () => favorites.actions.clearAllFavorites(),
        },
      ]
    );
  };

  const handleProPress = (proData: JoueurData) => {
    router.push(`/profile/${proData.id}`);
  };


  const renderProItem = ({ item }: { item: JoueurData }) => (
    <View style={styles.cardContainer}>
      <ProCard
        data={item}
        onPress={handleProPress}
        showDivisionBadge={true}
      />
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyTitle}>Aucun pro favori</Text>
      <Text style={styles.emptyMessage}>
        Ajoutez des pros à vos favoris en appuyant sur le cœur dans leur carte.
      </Text>
    </View>
  );

  const hasData = prosData && prosData.length > 0;

  return (
    <SafeAreaView style={[styles.container, { paddingTop: insets.top }]}>
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />

      {/* Header personnalisé */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleGoBack}>
          <HugeiconsIcon icon={ArrowLeft01Icon} size={24} color={Colors.primary.accent} />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Pros Favoris</Text>

        <TouchableOpacity
          style={[styles.clearButton, !favorites.hasAny && styles.clearButtonHidden]}
          onPress={handleClearAllFavorites}
          disabled={!favorites.hasAny}
        >
          {favorites.hasAny && (
            <HugeiconsIcon icon={Delete01Icon} size={20} color={'#ef4444'} />
          )}
        </TouchableOpacity>
      </View>

      {/* Contenu principal */}
      <View style={styles.content}>
        {isLoading ? (
          <LoadingScreen />
        ) : hasData ? (
          <FlatList
            data={prosData}
            renderItem={renderProItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
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
    backgroundColor: Colors.neutral.ball,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.neutral.ball,
    elevation: 0,
    shadowOpacity: 0,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral.mist,
  },
  backButton: {
    padding: Spacing.xs,
  },
  headerTitle: {
    fontFamily: Typography.fontFamily.primary,
    fontSize: Typography.fontSize.h2,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.neutral.charcoal,
  },
  clearButton: {
    padding: Spacing.xs,
  },
  clearButtonHidden: {
    opacity: 0,
  },
  content: {
    flex: 1,
    paddingTop: Spacing.md,
  },
  listContainer: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
  },
  cardContainer: {
    marginBottom: Spacing.md,
    marginHorizontal: Spacing.xs,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
  },
  emptyTitle: {
    fontSize: Typography.fontSize.h2,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.neutral.course,
    fontFamily: Typography.fontFamily.primary,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  emptyMessage: {
    fontSize: Typography.fontSize.body,
    color: Colors.neutral.course,
    fontFamily: Typography.fontFamily.primary,
    textAlign: 'center',
    lineHeight: 22,
  },
});