import { QueryClient } from '@tanstack/react-query';
import { Platform } from 'react-native';

/**
 * Configuration par défaut pour React Query
 */
const defaultOptions = {
  queries: {
    // Durée de cache par défaut augmentée (30 minutes)
    staleTime: 30 * 60 * 1000,
    // Durée de conservation en cache augmentée (1 heure)
    gcTime: 60 * 60 * 1000,
    // Retry automatique en cas d'erreur
    retry: (failureCount: number, error: Error & { status?: number }) => {
      // Ne pas retry sur les erreurs 4xx
      if (error?.status >= 400 && error?.status < 500) {
        return false;
      }
      // Maximum 3 retries
      return failureCount < 3;
    },
    // Délai entre les retries (exponential backoff)
    retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 30000),
    // Refetch on reconnect
    refetchOnReconnect: true,
    // Refetch on window focus désactivé sur mobile pour économiser des requêtes
    refetchOnWindowFocus: false,
  },
  mutations: {
    // Retry pour les mutations
    retry: 1,
    // Délai de retry
    retryDelay: 1000,
  },
};

/**
 * Instance du QueryClient
 */
export const queryClient = new QueryClient({
  defaultOptions,
});

/**
 * Clés de cache standardisées
 */
export const queryKeys = {
  // Auth
  auth: {
    all: ['auth'] as const,
    session: () => [...queryKeys.auth.all, 'session'] as const,
    user: () => [...queryKeys.auth.all, 'user'] as const,
  },

  // Profiles
  profiles: {
    all: ['profiles'] as const,
    lists: () => [...queryKeys.profiles.all, 'list'] as const,
    list: (filters?: Record<string, unknown>) => [...queryKeys.profiles.lists(), filters] as const,
    details: () => [...queryKeys.profiles.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.profiles.details(), id] as const,
  },

  // Bookings
  bookings: {
    all: ['bookings'] as const,
    lists: () => [...queryKeys.bookings.all, 'list'] as const,
    list: (filters?: Record<string, unknown>) => [...queryKeys.bookings.lists(), filters] as const,
    details: () => [...queryKeys.bookings.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.bookings.details(), id] as const,
    userBookings: (userId: string) => [...queryKeys.bookings.all, 'user', userId] as const,
    proBookings: (proId: string) => [...queryKeys.bookings.all, 'pro', proId] as const,
  },

  // Parcours
  parcours: {
    all: ['parcours'] as const,
    lists: () => [...queryKeys.parcours.all, 'list'] as const,
    list: (filters?: Record<string, unknown>) => [...queryKeys.parcours.lists(), filters] as const,
    details: () => [...queryKeys.parcours.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.parcours.details(), id] as const,
    nearby: (lat: number, lng: number, radius: number) =>
      [...queryKeys.parcours.all, 'nearby', { lat, lng, radius }] as const,
    favorites: (userId: string) => [...queryKeys.parcours.all, 'favorites', userId] as const,
  },

  // Pro profiles
  pros: {
    all: ['pros'] as const,
    lists: () => [...queryKeys.pros.all, 'list'] as const,
    list: (filters?: Record<string, unknown>) => [...queryKeys.pros.lists(), filters] as const,
    details: () => [...queryKeys.pros.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.pros.details(), id] as const,
    availabilities: (proId: string) => [...queryKeys.pros.all, 'availabilities', proId] as const,
    reviews: (proId: string) => [...queryKeys.pros.all, 'reviews', proId] as const,
    stats: (proId: string) => [...queryKeys.pros.all, 'stats', proId] as const,
  },

  // Notifications
  notifications: {
    all: ['notifications'] as const,
    lists: () => [...queryKeys.notifications.all, 'list'] as const,
    list: (userId: string) => [...queryKeys.notifications.lists(), userId] as const,
    unread: (userId: string) => [...queryKeys.notifications.all, 'unread', userId] as const,
  },

  // Messages
  messages: {
    all: ['messages'] as const,
    conversations: (userId: string) =>
      [...queryKeys.messages.all, 'conversations', userId] as const,
    messages: (conversationId: string) =>
      [...queryKeys.messages.all, 'messages', conversationId] as const,
  },

  // Search
  search: {
    all: ['search'] as const,
    results: (query: string, filters?: Record<string, unknown>) => [...queryKeys.search.all, query, filters] as const,
    suggestions: (query: string) => [...queryKeys.search.all, 'suggestions', query] as const,
  },
};

/**
 * Helper pour invalider les caches
 */
export const invalidateQueries = {
  // Invalider tout le cache d'une entité
  all: (entity: keyof typeof queryKeys) => {
    queryClient.invalidateQueries({ queryKey: queryKeys[entity].all });
  },

  // Invalider un détail spécifique
  detail: (entity: 'profiles' | 'bookings' | 'parcours' | 'pros', id: string) => {
    queryClient.invalidateQueries({ queryKey: queryKeys[entity].detail(id) });
  },

  // Invalider les listes
  lists: (entity: 'profiles' | 'bookings' | 'parcours' | 'pros') => {
    queryClient.invalidateQueries({ queryKey: queryKeys[entity].lists() });
  },

  // Invalider plusieurs entités
  multiple: (entities: Array<keyof typeof queryKeys>) => {
    entities.forEach((entity) => {
      queryClient.invalidateQueries({ queryKey: queryKeys[entity].all });
    });
  },
};

/**
 * Helper pour prefetch des données
 */
export const prefetchQueries = {
  // Prefetch un profil
  profile: async <T>(id: string, fetcher: () => Promise<T>) => {
    await queryClient.prefetchQuery({
      queryKey: queryKeys.profiles.detail(id),
      queryFn: fetcher,
      staleTime: 5 * 60 * 1000,
    });
  },

  // Prefetch une liste
  list: async (
    entity: 'profiles' | 'bookings' | 'parcours' | 'pros',
    filters: Record<string, unknown>,
    fetcher: () => Promise<unknown>
  ) => {
    await queryClient.prefetchQuery({
      queryKey: queryKeys[entity].list(filters),
      queryFn: fetcher,
      staleTime: 5 * 60 * 1000,
    });
  },
};

/**
 * Helper pour optimistic updates
 */
export const optimisticUpdate = {
  // Update un item dans une liste
  updateInList: <T extends { id: string }>(
    queryKey: readonly unknown[],
    id: string,
    updater: (item: T) => T
  ) => {
    queryClient.setQueryData(queryKey, (old: T[] | undefined) => {
      if (!old) return old;
      return old.map((item) => (item.id === id ? updater(item) : item));
    });
  },

  // Ajouter un item à une liste
  addToList: <T>(queryKey: readonly unknown[], newItem: T) => {
    queryClient.setQueryData(queryKey, (old: T[] | undefined) => {
      if (!old) return [newItem];
      return [newItem, ...old];
    });
  },

  // Supprimer un item d'une liste
  removeFromList: <T extends { id: string }>(queryKey: readonly unknown[], id: string) => {
    queryClient.setQueryData(queryKey, (old: T[] | undefined) => {
      if (!old) return old;
      return old.filter((item) => item.id !== id);
    });
  },

  // Update un détail
  updateDetail: <T>(queryKey: readonly unknown[], updater: (old: T) => T) => {
    queryClient.setQueryData(queryKey, updater);
  },
};

/**
 * Configuration des devtools
 * Les devtools ne sont pas installés pour l'instant
 */
export const ReactQueryDevtools = () => null;
