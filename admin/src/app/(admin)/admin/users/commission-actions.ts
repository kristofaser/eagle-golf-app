'use server';

import { createServiceClient } from '@/lib/supabase/server';

export async function getCurrentCommission(): Promise<{ success: boolean; data?: number; message?: string }> {
  try {
    const supabase = await createServiceClient();
    const { data, error } = await supabase
      .from('commission_settings')
      .select('percentage')
      .lte('effective_date', new Date().toISOString())
      .order('effective_date', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      console.error('Erreur chargement commission:', error);
      return { success: false, message: 'Erreur lors du chargement de la commission' };
    }

    return { success: true, data: data?.percentage || 20 };
  } catch (err) {
    console.error('Erreur:', err);
    return { success: false, message: 'Erreur lors du chargement de la commission' };
  }
}

export async function updateCommission(percentage: number): Promise<{ success: boolean; message: string }> {
  if (isNaN(percentage) || percentage < 0 || percentage > 100) {
    return { success: false, message: 'La commission doit être entre 0 et 100%' };
  }

  try {
    const supabase = await createServiceClient();
    const { error } = await supabase
      .from('commission_settings')
      .insert({
        percentage,
        effective_date: new Date().toISOString().split('T')[0],
      });

    if (error) {
      console.error('Erreur sauvegarde commission:', error);
      return { success: false, message: 'Erreur lors de la sauvegarde de la commission' };
    }

    return { success: true, message: 'Commission mise à jour avec succès' };
  } catch (err) {
    console.error('Erreur:', err);
    return { success: false, message: 'Erreur lors de la sauvegarde de la commission' };
  }
}
