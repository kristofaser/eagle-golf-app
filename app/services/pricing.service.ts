import { supabase } from '@/utils/supabase/client';

export interface ProPricing {
  holes: 9 | 18;
  players_count: 1 | 2 | 3;
  price: number;
}

export const pricingService = {
  /**
   * Récupère tous les tarifs d'un pro
   */
  async getProPricing(proId: string): Promise<ProPricing[]> {
    const { data, error } = await supabase
      .from('pro_pricing')
      .select('holes, players_count, price')
      .eq('pro_id', proId)
      .order('holes')
      .order('players_count');

    if (error) {
      console.error('Erreur récupération tarifs:', error);
      return [];
    }

    // Convertir les prix de centimes en euros pour l'interface
    return (data || []).map(item => ({
      ...item,
      price: item.price / 100 // Convertir centimes en euros
    }));
  },

  /**
   * Récupère un tarif spécifique
   */
  async getSpecificPrice(
    proId: string,
    holes: 9 | 18,
    playersCount: 1 | 2 | 3
  ): Promise<number | null> {
    const { data, error } = await supabase
      .from('pro_pricing')
      .select('price')
      .eq('pro_id', proId)
      .eq('holes', holes)
      .eq('players_count', playersCount)
      .single();

    if (error) {
      console.error('Erreur récupération prix:', error);
      return null;
    }

    // Convertir de centimes en euros
    return data?.price ? data.price / 100 : null;
  },

  /**
   * Met à jour les tarifs d'un pro
   */
  async updateProPricing(proId: string, pricing: ProPricing[]): Promise<boolean> {
    try {
      // Supprimer les anciens tarifs
      await supabase.from('pro_pricing').delete().eq('pro_id', proId);

      // Insérer les nouveaux tarifs (convertir en centimes)
      const pricingData = pricing.map((p) => ({
        pro_id: proId,
        holes: p.holes,
        players_count: p.players_count,
        price: p.price * 100, // Convertir euros en centimes
      }));

      const { error } = await supabase.from('pro_pricing').insert(pricingData);

      if (error) {
        console.error('Erreur mise à jour tarifs:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Erreur mise à jour tarifs:', error);
      return false;
    }
  },

  /**
   * Calcule le prix avec commission
   */
  calculateTotalPrice(
    basePrice: number,
    commissionPercentage: number = 20
  ): {
    basePrice: number;
    commission: number;
    total: number;
  } {
    const commission = (basePrice * commissionPercentage) / 100;
    return {
      basePrice,
      commission,
      total: basePrice + commission,
    };
  },

  /**
   * Récupère la commission actuelle depuis la configuration
   */
  async getCurrentCommission(): Promise<number> {
    const { data, error } = await supabase
      .from('commission_settings')
      .select('percentage')
      .lte('effective_date', new Date().toISOString())
      .order('effective_date', { ascending: false })
      .limit(1)
      .single();

    if (error || !data) {
      console.warn('Commission par défaut utilisée');
      return 20; // Commission par défaut
    }

    return data.percentage;
  },
};
