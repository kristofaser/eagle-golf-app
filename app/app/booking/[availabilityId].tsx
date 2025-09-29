import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Text,
  ActivityIndicator,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Colors, Spacing, Typography, BorderRadius, Elevation } from '@/constants/theme';
import { UniversalAlert } from '@/utils/alert';
import { bookingService, AvailabilityWithDetails } from '@/services/booking.service';
import { useAuth } from '@/hooks/useAuth';
import { useUser } from '@/hooks/useUser';
import { useProtectedRoute } from '@/hooks/useProtectedRoute';
import { Avatar } from '@/components/atoms';
import { supabase } from '@/utils/supabase/client';
import { pricingService } from '@/services/pricing.service';

export default function BookingScreen() {
  const { availabilityId } = useLocalSearchParams();
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const { user, isAmateur } = useUser();

  // Protection de la route - Seuls les amateurs connectés peuvent réserver
  const { isAuthorized, isChecking } = useProtectedRoute({
    requireAuth: true,
    requireRole: 'amateur',
    redirectTo: '/(auth)/register',
    onUnauthorized: () => {
      UniversalAlert.error(
        'Connexion requise',
        'Vous devez être connecté en tant qu\'amateur pour réserver une partie.'
      );
    }
  });

  // États
  const [availability, setAvailability] = useState<AvailabilityWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Données du formulaire
  const [numberOfPlayers, setNumberOfPlayers] = useState(1);
  const [specialRequests, setSpecialRequests] = useState('');

  // Prix calculés
  const [pricing, setPricing] = useState({
    proFee: 0,
    platformFee: 0,
    totalAmount: 0,
  });

  // Charger les données de disponibilité
  useEffect(() => {
    if (availabilityId && isAuthorized) {
      loadAvailability();
    }
  }, [availabilityId, isAuthorized]);

  // Calculer le prix quand le nombre de joueurs change
  useEffect(() => {
    const calculatePrice = async () => {
      if (!availability) return;

      // Récupérer le prix depuis pro_pricing (18 trous par défaut pour une partie)
      const price = await pricingService.getSpecificPrice(
        availability.pro_id,
        18, // Par défaut 18 trous pour une partie
        numberOfPlayers as 1 | 2 | 3
      );

      if (price) {
        // price est en euros par personne, multiplier par le nombre de joueurs
        const totalForAllPlayers = price * numberOfPlayers;
        const platformFee = Math.round(totalForAllPlayers * 0.2); // 20% de commission
        const total = totalForAllPlayers + platformFee;

        setPricing({
          proFee: totalForAllPlayers,
          platformFee: platformFee,
          totalAmount: total,
        });
      } else {
        // Aucun prix configuré, ne pas permettre la réservation
        setPricing({
          proFee: 0,
          platformFee: 0,
          totalAmount: 0,
        });
      }
    };

    calculatePrice();
  }, [numberOfPlayers, availability]);

  const loadAvailability = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('Loading availability with ID:', availabilityId);

      // Utiliser l'API Supabase directement pour charger une disponibilité spécifique
      const { data, error: fetchError } = await supabase
        .from('pro_availabilities')
        .select(
          `
          *,
          profiles:pro_id(*),
          pro_profiles:pro_id(*),
          golf_courses(*)
        `
        )
        .eq('id', availabilityId as string)
        .single();

      if (fetchError) {
        console.error('Erreur Supabase:', fetchError);
        throw new Error(`Erreur de chargement: ${fetchError.message}`);
      }

      if (!data) {
        throw new Error('Aucune disponibilité trouvée avec cet ID');
      }

      // Vérifier qu'il reste des places
      const maxPlayers = data.max_players || 0;
      const currentBookings = data.current_bookings || 0;
      const availableSlots = maxPlayers - currentBookings;
      if (availableSlots <= 0) {
        throw new Error('Aucune place disponible pour ce créneau');
      }

      // Transformer les données pour correspondre au type AvailabilityWithDetails
      const availabilityData: AvailabilityWithDetails = {
        ...data,
        profiles: data.profiles as any,
        pro_profiles: data.pro_profiles as any,
        golf_courses: data.golf_courses as any,
      };

      setAvailability(availabilityData);
    } catch (err: any) {
      console.error('Erreur chargement disponibilité:', err);
      setError(err.message || 'Erreur de chargement');
    } finally {
      setLoading(false);
    }
  };

  const handleBooking = async () => {
    if (!availability || !user?.amateurProfile) return;

    UniversalAlert.show(
      'Confirmer la réservation',
      `Voulez-vous réserver cette partie pour ${numberOfPlayers} joueur${numberOfPlayers > 1 ? 's' : ''} ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Confirmer', onPress: confirmBooking },
      ]
    );
  };

  const confirmBooking = async () => {
    if (!availability || !user?.amateurProfile) return;

    try {
      setSubmitting(true);

      const bookingData = {
        amateur_id: user.amateurProfile.user_id,
        pro_id: availability.pro_id,
        golf_course_id: availability.golf_course_id,
        availability_id: availability.id,
        booking_date: availability.date,
        start_time: availability.start_time,
        number_of_players: numberOfPlayers,
        total_amount: pricing.totalAmount,
        pro_fee: pricing.proFee,
        platform_fee: pricing.platformFee,
        special_requests: specialRequests.trim() || undefined,
      };

      const { data: booking, error: bookingError } =
        await bookingService.createBooking(bookingData);

      if (bookingError) {
        throw new Error(bookingError.message);
      }

      // Succès - rediriger vers la page de confirmation ou les réservations
      UniversalAlert.success('Réservation confirmée !', 'Votre réservation a été enregistrée avec succès.');
      router.replace('/profile');
    } catch (err: any) {
      UniversalAlert.error('Erreur', err.message || 'Impossible de créer la réservation');
    } finally {
      setSubmitting(false);
    }
  };

  // Formatage de la date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  // Formatage de l'heure
  const formatTime = (timeString: string) => {
    return timeString.substring(0, 5); // HH:MM
  };

  // Afficher un loader pendant la vérification d'authentification
  if (isChecking) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color={Colors.primary.accent} />
        <Text style={styles.loadingText}>Vérification...</Text>
      </View>
    );
  }

  // Si non autorisé, ne rien afficher (la redirection est automatique)
  if (!isAuthorized) {
    return null;
  }

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color={Colors.primary.accent} />
        <Text style={styles.loadingText}>Chargement...</Text>
      </View>
    );
  }

  if (error || !availability) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Text style={styles.errorText}>{error || 'Disponibilité non trouvée'}</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.button}>
          <Text style={styles.buttonText}>Retour</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const availableSlots = availability.max_players - availability.current_bookings;

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Réserver une partie',
          headerShown: true,
        }}
      />
      <SafeAreaView style={styles.container} edges={['top']}>
        <KeyboardAvoidingView
          style={styles.keyboardContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.content}>
              {/* Informations du pro */}
              <Animated.View entering={FadeInDown.delay(100)} style={styles.card}>
                <Text style={styles.cardTitle}>Professionnel</Text>
                <View style={styles.proInfo}>
                  <Avatar
                    source={{ uri: availability.profiles.avatar_url }}
                    name={`${availability.profiles.first_name} ${availability.profiles.last_name}`}
                    size="medium"
                  />
                  <View style={styles.proDetails}>
                    <Text style={styles.proName}>
                      {availability.profiles.first_name} {availability.profiles.last_name}
                    </Text>
                    <Text style={styles.proStatus}>
                      {availability.pro_profiles.professional_status}
                    </Text>
                    <View style={styles.ratingRow}>
                      <Ionicons name="star" size={16} color={Colors.secondary.champion} />
                      <Text style={styles.handicap}>
                        Handicap: {availability.pro_profiles.handicap || 'N/A'}
                      </Text>
                    </View>
                  </View>
                </View>
              </Animated.View>

              {/* Informations du parcours */}
              <Animated.View entering={FadeInDown.delay(200)} style={styles.card}>
                <Text style={styles.cardTitle}>Parcours</Text>
                <View style={styles.courseInfo}>
                  <Ionicons name="golf" size={24} color={Colors.primary.accent} />
                  <View style={styles.courseDetails}>
                    <Text style={styles.courseName}>{availability.golf_courses.name}</Text>
                    <Text style={styles.courseAddress}>
                      {availability.golf_courses.city}, {availability.golf_courses.postal_code}
                    </Text>
                  </View>
                </View>
              </Animated.View>

              {/* Date et heure */}
              <Animated.View entering={FadeInDown.delay(300)} style={styles.card}>
                <Text style={styles.cardTitle}>Date et heure</Text>
                <View style={styles.dateTimeInfo}>
                  <View style={styles.dateTimeItem}>
                    <Ionicons name="calendar" size={20} color={Colors.primary.accent} />
                    <Text style={styles.dateTimeText}>{formatDate(availability.date)}</Text>
                  </View>
                  <View style={styles.dateTimeItem}>
                    <Ionicons name="time" size={20} color={Colors.primary.accent} />
                    <Text style={styles.dateTimeText}>
                      {formatTime(availability.start_time)} - {formatTime(availability.end_time)}
                    </Text>
                  </View>
                </View>
              </Animated.View>

              {/* Nombre de joueurs */}
              <Animated.View entering={FadeInDown.delay(400)} style={styles.card}>
                <Text style={styles.cardTitle}>Nombre de joueurs</Text>
                <Text style={styles.availableSlotsText}>
                  {availableSlots} place{availableSlots > 1 ? 's' : ''} disponible
                  {availableSlots > 1 ? 's' : ''}
                </Text>
                <View style={styles.playersSelector}>
                  <TouchableOpacity
                    onPress={() => setNumberOfPlayers(Math.max(1, numberOfPlayers - 1))}
                    style={styles.playerButton}
                    disabled={numberOfPlayers <= 1}
                  >
                    <Ionicons
                      name="remove-circle"
                      size={32}
                      color={numberOfPlayers <= 1 ? Colors.neutral.mist : Colors.primary.accent}
                    />
                  </TouchableOpacity>
                  <Text style={styles.playerCount}>{numberOfPlayers}</Text>
                  <TouchableOpacity
                    onPress={() =>
                      setNumberOfPlayers(Math.min(availableSlots, numberOfPlayers + 1))
                    }
                    style={styles.playerButton}
                    disabled={numberOfPlayers >= availableSlots}
                  >
                    <Ionicons
                      name="add-circle"
                      size={32}
                      color={
                        numberOfPlayers >= availableSlots
                          ? Colors.neutral.mist
                          : Colors.primary.accent
                      }
                    />
                  </TouchableOpacity>
                </View>
              </Animated.View>

              {/* Demandes spéciales */}
              <Animated.View entering={FadeInDown.delay(500)} style={styles.card}>
                <Text style={styles.cardTitle}>Demandes spéciales (optionnel)</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Ex: Je suis débutant, j'aimerais travailler mon putting..."
                  multiline
                  numberOfLines={3}
                  value={specialRequests}
                  onChangeText={setSpecialRequests}
                  placeholderTextColor={Colors.neutral.course}
                />
              </Animated.View>

              {/* Récapitulatif du prix */}
              <Animated.View entering={FadeInDown.delay(600)} style={styles.card}>
                <Text style={styles.cardTitle}>Récapitulatif</Text>
                <View style={styles.priceBreakdown}>
                  <View style={styles.priceRow}>
                    <Text style={styles.priceLabel}>Honoraires du pro (4h)</Text>
                    <Text style={styles.priceValue}>{pricing.proFee.toFixed(0)} €</Text>
                  </View>
                  <View style={styles.priceRow}>
                    <Text style={styles.priceLabel}>Frais de service</Text>
                    <Text style={styles.priceValue}>{pricing.platformFee.toFixed(0)} €</Text>
                  </View>
                  <View style={[styles.priceRow, styles.totalRow]}>
                    <Text style={styles.totalLabel}>Total</Text>
                    <Text style={styles.totalValue}>{pricing.totalAmount.toFixed(0)} €</Text>
                  </View>
                </View>
              </Animated.View>

              {/* Bouton de confirmation */}
              <Animated.View entering={FadeInDown.delay(700)} style={styles.buttonContainer}>
                {pricing.totalAmount > 0 ? (
                  <TouchableOpacity
                    style={[styles.confirmButton, submitting && styles.disabledButton]}
                    onPress={handleBooking}
                    disabled={submitting}
                  >
                    {submitting ? (
                      <ActivityIndicator color="white" />
                    ) : (
                      <>
                        <Ionicons name="checkmark-circle" size={24} color="white" />
                        <Text style={styles.confirmButtonText}>Confirmer la réservation</Text>
                      </>
                    )}
                  </TouchableOpacity>
                ) : (
                  <View style={styles.noPriceContainer}>
                    <Ionicons name="information-circle" size={24} color={Colors.neutral.slate} />
                    <Text style={styles.noPriceText}>
                      Prix non configuré. Contactez directement le professionnel.
                    </Text>
                  </View>
                )}
                <TouchableOpacity style={styles.cancelButton} onPress={() => router.back()}>
                  <Text style={styles.cancelButtonText}>Annuler</Text>
                </TouchableOpacity>
              </Animated.View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.neutral.cloud,
  },
  keyboardContainer: {
    flex: 1,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: Spacing.m,
  },
  card: {
    backgroundColor: Colors.neutral.white,
    borderRadius: BorderRadius.medium,
    padding: Spacing.l,
    marginBottom: Spacing.m,
    ...Elevation.small,
  },
  cardTitle: {
    fontSize: Typography.fontSize.h4,
    fontWeight: Typography.fontWeight.semiBold,
    color: Colors.neutral.charcoal,
    marginBottom: Spacing.m,
  },
  proInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  proDetails: {
    marginLeft: Spacing.m,
    flex: 1,
  },
  proName: {
    fontSize: Typography.fontSize.body,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.neutral.charcoal,
  },
  proStatus: {
    fontSize: Typography.fontSize.caption,
    color: Colors.neutral.course,
    marginTop: Spacing.xxs,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.xs,
  },
  handicap: {
    fontSize: Typography.fontSize.caption,
    color: Colors.neutral.charcoal,
    marginLeft: Spacing.xs,
  },
  courseInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  courseDetails: {
    marginLeft: Spacing.m,
    flex: 1,
  },
  courseName: {
    fontSize: Typography.fontSize.body,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.neutral.charcoal,
  },
  courseAddress: {
    fontSize: Typography.fontSize.caption,
    color: Colors.neutral.course,
    marginTop: Spacing.xxs,
  },
  dateTimeInfo: {
    gap: Spacing.m,
  },
  dateTimeItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateTimeText: {
    fontSize: Typography.fontSize.body,
    color: Colors.neutral.charcoal,
    marginLeft: Spacing.s,
  },
  availableSlotsText: {
    fontSize: Typography.fontSize.caption,
    color: Colors.neutral.course,
    marginBottom: Spacing.m,
    textAlign: 'center',
  },
  playersSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xl,
  },
  playerButton: {
    padding: Spacing.xs,
  },
  playerCount: {
    fontSize: Typography.fontSize.h2,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.neutral.charcoal,
    minWidth: 40,
    textAlign: 'center',
  },
  textInput: {
    borderWidth: 1,
    borderColor: Colors.neutral.mist,
    borderRadius: BorderRadius.small,
    padding: Spacing.m,
    fontSize: Typography.fontSize.body,
    color: Colors.neutral.charcoal,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  priceBreakdown: {
    gap: Spacing.s,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceLabel: {
    fontSize: Typography.fontSize.body,
    color: Colors.neutral.course,
  },
  priceValue: {
    fontSize: Typography.fontSize.body,
    color: Colors.neutral.charcoal,
  },
  totalRow: {
    paddingTop: Spacing.s,
    borderTopWidth: 1,
    borderTopColor: Colors.neutral.mist,
    marginTop: Spacing.s,
  },
  totalLabel: {
    fontSize: Typography.fontSize.h4,
    fontWeight: Typography.fontWeight.semiBold,
    color: Colors.neutral.charcoal,
  },
  totalValue: {
    fontSize: Typography.fontSize.h4,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.primary.accent,
  },
  buttonContainer: {
    gap: Spacing.m,
    marginTop: Spacing.l,
  },
  confirmButton: {
    backgroundColor: Colors.primary.accent,
    borderRadius: BorderRadius.medium,
    paddingVertical: Spacing.l,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.s,
    ...Elevation.medium,
  },
  disabledButton: {
    opacity: 0.6,
  },
  confirmButtonText: {
    color: Colors.neutral.white,
    fontSize: Typography.fontSize.body,
    fontWeight: Typography.fontWeight.semiBold,
  },
  cancelButton: {
    paddingVertical: Spacing.m,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: Colors.neutral.course,
    fontSize: Typography.fontSize.body,
  },
  loadingText: {
    marginTop: Spacing.m,
    fontSize: Typography.fontSize.body,
    color: Colors.neutral.course,
  },
  errorText: {
    fontSize: Typography.fontSize.body,
    color: Colors.semantic.error,
    textAlign: 'center',
    marginHorizontal: Spacing.xl,
  },
  button: {
    marginTop: Spacing.l,
    paddingVertical: Spacing.s,
    paddingHorizontal: Spacing.xl,
    backgroundColor: Colors.primary.accent,
    borderRadius: BorderRadius.small,
  },
  buttonText: {
    color: Colors.neutral.white,
    fontSize: Typography.fontSize.body,
    fontWeight: Typography.fontWeight.semiBold,
  },
  noPriceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.neutral.snow,
    padding: Spacing.m,
    borderRadius: BorderRadius.small,
    borderWidth: 1,
    borderColor: Colors.neutral.pearl,
    gap: Spacing.s,
  },
  noPriceText: {
    flex: 1,
    fontSize: 14,
    color: Colors.neutral.slate,
    textAlign: 'center',
    lineHeight: 20,
  },
});
