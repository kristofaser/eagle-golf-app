import { useState, useEffect } from 'react';
import { premiumService } from '@/services/premium.service';
import {
  ProHoleVideoWithUrl,
  WeeklyTipWithDetails,
} from '@/types/premium';
import { logger } from '@/utils/logger';

/**
 * Hook pour charger les vidéos de trous d'un pro (Parcours 3 Trous)
 */
export function useProHoleVideos(proId: string | null) {
  const [videos, setVideos] = useState<ProHoleVideoWithUrl[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!proId) {
      setVideos([]);
      setLoading(false);
      return;
    }

    const loadVideos = async () => {
      try {
        setLoading(true);
        setError(null);

        logger.dev('[useProHoleVideos] Chargement vidéos pour pro:', proId);

        const { data, error: serviceError } = await premiumService.getProHoleVideos(proId);

        if (serviceError) {
          throw serviceError;
        }

        setVideos(data || []);
        logger.dev('[useProHoleVideos] Vidéos chargées:', data?.length || 0);
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Erreur inconnue');
        logger.error('[useProHoleVideos] Erreur:', error);
        setError(error);
        setVideos([]);
      } finally {
        setLoading(false);
      }
    };

    loadVideos();
  }, [proId]);

  return {
    videos,
    loading,
    error,
  };
}

/**
 * Hook pour charger les tips de la semaine
 */
export function useWeeklyTips() {
  const [tips, setTips] = useState<WeeklyTipWithDetails[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const loadTips = async () => {
    try {
      setLoading(true);
      setError(null);

      logger.dev('[useWeeklyTips] Chargement tips');

      const { data, error: serviceError } = await premiumService.getWeeklyTips();

      if (serviceError) {
        throw serviceError;
      }

      setTips(data || []);
      logger.dev('[useWeeklyTips] Tips chargés:', data?.length || 0);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Erreur inconnue');
      logger.error('[useWeeklyTips] Erreur:', error);
      setError(error);
      setTips([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTips();
  }, []);

  return {
    tips,
    loading,
    error,
    refresh: loadTips,
  };
}

/**
 * Hook pour charger la vidéo "In the Bag" d'un pro
 */
export function useInTheBagVideo(proId: string | null) {
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!proId) {
      setVideoUrl(null);
      setLoading(false);
      return;
    }

    const loadVideo = async () => {
      try {
        setLoading(true);
        setError(null);

        logger.dev('[useInTheBagVideo] Chargement vidéo pour pro:', proId);

        const { data, error: serviceError } = await premiumService.getProInTheBagVideo(proId);

        if (serviceError) {
          throw serviceError;
        }

        setVideoUrl(data);
        logger.dev('[useInTheBagVideo] Vidéo chargée:', data ? 'Oui' : 'Non');
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Erreur inconnue');
        logger.error('[useInTheBagVideo] Erreur:', error);
        setError(error);
        setVideoUrl(null);
      } finally {
        setLoading(false);
      }
    };

    loadVideo();
  }, [proId]);

  return {
    videoUrl,
    hasVideo: videoUrl !== null,
    loading,
    error,
  };
}
