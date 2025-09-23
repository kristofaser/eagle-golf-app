import { supabase } from '@/utils/supabase/client';

export interface RecurringAvailability {
  [key: string]: boolean; // Format: "dayIndex_periodIndex" => true/false
}

export interface ProUnavailability {
  id?: string;
  pro_id: string;
  start_date: string;
  end_date: string;
  reason?: string;
  created_at?: string;
}

export interface ProAvailabilitySettings {
  pro_id: string;
  recurring_availability: RecurringAvailability;
  is_globally_available: boolean;
  default_message?: string;
  updated_at?: string;
}

export interface ProDailyAvailability {
  id?: string;
  pro_id: string;
  date: string;
  is_available: boolean;
  is_booked?: boolean;
  booking_id?: string | null;
  notes?: string | null;
  created_at?: string;
  updated_at?: string;
}

export const availabilityService = {
  /**
   * Récupère les paramètres de disponibilité d'un pro
   */
  async getProAvailabilitySettings(proId: string): Promise<ProAvailabilitySettings | null> {
    try {
      const { data, error } = await supabase
        .from('pro_availability_settings')
        .select('*')
        .eq('pro_id', proId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Erreur récupération paramètres disponibilité:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Erreur récupération paramètres disponibilité:', error);
      return null;
    }
  },

  /**
   * Met à jour les paramètres de disponibilité d'un pro
   */
  async updateProAvailabilitySettings(
    proId: string,
    settings: Omit<ProAvailabilitySettings, 'pro_id' | 'updated_at'>
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('pro_availability_settings')
        .upsert({
          pro_id: proId,
          ...settings,
          updated_at: new Date().toISOString(),
        })
        .eq('pro_id', proId);

      if (error) {
        console.error('Erreur mise à jour paramètres disponibilité:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Erreur mise à jour paramètres disponibilité:', error);
      return false;
    }
  },

  /**
   * Récupère les périodes d'indisponibilité d'un pro
   */
  async getProUnavailabilities(proId: string): Promise<ProUnavailability[]> {
    try {
      const { data, error } = await supabase
        .from('pro_unavailabilities')
        .select('*')
        .eq('pro_id', proId)
        .gte('end_date', new Date().toISOString().split('T')[0])
        .order('start_date', { ascending: true });

      if (error) {
        console.error('Erreur récupération indisponibilités:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Erreur récupération indisponibilités:', error);
      return [];
    }
  },

  /**
   * Ajoute une période d'indisponibilité
   */
  async addProUnavailability(
    unavailability: Omit<ProUnavailability, 'id' | 'created_at'>
  ): Promise<string | null> {
    try {
      const { data, error } = await supabase
        .from('pro_unavailabilities')
        .insert(unavailability)
        .select('id')
        .single();

      if (error) {
        console.error('Erreur ajout indisponibilité:', error);
        return null;
      }

      return data?.id || null;
    } catch (error) {
      console.error('Erreur ajout indisponibilité:', error);
      return null;
    }
  },

  /**
   * Supprime une période d'indisponibilité
   */
  async deleteProUnavailability(id: string): Promise<boolean> {
    try {
      const { error } = await supabase.from('pro_unavailabilities').delete().eq('id', id);

      if (error) {
        console.error('Erreur suppression indisponibilité:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Erreur suppression indisponibilité:', error);
      return false;
    }
  },

  /**
   * Synchronise toutes les indisponibilités
   */
  async syncProUnavailabilities(
    proId: string,
    unavailabilities: Omit<ProUnavailability, 'pro_id' | 'created_at'>[]
  ): Promise<boolean> {
    try {
      // Supprimer toutes les indisponibilités futures
      await supabase
        .from('pro_unavailabilities')
        .delete()
        .eq('pro_id', proId)
        .gte('end_date', new Date().toISOString().split('T')[0]);

      // Ajouter les nouvelles indisponibilités
      if (unavailabilities.length > 0) {
        const dataToInsert = unavailabilities.map((u) => ({
          ...u,
          pro_id: proId,
        }));

        const { error } = await supabase.from('pro_unavailabilities').insert(dataToInsert);

        if (error) {
          console.error('Erreur synchronisation indisponibilités:', error);
          return false;
        }
      }

      return true;
    } catch (error) {
      console.error('Erreur synchronisation indisponibilités:', error);
      return false;
    }
  },

  /**
   * Vérifie si un pro est disponible à une date et période donnée
   */
  async isProAvailable(
    proId: string,
    date: Date,
    period: 'morning' | 'afternoon'
  ): Promise<boolean> {
    try {
      // Récupérer les paramètres
      const settings = await this.getProAvailabilitySettings(proId);

      if (!settings || !settings.is_globally_available) {
        return false;
      }

      // Vérifier la disponibilité récurrente
      const dayIndex = date.getDay() === 0 ? 6 : date.getDay() - 1; // Convertir dimanche de 0 à 6
      const periodIndex = period === 'morning' ? 0 : 1;
      const key = `${dayIndex}_${periodIndex}`;

      if (!settings.recurring_availability[key]) {
        return false;
      }

      // Vérifier les indisponibilités
      const dateStr = date.toISOString().split('T')[0];
      const unavailabilities = await this.getProUnavailabilities(proId);

      for (const unavail of unavailabilities) {
        if (dateStr >= unavail.start_date && dateStr <= unavail.end_date) {
          return false;
        }
      }

      return true;
    } catch (error) {
      console.error('Erreur vérification disponibilité:', error);
      return false;
    }
  },

  /**
   * Génère les créneaux disponibles pour les prochaines semaines
   */
  async generateAvailableSlots(
    proId: string,
    weeksAhead: number = 4
  ): Promise<Array<{ date: string; period: 'morning' | 'afternoon' }>> {
    const slots: Array<{ date: string; period: 'morning' | 'afternoon' }> = [];
    const today = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + weeksAhead * 7);

    for (let d = new Date(today); d <= endDate; d.setDate(d.getDate() + 1)) {
      const morningAvailable = await this.isProAvailable(proId, new Date(d), 'morning');
      const afternoonAvailable = await this.isProAvailable(proId, new Date(d), 'afternoon');

      if (morningAvailable) {
        slots.push({
          date: d.toISOString().split('T')[0],
          period: 'morning',
        });
      }

      if (afternoonAvailable) {
        slots.push({
          date: d.toISOString().split('T')[0],
          period: 'afternoon',
        });
      }
    }

    return slots;
  },

  /**
   * @deprecated Utilisez amateurAvailabilityService.getProAvailableDays() à la place
   * Récupère les disponibilités journalières d'un pro (legacy)
   */
  async getProDailyAvailabilities(
    proId: string,
    startDate?: string,
    endDate?: string
  ): Promise<ProDailyAvailability[]> {
    console.warn(
      '⚠️ getProDailyAvailabilities est déprécié. Utilisez amateurAvailabilityService.getProAvailableDays()'
    );
    return [];
  },

  /**
   * @deprecated Le système pro_daily_availabilities n'est plus utilisé
   * Met à jour les disponibilités journalières d'un pro (legacy)
   */
  async updateProDailyAvailabilities(
    proId: string,
    availabilities: Array<{ date: string; is_available: boolean }>
  ): Promise<boolean> {
    console.warn(
      '⚠️ updateProDailyAvailabilities est déprécié. Utilisez proAvailabilityService à la place'
    );
    return true; // Retourne true pour éviter les erreurs dans l'ancien code
  },

  /**
   * @deprecated Le système pro_daily_availabilities n'est plus utilisé
   * Supprime les disponibilités journalières non disponibles d'un pro (legacy)
   */
  async cleanupProDailyAvailabilities(proId: string): Promise<boolean> {
    console.warn('⚠️ cleanupProDailyAvailabilities est déprécié.');
    return true; // Retourne true pour éviter les erreurs dans l'ancien code
  },

  /**
   * @deprecated Utilisez amateurAvailabilityService.checkAvailabilityForCourseAndDate() à la place
   * Vérifie si un pro est disponible à une date donnée (legacy)
   */
  async isProDailyAvailable(proId: string, date: string): Promise<boolean> {
    console.warn(
      '⚠️ isProDailyAvailable est déprécié. Utilisez amateurAvailabilityService.checkAvailabilityForCourseAndDate()'
    );
    return false; // Par défaut, pas disponible pour forcer l'utilisation du nouveau système
  },
};
