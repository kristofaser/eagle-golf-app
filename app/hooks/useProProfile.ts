import { useQuery, useQueryClient } from '@tanstack/react-query';
import { profileService, FullProfile } from '@/services/profile.service';
import { bookingService, AvailabilityWithDetails } from '@/services/booking.service';
import { pricingService, ProPricing } from '@/services/pricing.service';
import { profileAggregatedService } from '@/services/profile-aggregated.service';
import { useAppStore } from '@/stores/useAppStore';
import { useAuth } from '@/hooks/useAuth';
import { logger } from '@/utils/logger';
import type { Router } from 'expo-router';

interface ProProfileData {
  profile: FullProfile;
  availabilities: AvailabilityWithDetails[];
  pricing: ProPricing[];
}

const STALE_TIME = 5 * 60 * 1000; // 5 minutes
const CACHE_TIME = 10 * 60 * 1000; // 10 minutes

// Hook principal pour récupérer toutes les données d'un profil pro
export function useProProfile(profileId: string, enabled = true) {
  const queryClient = useQueryClient();

  // Requête principale qui utilise le service agrégé optimisé
  const query = useQuery({
    queryKey: ['proProfile', profileId],
    queryFn: async (): Promise<ProProfileData> => {
      const startTime = Date.now();
      logger.dev(`🔄 Chargement du profil: ${profileId}`);

      // Utiliser le nouveau service agrégé pour une seule requête optimisée
      try {
        const aggregatedData = await profileAggregatedService.getAggregatedProProfile(profileId);
        const loadTime = Date.now() - startTime;
        logger.dev(`✅ Profil chargé en ${loadTime}ms (agrégé)`);

        return {
          profile: aggregatedData.profile,
          availabilities: aggregatedData.availabilities,
          pricing: aggregatedData.pricing,
        };
      } catch {
        // Fallback sur les appels séparés en cas d'erreur
        const [profileResult, availabilitiesResult, pricingResult] = await Promise.allSettled([
          profileService.getFullProfile(profileId),
          fetchAvailabilities(profileId),
          pricingService.getProPricing(profileId),
        ]);

        const profile = profileResult.status === 'fulfilled' ? profileResult.value.data : null;

        if (!profile) {
          throw new Error('Profil non trouvé');
        }

        const availabilities =
          availabilitiesResult.status === 'fulfilled' ? availabilitiesResult.value : [];

        const pricing = pricingResult.status === 'fulfilled' ? pricingResult.value : [];

        const loadTime = Date.now() - startTime;
        logger.dev(`⚠️ Profil chargé en ${loadTime}ms (fallback)`);

        return {
          profile,
          availabilities,
          pricing,
        };
      }
    },
    staleTime: STALE_TIME,
    gcTime: CACHE_TIME,
    enabled,
  });

  // Fonction pour précharger un profil
  const prefetchProfile = (targetProfileId: string) => {
    // Vérifier si déjà en cache
    const cached = queryClient.getQueryData(['proProfile', targetProfileId]);
    if (cached) {
      logger.dev(`💾 Profil ${targetProfileId} déjà en cache`);
      return;
    }

    logger.dev(`📦 Préchargement du profil: ${targetProfileId}`);
    void queryClient.prefetchQuery({
      queryKey: ['proProfile', targetProfileId],
      queryFn: async () => {
        const [profileResult, availabilitiesResult, pricingResult] = await Promise.allSettled([
          profileService.getFullProfile(targetProfileId),
          fetchAvailabilities(targetProfileId),
          pricingService.getProPricing(targetProfileId),
        ]);

        const profile = profileResult.status === 'fulfilled' ? profileResult.value.data : null;

        if (!profile) {
          throw new Error('Profil non trouvé');
        }

        const availabilities =
          availabilitiesResult.status === 'fulfilled' ? availabilitiesResult.value : [];

        const pricing = pricingResult.status === 'fulfilled' ? pricingResult.value : [];

        return { profile, availabilities, pricing };
      },
      staleTime: STALE_TIME,
    });
  };

  // Invalider le cache pour forcer le rechargement
  const invalidateProfile = () => {
    void queryClient.invalidateQueries({ queryKey: ['proProfile', profileId] });
  };

  return {
    data: query.data,
    profile: query.data?.profile,
    availabilities: query.data?.availabilities || [],
    pricing: query.data?.pricing || [],
    isLoading: query.isLoading,
    error: query.error,
    isError: query.isError,
    refetch: query.refetch,
    prefetchProfile,
    invalidateProfile,
  };
}

// Hook pour précharger plusieurs profils (utilisé dans la liste)
export function usePrefetchProfiles() {
  const queryClient = useQueryClient();

  const prefetchProfiles = async (profileIds: string[]) => {
    // Précharger jusqu'à 5 profils en parallèle
    const batchSize = 5;
    for (let i = 0; i < profileIds.length; i += batchSize) {
      const batch = profileIds.slice(i, i + batchSize);
      await Promise.allSettled(
        batch.map((id) =>
          queryClient.prefetchQuery({
            queryKey: ['proProfile', id],
            queryFn: async () => {
              const [profileResult] = await Promise.allSettled([profileService.getFullProfile(id)]);

              const profile =
                profileResult.status === 'fulfilled' ? profileResult.value.data : null;

              if (!profile) {
                throw new Error('Profil non trouvé');
              }

              // Pour le préchargement, on ne charge que le profil de base
              return {
                profile,
                availabilities: [],
                pricing: [],
              };
            },
            staleTime: STALE_TIME,
          })
        )
      );
    }
  };

  return { prefetchProfiles };
}

// Hook pour gérer les favoris des pros - connecté au store Zustand avec protection auth
export function useProFavorite(profileId: string, router?: Router, currentPath?: string) {
  const { favoritePros, toggleFavoritePro } = useAppStore();
  const { isAuthenticated } = useAuth();

  const handleToggleFavorite = () => {
    if (!isAuthenticated) {
      if (router && currentPath) {
        // Import dynamique pour éviter les erreurs de dépendance circulaire
        void import('@/utils/authAlerts').then(({ showFavoriteAuthAlert }) => {
          showFavoriteAuthAlert(router, currentPath);
        });
      }
      return;
    }

    // Utilisateur connecté, exécuter le toggle normalement
    toggleFavoritePro(profileId);
  };

  return {
    isFavorite: favoritePros.includes(profileId),
    toggleFavorite: handleToggleFavorite,
    isToggling: false, // Plus besoin d'état de loading avec Zustand
  };
}

// Fonction helper pour récupérer les disponibilités
async function fetchAvailabilities(profileId: string): Promise<AvailabilityWithDetails[]> {
  const startDate = new Date().toISOString().split('T')[0];
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + 7);

  const { data, error } = await bookingService.getProAvailabilities({
    proId: profileId,
    startDate,
    endDate: endDate.toISOString().split('T')[0],
    hasSlots: true,
  });

  if (error || !data) {
    return [];
  }

  return data;
}
