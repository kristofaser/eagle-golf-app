/**
 * Hook useParcoursFavorite - Gestion des favoris pour les parcours
 *
 * Utilise le store Zustand pour une gestion synchrone et persistée des favoris parcours.
 * Similaire à useProFavorite mais pour les parcours de golf.
 */
import { useAppStore } from '@/stores/useAppStore';

/**
 * Hook pour gérer les favoris des parcours - connecté au store Zustand
 *
 * @param parcoursId - ID du parcours de golf
 * @returns {Object} État et actions pour les favoris
 */
export function useParcoursFavorite(parcoursId: string) {
  const { favoriteParcours, toggleFavoriteParcours } = useAppStore();

  return {
    /**
     * Indique si le parcours est dans les favoris
     */
    isFavorite: favoriteParcours.includes(parcoursId),

    /**
     * Toggle l'état favori du parcours
     * Ajoute ou retire le parcours des favoris
     */
    toggleFavorite: () => toggleFavoriteParcours(parcoursId),

    /**
     * Indique si une action de toggle est en cours
     * Toujours false avec Zustand (synchrone)
     */
    isToggling: false,
  };
}

/**
 * Hook pour obtenir des statistiques sur les favoris parcours
 *
 * @returns {Object} Statistiques des favoris parcours
 */
export function useParcoursFavoriteStats() {
  const { favoriteParcours } = useAppStore();

  return {
    /**
     * Nombre total de parcours en favoris
     */
    count: favoriteParcours.length,

    /**
     * Indique s'il y a des parcours en favoris
     */
    hasAny: favoriteParcours.length > 0,

    /**
     * Liste des IDs des parcours favoris
     */
    parcoursIds: favoriteParcours,
  };
}
