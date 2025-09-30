// Version Web uniquement - utilise Leaflet
import React from 'react';
import { GolfParcours } from '@/services/golf-parcours.service';
import { GolfCoursesMapWeb } from './GolfCoursesMapWeb';

interface GolfCoursesMapExpoProps {
  allGolfs: GolfParcours[];
  userLocation?: { latitude: number; longitude: number };
  onCoursePress: (course: GolfParcours) => void;
  selectedCourseId?: string;
  onMapPress?: () => void;
}

export function GolfCoursesMapExpo({
  allGolfs,
  userLocation,
  onCoursePress,
  selectedCourseId,
  onMapPress,
}: GolfCoursesMapExpoProps) {
  return (
    <GolfCoursesMapWeb
      allGolfs={allGolfs}
      userLocation={userLocation}
      onCoursePress={onCoursePress}
      selectedCourseId={selectedCourseId}
      onMapPress={onMapPress}
    />
  );
}