import { supabase } from '@/utils/supabase/client';
import { GolfParcours } from './golf-parcours.service';

export interface ProAvailability {
  id: string;
  pro_id: string;
  golf_course_id: string;
  date: string;
  start_time: string;
  end_time: string;
  max_players: number;
  current_bookings: number;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface ProAvailabilityWithCourse extends ProAvailability {
  golf_courses: GolfParcours;
}

export interface ProAvailabilityGroup {
  course: GolfParcours;
  dates: string[];
  availabilities: ProAvailability[];
}

export const proAvailabilityService = {
  /**
   * Récupère les disponibilités d'un pro groupées par parcours
   */
  async getProAvailabilitiesGrouped(proId: string): Promise<ProAvailabilityGroup[]> {
    try {
      const { data, error } = await supabase
        .from('pro_availabilities')
        .select(`
          *,
          golf_courses:golf_parcours(*)
        `)
        .eq('pro_id', proId)
        .gte('date', new Date().toISOString().split('T')[0]) // Dates futures uniquement
        .order('date', { ascending: true });

      if (error) {
        console.error('Erreur récupération disponibilités groupées:', error);
        return [];
      }

      if (!data || data.length === 0) {
        return [];
      }

      // Grouper par parcours
      const grouped = new Map<string, ProAvailabilityGroup>();

      data.forEach((availability) => {
        const courseId = availability.golf_course_id;
        const course = availability.golf_courses;

        if (!grouped.has(courseId)) {
          grouped.set(courseId, {
            course,
            dates: [],
            availabilities: [],
          });
        }

        const group = grouped.get(courseId)!;
        group.dates.push(availability.date);
        group.availabilities.push(availability);
      });

      return Array.from(grouped.values());
    } catch (error) {
      console.error('Erreur récupération disponibilités groupées:', error);
      return [];
    }
  },

  /**
   * Récupère les dates déjà occupées par d'autres parcours (pour éviter les conflits)
   */
  async getConflictDates(proId: string, excludeCourseId?: string): Promise<string[]> {
    try {
      let query = supabase
        .from('pro_availabilities')
        .select('date')
        .eq('pro_id', proId)
        .gte('date', new Date().toISOString().split('T')[0]);

      // Exclure un parcours spécifique si demandé (pour modification)
      if (excludeCourseId) {
        query = query.neq('golf_course_id', excludeCourseId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Erreur récupération dates conflits:', error);
        return [];
      }

      return data?.map(item => item.date) || [];
    } catch (error) {
      console.error('Erreur récupération dates conflits:', error);
      return [];
    }
  },

  /**
   * Crée des disponibilités pour un pro sur un parcours à des dates données
   */
  async createProAvailabilities(
    proId: string,
    golfCourseId: string,
    dates: string[]
  ): Promise<boolean> {
    try {
      // Préparer les données à insérer
      const availabilities = dates.map(date => ({
        pro_id: proId,
        golf_course_id: golfCourseId,
        date,
        start_time: '09:00', // Créneau par défaut
        end_time: '17:00',   // Créneau par défaut
        max_players: 4,      // Par défaut
        current_bookings: 0,
      }));

      const { error } = await supabase
        .from('pro_availabilities')
        .insert(availabilities);

      if (error) {
        console.error('Erreur création disponibilités:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Erreur création disponibilités:', error);
      return false;
    }
  },

  /**
   * Supprime toutes les disponibilités d'un pro sur un parcours
   */
  async deleteProAvailabilitiesByCourse(
    proId: string,
    golfCourseId: string
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('pro_availabilities')
        .delete()
        .eq('pro_id', proId)
        .eq('golf_course_id', golfCourseId);

      if (error) {
        console.error('Erreur suppression disponibilités:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Erreur suppression disponibilités:', error);
      return false;
    }
  },

  /**
   * Met à jour les disponibilités d'un pro sur un parcours
   */
  async updateProAvailabilities(
    proId: string,
    golfCourseId: string,
    dates: string[]
  ): Promise<boolean> {
    try {
      // Supprimer les anciennes disponibilités
      await this.deleteProAvailabilitiesByCourse(proId, golfCourseId);

      // Créer les nouvelles disponibilités
      return await this.createProAvailabilities(proId, golfCourseId, dates);
    } catch (error) {
      console.error('Erreur mise à jour disponibilités:', error);
      return false;
    }
  },
};