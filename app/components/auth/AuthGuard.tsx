/**
 * AuthGuard - Composant de protection des routes
 * Vérifie l'authentification et redirige si nécessaire
 */
import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { useSession } from '@/contexts/AppProviders';
import { Colors } from '@/constants/theme';
import { Text } from '@/components/atoms';

interface AuthGuardProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  requirePro?: boolean;
  requireAdmin?: boolean;
  fallbackPath?: string;
}

export function AuthGuard({
  children,
  requireAuth = true,
  requirePro = false,
  requireAdmin = false,
  fallbackPath = '/(auth)/login',
}: AuthGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const session = useSession();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (loading) return;

    // Vérification d'authentification
    if (requireAuth && !session) {
      // Sauvegarder la route actuelle pour redirection après login
      router.replace(`${fallbackPath}?returnTo=${encodeURIComponent(pathname)}`);
      return;
    }

    // Vérification pro
    if (requirePro && user?.profile?.user_type !== 'pro') {
      router.replace('/become-pro');
      return;
    }

    // Vérification admin (à implémenter)
    if (requireAdmin && !user?.profile?.is_admin) {
      router.replace('/');
      return;
    }
  }, [
    session,
    user,
    loading,
    requireAuth,
    requirePro,
    requireAdmin,
    router,
    pathname,
    fallbackPath,
  ]);

  // Afficher un loader pendant la vérification
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary.accent} />
        <Text variant="body" color="gray" style={styles.loadingText}>
          Vérification...
        </Text>
      </View>
    );
  }

  // Si toutes les vérifications passent, afficher le contenu
  return <>{children}</>;
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.neutral.ball,
  },
  loadingText: {
    marginTop: 10,
  },
});
