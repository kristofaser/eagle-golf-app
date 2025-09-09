import React, { useState, useEffect } from 'react';
import { View, ScrollView, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import { Text, LoadingScreen, ErrorScreen } from '@/components/atoms';
import { Colors, Spacing, Typography, BorderRadius, Elevation } from '@/constants/theme';
import { useAuth } from '@/hooks/useAuth';
import { profileService } from '@/services/profile.service';

export default function ProRequestPendingScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [requestData, setRequestData] = useState<{
    status: 'none' | 'pending' | 'approved' | 'rejected';
    request_id?: string;
    admin_notes?: string;
    created_at?: string;
    validated_at?: string;
  } | null>(null);

  useEffect(() => {
    loadRequestStatus();
  }, []);

  const loadRequestStatus = async () => {
    if (!user?.id) return;
    
    try {
      setLoading(true);
      const result = await profileService.getProRequestStatus(user.id);
      
      if (result.error) {
        setError(result.error);
        return;
      }

      if (result.data.status === 'none') {
        // Pas de demande, rediriger vers become-pro
        router.replace('/become-pro');
        return;
      }

      setRequestData(result.data);
    } catch (err) {
      console.error('Erreur chargement statut demande:', err);
      setError('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const handleContactSupport = () => {
    Alert.alert(
      "Contacter le support",
      "Fonctionnalité à venir. En attendant, vous pouvez nous contacter par email.",
      [{ text: "OK", style: "default" }]
    );
  };

  const handleBackToProfile = () => {
    router.push('/(tabs)/profile');
  };

  if (loading) {
    return <LoadingScreen message="Chargement du statut..." />;
  }

  if (error) {
    return (
      <ErrorScreen 
        error={error}
        onRetry={loadRequestStatus}
      />
    );
  }

  if (!requestData || requestData.status === 'none') {
    return (
      <ErrorScreen 
        error="Aucune demande trouvée"
        message="Vous pouvez créer une nouvelle demande pour devenir professionnel."
        onRetry={() => router.replace('/become-pro')}
      />
    );
  }

  // Calculer les jours depuis la demande
  const daysSinceRequest = requestData.created_at 
    ? Math.floor((Date.now() - new Date(requestData.created_at).getTime()) / (1000 * 60 * 60 * 24))
    : 0;
    
  const estimatedDelay = daysSinceRequest < 2 
    ? "Nous examinons généralement les demandes sous 24-48h. Votre dossier est en cours de traitement."
    : "Votre demande prend un peu plus de temps que prévu. Notre équipe examine minutieusement votre dossier.";

  const formatRequestDate = (dateString?: string) => {
    if (!dateString) return 'Date inconnue';
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Demande en Cours',
          headerStyle: {
            backgroundColor: Colors.primary.electric,
          },
          headerTitleStyle: {
            color: Colors.neutral.white,
            fontWeight: '600',
          },
          headerLeft: () => (
            <TouchableOpacity onPress={handleBackToProfile} style={styles.headerButton}>
              <Ionicons name="arrow-back" size={24} color={Colors.neutral.white} />
            </TouchableOpacity>
          ),
        }}
      />
      
      <SafeAreaView style={styles.container} edges={['bottom']}>
        {/* Header avec gradient */}
        <LinearGradient
          colors={[Colors.primary.electric, Colors.primary.navy]}
          style={styles.header}
        >
          <View style={styles.statusCard}>
            <View style={styles.statusHeader}>
              <Ionicons name="time-outline" size={24} color={Colors.neutral.white} />
              <Text variant="h4" color="white" weight="medium" style={styles.statusTitle}>
                En cours d'examen
              </Text>
            </View>
            <Text variant="body" color="white" style={styles.statusDescription}>
              Votre demande pour devenir professionnel est en cours d'examen par nos équipes.
            </Text>
          </View>
        </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Statut de la demande */}
        <View style={[styles.card, styles.pendingCard]}>
          <View style={styles.cardHeader}>
            <View style={styles.statusDot} />
            <Text variant="h4" color="charcoal" weight="semiBold">
              Demande soumise
            </Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text variant="body" color="iron">Date de soumission :</Text>
            <Text variant="body" color="charcoal" weight="medium">
              {formatRequestDate(requestData.created_at)}
            </Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text variant="body" color="iron">Il y a :</Text>
            <Text variant="body" color="charcoal" weight="medium">
              {daysSinceRequest} jour{daysSinceRequest > 1 ? 's' : ''}
            </Text>
          </View>
        </View>

        {/* Informations sur les délais */}
        <View style={[styles.card, styles.infoCard]}>
          <View style={styles.cardHeader}>
            <Ionicons name="information-circle" size={24} color={Colors.primary.electric} />
            <Text variant="h4" color="charcoal" weight="semiBold" style={styles.cardTitle}>
              Délais de traitement
            </Text>
          </View>
          
          <Text variant="body" color="iron" style={styles.delayText}>
            {estimatedDelay}
          </Text>
          
          <Text variant="caption" color="course">
            Nous examinons votre dossier avec attention pour garantir la qualité de notre plateforme.
          </Text>
        </View>


      </ScrollView>

      {/* Actions en bas */}
      <View style={styles.actions}>
        <TouchableOpacity onPress={handleContactSupport} style={styles.primaryButton}>
          <Ionicons name="chatbubble-outline" size={20} color={Colors.neutral.white} />
          <Text variant="body" color="white" weight="semiBold" style={styles.buttonText}>
            Contacter le support
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity onPress={handleBackToProfile} style={styles.secondaryButton}>
          <Ionicons name="person-outline" size={20} color={Colors.neutral.charcoal} />
          <Text variant="body" color="charcoal" weight="semiBold" style={styles.buttonText}>
            Retour au profil
          </Text>
        </TouchableOpacity>
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
  header: {
    paddingTop: Spacing.l,
    paddingBottom: Spacing.l,
    paddingHorizontal: Spacing.l,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.m,
  },
  backButton: {
    marginRight: Spacing.m,
    padding: Spacing.xs,
    borderRadius: BorderRadius.round,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  statusCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: BorderRadius.large,
    padding: Spacing.m,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  statusTitle: {
    marginLeft: Spacing.s,
  },
  statusDescription: {
    opacity: 0.9,
  },
  content: {
    flex: 1,
  },
  card: {
    marginHorizontal: Spacing.m,
    marginTop: Spacing.m,
    padding: Spacing.m,
    backgroundColor: Colors.neutral.white,
    borderRadius: BorderRadius.large,
    ...Elevation.small,
  },
  pendingCard: {
    backgroundColor: Colors.semantic.warningLight,
    borderWidth: 1,
    borderColor: Colors.semantic.warning,
  },
  infoCard: {
    backgroundColor: Colors.primary.lightBlue,
    borderWidth: 1,
    borderColor: Colors.primary.electric,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.s,
  },
  cardTitle: {
    marginLeft: Spacing.s,
  },
  statusDot: {
    width: 12,
    height: 12,
    backgroundColor: Colors.semantic.warning,
    borderRadius: 6,
    marginRight: Spacing.s,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.xs,
  },
  delayText: {
    lineHeight: 22,
    marginBottom: Spacing.xs,
  },
  actions: {
    padding: Spacing.l,
    backgroundColor: Colors.neutral.cloud,
    borderTopWidth: 1,
    borderTopColor: Colors.neutral.mist,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary.electric,
    paddingVertical: Spacing.m,
    paddingHorizontal: Spacing.l,
    borderRadius: BorderRadius.large,
    marginBottom: Spacing.s,
    ...Elevation.small,
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.neutral.mist,
    paddingVertical: Spacing.m,
    paddingHorizontal: Spacing.l,
    borderRadius: BorderRadius.large,
  },
  buttonText: {
    marginLeft: Spacing.xs,
  },
  headerButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
});