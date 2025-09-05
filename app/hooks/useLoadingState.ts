import { useState, useCallback } from 'react';

interface LoadingStateReturn {
  loading: boolean;
  error: string | null;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setSuccess: () => void;
  setFailed: (errorMessage: string) => void;
  reset: () => void;
  isIdle: boolean;
  isSuccess: boolean;
  isError: boolean;
}

/**
 * Hook personnalisé pour gérer les états de chargement et d'erreur
 * Évite la duplication du pattern useState(loading) + useState(error)
 *
 * @param initialLoading - État de chargement initial (défaut: true)
 * @returns Object avec les états et les fonctions de mise à jour
 */
export const useLoadingState = (initialLoading = true): LoadingStateReturn => {
  const [loading, setLoading] = useState(initialLoading);
  const [error, setError] = useState<string | null>(null);

  const setSuccess = useCallback(() => {
    setLoading(false);
    setError(null);
  }, []);

  const setFailed = useCallback((errorMessage: string) => {
    setLoading(false);
    setError(errorMessage);
  }, []);

  const reset = useCallback(() => {
    setLoading(initialLoading);
    setError(null);
  }, [initialLoading]);

  // États dérivés pour faciliter les conditions
  const isIdle = !loading && !error;
  const isSuccess = !loading && !error;
  const isError = !loading && !!error;

  return {
    loading,
    error,
    setLoading,
    setError,
    setSuccess,
    setFailed,
    reset,
    isIdle,
    isSuccess,
    isError,
  };
};
