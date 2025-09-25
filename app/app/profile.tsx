import React, { useEffect, useMemo } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/theme';
import { useAuth } from '@/hooks/useAuth';
import { useUser } from '@/hooks/useUser';
import { useNotificationCount } from '@/hooks/useNotificationCount';
import { LoadingScreen, ErrorScreen, Text } from '@/components/atoms';
import { ProProfile } from '@/components/organisms/ProProfile';
import { AmateurProfile } from '@/components/organisms/AmateurProfile';
import { FullProfile } from '@/services/profile.service';

export default function ProfileScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const { isPro, profile, amateurProfile, proProfile, loading: userLoading } = useUser();
  const { unreadCount } = useNotificationCount();

  // Récupérer le paramètre pour ouvrir une section spécifique
  const openSection = params.openSection as string;

  // Construire le FullProfile à partir des données disponibles
  // IMPORTANT: Ce hook doit être appelé avant tout return conditionnel
  const fullProfile: FullProfile = useMemo(() => {
    if (!profile) {
      // Retourner un profil par défaut si pas encore chargé
      return {
        id: '',
        created_at: '',
        updated_at: '',
        first_name: '',
        last_name: '',
        user_type: 'amateur',
        city: '',
        phone: null,
        avatar_url: null,
        amateur_profiles: null,
        pro_profiles: null,
        email: null,
      };
    }

    return {
      ...profile,
      amateur_profiles: amateurProfile || null,
      pro_profiles: proProfile || null,
      email: user?.email || null,
    };
  }, [profile, amateurProfile, proProfile, user?.email]);

  const handleRefresh = async () => {
    // Recharger les données du profil si nécessaire
    // Pour l'instant, les données sont déjà dans le context
  };

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

  // Vérifier que le profil a un ID valide
  if (!fullProfile.id) {
    return <LoadingScreen message="Initialisation du profil..." />;
  }

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
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <TouchableOpacity
                onPress={() => router.push('/notifications')}
                style={styles.headerButton}
              >
                <View>
                  <Ionicons
                    name="notifications-outline"
                    size={24}
                    color={Colors.neutral.charcoal}
                  />
                  {unreadCount > 0 && (
                    <View style={styles.badge}>
                      <Text variant="caption" color="white" style={styles.badgeText}>
                        {unreadCount > 99 ? '99+' : unreadCount}
                      </Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => router.push('/profile/settings')}
                style={styles.headerButton}
              >
                <Ionicons name="settings-outline" size={24} color={Colors.neutral.charcoal} />
              </TouchableOpacity>
            </View>
          ),
        }}
      />

      <SafeAreaView style={styles.container} edges={['bottom']}>
        {isPro ? (
          <ProProfile profile={fullProfile} onRefresh={handleRefresh} openSection={openSection} />
        ) : (
          <AmateurProfile
            profile={fullProfile}
            onRefresh={handleRefresh}
            openSection={openSection}
          />
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
  badge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: Colors.semantic.error.default,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: Colors.neutral.white,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
});
