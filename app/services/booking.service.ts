import { BaseService, ServiceResponse, PaginationParams, SortParams } from './base.service';
import { Tables, TablesInsert } from '@/utils/supabase/types';
import { WithDetails, FilterParams } from '@/types/utils';

export type Booking = Tables<'bookings'>;
export type ProAvailability = Tables<'pro_availabilities'>;

// Types enrichis avec détails
export type BookingWithDetails = WithDetails<
  Booking,
  {
    pro_profile: Tables<'pro_profiles'> & {
      profile: Tables<'profiles'>;
    };
    golf_courses: Tables<'golf_parcours'>;
  }
>;

export type AvailabilityWithDetails = WithDetails<
  ProAvailability,
  {
    profiles: Tables<'profiles'>;
    pro_profiles: Tables<'pro_profiles'>;
    golf_courses: Tables<'golf_parcours'>;
  }
>;

export interface CreateBookingData {
  amateur_id: string;
  pro_id: string;
  golf_course_id: string;
  availability_id?: string; // Maintenant optionnel car on n'utilise plus pro_availabilities
  booking_date: string;
  start_time: string;
  number_of_players: number;
  total_amount: number;
  pro_fee: number;
  platform_fee: number;
  special_requests?: string;
  status?: 'pending' | 'confirmed' | 'cancelled' | 'completed';
}

// Type pour les filtres de disponibilité
export type AvailabilityFilters = FilterParams<{
  proId?: string;
  golfCourseId?: string;
  date?: string;
  startDate?: string;
  endDate?: string;
  hasSlots?: boolean;
}>;

// Type pour les filtres de réservations
export type BookingFilters = FilterParams<{
  userId?: string;
  status?: Booking['status'];
  startDate?: string;
  endDate?: string;
  golfCourseId?: string;
}>;

