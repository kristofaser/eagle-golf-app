import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/theme';
import { useStripe } from '@stripe/stripe-react-native';
import { paymentService } from '@/services/payment.service';
import { bookingService } from '@/services/booking.service';
import { supabase } from '@/utils/supabase/client';
import { useCommissionRate } from '@/contexts/CommissionContext';

interface PaymentStepProps {
  totalAmount: number;
  onPaymentSuccess: (bookingId: string) => void;
  onPaymentError: (error: string) => void;
  bookingData: {
    players: number;
    holes: number;
    date: Date | null;
    timeSlot: string | null;
    totalPrice: number;
  };
  proId: string;
  courseId: string;
  userId: string;
}

export const PaymentStep: React.FC<PaymentStepProps> = ({
  totalAmount,
  onPaymentSuccess,
  onPaymentError,
  bookingData,
  proId,
  courseId,
  userId,
}) => {
  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentReady, setPaymentReady] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [paymentIntentId, setPaymentIntentId] = useState<string | null>(null);

  // Commission dynamique depuis CommissionContext (temps réel automatique)
  const commissionRate = useCommissionRate();

  // Initialiser le paiement automatiquement au chargement
  useEffect(() => {
    initializePayment();
  }, []);

  const initializePayment = async () => {
    try {
      setIsProcessing(true);

      if (!bookingData.date || !bookingData.timeSlot) {
        throw new Error('Données de réservation incomplètes');
      }

      // Préparer les métadonnées pour le paiement
      const metadata = {
        pro_id: proId,
        amateur_id: userId,
        booking_date: bookingData.date.toISOString().split('T')[0],
        start_time: bookingData.timeSlot,
        description: `Cours de golf - ${bookingData.holes} trous avec ${bookingData.players} joueur(s)`,
      };

      // Créer le Payment Intent
      const response = await paymentService.createPaymentIntent({
        amount: Math.round(totalAmount * 100), // Convertir en centimes
        currency: 'eur',
        metadata,
      });

      if (response.error) {
        throw new Error(response.error);
      }

      // Initialiser le Payment Sheet Stripe
      const { error } = await initPaymentSheet({
        merchantDisplayName: 'Eagle Golf',
        paymentIntentClientSecret: response.client_secret,
        defaultBillingDetails: {
          name: 'Client Eagle Golf',
        },
        appearance: {
          colors: {
            primary: Colors.primary.navy,
            background: Colors.neutral.white,
            componentBackground: Colors.neutral.snow,
          },
        },
      });

      if (error) {
        throw error;
      }

      setClientSecret(response.client_secret);
      setPaymentIntentId(response.payment_intent_id);
      setPaymentReady(true);
      setIsProcessing(false);
    } catch (error: any) {
      setIsProcessing(false);
      onPaymentError(error.message || "Erreur d'initialisation du paiement");
    }
  };

  const handlePayment = async () => {
    if (!paymentReady || !paymentIntentId) {
      await initializePayment();
      return;
    }

    try {
      setIsProcessing(true);

      // Présenter le Payment Sheet
      const { error } = await presentPaymentSheet();

      if (error) {
        // L'utilisateur a annulé ou il y a une erreur
        if (error.code === 'Canceled') {
          setIsProcessing(false);
          return; // Ne pas traiter comme une erreur
        }
        throw error;
      }

      // Paiement réussi, créer la réservation
      const bookingResult = await createBooking();

      if (bookingResult.success && bookingResult.booking_id) {
        onPaymentSuccess(bookingResult.booking_id);
      } else {
        throw new Error(bookingResult.error || 'Erreur lors de la création de la réservation');
      }
    } catch (error: any) {
      setIsProcessing(false);
      onPaymentError(error.message || 'Le paiement a échoué');
    }
  };

  const createBooking = async () => {
    try {
      if (!bookingData.date || !paymentIntentId) {
        throw new Error('Données manquantes pour créer la réservation');
      }

      // Trouver l'availability_id correspondant à la date et au pro
      const bookingDateStr = bookingData.date.toISOString().split('T')[0];
      const { data: availability, error: availabilityError } = await supabase
        .from('pro_availabilities')
        .select('id')
        .eq('pro_id', proId)
        .eq('golf_course_id', courseId)
        .eq('date', bookingDateStr)
        .eq('is_available', true)
        .single();

      if (availabilityError || !availability) {
        throw new Error('Aucune disponibilité trouvée pour cette date');
      }

      // Préparer les données de réservation pour le service
      const bookingRequest = {
        availability_id: availability.id,
        pro_id: proId,
        amateur_id: userId,
        golf_course_id: courseId,
        booking_date: bookingDateStr,
        start_time: bookingData.timeSlot,
        estimated_duration: 240, // 4 heures par défaut
        number_of_players: bookingData.players,
        holes: bookingData.holes,
        total_amount: Math.round(totalAmount * 100), // en centimes
        pro_fee: Math.round(totalAmount * (1 - commissionRate) * 100), // Montant pour le pro
        platform_fee: Math.round(totalAmount * commissionRate * 100), // Commission plateforme
      };

      return await paymentService.confirmPaymentAndBooking(paymentIntentId, bookingRequest);
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Erreur lors de la création de la réservation',
      };
    }
  };

  return (
    <View style={styles.container}>
      {/* En-tête sécurisé */}
      <View style={styles.secureHeader}>
        <Ionicons name="shield-checkmark" size={24} color={Colors.primary.electric} />
        <Text style={styles.secureText}>Paiement 100% sécurisé</Text>
      </View>

      {/* Récapitulatif du montant */}
      <View style={styles.amountCard}>
        <Text style={styles.amountLabel}>Montant total à payer</Text>
        <Text style={styles.amountValue}>{totalAmount}€</Text>
        <Text style={styles.amountInfo}>Incluant les frais de service Eagle ({Math.round(commissionRate * 100)}%)</Text>
      </View>

      {/* Méthodes de paiement acceptées */}
      <View style={styles.paymentMethods}>
        <Text style={styles.methodsTitle}>Méthodes de paiement acceptées</Text>
        <View style={styles.methodsRow}>
          <View style={styles.methodCard}>
            <Ionicons name="card" size={32} color={Colors.primary.navy} />
            <Text style={styles.methodText}>Carte bancaire</Text>
          </View>
          <View style={styles.methodCard}>
            <Text style={styles.applePay}>Apple</Text>
            <Text style={styles.methodText}>Apple Pay</Text>
          </View>
          <View style={styles.methodCard}>
            <Text style={styles.googlePay}>G</Text>
            <Text style={styles.methodText}>Google Pay</Text>
          </View>
        </View>
      </View>

      {/* Informations de sécurité */}
      <View style={styles.securityInfo}>
        <View style={styles.securityItem}>
          <Ionicons name="lock-closed" size={16} color={Colors.primary.electric} />
          <Text style={styles.securityText}>Vos données bancaires sont cryptées et sécurisées</Text>
        </View>
        <View style={styles.securityItem}>
          <Ionicons name="time" size={16} color={Colors.primary.electric} />
          <Text style={styles.securityText}>Annulation gratuite jusqu'à 24h avant la partie</Text>
        </View>
        <View style={styles.securityItem}>
          <Ionicons name="checkmark-circle" size={16} color={Colors.primary.electric} />
          <Text style={styles.securityText}>Paiement débité après confirmation du golf</Text>
        </View>
      </View>

      {/* Bouton de paiement */}
      <TouchableOpacity
        style={[styles.payButton, (isProcessing || !paymentReady) && styles.payButtonDisabled]}
        onPress={handlePayment}
        disabled={isProcessing || !paymentReady}
      >
        {isProcessing ? (
          <>
            <ActivityIndicator color={Colors.neutral.white} size="small" />
            <Text style={styles.payButtonText}>
              {paymentReady ? 'Traitement en cours...' : 'Initialisation...'}
            </Text>
          </>
        ) : !paymentReady ? (
          <>
            <ActivityIndicator color={Colors.neutral.white} size="small" />
            <Text style={styles.payButtonText}>Préparation du paiement...</Text>
          </>
        ) : (
          <>
            <Ionicons name="lock-closed" size={20} color={Colors.neutral.white} />
            <Text style={styles.payButtonText}>Payer {totalAmount}€</Text>
          </>
        )}
      </TouchableOpacity>

      {/* Powered by Stripe */}
      <View style={styles.poweredBy}>
        <Text style={styles.poweredByText}>Paiement sécurisé par</Text>
        <Text style={styles.stripeLogo}>Stripe</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  secureHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 24,
  },
  secureText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary.electric,
  },
  amountCard: {
    backgroundColor: Colors.primary.lightBlue,
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    marginBottom: 24,
  },
  amountLabel: {
    fontSize: 14,
    color: Colors.primary.navy,
    marginBottom: 8,
  },
  amountValue: {
    fontSize: 36,
    fontWeight: '700',
    color: Colors.primary.navy,
    marginBottom: 4,
  },
  amountInfo: {
    fontSize: 12,
    color: Colors.primary.electric,
  },
  paymentMethods: {
    marginBottom: 24,
  },
  methodsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.neutral.charcoal,
    marginBottom: 12,
  },
  methodsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  methodCard: {
    flex: 1,
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    backgroundColor: Colors.neutral.snow,
    borderWidth: 1,
    borderColor: Colors.neutral.pearl,
  },
  methodText: {
    fontSize: 11,
    color: Colors.neutral.slate,
    marginTop: 4,
  },
  applePay: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.neutral.charcoal,
  },
  googlePay: {
    fontSize: 24,
    fontWeight: '700',
    color: '#4285F4',
  },
  securityInfo: {
    gap: 12,
    marginBottom: 24,
  },
  securityItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  securityText: {
    fontSize: 13,
    color: Colors.neutral.slate,
    flex: 1,
    lineHeight: 18,
  },
  payButton: {
    backgroundColor: Colors.primary.navy,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  payButtonDisabled: {
    opacity: 0.7,
  },
  payButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.neutral.white,
  },
  poweredBy: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  poweredByText: {
    fontSize: 11,
    color: Colors.neutral.slate,
  },
  stripeLogo: {
    fontSize: 14,
    fontWeight: '700',
    color: '#635BFF',
  },
  // Ajouts manquants
  neutral: {
    snow: '#F7F7F7',
    pearl: '#E1E1E1',
    slate: '#64748B',
  },
});
