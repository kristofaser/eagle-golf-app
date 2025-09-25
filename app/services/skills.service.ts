import { supabase } from '@/utils/supabase/client';

export interface ProSkills {
  skill_driving: number;
  skill_irons: number;
  skill_wedging: number;
  skill_chipping: number;
  skill_putting: number;
  skill_mental: number;
}

export const skillsService = {
  /**
   * Récupère les compétences d'un professionnel
   */
  async getSkills(userId: string): Promise<ProSkills | null> {
    try {
      const { data, error } = await supabase
        .from('pro_profiles')
        .select('skill_driving, skill_irons, skill_wedging, skill_chipping, skill_putting, skill_mental')
        .eq('user_id', userId)
        .single();

      if (error) {
        console.error('Erreur lors de la récupération des compétences:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Erreur lors de la récupération des compétences:', error);
      return null;
    }
  },

  /**
   * Met à jour les compétences d'un professionnel
   */
  async updateSkills(userId: string, skills: ProSkills): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('pro_profiles')
        .update(skills)
        .eq('user_id', userId);

      if (error) {
        console.error('Erreur lors de la mise à jour des compétences:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Erreur lors de la mise à jour des compétences:', error);
      return false;
    }
  },
};