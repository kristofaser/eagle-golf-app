/**
 * Hook useParcoursFavorite - Gestion des favoris pour les parcours
 *
 * Utilise le store Zustand pour une gestion synchrone et persistée des favoris parcours.
 * Similaire à useProFavorite mais pour les parcours de golf.
 */
import { useAppStore } from '@/stores/useAppStore';
import { useAuth } from '@/hooks/useAuth';
import type { Router } from 'expo-router';

/**
 * Hook pour gérer les favoris des parcours - connecté au store Zustand avec protection auth
 *
 * @param parcoursId - ID du parcours de golf
 * @param router - Expo router instance for navigation (optional)
 * @param currentPath - Current path for returnTo parameter (optional)
 * @returns {Object} État et actions pour les favoris
 */
export function useParcoursFavorite(parcoursId: string, router?: Router, currentPath?: string) {
  const { favoriteParcours, toggleFavoriteParcours } = useAppStore();
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
    toggleFavoriteParcours(parcoursId);
  };

  return {
    /**
     * Indique si le parcours est dans les favoris
     */
    isFavorite: favoriteParcours.includes(parcoursId),

    /**
     * Toggle l'état favori du parcours
     * Ajoute ou retire le parcours des favoris
     */
    toggleFavorite: handleToggleFavorite,

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
