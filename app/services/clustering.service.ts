import { GolfParcours } from './golf-parcours.service';
import {
  DepartmentCluster,
  ClusteringOptions,
  ClusteringResult,
  MapData,
  MapDisplayMode,
} from '@/types/clustering';
import { Region } from 'react-native-maps';
import {
  getDisplayForZoomLevel,
  ZoomBasedDisplay,
  getVisibleBounds,
  isInVisibleBounds,
} from '@/utils/zoom-levels';

class ClusteringService {
  /**
   * Calcule la distance entre deux points en kilomètres (Haversine)
   */
  private calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371; // Rayon de la Terre en km
    const dLat = this.toRad(lat2 - lat1);
    const dLng = this.toRad(lng2 - lng1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) *
        Math.cos(this.toRad(lat2)) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRad(deg: number): number {
    return deg * (Math.PI / 180);
  }

  /**
   * Calcule le centre géographique d'un groupe de golfs
   */
  private calculateCenter(golfs: GolfParcours[]): { latitude: number; longitude: number } {
    if (golfs.length === 0) {
      return { latitude: 46.603354, longitude: 1.888334 }; // Centre de la France
    }

    const validGolfs = golfs.filter(
      (g) =>
        g.latitude &&
        g.longitude &&
        typeof g.latitude === 'number' &&
        typeof g.longitude === 'number' &&
        !isNaN(g.latitude) &&
        !isNaN(g.longitude) &&
        g.latitude >= -90 &&
        g.latitude <= 90 &&
        g.longitude >= -180 &&
        g.longitude <= 180
    );

    if (validGolfs.length === 0) {
      return { latitude: 46.603354, longitude: 1.888334 };
    }

    const sum = validGolfs.reduce(
      (acc, golf) => ({
        latitude: acc.latitude + golf.latitude!,
        longitude: acc.longitude + golf.longitude!,
      }),
      { latitude: 0, longitude: 0 }
    );

    const center = {
      latitude: sum.latitude / validGolfs.length,
      longitude: sum.longitude / validGolfs.length,
    };

    // Validation finale du centre calculé
    if (isNaN(center.latitude) || isNaN(center.longitude)) {
      return { latitude: 46.603354, longitude: 1.888334 };
    }

    return center;
  }

  /**
   * Groupe les golfs par département et calcule les clusters
   */
  private createDepartmentClusters(golfs: GolfParcours[]): DepartmentCluster[] {
    // Grouper par département
    const golfsByDepartment = golfs.reduce(
      (acc, golf) => {
        const dept = golf.department;
        if (!dept) return acc;

        if (!acc[dept]) {
          acc[dept] = [];
        }
        acc[dept].push(golf);
        return acc;
      },
      {} as Record<string, GolfParcours[]>
    );

    // Créer les clusters
    return Object.entries(golfsByDepartment).map(([department, deptGolfs]) => ({
      department,
      count: deptGolfs.length,
      center: this.calculateCenter(deptGolfs),
      golfs: deptGolfs, // Inclure les golfs pour usage ultérieur
    }));
  }

  /**
   * Trouve les golfs individuels proches de l'utilisateur
   */
  private findNearbyGolfs(
    golfs: GolfParcours[],
    userLat: number,
    userLng: number,
    maxDistance: number
  ): GolfParcours[] {
    return golfs
      .filter(
        (golf) =>
          golf.latitude &&
          golf.longitude &&
          this.calculateDistance(userLat, userLng, golf.latitude, golf.longitude) <= maxDistance
      )
      .sort((a, b) => {
        const distA = this.calculateDistance(userLat, userLng, a.latitude!, a.longitude!);
        const distB = this.calculateDistance(userLat, userLng, b.latitude!, b.longitude!);
        return distA - distB;
      });
  }

  /**
   * Génère les données de clustering pour la carte
   */
  public generateClusteringData(
    golfs: GolfParcours[],
    options: ClusteringOptions = {}
  ): ClusteringResult {
    const {
      userLatitude,
      userLongitude,
      maxDistanceForIndividual = 50, // 50km par défaut
      minGolfsForCluster = 1, // Au moins 1 golf pour créer un cluster
    } = options;

    // Créer tous les clusters départementaux
    const allClusters = this.createDepartmentClusters(golfs);

    // Filtrer les clusters qui ont assez de golfs
    const clusters = allClusters.filter((cluster) => cluster.count >= minGolfsForCluster);

    // Si on a une position utilisateur, trouver les golfs proches
    let nearbyIndividualGolfs: GolfParcours[] = [];
    if (userLatitude && userLongitude) {
      nearbyIndividualGolfs = this.findNearbyGolfs(
        golfs,
        userLatitude,
        userLongitude,
        maxDistanceForIndividual
      );
    }

    return {
      clusters,
      nearbyIndividualGolfs,
      totalGolfs: golfs.length,
    };
  }

