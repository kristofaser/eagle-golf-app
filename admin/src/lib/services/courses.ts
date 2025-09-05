import { createClient } from '@/lib/supabase/server';
import type { GolfCourse } from '@/types/golf-course';

export interface CourseFilters {
  search?: string;
  department?: string;
  minHoles?: number;
  maxHoles?: number;
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

  // Appliquer les filtres
  if (filters.search?.trim()) {
    const searchTerm = filters.search.trim();
    query = query.or(`name.ilike.%${searchTerm}%,city.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`);
  }

  if (filters.department?.trim()) {
    query = query.eq('department', filters.department.trim());
  }

  if (filters.minHoles && filters.minHoles > 0) {
    query = query.gte('holes_count', filters.minHoles);
  }

  if (filters.maxHoles && filters.maxHoles > 0) {
    query = query.lte('holes_count', filters.maxHoles);
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

export async function getDepartments(): Promise<string[]> {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('golf_parcours')
    .select('department')
    .not('department', 'is', null);

  if (error) {
    throw new Error(`Erreur lors de la récupération des départements: ${error.message}`);
  }

  // Compter les occurrences et trier par popularité
  const departmentCounts = data.reduce((acc: Record<string, number>, item) => {
    if (item.department) {
      acc[item.department] = (acc[item.department] || 0) + 1;
    }
    return acc;
  }, {});

  // Retourner les départements triés par nombre de parcours (décroissant)
  return Object.keys(departmentCounts).sort((a, b) => departmentCounts[b] - departmentCounts[a]);
}