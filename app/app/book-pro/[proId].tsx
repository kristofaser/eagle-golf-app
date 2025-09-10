import React, { useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { LocaleConfig } from 'react-native-calendars';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, Elevation } from '@/constants/theme';
import { Text } from '@/components/atoms';
import { useAuth } from '@/hooks/useAuth';
import { profileService } from '@/services/profile.service';
import { golfCourseService } from '@/services/golf-course.service';
import { pricingService } from '@/services/pricing.service';
import { bookingService } from '@/services/booking.service';
import { amateurAvailabilityService } from '@/services/amateur-availability.service';
import { paymentService } from '@/services/payment.service';
import { PaymentSheet } from '@/components/organisms/PaymentSheet';
import { useStripe } from '@stripe/stripe-react-native';
import { supabase } from '@/utils/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { useAsyncOperation } from '@/hooks/useAsyncOperation';
import { BookingStepIndicator } from '@/components/organisms/BookingStepIndicator';
import { DateSelectionStep } from '@/components/organisms/DateSelectionStep';
import { TimeSlotSelectionStep } from '@/components/organisms/TimeSlotSelectionStep';
import { BookingConfigurationStep } from '@/components/organisms/BookingConfigurationStep';
import { useBookingState, type TimeSlot, type Step } from '@/hooks/useBookingState';
import { useBookingValidation } from '@/hooks/useBookingValidation';
import { usePriceCalculation } from '@/hooks/usePriceCalculation';

// Configuration du calendrier en français
LocaleConfig.locales['fr'] = {
  monthNames: [
    'Janvier',
    'Février',
    'Mars',
    'Avril',
    'Mai',
    'Juin',
    'Juillet',
    'Août',
    'Septembre',
    'Octobre',
    'Novembre',
    'Décembre',
  ],
  monthNamesShort: [
    'Janv.',
    'Févr.',
    'Mars',
    'Avril',
    'Mai',
    'Juin',
    'Juil.',
    'Août',
    'Sept.',
    'Oct.',
    'Nov.',
    'Déc.',
  ],
  dayNames: ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'],
  dayNamesShort: ['Dim.', 'Lun.', 'Mar.', 'Mer.', 'Jeu.', 'Ven.', 'Sam.'],
  today: "Aujourd'hui",
};
LocaleConfig.defaultLocale = 'fr';

// ✅ TYPES DÉPLACÉS vers useBookingState hook

const STEPS = [
  { id: 1, title: 'Date', icon: 'calendar-outline' },
  { id: 2, title: 'Créneaux', icon: 'time-outline' },
  { id: 3, title: 'Configuration', icon: 'settings-outline' },
  { id: 4, title: 'Récapitulatif', icon: 'list-outline' },
  { id: 5, title: 'Confirmation', icon: 'checkmark-circle-outline' },
];

