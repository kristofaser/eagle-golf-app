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
  golf_parcours: GolfParcours;
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
        .select(
          `
          *,
          golf_parcours:golf_parcours(*)
        `
        )
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
        const course = availability.golf_parcours;

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

      return data?.map((item) => item.date) || [];
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
      const availabilities = dates.map((date) => ({
        pro_id: proId,
        golf_course_id: golfCourseId,
        date,
        start_time: '09:00', // Créneau par défaut
        end_time: '17:00', // Créneau par défaut
        max_players: 4, // Par défaut
        current_bookings: 0,
      }));

      const { error } = await supabase.from('pro_availabilities').insert(availabilities);

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
  async deleteProAvailabilitiesByCourse(proId: string, golfCourseId: string): Promise<boolean> {
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
   * Récupère tous les pros ayant des disponibilités sur un parcours donné
   */
  async getProsAvailableOnCourse(golfCourseId: string) {
    try {
      const { data, error } = await supabase
        .from('pro_availabilities')
        .select(
          `
          pro_id,
          pro_profiles!pro_availabilities_pro_id_fkey(
            user_id,
            skill_driving,
            skill_putting,
            skill_irons,
            skill_wedging,
            skill_chipping,
            skill_mental,
            division,
            world_ranking,
            profiles!pro_profiles_user_id_fkey(
              id,
              first_name,
              last_name,
              avatar_url,
              city
            )
          )
        `
        )
        .eq('golf_course_id', golfCourseId)
        .gte('date', new Date().toISOString().split('T')[0]) // Dates futures uniquement
        .gt('max_players', 0); // Créneaux disponibles uniquement

      if (error) {
        console.error('Erreur récupération pros disponibles sur parcours:', error);
        return { data: null, error };
      }

      // Déduplication des pros (un pro peut avoir plusieurs créneaux)
      const uniquePros = data?.reduce((acc: any[], current: any) => {
        const proProfile = current.pro_profiles;
        const profile = proProfile?.profiles;

        if (!profile) return acc;

        const existingPro = acc.find((pro) => pro.id === profile.id);
        if (!existingPro) {
          acc.push({
            id: profile.id,
            first_name: profile.first_name,
            last_name: profile.last_name,
            avatar_url: profile.avatar_url,
            city: profile.city,
            pro_profiles: {
              skill_driving: proProfile.skill_driving,
              skill_putting: proProfile.skill_putting,
              skill_irons: proProfile.skill_irons,
              skill_wedging: proProfile.skill_wedging,
              skill_chipping: proProfile.skill_chipping,
              skill_mental: proProfile.skill_mental,
              division: proProfile.division,
              world_ranking: proProfile.world_ranking,
            },
          });
        }
        return acc;
      }, []);

      return { data: uniquePros || [], error: null };
    } catch (error) {
      console.error('Erreur récupération pros disponibles sur parcours:', error);
      return { data: null, error };
    }
  },

  /**
   * Vérifie s'il existe des réservations actives pour un pro sur un parcours
   */
  async checkExistingBookingsForCourse(
    proId: string,
    golfCourseId: string
  ): Promise<{ hasBookings: boolean; bookingsCount: number }> {
    try {
      console.log('🔍 [checkExistingBookingsForCourse] Début vérification:', {
        proId,
        golfCourseId,
      });

      // Récupérer toutes les disponibilités du pro sur ce parcours
      const { data: availabilities, error: availError } = await supabase
        .from('pro_availabilities')
        .select('id')
        .eq('pro_id', proId)
        .eq('golf_course_id', golfCourseId);

      if (availError) {
        console.error(
          '❌ [checkExistingBookingsForCourse] Erreur récupération disponibilités:',
          availError
        );
        return { hasBookings: false, bookingsCount: 0 };
      }

      console.log(
        '📋 [checkExistingBookingsForCourse] Disponibilités trouvées:',
        availabilities?.length || 0
      );

      if (!availabilities || availabilities.length === 0) {
        console.log(
          '⚠️ [checkExistingBookingsForCourse] Aucune disponibilité → autoriser suppression'
        );
        return { hasBookings: false, bookingsCount: 0 };
      }

      // Vérifier s'il y a des réservations actives pour ces disponibilités
      const availabilityIds = availabilities.map((a) => a.id);
      console.log(
        '🎯 [checkExistingBookingsForCourse] Availability IDs à vérifier:',
        availabilityIds
      );

      const { count, error: bookingError } = await supabase
        .from('bookings')
        .select('*', { count: 'exact', head: true })
        .in('availability_id', availabilityIds)
        .in('status', ['pending', 'confirmed']);

      if (bookingError) {
        console.error(
          '❌ [checkExistingBookingsForCourse] Erreur vérification réservations:',
          bookingError
        );
        return { hasBookings: false, bookingsCount: 0 };
      }

      const bookingsCount = count || 0;
      console.log(
        '📊 [checkExistingBookingsForCourse] Réservations actives trouvées:',
        bookingsCount
      );

      const result = {
        hasBookings: bookingsCount > 0,
        bookingsCount,
      };

      console.log('✅ [checkExistingBookingsForCourse] Résultat final:', result);
      return result;
    } catch (error) {
      console.error(
        '💥 [checkExistingBookingsForCourse] Erreur vérification réservations existantes:',
        error
      );
      return { hasBookings: false, bookingsCount: 0 };
    }
  },

  /**
   * Met à jour intelligemment les disponibilités d'un pro sur un parcours
   * - Conserve les disponibilités avec des réservations
   * - Supprime uniquement les disponibilités sans réservations
   * - Ajoute les nouvelles dates
   */
  async updateProAvailabilitiesIntelligent(
    proId: string,
    golfCourseId: string,
    newDates: string[]
  ): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('🔄 [updateProAvailabilitiesIntelligent] Début mise à jour intelligente:', {
        proId,
        golfCourseId,
        newDatesCount: newDates.length,
      });

      // 1. Récupérer toutes les disponibilités existantes
      const { data: existingAvailabilities, error: fetchError } = await supabase
        .from('pro_availabilities')
        .select('id, date')
        .eq('pro_id', proId)
        .eq('golf_course_id', golfCourseId);

      if (fetchError) {
        console.error('❌ Erreur récupération disponibilités existantes:', fetchError);
        return { success: false, error: 'Erreur lors de la récupération des disponibilités' };
      }

      const existingDates = existingAvailabilities?.map((a) => a.date) || [];
      console.log('📋 Dates existantes:', existingDates);
      console.log('📋 Nouvelles dates demandées:', newDates);

      // 2. Identifier les dates à ajouter, supprimer et conserver
      const datesToAdd = newDates.filter((date) => !existingDates.includes(date));
      const datesToRemove = existingDates.filter((date) => !newDates.includes(date));
      const datesToKeep = existingDates.filter((date) => newDates.includes(date));

      console.log('➕ Dates à ajouter:', datesToAdd);
      console.log('➖ Dates à supprimer:', datesToRemove);
      console.log('✅ Dates à conserver:', datesToKeep);

      // 3. Pour les dates à supprimer, vérifier qu'il n'y a pas de réservations
      if (datesToRemove.length > 0) {
        // Récupérer les IDs des disponibilités à supprimer
        const availabilitiesToRemove = existingAvailabilities?.filter((a) =>
          datesToRemove.includes(a.date)
        ) || [];
        const idsToRemove = availabilitiesToRemove.map((a) => a.id);

        if (idsToRemove.length > 0) {
          // Vérifier s'il y a des réservations sur ces disponibilités
          const { count: bookingsCount, error: bookingCheckError } = await supabase
            .from('bookings')
            .select('*', { count: 'exact', head: true })
            .in('availability_id', idsToRemove)
            .in('status', ['pending', 'confirmed']);

          if (bookingCheckError) {
            console.error('❌ Erreur vérification réservations:', bookingCheckError);
            return { success: false, error: 'Erreur lors de la vérification des réservations' };
          }

          if (bookingsCount && bookingsCount > 0) {
            console.log(`⚠️ ${bookingsCount} réservation(s) active(s) empêche(nt) la suppression`);
            return {
              success: false,
              error: `Impossible de supprimer certaines disponibilités car ${bookingsCount} réservation(s) sont en cours. Annulez d'abord les réservations concernées.`,
            };
          }

          // Supprimer les disponibilités sans réservations
          const { error: deleteError } = await supabase
            .from('pro_availabilities')
            .delete()
            .in('id', idsToRemove);

          if (deleteError) {
            console.error('❌ Erreur suppression disponibilités:', deleteError);
            return { success: false, error: 'Erreur lors de la suppression des disponibilités' };
          }

          console.log(`✅ ${idsToRemove.length} disponibilité(s) supprimée(s)`);
        }
      }

      // 4. Ajouter les nouvelles dates
      if (datesToAdd.length > 0) {
        const newAvailabilities = datesToAdd.map((date) => ({
          pro_id: proId,
          golf_course_id: golfCourseId,
          date,
          start_time: '09:00',
          end_time: '17:00',
          max_players: 4,
          current_bookings: 0,
        }));

        const { error: insertError } = await supabase
          .from('pro_availabilities')
          .insert(newAvailabilities);

        if (insertError) {
          console.error('❌ Erreur création disponibilités:', insertError);
          // Si c'est une erreur de duplication, on peut l'ignorer
          if (insertError.code !== '23505') {
            return { success: false, error: 'Erreur lors de la création des nouvelles disponibilités' };
          }
        }

        console.log(`✅ ${datesToAdd.length} nouvelle(s) disponibilité(s) créée(s)`);
      }

      console.log('✅ Mise à jour intelligente terminée avec succès');
      return { success: true };
    } catch (error) {
      console.error('💥 Erreur mise à jour intelligente disponibilités:', error);
      return { success: false, error: 'Une erreur inattendue est survenue' };
    }
  },

  /**
   * Met à jour les disponibilités d'un pro sur un parcours
   * Utilise maintenant la méthode intelligente qui gère les réservations existantes
   */
  async updateProAvailabilities(
    proId: string,
    golfCourseId: string,
    dates: string[]
  ): Promise<boolean> {
    const result = await this.updateProAvailabilitiesIntelligent(proId, golfCourseId, dates);
    return result.success;
  },
};
