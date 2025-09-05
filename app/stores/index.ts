/**
 * Export centralisé de tous les stores Zustand
 */

// Stores principaux
export {
  useAppStore,
  useFavoritePros,
  useFavoriteParcours,
  useSearchQuery,
  useActiveFilters,
  usePreferences,
} from './useAppStore';
export {
  useUIStore,
  useActiveModal,
  useIsSearchOpen,
  useIsFilterOpen,
  useToast,
  useActiveTab,
  useBottomSheetState,
  useIsLoading,
} from './useUIStore';
export {
  useFilterStore,
  useProFilters,
  useParcoursFilters,
  useVoyageFilters,
  useSavedFilters,
  useSearchHistory,
  useHasActiveFilters,
} from './useFilterStore';

// Types
export type { AppState } from './useAppStore';
export type { UIState } from './useUIStore';
export type { FilterState } from './useFilterStore';
