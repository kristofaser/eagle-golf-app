'use server';

import { availabilitiesService } from '@/lib/services/availabilities.service';

export async function getProAvailabilities(proId: string) {
  try {
    const availabilities = await availabilitiesService.getProAvailabilities(proId);
    return {
      success: true,
      data: availabilities
    };
  } catch (error) {
    console.error('Erreur récupération disponibilités:', error);
    return {
      success: false,
      data: [],
      error: error instanceof Error ? error.message : 'Erreur inconnue'
    };
  }
}