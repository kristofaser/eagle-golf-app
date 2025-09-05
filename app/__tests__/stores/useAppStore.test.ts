/**
 * Tests unitaires pour useAppStore
 */
import { renderHook, act } from '@testing-library/react-native';
import { useAppStore } from '@/stores/useAppStore';

describe('useAppStore', () => {
  beforeEach(() => {
    // Reset le store avant chaque test
    const { result } = renderHook(() => useAppStore());
    act(() => {
      result.current.resetStore();
    });
  });

  describe('Gestion des favoris', () => {
    it('devrait ajouter un pro aux favoris', () => {
      const { result } = renderHook(() => useAppStore());

      act(() => {
        result.current.toggleFavoritePro('pro-1');
      });

      expect(result.current.favoritePros).toContain('pro-1');
    });

    it('devrait retirer un pro des favoris', () => {
      const { result } = renderHook(() => useAppStore());

      act(() => {
        result.current.toggleFavoritePro('pro-1');
        result.current.toggleFavoritePro('pro-1');
      });

      expect(result.current.favoritePros).not.toContain('pro-1');
    });

    it('devrait ajouter un parcours aux favoris', () => {
      const { result } = renderHook(() => useAppStore());

      act(() => {
        result.current.toggleFavoriteParcours('parcours-1');
      });

      expect(result.current.favoriteParcours).toContain('parcours-1');
    });

    it('devrait gérer plusieurs favoris', () => {
      const { result } = renderHook(() => useAppStore());

      act(() => {
        result.current.toggleFavoritePro('pro-1');
        result.current.toggleFavoritePro('pro-2');
        result.current.toggleFavoriteParcours('parcours-1');
      });

      expect(result.current.favoritePros).toHaveLength(2);
      expect(result.current.favoriteParcours).toHaveLength(1);
    });
  });

  describe('Gestion de la recherche', () => {
    it('devrait mettre à jour la requête de recherche', () => {
      const { result } = renderHook(() => useAppStore());

      act(() => {
        result.current.setSearchQuery('golf paris');
      });

      expect(result.current.searchQuery).toBe('golf paris');
    });

    it('devrait effacer la requête de recherche', () => {
      const { result } = renderHook(() => useAppStore());

      act(() => {
        result.current.setSearchQuery('golf paris');
        result.current.setSearchQuery('');
      });

      expect(result.current.searchQuery).toBe('');
    });
  });

  describe('Gestion des filtres', () => {
    it('devrait mettre à jour les filtres', () => {
      const { result } = renderHook(() => useAppStore());

      act(() => {
        result.current.updateFilters({
          location: 'Paris',
          priceRange: [50, 200],
        });
      });

      expect(result.current.activeFilters.location).toBe('Paris');
      expect(result.current.activeFilters.priceRange).toEqual([50, 200]);
    });

    it('devrait fusionner les filtres existants', () => {
      const { result } = renderHook(() => useAppStore());

      act(() => {
        result.current.updateFilters({ location: 'Paris' });
        result.current.updateFilters({ rating: 4 });
      });

      expect(result.current.activeFilters).toEqual({
        location: 'Paris',
        rating: 4,
      });
    });

    it('devrait effacer tous les filtres', () => {
      const { result } = renderHook(() => useAppStore());

      act(() => {
        result.current.updateFilters({
          location: 'Paris',
          rating: 4,
        });
        result.current.clearFilters();
      });

      expect(result.current.activeFilters).toEqual({});
    });
  });

  describe('Gestion des préférences', () => {
    it('devrait avoir des préférences par défaut', () => {
      const { result } = renderHook(() => useAppStore());

      expect(result.current.preferences).toEqual({
        notificationsEnabled: true,
        locationEnabled: true,
        language: 'fr',
        theme: 'auto',
      });
    });

    it('devrait mettre à jour les préférences', () => {
      const { result } = renderHook(() => useAppStore());

      act(() => {
        result.current.updatePreferences({
          notificationsEnabled: false,
          theme: 'dark',
        });
      });

      expect(result.current.preferences.notificationsEnabled).toBe(false);
      expect(result.current.preferences.theme).toBe('dark');
      expect(result.current.preferences.language).toBe('fr'); // Inchangé
    });
  });

  describe('Reset du store', () => {
    it('devrait réinitialiser tout le store', () => {
      const { result } = renderHook(() => useAppStore());

      act(() => {
        // Modifier plusieurs valeurs
        result.current.toggleFavoritePro('pro-1');
        result.current.setSearchQuery('test');
        result.current.updateFilters({ location: 'Paris' });
        result.current.updatePreferences({ theme: 'dark' });

        // Reset
        result.current.resetStore();
      });

      expect(result.current.favoritePros).toHaveLength(0);
      expect(result.current.searchQuery).toBe('');
      expect(result.current.activeFilters).toEqual({});
      expect(result.current.preferences.theme).toBe('auto');
    });
  });
});
