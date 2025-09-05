/**
 * Store Filtres - Gestion centralisée des filtres de recherche
 * Filtres spécifiques pour pros, parcours, voyages
 */
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface ProFilters {
  location?: {
    lat: number;
    lng: number;
    radius: number; // en km
  };
  priceRange?: [number, number];
  rating?: number; // minimum
  specialties?: string[];
  availability?: string[]; // jours de la semaine
  handicapRange?: [number, number];
  language?: string[];
  gender?: 'male' | 'female' | 'all';
}

interface ParcoursFilters {
  location?: {
    lat: number;
    lng: number;
    radius: number;
  };
  difficulty?: 'easy' | 'medium' | 'hard';
  holes?: 9 | 18;
  priceRange?: [number, number];
  rating?: number;
  amenities?: string[]; // practice, restaurant, proshop, etc.
}

interface VoyageFilters {
  destination?: string;
  dateRange?: [Date, Date];
  priceRange?: [number, number];
  duration?: number; // jours
  groupSize?: [number, number];
  level?: 'beginner' | 'intermediate' | 'advanced';
}

interface FilterState {
  // Filtres actifs par catégorie
  proFilters: ProFilters;
  parcoursFilters: ParcoursFilters;
  voyageFilters: VoyageFilters;

  // Filtres sauvegardés (presets)
  savedFilters: {
    name: string;
    type: 'pro' | 'parcours' | 'voyage';
    filters: ProFilters | ParcoursFilters | VoyageFilters;
  }[];

  // Historique de recherche
  searchHistory: {
    query: string;
    type: 'pro' | 'parcours' | 'voyage';
    timestamp: number;
  }[];

  // Actions
  updateProFilters: (filters: Partial<ProFilters>) => void;
  updateParcoursFilters: (filters: Partial<ParcoursFilters>) => void;
  updateVoyageFilters: (filters: Partial<VoyageFilters>) => void;
  clearProFilters: () => void;
  clearParcoursFilters: () => void;
  clearVoyageFilters: () => void;
  clearAllFilters: () => void;
  saveFilterPreset: (name: string, type: 'pro' | 'parcours' | 'voyage') => void;
  loadFilterPreset: (name: string) => void;
  deleteFilterPreset: (name: string) => void;
  addToSearchHistory: (query: string, type: 'pro' | 'parcours' | 'voyage') => void;
  clearSearchHistory: () => void;
}

const initialState = {
  proFilters: {},
  parcoursFilters: {},
  voyageFilters: {},
  savedFilters: [],
  searchHistory: [],
};

export const useFilterStore = create<FilterState>()(
  devtools(
    persist(
      (set, get) => ({
        ...initialState,

        // Update filters
        updateProFilters: (filters) =>
          set((state) => ({
            proFilters: { ...state.proFilters, ...filters },
          })),

        updateParcoursFilters: (filters) =>
          set((state) => ({
            parcoursFilters: { ...state.parcoursFilters, ...filters },
          })),

        updateVoyageFilters: (filters) =>
          set((state) => ({
            voyageFilters: { ...state.voyageFilters, ...filters },
          })),

        // Clear filters
        clearProFilters: () => set({ proFilters: {} }),
        clearParcoursFilters: () => set({ parcoursFilters: {} }),
        clearVoyageFilters: () => set({ voyageFilters: {} }),
        clearAllFilters: () =>
          set({
            proFilters: {},
            parcoursFilters: {},
            voyageFilters: {},
          }),

        // Preset management
        saveFilterPreset: (name, type) => {
          const state = get();
          let filters;

          switch (type) {
            case 'pro':
              filters = state.proFilters;
              break;
            case 'parcours':
              filters = state.parcoursFilters;
              break;
            case 'voyage':
              filters = state.voyageFilters;
              break;
          }

          set((state) => ({
            savedFilters: [
              ...state.savedFilters.filter((f) => f.name !== name),
              { name, type, filters },
            ],
          }));
        },

        loadFilterPreset: (name) => {
          const state = get();
          const preset = state.savedFilters.find((f) => f.name === name);

          if (preset) {
            switch (preset.type) {
              case 'pro':
                set({ proFilters: preset.filters as ProFilters });
                break;
              case 'parcours':
                set({ parcoursFilters: preset.filters as ParcoursFilters });
                break;
              case 'voyage':
                set({ voyageFilters: preset.filters as VoyageFilters });
                break;
            }
          }
        },

        deleteFilterPreset: (name) =>
          set((state) => ({
            savedFilters: state.savedFilters.filter((f) => f.name !== name),
          })),

        // Search history
        addToSearchHistory: (query, type) => {
          if (!query.trim()) return;

          set((state) => ({
            searchHistory: [
              { query, type, timestamp: Date.now() },
              ...state.searchHistory.filter((h) => h.query !== query).slice(0, 19), // Garder max 20 entrées
            ],
          }));
        },

        clearSearchHistory: () => set({ searchHistory: [] }),
      }),
      {
        name: 'eagle-filter-store',
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
        partialize: (state) => ({
          savedFilters: state.savedFilters,
          searchHistory: state.searchHistory.slice(0, 10), // Persister seulement les 10 derniers
        }),
      }
    ),
    {
      name: 'FilterStore',
    }
  )
);

// Sélecteurs optimisés
export const useProFilters = () => useFilterStore((state) => state.proFilters);
export const useParcoursFilters = () => useFilterStore((state) => state.parcoursFilters);
export const useVoyageFilters = () => useFilterStore((state) => state.voyageFilters);
export const useSavedFilters = () => useFilterStore((state) => state.savedFilters);
export const useSearchHistory = () => useFilterStore((state) => state.searchHistory);

// Hook pour vérifier si des filtres sont actifs
export const useHasActiveFilters = (type: 'pro' | 'parcours' | 'voyage') => {
  return useFilterStore((state) => {
    switch (type) {
      case 'pro':
        return Object.keys(state.proFilters).length > 0;
      case 'parcours':
        return Object.keys(state.parcoursFilters).length > 0;
      case 'voyage':
        return Object.keys(state.voyageFilters).length > 0;
      default:
        return false;
    }
  });
};
