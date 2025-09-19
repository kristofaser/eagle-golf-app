/**
 * Hook useFavorites - Hook pour la gestion des favoris pros
 *
 * Centralise la gestion des favoris pour les pros uniquement.
 * Utilisé principalement dans l'écran favoris.
 */
import { useAppStore } from '@/stores/useAppStore';

/**
 * Hook pour obtenir des statistiques et actions sur les favoris pros
 *
 * @returns {Object} Statistiques et actions pour les favoris pros
 */
export function useFavorites() {
  const { favoritePros, toggleFavoritePro } = useAppStore();

  return {
    // Statistiques
    count: favoritePros.length,
    hasAny: favoritePros.length > 0,
    ids: favoritePros,

    // Actions
    actions: {
      /**
       * Retire un pro des favoris
       */
      removeProFavorite: (proId: string) => {
        if (favoritePros.includes(proId)) {
          toggleFavoritePro(proId);
        }
      },

      /**
       * Efface tous les favoris pros
       */
      clearAllFavorites: () => {
        // Toggle tous les pros favoris pour les retirer
        favoritePros.forEach(proId => toggleFavoritePro(proId));
      },
    },
  };
}

/**
 * Hook simple pour obtenir le nombre total de favoris pros
 * Utile pour le badge du header
 *
 * @returns {number} Nombre total de favoris pros
 */
export function useTotalFavorites() {
  const { favoritePros } = useAppStore();
  return favoritePros.length;
}