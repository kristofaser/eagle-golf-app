import { supabase } from '@/utils/supabase/client';

export interface TravelNotificationPreferences {
  user_id: string;
  enabled: boolean;
  created_at?: string;
  updated_at?: string;
}

class TravelNotificationService {
  /**
   * Récupère les préférences de notification voyage d'un utilisateur
   */
  async getPreferences(userId: string) {
    try {
      const { data, error } = await supabase
        .from('user_travel_alerts')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Erreur récupération préférences voyage:', error);
        return { data: null, error };
      }

      // Transformer les données pour la compatibilité
      if (data) {
        const transformed = {
          user_id: data.user_id,
          enabled: data.alerts_enabled,
          created_at: data.created_at,
          updated_at: data.updated_at
        };
        return { data: transformed, error: null };
      }

      return { data, error: null };
    } catch (err) {
      console.error('Erreur service préférences voyage:', err);
      return { data: null, error: err };
    }
  }

  /**
   * Met à jour ou crée les préférences de notification voyage
   */
  async updatePreferences(userId: string, enabled: boolean) {
    try {
      const { data, error } = await supabase
        .from('user_travel_alerts')
        .upsert({
          user_id: userId,
          alerts_enabled: enabled,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id'
        })
        .select()
        .single();

      if (error) {
        console.error('Erreur mise à jour préférences voyage:', error);
        return { data: null, error };
      }

      console.log('✅ Préférences voyage mises à jour en base:', { userId, enabled });
      return { data, error: null };
    } catch (err) {
      console.error('Erreur service mise à jour préférences voyage:', err);
      return { data: null, error: err };
    }
  }

  /**
   * Supprime les préférences de notification voyage
   */
  async deletePreferences(userId: string) {
    try {
      const { error } = await supabase
        .from('user_travel_alerts')
        .delete()
        .eq('user_id', userId);

      if (error) {
        console.error('Erreur suppression préférences voyage:', error);
        return { error };
      }

      console.log('🗑️ Préférences voyage supprimées de la base:', userId);
      return { error: null };
    } catch (err) {
      console.error('Erreur service suppression préférences voyage:', err);
      return { error: err };
    }
  }

  /**
   * Récupère tous les utilisateurs ayant activé les notifications voyage
   * (pour l'envoi de notifications côté admin)
   */
  async getEnabledUsers() {
    try {
      const { data, error } = await supabase
        .from('user_travel_alerts')
        .select(`
          user_id,
          profiles!inner(
            id,
            email,
            first_name,
            last_name
          )
        `)
        .eq('alerts_enabled', true);

      if (error) {
        console.error('Erreur récupération utilisateurs alertes voyage:', error);
        return { data: null, error };
      }

      return { data, error: null };
    } catch (err) {
      console.error('Erreur service utilisateurs alertes voyage:', err);
      return { data: null, error: err };
    }
  }
}

export const travelNotificationService = new TravelNotificationService();