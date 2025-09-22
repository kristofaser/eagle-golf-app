import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/theme';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { profileService, FullProfile } from '@/services/profile.service';
import { golfCourseService, GolfCourse } from '@/services/golf-course.service';
import { useStripe } from '@stripe/stripe-react-native';
import { paymentService } from '@/services/payment.service';
import { bookingService } from '@/services/booking.service';
import { supabase } from '@/utils/supabase/client';

interface TimeSlot {
  id: string;
  start: string;
  end: string;
  available: boolean;
}

interface SummaryStepProps {
  bookingData: {
    players: number;
    holes: number;
    date: Date | null;
    timeSlot: string | null;
    totalPrice: number;
  };
  proId: string;
  courseId: string;
  availableSlots?: TimeSlot[];
  onPaymentSuccess: (bookingId: string) => void;
  onPaymentError: (error: string) => void;
  userId: string;
}

export const SummaryStep: React.FC<SummaryStepProps> = ({
  bookingData,
  proId,
  courseId,
  availableSlots = [],
  onPaymentSuccess,
  onPaymentError,
  userId,
}) => {
  const [proProfile, setProProfile] = useState<FullProfile | null>(null);
  const [golfCourse, setGolfCourse] = useState<GolfCourse | null>(null);
  const [loading, setLoading] = useState(true);

  // État pour la gestion du paiement Stripe
  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentReady, setPaymentReady] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [paymentIntentId, setPaymentIntentId] = useState<string | null>(null);

  const platformFee = Math.round(bookingData.totalPrice * 0.2);
  const proFee = bookingData.totalPrice - platformFee;

  // Charger les données du professionnel et du cours
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [proResult, courseResult] = await Promise.all([
          profileService.getFullProfile(proId),
          golfCourseService.getGolfCourse(courseId),
        ]);

        if (proResult.data) {
          setProProfile(proResult.data);
        }
        if (courseResult.data) {
          setGolfCourse(courseResult.data);
        }
      } catch (error) {
        console.error('Erreur lors du chargement des données:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [proId, courseId]);

  // Initialiser le paiement automatiquement au chargement
  useEffect(() => {
    if (!loading) {
      initializePayment();
    }
  }, [loading]);

  // Trouver le créneau sélectionné
  const selectedSlot = availableSlots.find(slot => slot.id === bookingData.timeSlot);

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
        amount: Math.round(bookingData.totalPrice * 100), // Convertir en centimes
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
      onPaymentError(error.message || 'Erreur d\'initialisation du paiement');
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
        total_amount: Math.round(bookingData.totalPrice * 100), // en centimes
        pro_fee: Math.round(bookingData.totalPrice * 0.8 * 100), // 80% pour le pro
        platform_fee: Math.round(bookingData.totalPrice * 0.2 * 100), // 20% pour la plateforme
      };

      return await paymentService.confirmPaymentAndBooking(paymentIntentId, bookingRequest);
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Erreur lors de la création de la réservation',
      };
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary.navy} />
        <Text style={styles.loadingText}>Chargement des détails...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>

      {/* Détails de la réservation */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Détails de la partie</Text>

        <View style={styles.detailRow}>
          <View style={styles.detailIcon}>
            <Ionicons name="person" size={20} color={Colors.primary.navy} />
          </View>
          <View style={styles.detailContent}>
            <Text style={styles.detailLabel}>Professionnel</Text>
            <Text style={styles.detailValue}>
              {proProfile ? `${proProfile.first_name} ${proProfile.last_name}` : 'Chargement...'}
            </Text>
          </View>
        </View>

        <View style={styles.detailRow}>
          <View style={styles.detailIcon}>
            <Ionicons name="golf" size={20} color={Colors.primary.navy} />
          </View>
          <View style={styles.detailContent}>
            <Text style={styles.detailLabel}>Parcours</Text>
            <Text style={styles.detailValue}>
              {golfCourse ? golfCourse.name : 'Chargement...'}
            </Text>
            {golfCourse?.city && (
              <Text style={styles.detailSubValue}>
                {golfCourse.city}
              </Text>
            )}
          </View>
        </View>

        <View style={styles.detailRow}>
          <View style={styles.detailIcon}>
            <Ionicons name="calendar" size={20} color={Colors.primary.navy} />
          </View>
          <View style={styles.detailContent}>
            <Text style={styles.detailLabel}>Date</Text>
            <Text style={styles.detailValue}>
              {bookingData.date ? format(bookingData.date, 'EEEE d MMMM yyyy', { locale: fr }) : '-'}
            </Text>
          </View>
        </View>

        <View style={styles.detailRow}>
          <View style={styles.detailIcon}>
            <Ionicons name="time" size={20} color={Colors.primary.navy} />
          </View>
          <View style={styles.detailContent}>
            <Text style={styles.detailLabel}>Heure de départ souhaitée</Text>
            <Text style={styles.detailValue}>
              {selectedSlot ? `À partir de ${selectedSlot.start.split(':')[0]}h${selectedSlot.start.split(':')[1]}` :
               bookingData.timeSlot ?
                 (() => {
                   const slotId = bookingData.timeSlot;
                   if (slotId.startsWith('slot-')) {
                     const hour = parseInt(slotId.replace('slot-', ''));
                     return `À partir de ${hour.toString().padStart(2, '0')}h00`;
                   }
                   return slotId;
                 })() :
                 'Non sélectionné'}
            </Text>
          </View>
        </View>

        <View style={styles.detailRow}>
          <View style={styles.detailIcon}>
            <Ionicons name="people" size={20} color={Colors.primary.navy} />
          </View>
          <View style={styles.detailContent}>
            <Text style={styles.detailLabel}>Nombre de joueurs</Text>
            <Text style={styles.detailValue}>
              {bookingData.players} {bookingData.players === 1 ? 'joueur' : 'joueurs'}
            </Text>
          </View>
        </View>

        <View style={styles.detailRow}>
          <View style={styles.detailIcon}>
            <Ionicons name="flag" size={20} color={Colors.primary.navy} />
          </View>
          <View style={styles.detailContent}>
            <Text style={styles.detailLabel}>Type de parcours</Text>
            <Text style={styles.detailValue}>{bookingData.holes} trous</Text>
          </View>
        </View>
      </View>

      {/* Section prix */}
      <View style={styles.section}>
        <View style={styles.priceRow}>
          <Text style={styles.totalLabel}>Total à payer</Text>
          <Text style={styles.totalValue}>{bookingData.totalPrice}€</Text>
        </View>
        <Text style={styles.priceInfo}>
          Green Fee non inclus
        </Text>
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
            <Text style={styles.payButtonText}>Payer ma réservation</Text>
          </>
        )}
      </TouchableOpacity>

    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  headerText: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.neutral.charcoal,
    marginTop: 12,
    textAlign: 'center',
  },
  section: {
    backgroundColor: Colors.neutral.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.neutral.pearl,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.neutral.charcoal,
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  detailIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primary.lightBlue,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    color: Colors.neutral.slate,
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.neutral.charcoal,
    textTransform: 'capitalize',
  },
  detailSubValue: {
    fontSize: 13,
    color: Colors.neutral.slate,
    marginTop: 2,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  priceLabel: {
    fontSize: 14,
    color: Colors.neutral.slate,
    flex: 1,
  },
  priceValue: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.neutral.charcoal,
  },
  separator: {
    height: 1,
    backgroundColor: Colors.neutral.pearl,
    marginVertical: 12,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.neutral.charcoal,
  },
  totalValue: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.primary.navy,
  },
  priceInfo: {
    fontSize: 12,
    color: Colors.primary.electric,
    textAlign: 'center',
    marginTop: 8,
  },
  payButton: {
    backgroundColor: Colors.primary.navy,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 16,
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
  infoBox: {
    flexDirection: 'row',
    backgroundColor: Colors.primary.lightBlue,
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  infoText: {
    fontSize: 13,
    color: Colors.primary.navy,
    marginLeft: 8,
    flex: 1,
    lineHeight: 18,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 16,
    color: Colors.neutral.slate,
    marginTop: 12,
  },
  // Ajouts manquants
  neutral: {
    pearl: '#E1E1E1',
    slate: '#64748B',
    snow: '#F7F7F7',
  },
});