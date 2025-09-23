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
    silver: '#8895A7', // Gris-bleu argenté (AMÉLIORÉ de #B8C5D6) - Ratio 4.5:1 ✅
    gold: '#FFB300', // Or (premium, récompenses)
    grass: '#4CAF50', // Vert golf (validation, succès)
  },

  // Neutral Colors (hiérarchie typographique - CONSOLIDÉS)
  neutral: {
    black: '#000000', // Noir pur (rare)
    charcoal: '#022142', // Texte principal (ex-navy, ex-dark) - Ratio 15.8:1 ✅
    iron: '#4A5568', // Texte secondaire - Ratio 7.1:1 ✅
    course: '#5A6B7F', // Labels, hints (AMÉLIORÉ de #718096) - Ratio 5.2:1 ✅
    mist: '#A8B5C6', // Bordures (AMÉLIORÉ de #CBD5E0) - Ratio 3.1:1 (OK pour éléments non-texte)
    pearl: '#E1E1E1', // Dividers (ex-secondary.pearl, ex-lightGray)
    cloud: '#F7FAFC', // Backgrounds (ex-background, ex-lightBackground, ex-extraLightGray)
    white: '#FFFFFF', // Blanc pur (ex-ball, ex-cardBackground, ex-inputBackground)
  },

  // Semantic Colors (actions & états - AMÉLIORÉS)
  semantic: {
    success: {
      default: '#4CAF50', // Vert golf principal
      light: '#E8F5E9', // Vert très clair
      dark: '#388E3C', // Vert foncé
    },
    warning: {
      default: '#FFA726', // Orange doux
      light: '#FFF3E0', // Orange très clair
      dark: '#F57C00', // Orange foncé
    },
    error: {
      default: '#EF5350', // Rouge atténué (ex-errorText)
      light: '#FFEBEE', // Rouge très clair
      dark: '#D32F2F', // Rouge foncé
    },
    info: {
      default: '#0472B2', // Bleu électrique (ex-focusBorder, ex-primaryButton)
      light: '#E6F4FF', // Bleu très clair (ex-veryLightGray)
      dark: '#025A8B', // Bleu foncé
    },
  },

  // Shadows
  shadows: {
    light: 'rgba(0, 0, 0, 0.08)',
    medium: 'rgba(0, 0, 0, 0.10)',
    dark: 'rgba(0, 0, 0, 0.12)',
  },

  // Division System (pour ProCard et classifications)
  division: {
    'European Tour': {
      background: '#FFD700', // Or
      text: '#B8860B', // Or foncé
      border: '#F4D03F',
    },
    'DP World Tour': {
      background: '#E6F3FF', // Bleu clair
      text: '#0066CC', // Bleu foncé
      border: '#B3D9FF',
    },
    'Challenge Tour': {
      background: '#E8F5E8', // Vert clair
      text: '#2E7D32', // Vert foncé
      border: '#A5D6A7',
    },
    'Alps Tour': {
      background: '#FFF3E0', // Orange clair
      text: '#E65100', // Orange foncé
      border: '#FFCC80',
    },
    'Pro Golf Tour': {
      background: '#F3E5F5', // Violet clair
      text: '#7B1FA2', // Violet foncé
      border: '#CE93D8',
    },
    National: {
      background: '#E3F2FD', // Bleu clair
      text: '#1565C0', // Bleu foncé
      border: '#90CAF9',
    },
    Regional: {
      background: '#F1F8E9', // Vert très clair
      text: '#388E3C', // Vert foncé
      border: '#C8E6C9',
    },
    default: {
      background: '#F5F5F5', // Gris clair
      text: '#757575', // Gris foncé
      border: '#E0E0E0',
    },
  },

  // UI-specific colors (CONSOLIDÉS)
  ui: {
    overlay: 'rgba(2, 33, 66, 0.7)', // Navy overlay
    favoriteHeart: 'rgba(128, 128, 128, 0.7)',
    googleRed: '#EA4335',
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
    h5: 16, // AJOUTÉ
    h6: 14, // AJOUTÉ
    bodyLarge: 16,
    body: 14,
    bodySmall: 12, // AJOUTÉ
    caption: 12,
    overline: 10, // AJOUTÉ
    label: 11, // AJOUTÉ
    small: 11,
  },

  lineHeight: {
    h1: 40,
    h2: 32,
    h3: 28,
    h4: 24,
    h5: 22, // AJOUTÉ
    h6: 20, // AJOUTÉ
    bodyLarge: 24,
    body: 20,
    bodySmall: 18, // AJOUTÉ
    caption: 16,
    overline: 14, // AJOUTÉ
    label: 16, // AJOUTÉ
    small: 14,
  },

  fontWeight: {
    light: '300' as const, // AJOUTÉ
    regular: '400' as const,
    medium: '500' as const,
    semiBold: '600' as const,
    bold: '700' as const,
    extraBold: '800' as const, // AJOUTÉ
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
  xxlarge: 20, // Pour le style moderne/épuré
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
  minimal: {
    shadowColor: Colors.shadows.dark,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, // Ombre très subtile pour style épuré
    shadowRadius: 2,
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

export const TouchTarget = {
  // Minimum touch target sizes (iOS: 44x44, Android: 48x48)
  minimum: {
    width: 44,
    height: 44,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  // For Android compatibility
  android: {
    width: 48,
    height: 48,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  // Hit slop for smaller icons
  hitSlop: {
    top: 10,
    bottom: 10,
    left: 10,
    right: 10,
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
  TouchTarget,
};
