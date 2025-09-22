import { useState, useEffect, useCallback } from 'react';
import { Trip, TripStatus } from '@/types/trip';
import { tripService } from '@/services/trip.service';
import { logger } from '@/utils/logger';

export const useTrips = () => {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [completedTrips, setCompletedTrips] = useState<Trip[]>([]);
  const [fullTrips, setFullTrips] = useState<Trip[]>([]);
  const [availableTrips, setAvailableTrips] = useState<Trip[]>([]);
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

        // Séparer par statut
        const completed = data.filter(trip => trip.status === 'completed');
        const full = data.filter(trip => trip.status === 'full');
        const available = data.filter(trip => trip.status === 'available');

        setCompletedTrips(completed);
        setFullTrips(full);
        setAvailableTrips(available);
      }
    } catch (err) {
      logger.error('Erreur chargement voyages:', err);
      setError('Impossible de charger les voyages');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Charger les voyages par statut
  const loadTripsByStatus = useCallback(async (status: TripStatus) => {
    try {
      setIsLoading(true);
      setError(null);

      const { data, error } = await tripService.getTripsByStatus(status);

      if (error) {
        throw error;
      }

      if (data) {
        switch (status) {
          case 'completed':
            setCompletedTrips(data);
            break;
          case 'full':
            setFullTrips(data);
            break;
          case 'available':
            setAvailableTrips(data);
            break;
        }
      }
    } catch (err) {
      logger.error(`Erreur chargement voyages ${status}:`, err);
      setError(`Impossible de charger les voyages ${status}`);
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
      if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE' || payload.eventType === 'DELETE') {
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
    completedTrips,
    fullTrips,
    availableTrips,
    isLoading,
    error,
    refresh,
    loadTripsByStatus,
  };
};