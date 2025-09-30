import React, { useEffect, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { GolfParcours } from '@/services/golf-parcours.service';
import { Colors } from '@/constants/theme';
import { logger } from '@/utils/logger';

interface GolfCoursesMapWebProps {
  allGolfs: GolfParcours[];
  userLocation?: { latitude: number; longitude: number };
  onCoursePress: (course: GolfParcours) => void;
  selectedCourseId?: string;
  onMapPress?: () => void;
}

// Composant pour gérer le centrage dynamique de la carte
function MapController({
  userLocation,
  selectedCourseId,
  allGolfs,
}: {
  userLocation?: { latitude: number; longitude: number };
  selectedCourseId?: string;
  allGolfs: GolfParcours[];
}) {
  const map = useMap();

  useEffect(() => {
    if (selectedCourseId) {
      const selectedGolf = allGolfs.find((g) => g.id === selectedCourseId);
      if (selectedGolf?.location?.coordinates) {
        const [longitude, latitude] = selectedGolf.location.coordinates;
        map.setView([latitude, longitude], 12, { animate: true });
      }
    }
  }, [selectedCourseId, allGolfs, map]);

  useEffect(() => {
    if (userLocation) {
      map.setView([userLocation.latitude, userLocation.longitude], 10, { animate: true });
    }
  }, [userLocation, map]);

  return null;
}

export function GolfCoursesMapWeb({
  allGolfs,
  userLocation,
  onCoursePress,
  selectedCourseId,
  onMapPress,
}: GolfCoursesMapWebProps) {
  const [initialized, setInitialized] = useState(false);

  // Initialisation unique au montage du composant
  useEffect(() => {
    // Styles CSS personnalisés pour l'attribution Leaflet
    if (typeof document !== 'undefined' && !document.getElementById('leaflet-custom-styles')) {
      const style = document.createElement('style');
      style.id = 'leaflet-custom-styles';
      style.textContent = `
        .leaflet-control-attribution {
          font-size: 8px !important;
          opacity: 0.5 !important;
          background: rgba(255, 255, 255, 0.7) !important;
          padding: 2px 4px !important;
        }
      `;
      document.head.appendChild(style);
    }

    // Fix for default marker icons in Leaflet
    try {
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      });
    } catch (error) {
      logger.warn('Erreur initialisation icônes Leaflet', error);
    }

    setInitialized(true);
  }, []);

  // Créer des icônes personnalisées pour les marqueurs
  const greenIcon = useMemo(
    () =>
      new L.Icon({
        iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41],
      }),
    []
  );

  const orangeIcon = useMemo(
    () =>
      new L.Icon({
        iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-orange.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41],
      }),
    []
  );

  // Position initiale de la carte
  const initialPosition: [number, number] = useMemo(() => {
    if (userLocation) {
      return [userLocation.latitude, userLocation.longitude];
    }
    // Paris par défaut
    return [48.8566, 2.3522];
  }, [userLocation]);

  // Filtrer les golfs avec des coordonnées valides
  const validGolfs = useMemo(() => {
    return allGolfs.filter(
      (golf) =>
        golf?.location?.coordinates &&
        Array.isArray(golf.location.coordinates) &&
        golf.location.coordinates.length === 2
    );
  }, [allGolfs]);

  logger.dev('🗺️ Rendu carte web Leaflet:', {
    totalGolfs: allGolfs.length,
    validGolfs: validGolfs.length,
    userLocation: !!userLocation,
    selectedCourseId,
  });

  return (
    <View style={styles.container}>
      <MapContainer
        center={initialPosition}
        zoom={userLocation ? 10 : 6}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={true}
        zoomControl={true}
      >
        <MapController
          userLocation={userLocation}
          selectedCourseId={selectedCourseId}
          allGolfs={validGolfs}
        />

        {/* Couche de tuiles OpenStreetMap */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={19}
        />

        {/* Marqueurs des parcours de golf */}
        {validGolfs.map((golf) => {
          const [longitude, latitude] = golf.location!.coordinates;

          // Validation finale des coordonnées
          if (
            typeof latitude !== 'number' ||
            typeof longitude !== 'number' ||
            isNaN(latitude) ||
            isNaN(longitude) ||
            latitude < -90 ||
            latitude > 90 ||
            longitude < -180 ||
            longitude > 180
          ) {
            return null;
          }

          const isSelected = selectedCourseId === golf.id;

          return (
            <Marker
              key={golf.id}
              position={[latitude, longitude]}
              icon={isSelected ? orangeIcon : greenIcon}
              eventHandlers={{
                click: () => {
                  logger.dev('🎯 Clic sur parcours:', golf.name);
                  onCoursePress(golf);
                },
              }}
            >
              <Popup>
                <div style={{ textAlign: 'center' }}>
                  <strong>{golf.name}</strong>
                  <br />
                  {golf.city}
                  {golf.hole_count && (
                    <>
                      <br />
                      {golf.hole_count} trous
                    </>
                  )}
                </div>
              </Popup>
            </Marker>
          );
        })}

        {/* Marqueur de position utilisateur */}
        {userLocation && (
          <Marker
            position={[userLocation.latitude, userLocation.longitude]}
            icon={
              new L.Icon({
                iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
                shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
                iconSize: [25, 41],
                iconAnchor: [12, 41],
                popupAnchor: [1, -34],
                shadowSize: [41, 41],
              })
            }
          >
            <Popup>
              <strong>Votre position</strong>
            </Popup>
          </Marker>
        )}
      </MapContainer>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.neutral.background,
  },
});