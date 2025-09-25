/**
 * Store principal de l'application
 * Gère l'état global partagé entre les composants
 */
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface UserFavorites {
  favoritePros: string[];
  favoriteParcours: string[];
}

interface AppState {
  // Favoris par utilisateur
  userFavorites: Record<string, UserFavorites>;
  currentUserId: string | null;

  // Favoris pour l'utilisateur actuel (computed)
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

  // Actions de gestion utilisateur
  setCurrentUser: (userId: string | null) => void;
  loadUserFavorites: (userId: string) => void;
  clearCurrentUserFavorites: () => void;

  // Actions de favoris (basées sur l'utilisateur actuel)
  toggleFavoritePro: (proId: string) => void;
  toggleFavoriteParcours: (parcoursId: string) => void;

  // Actions générales
  setSearchQuery: (query: string) => void;
  updateFilters: (filters: Partial<AppState['activeFilters']>) => void;
  clearFilters: () => void;
  updatePreferences: (prefs: Partial<AppState['preferences']>) => void;
  resetStore: () => void;
}

const initialState = {
  userFavorites: {},
  currentUserId: null,
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

        // Gestion de l'utilisateur actuel
        setCurrentUser: (userId) =>
          set((state) => {
            if (userId === state.currentUserId) return state;

            const newState = { currentUserId: userId };

            if (userId && state.userFavorites[userId]) {
              // Charger les favoris de l'utilisateur
              return {
                ...newState,
                favoritePros: state.userFavorites[userId].favoritePros,
                favoriteParcours: state.userFavorites[userId].favoriteParcours,
              };
            } else {
              // Pas d'utilisateur ou pas de favoris = vider l'état actuel
              return {
                ...newState,
                favoritePros: [],
                favoriteParcours: [],
              };
            }
          }),

        // Charger les favoris d'un utilisateur spécifique
        loadUserFavorites: (userId) =>
          set((state) => {
            if (state.userFavorites[userId]) {
              return {
                currentUserId: userId,
                favoritePros: state.userFavorites[userId].favoritePros,
                favoriteParcours: state.userFavorites[userId].favoriteParcours,
              };
            }
            return {
              currentUserId: userId,
              favoritePros: [],
              favoriteParcours: [],
            };
          }),

        // Vider les favoris de l'utilisateur actuel (pour déconnexion)
        clearCurrentUserFavorites: () =>
          set({
            currentUserId: null,
            favoritePros: [],
            favoriteParcours: [],
          }),

        // Toggle favori pro (sauvegarde par utilisateur)
        toggleFavoritePro: (proId) =>
          set((state) => {
            if (!state.currentUserId) return state;

            const currentFavorites = state.favoritePros.includes(proId)
              ? state.favoritePros.filter((id) => id !== proId)
              : [...state.favoritePros, proId];

            return {
              favoritePros: currentFavorites,
              userFavorites: {
                ...state.userFavorites,
                [state.currentUserId]: {
                  ...state.userFavorites[state.currentUserId],
                  favoritePros: currentFavorites,
                  favoriteParcours:
                    state.userFavorites[state.currentUserId]?.favoriteParcours || [],
                },
              },
            };
          }),

        // Toggle favori parcours (sauvegarde par utilisateur)
        toggleFavoriteParcours: (parcoursId) =>
          set((state) => {
            if (!state.currentUserId) return state;

            const currentFavorites = state.favoriteParcours.includes(parcoursId)
              ? state.favoriteParcours.filter((id) => id !== parcoursId)
              : [...state.favoriteParcours, parcoursId];

            return {
              favoriteParcours: currentFavorites,
              userFavorites: {
                ...state.userFavorites,
                [state.currentUserId]: {
                  favoritePros: state.userFavorites[state.currentUserId]?.favoritePros || [],
                  favoriteParcours: currentFavorites,
                },
              },
            };
          }),

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
          getItem: async (name): Promise<AppState | null> => {
            const value = await AsyncStorage.getItem(name);
            return value ? (JSON.parse(value) as AppState) : null;
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
