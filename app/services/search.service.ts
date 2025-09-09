import { BaseService, ServiceResponse } from './base.service';
import { profileService, ProProfileWithDetails } from './profile.service';
import { golfCourseService, GolfCourseWithAvailabilities } from './golf-course.service';
import { bookingService, AvailabilityWithDetails } from './booking.service';

export interface SearchByGolfCourseParams {
  golfCourseId: string;
  date: string;
  timeSlot?: 'morning' | 'afternoon' | 'all';
  minPlayers?: number;
}

export interface SearchByProParams {
  city?: string;
  date?: string;
  specialties?: string[];
  priceRange?: {
    min?: number;
    max?: number;
  };
  canTravel?: boolean;
  language?: string;
}

export interface SearchResult {
  mode: 'by-course' | 'by-pro';
  golfCourses?: GolfCourseWithAvailabilities[];
  pros?: ProProfileWithDetails[];
  availabilities?: AvailabilityWithDetails[];
  totalResults: number;
}

export interface QuickSearchParams {
  query: string;
  type?: 'all' | 'pros' | 'courses';
  limit?: number;
}

class SearchService extends BaseService {
  /**
   * Recherche par parcours : trouve les pros disponibles sur un parcours donné
   */
  async searchByGolfCourse(
    params: SearchByGolfCourseParams
  ): Promise<ServiceResponse<SearchResult>> {
    try {
      const { golfCourseId, date, timeSlot, minPlayers = 1 } = params;

      // Récupérer le parcours
      const { data: golfCourse, error: courseError } =
        await golfCourseService.getGolfCourse(golfCourseId);

      if (courseError || !golfCourse) {
        throw new Error('Parcours non trouvé');
      }

      // Construire les filtres pour les disponibilités
      let timeFilter = {};
      if (timeSlot === 'morning') {
        timeFilter = { start_time: { gte: '06:00', lt: '12:00' } };
      } else if (timeSlot === 'afternoon') {
        timeFilter = { start_time: { gte: '12:00', lt: '20:00' } };
      }

      // Récupérer les disponibilités avec les détails des pros
      const { data: availabilities, error: availError } = await bookingService.getProAvailabilities(
        {
          golfCourseId,
          date,
          hasSlots: true,
        }
      );

      if (availError) throw availError;

      // Filtrer par créneau horaire et places disponibles
      const filteredAvailabilities =
        availabilities?.filter((avail) => {
          const hasEnoughSlots =
            (avail.max_players || 0) - (avail.current_bookings || 0) >= minPlayers;

          if (!hasEnoughSlots) return false;

          if (timeSlot === 'morning') {
            return avail.start_time >= '06:00' && avail.start_time < '12:00';
          } else if (timeSlot === 'afternoon') {
            return avail.start_time >= '12:00' && avail.start_time < '20:00';
          }

          return true;
        }) || [];

      // Extraire les pros uniques
      const uniquePros = new Map<string, ProProfileWithDetails>();
      filteredAvailabilities.forEach((avail) => {
        if (avail.profiles && !uniquePros.has(avail.pro_id)) {
          uniquePros.set(avail.pro_id, avail.profiles as any);
        }
      });

      return {
        data: {
          mode: 'by-course',
          golfCourses: [{ ...golfCourse, availabilities_count: filteredAvailabilities.length }],
          pros: Array.from(uniquePros.values()),
          availabilities: filteredAvailabilities,
          totalResults: uniquePros.size,
        },
        error: null,
      };
    } catch (error: any) {
      return {
        data: null,
        error: this.handleError(error),
      };
    }
  }

