import { createServiceClient } from '@/lib/supabase/server';

export interface ProAvailability {
  id: string;
  pro_id: string;
  golf_course_id: string;
  date: string;
  start_time: string;
  end_time: string;
  max_players: number;
  current_bookings: number;
  is_available: boolean;
  golf_parcours?: {
    name: string;
    city: string;
  };
}

export const availabilitiesService = {
  /**
   * Récupère les disponibilités d'un professionnel pour les 60 prochains jours (pour calendrier)
   */
  async getProAvailabilities(proId: string): Promise<ProAvailability[]> {
    try {
      const supabase = await createServiceClient();

      // Date actuelle et dans 60 jours
      const today = new Date().toISOString().split('T')[0];
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 60);
      const future = futureDate.toISOString().split('T')[0];

      const { data, error } = await supabase
        .from('pro_availabilities')
        .select(`
          id,
          pro_id,
          golf_course_id,
          date,
          start_time,
          end_time,
          max_players,
          current_bookings,
          is_available,
          golf_parcours!golf_course_id (
            name,
            city
          )
        `)
        .eq('pro_id', proId)
        .gte('date', today)
        .lte('date', future)
        .eq('is_available', true)
        .order('date', { ascending: true })
        .order('start_time', { ascending: true });
        // Pas de limite pour affichage calendrier

      if (error) {
        console.error('Erreur récupération disponibilités:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Erreur service disponibilités:', error);
      return [];
    }
  }
};