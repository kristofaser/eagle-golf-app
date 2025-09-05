// Type pour la géométrie PostGIS Point
export interface PostGISPoint {
  type: 'Point';
  coordinates: [number, number]; // [longitude, latitude]
}

// Extension du type GolfCourse avec location typée
export interface GolfCourseWithLocation {
  location: PostGISPoint | null;
}
