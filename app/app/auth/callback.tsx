import React, { useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text, Logo } from '@/components/atoms';
import { Colors, Spacing } from '@/constants/theme';
import { supabase } from '@/utils/supabase/client';

export default function AuthCallbackScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  useEffect(() => {
    handleAuthCallback();
  }, []);

  const handleAuthCallback = async () => {
    try {
      // Récupérer la session depuis l'URL (pour OAuth)
      const { data, error } = await supabase.auth.getSession();

      if (error) {
        console.error('Erreur callback auth:', error);
        router.replace('/login');
        return;
      }

      if (data.session) {
        // L'utilisateur est connecté avec succès
        const returnTo = params.returnTo as string;

        if (returnTo && typeof returnTo === 'string') {
          // Rediriger vers la page demandée
          router.replace(returnTo as any);
        } else {
          // Rediriger vers l'accueil
          router.replace('/(tabs)');
        }
      } else {
        // Pas de session, retour au login
        router.replace('/login');
      }
    } catch (error) {
      console.error('Erreur dans le callback:', error);
      router.replace('/login');
    }
  };

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <Logo size={80} variant="primary" />
          <ActivityIndicator size="large" color={Colors.primary.accent} style={styles.loader} />
          <Text variant="h3" color="charcoal" style={styles.title}>
            Connexion en cours...
          </Text>
          <Text variant="body" color="course" style={styles.subtitle}>
            Veuillez patienter pendant que nous finalisons votre connexion
          </Text>
        </View>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.neutral.background,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
  },
  loader: {
    marginTop: Spacing.xl,
    marginBottom: Spacing.xl,
  },
  title: {
    marginBottom: Spacing.s,
    textAlign: 'center',
  },
  subtitle: {
    textAlign: 'center',
  },
});
