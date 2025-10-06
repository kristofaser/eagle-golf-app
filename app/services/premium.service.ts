import { BaseService, ServiceResponse } from './base.service';
import {
  PremiumSubscription,
  ProHoleVideo,
  ProHoleVideoWithUrl,
  WeeklyTip,
  WeeklyTipWithDetails,
  SkillType,
  SKILL_ACCESS_RULES,
} from '@/types/premium';
import { getPublicUrl } from '@/utils/scaleway';
import { logger } from '@/utils/logger';

/**
 * Cache simple pour les vérifications premium (TTL: 5 minutes)
 */
const premiumCache = new Map<string, { value: boolean; expiresAt: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes en millisecondes

class PremiumService extends BaseService {
  /**
   * Vérifie si un utilisateur a un accès premium
   * Utilise la fonction RPC Supabase is_user_premium()
   * Cache le résultat pendant 5 minutes
   */
  async checkUserPremium(userId: string): Promise<ServiceResponse<boolean>> {
    try {
      // Vérifier le cache
      const cached = premiumCache.get(userId);
      if (cached && Date.now() < cached.expiresAt) {
        logger.dev('[PremiumService] Cache hit pour userId:', userId, '-> isPremium:', cached.value);
        return {
          data: cached.value,
          error: null,
        };
      }

      logger.dev('[PremiumService] Appel RPC is_user_premium pour userId:', userId);

      // Appeler la fonction RPC Supabase
      const { data, error } = await this.supabase.rpc('is_user_premium', {
        check_user_id: userId,
      });

      if (error) {
        logger.error('[PremiumService] Erreur RPC is_user_premium:', error);
        throw error;
      }

      const isPremium = data === true;

      // Mettre en cache
      premiumCache.set(userId, {
        value: isPremium,
        expiresAt: Date.now() + CACHE_TTL,
      });

      logger.dev('[PremiumService] isPremium:', isPremium, 'pour userId:', userId);

      return {
        data: isPremium,
        error: null,
      };
    } catch (error) {
      logger.error('[PremiumService] Erreur checkUserPremium:', error);
      return {
        data: null,
        error: this.handleError(error),
      };
    }
  }

  /**
   * Invalide le cache premium pour un utilisateur
   * À appeler après un achat IAP ou un changement de statut
   */
  invalidatePremiumCache(userId: string): void {
    premiumCache.delete(userId);
    logger.dev('[PremiumService] Cache invalidé pour userId:', userId);
  }

  /**
   * Vérifie si un utilisateur peut accéder à une vidéo de skill
   * Logique:
   * - Driving: toujours accessible (gratuit)
   * - Mental: pas de contenu vidéo disponible
   * - Autres skills: accessible si premium
   */
  async canAccessSkillVideo(userId: string, skill: SkillType): Promise<ServiceResponse<boolean>> {
    try {
      const accessRule = SKILL_ACCESS_RULES[skill];

      // Driving: toujours accessible
      if (accessRule === 'free') {
        return {
          data: true,
          error: null,
        };
      }

      // Mental: pas de contenu vidéo
      if (accessRule === 'no_content') {
        return {
          data: false,
          error: null,
        };
      }

      // Autres skills: vérifier premium
      if (accessRule === 'premium') {
        const premiumResponse = await this.checkUserPremium(userId);
        return {
          data: premiumResponse.data || false,
          error: premiumResponse.error,
        };
      }

      return {
        data: false,
        error: null,
      };
    } catch (error) {
      logger.error('[PremiumService] Erreur canAccessSkillVideo:', error);
      return {
        data: null,
        error: this.handleError(error),
      };
    }
  }

  /**
   * Récupère l'abonnement premium actif d'un utilisateur
   */
  async getPremiumSubscription(userId: string): Promise<ServiceResponse<PremiumSubscription | null>> {
    try {
      const { data, error } = await this.supabase
        .from('premium_subscriptions')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'active')
        .maybeSingle();

      if (error) {
        logger.error('[PremiumService] Erreur getPremiumSubscription:', error);
        throw error;
      }

      return {
        data: data || null,
        error: null,
      };
    } catch (error) {
      logger.error('[PremiumService] Erreur getPremiumSubscription:', error);
      return {
        data: null,
        error: this.handleError(error),
      };
    }
  }

  /**
   * Récupère les 3 vidéos de trous d'un pro (Parcours 3 Trous)
   * Retourne avec URL publique Scaleway
   */
  async getProHoleVideos(proId: string): Promise<ServiceResponse<ProHoleVideoWithUrl[]>> {
    try {
      const { data, error } = await this.supabase
        .from('pro_hole_videos')
        .select('*')
        .eq('pro_id', proId)
        .order('hole_number');

      if (error) {
        logger.error('[PremiumService] Erreur getProHoleVideos:', error);
        throw error;
      }

      // Ajouter les URL publiques
      const videosWithUrl: ProHoleVideoWithUrl[] = (data || []).map((video) => ({
        ...video,
        video_url: getPublicUrl(video.video_key),
      }));

      return {
        data: videosWithUrl,
        error: null,
      };
    } catch (error) {
      logger.error('[PremiumService] Erreur getProHoleVideos:', error);
      return {
        data: null,
        error: this.handleError(error),
      };
    }
  }

  /**
   * Récupère les tips de la semaine actifs et non expirés
   * Avec URL publique et nom de l'auteur
   */
  async getWeeklyTips(): Promise<ServiceResponse<WeeklyTipWithDetails[]>> {
    try {
      const now = new Date().toISOString();

      // Récupérer les tips actifs
      const { data: tips, error: tipsError } = await this.supabase
        .from('weekly_tips')
        .select('*')
        .eq('is_active', true)
        .lte('published_at', now)
        .or(`expires_at.is.null,expires_at.gt.${now}`)
        .order('published_at');

      if (tipsError) {
        logger.error('[PremiumService] Erreur getWeeklyTips:', tipsError);
        throw tipsError;
      }

      if (!tips || tips.length === 0) {
        return {
          data: [],
          error: null,
        };
      }

      // Récupérer les noms des auteurs (pros)
      const authorIds = tips.map((t) => t.author_id).filter((id): id is string => id !== null);
      let authors: { id: string; first_name: string; last_name: string }[] = [];

      if (authorIds.length > 0) {
        const { data: authorsData, error: authorsError } = await this.supabase
          .from('profiles')
          .select('id, first_name, last_name')
          .in('id', authorIds);

        if (authorsError) {
          logger.error('[PremiumService] Erreur récupération auteurs:', authorsError);
        } else {
          authors = authorsData || [];
        }
      }

      // Merger les données
      const tipsWithDetails: WeeklyTipWithDetails[] = tips.map((tip) => {
        const author = authors.find((a) => a.id === tip.author_id);
        return {
          ...tip,
          video_url: getPublicUrl(tip.video_key),
          author_name: author
            ? `${author.first_name} ${author.last_name}`
            : tip.author_id
            ? 'Auteur inconnu'
            : 'Eagle Team',
        };
      });

      return {
        data: tipsWithDetails,
        error: null,
      };
    } catch (error) {
      logger.error('[PremiumService] Erreur getWeeklyTips:', error);
      return {
        data: null,
        error: this.handleError(error),
      };
    }
  }

  /**
   * Récupère l'URL de la vidéo "In the Bag" d'un pro
   * Retourne null si le pro n'a pas de vidéo
   */
  async getProInTheBagVideo(proId: string): Promise<ServiceResponse<string | null>> {
    try {
      const { data, error } = await this.supabase
        .from('pro_profiles')
        .select('has_bag_video')
        .eq('user_id', proId)
        .single();

      if (error) {
        logger.error('[PremiumService] Erreur getProInTheBagVideo:', error);
        throw error;
      }

      if (!data || !data.has_bag_video) {
        return {
          data: null,
          error: null,
        };
      }

      // Générer l'URL publique
      const videoKey = `videos/pros/${proId}/in-the-bag.mp4`;
      const videoUrl = getPublicUrl(videoKey);

      return {
        data: videoUrl,
        error: null,
      };
    } catch (error) {
      logger.error('[PremiumService] Erreur getProInTheBagVideo:', error);
      return {
        data: null,
        error: this.handleError(error),
      };
    }
  }

  /**
   * Incrémente le compteur de vues d'un tip
   */
  async incrementTipViewCount(tipId: string): Promise<ServiceResponse<boolean>> {
    try {
      const { error } = await this.supabase.rpc('increment', {
        row_id: tipId,
        x: 1,
      });

      if (error) {
        logger.error('[PremiumService] Erreur incrementTipViewCount:', error);
        throw error;
      }

      return {
        data: true,
        error: null,
      };
    } catch (error) {
      logger.error('[PremiumService] Erreur incrementTipViewCount:', error);
      return {
        data: null,
        error: this.handleError(error),
      };
    }
  }
}

export const premiumService = new PremiumService();
