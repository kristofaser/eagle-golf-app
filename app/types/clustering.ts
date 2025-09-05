import { GolfParcours } from '@/services/golf-parcours.service';

/**
 * Interface pour un cluster de département
 */
export interface DepartmentCluster {
  department: string;
  count: number;
  center: {
    latitude: number;
    longitude: number;
  };
  golfs?: GolfParcours[]; // Optionnel, peut être chargé à la demande
}

/**
 * Mode d'affichage de la carte
 */
export type MapDisplayMode = 'clusters' | 'individual' | 'hybrid';

/**
 * Interface pour les données de la carte
 */
export interface MapData {
  mode: MapDisplayMode;
  clusters?: DepartmentCluster[];
  individualGolfs?: GolfParcours[];
  selectedDepartment?: string;
  userLocation?: {
    latitude: number;
    longitude: number;
  };
}

/**
 * Options pour la génération des clusters
 */
export interface ClusteringOptions {
  userLatitude?: number;
  userLongitude?: number;
  maxDistanceForIndividual?: number; // en km, pour afficher les golfs individuels près de l'utilisateur
  minGolfsForCluster?: number; // minimum de golfs pour créer un cluster
}

/**
 * Résultat du calcul de clustering
 */
export interface ClusteringResult {
  clusters: DepartmentCluster[];
  nearbyIndividualGolfs: GolfParcours[];
  totalGolfs: number;
}