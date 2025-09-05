import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Marker } from 'react-native-maps';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { GolfHoleIcon } from '@hugeicons/core-free-icons';
import { Colors, Spacing, BorderRadius, Elevation } from '@/constants/theme';
import { Text } from '@/components/atoms';

interface CustomMapMarkerProps {
  coordinate: {
    latitude: number;
    longitude: number;
  };
  title: string;
  prosCount?: number;
  isSelected?: boolean;
  onPress?: () => void;
}

export const CustomMapMarker: React.FC<CustomMapMarkerProps> = ({
  coordinate,
  title,
  prosCount = 0,
  isSelected = false,
  onPress,
}) => {
  return (
    <Marker
      coordinate={coordinate}
      title={title}
      onPress={onPress}
      anchor={{ x: 0.5, y: 1 }}
      tracksViewChanges={false}
    >
      <View style={styles.markerContainer}>
        <View style={[styles.markerContent, isSelected && styles.markerContentSelected]}>
          <HugeiconsIcon icon={GolfHoleIcon} size={20} color={Colors.neutral.ball} />
        </View>
        {/* Pointe du marker */}
        <View style={[styles.markerTip, isSelected && styles.markerTipSelected]} />
      </View>
    </Marker>
  );
};

const styles = StyleSheet.create({
  markerContainer: {
    alignItems: 'center',
  },
  markerContent: {
    backgroundColor: Colors.neutral.charcoal,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    ...Elevation.medium,
  },
  markerContentSelected: {
    backgroundColor: Colors.primary.accent,
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  markerTip: {
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 6,
    borderStyle: 'solid',
    backgroundColor: 'transparent',
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: Colors.neutral.charcoal,
    marginTop: -1,
  },
  markerTipSelected: {
    borderTopColor: Colors.primary.accent,
  },
});
