/**
 * Utilitaires pour la gestion des niveaux de zoom à la Airbnb
 */

import { Region } from 'react-native-maps';
import { GolfParcours } from '@/services/golf-parcours.service';
import { DepartmentCluster } from '@/types/clustering';

/**
 * Niveaux de zoom basés sur latitudeDelta
 */
export enum ZoomLevel {
  COUNTRY = 'country',     // latitudeDelta > 2.0 - Vue pays entier
  REGIONAL = 'regional',   // latitudeDelta 0.5-2.0 - Vue régionale 
  LOCAL = 'local',         // latitudeDelta 0.1-0.5 - Vue départementale
  DETAILED = 'detailed'    // latitudeDelta < 0.1 - Vue locale détaillée
}

/**
 * Configuration des seuils de zoom
 */
export const ZOOM_THRESHOLDS = {
  COUNTRY_MIN: 2.0,      // Plus de 2° = vue pays
  REGIONAL_MIN: 0.5,     // 0.5-2° = vue régionale
  LOCAL_MIN: 0.1,        // 0.1-0.5° = vue locale
  DETAILED_MIN: 0.0      // Moins de 0.1° = vue détaillée
} as const;

/**
 * Détermine le niveau de zoom à partir de la région
 */
export function getZoomLevel(region: Region): ZoomLevel {
  const { latitudeDelta } = region;
  
  if (latitudeDelta >= ZOOM_THRESHOLDS.COUNTRY_MIN) {
    return ZoomLevel.COUNTRY;
  }
  if (latitudeDelta >= ZOOM_THRESHOLDS.REGIONAL_MIN) {
    return ZoomLevel.REGIONAL;
  }
  if (latitudeDelta >= ZOOM_THRESHOLDS.LOCAL_MIN) {
    return ZoomLevel.LOCAL;
  }
  return ZoomLevel.DETAILED;
}

/**
 * Calcule les bounds de la région visible
 */
export function getVisibleBounds(region: Region) {
  const { latitude, longitude, latitudeDelta, longitudeDelta } = region;
  
  return {
    north: latitude + latitudeDelta / 2,
    south: latitude - latitudeDelta / 2,
    east: longitude + longitudeDelta / 2,
    west: longitude - longitudeDelta / 2,
  };
}

/**
 * Vérifie si un point est dans les bounds visibles
 */
export function isInVisibleBounds(
  lat: number, 
  lng: number, 
  bounds: ReturnType<typeof getVisibleBounds>
): boolean {
  return lat >= bounds.south && 
         lat <= bounds.north && 
         lng >= bounds.west && 
         lng <= bounds.east;
}

/**
 * Filtre les golfs visibles dans la région
 */
export function filterGolfsInBounds(
  golfs: GolfParcours[], 
  region: Region
): GolfParcours[] {
  const bounds = getVisibleBounds(region);
  
  return golfs.filter(golf => 
    golf.latitude && 
    golf.longitude && 
    isInVisibleBounds(golf.latitude, golf.longitude, bounds)
  );
}

/**
 * Filtre les clusters visibles dans la région
 */
export function filterClustersInBounds(
  clusters: DepartmentCluster[], 
  region: Region
): DepartmentCluster[] {
  const bounds = getVisibleBounds(region);
  
  return clusters.filter(cluster => 
    isInVisibleBounds(cluster.center.latitude, cluster.center.longitude, bounds)
  );
}

/**
 * Détermine quoi afficher selon le niveau de zoom (logique Airbnb)
 */
export interface ZoomBasedDisplay {
  showClusters: boolean;
  showIndividualGolfs: boolean;
  clustersToShow: DepartmentCluster[];
  golfsToShow: GolfParcours[];
  zoomLevel: ZoomLevel;
}

export function getDisplayForZoomLevel(
  region: Region,
  allClusters: DepartmentCluster[],
  allGolfs: GolfParcours[]
): ZoomBasedDisplay {
  const zoomLevel = getZoomLevel(region);
  const visibleClusters = filterClustersInBounds(allClusters, region);
  const visibleGolfs = filterGolfsInBounds(allGolfs, region);

  switch (zoomLevel) {
    case ZoomLevel.COUNTRY:
      // Vue pays : seulement les clusters
      return {
        showClusters: true,
        showIndividualGolfs: false,
        clustersToShow: visibleClusters,
        golfsToShow: [],
        zoomLevel,
      };

    case ZoomLevel.REGIONAL:
      // Vue régionale : clusters + quelques golfs des gros départements
      const bigClusters = visibleClusters.filter(c => c.count >= 5);
      const smallClustersGolfs = visibleClusters
        .filter(c => c.count < 5)
        .flatMap(c => c.golfs || [])
        .filter(g => g.latitude && g.longitude && 
          isInVisibleBounds(g.latitude, g.longitude, getVisibleBounds(region)));
      
      return {
        showClusters: true,
        showIndividualGolfs: true,
        clustersToShow: bigClusters,
        golfsToShow: smallClustersGolfs,
        zoomLevel,
      };

    case ZoomLevel.LOCAL:
      // Vue locale : principalement des golfs individuels, quelques gros clusters
      const hugeClusters = visibleClusters.filter(c => c.count >= 10);
      return {
        showClusters: hugeClusters.length > 0,
        showIndividualGolfs: true,
        clustersToShow: hugeClusters,
        golfsToShow: visibleGolfs,
        zoomLevel,
      };

    case ZoomLevel.DETAILED:
      // Vue détaillée : tous les golfs individuels
      return {
        showClusters: false,
        showIndividualGolfs: true,
        clustersToShow: [],
        golfsToShow: visibleGolfs,
        zoomLevel,
      };

    default:
      return {
        showClusters: true,
        showIndividualGolfs: false,
        clustersToShow: visibleClusters,
        golfsToShow: [],
        zoomLevel: ZoomLevel.COUNTRY,
      };
  }
}

/**
 * Calcule la région optimale pour afficher un département
 */
export function getRegionForDepartment(departmentGolfs: GolfParcours[]): Region | null {
  const validGolfs = departmentGolfs.filter(g => g.latitude && g.longitude);
  
  if (validGolfs.length === 0) return null;

  const lats = validGolfs.map(g => g.latitude!);
  const lngs = validGolfs.map(g => g.longitude!);

  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);

  // Ajouter du padding pour un meilleur affichage
  const padding = 0.05;
  const latDelta = Math.max(maxLat - minLat + padding, 0.1);
  const lngDelta = Math.max(maxLng - minLng + padding, 0.1);

  return {
    latitude: (minLat + maxLat) / 2,
    longitude: (minLng + maxLng) / 2,
    latitudeDelta: latDelta,
    longitudeDelta: lngDelta,
  };
}