import useSWR from 'swr';
import type { CourseSearchResponse } from '@/app/api/courses/search/route';

interface UseCoursesParams {
  search?: string;
  page?: number;
  limit?: number;
}

const fetcher = async (url: string): Promise<CourseSearchResponse> => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Erreur lors de la récupération des parcours');
  }
  return response.json();
};

export function useCourses({ search = '', page = 1, limit = 12 }: UseCoursesParams = {}) {
  // Construction de l'URL avec les paramètres
  const params = new URLSearchParams();
  if (search) params.set('search', search);
  params.set('page', page.toString());
  params.set('limit', limit.toString());

  const url = `/api/courses/search?${params.toString()}`;

  const { data, error, isLoading, mutate } = useSWR<CourseSearchResponse>(url, fetcher, {
    // Configuration SWR optimisée pour la recherche
    revalidateOnFocus: false,
    revalidateOnReconnect: true,
    dedupingInterval: 300, // Évite les requêtes dupliquées pendant 300ms
    keepPreviousData: true, // Garde les données précédentes pendant le chargement
  });

  return {
    courses: data?.data || [],
    count: data?.count || 0,
    totalPages: data?.totalPages || 0,
    currentPage: data?.page || page,
    isLoading,
    error,
    mutate, // Pour forcer un refresh si nécessaire
  };
}