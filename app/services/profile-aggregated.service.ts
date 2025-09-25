import { supabase } from '@/utils/supabase/client';
import { FullProfile } from './profile.service';
import { AvailabilityWithDetails } from './booking.service';
import { ProPricing } from './pricing.service';

export interface AggregatedProProfile {
  profile: FullProfile;
  availabilities: AvailabilityWithDetails[];
  pricing: ProPricing[];
  stats: {
    totalBookings: number;
    averageRating: number;
    completionRate: number;
  };
}

class ProfileAggregatedService {
  /**
   * R\u00e9cup\u00e8re toutes les donn\u00e9es d'un profil pro en une seule requ\u00eate
   * Optimis\u00e9 pour r\u00e9duire les appels API et am\u00e9liorer les performances
   */
  async getAggregatedProProfile(profileId: string): Promise<AggregatedProProfile> {
    try {
      // Utiliser les fonctions RPC pour agr\u00e9ger les donn\u00e9es c\u00f4t\u00e9 serveur
      const { data, error } = await supabase.rpc('get_aggregated_pro_profile', {
        profile_id: profileId,
        start_date: new Date().toISOString().split('T')[0],
        end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      });

      if (error) {
        console.error(
          'Erreur lors de la r\u00e9cup\u00e9ration du profil agr\u00e9g\u00e9:',
          error
        );
        throw error;
      }

      // Si la fonction RPC n'existe pas encore, fallback sur les appels multiples
      if (!data) {
        return this.fallbackAggregation(profileId);
      }

      return data as AggregatedProProfile;
    } catch (error) {
      // Fallback en cas d'erreur de la fonction RPC
      console.warn("Utilisation du fallback pour l'agr\u00e9gation du profil");
      return this.fallbackAggregation(profileId);
    }
  }

  /**
   * Fallback qui utilise les services existants
   * Utilise Promise.allSettled pour la r\u00e9silience
   */
  private async fallbackAggregation(profileId: string): Promise<AggregatedProProfile> {
    const [profileResult, availabilitiesResult, pricingResult, statsResult] =
      await Promise.allSettled([
        this.getProfile(profileId),
        this.getAvailabilities(profileId),
        this.getPricing(profileId),
        this.getStats(profileId),
      ]);

    // G\u00e9rer les erreurs individuelles avec des valeurs par d\u00e9faut
    const profile = profileResult.status === 'fulfilled' ? profileResult.value : null;

    if (!profile) {
      throw new Error('Profil non trouv\u00e9');
    }

    const availabilities =
      availabilitiesResult.status === 'fulfilled' ? availabilitiesResult.value : [];

    const pricing = pricingResult.status === 'fulfilled' ? pricingResult.value : [];

    const stats =
      statsResult.status === 'fulfilled'
        ? statsResult.value
        : { totalBookings: 0, averageRating: 0, completionRate: 0 };

    return {
      profile,
      availabilities,
      pricing,
      stats,
    };
  }

  private async getProfile(profileId: string): Promise<FullProfile> {
    const { data, error } = await supabase
      .from('profiles')
      .select(
        `
        *,
        pro_profiles!left (*),
        amateur_profiles!left (
          *,
          golf_parcours!left (*)
        )
      `
      )
      .eq('id', profileId)
      .single();

    if (error || !data) {
      throw new Error('Profil non trouv\u00e9');
    }

    return data;
  }

  private async getAvailabilities(profileId: string): Promise<AvailabilityWithDetails[]> {
    const startDate = new Date().toISOString().split('T')[0];
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 7);

    const { data, error } = await supabase
      .from('pro_availabilities')
      .select(
        `
        *,
        golf_parcours!left (
          id,
          name,
          city
        )
      `
      )
      .eq('pro_id', profileId)
      .gte('date', startDate)
      .lte('date', endDate.toISOString().split('T')[0])
      .order('date', { ascending: true });

    if (error) {
      console.error('Erreur lors de la r\u00e9cup\u00e9ration des disponibilit\u00e9s:', error);
      return [];
    }

    // Retourner les disponibilités trouvées
    return (data || []) as AvailabilityWithDetails[];
  }

  private async getPricing(profileId: string): Promise<ProPricing[]> {
    const { data, error } = await supabase
      .from('pro_pricing')
      .select('*')
      .eq('pro_id', profileId)
      .order('holes', { ascending: true })
      .order('players_count', { ascending: true });

    if (error) {
      console.error('Erreur lors de la r\u00e9cup\u00e9ration des tarifs:', error);
      return [];
    }

    // Les prix sont déjà stockés en euros dans la base de données
    // Pas de conversion nécessaire
    return (data || []).map((item) => ({
      ...item,
      price: item.price, // Prix déjà en euros
    })) as ProPricing[];
  }

  private async getStats(
    profileId: string
  ): Promise<{ totalBookings: number; averageRating: number; completionRate: number }> {
    try {
      // R\u00e9cup\u00e9rer les statistiques de r\u00e9servation
      const { data: bookingsData, error: bookingsError } = await supabase
        .from('bookings')
        .select('id, status')
        .eq('pro_id', profileId);

      if (bookingsError) {
        console.error('Erreur lors de la r\u00e9cup\u00e9ration des statistiques:', bookingsError);
        return { totalBookings: 0, averageRating: 0, completionRate: 0 };
      }

      const totalBookings = bookingsData?.length || 0;
      const completedBookings = bookingsData?.filter((b) => b.status === 'completed').length || 0;
      const completionRate = totalBookings > 0 ? (completedBookings / totalBookings) * 100 : 0;

      // R\u00e9cup\u00e9rer la note moyenne (simul\u00e9e pour l'instant)
      // TODO: Impl\u00e9menter le syst\u00e8me de notation
      const averageRating = 4.5 + Math.random() * 0.5;

      return {
        totalBookings,
        averageRating,
        completionRate,
      };
    } catch (error) {
      console.error('Erreur lors de la r\u00e9cup\u00e9ration des stats:', error);
      return { totalBookings: 0, averageRating: 0, completionRate: 0 };
    }
  }

  /**
   * Pr\u00e9charge plusieurs profils en parall\u00e8le
   * Utilis\u00e9 pour optimiser le scroll dans la liste
   */
  async prefetchProfiles(profileIds: string[]): Promise<void> {
    const batchSize = 5;
    const batches = [];

    for (let i = 0; i < profileIds.length; i += batchSize) {
      const batch = profileIds.slice(i, i + batchSize);
      batches.push(Promise.allSettled(batch.map((id) => this.getAggregatedProProfile(id))));
    }

    await Promise.allSettled(batches);
  }
}

export const profileAggregatedService = new ProfileAggregatedService();
