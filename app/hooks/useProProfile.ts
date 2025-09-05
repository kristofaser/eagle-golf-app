import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { profileService, FullProfile } from '@/services/profile.service';
import { bookingService, AvailabilityWithDetails } from '@/services/booking.service';
import { pricingService, ProPricing } from '@/services/pricing.service';
import {
  profileAggregatedService,
  AggregatedProProfile,
} from '@/services/profile-aggregated.service';

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
      console.log(`🔄 Chargement du profil: ${profileId}`);

      // Utiliser le nouveau service agrégé pour une seule requête optimisée
      try {
        const aggregatedData = await profileAggregatedService.getAggregatedProProfile(profileId);
        const loadTime = Date.now() - startTime;
        console.log(`✅ Profil chargé en ${loadTime}ms (agrégé)`);

        return {
          profile: aggregatedData.profile,
          availabilities: aggregatedData.availabilities,
          pricing: aggregatedData.pricing,
        };
      } catch (error) {
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
        console.log(`⚠️ Profil chargé en ${loadTime}ms (fallback)`);

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
  const prefetchProfile = async (targetProfileId: string) => {
    // Vérifier si déjà en cache
    const cached = queryClient.getQueryData(['proProfile', targetProfileId]);
    if (cached) {
      console.log(`💾 Profil ${targetProfileId} déjà en cache`);
      return;
    }

    console.log(`📦 Préchargement du profil: ${targetProfileId}`);
    await queryClient.prefetchQuery({
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
    queryClient.invalidateQueries({ queryKey: ['proProfile', profileId] });
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

// Hook pour gérer les favoris avec optimistic updates
export function useProFavorite(profileId: string) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (isFavorite: boolean) => {
      // TODO: Implémenter l'appel API pour sauvegarder le favori
      // Pour l'instant, on simule un délai
      await new Promise((resolve) => setTimeout(resolve, 500));
      return isFavorite;
    },
    onMutate: async (isFavorite) => {
      // Annuler les requêtes en cours
      await queryClient.cancelQueries({ queryKey: ['proFavorite', profileId] });

      // Sauvegarder l'état précédent
      const previousFavorite = queryClient.getQueryData(['proFavorite', profileId]);

      // Mise à jour optimiste
      queryClient.setQueryData(['proFavorite', profileId], isFavorite);

      return { previousFavorite };
    },
    onError: (err, isFavorite, context) => {
      // En cas d'erreur, restaurer l'état précédent
      if (context?.previousFavorite !== undefined) {
        queryClient.setQueryData(['proFavorite', profileId], context.previousFavorite);
      }
    },
    onSettled: () => {
      // Invalider pour s'assurer qu'on a les bonnes données
      queryClient.invalidateQueries({ queryKey: ['proFavorite', profileId] });
    },
  });

  const favoriteQuery = useQuery({
    queryKey: ['proFavorite', profileId],
    queryFn: async () => {
      // TODO: Récupérer l'état du favori depuis l'API
      return false;
    },
    staleTime: Infinity, // Les favoris ne deviennent jamais stale automatiquement
  });

  return {
    isFavorite: favoriteQuery.data ?? false,
    toggleFavorite: () => mutation.mutate(!favoriteQuery.data),
    isToggling: mutation.isPending,
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