  /**
   * Recherche par pro : trouve les pros selon les critères et leurs disponibilités
   */
  async searchByPro(params: SearchByProParams): Promise<ServiceResponse<SearchResult>> {
    try {
      const { city, date, specialties, priceRange, canTravel, language } = params;

      // Construire les filtres pour les pros
      const proFilters: any = {};
      if (city) proFilters.city = city;
      if (specialties?.length) proFilters.specialties = specialties;
      if (priceRange?.min !== undefined) proFilters.minHourlyRate = priceRange.min;
      if (priceRange?.max !== undefined) proFilters.maxHourlyRate = priceRange.max;
      if (canTravel !== undefined) proFilters.canTravel = canTravel;
      if (language) proFilters.languages = [language];

      // Récupérer les pros
      const { data: pros, error: prosError } = await profileService.listProProfiles(proFilters, {
        limit: 50,
      });

      if (prosError) throw prosError;

      // Si une date est spécifiée, récupérer les disponibilités
      let availabilities: AvailabilityWithDetails[] = [];
      if (date && pros?.length) {
        const availPromises = pros.map((pro) =>
          bookingService.getProAvailabilities({
            proId: pro.id,
            date,
            hasSlots: true,
          })
        );

        const availResults = await Promise.all(availPromises);
        availabilities = availResults
          .filter((result) => result.data)
          .flatMap((result) => result.data || []);
      }

      // Récupérer les parcours uniques
      const uniqueCourses = new Map<string, any>();
      availabilities.forEach((avail) => {
        if (avail.golf_parcours && !uniqueCourses.has(avail.golf_course_id)) {
          uniqueCourses.set(avail.golf_course_id, avail.golf_parcours);
        }
      });

      return {
        data: {
          mode: 'by-pro',
          pros: pros || [],
          golfCourses: Array.from(uniqueCourses.values()),
          availabilities,
          totalResults: pros?.length || 0,
        },
        error: null,
      };
    } catch (error: any) {
      return {
        data: null,
        error: this.handleError(error),
      };
    }
  }

  /**
   * Recherche rapide (pour la barre de recherche)
   */
  async quickSearch(params: QuickSearchParams): Promise<ServiceResponse<SearchResult>> {
    try {
      const { query, type = 'all', limit = 10 } = params;
      const searchQuery = `%${query}%`;

      const results: SearchResult = {
        mode: 'by-pro',
        pros: [],
        golfCourses: [],
        totalResults: 0,
      };

      // Recherche des pros
      if (type === 'all' || type === 'pros') {
        const { data: pros } = await this.supabase
          .from('profiles')
          .select(
            `
            *,
            pro_profiles(*)
          `
          )
          .eq('user_type', 'pro')
          .or(`first_name.ilike.${searchQuery},last_name.ilike.${searchQuery}`)
          .limit(limit);

        results.pros = (pros || []).filter(
          (p): p is ProProfileWithDetails => p.pro_profiles !== null
        );
      }

      // Recherche des parcours
      if (type === 'all' || type === 'courses') {
        const { data: courses } = await this.supabase
          .from('golf_parcours')
          .select('*')
          .or(`name.ilike.${searchQuery},city.ilike.${searchQuery}`)
          .limit(limit);

        results.golfCourses = courses || [];
      }

      results.totalResults = (results.pros?.length || 0) + (results.golfCourses?.length || 0);

      return {
        data: results,
        error: null,
      };
    } catch (error: any) {
      return {
        data: null,
        error: this.handleError(error),
      };
    }
  }

  /**
   * Obtenir des suggestions de recherche
   */
  async getSuggestions(
    query: string,
    type: 'pros' | 'courses' | 'cities'
  ): Promise<ServiceResponse<string[]>> {
    try {
      const searchQuery = `${query}%`;
      let suggestions: string[] = [];

      switch (type) {
        case 'pros':
          const { data: pros } = await this.supabase
            .from('profiles')
            .select('first_name, last_name')
            .eq('user_type', 'pro')
            .or(`first_name.ilike.${searchQuery},last_name.ilike.${searchQuery}`)
            .limit(5);

          suggestions = pros?.map((p) => `${p.first_name} ${p.last_name}`) || [];
          break;

        case 'courses':
          const { data: courses } = await this.supabase
            .from('golf_parcours')
            .select('name')
              .ilike('name', searchQuery)
            .limit(5);

          suggestions = courses?.map((c) => c.name) || [];
          break;

        case 'cities':
          const { data: cities } = await this.supabase
            .from('golf_parcours')
            .select('city')
              .ilike('city', searchQuery)
            .limit(5);

          // Dédupliquer les villes
          const uniqueCities = new Set(cities?.map((c) => c.city) || []);
          suggestions = Array.from(uniqueCities);
          break;
      }

      return {
        data: suggestions,
        error: null,
      };
    } catch (error: any) {
      return {
        data: null,
        error: this.handleError(error),
      };
    }
  }

