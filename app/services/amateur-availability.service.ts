import { supabase } from '@/utils/supabase/client';
import { GolfParcours } from './golf-parcours.service';
import { logger } from '@/utils/logger';

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

export interface ProCourseAvailability {
  golf_course_id: string;
  golf_course_name: string;
  distance_km?: number;
  city: string;
  available_slots_count: number;
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
        .select(
          `
          date,
          max_players,
          current_bookings,
          golf_course_id,
          golf_parcours:golf_parcours(name)
        `
        )
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
        .filter((avail) => avail.current_bookings < avail.max_players) // Disponible pour réservation
        .map((avail) => ({
          date: avail.date,
          is_available: true,
          is_booked: avail.current_bookings >= avail.max_players,
          booking_id: null, // Les bookings individuels ne bloquent plus toute la journée
          golf_course_id: avail.golf_course_id,
          golf_course_name: avail.golf_parcours?.name,
        }));

      return { data: transformedData, error: null };
    } catch (err) {
      logger.error('Erreur récupération jours disponibles:', err);
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
        logger.error('Erreur vérification réservations pour date:', error);
        return false;
      }

      const hasBookings = data && data.length > 0;
      logger.dev(
        `🔍 Vérification réservation ${dateString} (parcours: ${golfCourseId || 'tous'}): ${hasBookings ? 'RÉSERVÉ' : 'LIBRE'}`
      );

      return hasBookings;
    } catch (err) {
      logger.error('Erreur vérification réservations pour date:', err);
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
      logger.error('Erreur vérification disponibilité parcours/date:', err);
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
        logger.error('Erreur vérification réservations:', error);
        return [];
      }

      return data || [];
    } catch (err) {
      logger.error('Erreur vérification réservations:', err);
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
   * Utilise la fonction RPC pour une opération atomique
   */
  async incrementBookingCount(
    proId: string,
    date: string,
    golfCourseId: string,
    bookingId: string
  ): Promise<boolean> {
    try {
      // Récupérer l'availability_id correspondante
      const { data: availability, error: fetchError } = await supabase
        .from('pro_availabilities')
        .select('id')
        .eq('pro_id', proId)
        .eq('date', date)
        .eq('golf_course_id', golfCourseId)
        .single();

      if (fetchError || !availability) {
        logger.error('Erreur récupération availability pour incrémentation:', fetchError);
        return false;
      }

      // Appeler la fonction RPC pour incrémenter de manière atomique
      const { data, error } = await (supabase.rpc as any)('update_booking_count', {
        p_availability_id: availability.id,
        p_delta: 1, // +1 pour incrémenter
      });

      if (error) {
        logger.error('Erreur incrémentation réservations:', error);
        return false;
      }

      if (data && data.success) {
        logger.dev(`✅ Réservation ${bookingId} ajoutée pour ${date} sur parcours ${golfCourseId}`);
        logger.dev(`   Compteur: ${data.previous_count} → ${data.new_count} / ${data.max_players}`);
        return true;
      } else {
        logger.error('Erreur incrémentation:', data?.error || 'Erreur inconnue');
        return false;
      }
    } catch (err) {
      logger.error('Erreur incrémentation réservations:', err);
      return false;
    }
  },

  /**
   * Décrémente le compteur de réservations après annulation d'une réservation
   * Utilise la fonction RPC pour une opération atomique
   */
  async decrementBookingCount(
    proId: string,
    date: string,
    golfCourseId: string,
    bookingId: string
  ): Promise<boolean> {
    try {
      // Récupérer l'availability_id correspondante
      const { data: availability, error: fetchError } = await supabase
        .from('pro_availabilities')
        .select('id')
        .eq('pro_id', proId)
        .eq('date', date)
        .eq('golf_course_id', golfCourseId)
        .single();

      if (fetchError || !availability) {
        logger.error('Erreur récupération availability pour décrémentation:', fetchError);
        return false;
      }

      // Appeler la fonction RPC pour décrémenter de manière atomique
      const { data, error } = await (supabase.rpc as any)('update_booking_count', {
        p_availability_id: availability.id,
        p_delta: -1, // -1 pour décrémenter
      });

      if (error) {
        logger.error('Erreur décrémentation réservations:', error);
        return false;
      }

      if (data && data.success) {
        logger.dev(`✅ Réservation ${bookingId} annulée pour ${date} sur parcours ${golfCourseId}`);
        logger.dev(`   Compteur: ${data.previous_count} → ${data.new_count} / ${data.max_players}`);
        return true;
      } else {
        logger.error('Erreur décrémentation:', data?.error || 'Erreur inconnue');
        return false;
      }
    } catch (err) {
      logger.error('Erreur décrémentation réservations:', err);
      return false;
    }
  },

  /**
   * Récupère les parcours où un pro est disponible avec le nombre de créneaux
   */
  async getProAvailableCourses(
    proId: string,
    userLatitude?: number,
    userLongitude?: number
  ): Promise<{ data: ProCourseAvailability[] | null; error: unknown }> {
    try {
      // Récupérer les disponibilités futures du pro groupées par parcours
      const today = new Date();
      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + 3); // Étendre à 3 mois pour capturer plus de disponibilités

      const { data: availabilities, error } = await supabase
        .from('pro_availabilities')
        .select(
          `
          golf_course_id,
          date,
          max_players,
          current_bookings,
          golf_parcours!inner (
            id,
            name,
            city,
            latitude,
            longitude
          )
        `
        )
        .eq('pro_id', proId)
        .gte('date', today.toISOString().split('T')[0])
        .lte('date', endDate.toISOString().split('T')[0]);

      if (error) throw error;

      if (!availabilities || availabilities.length === 0) {
        return { data: [], error: null };
      }

      // Grouper par parcours et compter les créneaux disponibles
      const courseMap = new Map<string, ProCourseAvailability>();

      availabilities.forEach((avail) => {
        const courseId = avail.golf_course_id;
        const course = avail.golf_parcours as any;

        if (!course) return;

        // Vérifier que le créneau est disponible
        if (avail.current_bookings >= avail.max_players) return;

        if (!courseMap.has(courseId)) {
          let distance_km: number | undefined;

          // Calculer la distance si on a la position de l'utilisateur
          if (userLatitude && userLongitude && course.latitude && course.longitude) {
            const R = 6371; // Rayon de la Terre en km
            const dLat = ((course.latitude - userLatitude) * Math.PI) / 180;
            const dLon = ((course.longitude - userLongitude) * Math.PI) / 180;
            const a =
              Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos((userLatitude * Math.PI) / 180) *
                Math.cos((course.latitude * Math.PI) / 180) *
                Math.sin(dLon / 2) *
                Math.sin(dLon / 2);
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
            distance_km = Math.round(R * c);
          }

          courseMap.set(courseId, {
            golf_course_id: courseId,
            golf_course_name: course.name,
            city: course.city || '',
            distance_km,
            available_slots_count: 0,
          });
        }

        // Incrémenter le nombre de créneaux disponibles
        const courseData = courseMap.get(courseId)!;
        const slotsAvailable = avail.max_players - avail.current_bookings;
        courseData.available_slots_count += slotsAvailable;
      });

      // Convertir en array et trier par distance
      const coursesArray = Array.from(courseMap.values());

      // Trier par distance si disponible, sinon par nom
      coursesArray.sort((a, b) => {
        if (a.distance_km !== undefined && b.distance_km !== undefined) {
          return a.distance_km - b.distance_km;
        }
        return a.golf_course_name.localeCompare(b.golf_course_name);
      });

      return { data: coursesArray, error: null };
    } catch (err) {
      logger.error('Erreur récupération parcours disponibles:', err);
      return { data: null, error: err };
    }
  },

  /**
   * Méthodes de compatibilité avec l'ancien système
   * @deprecated Utilisez incrementBookingCount à la place
   */
  async markDayAsBooked(proId: string, date: string, bookingId: string): Promise<boolean> {
    logger.warn(
      '⚠️ markDayAsBooked est déprécié. Utilisez incrementBookingCount avec golfCourseId.'
    );
    return true; // Retourne true pour éviter les erreurs dans l'ancien code
  },

  /**
   * @deprecated Utilisez decrementBookingCount à la place
   */
  async markDayAsAvailable(proId: string, date: string): Promise<boolean> {
    logger.warn(
      '⚠️ markDayAsAvailable est déprécié. Utilisez decrementBookingCount avec golfCourseId.'
    );
    return true; // Retourne true pour éviter les erreurs dans l'ancien code
  },

  /**
   * Incrémente le compteur de réservations en utilisant directement l'availability_id
   * Version optimisée pour éviter une requête supplémentaire
   */
  async incrementBookingCountById(availabilityId: string, bookingId: string): Promise<boolean> {
    try {
      // Appeler directement la fonction RPC avec l'availability_id
      const { data, error } = await (supabase.rpc as any)('update_booking_count', {
        p_availability_id: availabilityId,
        p_delta: 1, // +1 pour incrémenter
      });

      if (error) {
        logger.error('Erreur incrémentation réservations:', error);
        return false;
      }

      if (data && data.success) {
        logger.dev(`✅ Réservation ${bookingId} ajoutée`);
        logger.dev(`   Compteur: ${data.previous_count} → ${data.new_count} / ${data.max_players}`);
        return true;
      } else {
        logger.error('Erreur incrémentation:', data?.error || 'Erreur inconnue');
        return false;
      }
    } catch (err) {
      logger.error('Erreur incrémentation réservations:', err);
      return false;
    }
  },

  /**
   * Récupère l'availability_id pour une réservation
   * Trouve la disponibilité correspondant à la date, au parcours et au pro
   */
  async getAvailabilityId(
    proId: string,
    golfCourseId: string,
    date: string
  ): Promise<{ availability_id: string | null; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('pro_availabilities')
        .select('id, max_players, current_bookings')
        .eq('pro_id', proId)
        .eq('golf_course_id', golfCourseId)
        .eq('date', date)
        .single();

      if (error) {
        logger.error('❌ Erreur récupération availability_id:', error);
        return {
          availability_id: null,
          error: `Aucune disponibilité trouvée pour cette date et ce parcours`,
        };
      }

      if (!data) {
        return {
          availability_id: null,
          error: 'Aucune disponibilité trouvée',
        };
      }

      // Vérifier qu'il reste de la place
      if (data.current_bookings >= data.max_players) {
        return {
          availability_id: null,
          error: 'Plus de place disponible pour ce créneau',
        };
      }

      logger.dev('✅ Availability trouvée:', data.id);
      return { availability_id: data.id };
    } catch (err) {
      logger.error('❌ Erreur getAvailabilityId:', err);
      return {
        availability_id: null,
        error: err.message || 'Erreur lors de la récupération de la disponibilité',
      };
    }
  },
};
