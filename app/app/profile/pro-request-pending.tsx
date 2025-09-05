import React from 'react';
import { View, ScrollView, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from '@/components/atoms';
import { Colors, Spacing, Typography, BorderRadius, Elevation } from '@/constants/theme';
import { ProRequestStatus, formatRequestDate, getDaysSinceRequest, getEstimatedDelay } from '@/services/pro-request-status.service';

interface ProRequestPendingScreenProps {
  request: ProRequestStatus;
  onContactSupport: () => void;
  onBackToProfile: () => void;
}

export default function ProRequestPendingScreen({ 
  request, 
  onContactSupport, 
  onBackToProfile 
}: ProRequestPendingScreenProps) {
  const daysSinceRequest = getDaysSinceRequest(request.created_at);
  const estimatedDelay = getEstimatedDelay(daysSinceRequest);

  const handleContactSupport = () => {
    Alert.alert(
      "Contacter le support",
      "Voulez-vous contacter notre équipe support concernant votre demande ?",
      [
        { text: "Annuler", style: "cancel" },
        { text: "Oui", onPress: onContactSupport }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header avec gradient */}
      <LinearGradient
        colors={[Colors.primary.electric, Colors.primary.navy]}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity 
            onPress={onBackToProfile}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color={Colors.neutral.white} />
          </TouchableOpacity>
          <Text variant="h3" color="white" weight="semiBold">
            Demande en cours
          </Text>
        </View>
        
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
              {formatRequestDate(request.created_at)}
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
        
        <TouchableOpacity onPress={onBackToProfile} style={styles.secondaryButton}>
          <Ionicons name="person-outline" size={20} color={Colors.neutral.charcoal} />
          <Text variant="body" color="charcoal" weight="semiBold" style={styles.buttonText}>
            Retour au profil
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
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
});