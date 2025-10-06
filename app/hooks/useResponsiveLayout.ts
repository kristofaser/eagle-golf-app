import { useState, useEffect } from 'react';
import { Dimensions, Platform } from 'react-native';

export interface ResponsiveBreakpoints {
  mobile: number;
  tablet: number;
  desktop: number;
}

export interface ScreenInfo {
  width: number;
  height: number;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isWeb: boolean;
  orientation: 'portrait' | 'landscape';
}

const DEFAULT_BREAKPOINTS: ResponsiveBreakpoints = {
  mobile: 768,
  tablet: 1024,
  desktop: 1200,
};

export function useResponsiveLayout(customBreakpoints?: Partial<ResponsiveBreakpoints>): ScreenInfo {
  const breakpoints = { ...DEFAULT_BREAKPOINTS, ...customBreakpoints };

  const [screenData, setScreenData] = useState<ScreenInfo>(() => {
    const { width, height } = Dimensions.get('window');
    const isWeb = Platform.OS === 'web';

    return {
      width,
      height,
      isMobile: width < breakpoints.mobile,
      isTablet: width >= breakpoints.mobile && width < breakpoints.desktop,
      isDesktop: width >= breakpoints.desktop,
      isWeb,
      orientation: width > height ? 'landscape' : 'portrait',
    };
  });

  useEffect(() => {
    const updateScreenData = ({ window }: { window: { width: number; height: number } }) => {
      const { width, height } = window;
      const isWeb = Platform.OS === 'web';

      setScreenData({
        width,
        height,
        isMobile: width < breakpoints.mobile,
        isTablet: width >= breakpoints.mobile && width < breakpoints.desktop,
        isDesktop: width >= breakpoints.desktop,
        isWeb,
        orientation: width > height ? 'landscape' : 'portrait',
      });
    };

    const subscription = Dimensions.addEventListener('change', updateScreenData);

    return () => subscription?.remove();
  }, [breakpoints.mobile, breakpoints.desktop]);

  return screenData;
}

// Hook spécialisé pour les layouts adaptatifs
export function useAdaptiveLayout() {
  const screenInfo = useResponsiveLayout();

  return {
    ...screenInfo,
    // Helpers pour les layouts
    shouldShowSidebar: screenInfo.isDesktop,
    shouldShowTabs: screenInfo.isMobile || screenInfo.isTablet,
    shouldShowDrawer: screenInfo.isTablet,
    maxModalWidth: screenInfo.isMobile ? '100%' : screenInfo.isTablet ? '80%' : '60%',
    contentPadding: screenInfo.isMobile ? 16 : screenInfo.isTablet ? 24 : 32,
    gridColumns: screenInfo.isMobile ? 1 : screenInfo.isTablet ? 2 : 3,
  };
}

/**
 * Hook spécialisé pour les écrans d'authentification
 * Calcule les dimensions responsive pour les formulaires auth
 */
export function useAuthLayout() {
  const { width, height, orientation } = useResponsiveLayout();

  // Détection écran petit
  const isSmallScreen = height < 700;

  // Calcul hauteur formulaire responsive
  // - Petits écrans: 40% de la hauteur
  // - Écrans normaux: 280px max
  // - Paysage: 50% de la hauteur
  let formMaxHeight: number;
  if (orientation === 'landscape') {
    formMaxHeight = height * 0.5;
  } else if (isSmallScreen) {
    formMaxHeight = height * 0.4;
  } else {
    formMaxHeight = 280;
  }

  return {
    formMaxHeight,
    isSmallScreen,
    isLandscape: orientation === 'landscape',
    width,
    height,
  };
}