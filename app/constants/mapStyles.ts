export const golfMapStyle = [
  {
    // Masquer les POI commerciaux pour plus de clarté
    featureType: 'poi.business',
    stylers: [{ visibility: 'off' }],
  },
  {
    // Couleur de l'eau - bleu golf élégant
    featureType: 'water',
    elementType: 'geometry.fill',
    stylers: [{ color: '#5DADE2' }],
  },
  {
    // Parcs et espaces verts - vert fairway
    featureType: 'poi.park',
    elementType: 'geometry.fill',
    stylers: [{ color: '#2ECC71' }],
  },
  {
    // Terrains de golf en vert plus vif
    featureType: 'poi.sports_complex',
    elementType: 'geometry.fill',
    stylers: [{ color: '#27AE60' }],
  },
  {
    // Routes principales - gris discret
    featureType: 'road.highway',
    elementType: 'geometry',
    stylers: [{ color: '#BDC3C7' }],
  },
  {
    // Routes secondaires - gris clair
    featureType: 'road.arterial',
    elementType: 'geometry',
    stylers: [{ color: '#D5DBDB' }],
  },
  {
    // Petites routes - très discret
    featureType: 'road.local',
    elementType: 'geometry',
    stylers: [{ color: '#EAEDED' }],
  },
  {
    // Labels de routes - style subtil
    featureType: 'road',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#7F8C8D' }],
  },
  {
    // Fond de carte - beige clair comme le sable
    featureType: 'landscape',
    elementType: 'geometry.fill',
    stylers: [{ color: '#F8F5F1' }],
  },
  {
    // Zones urbaines - beige un peu plus foncé
    featureType: 'landscape.man_made',
    elementType: 'geometry.fill',
    stylers: [{ color: '#F5E6D3' }],
  },
  {
    // Végétation naturelle - vert doux
    featureType: 'landscape.natural',
    elementType: 'geometry.fill',
    stylers: [{ color: '#A8D5A8' }],
  },
  {
    // Masquer les icônes de transit
    featureType: 'transit',
    stylers: [{ visibility: 'off' }],
  },
  {
    // Labels de lieux - style élégant
    featureType: 'poi',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#2C3E50' }],
  },
  {
    // Contours d'eau plus visibles
    featureType: 'water',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#2980B9' }],
  },
  {
    // Bâtiments administratifs discrets
    featureType: 'administrative',
    elementType: 'geometry',
    stylers: [{ color: '#ECF0F1' }],
  },
  {
    // Labels administratifs
    featureType: 'administrative',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#34495E' }],
  },
];

// Style alternatif mode sombre pour le soir
export const golfMapStyleDark = [
  {
    elementType: 'geometry',
    stylers: [{ color: '#1A2332' }],
  },
  {
    elementType: 'labels.text.stroke',
    stylers: [{ color: '#1A2332' }],
  },
  {
    elementType: 'labels.text.fill',
    stylers: [{ color: '#8A95A5' }],
  },
  {
    featureType: 'administrative',
    elementType: 'geometry',
    stylers: [{ color: '#4B5563' }],
  },
  {
    featureType: 'poi.park',
    elementType: 'geometry',
    stylers: [{ color: '#1B4332' }],
  },
  {
    featureType: 'poi.park',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#6B8E7F' }],
  },
  {
    featureType: 'road',
    elementType: 'geometry',
    stylers: [{ color: '#2C3E50' }],
  },
  {
    featureType: 'road',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#9CA3AF' }],
  },
  {
    featureType: 'water',
    elementType: 'geometry',
    stylers: [{ color: '#1A237E' }],
  },
  {
    featureType: 'water',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#4FC3F7' }],
  },
  {
    featureType: 'poi.business',
    stylers: [{ visibility: 'off' }],
  },
  {
    featureType: 'transit',
    stylers: [{ visibility: 'off' }],
  },
];
