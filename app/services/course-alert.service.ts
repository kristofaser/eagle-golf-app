import { supabase } from '@/utils/supabase/client';
import { logger } from '@/utils/logger';

export interface CourseAlertPreferences {
  user_id: string;
  golf_course_id: string;
  alerts_enabled: boolean;
  created_at?: string;
  updated_at?: string;
}

class CourseAlertService {
  /**
   * Récupère les préférences d'alerte d'un utilisateur pour un parcours
   */
  async getPreferences(userId: string, golfCourseId: string) {
    try {
      const { data, error } = await supabase
        .from('user_course_alerts')
        .select('*')
        .eq('user_id', userId)
        .eq('golf_course_id', golfCourseId)
        .single();

      if (error && error.code !== 'PGRST116') {
        logger.error('Erreur récupération préférences alerte parcours:', error);
        return { data: null, error };
      }

      return { data, error: null };
    } catch (err) {
      logger.error('Erreur service préférences alerte parcours:', err);
      return { data: null, error: err };
    }
  }

  /**
   * Met à jour ou crée les préférences d'alerte pour un parcours
   */
  async updatePreferences(userId: string, golfCourseId: string, enabled: boolean) {
    try {
      const { data, error } = await supabase
        .from('user_course_alerts')
        .upsert(
          {
            user_id: userId,
            golf_course_id: golfCourseId,
            alerts_enabled: enabled,
            updated_at: new Date().toISOString(),
          },
          {
            onConflict: 'user_id,golf_course_id',
          }
        )
        .select()
        .single();

      if (error) {
        logger.error('Erreur mise à jour préférences alerte parcours:', error);
        return { data: null, error };
      }

      logger.dev('✅ Préférences alerte parcours mises à jour en base:', {
        userId,
        golfCourseId,
        enabled,
      });
      return { data, error: null };
    } catch (err) {
      logger.error('Erreur service mise à jour préférences alerte parcours:', err);
      return { data: null, error: err };
    }
  }

  /**
   * Supprime les préférences d'alerte pour un parcours
   */
  async deletePreferences(userId: string, golfCourseId: string) {
    try {
      const { error } = await supabase
        .from('user_course_alerts')
        .delete()
        .eq('user_id', userId)
        .eq('golf_course_id', golfCourseId);

      if (error) {
        logger.error('Erreur suppression préférences alerte parcours:', error);
        return { error };
      }

      logger.dev('🗑️ Préférences alerte parcours supprimées de la base:', { userId, golfCourseId });
      return { error: null };
    } catch (err) {
      logger.error('Erreur service suppression préférences alerte parcours:', err);
      return { error: err };
    }
  }

  /**
   * Récupère tous les utilisateurs ayant activé les alertes pour un parcours spécifique
   * (pour l'envoi de notifications côté admin quand un pro ajoute sa disponibilité)
   */
  async getEnabledUsersForCourse(golfCourseId: string) {
    try {
      const { data, error } = await supabase
        .from('user_course_alerts')
        .select(
          `
          user_id,
          golf_course_id,
          profiles!inner(
            id,
            email,
            first_name,
            last_name
          )
        `
        )
        .eq('golf_course_id', golfCourseId)
        .eq('alerts_enabled', true);

      if (error) {
        logger.error('Erreur récupération utilisateurs alertes parcours:', error);
        return { data: null, error };
      }

      return { data, error: null };
    } catch (err) {
      logger.error('Erreur service utilisateurs alertes parcours:', err);
      return { data: null, error: err };
    }
  }
}

export const courseAlertService = new CourseAlertService();
