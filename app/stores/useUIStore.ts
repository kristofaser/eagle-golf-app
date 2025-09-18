/**
 * Store UI - Gestion de l'état de l'interface utilisateur
 * États temporaires, modals, overlays, navigation, notifications
 */
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

// Types pour le système de notifications
export interface NotificationUIItem {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message: string;
  data?: Record<string, any>;
  timestamp: Date;
  read: boolean;
  autoHide?: boolean;
  duration?: number;
}

interface UIState {
  // Modals et overlays
  activeModal: string | null;
  isFilterPanelOpen: boolean;

  // Loading states
  loadingStates: Record<string, boolean>;

  // Toast/Notifications (legacy)
  toast: {
    message: string;
    type: 'success' | 'error' | 'info' | 'warning';
    visible: boolean;
  } | null;

  // Système de notifications avancé
  notifications: {
    items: NotificationUIItem[];
    unreadCount: number;
    isVisible: boolean;
    maxItems: number;
  };

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

  // Actions notifications
  addNotification: (notification: Omit<NotificationUIItem, 'timestamp'>) => void;
  removeNotification: (id: string) => void;
  markNotificationAsRead: (id: string) => void;
  markAllNotificationsAsRead: () => void;
  clearNotifications: () => void;
  toggleNotificationPanel: () => void;
  setNotificationPanelVisible: (visible: boolean) => void;
  incrementUnreadCount: () => void;
  decrementUnreadCount: () => void;
  setUnreadCount: (count: number) => void;
}

const initialState = {
  activeModal: null,
  isFilterPanelOpen: false,
  loadingStates: {},
  toast: null,
  notifications: {
    items: [],
    unreadCount: 0,
    isVisible: false,
    maxItems: 50, // Limite pour éviter la surcharge mémoire
  },
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

      // Notifications
      addNotification: (notification) =>
        set((state) => {
          const newNotification: NotificationUIItem = {
            ...notification,
            timestamp: new Date(),
          };

          // Ajouter en début de liste et respecter la limite
          const newItems = [newNotification, ...state.notifications.items]
            .slice(0, state.notifications.maxItems);

          // Incrémenter le compteur seulement si non lue
          const newUnreadCount = notification.read
            ? state.notifications.unreadCount
            : state.notifications.unreadCount + 1;

          return {
            notifications: {
              ...state.notifications,
              items: newItems,
              unreadCount: newUnreadCount,
            },
          };
        }),

      removeNotification: (id) =>
        set((state) => {
          const notificationToRemove = state.notifications.items.find(n => n.id === id);
          const newItems = state.notifications.items.filter(n => n.id !== id);

          // Décrémenter le compteur si notification non lue supprimée
          const newUnreadCount = notificationToRemove && !notificationToRemove.read
            ? Math.max(0, state.notifications.unreadCount - 1)
            : state.notifications.unreadCount;

          return {
            notifications: {
              ...state.notifications,
              items: newItems,
              unreadCount: newUnreadCount,
            },
          };
        }),

      markNotificationAsRead: (id) =>
        set((state) => {
          const newItems = state.notifications.items.map(notification => {
            if (notification.id === id && !notification.read) {
              return { ...notification, read: true };
            }
            return notification;
          });

          // Calculer le nouveau nombre de non lues
          const newUnreadCount = newItems.filter(n => !n.read).length;

          return {
            notifications: {
              ...state.notifications,
              items: newItems,
              unreadCount: newUnreadCount,
            },
          };
        }),

      markAllNotificationsAsRead: () =>
        set((state) => ({
          notifications: {
            ...state.notifications,
            items: state.notifications.items.map(n => ({ ...n, read: true })),
            unreadCount: 0,
          },
        })),

      clearNotifications: () =>
        set((state) => ({
          notifications: {
            ...state.notifications,
            items: [],
            unreadCount: 0,
          },
        })),

      toggleNotificationPanel: () =>
        set((state) => ({
          notifications: {
            ...state.notifications,
            isVisible: !state.notifications.isVisible,
          },
        })),

      setNotificationPanelVisible: (visible) =>
        set((state) => ({
          notifications: {
            ...state.notifications,
            isVisible: visible,
          },
        })),

      incrementUnreadCount: () =>
        set((state) => ({
          notifications: {
            ...state.notifications,
            unreadCount: state.notifications.unreadCount + 1,
          },
        })),

      decrementUnreadCount: () =>
        set((state) => ({
          notifications: {
            ...state.notifications,
            unreadCount: Math.max(0, state.notifications.unreadCount - 1),
          },
        })),

      setUnreadCount: (count) =>
        set((state) => ({
          notifications: {
            ...state.notifications,
            unreadCount: Math.max(0, count),
          },
        })),
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

// Sélecteurs notifications
export const useNotifications = () => useUIStore((state) => state.notifications);
export const useNotificationItems = () => useUIStore((state) => state.notifications.items);
export const useUnreadCount = () => useUIStore((state) => state.notifications.unreadCount);
export const useNotificationPanelVisible = () => useUIStore((state) => state.notifications.isVisible);
export const useNotificationActions = () => useUIStore((state) => ({
  addNotification: state.addNotification,
  removeNotification: state.removeNotification,
  markNotificationAsRead: state.markNotificationAsRead,
  markAllNotificationsAsRead: state.markAllNotificationsAsRead,
  clearNotifications: state.clearNotifications,
  toggleNotificationPanel: state.toggleNotificationPanel,
  setNotificationPanelVisible: state.setNotificationPanelVisible,
  incrementUnreadCount: state.incrementUnreadCount,
  decrementUnreadCount: state.decrementUnreadCount,
  setUnreadCount: state.setUnreadCount,
}));