  /**
   * Calcule les bounds (limites) géographiques d'un département
   */
  public calculateDepartmentBounds(golfs: GolfParcours[]) {
    const validGolfs = golfs.filter((g) => g.latitude && g.longitude);
    if (validGolfs.length === 0) {
      return null;
    }

    const lats = validGolfs.map((g) => g.latitude!);
    const lngs = validGolfs.map((g) => g.longitude!);

    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);

    // Ajouter un petit padding pour un meilleur affichage
    const padding = 0.05; // ~5km

    return {
      latitude: (minLat + maxLat) / 2,
      longitude: (minLng + maxLng) / 2,
      latitudeDelta: Math.max(maxLat - minLat + padding, 0.1),
      longitudeDelta: Math.max(maxLng - minLng + padding, 0.1),
    };
  }

  /**
   * Détermine le mode d'affichage optimal basé sur la position utilisateur et les données
   */
  public determineDisplayMode(
    clusteringResult: ClusteringResult,
    userLocation?: { latitude: number; longitude: number }
  ): MapDisplayMode {
    // Si on a une position utilisateur et des golfs proches, mode hybride
    if (userLocation && clusteringResult.nearbyIndividualGolfs.length > 0) {
      return 'hybrid';
    }

    // Si on a beaucoup de golfs individuels (ex: utilisateur dans une région dense)
    if (clusteringResult.nearbyIndividualGolfs.length > 20) {
      return 'individual';
    }

    // Par défaut, mode clusters pour la vue d'ensemble
    return 'clusters';
  }

  /**
   * Génère les données complètes pour la carte
   */
  public generateMapData(golfs: GolfParcours[], options: ClusteringOptions = {}): MapData {
    const clusteringResult = this.generateClusteringData(golfs, options);
    const userLocation =
      options.userLatitude && options.userLongitude
        ? {
            latitude: options.userLatitude,
            longitude: options.userLongitude,
          }
        : undefined;

    const mode = this.determineDisplayMode(clusteringResult, userLocation);

    return {
      mode,
      clusters: clusteringResult.clusters,
      individualGolfs: clusteringResult.nearbyIndividualGolfs,
      userLocation,
    };
  }

  /**
   * Génère les données d'affichage basées sur la région visible (système Airbnb)
   */
  public generateDisplayForRegion(
    region: Region,
    allClusters: DepartmentCluster[],
    allGolfs: GolfParcours[]
  ): ZoomBasedDisplay {
    console.log('🔍 Calcul affichage pour région:', {
      center: `${region.latitude.toFixed(4)}, ${region.longitude.toFixed(4)}`,
      zoom: `${region.latitudeDelta.toFixed(4)}°`,
    });

    const display = getDisplayForZoomLevel(region, allClusters, allGolfs);

    console.log('📊 Affichage calculé:', {
      zoomLevel: display.zoomLevel,
      clusters: display.clustersToShow.length,
      golfs: display.golfsToShow.length,
      showClusters: display.showClusters,
      showGolfs: display.showIndividualGolfs,
    });

    return display;
  }

  /**
   * Génère toutes les données nécessaires pour le système zoom dynamique
   */
  public generateFullMapData(golfs: GolfParcours[]): {
    allClusters: DepartmentCluster[];
    allGolfs: GolfParcours[];
    totalGolfs: number;
  } {
    const allClusters = this.createDepartmentClusters(golfs);

    return {
      allClusters,
      allGolfs: golfs,
      totalGolfs: golfs.length,
    };
  }

  /**
   * Filtre les golfs dans une région visible avec un padding
   */
  public filterGolfsInRegion(
    golfs: GolfParcours[],
    region: Region,
    paddingFactor = 1.2
  ): GolfParcours[] {
    const bounds = getVisibleBounds(region);

    // Ajouter du padding pour précharger les golfs proches
    const latPadding = ((bounds.north - bounds.south) * (paddingFactor - 1)) / 2;
    const lngPadding = ((bounds.east - bounds.west) * (paddingFactor - 1)) / 2;

    const expandedBounds = {
      north: bounds.north + latPadding,
      south: bounds.south - latPadding,
      east: bounds.east + lngPadding,
      west: bounds.west - lngPadding,
    };

    return golfs.filter(
      (golf) =>
        golf.latitude &&
        golf.longitude &&
        isInVisibleBounds(golf.latitude, golf.longitude, expandedBounds)
    );
  }
}

export const clusteringService = new ClusteringService();
