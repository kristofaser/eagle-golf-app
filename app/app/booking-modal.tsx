import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TextInput,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { UserIcon, UserMultipleIcon, UserGroupIcon } from '@hugeicons/core-free-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Colors } from '@/constants/theme';
import { UniversalAlert } from '@/utils/alert';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withDelay,
} from 'react-native-reanimated';
import { CalendarStep } from '@/components/profile/sections/steps/CalendarStep';
import { TimeSlotStep } from '@/components/profile/sections/steps/TimeSlotStep';
import { SummaryStep } from '@/components/profile/sections/steps/SummaryStep';
import { SuccessStep } from '@/components/profile/sections/steps/SuccessStep';
import { pricingService } from '@/services/pricing.service';
import { bookingService } from '@/services/booking.service';
import { useAuth } from '@/hooks/useAuth';
import { useCommissionRate } from '@/contexts/CommissionContext';

// Étapes du parcours de réservation
const BOOKING_STEPS = [
  { id: 1, title: 'Configuration' },
  { id: 2, title: 'Date' },
  { id: 3, title: 'Créneaux' },
  { id: 4, title: 'Récapitulatif' },
  { id: 5, title: 'Confirmation' },
];

export default function BookingModal() {
  const router = useRouter();
  // Sur web, on utilise des valeurs fixes au lieu de useSafeAreaInsets
  const insets = Platform.OS === 'web' ? { top: 0, bottom: 0, left: 0, right: 0 } : useSafeAreaInsets();
  const params = useLocalSearchParams();
  const { user, isAuthenticated } = useAuth();

  // Récupération des paramètres
  const proId = params.proId as string;
  const proName = params.proName as string;
  const selectedCourseId = params.selectedCourseId as string;
  const selectedCourseName = params.selectedCourseName as string;

  // État pour la navigation entre étapes
  const [currentStep, setCurrentStep] = useState(1);
  const [canGoNext, setCanGoNext] = useState(false);

  // État pour les données de réservation
  const [bookingData, setBookingData] = useState({
    players: 1,
    holes: 9,
    date: null as Date | null,
    timeSlot: null as string | null,
    specialRequests: '',
    totalPrice: null as number | null,
    player2: {
      firstName: '',
      lastName: '',
    },
    player3: {
      firstName: '',
      lastName: '',
    },
  });

  // États pour le loading et les erreurs
  const [loadingPrice, setLoadingPrice] = useState(false);
  const [priceError, setPriceError] = useState<string | null>(null);
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [loadingAvailabilities, setLoadingAvailabilities] = useState(false);
  const [availableSlots, setAvailableSlots] = useState<any[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [createdBookingId, setCreatedBookingId] = useState<string | null>(null);

  // Commission dynamique depuis CommissionContext (temps réel automatique)
  const commissionRate = useCommissionRate();

  // États globaux de gestion d'erreur
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [isGlobalLoading, setIsGlobalLoading] = useState(false);

  // Animations FAB
  const fabScale = useSharedValue(0);
  const fabTranslateY = useSharedValue(50);
  const previousStep = useRef(currentStep);

  // Styles d'animation FAB
  const fabAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: fabScale.value }, { translateY: fabTranslateY.value }],
    };
  });

  // Fonctions utilitaires pour la gestion d'erreur
  const handleError = (error: string, context?: string) => {
    console.error(`Erreur${context ? ` dans ${context}` : ''}:`, error);
    setGlobalError(error);
    setIsGlobalLoading(false);
  };

  const clearError = () => {
    setGlobalError(null);
  };

  const showGlobalLoading = (loading: boolean) => {
    setIsGlobalLoading(loading);
    if (loading) clearError(); // Effacer les erreurs précédentes lors du démarrage d'une nouvelle opération
  };

  // Navigation entre étapes
  const goToNextStep = () => {
    // Vérifier l'authentification avant de passer à l'étape de récapitulatif/paiement
    if (currentStep === 3 && !isAuthenticated) {
      UniversalAlert.show(
        'Connexion requise',
        'Créez un compte Eagle pour finaliser votre réservation',
        [
          { text: 'Continuer à explorer', style: 'cancel' },
          {
            text: 'Se connecter',
            onPress: () => router.push({
              pathname: '/(auth)/login' as any,
              params: { returnTo: `/booking-modal` }
            })
          },
          {
            text: "S'inscrire",
            onPress: () => router.push({
              pathname: '/(auth)/register' as any,
              params: { returnTo: `/booking-modal` }
            }),
            style: 'default'
          }
        ]
      );
      return;
    }

    if (currentStep < BOOKING_STEPS.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const goToPreviousStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Calcul du prix dynamique avec API réelle
  const calculatePrice = async (players: number, holes: number) => {
    if (!proId) return 0;

    try {
      setLoadingPrice(true);
      setPriceError(null);

      const price = await pricingService.getSpecificPrice(
        proId,
        holes as 9 | 18,
        players as 1 | 2 | 3
      );

      if (price === null) {
        // Aucun prix défini, retourner null pour indiquer l'absence de prix
        return null;
      }

      // Le prix est en euros par personne depuis la base de données
      // Multiplier par le nombre de joueurs puis ajouter la commission Eagle (dynamique)
      const totalForAllPlayers = price * players;
      const totalWithCommission = totalForAllPlayers + totalForAllPlayers * commissionRate;
      return totalWithCommission;
    } catch (error) {
      console.error('Erreur calcul prix:', error);
      setPriceError('Impossible de calculer le prix');
      return 0;
    } finally {
      setLoadingPrice(false);
    }
  };

  // Charger les disponibilités du pro
  const loadAvailabilities = async () => {
    if (!proId || !selectedCourseId) return;

    try {
      setLoadingAvailabilities(true);

      // Charger les disponibilités pour les 3 prochains mois
      const startDate = new Date();
      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + 3);
      const startDateStr = startDate.toISOString().split('T')[0];
      const endDateStr = endDate.toISOString().split('T')[0];

      // 1. Récupérer les disponibilités configurées par le pro
      const { data: availabilities, error } = await bookingService.getProAvailabilities({
        proId,
        golfCourseId: selectedCourseId,
        startDate: startDateStr,
        endDate: endDateStr,
        hasSlots: true, // Seulement les créneaux avec places disponibles
      });

      if (error) {
        console.error('Erreur chargement disponibilités:', error);
        return;
      }

      // 2. Récupérer toutes les réservations existantes pour cette période
      const { data: existingBookings, error: bookingsError } = await bookingService.listBookings({
        proId,
        golfCourseId: selectedCourseId,
        startDate: startDateStr,
        endDate: endDateStr,
      });

      if (bookingsError) {
        console.error('Erreur chargement réservations:', bookingsError);
        // Continuer sans les réservations pour ne pas bloquer complètement
      }

      // 3. Filtrer les réservations bloquantes (pending ou confirmed)
      const blockingBookings =
        existingBookings?.filter((booking) => ['pending', 'confirmed'].includes(booking.status)) ||
        [];

      // 4. Extraire les dates déjà réservées
      const bookedDates = new Set(blockingBookings.map((booking) => booking.booking_date));

      // 5. Filtrer les disponibilités pour exclure les dates déjà réservées
      const availableDatesFromPro = availabilities?.map((avail) => avail.date) || [];
      const uniqueAvailableDates = [...new Set(availableDatesFromPro)];
      const freeDates = uniqueAvailableDates.filter((date) => !bookedDates.has(date));

      setAvailableDates(freeDates);
    } catch (error) {
      console.error('Erreur chargement disponibilités:', error);
    } finally {
      setLoadingAvailabilities(false);
    }
  };

  // Charger les créneaux pour une date spécifique
  const loadSlotsForDate = async (date: Date) => {
    if (!proId || !selectedCourseId) return;

    try {
      setLoadingSlots(true);
      const dateString = date.toISOString().split('T')[0];

      const { data: availabilities, error } = await bookingService.getProAvailabilities({
        proId,
        golfCourseId: selectedCourseId,
        date: dateString,
        hasSlots: true,
      });

      if (error) {
        console.error('Erreur chargement créneaux:', error);
        setAvailableSlots([]);
        return;
      }

      // Transformer les données pour le TimeSlotStep
      const slots =
        availabilities?.map((avail) => ({
          id: avail.id,
          start: avail.start_time,
          end: avail.end_time,
          period: getTimePeriod(avail.start_time),
          available: avail.current_bookings < avail.max_players,
          availableSlots: avail.max_players - avail.current_bookings,
        })) || [];

      setAvailableSlots(slots);
    } catch (error) {
      console.error('Erreur chargement créneaux:', error);
      setAvailableSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  };

  // Utilitaire pour déterminer la période (matin/après-midi)
  const getTimePeriod = (timeString: string): 'morning' | 'afternoon' | 'evening' => {
    const hour = parseInt(timeString.split(':')[0]);
    if (hour < 12) return 'morning';
    if (hour < 18) return 'afternoon';
    return 'evening';
  };

  // Fonction pour obtenir l'icône selon le nombre de joueurs
  const getPlayerIcon = (numberOfPlayers: number) => {
    switch (numberOfPlayers) {
      case 1:
        return UserIcon;
      case 2:
        return UserMultipleIcon;
      case 3:
      default:
        return UserGroupIcon;
    }
  };

  // Charger les créneaux quand la date change
  useEffect(() => {
    if (bookingData.date) {
      loadSlotsForDate(bookingData.date);
    }
  }, [bookingData.date, proId, selectedCourseId]);

  // Charger les disponibilités au montage du composant
  useEffect(() => {
    loadAvailabilities();
  }, [proId, selectedCourseId]);

  useEffect(() => {
    const updatePrice = async () => {
      const newPrice = await calculatePrice(bookingData.players, bookingData.holes);
      if (newPrice !== bookingData.totalPrice) {
        setBookingData((prev) => ({
          ...prev,
          totalPrice: newPrice,
        }));
      }
    };
    updatePrice();
  }, [bookingData.players, bookingData.holes, proId]);

  // Validation pour passer à l'étape suivante
  useEffect(() => {
    switch (currentStep) {
      case 1:
        // Vérifier le prix ET les infos des joueurs supplémentaires
        let canProceed = bookingData.totalPrice !== null;

        // Si 2 joueurs ou plus, vérifier que le joueur 2 est renseigné
        if (bookingData.players >= 2) {
          canProceed = canProceed &&
            bookingData.player2.firstName.trim() !== '' &&
            bookingData.player2.lastName.trim() !== '';
        }

        // Si 3 joueurs, vérifier que le joueur 3 est renseigné
        if (bookingData.players === 3) {
          canProceed = canProceed &&
            bookingData.player3.firstName.trim() !== '' &&
            bookingData.player3.lastName.trim() !== '';
        }

        setCanGoNext(canProceed);
        break;
      case 2:
        setCanGoNext(bookingData.date !== null);
        break;
      case 3:
        setCanGoNext(bookingData.timeSlot !== null);
        break;
      case 4:
        setCanGoNext(true);
        break;
      case 5:
        setCanGoNext(false); // Géré par le paiement
        break;
      default:
        setCanGoNext(false);
    }
  }, [currentStep, bookingData]);

  // Animation FAB au changement d'étape et au premier chargement
  useEffect(() => {
    if (previousStep.current !== currentStep || previousStep.current === currentStep) {
      // Reset animations
      fabScale.value = 0;
      fabTranslateY.value = 50;

      // Animation d'entrée avec délai
      const animationDelay = previousStep.current === currentStep ? 100 : 200; // Plus rapide au premier chargement

      if (currentStep === 5) {
        // Animation Victory pour l'étape finale
        fabScale.value = withDelay(
          animationDelay,
          withSequence(
            withSpring(1.2, { duration: 300 }),
            withSpring(0.95, { duration: 200 }),
            withSpring(1, { duration: 300 })
          )
        );
      } else {
        // Animation Pop-in normale
        fabScale.value = withDelay(
          animationDelay,
          withSpring(1, {
            tension: 100,
            friction: 8,
          })
        );
      }

      fabTranslateY.value = withDelay(
        animationDelay,
        withSpring(0, {
          tension: 80,
          friction: 10,
        })
      );

      previousStep.current = currentStep;
    }
  }, [currentStep]);

  const handleClose = () => {
    router.back();
  };

  // Gestion du paiement
  const handlePaymentSuccess = (bookingId: string) => {
    console.log('Paiement réussi pour la réservation:', bookingId);
    setCreatedBookingId(bookingId);
    setCurrentStep(5); // Aller à l'étape de confirmation
  };

  const handlePaymentError = (error: string) => {
    console.error('Erreur de paiement:', error);
    handleError(error, 'paiement');
  };

  const handleBookingComplete = () => {
    console.log('Réservation complétée !');
    router.dismissAll();
    router.replace({
      pathname: '/profile',
      params: { openSection: 'mes-parties' },
    });
  };


  return (
    <>
      {/* Header fixe avec indicateur de progression */}
      <View style={styles.header} collapsable={false}>
        <View style={styles.headerTop}>
          <TouchableOpacity
            onPress={goToPreviousStep}
            style={[styles.navButton, currentStep === 1 && styles.navButtonDisabled]}
            disabled={currentStep === 1}
          >
            <Ionicons
              name="arrow-back"
              size={24}
              color={currentStep === 1 ? Colors.neutral.mist : Colors.neutral.charcoal}
            />
          </TouchableOpacity>

          <View style={styles.stepIndicator}>
            {BOOKING_STEPS.map((step) => (
              <View
                key={step.id}
                style={[
                  styles.stepDot,
                  step.id === currentStep && styles.stepDotActive,
                  step.id < currentStep && styles.stepDotCompleted,
                ]}
              />
            ))}
          </View>

          <TouchableOpacity onPress={handleClose} style={styles.navButton}>
            <Ionicons name="close" size={24} color={Colors.neutral.charcoal} />
          </TouchableOpacity>
        </View>

        {/* Titre de l'étape courante */}
        <Text style={styles.stepTitle}>{BOOKING_STEPS[currentStep - 1].title}</Text>
      </View>

      {/* ScrollView unique pour tout le contenu */}
      <ScrollView
        style={[styles.content, { paddingBottom: insets.bottom }]}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Étape 1: Configuration (Joueurs + Trous) */}
        {currentStep === 1 && (
          <View style={styles.stepContent}>
            <Text style={styles.sectionTitle}>Nombre de joueurs</Text>
            <View style={styles.playersSelector}>
              <TouchableOpacity
                style={[
                  styles.playerButton,
                  bookingData.players <= 1 && styles.playerButtonDisabled,
                ]}
                onPress={() =>
                  setBookingData((prev) => {
                    const newPlayers = Math.max(1, prev.players - 1);
                    const updatedData = { ...prev, players: newPlayers };

                    // Réinitialiser les données des joueurs supplémentaires si nécessaire
                    if (newPlayers < 3) {
                      updatedData.player3 = { firstName: '', lastName: '' };
                    }
                    if (newPlayers < 2) {
                      updatedData.player2 = { firstName: '', lastName: '' };
                    }

                    return updatedData;
                  })
                }
                disabled={bookingData.players <= 1}
                activeOpacity={0.7}
              >
                <Ionicons
                  name="remove-circle"
                  size={36}
                  color={bookingData.players <= 1 ? Colors.neutral.mist : Colors.primary.navy}
                />
              </TouchableOpacity>

              <View style={styles.playersDisplay}>
                <HugeiconsIcon
                  icon={getPlayerIcon(bookingData.players)}
                  size={40}
                  color={Colors.neutral.slate}
                />
              </View>

              <TouchableOpacity
                style={[
                  styles.playerButton,
                  bookingData.players >= 3 && styles.playerButtonDisabled,
                ]}
                onPress={() =>
                  setBookingData((prev) => ({ ...prev, players: Math.min(3, prev.players + 1) }))
                }
                disabled={bookingData.players >= 3}
                activeOpacity={0.7}
              >
                <Ionicons
                  name="add-circle"
                  size={36}
                  color={bookingData.players >= 3 ? Colors.neutral.mist : Colors.primary.navy}
                />
              </TouchableOpacity>
            </View>

            <Text style={styles.sectionTitle}>Type de parcours</Text>
            <View style={styles.holesSelector}>
              <TouchableOpacity
                style={[styles.playerButton, bookingData.holes <= 9 && styles.playerButtonDisabled]}
                onPress={() => setBookingData((prev) => ({ ...prev, holes: 9 }))}
                disabled={bookingData.holes <= 9}
                activeOpacity={0.7}
              >
                <Ionicons
                  name="remove-circle"
                  size={36}
                  color={bookingData.holes <= 9 ? Colors.neutral.mist : Colors.primary.navy}
                />
              </TouchableOpacity>

              <View style={styles.holesDisplay}>
                <Text style={styles.holesNumber}>{bookingData.holes}</Text>
                <Text style={styles.holesLabel}>trous</Text>
              </View>

              <TouchableOpacity
                style={[
                  styles.playerButton,
                  bookingData.holes >= 18 && styles.playerButtonDisabled,
                ]}
                onPress={() => setBookingData((prev) => ({ ...prev, holes: 18 }))}
                disabled={bookingData.holes >= 18}
                activeOpacity={0.7}
              >
                <Ionicons
                  name="add-circle"
                  size={36}
                  color={bookingData.holes >= 18 ? Colors.neutral.mist : Colors.primary.navy}
                />
              </TouchableOpacity>
            </View>

            {/* Informations des joueurs supplémentaires */}
            {bookingData.players >= 2 && (
              <View style={styles.playersInfoSection}>
                <View style={styles.playerInputRow}>
                  <TextInput
                    style={[styles.playerInput, styles.playerInputLeft]}
                    placeholder="Prénom joueur 2"
                    value={bookingData.player2.firstName}
                    onChangeText={(text) =>
                      setBookingData((prev) => ({
                        ...prev,
                        player2: { ...prev.player2, firstName: text },
                      }))
                    }
                    placeholderTextColor={Colors.neutral.course}
                  />
                  <TextInput
                    style={[styles.playerInput, styles.playerInputRight]}
                    placeholder="Nom joueur 2"
                    value={bookingData.player2.lastName}
                    onChangeText={(text) =>
                      setBookingData((prev) => ({
                        ...prev,
                        player2: { ...prev.player2, lastName: text },
                      }))
                    }
                    placeholderTextColor={Colors.neutral.course}
                  />
                </View>
              </View>
            )}

            {bookingData.players === 3 && (
              <View style={styles.playersInfoSection}>
                <View style={styles.playerInputRow}>
                  <TextInput
                    style={[styles.playerInput, styles.playerInputLeft]}
                    placeholder="Prénom joueur 3"
                    value={bookingData.player3.firstName}
                    onChangeText={(text) =>
                      setBookingData((prev) => ({
                        ...prev,
                        player3: { ...prev.player3, firstName: text },
                      }))
                    }
                    placeholderTextColor={Colors.neutral.course}
                  />
                  <TextInput
                    style={[styles.playerInput, styles.playerInputRight]}
                    placeholder="Nom joueur 3"
                    value={bookingData.player3.lastName}
                    onChangeText={(text) =>
                      setBookingData((prev) => ({
                        ...prev,
                        player3: { ...prev.player3, lastName: text },
                      }))
                    }
                    placeholderTextColor={Colors.neutral.course}
                  />
                </View>
              </View>
            )}

            {/* Affichage du prix dynamique */}
            <View style={styles.pricePreview}>
              <View style={styles.priceRow}>
                <Text style={styles.priceLabel}>Prix total</Text>
                {loadingPrice ? (
                  <ActivityIndicator size="small" color={Colors.primary.navy} />
                ) : priceError ? (
                  <Text style={styles.priceError}>Erreur</Text>
                ) : bookingData.totalPrice === null ? (
                  <Text style={styles.priceValue}>Prix non configuré</Text>
                ) : (
                  <Text style={styles.priceValue}>{bookingData.totalPrice.toFixed(0)}€</Text>
                )}
              </View>
            </View>
          </View>
        )}

        {/* Étape 2: Sélection de la date */}
        {currentStep === 2 && (
          <CalendarStep
            selectedDate={bookingData.date}
            onDateSelect={(date) => setBookingData((prev) => ({ ...prev, date }))}
            availableDates={availableDates}
            proId={proId}
            proName={proName}
          />
        )}

        {/* Étape 3: Sélection des créneaux */}
        {currentStep === 3 && (
          <TimeSlotStep
            selectedSlot={bookingData.timeSlot}
            onSlotSelect={(slotId) => setBookingData((prev) => ({ ...prev, timeSlot: slotId }))}
            selectedDate={bookingData.date}
            proId={proId}
          />
        )}

        {/* Étape 4: Récapitulatif */}
        {currentStep === 4 && (
          <SummaryStep
            bookingData={bookingData}
            proId={proId}
            courseId={selectedCourseId}
            availableSlots={availableSlots}
            onPaymentSuccess={handlePaymentSuccess}
            onPaymentError={handlePaymentError}
            userId={user?.id || ''}
          />
        )}

        {/* Étape 5: Confirmation */}
        {currentStep === 5 && (
          <SuccessStep
            proName={proName}
            courseName={selectedCourseName}
            bookingData={bookingData}
          />
        )}
        {/* Bouton d'action principal - Déplacé dans le ScrollView */}
        <View style={styles.buttonContainer}>
          {/* Bouton continuer pour les étapes 1-3 seulement */}
        </View>

        {/* Affichage de l'erreur globale */}
        {globalError && (
          <View style={styles.globalErrorContainer}>
            <View style={styles.globalErrorContent}>
              <Ionicons name="warning" size={20} color={Colors.semantic.error} />
              <Text style={styles.globalErrorText}>{globalError}</Text>
              <TouchableOpacity onPress={clearError} style={styles.errorCloseButton}>
                <Ionicons name="close" size={16} color={Colors.semantic.error} />
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>

      {/* FAB Bouton Continuer pour les étapes 1-3 */}
      {currentStep < 4 && (
        <Animated.View style={[styles.fabExtended, fabAnimatedStyle]}>
          <TouchableOpacity
            style={styles.fabButton}
            onPress={goToNextStep}
            disabled={!canGoNext}
            activeOpacity={0.8}
          >
            <Ionicons name="arrow-forward" size={20} color={Colors.neutral.white} />
            <Text style={styles.fabExtendedText}>Continuer</Text>
          </TouchableOpacity>
        </Animated.View>
      )}

      {/* FAB Bouton Terminé pour l'étape finale */}
      {currentStep === 5 && (
        <Animated.View style={[styles.fab, fabAnimatedStyle]}>
          <TouchableOpacity
            style={styles.fabButton}
            onPress={handleBookingComplete}
            activeOpacity={0.8}
          >
            <Ionicons name="checkmark" size={24} color={Colors.neutral.white} />
            <Text style={styles.fabText}>Terminé</Text>
          </TouchableOpacity>
        </Animated.View>
      )}

      {/* Loading overlay global */}
      {isGlobalLoading && (
        <View style={styles.globalLoadingOverlay}>
          <View style={styles.globalLoadingContent}>
            <ActivityIndicator size="large" color={Colors.primary.navy} />
            <Text style={styles.globalLoadingText}>Chargement...</Text>
          </View>
        </View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.neutral.cloud,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
    color: Colors.neutral.course,
  },
  header: {
    backgroundColor: Colors.neutral.white,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral.pearl,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  navButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  navButtonDisabled: {
    opacity: 0.3,
  },
  stepIndicator: {
    flexDirection: 'row',
    gap: 8,
  },
  stepDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.neutral.mist,
  },
  stepDotActive: {
    backgroundColor: Colors.primary.navy,
    width: 24,
  },
  stepDotCompleted: {
    backgroundColor: Colors.primary.electric,
  },
  stepTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.neutral.charcoal,
    textAlign: 'center',
  },
  content: {
    flex: 1,
    backgroundColor: Colors.neutral.white,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  buttonContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  stepContent: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.neutral.charcoal,
    marginBottom: 16,
    marginTop: 8,
    textAlign: 'center',
  },
  playersSelector: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  playerButton: {
    padding: 12,
    borderRadius: 24,
    backgroundColor: Colors.neutral.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  playerButtonDisabled: {
    opacity: 0.3,
  },
  playersDisplay: {
    alignItems: 'center',
    marginHorizontal: 32,
  },
  playersNumber: {
    fontSize: 36,
    fontWeight: '700',
    color: Colors.neutral.charcoal,
    lineHeight: 42,
  },
  playersLabel: {
    fontSize: 14,
    color: Colors.neutral.slate,
    marginTop: 4,
  },
  holesSelector: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
  },
  holesDisplay: {
    alignItems: 'center',
    marginHorizontal: 32,
  },
  holesNumber: {
    fontSize: 36,
    fontWeight: '700',
    color: Colors.neutral.charcoal,
    lineHeight: 42,
  },
  holesLabel: {
    fontSize: 14,
    color: Colors.neutral.slate,
    marginTop: 4,
  },
  optionButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.neutral.mist,
    alignItems: 'center',
  },
  optionButtonLarge: {
    paddingVertical: 16,
  },
  optionButtonActive: {
    borderColor: Colors.primary.navy,
    backgroundColor: Colors.primary.lightBlue,
  },
  optionText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.neutral.charcoal,
  },
  optionTextActive: {
    color: Colors.primary.navy,
  },
  pricePreview: {
    backgroundColor: Colors.neutral.snow,
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 32,
    borderWidth: 1,
    borderColor: Colors.neutral.pearl,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  priceLabel: {
    fontSize: 14,
    color: Colors.neutral.slate,
    textAlign: 'left',
  },
  priceValue: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.primary.navy,
    textAlign: 'right',
  },
  priceError: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.semantic.error,
    textAlign: 'center',
  },
  priceContainer: {
    alignItems: 'center',
  },
  priceSubtext: {
    fontSize: 12,
    color: Colors.neutral.slate,
    marginTop: 4,
    textAlign: 'center',
  },
  nextButton: {
    backgroundColor: Colors.primary.navy,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  nextButtonDisabled: {
    backgroundColor: Colors.neutral.mist,
  },
  nextButtonText: {
    color: Colors.neutral.white,
    fontSize: 16,
    fontWeight: '700',
  },
  // Styles pour la gestion d'erreur globale
  globalErrorContainer: {
    backgroundColor: Colors.semantic.errorLight,
    borderRadius: 8,
    margin: 16,
    marginTop: 8,
  },
  globalErrorContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 8,
  },
  globalErrorText: {
    flex: 1,
    fontSize: 14,
    color: Colors.semantic.error,
    lineHeight: 18,
  },
  errorCloseButton: {
    padding: 4,
  },
  // Styles pour le loading global
  globalLoadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  globalLoadingContent: {
    backgroundColor: Colors.neutral.white,
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    minWidth: 120,
  },
  globalLoadingText: {
    fontSize: 16,
    color: Colors.neutral.charcoal,
    marginTop: 12,
    textAlign: 'center',
  },
  // Styles FAB étendu (vrai FAB avec icône + texte)
  fabExtended: {
    position: 'absolute',
    bottom: 80,
    alignSelf: 'center',
    backgroundColor: Colors.primary.navy,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 28,
    shadowColor: Colors.neutral.charcoal,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 12,
    zIndex: 1000,
    minWidth: 120,
  },
  fabExtendedText: {
    color: Colors.neutral.white,
    fontSize: 16,
    fontWeight: '600',
  },
  fabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  // Styles FAB rond (action finale)
  fab: {
    position: 'absolute',
    bottom: 80,
    alignSelf: 'center',
    backgroundColor: Colors.primary.electric,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 28,
    shadowColor: Colors.primary.electric,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 12,
    zIndex: 1000,
    minWidth: 100,
  },
  fabText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.neutral.white,
  },
  // Styles pour les champs de saisie des joueurs supplémentaires
  playersInfoSection: {
    marginBottom: 24,
  },
  playerInputRow: {
    flexDirection: 'row',
    gap: 12,
  },
  playerInput: {
    flex: 1,
    backgroundColor: Colors.neutral.white,
    borderWidth: 1,
    borderColor: Colors.neutral.pearl,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: Colors.neutral.charcoal,
  },
  playerInputLeft: {
    marginRight: 6,
  },
  playerInputRight: {
    marginLeft: 6,
  },
});
