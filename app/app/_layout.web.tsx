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
import { View, StyleSheet } from 'react-native';
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

// Styles spécifiques pour le web mobile
const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    height: '100%',
    margin: 0,
    padding: 0,
    backgroundColor: Colors.neutral.white,
  },
  rootView: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
});

function RootLayoutContent() {
  // Injecter des styles CSS globaux pour le web mobile (dans useEffect pour éviter l'erreur sur mobile)
  useEffect(() => {
    if (typeof document !== 'undefined') {
      const style = document.createElement('style');
      style.textContent = `
        * {
          box-sizing: border-box;
          -webkit-tap-highlight-color: transparent;
        }

        html, body, #root, #__expo-root {
          margin: 0;
          padding: 0;
          height: 100%;
          width: 100%;
          overflow: hidden;
        }

        body {
          margin: 0;
          padding: 0;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
          overscroll-behavior: none;
          touch-action: pan-x pan-y;
        }

        /* Désactiver le zoom sur mobile web */
        input, textarea, select {
          font-size: 16px !important;
        }

        /* Empêcher le bounce sur iOS Safari */
        .gesture-handler-root-view {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          overflow: hidden;
        }
      `;
      document.head.appendChild(style);
    }
  }, []);
  return (
    <View style={styles.container}>
      <GestureHandlerRootView style={styles.rootView} className="gesture-handler-root-view">
        <ToastProvider>
          <ToastInitializer />
          <AlertModalProvider>
            <AlertModalInitializer />
            <StripeProviderWrapper>
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
                      </Stack>
                      <StatusBar style="auto" />
                  </OverlayProvider>
                </BottomSheetModalProvider>
              </ProProfileProvider>
            </AppProviders>
          </StripeProviderWrapper>
        </AlertModalProvider>
      </ToastProvider>
      </GestureHandlerRootView>
    </View>
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