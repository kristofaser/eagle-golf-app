export const Colors = {
  // Primary Colors (basées sur le logo Eagle)
  primary: {
    navy: '#022142', // Bleu marine profond du logo (principal)
    electric: '#0472B2', // Bleu électrique du logo (CTA, liens)
    skyBlue: '#0A8FDB', // Bleu ciel (variante claire)
    lightBlue: '#E6F4FF', // Bleu très clair (backgrounds)
    accent: '#0472B2', // Alias pour compatibilité
  },

  // Secondary Colors (complémentaires)
  secondary: {
    pearl: '#E1E1E1', // Gris perle du logo
    silver: '#B8C5D6', // Gris-bleu argenté
    gold: '#FFB300', // Or (premium, récompenses)
    grass: '#4CAF50', // Vert golf (validation, succès)
  },

  // Neutral Colors (hiérarchie typographique)
  neutral: {
    black: '#000000', // Noir pur (rare)
    charcoal: '#022142', // Texte principal (navy du logo)
    iron: '#4A5568', // Texte secondaire
    course: '#718096', // Labels, hints
    mist: '#CBD5E0', // Bordures
    pearl: '#E1E1E1', // Du logo (dividers)
    cloud: '#F7FAFC', // Backgrounds légers
    ball: '#FFFFFF', // Backgrounds
    background: '#F7FAFC', // Backgrounds alternatifs
    white: '#FFFFFF', // Blanc pur
    gray: '#718096', // Gris standard
    lightGray: '#E1E1E1', // Gris clair (pearl)
    dark: '#022142', // Noir/foncé (navy)
  },

  // Semantic Colors (actions & états)
  semantic: {
    success: '#4CAF50', // Vert golf (on garde pour la cohérence)
    successLight: '#E8F5E9', // Vert très clair
    warning: '#FFA726', // Orange doux
    warningLight: '#FFF3E0', // Orange très clair
    error: '#EF5350', // Rouge atténué
    info: '#0472B2', // Bleu électrique du logo
  },

  // Shadows
  shadows: {
    light: 'rgba(0, 0, 0, 0.08)',
    medium: 'rgba(0, 0, 0, 0.10)',
    dark: 'rgba(0, 0, 0, 0.12)',
  },

  // UI-specific colors (from hardcoded values)
  ui: {
    cardBackground: '#FFFFFF',
    overlay: 'rgba(2, 33, 66, 0.7)', // Navy overlay
    favoriteHeart: 'rgba(128, 128, 128, 0.7)',
    inputBackground: '#FFFFFF',
    inputBorder: '#CBD5E0',
    focusBorder: '#0472B2',
    subtleGray: '#4A5568',
    textGray: '#718096',
    lightBackground: '#F7FAFC',
    veryLightGray: '#E6F4FF',
    extraLightGray: '#F7FAFC',
    errorText: '#EF5350',
    googleRed: '#EA4335',
    primaryButton: '#0472B2',
    secondaryText: '#4A5568',
  },
};

export const Typography = {
  fontFamily: {
    primary: 'Inter',
    display: 'Playfair Display',
    mono: 'SpaceMono',
  },

  fontSize: {
    h1: 32,
    h2: 24,
    h3: 20,
    h4: 18,
    bodyLarge: 16,
    body: 14,
    caption: 12,
    small: 11,
  },

  lineHeight: {
    h1: 40,
    h2: 32,
    h3: 28,
    h4: 24,
    bodyLarge: 24,
    body: 20,
    caption: 16,
    small: 14,
  },

  fontWeight: {
    regular: '400' as const,
    medium: '500' as const,
    semiBold: '600' as const,
    bold: '700' as const,
  },
};

export const Spacing = {
  xxs: 4,
  xs: 8,
  s: 12,
  m: 16,
  l: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,
};

export const BorderRadius = {
  small: 4,
  medium: 8,
  large: 12,
  xlarge: 16,
  round: 999,
};

export const Elevation = {
  none: {
    shadowColor: Colors.shadows.dark,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  small: {
    shadowColor: Colors.shadows.dark,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 3,
    elevation: 1,
  },
  medium: {
    shadowColor: Colors.shadows.light,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
  },
  large: {
    shadowColor: Colors.shadows.medium,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 16,
    elevation: 3,
  },
  xlarge: {
    shadowColor: Colors.shadows.dark,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 4,
  },
};

export const Animation = {
  duration: {
    fast: 200,
    normal: 300,
    slow: 400,
  },
  easing: {
    standard: { duration: 300, type: 'timing' as const, useNativeDriver: true },
    decelerate: { duration: 300, type: 'timing' as const, useNativeDriver: true },
    accelerate: { duration: 300, type: 'timing' as const, useNativeDriver: true },
  },
};

export const Layout = {
  grid: {
    columns: 12,
    gutter: Spacing.m,
    marginMobile: Spacing.m,
    marginTablet: Spacing.l,
    marginDesktop: Spacing.xl,
  },
  breakpoints: {
    mobile: 0,
    tablet: 768,
    desktop: 1024,
  },
};

export default {
  Colors,
  Typography,
  Spacing,
  BorderRadius,
  Elevation,
  Animation,
  Layout,
};
