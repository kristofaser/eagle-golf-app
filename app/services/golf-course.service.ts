import { BaseService, ServiceResponse, PaginationParams, SortParams } from './base.service';
import { Tables } from '@/utils/supabase/types';
import { WithDetails, FilterParams } from '@/types/utils';
import { PostGISPoint } from '@/types/location';
import { logger } from '@/utils/logger';

export type GolfCourse = Tables<'golf_parcours'> & {
  location: PostGISPoint | null;
};

// Type enrichi avec des compteurs
export type GolfCourseWithAvailabilities = WithDetails<
  GolfCourse,
  {
    availabilities_count?: number;
    pros_count?: number;
  }
>;

// Type pour les filtres de parcours de golf
export type GolfCourseFilters = FilterParams<{
  city?: string;
  name?: string;
  minGreenFee?: number;
  maxGreenFee?: number;
  amenities?: string[];
  nearLocation?: {
    lat: number;
    lng: number;
    radiusKm: number;
  };
}>;

export interface CreateGolfCourseData {
  name: string;
  address: string;
  city: string;
  postal_code?: string;
  country?: string;
  location?: { lat: number; lng: number };
  phone?: string;
  email?: string;
  website?: string;
  description?: string;
  hole_count?: number;
  par?: number;
  green_fee_weekday?: number;
  green_fee_weekend?: number;
  images?: string[];
  amenities?: string[];
  booking_required?: boolean;
}

class GolfCourseService extends BaseService {
  /**
   * Récupère un parcours par ID
   */
  async getGolfCourse(courseId: string): Promise<ServiceResponse<GolfCourse>> {
    try {
      // Utiliser une requête directe au lieu de l'appel RPC
      const { data, error } = await this.supabase
        .from('golf_parcours')
        .select('*')
        .eq('id', courseId)
        .single();

      if (error) throw error;

      if (!data) {
        throw new Error('Parcours non trouvé');
      }

      return {
        data: data as GolfCourse,
        error: null,
      };
    } catch (error) {
      return {
        data: null,
        error: this.handleError(error),
      };
    }
  }

  /**
   * Liste tous les parcours avec filtres
   */
  async listGolfCourses(
    filters?: GolfCourseFilters,
    pagination?: PaginationParams,
    sort?: SortParams
  ): Promise<ServiceResponse<GolfCourse[]>> {
    try {
      // Utiliser une requête directe au lieu de l'appel RPC
      const { data, error } = await this.supabase
        .from('golf_parcours')
        .select('*')
        .order(sort?.sortBy || 'name', { ascending: sort?.sortOrder !== 'desc' });

      if (error) throw error;

      // Caster le type pour inclure la location PostGIS
      let courses = (data || []) as GolfCourse[];

      // Debug: log des données récupérées
      logger.dev('🏌️ Golf courses from RPC:', courses.length);
      if (courses.length > 0) {
        logger.dev('🏌️ First course data:', {
          id: courses[0].id,
          name: courses[0].name,
          location: courses[0].location,
          locationType: typeof courses[0].location,
        });
      }

      // Appliquer les filtres côté client
      if (filters) {
        if (filters.city) {
          courses = courses.filter((course) =>
            course.city.toLowerCase().includes(filters.city!.toLowerCase())
          );
        }
        if (filters.name) {
          courses = courses.filter((course) =>
            course.name.toLowerCase().includes(filters.name!.toLowerCase())
          );
        }
        // Filtres désactivés car les champs n'existent pas dans golf_parcours
        // TODO: implémenter ces filtres avec des données enrichies si nécessaire
        // if (filters.minGreenFee !== undefined) {
        //   courses = courses.filter((course) => course.green_fee_weekday >= filters.minGreenFee!);
        // }
        // if (filters.maxGreenFee !== undefined) {
        //   courses = courses.filter((course) => course.green_fee_weekday <= filters.maxGreenFee!);
        // }
        // if (filters.amenities?.length) {
        //   courses = courses.filter((course) =>
        //     filters.amenities!.every((amenity) => course.amenities?.includes(amenity))
        //   );
        // }

        // Filtrage par proximité
        if (filters.nearLocation) {
          courses = courses
            .filter((course) => course.location)
            .map((course) => {
              const distance = this.calculateDistance(
                filters.nearLocation!.lat,
                filters.nearLocation!.lng,
                course.location
              );
              return { ...course, distance };
            })
            .filter((course) => course.distance <= filters.nearLocation!.radiusKm)
            .sort((a, b) => a.distance - b.distance);
        }
      }

      // Tri
      if (sort?.sortBy) {
        courses.sort((a, b) => {
          const aVal = a[sort.sortBy as keyof typeof a];
          const bVal = b[sort.sortBy as keyof typeof b];
          const result = aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
          return sort.sortOrder === 'asc' ? result : -result;
        });
      } else {
        courses.sort((a, b) => a.name.localeCompare(b.name));
      }

      // Pagination
      if (pagination) {
        const start = (pagination.page - 1) * pagination.limit;
        const end = start + pagination.limit;
        courses = courses.slice(start, end);
      }

      return {
        data: courses,
        error: null,
      };
    } catch (error) {
      return {
        data: null,
        error: this.handleError(error),
      };
    }
  }

