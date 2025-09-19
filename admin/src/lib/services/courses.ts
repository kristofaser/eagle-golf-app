import { createClient } from '@/lib/supabase/server';
import type { GolfCourse } from '@/types/golf-course';

export interface CourseFilters {
  search?: string;
}

export interface CoursesResponse {
  data: GolfCourse[];
  count: number;
}

export async function getCourses(
  filters: CourseFilters = {},
  page = 1,
  limit = 12
): Promise<CoursesResponse> {
  const supabase = await createClient();

  let query = supabase
    .from('golf_parcours')
    .select('*', { count: 'exact' });

  // Appliquer le filtre de recherche
  if (filters.search?.trim()) {
    const searchTerm = filters.search.trim();
    query = query.or(`name.ilike.%${searchTerm}%,city.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`);
  }

  // Pagination
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  query = query
    .range(from, to)
    .order('name', { ascending: true });

  const { data, error, count } = await query;

  if (error) {
    throw new Error(`Erreur lors de la récupération des parcours: ${error.message}`);
  }

  return {
    data: data || [],
    count: count || 0
  };
}