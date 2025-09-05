// Types enum stricts pour l'application Eagle Golf

// Re-export des types utilitaires génériques
export type {
  WithDetails,
  FilterParams,
  PaginationParams,
  LoadingState,
  Result,
  PaginatedResponse,
  ApiError,
} from './utils';

export type UserType = 'amateur' | 'pro';
export type BookingStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed';
export type BudgetRange = 'low' | 'medium' | 'high';
export type ExperienceLevel = 'beginner' | 'intermediate' | 'advanced';
export type PaymentStatus = 'pending' | 'succeeded' | 'failed' | 'refunded';

// Type pour la géolocalisation
export type Point = {
  lat: number;
  lng: number;
};

// Contraintes de validation
export const CONSTRAINTS = {
  handicap: {
    min: -10,
    max: 54,
  },
  rating: {
    min: 1,
    max: 5,
  },
  numberOfPlayers: {
    min: 1,
    max: 3,
  },
} as const;

// Type pour les données de cartes
export interface CardData {
  id: string;
  title: string;
  imageUrl: string;
  type: 'pro' | 'parcours';
  subtitle?: string;
  location?: string;
  rating?: number;
  price?: number;
  date?: string;
}