  /**
   * Récupère les parcours avec le nombre de pros disponibles
   */
  async listGolfCoursesWithAvailability(
    date: string,
    filters?: GolfCourseFilters,
    pagination?: PaginationParams
  ): Promise<ServiceResponse<GolfCourseWithAvailabilities[]>> {
    try {
      // Récupérer les parcours
      const { data: courses, error: coursesError } = await this.listGolfCourses(
        filters,
        pagination
      );

      if (coursesError || !courses) {
        throw coursesError || new Error('Erreur lors de la récupération des parcours');
      }

      // Pour chaque parcours, compter les disponibilités
      const coursesWithAvailability = await Promise.all(
        courses.map(async (course) => {
          const { count: availabilitiesCount } = await this.supabase
            .from('pro_availabilities')
            .select('*', { count: 'exact', head: true })
            .eq('golf_course_id', course.id)
            .eq('date', date)
            .gt('max_players', 0);

          const { count: prosCount } = await this.supabase
            .from('pro_availabilities')
            .select('pro_id', { count: 'exact', head: true })
            .eq('golf_course_id', course.id)
            .eq('date', date)
            .gt('max_players', 0);

          return {
            ...course,
            availabilities_count: availabilitiesCount || 0,
            pros_count: prosCount || 0,
          };
        })
      );

      return {
        data: coursesWithAvailability,
        error: null,
      };
    } catch (error) {
      return {
        data: null,
        error: this.handleError(error),
      };
    }
  }

  /**
   * Récupère tous les parcours actifs avec leurs coordonnées de localisation
   */
  async listGolfCoursesWithLocation(): Promise<ServiceResponse<GolfCourse[]>> {
    try {
      logger.dev('🔍 Requête directe golf_parcours');

      const { data, error } = await this.supabase
        .from('golf_parcours')
        .select('*')
        .not('latitude', 'is', null)
        .not('longitude', 'is', null);
      if (error) {
        logger.error('❌ Erreur requête:', error);
        throw error;
      }

      logger.dev('✅ Données récupérées:', {
        count: data?.length || 0,
        firstCourse: data?.[0],
      });

      // Transformer les données pour avoir le format PostGIS
      const transformedData = (data || []).map((course) => {
        // Créer un objet location PostGIS à partir de latitude/longitude
        let location = null;
        if (course.latitude && course.longitude) {
          location = {
            type: 'Point',
            coordinates: [course.longitude, course.latitude],
          };
        }

        return { ...course, location };
      });

      logger.dev('✅ Données transformées:', {
        count: transformedData.length,
        sampleLocation: transformedData[0]?.location,
      });

      return {
        data: transformedData as GolfCourse[],
        error: null,
      };
    } catch (error) {
      logger.error('❌ Erreur listGolfCoursesWithLocation:', error);
      return {
        data: null,
        error: this.handleError(error),
      };
    }
  }