class BookingService extends BaseService {
  /**
   * Récupère les disponibilités par date
   */
  async getAvailabilitiesByDate(
    date: string,
    filters?: { golf_course_id?: string; pro_id?: string }
  ): Promise<ServiceResponse<AvailabilityWithDetails[]>> {
    try {
      let query = this.supabase
        .from('pro_availabilities')
        .select(
          `
          *,
          profile:pro_id (
            id,
            first_name,
            last_name,
            avatar_url,
            hourly_rate,
            bio
          )
        `
        )
        .eq('date', date)
        .gt('max_players', 0);

      if (filters?.golf_course_id) {
        query = query.eq('golf_course_id', filters.golf_course_id);
      }
      if (filters?.pro_id) {
        query = query.eq('pro_id', filters.pro_id);
      }

      const { data, error } = await query;

      if (error) throw error;

      return {
        data: data || [],
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
   * Crée une nouvelle réservation (version simplifiée temporaire)
   */
  async createBookingSimplified(data: CreateBookingData): Promise<ServiceResponse<Booking>> {
    try {
      // Créer directement la réservation sans vérifier availability_id
      const { data: booking, error: bookingError } = await this.supabase
        .from('bookings')
        .insert(data)
        .select()
        .single();

      if (bookingError) throw bookingError;

      return {
        data: booking,
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
   * Crée une nouvelle réservation
   */
  async createBooking(data: CreateBookingData): Promise<ServiceResponse<Booking>> {
    try {
      // Vérifier la disponibilité
      const { data: availability, error: availError } = await this.supabase
        .from('pro_availabilities')
        .select('*')
        .eq('id', data.availability_id)
        .single();

      if (availError || !availability) {
        throw new Error('Créneau non disponible');
      }

      if (availability.current_bookings + data.number_of_players > availability.max_players) {
        throw new Error('Pas assez de places disponibles');
      }

      // Créer la réservation
      const { data: booking, error: bookingError } = await this.supabase
        .from('bookings')
        .insert(data)
        .select()
        .single();

      if (bookingError) throw bookingError;

      // Mettre à jour le nombre de réservations
      const { error: updateError } = await this.supabase
        .from('pro_availabilities')
        .update({
          current_bookings: availability.current_bookings + data.number_of_players,
        })
        .eq('id', data.availability_id);

      if (updateError) throw updateError;

      return {
        data: booking,
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
   * Récupère une réservation par ID
   */
  async getBooking(bookingId: string): Promise<ServiceResponse<BookingWithDetails>> {
    try {
      // Récupérer la réservation avec le profil pro
      const { data: booking, error: bookingError } = await this.supabase
        .from('bookings')
        .select(
          `
          *,
          pro_profile:pro_profiles!bookings_pro_id_fkey(
            *,
            profile:profiles(*)
          )
        `
        )
        .eq('id', bookingId)
        .single();

      if (bookingError) throw bookingError;

      // Récupérer les données du golf séparément
      let golfData = null;
      if (booking?.golf_course_id) {
        const { data: golf } = await this.supabase
          .from('golf_parcours')
          .select('*')
          .eq('id', booking.golf_course_id)
          .single();
        golfData = golf;
      }

      // Combiner les données
      const result = {
        ...booking,
        golf_courses: golfData
      } as BookingWithDetails;

      return {
        data: result,
        error: null
      };
    } catch (error: any) {
      return {
        data: null,
        error: this.handleError(error)
      };
    }
  }

  /**
   * Liste les réservations avec filtres
   */
  async listBookings(
    filters?: BookingFilters,
    pagination?: PaginationParams,
    sort?: SortParams
  ): Promise<ServiceResponse<BookingWithDetails[]>> {
    let query = this.supabase.from('bookings').select(
      `
        *,
        pro_profile:pro_profiles!bookings_pro_id_fkey(
          *,
          profile:profiles(*)
        )
      `,
      { count: 'exact' }
    );

    // Appliquer les filtres
    if (filters) {
      if (filters.userId) {
        query = query.or(`amateur_id.eq.${filters.userId},pro_id.eq.${filters.userId}`);
      }
      if (filters.status) {
        query = query.eq('status', filters.status);
      }
      if (filters.startDate) {
        query = query.gte('booking_date', filters.startDate);
      }
      if (filters.endDate) {
        query = query.lte('booking_date', filters.endDate);
      }
      if (filters.golfCourseId) {
        query = query.eq('golf_course_id', filters.golfCourseId);
      }
    }

    // Tri
    if (sort?.sortBy) {
      query = query.order(sort.sortBy, { ascending: sort.sortOrder === 'asc' });
    } else {
      query = query
        .order('booking_date', { ascending: false })
        .order('start_time', { ascending: false });
    }

    // Pagination
    if (pagination) {
      const { from, to } = this.getPaginationRange(pagination);
      query = query.range(from, to);
    }

    try {
      const { data: bookings, error, count } = await query;

      if (error) throw error;

      // Récupérer les IDs de golf uniques
      const golfIds = [...new Set(bookings?.map(b => b.golf_course_id).filter(Boolean))];
      
      // Récupérer les données de golf en une seule requête
      let golfData: Record<string, any> = {};
      if (golfIds.length > 0) {
        const { data: golfs } = await this.supabase
          .from('golf_parcours')
          .select('*')
          .in('id', golfIds);

        if (golfs) {
          golfs.forEach(golf => {
            golfData[golf.id] = golf;
          });
        }
      }

      // Combiner les données
      const result = bookings?.map(booking => ({
        ...booking,
        golf_courses: golfData[booking.golf_course_id] || null
      })) as BookingWithDetails[];

      return {
        data: result || [],
        error: null,
        count
      };
    } catch (error: any) {
      return {
        data: null,
        error: this.handleError(error)
      };
    }
  }

  /**
   * Met à jour le statut d'une réservation
   */
  async updateBookingStatus(
    bookingId: string,
    status: Booking['status'],
    reason?: string
  ): Promise<ServiceResponse<Booking>> {
    try {
      const updateData: any = { status };
      const now = new Date().toISOString();

      switch (status) {
        case 'confirmed':
          updateData.confirmed_at = now;
          break;
        case 'cancelled':
          updateData.cancelled_at = now;
          if (reason) updateData.cancellation_reason = reason;
          break;
        case 'completed':
          updateData.completed_at = now;
          break;
      }

      const { data: booking, error } = await this.supabase
        .from('bookings')
        .update(updateData)
        .eq('id', bookingId)
        .select()
        .single();

      if (error) throw error;

      // Si annulation, libérer les places
      if (status === 'cancelled' && booking) {
        const { error: availError } = await this.supabase.rpc('decrement_availability_bookings', {
          p_availability_id: booking.availability_id,
          p_num_players: booking.number_of_players,
        });

        if (availError) console.error('Error updating availability:', availError);
      }

      return {
        data: booking,
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
   * Récupère les disponibilités d'un pro
   */
  async getProAvailabilities(
    filters: AvailabilityFilters,
    pagination?: PaginationParams
  ): Promise<ServiceResponse<AvailabilityWithDetails[]>> {
    let query = this.supabase.from('pro_availabilities').select(
      `
        *,
        profiles:pro_id(*),
        pro_profiles:pro_id(*)
      `,
      { count: 'exact' }
    );

    // Filtres obligatoires
    if (filters.proId) {
      query = query.eq('pro_id', filters.proId);
    }
    if (filters.golfCourseId) {
      query = query.eq('golf_course_id', filters.golfCourseId);
    }

    // Filtres optionnels
    if (filters.date) {
      query = query.eq('date', filters.date);
    }
    if (filters.startDate) {
      query = query.gte('date', filters.startDate);
    }
    if (filters.endDate) {
      query = query.lte('date', filters.endDate);
    }
    if (filters.hasSlots) {
      // Filtrer pour avoir current_bookings < max_players
      // Note: Supabase ne supporte pas les références de colonnes directes
      // On va filtrer côté client après la requête
    }

    // Tri par date et heure
    query = query.order('date', { ascending: true }).order('start_time', { ascending: true });

    // Pagination
    if (pagination) {
      const { from, to } = this.getPaginationRange(pagination);
      query = query.range(from, to);
    }

    try {
      const { data: availabilities, error, count } = await query;

      if (error) throw error;

      // Récupérer les IDs de golf uniques
      const golfIds = [...new Set(availabilities?.map(a => a.golf_course_id).filter(Boolean))];
      
      // Récupérer les données de golf en une seule requête
      let golfData: Record<string, any> = {};
      if (golfIds.length > 0) {
        const { data: golfs } = await this.supabase
          .from('golf_parcours')
          .select('*')
          .in('id', golfIds);

        if (golfs) {
          golfs.forEach(golf => {
            golfData[golf.id] = golf;
          });
        }
      }

      // Combiner les données
      let result = availabilities?.map(availability => ({
        ...availability,
        golf_courses: golfData[availability.golf_course_id] || null
      })) as AvailabilityWithDetails[];

      // Filtrer côté client si hasSlots est défini
      if (result && filters.hasSlots) {
        result = result.filter((avail) => avail.current_bookings < avail.max_players);
      }

      return {
        data: result || [],
        error: null,
        count
      };
    } catch (error: any) {
      return {
        data: null,
        error: this.handleError(error)
      };
    }
  }

  /**
   * Crée une disponibilité pour un pro
   */
  async createAvailability(
    data: TablesInsert<'pro_availabilities'>
  ): Promise<ServiceResponse<ProAvailability>> {
    return this.handleResponse<ProAvailability>(
      this.supabase.from('pro_availabilities').insert(data).select().single()
    );
  }

  /**
   * Crée plusieurs disponibilités (pour la récurrence)
   */
  async createRecurringAvailabilities(
    baseData: TablesInsert<'pro_availabilities'>,
    dates: string[]
  ): Promise<ServiceResponse<ProAvailability[]>> {
    const availabilities = dates.map((date) => ({
      ...baseData,
      date,
      is_recurring: true,
    }));

    return this.handleResponse<ProAvailability[]>(
      this.supabase.from('pro_availabilities').insert(availabilities).select()
    );
  }

  /**
   * Supprime une disponibilité
   */
  async deleteAvailability(availabilityId: string): Promise<ServiceResponse<void>> {
    try {
      // Vérifier qu'il n'y a pas de réservations
      const { count } = await this.supabase
        .from('bookings')
        .select('*', { count: 'exact', head: true })
        .eq('availability_id', availabilityId)
        .neq('status', 'cancelled');

      if (count && count > 0) {
        throw new Error('Impossible de supprimer : des réservations existent');
      }

      const { error } = await this.supabase
        .from('pro_availabilities')
        .delete()
        .eq('id', availabilityId);

      if (error) throw error;

      return {
        data: undefined,
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
   * Calcule le prix total d'une réservation
   */
  calculateBookingPrice(
    proHourlyRate: number,
    numberOfPlayers: number,
    duration: number = 240 // 4 heures par défaut
  ): {
    proFee: number;
    platformFee: number;
    totalAmount: number;
  } {
    const hours = duration / 60;
    const proFee = Math.round(proHourlyRate * hours);
    const platformFee = Math.round(proFee * 0.2); // 20% de commission
    const totalAmount = proFee + platformFee;

    return {
      proFee,
      platformFee,
      totalAmount,
    };
  }
}

export const bookingService = new BookingService();
