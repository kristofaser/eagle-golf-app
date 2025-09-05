import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'expo-router';
import { useAuth } from './useAuth';
import { useSession } from '@/contexts/AppProviders';

export interface ProtectedRouteOptions {
  requireAuth?: boolean;
  requireRole?: 'amateur' | 'pro' | 'admin';
  redirectTo?: string;
  onUnauthorized?: () => void;
}

/**
 * Hook pour protéger automatiquement les routes nécessitant une authentification
 *
 * @example
 * // Protection simple (authentification requise)
 * useProtectedRoute();
 *
 * @example
 * // Protection avec rôle spécifique
 * useProtectedRoute({ requireRole: 'pro' });
 *
 * @example
 * // Protection avec redirection personnalisée
 * useProtectedRoute({ redirectTo: '/subscription/upgrade' });
 */
export function useProtectedRoute(options: ProtectedRouteOptions = {}) {
  const { requireAuth = true, requireRole = null, redirectTo = '/login', onUnauthorized } = options;

  const { isAuthenticated, user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isChecking, setIsChecking] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    // Si on est encore en train de charger l'état d'auth, on attend
    if (isAuthenticated === null) {
      return;
    }

    setIsChecking(false);

    // Si authentification requise mais utilisateur non connecté
    if (requireAuth && !isAuthenticated) {
      // Callback personnalisé si fourni
      if (onUnauthorized) {
        onUnauthorized();
      }

      // Redirection avec sauvegarde de la page actuelle
      router.replace({
        pathname: redirectTo as any,
        params: {
          returnTo: pathname,
        },
      });
      setIsAuthorized(false);
      return;
    }

    // Si un rôle spécifique est requis
    if (requireRole && user?.profile?.user_type !== requireRole) {
      // Callback personnalisé si fourni
      if (onUnauthorized) {
        onUnauthorized();
      }

      // Redirection vers page non autorisée
      router.replace('/unauthorized');
      setIsAuthorized(false);
      return;
    }

    // L'utilisateur est autorisé
    setIsAuthorized(true);
  }, [
    isAuthenticated,
    user,
    pathname,
    requireAuth,
    requireRole,
    redirectTo,
    router,
    onUnauthorized,
  ]);

  return {
    isAuthorized,
    isChecking,
    isAuthenticated,
    user,
    userRole: user?.profile?.user_type || null,
  };
}

/**
 * Hook pour les routes publiques qui redirigent si l'utilisateur est déjà connecté
 *
 * @example
 * // Dans la page de login
 * usePublicRoute({ redirectTo: '/(tabs)' });
 */
export function usePublicRoute(options: { redirectTo?: string } = {}) {
  const { redirectTo = '/(tabs)' } = options;
  const { isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Si l'utilisateur est déjà connecté, on le redirige
    if (isAuthenticated) {
      router.replace(redirectTo as any);
    }
  }, [isAuthenticated, redirectTo, router]);

  return {
    isAuthenticated,
  };
}
