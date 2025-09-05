import React from 'react';
import { View, ScrollView, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from '@/components/atoms';
import { Colors, Spacing, BorderRadius, Elevation } from '@/constants/theme';
import {
  ProRequestStatus,
  formatRequestDate,
  getDaysSinceRequest,
} from '@/services/pro-request-status.service';

interface ProRequestRejectedScreenProps {
  request: ProRequestStatus;
  onNewRequest: () => void;
  onContactSupport: () => void;
  onBackToProfile: () => void;
}

export default function ProRequestRejectedScreen({
  request,
  onNewRequest,
  onContactSupport,
  onBackToProfile,
}: ProRequestRejectedScreenProps) {
  // Peut être utilisé dans le futur pour afficher la durée depuis la validation
  // const daysSinceValidation = getDaysSinceRequest(request.validated_at || request.created_at);

  const handleNewRequest = () => {
    Alert.alert(
      'Nouvelle demande',
      "Voulez-vous soumettre une nouvelle demande professionnelle ? Assurez-vous d'avoir corrigé les points mentionnés dans les remarques.",
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Nouvelle demande', onPress: onNewRequest },
      ]
    );
  };

  const handleContactSupport = () => {
    Alert.alert(
      'Contacter le support',
      "Voulez-vous contacter notre équipe support pour plus d'informations sur le refus ?",
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Oui', onPress: onContactSupport },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header avec gradient rouge */}
      <LinearGradient colors={[Colors.semantic.error, '#dc2626']} style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={onBackToProfile} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={Colors.neutral.white} />
          </TouchableOpacity>
          <Text variant="h3" color="white" weight="semiBold">
            Demande non validée
          </Text>
        </View>

        <View style={styles.statusCard}>
          <View style={styles.statusHeader}>
            <Ionicons name="close-circle-outline" size={24} color={Colors.neutral.white} />
            <Text variant="h4" color="white" weight="medium" style={styles.statusTitle}>
              Demande refusée
            </Text>
          </View>
          <Text variant="body" color="white" style={styles.statusDescription}>
            Votre demande pour devenir professionnel n'a pas pu être validée.
          </Text>
        </View>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Statut de la demande */}
        <View style={[styles.card, styles.rejectedCard]}>
          <View style={styles.cardHeader}>
            <View style={styles.rejectedDot} />
            <Text variant="h4" color="charcoal" weight="semiBold">
              Demande non validée
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text variant="body" color="iron">
              Date de soumission :
            </Text>
            <Text variant="body" color="charcoal" weight="medium">
              {formatRequestDate(request.created_at)}
            </Text>
          </View>

          {request.validated_at && (
            <View style={styles.infoRow}>
              <Text variant="body" color="iron">
                Date de refus :
              </Text>
              <Text variant="body" color="charcoal" weight="medium">
                {formatRequestDate(request.validated_at)}
              </Text>
            </View>
          )}
        </View>

        {/* Remarques de l'administrateur */}
        {request.admin_notes && (
          <View style={[styles.card, styles.notesCard]}>
            <View style={styles.cardHeader}>
              <Ionicons name="document-text" size={24} color="#d97706" />
              <Text variant="h4" color="charcoal" weight="semiBold" style={styles.cardTitle}>
                Remarques administratives
              </Text>
            </View>

            <Text variant="body" color="iron" style={styles.notesText}>
              {request.admin_notes}
            </Text>
          </View>
        )}

        {/* Points à vérifier */}
        <View style={[styles.card, styles.checklistCard]}>
          <View style={styles.cardHeader}>
            <Ionicons name="checklist" size={24} color={Colors.primary.electric} />
            <Text variant="h4" color="charcoal" weight="semiBold" style={styles.cardTitle}>
              Points à vérifier
            </Text>
          </View>

          <Text variant="body" color="iron" style={styles.checklistText}>
            Voici les points généralement vérifiés lors d'une nouvelle demande :
          </Text>

          <View style={styles.checklistItems}>
            <View style={styles.checklistItem}>
              <Ionicons name="checkmark-circle-outline" size={16} color={Colors.primary.electric} />
              <Text variant="caption" color="course" style={styles.checklistItemText}>
                Pièces d'identité lisibles et valides
              </Text>
            </View>

            <View style={styles.checklistItem}>
              <Ionicons name="checkmark-circle-outline" size={16} color={Colors.primary.electric} />
              <Text variant="caption" color="course" style={styles.checklistItemText}>
                Numéro SIRET valide et actif
              </Text>
            </View>

            <View style={styles.checklistItem}>
              <Ionicons name="checkmark-circle-outline" size={16} color={Colors.primary.electric} />
              <Text variant="caption" color="course" style={styles.checklistItemText}>
                Statut d'entreprise adapté à l'activité
              </Text>
            </View>

            <View style={styles.checklistItem}>
              <Ionicons name="checkmark-circle-outline" size={16} color={Colors.primary.electric} />
              <Text variant="caption" color="course" style={styles.checklistItemText}>
                Numéro de téléphone correct
              </Text>
            </View>
          </View>
        </View>

        {/* Encouragement */}
        <View style={[styles.card, styles.encouragementCard]}>
          <View style={styles.cardHeader}>
            <Ionicons name="refresh" size={24} color={Colors.semantic.success} />
            <Text variant="h4" color="charcoal" weight="semiBold" style={styles.cardTitle}>
              Nouvelle tentative
            </Text>
          </View>

          <Text variant="body" color="iron" style={styles.encouragementText}>
            Vous pouvez soumettre une nouvelle demande après avoir corrigé les points mentionnés
            ci-dessus.
          </Text>

          <View style={styles.checklistItem}>
            <Ionicons name="checkmark" size={16} color={Colors.semantic.success} />
            <Text variant="caption" color="course" style={styles.checklistItemText}>
              Aucune limite sur le nombre de demandes
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Actions en bas */}
      <View style={styles.actions}>
        <TouchableOpacity onPress={handleNewRequest} style={styles.primaryButton}>
          <Ionicons name="add-circle-outline" size={20} color={Colors.neutral.white} />
          <Text variant="body" color="white" weight="semiBold" style={styles.buttonText}>
            Nouvelle demande
          </Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={handleContactSupport} style={styles.supportButton}>
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
  rejectedCard: {
    backgroundColor: Colors.semantic.errorLight || '#fef2f2',
    borderWidth: 1,
    borderColor: Colors.semantic.error,
  },
  notesCard: {
    backgroundColor: '#fffbeb', // amber-50
    borderWidth: 1,
    borderColor: '#f59e0b', // amber-500
  },
  checklistCard: {
    backgroundColor: Colors.primary.lightBlue,
    borderWidth: 1,
    borderColor: Colors.primary.electric,
  },
  encouragementCard: {
    backgroundColor: Colors.semantic.successLight,
    borderWidth: 1,
    borderColor: Colors.semantic.success,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.s,
  },
  cardTitle: {
    marginLeft: Spacing.s,
  },
  rejectedDot: {
    width: 12,
    height: 12,
    backgroundColor: Colors.semantic.error,
    borderRadius: 6,
    marginRight: Spacing.s,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.xs,
  },
  notesText: {
    lineHeight: 22,
  },
  checklistText: {
    lineHeight: 22,
    marginBottom: Spacing.s,
  },
  checklistItems: {
    gap: Spacing.xs,
  },
  checklistItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checklistItemText: {
    marginLeft: Spacing.xs,
    lineHeight: 18,
  },
  encouragementText: {
    lineHeight: 22,
    marginBottom: Spacing.s,
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
  supportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ea580c', // orange-600
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
