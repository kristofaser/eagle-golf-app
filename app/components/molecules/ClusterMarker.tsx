import React from 'react';
import { StyleSheet, View, TouchableOpacity, Text } from 'react-native';
import { Marker } from 'react-native-maps';
import { Colors, Spacing, BorderRadius } from '@/constants/theme';
import { DepartmentCluster } from '@/types/clustering';

interface ClusterMarkerProps {
  cluster: DepartmentCluster;
  onPress: (cluster: DepartmentCluster) => void;
}

export function ClusterMarker({ cluster, onPress }: ClusterMarkerProps) {
  // Validation complète du cluster
  if (!cluster || 
      !cluster.center || 
      typeof cluster.center.latitude !== 'number' || 
      typeof cluster.center.longitude !== 'number' ||
      isNaN(cluster.center.latitude) || 
      isNaN(cluster.center.longitude) ||
      !cluster.department ||
      typeof cluster.count !== 'number') {
    console.warn('❌ ClusterMarker: cluster invalide', cluster);
    return null;
  }

  // Validation finale des coordonnées
  const latitude = Number(cluster.center.latitude);
  const longitude = Number(cluster.center.longitude);

  if (latitude < -90 || latitude > 90 ||
      longitude < -180 || longitude > 180 ||
      isNaN(latitude) || isNaN(longitude)) {
    console.warn('❌ ClusterMarker: coordonnées hors limites', { latitude, longitude });
    return null;
  }

  const count = Number(cluster.count);
  const department = String(cluster.department || '');

  if (count <= 0 || !department) {
    console.warn('❌ ClusterMarker: données invalides', { count, department });
    return null;
  }

  // Rendu simplifié avec valeurs garanties
  const coordinate = { latitude, longitude };
  const size = count >= 15 ? 'large' : count >= 8 ? 'medium' : 'small';
  const backgroundColor = count >= 15 ? Colors.primary.accent : 
                         count >= 8 ? Colors.secondary.electric : Colors.neutral.iron;

  return (
    <Marker
      key={`cluster-${department}-${count}`}
      coordinate={coordinate}
      onPress={() => onPress?.(cluster)}
      tracksViewChanges={false}
      stopPropagation={true}
    >
      <View style={[
        styles.clusterContainer,
        styles[size],
        { backgroundColor }
      ]}>
        <Text style={[styles.clusterText, { color: 'white', fontWeight: 'bold' }]}>
          {department}
        </Text>
        <Text style={[styles.countText, { color: 'white' }]}>
          {count}
        </Text>
      </View>
    </Marker>
  );
}

const styles = StyleSheet.create({
  clusterContainer: {
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.neutral.white,
    shadowColor: Colors.neutral.charcoal,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  small: {
    width: 40,
    height: 40,
  },
  medium: {
    width: 50,
    height: 50,
  },
  large: {
    width: 60,
    height: 60,
  },
  clusterText: {
    fontSize: 10,
    textAlign: 'center',
    lineHeight: 12,
  },
  countText: {
    fontSize: 8,
    textAlign: 'center',
    opacity: 0.9,
    lineHeight: 10,
  },
});