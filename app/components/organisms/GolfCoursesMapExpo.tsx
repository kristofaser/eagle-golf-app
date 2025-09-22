import React, { useEffect, useRef, useState, useCallback } from 'react';
import { StyleSheet, View, ActivityIndicator, Platform } from 'react-native';
import MapView, { Region, PROVIDER_GOOGLE, PROVIDER_DEFAULT, Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import { Colors, Spacing } from '@/constants/theme';
import { GolfParcours } from '@/services/golf-parcours.service';
import { PostGISPoint } from '@/types/location';
import { Text } from '@/components/atoms';
import { golfMapStyle } from '@/constants/mapStyles';
import { logger } from '@/utils/logger';

interface GolfCoursesMapExpoProps {
  // Version ultra-simplifiée
  allGolfs: GolfParcours[];
  userLocation?: { latitude: number; longitude: number };
  
  // Callbacks essentiels
  onCoursePress: (course: GolfParcours) => void;
  selectedCourseId?: string | undefined;
  onMapPress?: () => void;
}

const INITIAL_REGION = {
  latitude: 48.8566, // Paris par défaut
  longitude: 2.3522,
  latitudeDelta: 0.5,
  longitudeDelta: 0.5,
};

export function GolfCoursesMapExpo({
  allGolfs = [],
  userLocation: propsUserLocation,
  onCoursePress,
  selectedCourseId,
  onMapPress,
}: GolfCoursesMapExpoProps) {
  const mapRef = useRef<MapView>(null);
  const [userLocation, setUserLocation] = useState<Location.LocationObject | null>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(true);
  const [region, setRegion] = useState<Region>(INITIAL_REGION);

  // Géolocalisation au démarrage
  useEffect(() => {
    (async () => {
      try {
        // Utiliser la position fournie en props si disponible
        if (propsUserLocation) {
          logger.dev('📍 Utilisation position props:', propsUserLocation);
          setRegion({
            latitude: propsUserLocation.latitude,
            longitude: propsUserLocation.longitude,
            latitudeDelta: 0.15,
            longitudeDelta: 0.15,
          });
          setIsLoadingLocation(false);
          return;
        }

        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          logger.warn('❌ Permission de localisation refusée');
          setIsLoadingLocation(false);
          return;
        }

        logger.dev('📍 Récupération de la position utilisateur...');
        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });

        logger.dev('✅ Position trouvée:', location.coords.latitude, location.coords.longitude);
        setUserLocation(location);
        
        setRegion({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          latitudeDelta: 0.15, // Zoom initial pour voir les golfs proches
          longitudeDelta: 0.15,
        });
      } catch (error) {
        logger.error('❌ Erreur localisation', error);
      } finally {
        setIsLoadingLocation(false);
      }
    })();
  }, [propsUserLocation]);

  // Version simplifiée : juste gérer le changement de région
  const handleRegionChangeComplete = useCallback((newRegion: Region) => {
    logger.dev('🗺️ Région changée:', {
      center: `${newRegion.latitude.toFixed(4)}, ${newRegion.longitude.toFixed(4)}`,
      delta: `${newRegion.latitudeDelta.toFixed(4)}°`,
    });
    
    setRegion(newRegion);
  }, []);

  // Gérer le clic sur un golf individuel
  const handleMarkerPress = useCallback((course: GolfParcours) => {
    onCoursePress(course);

    // Centrer la carte sur le parcours sélectionné avec un zoom adapté
    if (course.location && mapRef.current) {
      const location = course.location as PostGISPoint;
      const [longitude, latitude] = location.coordinates;
      
      mapRef.current.animateToRegion(
        {
          latitude,
          longitude,
          latitudeDelta: 0.05, // Zoom détaillé
          longitudeDelta: 0.05,
        },
        500
      );
    }
  }, [onCoursePress]);

  // Plus de gestion de clusters - version simplifiée

  // Version simplifiée - pas de clustering
  
  // Génération simple des marqueurs de golf
  const generateSimpleGolfMarkers = () => {
    const markers = [];
    
    // Filtrer les golfs valides - tous les golfs disponibles
    const validGolfs = allGolfs.filter(golf => 
      golf && 
      golf.id && 
      golf.location &&
      typeof golf.location === 'object' &&
      golf.location.coordinates &&
      Array.isArray(golf.location.coordinates) &&
      golf.location.coordinates.length === 2
    ); // Plus de limitation - tous les golfs
    
    for (let i = 0; i < validGolfs.length; i++) {
      const golf = validGolfs[i];
      const location = golf.location as PostGISPoint;
      const [longitude, latitude] = location.coordinates;
      
      // Validation finale des coordonnées
      if (typeof latitude !== 'number' || typeof longitude !== 'number' ||
          isNaN(latitude) || isNaN(longitude) ||
          latitude < -90 || latitude > 90 ||
          longitude < -180 || longitude > 180) {
        continue;
      }
      
      const isSelected = selectedCourseId === golf.id;
      
      markers.push(
        <Marker
          key={`golf-${golf.id}-${i}`}
          coordinate={{ latitude, longitude }}
          pinColor={isSelected ? '#FF6B35' : '#4CAF50'}
          onPress={() => onCoursePress(golf)}
        />
      );
    }
    
    return markers;
  };

  logger.dev('🗺️ Rendu carte (version simple):', {
    golfs: allGolfs.length,
    userLocation: !!userLocation || !!propsUserLocation,
  });

  if (isLoadingLocation) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color={Colors.primary.accent} />
        <Text variant="body" color="course" style={styles.loadingText}>
          Localisation en cours...
        </Text>
      </View>
    );
  }

  // Ne rien rendre si les données ne sont pas prêtes
  if (!allGolfs || allGolfs.length === 0) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color={Colors.primary.accent} />
        <Text variant="body" color="course" style={styles.loadingText}>
          Chargement de la carte...
        </Text>
      </View>
    );
  }

  return (
    <MapView
      ref={mapRef}
      style={styles.container}
      provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : PROVIDER_DEFAULT}
      customMapStyle={golfMapStyle}
      initialRegion={region}
      onRegionChangeComplete={handleRegionChangeComplete}
      onPress={onMapPress}
      showsUserLocation={true}
      showsMyLocationButton={true}
      showsCompass={true}
      toolbarEnabled={false}
    >
      {/* Marqueurs de golf simples */}
      {generateSimpleGolfMarkers()}
    </MapView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.neutral.background,
  },
  loadingText: {
    marginTop: Spacing.m,
    textAlign: 'center',
  },
});