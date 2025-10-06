import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { GolfCourse } from '@/types/golf-course';

export interface CourseSearchParams {
  search?: string;
  page?: number;
  limit?: number;
}

export interface CourseSearchResponse {
  data: GolfCourse[];
  count: number;
  page: number;
  totalPages: number;
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '12');

    const supabase = await createClient();

    let query = supabase
      .from('golf_parcours')
      .select(`
        *,
        bookings!bookings_golf_course_id_fkey(id, status)
      `, { count: 'exact' });

    // Appliquer le filtre de recherche
    if (search.trim()) {
      const searchTerm = search.trim();
      query = query.or(`name.ilike.%${searchTerm}%,city.ilike.%${searchTerm}%,department.ilike.%${searchTerm}%`);
    }

    // Pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    query = query
      .range(from, to)
      .order('name', { ascending: true });

    const { data, error, count } = await query;

    if (error) {
      console.error('Erreur lors de la récupération des parcours:', error);
      return NextResponse.json(
        { error: 'Erreur lors de la récupération des parcours' },
        { status: 500 }
      );
    }

    const totalPages = count ? Math.ceil(count / limit) : 0;

    // Transformer les données pour compter les réservations en cours
    const coursesWithBookingCount = (data || []).map((course: any) => {
      const activeBookingsCount = course.bookings?.filter(
        (booking: any) => booking.status === 'confirmed' || booking.status === 'pending'
      ).length || 0;

      // Retirer le tableau bookings et ajouter juste le compteur
      const { bookings, ...courseData } = course;
      return {
        ...courseData,
        active_bookings_count: activeBookingsCount
      };
    });

    const response: CourseSearchResponse = {
      data: coursesWithBookingCount,
      count: count || 0,
      page,
      totalPages
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Erreur API courses search:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}