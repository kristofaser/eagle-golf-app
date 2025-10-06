/**
 * Types pour le système premium Eagle Golf
 */

export type PremiumSource = 'apple' | 'google' | 'pro_auto';
export type PremiumPlatform = 'apple' | 'google';
export type PremiumStatus = 'active' | 'cancelled' | 'expired' | 'trial';

/**
 * Subscription premium d'un utilisateur
 */
export interface PremiumSubscription {
  id: string;
  user_id: string;
  source: PremiumSource;
  platform?: PremiumPlatform;
  product_id?: string;
  revenuecat_subscriber_id?: string;
  status: PremiumStatus;
  purchase_date: string;
  expires_date?: string;
  auto_renew: boolean;
  cancellation_date?: string;
  cancellation_reason?: string;
  created_at: string;
  updated_at: string;
}

/**
 * Vidéo de trou d'un pro (Parcours 3 Trous)
 */
export interface ProHoleVideo {
  id: string;
  pro_id: string;
  hole_number: number;
  video_key: string;
  par: number;
  score: number;
  created_at: string;
  updated_at: string;
}

/**
 * Vidéo de trou avec URL publique Scaleway
 */
export interface ProHoleVideoWithUrl extends ProHoleVideo {
  video_url: string;
}

/**
 * Tip de la semaine
 */
export interface WeeklyTip {
  id: string;
  title: string;
  description?: string;
  video_key: string;
  author_id?: string;
  published_at: string;
  expires_at?: string;
  is_active: boolean;
  view_count: number;
  created_at: string;
  updated_at: string;
}

/**
 * Tip avec URL publique et nom de l'auteur
 */
export interface WeeklyTipWithDetails extends WeeklyTip {
  video_url: string;
  author_name?: string;
}

/**
 * Type des skills disponibles
 */
export type SkillType = 'driving' | 'irons' | 'wedging' | 'chipping' | 'putting' | 'mental';

/**
 * Mapping des skills vers les colonnes de la base de données
 */
export const SKILL_COLUMNS: Record<SkillType, string> = {
  driving: 'skill_driving',
  irons: 'skill_irons',
  wedging: 'skill_wedging',
  chipping: 'skill_chipping',
  putting: 'skill_putting',
  mental: 'skill_mental',
};

/**
 * Règles d'accès aux vidéos de skills
 * - 'free': Accessible à tous (teaser gratuit)
 * - 'premium': Nécessite un abonnement premium
 * - 'no_content': Pas de contenu vidéo disponible pour cette compétence
 */
export const SKILL_ACCESS_RULES: Record<SkillType, 'free' | 'premium' | 'no_content'> = {
  driving: 'free', // Toujours accessible (teaser gratuit)
  irons: 'premium', // Nécessite premium
  wedging: 'premium', // Nécessite premium
  chipping: 'premium', // Nécessite premium
  putting: 'premium', // Nécessite premium
  mental: 'no_content', // Pas de vidéo disponible (difficulté de créer contenu vidéo sur l'aspect mental)
};