  /**
   * Recherche duale pour le SearchOverlay
   * Permet de rechercher soit par parcours, soit par professionnel
   */
  async searchDual(params: {
    query: string;
    mode: 'by-course' | 'by-pro';
    limit?: number;
  }): Promise<ServiceResponse<any[]>> {
    try {
      const { query, mode, limit = 10 } = params;

      if (!query || query.trim().length < 2) {
        return {
          data: [],
          error: null,
        };
      }

      const searchQuery = `%${query}%`;

      if (mode === 'by-course') {
        // Rechercher les parcours
        const { data: courses, error } = await this.supabase
          .from('golf_parcours')
          .select('*')
          .or(`name.ilike.${searchQuery},city.ilike.${searchQuery},address.ilike.${searchQuery}`)
          .limit(limit);

        if (error) throw error;

        return {
          data: courses || [],
          error: null,
        };
      } else {
        // Rechercher les professionnels
        const { data: pros, error } = await this.supabase
          .from('profiles')
          .select(
            `
            *,
            pro_profiles(*)
          `
          )
          .eq('user_type', 'pro')
          .or(
            `first_name.ilike.${searchQuery},last_name.ilike.${searchQuery},city.ilike.${searchQuery}`
          )
          .limit(limit);

        if (error) throw error;

        // Pour chaque pro, vérifier s'il a des disponibilités aujourd'hui
        const today = new Date().toISOString().split('T')[0];
        const prosWithAvailability = await Promise.all(
          (pros || []).map(async (pro) => {
            const { data: availabilities } = await this.supabase
              .from('pro_availabilities')
              .select('id')
              .eq('pro_id', pro.id)
              .eq('date', today as string)
              .gt('max_players', 0)
              .limit(1);

            // Vérifier si au moins une disponibilité a des places
            let hasSlots = false;
            if (availabilities && availabilities.length > 0) {
              const { data: avail } = await this.supabase
                .from('pro_availabilities')
                .select('current_bookings, max_players')
                .eq('id', availabilities[0]?.id || '')
                .single();

              if (avail && (avail.current_bookings || 0) < (avail.max_players || 0)) {
                hasSlots = true;
              }
            }

            return {
              ...pro,
              has_availabilities: hasSlots,
            };
          })
        );

        return {
          data: prosWithAvailability,
          error: null,
        };
      }
    } catch (error: any) {
      return {
        data: null,
        error: this.handleError(error),
      };
    }
  }

  /**
   * Recherche avancée avec tous les filtres
   */
  async advancedSearch(params: {
    query?: string;
    filters: {
      date?: string;
      city?: string;
      priceMin?: number;
      priceMax?: number;
      specialties?: string[];
      amenities?: string[];
      nearLocation?: {
        lat: number;
        lng: number;
        radiusKm: number;
      };
    };
    pagination?: {
      page: number;
      limit: number;
    };
  }): Promise<ServiceResponse<SearchResult>> {
    try {
      const { query, filters, pagination } = params;

      // Recherche des pros
      const proFilters: any = {};
      if (filters.city) proFilters.city = filters.city;
      if (filters.priceMin) proFilters.minHourlyRate = filters.priceMin;
      if (filters.priceMax) proFilters.maxHourlyRate = filters.priceMax;
      if (filters.specialties?.length) proFilters.specialties = filters.specialties;

      const { data: pros } = await profileService.listProProfiles(proFilters, pagination);

      // Recherche des parcours
      const courseFilters: any = {};
      if (filters.city) courseFilters.city = filters.city;
      if (filters.amenities?.length) courseFilters.amenities = filters.amenities;
      if (filters.nearLocation) courseFilters.nearLocation = filters.nearLocation;

      const { data: courses } = await golfCourseService.listGolfCourses(courseFilters, pagination);

      // Si une recherche textuelle, filtrer davantage
      let filteredPros = pros || [];
      let filteredCourses = courses || [];

      if (query) {
        const searchQuery = query.toLowerCase();

        filteredPros = filteredPros.filter(
          (pro) =>
            `${pro.first_name} ${pro.last_name}`.toLowerCase().includes(searchQuery) ||
            pro.bio?.toLowerCase().includes(searchQuery)
        );

        filteredCourses = filteredCourses.filter(
          (course) =>
            course.name.toLowerCase().includes(searchQuery) ||
            course.description?.toLowerCase().includes(searchQuery)
        );
      }

      return {
        data: {
          mode: 'by-pro',
          pros: filteredPros,
          golfCourses: filteredCourses,
          totalResults: filteredPros.length + filteredCourses.length,
        },
        error: null,
      };
    } catch (error: any) {
      return {
        data: null,
        error: this.handleError(error),
      };
    }
  }
}

export const searchService = new SearchService();
