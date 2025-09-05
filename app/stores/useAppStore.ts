/**
 * Store principal de l'application
 * Gère l'état global partagé entre les composants
 */
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AppState {
  // Favoris
  favoritePros: string[];
  favoriteParcours: string[];

  // Recherche et filtres globaux
  searchQuery: string;
  activeFilters: {
    location?: string;
    priceRange?: [number, number];
    rating?: number;
    availability?: string[];
  };

  // Préférences utilisateur
  preferences: {
    notificationsEnabled: boolean;
    locationEnabled: boolean;
    language: 'fr' | 'en';
    theme: 'light' | 'dark' | 'auto';
  };

  // Actions
  toggleFavoritePro: (proId: string) => void;
  toggleFavoriteParcours: (parcoursId: string) => void;
  setSearchQuery: (query: string) => void;
  updateFilters: (filters: Partial<AppState['activeFilters']>) => void;
  clearFilters: () => void;
  updatePreferences: (prefs: Partial<AppState['preferences']>) => void;
  resetStore: () => void;
}

const initialState = {
  favoritePros: [],
  favoriteParcours: [],
  searchQuery: '',
  activeFilters: {},
  preferences: {
    notificationsEnabled: true,
    locationEnabled: true,
    language: 'fr' as const,
    theme: 'auto' as const,
  },
};

export const useAppStore = create<AppState>()(
  devtools(
    persist(
      (set) => ({
        ...initialState,

        // Toggle favori pro
        toggleFavoritePro: (proId) =>
          set((state) => ({
            favoritePros: state.favoritePros.includes(proId)
              ? state.favoritePros.filter((id) => id !== proId)
              : [...state.favoritePros, proId],
          })),

        // Toggle favori parcours
        toggleFavoriteParcours: (parcoursId) =>
          set((state) => ({
            favoriteParcours: state.favoriteParcours.includes(parcoursId)
              ? state.favoriteParcours.filter((id) => id !== parcoursId)
              : [...state.favoriteParcours, parcoursId],
          })),

        // Recherche
        setSearchQuery: (query) => set({ searchQuery: query }),

        // Filtres
        updateFilters: (filters) =>
          set((state) => ({
            activeFilters: { ...state.activeFilters, ...filters },
          })),

        clearFilters: () => set({ activeFilters: {} }),

        // Préférences
        updatePreferences: (prefs) =>
          set((state) => ({
            preferences: { ...state.preferences, ...prefs },
          })),

        // Reset complet
        resetStore: () => set(initialState),
      }),
      {
        name: 'eagle-app-store',
        storage: {
          getItem: async (name) => {
            const value = await AsyncStorage.getItem(name);
            return value ? JSON.parse(value) : null;
          },
          setItem: async (name, value) => {
            await AsyncStorage.setItem(name, JSON.stringify(value));
          },
          removeItem: async (name) => {
            await AsyncStorage.removeItem(name);
          },
        },
      }
    ),
    {
      name: 'AppStore',
    }
  )
);

// Sélecteurs pour optimisation
export const useFavoritePros = () => useAppStore((state) => state.favoritePros);
export const useFavoriteParcours = () => useAppStore((state) => state.favoriteParcours);
export const useSearchQuery = () => useAppStore((state) => state.searchQuery);
export const useActiveFilters = () => useAppStore((state) => state.activeFilters);
export const usePreferences = () => useAppStore((state) => state.preferences);
