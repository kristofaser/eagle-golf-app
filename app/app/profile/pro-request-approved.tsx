import React from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '@/components/atoms';
import { Colors, Spacing, Typography, BorderRadius, Elevation } from '@/constants/theme';
import { ProRequestStatus, formatRequestDate } from '@/services/pro-request-status.service';

interface ProRequestApprovedScreenProps {
  request: ProRequestStatus;
  onRefreshProfile: () => Promise<void>;
  onBackToProfile: () => void;
}

export default function ProRequestApprovedScreen({ 
  request, 
  onRefreshProfile, 
  onBackToProfile 
}: ProRequestApprovedScreenProps) {
  const [isRefreshing, setIsRefreshing] = React.useState(false);

  const handleRefreshProfile = async () => {
    setIsRefreshing(true);
    try {
      await onRefreshProfile();
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <Animated.View entering={FadeInUp} style={styles.header}>
          <TouchableOpacity onPress={onBackToProfile} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={Colors.neutral.white} />
          </TouchableOpacity>
          
          <View style={styles.headerContent}>
            <View style={styles.headerIcon}>
              <Ionicons name="checkmark-circle" size={48} color={Colors.neutral.white} />
            </View>
            <Text style={styles.headerTitle}>Demande approuvée</Text>
            <Text style={styles.headerSubtitle}>
              Félicitations ! Votre demande pour devenir professionnel a été approuvée
            </Text>
          </View>
        </Animated.View>

        <ScrollView
          style={styles.content}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.contentContainer}
        >
          {/* Section Félicitations */}
          <Animated.View entering={FadeInDown.delay(100)} style={styles.section}>
            <View style={[styles.card, styles.successCard]}>
              <View style={styles.cardHeader}>
                <View style={styles.cardIcon}>
                  <Ionicons name="trophy" size={24} color={Colors.semantic.success} />
                </View>
                <Text style={styles.cardTitle}>Demande validée</Text>
              </View>
              
              <Text style={styles.cardDescription}>
                Excellente nouvelle ! Votre demande pour rejoindre la communauté des professionnels Eagle a été approuvée par notre équipe.
              </Text>
              
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Date d'approbation</Text>
                <Text style={styles.infoValue}>
                  {formatRequestDate(request.validated_at || request.created_at)}
                </Text>
              </View>
            </View>
          </Animated.View>

          {/* Section Synchronisation */}
          <Animated.View entering={FadeInDown.delay(200)} style={styles.section}>
            <View style={[styles.card, styles.infoCard]}>
              <View style={styles.cardHeader}>
                <View style={styles.cardIcon}>
                  <Ionicons name="sync" size={24} color={Colors.primary.accent} />
                </View>
                <Text style={styles.cardTitle}>Synchronisation en cours</Text>
              </View>
              
              <Text style={styles.cardDescription}>
                Votre profil professionnel est en cours de finalisation. Cette opération peut prendre quelques instants.
              </Text>
              
              <View style={styles.statusRow}>
                <Ionicons name="hourglass-outline" size={16} color={Colors.primary.accent} />
                <Text style={styles.statusText}>Synchronisation automatique en cours...</Text>
              </View>
            </View>
          </Animated.View>

          {/* Section Prochaines étapes */}
          <Animated.View entering={FadeInDown.delay(300)} style={styles.section}>
            <View style={[styles.card, styles.warningCard]}>
              <View style={styles.cardHeader}>
                <View style={styles.cardIcon}>
                  <Ionicons name="list" size={24} color={Colors.semantic.warning} />
                </View>
                <Text style={styles.cardTitle}>Prochaines étapes</Text>
              </View>
              
              <Text style={styles.cardDescription}>
                Une fois votre profil professionnel activé, vous pourrez :
              </Text>
              
              <View style={styles.stepsList}>
                <View style={styles.stepItem}>
                  <Ionicons name="checkmark-circle" size={16} color={Colors.semantic.warning} />
                  <Text style={styles.stepText}>Configurer vos disponibilités</Text>
                </View>
                
                <View style={styles.stepItem}>
                  <Ionicons name="checkmark-circle" size={16} color={Colors.semantic.warning} />
                  <Text style={styles.stepText}>Définir vos tarifs personnalisés</Text>
                </View>
                
                <View style={styles.stepItem}>
                  <Ionicons name="checkmark-circle" size={16} color={Colors.semantic.warning} />
                  <Text style={styles.stepText}>Recevoir vos premières réservations</Text>
                </View>
              </View>
            </View>
          </Animated.View>

          {/* Section Bienvenue */}
          <Animated.View entering={FadeInDown.delay(400)} style={styles.section}>
            <View style={[styles.card, styles.welcomeCard]}>
              <View style={styles.cardHeader}>
                <View style={styles.cardIcon}>
                  <Ionicons name="hand-right" size={24} color={Colors.primary.accent} />
                </View>
                <Text style={styles.cardTitle}>Bienvenue chez Eagle Pro</Text>
              </View>
              
              <Text style={styles.cardDescription}>
                Vous rejoignez une communauté de professionnels passionnés. 
                Nous sommes ravis de vous compter parmi nous !
              </Text>
            </View>
          </Animated.View>
        </ScrollView>

        {/* Footer Actions */}
        <Animated.View entering={FadeInUp.delay(500)} style={styles.footer}>
          <TouchableOpacity
            style={[
              styles.footerButton,
              styles.primaryButton,
              isRefreshing && styles.disabledButton
            ]}
            onPress={handleRefreshProfile}
            disabled={isRefreshing}
          >
            {isRefreshing ? (
              <Ionicons name="hourglass" size={20} color={Colors.neutral.white} />
            ) : (
              <Ionicons name="refresh" size={20} color={Colors.neutral.white} />
            )}
            <Text style={styles.primaryButtonText}>
              {isRefreshing ? 'Synchronisation...' : 'Actualiser le profil'}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.footerButton, styles.secondaryButton]}
            onPress={onBackToProfile}
          >
            <Ionicons name="person-outline" size={20} color={Colors.neutral.charcoal} />
            <Text style={styles.secondaryButtonText}>Retour au profil</Text>
          </TouchableOpacity>
        </Animated.View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.neutral.background,
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    backgroundColor: Colors.semantic.success,
    paddingTop: Spacing.xl,
    paddingHorizontal: Spacing.l,
    paddingBottom: Spacing.xl,
  },
  backButton: {
    alignSelf: 'flex-start',
    padding: Spacing.s,
    marginBottom: Spacing.m,
  },
  headerContent: {
    alignItems: 'center',
  },
  headerIcon: {
    marginBottom: Spacing.m,
  },
  headerTitle: {
    fontSize: Typography.fontSize.h2,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.neutral.white,
    marginBottom: Spacing.s,
  },
  headerSubtitle: {
    fontSize: Typography.fontSize.body,
    color: Colors.neutral.white + 'E6', // 90% opacity
    textAlign: 'center',
    paddingHorizontal: Spacing.m,
    lineHeight: 22,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: Spacing.xl,
  },
  section: {
    paddingHorizontal: Spacing.l,
    marginTop: Spacing.l,
  },
  card: {
    backgroundColor: Colors.neutral.white,
    borderRadius: BorderRadius.medium,
    padding: Spacing.l,
    ...Elevation.small,
  },
  successCard: {
    borderLeftWidth: 4,
    borderLeftColor: Colors.semantic.success,
  },
  infoCard: {
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary.accent,
  },
  warningCard: {
    borderLeftWidth: 4,
    borderLeftColor: Colors.semantic.warning,
  },
  welcomeCard: {
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary.accent,
    backgroundColor: Colors.primary.accent + '08', // 3% opacity
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.m,
  },
  cardIcon: {
    marginRight: Spacing.m,
  },
  cardTitle: {
    fontSize: Typography.fontSize.h3,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.neutral.charcoal,
  },
  cardDescription: {
    fontSize: Typography.fontSize.body,
    color: Colors.neutral.iron,
    lineHeight: 22,
    marginBottom: Spacing.m,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Spacing.s,
    borderTopWidth: 1,
    borderTopColor: Colors.ui.inputBorder,
  },
  infoLabel: {
    fontSize: Typography.fontSize.body,
    color: Colors.neutral.iron,
  },
  infoValue: {
    fontSize: Typography.fontSize.body,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.neutral.charcoal,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusText: {
    fontSize: Typography.fontSize.caption,
    color: Colors.primary.accent,
    marginLeft: Spacing.s,
    fontStyle: 'italic',
  },
  stepsList: {
    gap: Spacing.s,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepText: {
    fontSize: Typography.fontSize.body,
    color: Colors.neutral.charcoal,
    marginLeft: Spacing.s,
    flex: 1,
  },
  footer: {
    backgroundColor: Colors.neutral.white,
    paddingHorizontal: Spacing.l,
    paddingVertical: Spacing.m,
    borderTopWidth: 1,
    borderTopColor: Colors.ui.inputBorder,
    ...Elevation.small,
    gap: Spacing.m,
  },
  footerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.m,
    paddingHorizontal: Spacing.l,
    borderRadius: BorderRadius.medium,
    gap: Spacing.s,
  },
  primaryButton: {
    backgroundColor: Colors.semantic.success,
  },
  secondaryButton: {
    backgroundColor: Colors.neutral.ball,
  },
  disabledButton: {
    backgroundColor: Colors.neutral.iron,
  },
  primaryButtonText: {
    fontSize: Typography.fontSize.body,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.neutral.white,
  },
  secondaryButtonText: {
    fontSize: Typography.fontSize.body,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.neutral.charcoal,
  },
});