import React, { useEffect, useState } from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Text, LoadingScreen } from '@/components/atoms';
import { useUser } from '@/hooks/useUser';
import { useUserContext } from '@/contexts/UserContext';
import { Colors, Spacing, BorderRadius } from '@/constants/theme';
import { checkUserProRequestStatus, UserProRequestResult } from '@/services/pro-request-status.service';
import { useProRequestRealtime } from '@/hooks/useProRequestRealtime';
import BecomeProScreen from '../become-pro';
import ProRequestPendingScreen from './pro-request-pending';
import ProRequestRejectedScreen from './pro-request-rejected';
import ProRequestApprovedScreen from './pro-request-approved';

export default function ProStatusScreen() {
  const { user, isLoading: userLoading } = useUser();
  const { loadUserProfile } = useUserContext();
  const router = useRouter();
  const [statusResult, setStatusResult] = useState<UserProRequestResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // 🔄 Realtime : Écoute automatique des changements de statut pro
  // Se connecte seulement si l'utilisateur existe et n'est pas déjà pro
  const shouldListenRealtime = user?.id && user.profile?.user_type !== 'pro';
  const realtimeHook = useProRequestRealtime(shouldListenRealtime ? user.id : null, {
    showInAppNotifications: true,
    debug: __DEV__,
    onStatusChange: async (newStatus, oldStatus) => {
      // Rafraîchir l'affichage quand le statut change
      console.log('🔄 Realtime callback: Statut changé de', oldStatus, 'vers', newStatus);
      await refreshStatus();
    }
  });

  // Fonction pour rafraîchir le statut (appelée par le realtime)
  const refreshStatus = React.useCallback(async () => {
    if (!user?.id) return;
    
    try {
      console.log('🔄 Rafraîchissement du statut pro request...');
      const result = await checkUserProRequestStatus(user.id);
      setStatusResult(result);
      console.log('✅ Statut rafraîchi:', result.status);
    } catch (err) {
      console.error('❌ Erreur rafraîchissement statut:', err);
    }
  }, [user?.id]);

  useEffect(() => {
    const checkStatus = async () => {
      try {
        if (!user?.id) {
          console.log('❌ Pas d\'utilisateur connecté');
          router.replace('/(auth)/login');
          return;
        }

        // Si l'utilisateur est déjà pro, rediriger vers le profil principal
        if (user.user_type === 'pro') {
          console.log('✅ Utilisateur déjà professionnel, redirection vers profil');
          router.replace('/profile');
          return;
        }

        console.log('🔍 Vérification du statut pour utilisateur amateur:', user.id);
        const result = await checkUserProRequestStatus(user.id);
        
        console.log('📊 Résultat du statut:', result);
        setStatusResult(result);
        
      } catch (err) {
        console.error('❌ Erreur lors de la vérification du statut:', err);
        setError('Erreur lors du chargement du statut de votre demande');
      } finally {
        setIsLoading(false);
      }
    };

    if (!userLoading && user) {
      checkStatus();
    }
  }, [user, userLoading, router]);

  // Écran de chargement pendant la vérification
  if (userLoading || isLoading) {
    return <LoadingScreen message="Vérification de votre statut..." />;
  }

  // Erreur de chargement
  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text variant="body" color="charcoal" style={styles.errorText}>
          {error}
        </Text>
        <TouchableOpacity
          onPress={() => {
            setError(null);
            setIsLoading(true);
            // Relancer la vérification
          }}
          style={styles.retryButton}
        >
          <Text variant="body" color="white" weight="medium">
            Réessayer
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Pas d'utilisateur (ne devrait pas arriver)
  if (!user) {
    router.replace('/(auth)/login');
    return null;
  }

  // Utilisateur déjà pro (ne devrait pas arriver grâce à la vérification plus haut)
  if (user.user_type === 'pro') {
    router.replace('/profile');
    return null;
  }

  // Pas de résultat de statut (ne devrait pas arriver)
  if (!statusResult) {
    return <LoadingScreen message="Chargement..." />;
  }

  // Router selon le statut de la demande
  switch (statusResult.status) {
    case 'pending':
      console.log('📋 Affichage écran demande en attente');
      return (
        <ProRequestPendingScreen 
          request={statusResult.request!}
          onContactSupport={() => {
            // TODO: Implémenter contact support
            console.log('📞 Contact support demandé');
          }}
          onBackToProfile={() => router.back()}
        />
      );
      
    case 'rejected':
      console.log('❌ Affichage écran demande rejetée');
      return (
        <ProRequestRejectedScreen
          request={statusResult.request!}
          onNewRequest={() => {
            console.log('🆕 Nouvelle demande demandée');
            // Rediriger vers le formulaire de demande
            router.replace('/become-pro');
          }}
          onContactSupport={() => {
            // TODO: Implémenter contact support  
            console.log('📞 Contact support demandé');
          }}
          onBackToProfile={() => router.back()}
        />
      );
      
    case 'approved':
      console.log('✅ Affichage écran demande approuvée (cas rare)');
      return (
        <ProRequestApprovedScreen
          request={statusResult.request!}
          onRefreshProfile={async () => {
            console.log('🔄 Rafraîchissement profil demandé');
            // Recharger le profil utilisateur via le contexte
            if (user?.id) {
              await loadUserProfile(user.id);
            }
            // Rediriger vers le profil principal qui détectera le type pro
            router.replace('/profile');
          }}
          onBackToProfile={() => router.back()}
        />
      );
      
    case 'none':
    default:
      console.log('📝 Aucune demande - affichage formulaire become-pro');
      // Aucune demande ou statut inconnu = afficher le formulaire
      return <BecomeProScreen />;
  }
}

const styles = StyleSheet.create({
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.neutral.background,
    paddingHorizontal: Spacing.l,
  },
  errorText: {
    color: Colors.semantic.error,
    textAlign: 'center',
    marginBottom: Spacing.m,
  },
  retryButton: {
    backgroundColor: Colors.primary.accent,
    paddingHorizontal: Spacing.l,
    paddingVertical: Spacing.m,
    borderRadius: BorderRadius.medium,
  },
});