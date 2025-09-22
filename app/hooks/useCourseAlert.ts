import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from './useAuth';
import { courseAlertService } from '@/services/course-alert.service';
import { logger } from '@/utils/logger';

const STORAGE_KEY = 'course_alerts_enabled';

export interface CourseAlertPreferences {
  enabled: boolean;
  userId?: string;
  golfCourseId?: string;
  updatedAt: string;
}

export const useCourseAlert = (golfCourseId: string) => {
  const { user } = useAuth();
  const [isEnabled, setIsEnabled] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Charger les préférences au montage
  useEffect(() => {
    if (golfCourseId) {
      loadPreferences();
    }
  }, [user?.id, golfCourseId]);

  const loadPreferences = async () => {
    try {
      setIsLoading(true);
      setError(null);

      if (!user?.id || !golfCourseId) {
        setIsEnabled(false);
        return;
      }

      // Essayer de charger depuis Supabase d'abord
      const { data, error: dbError } = await courseAlertService.getPreferences(user.id, golfCourseId);

      if (data) {
        setIsEnabled(data.alerts_enabled);
        // Synchroniser avec AsyncStorage
        const preferences: CourseAlertPreferences = {
          enabled: data.alerts_enabled,
          userId: user.id,
          golfCourseId,
          updatedAt: data.updated_at || new Date().toISOString(),
        };
        await AsyncStorage.setItem(`${STORAGE_KEY}_${user.id}_${golfCourseId}`, JSON.stringify(preferences));
        return;
      }

      // Fallback sur AsyncStorage si pas en base
      const stored = await AsyncStorage.getItem(`${STORAGE_KEY}_${user.id}_${golfCourseId}`);

      if (stored) {
        const preferences: CourseAlertPreferences = JSON.parse(stored);
        setIsEnabled(preferences.enabled);

        // Migrer vers la base si pas déjà fait
        await courseAlertService.updatePreferences(user.id, golfCourseId, preferences.enabled);
      } else {
        setIsEnabled(false);
      }
    } catch (err) {
      logger.error('Erreur chargement préférences alerte parcours', err);
      setError('Erreur lors du chargement des préférences');
      setIsEnabled(false);
    } finally {
      setIsLoading(false);
    }
  };

  const savePreferences = async (enabled: boolean) => {
    try {
      setError(null);

      if (!user?.id || !golfCourseId) {
        logger.warn('Utilisateur non connecté ou parcours non spécifié');
        return false;
      }

      const preferences: CourseAlertPreferences = {
        enabled,
        userId: user.id,
        golfCourseId,
        updatedAt: new Date().toISOString(),
      };

      // Sauvegarder en AsyncStorage (cache local)
      await AsyncStorage.setItem(
        `${STORAGE_KEY}_${user.id}_${golfCourseId}`,
        JSON.stringify(preferences)
      );

      // Sauvegarder en base Supabase
      const { error: dbError } = await courseAlertService.updatePreferences(user.id, golfCourseId, enabled);

      if (dbError) {
        logger.warn('Erreur sauvegarde en base, conservé en local', dbError);
        // On continue malgré l'erreur DB, le cache local garde la préférence
      }

      logger.dev(`✅ Préférences alerte parcours sauvegardées: ${enabled ? 'activées' : 'désactivées'}`);
      return true;
    } catch (err) {
      logger.error('Erreur sauvegarde préférences alerte parcours', err);
      setError('Erreur lors de la sauvegarde');
      return false;
    }
  };

  const toggleAlert = useCallback(async (newValue?: boolean) => {
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
      if (user?.id && golfCourseId) {
        await AsyncStorage.removeItem(`${STORAGE_KEY}_${user.id}_${golfCourseId}`);
        await courseAlertService.deletePreferences(user.id, golfCourseId);
        setIsEnabled(false);
        logger.dev('🗑️ Préférences alerte parcours supprimées');
      }
    } catch (err) {
      logger.error('Erreur suppression préférences alerte parcours', err);
      setError('Erreur lors de la suppression');
    }
  };

  return {
    isEnabled,
    isLoading,
    error,
    toggleAlert,
    clearPreferences,
    refresh: loadPreferences,
  };
};