import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, Elevation } from '@/constants/theme';
import { Text, Avatar } from '@/components/atoms';
import { BookingWithDetails, bookingService } from '@/services/booking.service';

interface CancelBookingBottomSheetProps {
  visible: boolean;
  booking: BookingWithDetails | null;
  userType: 'amateur' | 'pro';
  onClose: () => void;
  onConfirmCancel: (bookingId: string) => Promise<void>;
}

export function CancelBookingBottomSheet({
  visible,
  booking,
  userType,
  onClose,
  onConfirmCancel,
}: CancelBookingBottomSheetProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [, setError] = useState<string | null>(null);
  const [isConfirmed, setIsConfirmed] = useState(false);

  const translateY = useSharedValue(600);
  const backdropOpacity = useSharedValue(0);

  React.useEffect(() => {
    if (visible) {
      backdropOpacity.value = withTiming(0.5, { duration: 300 });
      translateY.value = withSpring(0, {
        damping: 20,
        stiffness: 100,
      });
    } else {
      backdropOpacity.value = withTiming(0, { duration: 200 });
      translateY.value = withTiming(600, { duration: 200 });
    }
  }, [visible, backdropOpacity, translateY]);

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  const bottomSheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const handleClose = () => {
    setShowSuccess(false);
    setError(null);
    setIsConfirmed(false);
    onClose();
  };

  const handleConfirmCancel = async () => {
    if (!booking) return;

    try {
      setIsLoading(true);
      setError(null);
      await onConfirmCancel(booking.id);
      setShowSuccess(true);

      // Fermer après 2 secondes
      setTimeout(() => {
        handleClose();
      }, 2000);
    } catch (error: unknown) {
      console.error('Erreur annulation:', error);
      const errorMessage =
        error instanceof Error ? error.message : "Une erreur est survenue lors de l'annulation";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  if (!booking) return null;

  const otherUser = userType === 'amateur' ? booking.pro_profile?.profile : booking.amateur_profile;

  const otherUserName = otherUser
    ? `${otherUser.first_name} ${otherUser.last_name}`
    : userType === 'amateur'
      ? 'Pro'
      : 'Amateur';

  // Calculer les informations de remboursement
  const refundInfo = booking
    ? bookingService.calculateRefundInfo(
        booking.booking_date,
        booking.start_time,
        booking.total_amount
      )
    : null;

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={handleClose}>
      <TouchableWithoutFeedback onPress={handleClose}>
        <Animated.View style={[styles.backdrop, backdropStyle]} />
      </TouchableWithoutFeedback>

      <Animated.View style={[styles.bottomSheet, bottomSheetStyle]}>
        {/* Handle */}
        <View style={styles.handle} />

        {/* Header */}
        <View style={styles.header}>
          <Text variant="h3" color="charcoal" weight="semiBold">
            Annuler la réservation
          </Text>
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={Colors.neutral.charcoal} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {showSuccess ? (
            // État de succès
            <View style={styles.successContainer}>
              <View style={styles.successIcon}>
                <Ionicons name="checkmark" size={32} color={Colors.neutral.white} />
              </View>
              <Text variant="h3" color="charcoal" weight="semiBold" style={styles.successTitle}>
                Réservation annulée
              </Text>
              <Text variant="body" color="iron" style={styles.successText}>
                Votre réservation a été annulée avec succès
              </Text>
            </View>
          ) : (
            <>
              {/* Informations de la réservation */}
              <View style={styles.bookingInfo}>
                <View style={styles.bookingHeader}>
                  <Avatar imageUrl={otherUser?.avatar_url} name={otherUserName} size="medium" />
                  <View style={styles.bookingDetails}>
                    <Text variant="body" color="charcoal" weight="semiBold">
                      {otherUserName}
                    </Text>
                    <Text variant="caption" color="iron">
                      {booking.golf_parcours?.name || 'Golf Course'}
                    </Text>
                    <Text variant="caption" color="iron">
                      {new Date(booking.booking_date).toLocaleDateString('fr-FR', {
                        weekday: 'long',
                        day: '2-digit',
                        month: 'long',
                      })}{' '}
                      à {booking.start_time.slice(0, 5)}
                    </Text>
                  </View>
                  <View style={styles.statusBadge}>
                    <Text variant="caption" color="white" weight="medium">
                      {booking.status === 'confirmed' ? 'Confirmé' : 'En attente'}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Informations de remboursement */}
              <View style={styles.refundContainer}>
                {refundInfo && (
                  <View style={styles.refundStatusRow}>
                    <Text variant="body" color="charcoal" weight="medium">
                      {refundInfo.refundMessage} (
                      {refundInfo.refundAmount > 0
                        ? `${(refundInfo.refundAmount / 100).toFixed(0)}€`
                        : '0€'}
                      )
                    </Text>
                  </View>
                )}
              </View>

              {/* Conditions de remboursement */}
              <View style={styles.conditionsContainer}>
                <View style={styles.conditionsHeader}>
                  <Ionicons
                    name="information-circle-outline"
                    size={20}
                    color={Colors.neutral.charcoal}
                  />
                  <Text variant="body" color="charcoal" weight="semiBold">
                    Conditions de remboursement
                  </Text>
                </View>

                <View style={styles.conditionsList}>
                  <View style={styles.conditionItem}>
                    <Text variant="caption" color="iron">
                      • 48h+ avant : Remboursement intégral
                    </Text>
                  </View>
                  <View style={styles.conditionItem}>
                    <Text variant="caption" color="iron">
                      • 24-48h avant : Remboursement partiel (50%)
                    </Text>
                  </View>
                  <View style={styles.conditionItem}>
                    <Text variant="caption" color="iron">
                      • Moins de 24h : Aucun remboursement
                    </Text>
                  </View>
                </View>
              </View>

              {/* Confirmation avec toggle */}
              <TouchableOpacity
                style={styles.confirmationContainer}
                onPress={() => setIsConfirmed(!isConfirmed)}
                activeOpacity={0.7}
              >
                <View style={[styles.checkbox, isConfirmed && styles.checkboxChecked]}>
                  {isConfirmed && (
                    <Ionicons name="checkmark" size={16} color={Colors.neutral.white} />
                  )}
                </View>
                <Text variant="caption" color="iron" style={styles.confirmationText}>
                  Cette action est irréversible.
                </Text>
              </TouchableOpacity>
            </>
          )}
        </ScrollView>

        {!showSuccess && (
          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.primaryButton, (isLoading || !isConfirmed) && styles.buttonDisabled]}
              onPress={() => void handleConfirmCancel()}
              disabled={isLoading || !isConfirmed}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color={Colors.neutral.white} />
              ) : (
                <Text variant="body" color="white" weight="medium">
                  Confirmer l'annulation
                </Text>
              )}
            </TouchableOpacity>
          </View>
        )}
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: Colors.neutral.black,
  },
  bottomSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.neutral.white,
    borderTopLeftRadius: BorderRadius.large,
    borderTopRightRadius: BorderRadius.large,
    maxHeight: '90%',
    ...Elevation.large,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: Colors.neutral.mist,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: Spacing.s,
    marginBottom: Spacing.m,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.l,
    paddingBottom: Spacing.m,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral.mist,
  },
  closeButton: {
    padding: Spacing.xs,
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.l,
  },
  bookingInfo: {
    marginVertical: Spacing.l,
  },
  bookingHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.m,
  },
  bookingDetails: {
    flex: 1,
    gap: Spacing.xs,
  },
  statusBadge: {
    backgroundColor: Colors.semantic.success.default,
    paddingHorizontal: Spacing.xs,
    paddingVertical: 4,
    borderRadius: BorderRadius.small,
  },
  warningContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.s,
    backgroundColor: Colors.semantic.warning.light,
    padding: Spacing.m,
    borderRadius: BorderRadius.medium,
    marginBottom: Spacing.l,
  },
  infoContainer: {
    backgroundColor: Colors.semantic.success.light,
  },
  partialContainer: {
    backgroundColor: Colors.semantic.warning.light,
  },
  warningIcon: {
    marginTop: 2,
  },
  warningText: {
    flex: 1,
    lineHeight: 18,
  },
  refundContainer: {
    backgroundColor: Colors.neutral.cloud,
    borderRadius: BorderRadius.medium,
    padding: Spacing.m,
    marginBottom: Spacing.m,
  },
  refundHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.s,
  },
  refundStatusRow: {
    alignItems: 'center',
  },
  conditionsContainer: {
    backgroundColor: Colors.neutral.white,
    borderRadius: BorderRadius.medium,
    padding: Spacing.m,
    marginBottom: Spacing.l,
    borderWidth: 1,
    borderColor: Colors.neutral.mist,
  },
  conditionsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.s,
  },
  conditionsList: {
    gap: Spacing.xs,
  },
  conditionItem: {
    paddingLeft: Spacing.xs,
  },
  confirmationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.s,
    padding: Spacing.m,
    marginBottom: Spacing.l,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: Colors.neutral.mist,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.neutral.white,
  },
  checkboxChecked: {
    backgroundColor: Colors.primary.accent,
    borderColor: Colors.primary.accent,
  },
  confirmationText: {
    flex: 1,
    lineHeight: 18,
  },
  footer: {
    padding: Spacing.l,
    paddingTop: Spacing.m,
    borderTopWidth: 1,
    borderTopColor: Colors.neutral.mist,
  },
  primaryButton: {
    paddingVertical: Spacing.m,
    backgroundColor: Colors.semantic.error.default,
    borderRadius: BorderRadius.medium,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  successContainer: {
    alignItems: 'center',
    paddingVertical: Spacing.xxl,
  },
  successIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.semantic.success.default,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.l,
  },
  successTitle: {
    marginBottom: Spacing.s,
  },
  successText: {
    textAlign: 'center',
  },
});
