/**
 * Types génériques utilitaires pour éviter la duplication de code
 */

/**
 * Type générique pour ajouter des détails à une entité
 * Utilisé pour enrichir les types de base avec des relations
 */
export type WithDetails<T, D> = T & { details: D };

/**
 * Type générique pour les paramètres de filtrage avec pagination
 */
export interface PaginationParams {
  page?: number;
  limit?: number;
  offset?: number;
}

export type FilterParams<T> = Partial<T> & PaginationParams;

/**
 * Type pour les dimensions d'un élément UI
 */
export interface Dimensions {
  width: number;
  height: number;
}

/**
 * Type pour les positions d'un élément UI
 */
export interface Position {
  x: number;
  y: number;
}

/**
 * Type combiné pour la position et les dimensions
 */
export type LayoutInfo = Dimensions & Position;

/**
 * Type générique pour les réponses API avec pagination
 */
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

/**
 * Type générique pour les réponses d'erreur API
 */
export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, any>;
}

/**
 * Type pour les résultats d'opération avec succès/erreur
 */
export type Result<T, E = ApiError> = { success: true; data: T } | { success: false; error: E };

/**
 * Type générique pour les hooks de chargement
 */
export interface LoadingState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

/**
 * Type pour les options de requête
 */
export interface QueryOptions {
  enabled?: boolean;
  refetchInterval?: number;
  refetchOnFocus?: boolean;
  staleTime?: number;
}
