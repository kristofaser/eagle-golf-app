import { useQuery } from '@tanstack/react-query';
import { useState, useCallback, useMemo } from 'react';
import { useDebounce } from '@/hooks/useDebounce';
import { searchService, QuickSearchParams, SearchResult } from '@/services/search.service';
import { queryKeys } from '@/services/query/queryClient';

type SearchCategory = 'all' | 'pros' | 'courses';

export interface UseSearchParams {
  initialQuery?: string;
  initialCategory?: SearchCategory;
  debounceMs?: number;
  enabled?: boolean;
}

export interface UseSearchResult {
  // État de la recherche
  query: string;
  setQuery: (query: string) => void;
  category: SearchCategory;
  setCategory: (category: SearchCategory) => void;

  // Résultats
  data: SearchResult | undefined;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;

  // Statistiques
  prosCount: number;
  coursesCount: number;
  totalCount: number;

  // Actions
  refetch: () => void;
  clearResults: () => void;
}

/**
 * Hook principal pour la recherche avec debounce et cache
 */
export function useSearch({
  initialQuery = '',
  initialCategory = 'all',
  debounceMs = 300,
  enabled = true,
}: UseSearchParams = {}): UseSearchResult {
  const [query, setQuery] = useState(initialQuery);
  const [category, setCategory] = useState<SearchCategory>(initialCategory);

  // Debounce de la query pour éviter trop de requêtes
  const debouncedQuery = useDebounce(query, debounceMs);

  // Paramètres de recherche optimisés
  const searchParams: QuickSearchParams = useMemo(
    () => ({
      query: debouncedQuery,
      type: category === 'courses' ? 'courses' : category === 'pros' ? 'pros' : 'all',
      limit: 20,
    }),
    [debouncedQuery, category]
  );

  // Query React Query avec cache optimisé
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: queryKeys.search.results(searchParams.query, {
      type: searchParams.type,
      limit: searchParams.limit,
    }),
    queryFn: () => searchService.quickSearch(searchParams),
    enabled: enabled && debouncedQuery.length >= 2,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    select: (response) => response.data, // Extraire automatiquement les données
  });

  // Statistiques dérivées
  const prosCount = data?.pros?.length || 0;
  const coursesCount = data?.golfCourses?.length || 0;
  const totalCount = data?.totalResults || 0;

  // Fonction pour nettoyer les résultats
  const clearResults = useCallback(() => {
    setQuery('');
  }, []);

  // Fonction de mise à jour de la query
  const handleSetQuery = useCallback((newQuery: string) => {
    setQuery(newQuery);
  }, []);

  return {
    // État
    query,
    setQuery: handleSetQuery,
    category,
    setCategory,

    // Résultats
    data,
    isLoading,
    isError,
    error: error,

    // Statistiques
    prosCount,
    coursesCount,
    totalCount,

    // Actions
    refetch,
    clearResults,
  };
}

/**
 * Hook pour les suggestions d'autocomplétion
 */
export function useSearchSuggestions(query: string, type: 'pros' | 'courses' | 'cities') {
  return useQuery({
    queryKey: queryKeys.search.suggestions(`${query}-${type}`),
    queryFn: () => searchService.getSuggestions(query, type),
    enabled: query.length >= 1,
    staleTime: 10 * 60 * 1000, // 10 minutes
    select: (response) => response.data || [],
  });
}

/**
 * Hook pour la recherche par mode (pros ou parcours)
 */
export function useSearchByMode(mode: 'by-pro' | 'by-course') {
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, 300);

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: [`search-${mode}`, debouncedQuery],
    queryFn: () =>
      searchService.searchDual({
        query: debouncedQuery,
        mode,
        limit: 15,
      }),
    enabled: debouncedQuery.length >= 2,
    select: (response) => response.data || [],
  });

  return {
    query,
    setQuery,
    data,
    isLoading,
    isError,
    error: error,
    refetch,
  };
}
