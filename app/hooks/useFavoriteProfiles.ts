import { useQuery } from '@tanstack/react-query';
import { useFavoritePros } from '@/stores/useAppStore';
import { profileService } from '@/services/profile.service';

export interface FavoriteProProfile {
  id: string;
  first_name: string;
  last_name: string;
  avatar_url: string | null;
  division?: string;
  title: string;
  imageUrl: string | null;
}

/**
 * Hook pour récupérer les profils complets des pros favoris
 * Utilise maintenant le service unifié pour la cohérence
 */
export function useFavoriteProfiles() {
  const favoritePros = useFavoritePros();

  return useQuery({
    queryKey: ['favoriteProProfiles', favoritePros],
    queryFn: async (): Promise<FavoriteProProfile[]> => {
      if (favoritePros.length === 0) {
        return [];
      }

      // Utiliser le même service que favorites.tsx pour la cohérence
      const profiles = await Promise.allSettled(
        favoritePros.map((id) => profileService.getFullProfile(id))
      );

      const results = profiles
        .filter((result): result is PromiseFulfilledResult<unknown> => result.status === 'fulfilled')
        .map((result) => {
          const serviceResponse = result.value as { data?: unknown; error?: unknown } | unknown;

          // Vérifier si c'est une réponse de service avec erreur
          if (serviceResponse && typeof serviceResponse === 'object' && 'error' in serviceResponse && serviceResponse.error) {
            return null;
          }

          const profile = (serviceResponse && typeof serviceResponse === 'object' && 'data' in serviceResponse)
            ? serviceResponse.data
            : serviceResponse;

          if (!profile || typeof profile !== 'object') {
            return null;
          }

          const profileData = profile as {
            id?: string;
            first_name?: string;
            last_name?: string;
            avatar_url?: string;
            pro_profiles?: Array<{ division?: string }>;
          };

          // Validation des données critiques
          if (!profileData.id || (!profileData.first_name && !profileData.last_name)) {
            return null;
          }

          return {
            id: profileData.id,
            first_name: profileData.first_name || '',
            last_name: profileData.last_name || '',
            avatar_url: profileData.avatar_url || null,
            // CORRECTION : Utiliser la structure tableau comme dans favorites.tsx
            division: profileData.pro_profiles?.[0]?.division || undefined,
            title: (() => {
              const firstName = profileData.first_name || '';
              const lastName = profileData.last_name || '';
              return firstName || lastName
                ? `${firstName} ${lastName}`.trim()
                : 'Profil Utilisateur';
            })(),
            imageUrl: profileData.avatar_url || null,
          };
        })
        .filter(Boolean);

      return results;
    },
    enabled: favoritePros.length > 0,
    // Utiliser les mêmes paramètres de cache que favorites.tsx
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes de conservation
  });
}