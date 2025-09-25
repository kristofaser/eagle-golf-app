/**
 * Utility functions for authentication-related alerts
 * Provides consistent auth prompts across the application
 */
import { Alert } from 'react-native';
import type { Router } from 'expo-router';

/**
 * Shows an authentication alert for favorite actions
 * @param router - Expo router instance for navigation
 * @param currentPath - Current path to return to after authentication
 * @param onContinueWithoutAuth - Optional callback when user chooses to continue without auth
 */
export function showFavoriteAuthAlert(
  router: Router,
  currentPath: string,
  onContinueWithoutAuth?: () => void
) {
  Alert.alert('Connexion requise', 'Connectez-vous pour sauvegarder vos favoris', [
    {
      text: 'Continuer à explorer',
      style: 'cancel',
      onPress: onContinueWithoutAuth,
    },
    {
      text: 'Se connecter',
      onPress: () =>
        router.push({
          pathname: '/(auth)/login',
          params: { returnTo: currentPath },
        }),
    },
    {
      text: "S'inscrire",
      onPress: () =>
        router.push({
          pathname: '/(auth)/register',
          params: { returnTo: currentPath },
        }),
      style: 'default',
    },
  ]);
}

/**
 * Gets the current path for returnTo parameter
 * @param pathname - Current pathname from usePathname or router
 * @param searchParams - Optional search parameters to preserve
 */
export function getCurrentPath(pathname: string, searchParams?: Record<string, string>): string {
  if (!searchParams || Object.keys(searchParams).length === 0) {
    return pathname;
  }

  const params = new URLSearchParams(searchParams);
  return `${pathname}?${params.toString()}`;
}
