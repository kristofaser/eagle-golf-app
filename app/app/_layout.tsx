import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useFonts } from 'expo-font';
import {
  Inter_300Light,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  Inter_800ExtraBold,
} from '@expo-google-fonts/inter';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import 'react-native-reanimated';
import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { OverlayProvider } from '@/contexts/OverlayContext';
import { AppProviders } from '@/contexts/AppProviders';
import { queryClient } from '@/services/query/queryClient';
import { ProProfileProvider } from '@/contexts/ProProfileContext';
import { StripeProviderWrapper } from '@/contexts/StripeContext';
import { AlertModalProvider } from '@/contexts/AlertModalContext';
import { AlertModalInitializer } from '@/components/atoms/AlertModalInitializer';
import { ToastProvider } from '@/contexts/ToastContext';
import { ToastInitializer } from '@/components/atoms/ToastInitializer';
import { CommissionProvider } from '@/contexts/CommissionContext';
import '@/utils/polyfills';
import { DURATIONS, EASING_CURVES } from '@/constants/animations';
import { Colors } from '@/constants/theme';

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router';

export const unstable_settings = {
  // Ensure that reloading on `/modal` keeps a back button present.
  initialRouteName: 'index',
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

function RootLayoutContent() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ToastProvider>
        <ToastInitializer />
        <AlertModalProvider>
          <AlertModalInitializer />
          <StripeProviderWrapper>
            <CommissionProvider>
              <AppProviders>
                <ProProfileProvider>
                  <BottomSheetModalProvider>
                    <OverlayProvider>
                <Stack
                  screenOptions={{
                    headerShown: false,
                    animation: 'slide_from_right',
                    animationDuration: DURATIONS.NORMAL,
                  }}
                >
                  <Stack.Screen name="index" options={{ headerShown: false }} />
                  <Stack.Screen name="splash" options={{ headerShown: false }} />
                  <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                  <Stack.Screen
                    name="profile/pricing"
                    options={{
                      headerShown: false,
                      presentation: 'modal',
                      animation: 'slide_from_bottom',
                      animationDuration: DURATIONS.MEDIUM,
                    }}
                  />
                  <Stack.Screen
                    name="profile/availability"
                    options={{
                      headerShown: false,
                      presentation: 'modal',
                      animation: 'slide_from_bottom',
                      animationDuration: DURATIONS.MEDIUM,
                    }}
                  />
                  <Stack.Screen
                    name="profile/pro-settings"
                    options={{
                      headerShown: true,
                      title: 'Mes Skills',
                      presentation: 'modal',
                      animation: 'slide_from_bottom',
                      animationDuration: DURATIONS.MEDIUM,
                      headerStyle: {
                        backgroundColor: '#FFFFFF',
                      },
                      headerTitleStyle: {
                        color: '#1A1A1A',
                        fontWeight: '600',
                      },
                    }}
                  />
                  <Stack.Screen
                    name="profile/experiences"
                    options={{
                      headerShown: false,
                      presentation: 'modal',
                      animation: 'slide_from_bottom',
                      animationDuration: DURATIONS.MEDIUM,
                    }}
                  />
                  <Stack.Screen
                    name="profile/division"
                    options={{
                      headerShown: false,
                      presentation: 'modal',
                      animation: 'slide_from_bottom',
                      animationDuration: DURATIONS.MEDIUM,
                    }}
                  />
                  <Stack.Screen
                    name="premium-paywall"
                    options={{
                      headerShown: false,
                      presentation: 'fullScreenModal',
                      animation: 'slide_from_bottom',
                      animationDuration: DURATIONS.MEDIUM,
                    }}
                  />
                  <Stack.Screen
                    name="search"
                    options={{
                      headerShown: false,
                      presentation: 'card',
                      animation: 'fade',
                      animationDuration: DURATIONS.FAST,
                    }}
                  />
                  <Stack.Screen
                    name="profile/[id]"
                    options={{
                      headerShown: false,
                      presentation: 'card',
                      animation: 'fade',
                      animationDuration: DURATIONS.NORMAL,
                    }}
                  />
                  <Stack.Screen
                    name="parcours/[id]"
                    options={{
                      headerShown: false,
                      presentation: 'card',
                      animation: 'fade_from_bottom',
                      animationDuration: DURATIONS.NORMAL,
                    }}
                  />
                  <Stack.Screen
                    name="booking-modal"
                    options={{
                      headerShown: false,
                      presentation: 'modal',
                      animation: 'slide_from_bottom',
                      animationDuration: DURATIONS.MEDIUM,
                    }}
                  />
                  <Stack.Screen
                    name="become-pro"
                    options={{
                      headerShown: false,
                      presentation: 'modal',
                      animation: 'slide_from_bottom',
                      animationDuration: DURATIONS.MEDIUM,
                    }}
                  />
                  <Stack.Screen
                    name="video-skill/upload/[skill]"
                    options={{
                      headerShown: true,
                      presentation: 'modal',
                      animation: 'slide_from_bottom',
                      animationDuration: DURATIONS.MEDIUM,
                      headerStyle: {
                        backgroundColor: Colors.neutral.white,
                      },
                      headerTitleStyle: {
                        color: Colors.neutral.charcoal,
                        fontWeight: '600',
                      },
                    }}
                  />
                  <Stack.Screen
                    name="notifications"
                    options={{
                      headerShown: false,
                      presentation: 'modal',
                      animation: 'slide_from_bottom',
                      animationDuration: DURATIONS.MEDIUM,
                    }}
                  />
                  <Stack.Screen
                    name="pros-nearby-modal"
                    options={{
                      headerShown: false,
                      presentation: 'modal',
                      animation: 'slide_from_bottom',
                      animationDuration: DURATIONS.MEDIUM,
                    }}
                  />
                  <Stack.Screen
                    name="pros-division-modal"
                    options={{
                      headerShown: false,
                      presentation: 'modal',
                      animation: 'slide_from_bottom',
                      animationDuration: DURATIONS.MEDIUM,
                    }}
                  />
                </Stack>
                <StatusBar style="auto" />
                </OverlayProvider>
              </BottomSheetModalProvider>
            </ProProfileProvider>
          </AppProviders>
        </CommissionProvider>
      </StripeProviderWrapper>
        </AlertModalProvider>
      </ToastProvider>
    </GestureHandlerRootView>
  );
}

export default function RootLayout() {
  const [loaded, error] = useFonts({
    ...FontAwesome.font,
    // Police mono disponible
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    // Polices Inter pour le design system
    'Inter-Light': Inter_300Light,
    Inter: Inter_400Regular,
    'Inter-Regular': Inter_400Regular,
    'Inter-Medium': Inter_500Medium,
    'Inter-SemiBold': Inter_600SemiBold,
    'Inter-Bold': Inter_700Bold,
    'Inter-ExtraBold': Inter_800ExtraBold,
  });

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (error) throw error;
  }, [error]);

  // Cacher le splash screen dès que les fonts sont chargées
  useEffect(() => {
    if (loaded) {
      console.log('Fonts loaded, hiding native splash immediately');
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <RootLayoutContent />
    </QueryClientProvider>
  );
}
