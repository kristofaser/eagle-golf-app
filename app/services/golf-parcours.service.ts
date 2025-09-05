import { BaseService, ServiceResponse, PaginationParams, SortParams } from './base.service';
import { Tables } from '@/utils/supabase/types';
import { WithDetails, FilterParams } from '@/types/utils';
import { PostGISPoint } from '@/types/location';
import { clusteringService } from './clustering.service';
import { MapData, ClusteringOptions, DepartmentCluster } from '@/types/clustering';

export type GolfParcours = Tables<'golf_parcours'> & {
  // Convertir latitude/longitude en location PostGIS pour compatibilité
  location?: PostGISPoint | null;
  // Mapper holes_count vers hole_count pour compatibilité avec l'UI
  hole_count?: number;
  // Valeurs par défaut pour les champs manquants
  images?: string[];
  amenities?: string[];
  par?: number;
  green_fee_weekday?: number;
  green_fee_weekend?: number;
  booking_required?: boolean;
  active?: boolean;
};

// Type enrichi avec des compteurs
export type GolfParcoursWithAvailabilities = WithDetails<
  GolfParcours,
  {
    availabilities_count?: number;
    pros_count?: number;
  }
>;

// Type pour les filtres de parcours de golf
export type GolfParcoursFilters = FilterParams<{
  city?: string;
  name?: string;
  department?: string;
  minHoles?: number;
  nearLocation?: {
    lat: number;
    lng: number;
    radiusKm: number;
  };
}>;

class GolfParcoursService extends BaseService {
  /**
   * Transforme les données golf_parcours vers le format compatible avec l'UI existante
   * Prend en charge les données PostGIS natively ou convertit lat/lng si nécessaire
   */
  private transformGolfParcours(rawData: Tables<'golf_parcours'>): GolfParcours {
    let location: PostGISPoint | null = null;

    // Priorité 1: Utiliser la colonne location PostGIS si disponible
    if (rawData.location) {
      // Si location est déjà un objet PostGIS
      if (typeof rawData.location === 'object' && 
          'type' in rawData.location && 
          'coordinates' in rawData.location) {
        location = rawData.location as PostGISPoint;
      }
      // Si location est une string JSON (format Supabase parfois)
      else if (typeof rawData.location === 'string') {
        try {
          location = JSON.parse(rawData.location) as PostGISPoint;
        } catch (e) {
          console.warn(`Erreur parsing location PostGIS pour ${rawData.name}:`, e);
        }
      }
    }
    
    // Priorité 2: Fallback vers latitude/longitude si PostGIS non disponible
    if (!location && rawData.latitude && rawData.longitude) {
      location = {
        type: 'Point',
        coordinates: [rawData.longitude, rawData.latitude]
      };
    }

    return {
      ...rawData,
      location,
      // Mapper holes_count vers hole_count pour compatibilité
      hole_count: rawData.holes_count || undefined,
      // Garder aussi holes_count pour compatibilité
      holes_count: rawData.holes_count,
      // Valeurs par défaut pour les champs manquants
      images: [], // Aucune image dans golf_parcours
      amenities: [], // Aucune commodité dans golf_parcours
      par: undefined, // Pas d'info par dans golf_parcours
      green_fee_weekday: undefined, // Pas de tarifs dans golf_parcours
      green_fee_weekend: undefined, // Pas de tarifs dans golf_parcours
      booking_required: true, // Par défaut, réservation requise
      active: true, // Tous les parcours dans golf_parcours sont actifs
    };
  }

