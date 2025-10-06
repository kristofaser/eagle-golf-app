import { useState, useEffect, useCallback } from 'react';
import { Trip, TripStatus } from '@/types/trip';
import { tripService } from '@/services/trip.service';
import { logger } from '@/utils/logger';

export const useTrips = () => {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Charger tous les voyages
  const loadTrips = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const { data, error } = await tripService.getTrips();

      if (error) {
        throw error;
      }

      if (data) {
        setTrips(data);
      }
    } catch (err) {
      logger.error('Erreur chargement voyages:', err);
      setError('Impossible de charger les voyages');
    } finally {
      setIsLoading(false);
    }
  }, []);


  // Écouter les changements en temps réel
  useEffect(() => {
    loadTrips();

    // S'abonner aux changements
    const subscription = tripService.subscribeToTrips((payload) => {
      logger.dev('Changement détecté sur les voyages:', payload);

      // Recharger les données lors d'un changement
      if (
        payload.eventType === 'INSERT' ||
        payload.eventType === 'UPDATE' ||
        payload.eventType === 'DELETE'
      ) {
        loadTrips();
      }
    });

    // Cleanup
    return () => {
      subscription.unsubscribe();
    };
  }, [loadTrips]);

  const refresh = useCallback(() => {
    return loadTrips();
  }, [loadTrips]);

  return {
    trips,
    isLoading,
    error,
    refresh,
  };
};
