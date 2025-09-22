import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from './useAuth';
import { travelNotificationService } from '@/services/travel-notification.service';
import { logger } from '@/utils/logger';

const STORAGE_KEY = 'travel_notifications_enabled';

export interface TravelNotificationPreferences {
  enabled: boolean;
  userId?: string;
  updatedAt: string;
}

export const useTravelNotifications = () => {
  const { user } = useAuth();
  const [isEnabled, setIsEnabled] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Charger les préférences au montage
  useEffect(() => {
    loadPreferences();
  }, [user?.id]);

  const loadPreferences = async () => {
    try {
      setIsLoading(true);
      setError(null);

      if (!user?.id) {
        setIsEnabled(false);
        return;
      }

      // Essayer de charger depuis Supabase d'abord
      const { data, error: dbError } = await travelNotificationService.getPreferences(user.id);
      
      if (data) {
        setIsEnabled(data.enabled);
        // Synchroniser avec AsyncStorage
        const preferences: TravelNotificationPreferences = {
          enabled: data.enabled,
          userId: user.id,
          updatedAt: data.updated_at || new Date().toISOString(),
        };
        await AsyncStorage.setItem(`${STORAGE_KEY}_${user.id}`, JSON.stringify(preferences));
        return;
      }

      // Fallback sur AsyncStorage si pas en base
      const stored = await AsyncStorage.getItem(`${STORAGE_KEY}_${user.id}`);
      
      if (stored) {
        const preferences: TravelNotificationPreferences = JSON.parse(stored);
        setIsEnabled(preferences.enabled);
        
        // Migrer vers la base si pas déjà fait
        await travelNotificationService.updatePreferences(user.id, preferences.enabled);
      } else {
        setIsEnabled(false);
      }
    } catch (err) {
      logger.error('Erreur chargement préférences voyage', err);
      setError('Erreur lors du chargement des préférences');
      setIsEnabled(false);
    } finally {
      setIsLoading(false);
    }
  };

  const savePreferences = async (enabled: boolean) => {
    try {
      setError(null);

      if (!user?.id) {
        logger.warn('Utilisateur non connecté');
        return false;
      }

      const preferences: TravelNotificationPreferences = {
        enabled,
        userId: user.id,
        updatedAt: new Date().toISOString(),
      };

      // Sauvegarder en AsyncStorage (cache local)
      await AsyncStorage.setItem(
        `${STORAGE_KEY}_${user.id}`, 
        JSON.stringify(preferences)
      );

      // Sauvegarder en base Supabase
      const { error: dbError } = await travelNotificationService.updatePreferences(user.id, enabled);
      
      if (dbError) {
        logger.warn('Erreur sauvegarde en base, conservé en local', dbError);
        // On continue malgré l'erreur DB, le cache local garde la préférence
      }

      logger.dev(`✅ Préférences voyage sauvegardées: ${enabled ? 'activées' : 'désactivées'}`);
      return true;
    } catch (err) {
      logger.error('Erreur sauvegarde préférences voyage', err);
      setError('Erreur lors de la sauvegarde');
      return false;
    }
  };

  const toggleNotifications = useCallback(async (newValue?: boolean) => {
    const targetValue = newValue !== undefined ? newValue : !isEnabled;
    
    setIsEnabled(targetValue);
    
    const success = await savePreferences(targetValue);
    
    if (!success) {
      // Rollback en cas d'erreur
      setIsEnabled(!targetValue);
    }
    
    return success;
  }, [isEnabled, savePreferences]);

  const clearPreferences = async () => {
    try {
      if (user?.id) {
        await AsyncStorage.removeItem(`${STORAGE_KEY}_${user.id}`);
        setIsEnabled(false);
        logger.dev('🗑️ Préférences voyage supprimées');
      }
    } catch (err) {
      logger.error('Erreur suppression préférences voyage', err);
      setError('Erreur lors de la suppression');
    }
  };

  return {
    isEnabled,
    isLoading,
    error,
    toggleNotifications,
    clearPreferences,
    refresh: loadPreferences,
  };
};