  /**
   * Recherche des parcours proches d'une position
   */
  async searchNearbyGolfCourses(
    lat: number,
    lng: number,
    radiusKm: number = 50,
    limit: number = 10
  ): Promise<ServiceResponse<GolfCourse[]>> {
    try {
      // Requête directe avec calcul de distance côté client
      const { data, error } = await this.supabase
        .from('golf_parcours')
        .select('*')
        .not('latitude', 'is', null)
        .not('longitude', 'is', null);
      if (error) throw error;

      // Calcul de distance côté client (Haversine)
      const calculateDistance = (
        lat1: number,
        lng1: number,
        lat2: number,
        lng2: number
      ): number => {
        const R = 6371; // Rayon de la Terre en km
        const dLat = ((lat2 - lat1) * Math.PI) / 180;
        const dLng = ((lng2 - lng1) * Math.PI) / 180;
        const a =
          Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.cos((lat1 * Math.PI) / 180) *
            Math.cos((lat2 * Math.PI) / 180) *
            Math.sin(dLng / 2) *
            Math.sin(dLng / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
      };

      // Filtrer par distance et transformer
      const nearbyData = (data || [])
        .map((course) => {
          const distance = calculateDistance(lat, lng, course.latitude, course.longitude);
          return {
            ...course,
            distance,
            location: {
              type: 'Point',
              coordinates: [course.longitude, course.latitude],
            },
          };
        })
        .filter((course) => course.distance <= radiusKm)
        .sort((a, b) => a.distance - b.distance)
        .slice(0, limit);

      return {
        data: nearbyData as GolfCourse[],
        error: null,
      };
    } catch (error: any) {
      logger.error('❌ Erreur dans searchNearbyGolfCourses:', error);
      return {
        data: null,
        error: this.handleError(error),
      };
    }
  }

  /**
   * Upload des images pour un parcours
   */
  async uploadCourseImages(courseId: string, files: File[]): Promise<ServiceResponse<string[]>> {
    try {
      const uploadPromises = files.map(async (file, index) => {
        const fileExt = file.name.split('.').pop();
        const fileName = `${courseId}-${Date.now()}-${index}.${fileExt}`;
        const filePath = `golf-courses/${fileName}`;

        const { error } = await this.supabase.storage.from('golf-courses').upload(filePath, file);

        if (error) throw error;

        const {
          data: { publicUrl },
        } = this.supabase.storage.from('golf-courses').getPublicUrl(filePath);

        return publicUrl;
      });

      const urls = await Promise.all(uploadPromises);

      // Mettre à jour le parcours avec les nouvelles images
      const { data: course } = await this.supabase
        .from('golf_parcours')
        .select('images')
        .eq('id', courseId)
        .single();

      const currentImages = course?.images || [];
      const allImages = [...currentImages, ...urls];

      const { error: updateError } = await this.supabase
        .from('golf_parcours')
        .update({ images: allImages })
        .eq('id', courseId);

      if (updateError) throw updateError;

      return {
        data: urls,
        error: null,
      };
    } catch (error) {
      return {
        data: null,
        error: this.handleError(error),
      };
    }
  }

  /**
   * Récupère les statistiques d'un parcours
   */
  async getCourseStats(courseId: string): Promise<
    ServiceResponse<{
      totalBookings: number;
      activePros: number;
      averageRating: number;
      totalReviews: number;
    }>
  > {
    try {
      // Nombre total de réservations
      const { count: totalBookings } = await this.supabase
        .from('bookings')
        .select('*', { count: 'exact', head: true })
        .eq('golf_course_id', courseId)
        .eq('status', 'completed');

      // Nombre de pros actifs
      const { data: activePros } = await this.supabase
        .from('pro_availabilities')
        .select('pro_id', { count: 'exact' })
        .eq('golf_course_id', courseId)
        .gte('date', new Date().toISOString().split('T')[0]);

      const uniquePros = new Set(activePros?.map((a) => a.pro_id) || []);

      // Note moyenne du parcours
      const { data: reviews } = await this.supabase
        .from('bookings')
        .select(
          `
          reviews!inner(rating)
        `
        )
        .eq('golf_course_id', courseId)
        .eq('status', 'completed');

      const ratings = reviews?.flatMap((b) => b.reviews.map((r) => r.rating)) || [];
      const avgRating = ratings.length
        ? ratings.reduce((acc, r) => acc + r, 0) / ratings.length
        : 0;

      return {
        data: {
          totalBookings: totalBookings || 0,
          activePros: uniquePros.size,
          averageRating: Math.round(avgRating * 10) / 10,
          totalReviews: ratings.length,
        },
        error: null,
      };
    } catch (error) {
      return {
        data: null,
        error: this.handleError(error),
      };
    }
  }

  /**
   * Calcule la distance entre deux points (Haversine)
   */
  private calculateDistance(
    lat1: number,
    lon1: number,
    location: { coordinates: [number, number] }
  ): number {
    const [lon2, lat2] = location.coordinates;
    const R = 6371; // Rayon de la Terre en km
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) *
        Math.cos(this.toRad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRad(deg: number): number {
    return deg * (Math.PI / 180);
  }
}

export const golfCourseService = new GolfCourseService();
