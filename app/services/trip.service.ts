import { supabase } from '@/utils/supabase/client';
import { Trip, TripStatus } from '@/types/trip';

class TripService {
  /**
   * Récupère tous les voyages
   */
  async getTrips() {
    try {
      const { data, error } = await supabase
        .from('trips')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Erreur récupération voyages:', error);
        throw error;
      }

      return { data: data as Trip[], error: null };
    } catch (error) {
      console.error('Erreur getTrips:', error);
      return { data: null, error };
    }
  }

  /**
   * Récupère les voyages par statut
   */
  async getTripsByStatus(status: TripStatus) {
    try {
      const { data, error } = await supabase
        .from('trips')
        .select('*')
        .eq('status', status)
        .order('created_at', { ascending: false });

      if (error) {
        console.error(`Erreur récupération voyages ${status}:`, error);
        throw error;
      }

      return { data: data as Trip[], error: null };
    } catch (error) {
      console.error(`Erreur getTripsByStatus ${status}:`, error);
      return { data: null, error };
    }
  }

  /**
   * Récupère un voyage par son ID
   */
  async getTripById(id: string) {
    try {
      const { data, error } = await supabase
        .from('trips')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error(`Erreur récupération voyage ${id}:`, error);
        throw error;
      }

      return { data: data as Trip, error: null };
    } catch (error) {
      console.error(`Erreur getTripById ${id}:`, error);
      return { data: null, error };
    }
  }

  /**
   * Écoute les changements en temps réel sur les voyages
   */
  subscribeToTrips(callback: (payload: any) => void) {
    const subscription = supabase
      .channel('trips-channel')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'trips'
        },
        callback
      )
      .subscribe();

    return subscription;
  }
}

export const tripService = new TripService();