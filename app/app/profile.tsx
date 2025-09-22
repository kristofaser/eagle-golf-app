import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/theme';
import { useAuth } from '@/hooks/useAuth';
import { useUser } from '@/hooks/useUser';
import { LoadingScreen, ErrorScreen } from '@/components/atoms';
import { ProProfile } from '@/components/organisms/ProProfile';
import { AmateurProfile } from '@/components/organisms/AmateurProfile';
import { FullProfile } from '@/services/profile.service';

export default function ProfileScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const { isPro, profile, amateurProfile, proProfile, loading: userLoading } = useUser();

  // Récupérer le paramètre pour ouvrir une section spécifique
  const openSection = params.openSection as string;

  // Si non connecté, retourner à l'accueil
  if (!isAuthenticated) {
    return <LoadingScreen message="Redirection..." />;
  }

  // Gérer le chargement initial
  // Important: on vérifie les états de loading pour éviter le spinner infini
  if (authLoading || userLoading) {
    return <LoadingScreen message="Chargement du profil..." />;
  }

  // Si pas de profil après le chargement, c'est probablement un nouvel utilisateur
  // On affiche un message d'erreur avec option de retry
  if (!user || !profile) {
    return (
      <ErrorScreen
        error="Profil non trouvé"
        message="Votre profil est en cours de création. Si le problème persiste, essayez de recharger l'application."
        onRetry={() => {
          // Forcer un rechargement de la page/app
          router.replace('/(tabs)');
        }}
      />
    );
  }

  const handleRefresh = async () => {
    // Recharger les données du profil si nécessaire
    // Pour l'instant, les données sont déjà dans le context
  };

  // Construire le FullProfile à partir des données disponibles
  const fullProfile: FullProfile = {
    ...profile,
    amateur_profiles: amateurProfile,
    pro_profiles: proProfile,
    email: user.email,
  };

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: isPro ? 'Mon Profil Pro' : 'Mon Profil',
          headerStyle: {
            backgroundColor: Colors.neutral.background,
          },
          headerTitleStyle: {
            color: Colors.neutral.charcoal,
            fontWeight: '600',
          },
          headerLeft: () => (
            <TouchableOpacity
              onPress={() => {
                if (router.canGoBack()) {
                  router.back();
                } else {
                  router.replace('/(tabs)/');
                }
              }}
              style={styles.headerButton}
            >
              <Ionicons name="arrow-back" size={24} color={Colors.neutral.charcoal} />
            </TouchableOpacity>
          ),
          headerRight: () => (
            <TouchableOpacity
              onPress={() => router.push('/profile/settings')}
              style={styles.headerButton}
            >
              <Ionicons name="settings-outline" size={24} color={Colors.neutral.charcoal} />
            </TouchableOpacity>
          ),
        }}
      />

      <SafeAreaView style={styles.container} edges={['bottom']}>
        {isPro ? (
          <ProProfile profile={fullProfile} onRefresh={handleRefresh} openSection={openSection} />
        ) : (
          <AmateurProfile profile={fullProfile} onRefresh={handleRefresh} openSection={openSection} />
        )}
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.neutral.background,
  },
  headerButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
});
