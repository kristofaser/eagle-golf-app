/**
 * Store UI - Gestion de l'état de l'interface utilisateur
 * États temporaires, modals, overlays, navigation
 */
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

interface UIState {
  // Modals et overlays
  activeModal: string | null;
  isFilterPanelOpen: boolean;

  // Loading states
  loadingStates: Record<string, boolean>;

  // Toast/Notifications
  toast: {
    message: string;
    type: 'success' | 'error' | 'info' | 'warning';
    visible: boolean;
  } | null;

  // Navigation
  activeTab: string;
  previousRoute: string | null;

  // Bottom Sheet
  bottomSheetState: {
    isOpen: boolean;
    content: 'filters' | 'booking' | 'calendar' | null;
    snapPoint: number;
  };

  // Actions
  setActiveModal: (modalId: string | null) => void;
  toggleFilterPanel: () => void;
  setLoading: (key: string, isLoading: boolean) => void;
  showToast: (message: string, type?: UIState['toast']['type']) => void;
  hideToast: () => void;
  setActiveTab: (tab: string) => void;
  setPreviousRoute: (route: string | null) => void;
  updateBottomSheet: (state: Partial<UIState['bottomSheetState']>) => void;
  closeBottomSheet: () => void;
  resetUI: () => void;
}

const initialState = {
  activeModal: null,
  isFilterPanelOpen: false,
  loadingStates: {},
  toast: null,
  activeTab: 'pros',
  previousRoute: null,
  bottomSheetState: {
    isOpen: false,
    content: null,
    snapPoint: 0,
  },
};

export const useUIStore = create<UIState>()(
  devtools(
    (set) => ({
      ...initialState,

      // Modals
      setActiveModal: (modalId) => set({ activeModal: modalId }),

      // Overlays
      toggleFilterPanel: () => set((state) => ({ isFilterPanelOpen: !state.isFilterPanelOpen })),

      // Loading
      setLoading: (key, isLoading) =>
        set((state) => ({
          loadingStates: {
            ...state.loadingStates,
            [key]: isLoading,
          },
        })),

      // Toast
      showToast: (message, type = 'info') =>
        set({
          toast: {
            message,
            type,
            visible: true,
          },
        }),

      hideToast: () => set({ toast: null }),

      // Navigation
      setActiveTab: (tab) => set({ activeTab: tab }),

      setPreviousRoute: (route) => set({ previousRoute: route }),

      // Bottom Sheet
      updateBottomSheet: (newState) =>
        set((state) => ({
          bottomSheetState: {
            ...state.bottomSheetState,
            ...newState,
          },
        })),

      closeBottomSheet: () =>
        set({
          bottomSheetState: {
            isOpen: false,
            content: null,
            snapPoint: 0,
          },
        }),

      // Reset
      resetUI: () => set(initialState),
    }),
    {
      name: 'UIStore',
    }
  )
);

// Sélecteurs optimisés
export const useActiveModal = () => useUIStore((state) => state.activeModal);
export const useIsFilterOpen = () => useUIStore((state) => state.isFilterPanelOpen);
export const useToast = () => useUIStore((state) => state.toast);
export const useActiveTab = () => useUIStore((state) => state.activeTab);
export const useBottomSheetState = () => useUIStore((state) => state.bottomSheetState);
export const useIsLoading = (key: string) =>
  useUIStore((state) => state.loadingStates[key] || false);
