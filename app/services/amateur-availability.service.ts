import { supabase } from '@/utils/supabase/client';
import { GolfParcours } from './golf-parcours.service';

export interface TimeSlot {
  time: string;
  hour: string;
  period: 'morning' | 'afternoon';
  available: boolean;
}

export interface ProDayAvailability {
  date: string;
  hasAvailability: boolean;
  slotsCount?: number;
  golfCourseId?: string;
  golfCourseName?: string;
}

export interface DailyAvailabilityData {
  date: string;
  is_available: boolean;
  is_booked: boolean;
  booking_id?: string | null;
  golf_course_id?: string;
  golf_course_name?: string;
}

export interface BookingCheck {
  start_time: string;
  booking_date: string;
  pro_id: string;
  golf_course_id?: string;
}

export const amateurAvailabilityService = {
  /**
   * Récupère les jours disponibles d'un pro (vue amateur) - nouveau système
   */
  async getProAvailableDays(
    proId: string,
    startDate: string,
    endDate: string,
    golfCourseId?: string
  ): Promise<{ data: DailyAvailabilityData[] | null; error: unknown }> {
    try {
      let query = supabase
        .from('pro_availabilities')
        .select(`
          date,
          max_players,
          current_bookings,
          golf_course_id,
          golf_courses:golf_parcours(name)
        `)
        .eq('pro_id', proId)
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date', { ascending: true });

      // Si un parcours spécifique est demandé
      if (golfCourseId) {
        query = query.eq('golf_course_id', golfCourseId);
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      // Transformer les données pour correspondre à l'ancien format
      const transformedData: DailyAvailabilityData[] = (data || [])
        .filter(avail => avail.current_bookings < avail.max_players) // Disponible pour réservation
        .map(avail => ({
          date: avail.date,
          is_available: true,
          is_booked: avail.current_bookings >= avail.max_players,
          booking_id: null, // Les bookings individuels ne bloquent plus toute la journée
          golf_course_id: avail.golf_course_id,
          golf_course_name: avail.golf_courses?.name,
        }));

      return { data: transformedData, error: null };
    } catch (err) {
      console.error('Erreur récupération jours disponibles:', err);
      return { data: null, error: err };
    }
  },

  /**
   * Récupère les jours disponibles d'un pro pour un parcours spécifique
   */
  async getProAvailableDaysForCourse(
    proId: string,
    golfCourseId: string,
    startDate: string,
    endDate: string
  ): Promise<{ data: DailyAvailabilityData[] | null; error: unknown }> {
    return this.getProAvailableDays(proId, startDate, endDate, golfCourseId);
  },

  /**
   * Vérifie si un pro a des réservations confirmées pour une date et parcours donnés
   */
  async hasBookingsForDate(
    proId: string, 
    dateString: string, 
    golfCourseId?: string
  ): Promise<boolean> {
    try {
      let query = supabase
        .from('bookings')
        .select('id')
        .eq('pro_id', proId)
        .eq('booking_date', dateString)
        .in('status', ['confirmed', 'pending']);

      if (golfCourseId) {
        query = query.eq('golf_course_id', golfCourseId);
      }

      const { data, error } = await query.limit(1);

      if (error) {
        console.error('Erreur vérification réservations pour date:', error);
        return false;
      }

      const hasBookings = (data && data.length > 0);
      console.log(`🔍 Vérification réservation ${dateString} (parcours: ${golfCourseId || 'tous'}): ${hasBookings ? 'RÉSERVÉ' : 'LIBRE'}`);
      
      return hasBookings;
    } catch (err) {
      console.error('Erreur vérification réservations pour date:', err);
      return false;
    }
  },

  /**
   * Vérifie la disponibilité d'un pro sur un parcours à une date donnée
   */
  async checkAvailabilityForCourseAndDate(
    proId: string,
    golfCourseId: string,
    dateString: string
  ): Promise<{ available: boolean; maxPlayers: number; currentBookings: number }> {
    try {
      const { data, error } = await supabase
        .from('pro_availabilities')
        .select('max_players, current_bookings')
        .eq('pro_id', proId)
        .eq('golf_course_id', golfCourseId)
        .eq('date', dateString)
        .single();

      if (error || !data) {
        return { available: false, maxPlayers: 0, currentBookings: 0 };
      }

      return {
        available: data.current_bookings < data.max_players,
        maxPlayers: data.max_players,
        currentBookings: data.current_bookings,
      };
    } catch (err) {
      console.error('Erreur vérification disponibilité parcours/date:', err);
      return { available: false, maxPlayers: 0, currentBookings: 0 };
    }
  },

  /**
   * Génère les créneaux horaires standards pour un jour disponible
   */
  generateSlotsForDate(date: string): TimeSlot[] {
    return [
      { time: '7h', hour: '07:00', period: 'morning', available: true },
      { time: '8h', hour: '08:00', period: 'morning', available: true },
      { time: '9h', hour: '09:00', period: 'morning', available: true },
      { time: '10h', hour: '10:00', period: 'morning', available: true },
      { time: '11h', hour: '11:00', period: 'morning', available: true },
      { time: '12h', hour: '12:00', period: 'afternoon', available: true },
      { time: '13h', hour: '13:00', period: 'afternoon', available: true },
      { time: '14h', hour: '14:00', period: 'afternoon', available: true },
    ];
  },

  /**
   * Vérifie les réservations existantes pour une date donnée
   */
  async getExistingBookingsForDate(proId: string, date: string): Promise<BookingCheck[]> {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select('start_time, booking_date, pro_id')
        .eq('pro_id', proId)
        .eq('booking_date', date)
        .in('status', ['confirmed', 'pending']);

      if (error) {
        console.error('Erreur vérification réservations:', error);
        return [];
      }

      return data || [];
    } catch (err) {
      console.error('Erreur vérification réservations:', err);
      return [];
    }
  },

  /**
   * Génère les créneaux disponibles pour une date et parcours,
   * en tenant compte des réservations existantes - nouveau système
   */
  async getAvailableSlotsForDate(
    proId: string, 
    date: string, 
    golfCourseId?: string
  ): Promise<TimeSlot[]> {
    // Si un parcours est spécifié, vérifier sa disponibilité
    if (golfCourseId) {
      const availability = await this.checkAvailabilityForCourseAndDate(proId, golfCourseId, date);
      if (!availability.available) {
        return []; // Pas de créneaux disponibles sur ce parcours
      }
      // Retourner les créneaux selon la capacité restante
      return this.generateSlotsForDate(date);
    }

    // Sinon, vérifier tous les parcours où le pro est disponible
    const { data: dayAvailability } = await this.getProAvailableDays(proId, date, date);

    if (!dayAvailability || dayAvailability.length === 0) {
      return [];
    }

    // Si le pro est disponible sur au moins un parcours, générer les créneaux
    return this.generateSlotsForDate(date);
  },

  /**
   * Génère les créneaux disponibles pour un parcours spécifique
   */
  async getAvailableSlotsForCourseAndDate(
    proId: string, 
    golfCourseId: string, 
    date: string
  ): Promise<TimeSlot[]> {
    return this.getAvailableSlotsForDate(proId, date, golfCourseId);
  },

  /**
   * Incrémente le compteur de réservations après création d'une réservation
   */
  async incrementBookingCount(
    proId: string, 
    date: string, 
    golfCourseId: string, 
    bookingId: string
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('pro_availabilities')
        .update({
          current_bookings: supabase.raw('current_bookings + 1'),
        })
        .eq('pro_id', proId)
        .eq('date', date)
        .eq('golf_course_id', golfCourseId);

      if (error) {
        console.error('Erreur incrémentation réservations:', error);
        return false;
      }

      console.log(`✅ Réservation ${bookingId} ajoutée pour ${date} sur parcours ${golfCourseId}`);
      return true;
    } catch (err) {
      console.error('Erreur incrémentation réservations:', err);
      return false;
    }
  },

  /**
   * Décrémente le compteur de réservations après annulation d'une réservation
   */
  async decrementBookingCount(
    proId: string, 
    date: string, 
    golfCourseId: string, 
    bookingId: string
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('pro_availabilities')
        .update({
          current_bookings: supabase.raw('GREATEST(current_bookings - 1, 0)'), // Éviter les valeurs négatives
        })
        .eq('pro_id', proId)
        .eq('date', date)
        .eq('golf_course_id', golfCourseId);

      if (error) {
        console.error('Erreur décrémentation réservations:', error);
        return false;
      }

      console.log(`✅ Réservation ${bookingId} annulée pour ${date} sur parcours ${golfCourseId}`);
      return true;
    } catch (err) {
      console.error('Erreur décrémentation réservations:', err);
      return false;
    }
  },

  /**
   * Méthodes de compatibilité avec l'ancien système
   * @deprecated Utilisez incrementBookingCount à la place
   */
  async markDayAsBooked(proId: string, date: string, bookingId: string): Promise<boolean> {
    console.warn('⚠️ markDayAsBooked est déprécié. Utilisez incrementBookingCount avec golfCourseId.');
    return true; // Retourne true pour éviter les erreurs dans l'ancien code
  },

  /**
   * @deprecated Utilisez decrementBookingCount à la place
   */
  async markDayAsAvailable(proId: string, date: string): Promise<boolean> {
    console.warn('⚠️ markDayAsAvailable est déprécié. Utilisez decrementBookingCount avec golfCourseId.');
    return true; // Retourne true pour éviter les erreurs dans l'ancien code
  },

};