export default function BookProScreen() {
  const { proId, proName, players: initialPlayers, courseId, courseName } = useLocalSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  const insets = useSafeAreaInsets();

  // ✅ HOOKS REFACTORISÉS - Gestion d'état centralisée
  const bookingState = useBookingState(parseInt(initialPlayers as string) || 1);
  const priceCalculation = usePriceCalculation();
  const validation = useBookingValidation({
    currentStep: bookingState.currentStep,
    selectedDate: bookingState.selectedDate,
    selectedSlot: bookingState.selectedSlot,
    numberOfPlayers: bookingState.numberOfPlayers,
    calculatedPrice: priceCalculation.calculatedPrice,
    bookingConfirmed: bookingState.bookingConfirmed,
  });

  // ✅ HOOKS ASYNC REFACTORISÉS avec useAsyncOperation
  const slotsOperation = useAsyncOperation<TimeSlot[]>();
  const paymentOperation = useAsyncOperation<string>();

  // Utiliser React Query pour charger le profil du pro
  const { data: proProfile, isLoading: isLoadingProfile } = useQuery({
    queryKey: ['profile', proId],
    queryFn: async () => {
      const { data, error } = await profileService.getProfile(proId as string);
      if (error) throw error;
      return data;
    },
    enabled: !!proId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Utiliser React Query pour charger les disponibilités du pro (nouveau système)
  const { data: proDailyAvailabilities = [], isLoading: isLoadingAvailability } = useQuery({
    queryKey: ['proAvailabilities', proId, bookingState.selectedCourse || courseId],
    queryFn: async () => {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() + 4); // 4 jours à partir d'aujourd'hui
      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + 3); // 3 mois pour capturer toutes les disponibilités

      // Utiliser courseId passé en paramètre ou selectedCourse de bookingState
      const golfCourseId = bookingState.selectedCourse || (courseId as string) || undefined;
      
      const { data: availabilities } = await amateurAvailabilityService.getProAvailableDays(
        proId as string,
        startDate.toISOString().split('T')[0],
        endDate.toISOString().split('T')[0],
        golfCourseId // Filtrer par parcours sélectionné
      );
      
      return availabilities || [];
    },
    enabled: !!proId && !!(bookingState.selectedCourse || courseId),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Utiliser React Query pour charger les tarifs du pro
  const { data: pricing = [], isLoading: isLoadingPricing } = useQuery({
    queryKey: ['proPricing', proId],
    queryFn: async () => {
      const proPricing = await pricingService.getProPricing(proId as string);
      return proPricing || [];
    },
    enabled: !!proId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Utiliser React Query pour charger les parcours de golf
  const { data: golfCourses = [] } = useQuery({
    queryKey: ['golfCourses'],
    queryFn: async () => {
      const { data, error } = await golfCourseService.listGolfCourses();
      if (error) throw error;
      return data || [];
    },
    staleTime: 1000 * 60 * 30, // 30 minutes (les parcours changent rarement)
  });

  // Utiliser React Query pour charger les réservations existantes
  const { data: existingBookings = [] } = useQuery({
    queryKey: ['bookings', proId, 'upcoming'],
    queryFn: async () => {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() + 4);
      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + 3); // 3 mois pour correspondre aux disponibilités

      // Récupérer toutes les réservations confirmées ET pending
      const { data, error } = await bookingService.listBookings({
        userId: proId as string,
        startDate: startDate.toISOString().split('T')[0] as string,
        endDate: endDate.toISOString().split('T')[0] as string,
        // Pas de filtre sur status pour récupérer toutes les réservations
      });

      if (error) {
        console.error('❌ Erreur chargement réservations:', error);
        throw error;
      }

      // Filtrer côté client pour garder seulement confirmed et pending
      const filteredBookings = (data || []).filter(
        (booking) => booking.status === 'confirmed' || booking.status === 'pending'
      );

      return filteredBookings;
    },
    enabled: !!proId,
    staleTime: 1000 * 60 * 1, // 1 minute pour plus de réactivité
  });

  // État de chargement global
  const loading =
    isLoadingProfile || isLoadingAvailability || isLoadingPricing || slotsOperation.loading;

  // Définir le parcours par défaut une fois chargé
  useEffect(() => {
    // Si un courseId est passé en paramètre, l'utiliser en priorité
    if (courseId && typeof courseId === 'string') {
      bookingState.setSelectedCourse(courseId);
    } else if (golfCourses.length > 0 && !bookingState.selectedCourse) {
      bookingState.setSelectedCourse(golfCourses[0].id);
    }
  }, [golfCourses, courseId]);

  // Charger les créneaux disponibles quand la date change
  useEffect(() => {
    if (bookingState.selectedDate && proId) {
      loadAvailableSlots();
    }
  }, [bookingState.selectedDate]);

  // Recalculer le prix quand les paramètres changent
  useEffect(() => {
    // Pour les étapes 1-2, afficher le prix minimum
    // Pour l'étape 3+, afficher le prix selon la configuration
    if (bookingState.currentStep < 3) {
      calculateMinPrice();
    } else {
      calculatePrice();
    }
  }, [bookingState.numberOfPlayers, bookingState.holes, pricing, bookingState.currentStep]);

  // Fonction supprimée car remplacée par React Query

  // ✅ REFACTORISÉ avec useAsyncOperation
  const loadAvailableSlots = async () => {
    if (!bookingState.selectedDate) {
      bookingState.setAvailableSlots([]);
      return;
    }

    const slots = await slotsOperation.execute(async () => {
      return await amateurAvailabilityService.getAvailableSlotsForDate(
        proId as string,
        bookingState.selectedDate
      );
    });

    if (slots) {
      bookingState.setAvailableSlots(slots);
    } else if (slotsOperation.error) {
      console.error('Erreur chargement créneaux:', slotsOperation.error);
      bookingState.setAvailableSlots([]);
    }
  };

  const calculateMinPrice = useCallback(() => {
    if (!pricing || pricing.length === 0) {
      priceCalculation.setPrices({ calculatedPrice: 0 });
      return;
    }

    // Trouver le prix minimum pour 1 joueur uniquement
    const pricesForOnePlayer = pricing
      .filter((p) => p.players_count === 1 && p.price > 0)
      .map((p) => p.price);

    if (pricesForOnePlayer.length === 0) {
      priceCalculation.setPrices({ calculatedPrice: 0 });
      return;
    }

    // Utiliser le prix minimum pour 1 joueur (prix déjà en euros depuis le service)
    const minPriceInEuros = Math.min(...pricesForOnePlayer);

    // Appliquer la commission de 20% sur le prix minimum pour l'affichage préliminaire
    const totalWithCommission = Math.round(minPriceInEuros * 1.2);
    priceCalculation.setPrices({ calculatedPrice: totalWithCommission });
  }, [pricing, bookingState.numberOfPlayers, bookingState.holes, priceCalculation]);

  const calculatePrice = useCallback(() => {
    if (!pricing || pricing.length === 0) {
      priceCalculation.setPrices({ calculatedPrice: 0, proFee: 0, platformFee: 0 });
      return;
    }

    // Chercher le prix exact configuré par le pro pour cette combinaison
    const exactPrice = pricing.find(
      (p) => p.holes === bookingState.holes && p.players_count === bookingState.numberOfPlayers
    );

    if (exactPrice && exactPrice.price > 0) {
      // Prix exact trouvé - le prix est PAR JOUEUR
      const totalProFee = exactPrice.price * bookingState.numberOfPlayers;
      
      // Appliquer la commission de 20%
      const totalWithCommission = Math.round(totalProFee * 1.2);
      const commission = totalWithCommission - totalProFee;

      priceCalculation.setPrices({
        calculatedPrice: totalWithCommission,
        proFee: totalProFee,
        platformFee: commission,
      });
    } else {
      // Pas de prix configuré - utiliser les prix par défaut du hook
      const prices = priceCalculation.calculatePrices({
        numberOfPlayers: bookingState.numberOfPlayers,
        holes: bookingState.holes,
      });

      priceCalculation.setPrices(prices);
    }
  }, [pricing, bookingState.numberOfPlayers, bookingState.holes, priceCalculation]);

  // ✅ REFACTORISÉ avec hooks - Navigation avec validation intégrée
  const handleNextStep = () => {
    validation.validateAndProceed(bookingState.currentStep, () => {
      bookingState.goToNextStep();
    });
  };

  const handlePreviousStep = () => {
    bookingState.goToPreviousStep();
  };

  // ✅ REFACTORISÉ - handlePaymentSuccess sans double paymentOperation.execute
  const handlePaymentSuccess = async (paymentIntentId: string) => {
    if (!user) {
      console.error('❌ Aucun utilisateur connecté');
      Alert.alert('Erreur', 'Vous devez être connecté pour réserver');
      return;
    }

    try {
      // Récupérer l'ID du profil de l'utilisateur depuis la table profiles
      const { data: userProfile } = await profileService.getProfile(user.id);
      if (!userProfile) {
        throw new Error('Profil utilisateur introuvable');
      }

      // Vérifier que l'utilisateur ne réserve pas avec lui-même
      if (userProfile.id === proId) {
        Alert.alert('Action impossible', 'Vous ne pouvez pas réserver une partie avec vous-même.');
        throw new Error('Réservation avec soi-même interdite');
      }

      // Vérifier si l'utilisateur a un profil amateur, sinon le créer
      const { data: amateurProfile } = await supabase
        .from('amateur_profiles')
        .select('*')
        .eq('user_id', userProfile.id)
        .single();

      if (!amateurProfile) {
        // Créer un profil amateur basique
        const { error: createError } = await supabase.from('amateur_profiles').insert({
          user_id: userProfile.id,
          experience_level: 'intermediate',
          created_at: new Date().toISOString(),
        });

        if (createError) {
          console.error('Erreur création profil amateur:', createError);
          throw new Error('Impossible de créer le profil amateur');
        }
      }

      // Récupérer les informations du créneau sélectionné
      const actualStartTime = bookingState.selectedSlot!.hour;

      // Vérifier que le jour est toujours disponible
      const { data: dayAvailability } = await amateurAvailabilityService.getProAvailableDays(
        proId as string,
        bookingState.selectedDate,
        bookingState.selectedDate
      );

      if (!dayAvailability || dayAvailability.length === 0) {
        throw new Error("Ce jour n'est plus disponible. Veuillez choisir une autre date.");
      }

      // Vérifier que le créneau spécifique est toujours libre
      const existingBookings = await amateurAvailabilityService.getExistingBookingsForDate(
        proId as string,
        bookingState.selectedDate
      );

      const slotTaken = existingBookings.some(
        (booking) => booking.start_time?.substring(0, 5) === actualStartTime.substring(0, 5)
      );

      if (slotTaken) {
        throw new Error(
          'Ce créneau a été réservé par un autre utilisateur. Veuillez choisir un autre horaire.'
        );
      }

      // Préparer les données de réservation
      const bookingData = {
        amateur_id: userProfile.id,
        pro_id: proId as string,
        golf_course_id: bookingState.selectedCourse, // Use the selected golf course
        booking_date: bookingState.selectedDate,
        start_time: actualStartTime,
        number_of_players: bookingState.numberOfPlayers,
        total_amount: priceCalculation.calculatedPrice * 100, // en centimes
        pro_fee: priceCalculation.proFee * 100,
        platform_fee: priceCalculation.platformFee * 100,
        payment_intent_id: paymentIntentId,
        payment_status: 'paid',
        status: 'pending' as const,
      };

      // Confirmer le paiement et créer la réservation
      const result = await paymentService.confirmPaymentAndBooking(paymentIntentId, bookingData);

      if (!result.success) {
        throw new Error(result.error || 'Erreur lors de la confirmation');
      }

      const newBookingId = result.booking_id;
      if (!newBookingId) {
        throw new Error('Erreur lors de la création de la réservation');
      }

      // Incrémenter le compteur de réservations dans pro_availabilities
      if (bookingState.selectedCourse) {
        const bookingIncremented = await amateurAvailabilityService.incrementBookingCount(
          proId as string,
          bookingState.selectedDate,
          bookingState.selectedCourse,
          newBookingId
        );

        if (!bookingIncremented) {
          console.warn('Impossible d\'incrémenter le compteur de réservations');
          // On continue quand même car la réservation est créée
        }
      } else {
        console.warn('⚠️ Aucun parcours sélectionné pour incrémenter le compteur');
      }
      
      // Mettre à jour l'état immédiatement
      bookingState.setBookingId(newBookingId);
      bookingState.setBookingConfirmed(false); // En attente de validation admin
      bookingState.setCurrentStep(5);

      // Afficher le message de succès
      Alert.alert(
        'Paiement réussi !',
        'Votre paiement a été traité avec succès. Votre réservation est en attente de validation par notre équipe.'
      );

    } catch (error: any) {
      console.error('❌ Erreur dans handlePaymentSuccess:', error);
      Alert.alert(
        'Erreur',
        error.message || 'Une erreur est survenue après le paiement. Contactez le support.'
      );
    }
  };

  const handlePaymentError = (error: string) => {
    Alert.alert('Erreur de paiement', error);
  };

  // Nouvelle fonction handlePayment pour Option 2
  const handlePayment = async () => {
    if (!user) {
      Alert.alert('Erreur', 'Vous devez être connecté pour réserver');
      return;
    }

    await paymentOperation.execute(async () => {
      // Créer le Payment Intent via notre service
      const response = await paymentService.createPaymentIntent({
        amount: priceCalculation.calculatedPrice * 100,
        currency: 'eur',
        metadata: {
          pro_id: proId as string,
          amateur_id: user.id,
          booking_date: bookingState.selectedDate,
          start_time: bookingState.selectedSlot?.hour || '',
          description: `Réservation golf avec ${proName || 'professionnel'} le ${formatDateShort(bookingState.selectedDate)} à ${bookingState.selectedSlot?.time}`,
        },
      });

      if (response.error) {
        console.error('❌ Erreur création Payment Intent:', response.error);
        throw new Error(response.error);
      }

      // Initialiser le Payment Sheet
      const { error } = await initPaymentSheet({
        merchantDisplayName: 'Eagle Golf',
        paymentIntentClientSecret: response.client_secret,
        returnURL: 'eagle://payment-complete',
        customFlow: false,
        style: 'alwaysDark',
        googlePay: {
          merchantCountryCode: 'FR',
          testEnv: __DEV__,
        },
        applePay: {
          merchantCountryCode: 'FR',
        },
        allowsDelayedPaymentMethods: false,
      });

      if (error) {
        console.error('❌ Erreur init Payment Sheet:', error.message);
        throw new Error(error.message);
      }

      // Présenter le Payment Sheet
      const { error: paymentError } = await presentPaymentSheet();

      if (paymentError) {
        if (paymentError.code === 'Canceled') {
          return null; // Retourner null pour l'annulation
        } else {
          console.error('❌ Erreur Payment Sheet:', paymentError.message);
          throw new Error(paymentError.message);
        }
      }

      // Paiement réussi - retourner l'ID pour handlePaymentSuccess
      return response.payment_intent_id;
    });

    // Gérer le résultat
    if (paymentOperation.data) {
      await handlePaymentSuccess(paymentOperation.data);
    } else if (paymentOperation.error) {
      console.error('❌ Erreur paiement détectée:', paymentOperation.error.message);
      handlePaymentError(paymentOperation.error.message || 'Erreur lors du paiement');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const formatDateShort = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    });
  };

  // Vérifier si le pro est disponible un jour donné (nouveau système pro_availabilities)
  const isProAvailableOnDate = (dateString: string) => {
    if (!proDailyAvailabilities || proDailyAvailabilities.length === 0) {
      return false;
    }

    // Chercher la disponibilité pour cette date dans le nouveau système
    const dayAvailability = proDailyAvailabilities.find((avail) => avail.date === dateString);

    if (!dayAvailability || !dayAvailability.is_available || dayAvailability.is_booked) {
      return false;
    }

    // Vérifier s'il y a des réservations confirmées pour cette date et parcours
    // On utilise les données existingBookings si disponibles
    if (existingBookings && existingBookings.length > 0) {
      const currentCourseId = bookingState.selectedCourse || (courseId as string);
      const hasBooking = existingBookings.some(
        (booking) => booking.booking_date === dateString && booking.golf_course_id === currentCourseId
      );
      return !hasBooking; // Libre si pas de réservation sur ce parcours
    }

    // Disponible si pas de réservation trouvée
    return true;
  };

  // Générer les dates marquées pour le calendrier (nouveau système journalier)
  const getMarkedDates = () => {
    const marked: any = {};

    if (!proDailyAvailabilities || proDailyAvailabilities.length === 0) {
      return marked;
    }

    // Marquer toutes les dates depuis pro_daily_availabilities
    let availableDates = 0;
    proDailyAvailabilities.forEach((avail) => {
      if (avail.is_available) {
        // Vérifier si la date est réellement libre
        const isReallyAvailable = isProAvailableOnDate(avail.date);

        if (isReallyAvailable) {
          // Jours disponibles : fond cercle vert plein avec texte blanc
          marked[avail.date] = {
            customStyles: {
              container: {
                backgroundColor: Colors.semantic.success,
                borderRadius: 20,
                width: 32,
                height: 32,
                justifyContent: 'center',
                alignItems: 'center',
              },
              text: {
                color: Colors.neutral.white,
                fontWeight: '600',
              },
            },
          };
          availableDates++;
        }
      } else if (!avail.is_available) {
        // Jours non disponibles : non cliquables, style par défaut
        marked[avail.date] = {
          disabled: true,
          disableTouchEvent: true,
        };
      }
    });

    // Marquer la date sélectionnée
    if (bookingState.selectedDate) {
      const hasAvailability = isProAvailableOnDate(bookingState.selectedDate);
      if (hasAvailability) {
        // Jour sélectionné disponible : cercle vert avec fond blanc et texte noir gras
        marked[bookingState.selectedDate] = {
          customStyles: {
            container: {
              backgroundColor: Colors.neutral.white,
              borderRadius: 20,
              width: 32,
              height: 32,
              justifyContent: 'center',
              alignItems: 'center',
              borderWidth: 2,
              borderColor: Colors.semantic.success,
            },
            text: {
              color: Colors.neutral.charcoal,
              fontWeight: '700',
            },
          },
        };
      }
    }

    return marked;
  };

  // Obtenir la date minimum (4 jours après aujourd'hui pour validation avec le golf)
  const getMinDate = () => {
    const minDate = new Date();
    minDate.setDate(minDate.getDate() + 4); // Ajouter 4 jours pour le délai de validation
    return minDate.toISOString().split('T')[0];
  };

  // Obtenir la date maximum (3 mois)
  const getMaxDate = () => {
    const maxDate = new Date();
    maxDate.setMonth(maxDate.getMonth() + 3); // 3 mois pour correspondre aux disponibilités
    return maxDate.toISOString().split('T')[0];
  };

  // ✅ REMPLACÉ par BookingStepIndicator

  // Rendu du contenu selon l'étape
  const renderStepContent = () => {
    switch (bookingState.currentStep) {
      case 1:
        return renderStep1();
      case 2:
        return renderStep2();
      case 3:
        return renderStep3();
      case 4:
        return renderStep4();
      case 5:
        return renderStep5();
      default:
        return null;
    }
  };

  // ✅ ÉTAPE 1 : Remplacé par DateSelectionStep
  const renderStep1 = () => (
    <DateSelectionStep
      selectedDate={bookingState.selectedDate}
      markedDates={getMarkedDates()}
      minDate={getMinDate()}
      maxDate={getMaxDate()}
      isProAvailableOnDate={isProAvailableOnDate}
      onDateSelect={bookingState.setSelectedDate}
    />
  );

  // ✅ ÉTAPE 2 : Remplacé par TimeSlotSelectionStep
  const renderStep2 = () => (
    <TimeSlotSelectionStep
      selectedDate={bookingState.selectedDate}
      selectedSlot={bookingState.selectedSlot}
      availableSlots={bookingState.availableSlots}
      formatDateShort={formatDateShort}
      onSlotSelect={bookingState.setSelectedSlot}
    />
  );

  // ✅ ÉTAPE 3 : Remplacé par BookingConfigurationStep
  const renderStep3 = () => (
    <BookingConfigurationStep
      numberOfPlayers={bookingState.numberOfPlayers}
      holes={bookingState.holes}
      onNumberOfPlayersChange={bookingState.setNumberOfPlayers}
      onHolesChange={bookingState.setHoles}
    />
  );

  // Étape 4 : Récapitulatif
  const renderStep4 = () => (
    <ScrollView showsVerticalScrollIndicator={false}>
      {/* Récapitulatif de la réservation */}
      <View style={styles.section}>
        <Text variant="h4" weight="semiBold" color="charcoal" style={styles.sectionTitle}>
          Votre réservation
        </Text>

        <View style={styles.summaryRow}>
          <View style={styles.summaryIcon}>
            <Ionicons name="person-outline" size={20} color={Colors.primary.accent} />
          </View>
          <View style={styles.summaryContent}>
            <Text variant="caption" color="iron">
              Professionnel
            </Text>
            <Text variant="body" weight="medium" color="charcoal">
              {proName}
            </Text>
          </View>
        </View>

        <View style={styles.summaryRow}>
          <View style={styles.summaryIcon}>
            <Ionicons name="golf-outline" size={20} color={Colors.primary.accent} />
          </View>
          <View style={styles.summaryContent}>
            <Text variant="caption" color="iron">
              Parcours
            </Text>
            <Text variant="body" weight="medium" color="charcoal">
              {golfCourses.find((c) => c.id === bookingState.selectedCourse)?.name}
            </Text>
          </View>
        </View>

        <View style={styles.summaryRow}>
          <View style={styles.summaryIcon}>
            <Ionicons name="calendar-outline" size={20} color={Colors.primary.accent} />
          </View>
          <View style={styles.summaryContent}>
            <Text variant="caption" color="iron">
              Date et heure
            </Text>
            <Text variant="body" weight="medium" color="charcoal">
              {bookingState.selectedDate && formatDate(bookingState.selectedDate)}
            </Text>
            <Text variant="body" color="charcoal">
              {bookingState.selectedSlot?.time}
            </Text>
          </View>
        </View>

        <View style={styles.summaryRow}>
          <View style={styles.summaryIcon}>
            <Ionicons name="flag-outline" size={20} color={Colors.primary.accent} />
          </View>
          <View style={styles.summaryContent}>
            <Text variant="caption" color="iron">
              Configuration
            </Text>
            <Text variant="body" weight="medium" color="charcoal">
              {bookingState.holes} trous • {bookingState.numberOfPlayers}{' '}
              {bookingState.numberOfPlayers === 1 ? 'joueur' : 'joueurs'}
            </Text>
          </View>
        </View>

        {/* Note green fee */}
        <Text variant="caption" color="iron" style={styles.priceNote}>
          Le green fee est à régler séparément au golf.
        </Text>

        {/* Conditions d'annulation intégrées */}
        <View style={styles.conditionsContainer}>
          <Text variant="body" weight="semiBold" color="charcoal" style={styles.conditionsTitle}>
            Conditions d'annulation
          </Text>
          <View style={styles.conditionRow}>
            <Ionicons name="checkmark-circle-outline" size={20} color={Colors.semantic.success} />
            <Text variant="body" color="charcoal" style={styles.conditionText}>
              Annulation gratuite jusqu'à 24h avant
            </Text>
          </View>
          <View style={styles.conditionRow}>
            <Ionicons name="alert-circle-outline" size={20} color={Colors.semantic.warning} />
            <Text variant="body" color="charcoal" style={styles.conditionText}>
              50% de frais moins de 24h avant
            </Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );

  // Étape 5 : Confirmation
  const renderStep5 = () => (
    <View style={styles.confirmationContainer}>
      <View style={styles.confirmationContent}>
        <View style={styles.successIcon}>
          <Ionicons name="checkmark-circle" size={80} color={Colors.semantic.success} />
        </View>
        <Text variant="h2" weight="bold" color="charcoal" style={styles.successTitle}>
          Paiement réussi !
        </Text>
        <Text variant="body" color="iron" style={styles.successText}>
          Votre réservation est en attente de validation par notre équipe. Vous recevrez une confirmation par email une fois validée.
        </Text>

        <View style={styles.confirmationDetails}>
          <Text variant="body" weight="semiBold" color="charcoal">
            {proName}
          </Text>
          <Text variant="body" color="iron">
            {bookingState.selectedDate && formatDate(bookingState.selectedDate)} à{' '}
            {bookingState.selectedSlot?.time}
          </Text>
          <Text variant="body" color="iron">
            {golfCourses.find((c) => c.id === bookingState.selectedCourse)?.name}
          </Text>
        </View>

        <TouchableOpacity style={styles.homeButton} onPress={() => router.replace('/profile')}>
          <Text variant="body" weight="semiBold" color="white">
            Voir mes réservations
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary.accent} />
        <Text variant="body" color="iron" style={styles.loadingText}>
          Chargement...
        </Text>
      </View>
    );
  }

  // ✅ AJOUTÉ: Affichage des erreurs useAsyncOperation
  const hasAsyncError = slotsOperation.error || paymentOperation.error;
  if (hasAsyncError) {
    return (
      <View style={styles.loadingContainer}>
        <Ionicons name="alert-circle" size={48} color={Colors.semantic.error} />
        <Text variant="body" color="iron" style={styles.loadingText}>
          {slotsOperation.error?.message ||
            paymentOperation.error?.message ||
            'Une erreur est survenue'}
        </Text>
        <TouchableOpacity
          style={[
            styles.navigationButtons,
            { backgroundColor: Colors.primary.accent, marginTop: 16 },
          ]}
          onPress={() => {
            slotsOperation.reset();
            paymentOperation.reset();
            router.back();
          }}
        >
          <Text variant="body" color="white">
            Retour
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleClose = () => {
    if (bookingState.currentStep > 1 && bookingState.currentStep < 5) {
      Alert.alert('Annuler la réservation ?', 'Votre réservation en cours sera perdue.', [
        { text: 'Continuer', style: 'cancel' },
        {
          text: 'Annuler la réservation',
          style: 'destructive',
          onPress: () => router.back(),
        },
      ]);
    } else {
      router.back();
    }
  };

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />

      <View style={styles.container}>
        {/* Header personnalisé comme les autres écrans */}
        <View style={[styles.header, { paddingTop: insets.top }]}>
          <View style={styles.headerContent}>
            <View style={styles.headerButton} />

            <Text variant="h2" weight="bold" color="charcoal" style={styles.headerTitle}>
              Réserver
            </Text>

            {bookingState.currentStep < 5 ? (
              <TouchableOpacity
                style={styles.headerButton}
                onPress={handleClose}
                activeOpacity={0.7}
              >
                <Ionicons name="close" size={24} color={Colors.neutral.charcoal} />
              </TouchableOpacity>
            ) : (
              <View style={styles.headerButton} />
            )}
          </View>
        </View>
        {/* Header Pro */}
        <View style={styles.proHeader}>
          <View style={styles.proInfo}>
            <Text variant="h3" weight="semiBold" color="charcoal">
              {proName}
            </Text>
            <Text variant="body" color="iron">
              {courseName ? courseName : 'Professionnel de golf'}
            </Text>
          </View>
          <View style={styles.priceContainer}>
            {bookingState.currentStep < 3 ? (
              <Text variant="caption" color="iron">
                À partir de
              </Text>
            ) : (
              <Text variant="caption" color="iron">
                Total à payer
              </Text>
            )}
            <Text variant="h3" weight="bold" color="accent">
              {priceCalculation.calculatedPrice}€
            </Text>
          </View>
        </View>

        {/* Titre de l'étape courante */}
        <View style={styles.stepTitleContainer}>
          <Text variant="h3" weight="semiBold" color="charcoal">
            {STEPS.find((step) => step.id === bookingState.currentStep)?.title}
          </Text>
        </View>

        {/* Barre de progression */}
        <BookingStepIndicator currentStep={bookingState.currentStep} steps={STEPS} />

        {/* Contenu de l'étape */}
        <View style={styles.content}>{renderStepContent()}</View>

        {/* Boutons de navigation */}
        {bookingState.currentStep < 5 && (
          <View style={styles.navigationButtons}>
            {bookingState.currentStep > 1 && (
              <TouchableOpacity style={styles.backButton} onPress={handlePreviousStep}>
                <Ionicons name="arrow-back" size={20} color={Colors.neutral.charcoal} />
                <Text variant="body" weight="medium" color="charcoal">
                  Retour
                </Text>
              </TouchableOpacity>
            )}

            {bookingState.currentStep < 4 ? (
              <TouchableOpacity
                style={[
                  styles.nextButton,
                  bookingState.currentStep === 1 &&
                    !bookingState.selectedDate &&
                    styles.buttonDisabled,
                  bookingState.currentStep === 2 &&
                    (!bookingState.selectedSlot || !bookingState.selectedCourse) &&
                    styles.buttonDisabled,
                ]}
                onPress={handleNextStep}
                disabled={
                  (bookingState.currentStep === 1 && !bookingState.selectedDate) ||
                  (bookingState.currentStep === 2 &&
                    (!bookingState.selectedSlot || !bookingState.selectedCourse))
                }
              >
                <Text variant="body" weight="semiBold" color="white">
                  Continuer
                </Text>
                <Ionicons name="arrow-forward" size={20} color={Colors.neutral.white} />
              </TouchableOpacity>
            ) : (
              // Bouton de paiement dans le système standard
              <TouchableOpacity 
                style={styles.nextButton}
                onPress={handlePayment}
                disabled={paymentOperation.loading}
              >
                {paymentOperation.loading ? (
                  <ActivityIndicator color={Colors.neutral.white} size="small" />
                ) : (
                  <>
                    <Text variant="body" weight="semiBold" color="white">
                      Payer {priceCalculation.calculatedPrice}€
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.neutral.background,
  },
  header: {
    backgroundColor: Colors.neutral.ball,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral.mist,
    elevation: 0,
    shadowOpacity: 0,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.m,
    paddingVertical: Spacing.m,
    height: 56,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
  },
  stepTitleContainer: {
    paddingHorizontal: Spacing.m,
    paddingVertical: Spacing.s,
    backgroundColor: Colors.neutral.white,
    alignItems: 'center',
  },
  headerButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.neutral.background,
  },
  loadingText: {
    marginTop: Spacing.m,
  },
  proHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.neutral.white,
    padding: Spacing.l,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral.mist,
  },
  proInfo: {
    flex: 1,
  },
  priceContainer: {
    alignItems: 'flex-end',
  },
  progressContainer: {
    backgroundColor: Colors.neutral.white,
    paddingVertical: Spacing.m,
    paddingHorizontal: Spacing.s,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral.mist,
  },
  progressSteps: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepWrapper: {
    alignItems: 'center',
    minWidth: 50,
  },
  stepCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.neutral.mist,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  stepCircleActive: {
    backgroundColor: Colors.primary.accent,
  },
  stepCircleCurrent: {
    backgroundColor: Colors.primary.accent,
    borderWidth: 2,
    borderColor: Colors.primary.skyBlue,
  },
  stepTitle: {
    fontSize: 10,
    textAlign: 'center',
  },
  stepLine: {
    flex: 1,
    height: 2,
    backgroundColor: Colors.neutral.mist,
    marginBottom: 20,
    marginHorizontal: -5,
  },
  stepLineActive: {
    backgroundColor: Colors.primary.accent,
  },
  content: {
    flex: 1,
  },
  section: {
    backgroundColor: Colors.neutral.white,
    padding: Spacing.l,
    marginBottom: Spacing.s,
  },
  sectionTitle: {
    marginBottom: Spacing.m,
  },
  selectedDateTitle: {
    marginBottom: Spacing.xs,
    textAlign: 'center',
  },
  sectionSubtitle: {
    marginBottom: Spacing.m,
    textAlign: 'center',
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: Colors.neutral.mist,
    borderRadius: BorderRadius.medium,
    overflow: 'hidden',
  },
  picker: {
    height: 50,
  },
  slotsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.s,
    justifyContent: 'flex-start',
  },
  calendarLegend: {
    flexDirection: 'row',
    gap: Spacing.m,
    marginBottom: Spacing.s,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendCircle: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  strikethroughText: {
    textDecorationLine: 'line-through',
    textDecorationColor: Colors.semantic.error,
  },
  slotButton: {
    width: '30%',
    padding: Spacing.m,
    backgroundColor: Colors.neutral.background,
    borderRadius: BorderRadius.medium,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.neutral.mist,
    marginBottom: Spacing.s,
  },
  slotButtonSelected: {
    backgroundColor: Colors.primary.accent,
    borderColor: Colors.primary.accent,
  },
  slotButtonDisabled: {
    opacity: 0.5,
    backgroundColor: Colors.neutral.mist,
  },
  noSlotsContainer: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
  },
  noSlotsText: {
    marginTop: Spacing.m,
    textAlign: 'center',
  },
  playersSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.l,
  },
  playerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.neutral.background,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.neutral.mist,
  },
  playerButtonDisabled: {
    opacity: 0.5,
  },
  playersDisplay: {
    alignItems: 'center',
    minWidth: 80,
  },
  holesSelector: {
    flexDirection: 'row',
    gap: Spacing.m,
  },
  holeButton: {
    flex: 1,
    paddingVertical: Spacing.m,
    backgroundColor: Colors.neutral.background,
    borderRadius: BorderRadius.medium,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.neutral.mist,
  },
  holeButtonSelected: {
    backgroundColor: Colors.primary.accent,
    borderColor: Colors.primary.accent,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing.m,
  },
  summaryIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.neutral.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.m,
  },
  summaryContent: {
    flex: 1,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.s,
  },
  priceNote: {
    marginTop: Spacing.m,
    fontStyle: 'italic',
  },
  conditionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.s,
    marginBottom: Spacing.s,
  },
  conditionText: {
    flex: 1,
  },
  conditionsContainer: {
    marginTop: Spacing.m,
    paddingTop: Spacing.m,
  },
  conditionsTitle: {
    marginBottom: Spacing.s,
  },
  totalContainer: {
    marginTop: Spacing.l,
    paddingTop: Spacing.l,
  },
  navigationButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: Spacing.l,
    backgroundColor: Colors.neutral.white,
    borderTopWidth: 1,
    borderTopColor: Colors.neutral.mist,
    ...Elevation.small,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.m,
    paddingHorizontal: Spacing.l,
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    backgroundColor: Colors.primary.accent,
    paddingVertical: Spacing.m,
    paddingHorizontal: Spacing.l,
    borderRadius: BorderRadius.medium,
    marginLeft: 'auto',
  },
  confirmButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    backgroundColor: Colors.primary.accent,
    paddingVertical: Spacing.m,
    paddingHorizontal: Spacing.l,
    borderRadius: BorderRadius.medium,
    marginLeft: 'auto',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  confirmationContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  confirmationContent: {
    alignItems: 'center',
  },
  successIcon: {
    marginBottom: Spacing.l,
  },
  successTitle: {
    marginBottom: Spacing.m,
    textAlign: 'center',
  },
  successText: {
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },
  confirmationDetails: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
    padding: Spacing.l,
    backgroundColor: Colors.neutral.background,
    borderRadius: BorderRadius.medium,
    minWidth: '100%',
  },
  homeButton: {
    backgroundColor: Colors.primary.accent,
    paddingVertical: Spacing.m,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.medium,
  },
});
