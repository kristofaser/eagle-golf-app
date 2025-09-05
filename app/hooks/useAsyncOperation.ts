import { useState, useCallback } from 'react';

/**
 * Hook générique pour gérer les opérations asynchrones
 * Élimine la duplication du pattern loading/error/data
 */

export interface AsyncOperationState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
}

export interface AsyncOperationResult<T> extends AsyncOperationState<T> {
  execute: (operation: () => Promise<T>) => Promise<T | null>;
  reset: () => void;
  setData: (data: T | null) => void;
}

export function useAsyncOperation<T = any>(): AsyncOperationResult<T> {
  const [state, setState] = useState<AsyncOperationState<T>>({
    data: null,
    loading: false,
    error: null,
  });

  const execute = useCallback(async (operation: () => Promise<T>): Promise<T | null> => {
    try {
      setState((prev) => ({ ...prev, loading: true, error: null }));

      const result = await operation();

      setState({
        data: result,
        loading: false,
        error: null,
      });

      return result;
    } catch (error) {
      const errorObj = error instanceof Error ? error : new Error(String(error));

      setState({
        data: null,
        loading: false,
        error: errorObj,
      });

      // 🚨 IMPORTANT: Re-lancer l'erreur pour que l'appelant puisse la gérer
      throw errorObj;
    }
  }, []);

  const reset = useCallback(() => {
    setState({
      data: null,
      loading: false,
      error: null,
    });
  }, []);

  const setData = useCallback((data: T | null) => {
    setState((prev) => ({ ...prev, data }));
  }, []);

  return {
    ...state,
    execute,
    reset,
    setData,
  };
}

/**
 * Hook spécialisé pour les opérations qui ne retournent pas de données
 * Utile pour les actions comme submit, delete, update
 */
export function useAsyncAction(): Omit<AsyncOperationResult<void>, 'data' | 'setData'> {
  const { execute, loading, error, reset } = useAsyncOperation<void>();

  return {
    execute,
    loading,
    error,
    reset,
  };
}