  /**
   * Récupère un parcours par ID
   */
  async getGolfCourse(courseId: string): Promise<ServiceResponse<GolfParcours>> {
    try {
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
        data: this.transformGolfParcours(data),
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
   * Liste tous les parcours avec filtres
   */
  async listGolfCourses(
    filters?: GolfParcoursFilters,
    pagination?: PaginationParams,
    sort?: SortParams
  ): Promise<ServiceResponse<GolfParcours[]>> {
    try {
      let query = this.supabase
        .from('golf_parcours')
        .select('*');

      // Appliquer les filtres
      if (filters) {
        if (filters.city) {
          query = query.ilike('city', `%${filters.city}%`);
        }
        if (filters.name) {
          query = query.ilike('name', `%${filters.name}%`);
        }
        if (filters.department) {
          query = query.eq('department', filters.department);
        }
        if (filters.minHoles) {
          query = query.gte('holes_count', filters.minHoles);
        }
      }

      // Tri
      const sortBy = sort?.sortBy || 'name';
      const ascending = sort?.sortOrder !== 'desc';
      query = query.order(sortBy, { ascending });

      // Pagination
      if (pagination) {
        const start = (pagination.page - 1) * pagination.limit;
        const end = start + pagination.limit - 1;
        query = query.range(start, end);
      }

      const { data, error } = await query;

      if (error) throw error;

      let parcours = (data || []).map(this.transformGolfParcours.bind(this));

      // Filtrage par proximité (côté client car plus simple)
      if (filters?.nearLocation) {
        parcours = parcours
          .filter((course) => course.location)
          .map((course) => {
            const distance = this.calculateDistance(
              filters.nearLocation!.lat,
              filters.nearLocation!.lng,
              course.location as any
            );
            return { ...course, distance };
          })
          .filter((course) => course.distance <= filters.nearLocation!.radiusKm)
          .sort((a, b) => a.distance - b.distance);
      }

      console.log('🏌️ Golf parcours récupérés:', parcours.length);
      if (parcours.length > 0) {
        console.log('🏌️ Premier parcours:', {
          id: parcours[0].id,
          name: parcours[0].name,
          location: parcours[0].location,
          holes: parcours[0].hole_count,
        });
      }

      return {
        data: parcours,
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
   * Récupère les parcours avec le nombre de pros disponibles
   */
  async listGolfCoursesWithAvailability(
    date: string,
    filters?: GolfParcoursFilters,
    pagination?: PaginationParams
  ): Promise<ServiceResponse<GolfParcoursWithAvailabilities[]>> {
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
    } catch (error: any) {
      return {
        data: null,
        error: this.handleError(error),
      };
    }
  }

  /**
   * Récupère tous les parcours actifs avec leurs coordonnées de localisation
   */
  async listGolfCoursesWithLocation(): Promise<ServiceResponse<GolfParcours[]>> {
    try {
      console.log('🔍 Récupération des parcours golf_parcours avec localisation');

      const { data, error } = await this.supabase
        .from('golf_parcours')
        .select('*')
        .not('latitude', 'is', null)
        .not('longitude', 'is', null)
        .order('name');

      if (error) {
        console.error('❌ Erreur récupération golf_parcours:', error);
        throw error;
      }

      console.log('✅ Golf parcours récupérés:', {
        count: data?.length || 0,
        firstCourse: data?.[0],
      });

      // Transformer les données
      const transformedData = (data || []).map(this.transformGolfParcours.bind(this));

      console.log('📍 Données transformées golf_parcours:', {
        count: transformedData.length,
        firstTransformed: transformedData[0],
        firstLocation: transformedData[0]?.location,
      });

      return { data: transformedData, error: null };
    } catch (error) {
      console.error('❌ Erreur listGolfCoursesWithLocation (golf_parcours):', error);
      return { data: null, error: error as Error };
    }
  }

  /**
   * Recherche des parcours proches d'une position
   * Utilise PostGIS si disponible, sinon fallback sur calcul côté client
   */
  async searchNearbyGolfCourses(
    lat: number,
    lng: number,
    radiusKm: number = 50,
    limit: number = 10
  ): Promise<ServiceResponse<GolfParcours[]>> {
    try {
      console.log(`🔍 Recherche parcours proches de [${lat}, ${lng}] dans ${radiusKm}km`);

      // Tentative d'utilisation de la fonction PostGIS optimisée
      try {
        const { data: nearbyParcours, error: rpcError } = await this.supabase
          .rpc('get_nearby_golf_parcours_simple', {
            user_lat: lat,
            user_lng: lng,
            radius_km: radiusKm
          });

        if (!rpcError && nearbyParcours) {
          console.log(`✅ Trouvé ${nearbyParcours.length} parcours via PostGIS`);
          
          // Transformer les résultats PostGIS vers notre format
          const transformedData = nearbyParcours.map(row => ({
            ...row,
            location: {
              type: 'Point' as const,
              coordinates: [row.longitude, row.latitude]
            },
            hole_count: undefined, // Pas d'info sur les trous dans cette requête
            holes_count: undefined,
            images: [],
            amenities: [],
            par: undefined,
            green_fee_weekday: undefined,
            green_fee_weekend: undefined,
            booking_required: true,
            active: true,
            distance: row.distance_km // Distance déjà calculée par PostGIS
          }));

          return {
            data: transformedData as GolfParcours[],
            error: null,
          };
        }
      } catch (postgisError) {
        console.warn('⚠️ Fonction PostGIS non disponible, fallback sur calcul client');
      }

      // Fallback: Récupération simple et filtrage côté client
      console.log('🔄 Fallback vers calcul de distance côté client');
      const { data: allCourses, error } = await this.listGolfCourses();
      
      if (error || !allCourses) {
        throw error || new Error('Erreur récupération des parcours');
      }

      // Filtrer par proximité avec calcul Haversine
      const nearbyCourses = allCourses
        .filter((course) => course.location)
        .map((course) => {
          const distance = this.calculateDistance(lat, lng, course.location as any);
          return { ...course, distance };
        })
        .filter((course) => course.distance <= radiusKm)
        .sort((a, b) => a.distance - b.distance)
        .slice(0, limit);

      console.log(`✅ Trouvé ${nearbyCourses.length} parcours via calcul client`);

      return {
        data: nearbyCourses,
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
   * Récupère les statistiques d'un parcours
   */
  async getCourseStats(courseId: string): Promise<ServiceResponse<any>> {
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

      const ratings = reviews?.flatMap((b) => b.reviews.map((r: any) => r.rating)) || [];
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
    } catch (error: any) {
      return {
        data: null,
        error: this.handleError(error),
      };
    }
  }

  /**
   * Calcule la distance entre deux points (Haversine) - version PostGIS
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

  /**
   * Calcule la distance entre deux points (Haversine) - version simple
   */
  calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371; // Rayon de la Terre en km
    const dLat = this.toRad(lat2 - lat1);
    const dLng = this.toRad(lng2 - lng1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) *
        Math.cos(this.toRad(lat2)) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRad(deg: number): number {
    return deg * (Math.PI / 180);
  }

  /**
   * Génère les données complètes pour le système zoom dynamique
   */
  generateFullMapData(golfs: GolfParcours[]): {
    allClusters: DepartmentCluster[];
    allGolfs: GolfParcours[];
    totalGolfs: number;
  } {
    return clusteringService.generateFullMapData(golfs);
  }

  /**
   * Récupère les données de la carte avec clustering intelligent
   * Utilise les statistiques PostGIS si disponibles
   */
  async getMapData(options: ClusteringOptions = {}): Promise<ServiceResponse<MapData>> {
    try {
      console.log('🗺️ Génération des données de carte avec clustering');

      // Tentative d'utilisation des statistiques PostGIS pour le clustering
      try {
        const { data: departmentStats, error: statsError } = await this.supabase
          .rpc('get_golf_parcours_department_stats');

        if (!statsError && departmentStats?.length) {
          console.log(`📊 Clustering via PostGIS: ${departmentStats.length} départements`);
          
          // Si on a les stats PostGIS, on peut générer des clusters plus efficaces
          // Mais on garde le système existant pour la compatibilité
        }
      } catch (postgisError) {
        console.log('📊 Stats PostGIS non disponibles, utilisation du clustering existant');
      }

      // Récupérer tous les golfs avec leurs coordonnées
      const { data: golfs, error: golfsError } = await this.listGolfCoursesWithLocation();
      
      if (golfsError || !golfs) {
        throw golfsError || new Error('Erreur lors de la récupération des golfs');
      }

      console.log(`📊 ${golfs.length} golfs récupérés pour clustering`);

      // Générer les données de clustering
      const mapData = clusteringService.generateMapData(golfs, options);

      console.log(`🎯 Mode affiché: ${mapData.mode}`);
      console.log(`📍 Clusters: ${mapData.clusters?.length || 0}`);
      console.log(`🏌️ Golfs individuels: ${mapData.individualGolfs?.length || 0}`);

      return {
        data: mapData,
        error: null,
      };
    } catch (error: any) {
      console.error('❌ Erreur getMapData:', error);
      return {
        data: null,
        error: this.handleError(error),
      };
    }
  }

  /**
   * Récupère les golfs d'un département spécifique
   */
  async getGolfsByDepartment(department: string): Promise<ServiceResponse<GolfParcours[]>> {
    try {
      console.log(`🏛️ Récupération des golfs du département ${department}`);

      const { data, error } = await this.supabase
        .from('golf_parcours')
        .select('*')
        .eq('department', department)
        .not('latitude', 'is', null)
        .not('longitude', 'is', null)
        .order('name');

      if (error) throw error;

      const transformedGolfs = (data || []).map(this.transformGolfParcours.bind(this));
      
      console.log(`✅ ${transformedGolfs.length} golfs trouvés dans le département ${department}`);

      return {
        data: transformedGolfs,
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
   * Calcule les bounds géographiques d'un département
   */
  async getDepartmentBounds(department: string) {
    try {
      const { data: golfs, error } = await this.getGolfsByDepartment(department);
      
      if (error || !golfs) {
        throw error || new Error('Département non trouvé');
      }

      return clusteringService.calculateDepartmentBounds(golfs);
    } catch (error: any) {
      console.error(`❌ Erreur calcul bounds département ${department}:`, error);
      return null;
    }
  }
}

export const golfParcoursService = new GolfParcoursService();