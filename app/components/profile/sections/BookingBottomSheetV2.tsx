import React, {
  forwardRef,
  useImperativeHandle,
  useRef,
  useCallback,
  useState,
  useEffect,
} from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import BottomSheet, { BottomSheetView, BottomSheetBackdrop } from '@gorhom/bottom-sheet';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/theme';
import { CalendarStep } from './steps/CalendarStep';
import { TimeSlotStep } from './steps/TimeSlotStep';
import { SummaryStep } from './steps/SummaryStep';
import { PaymentStep } from './steps/PaymentStep';
import { SuccessStep } from './steps/SuccessStep';

// Étapes du parcours de réservation
const BOOKING_STEPS = [
  { id: 1, title: 'Configuration' },
  { id: 2, title: 'Date' },
  { id: 3, title: 'Créneaux' },
  { id: 4, title: 'Récapitulatif' },
  { id: 5, title: 'Paiement' },
  { id: 6, title: 'Confirmation' },
];

interface BookingBottomSheetV2Props {
  proId: string;
  proName: string;
  proPricing: any; // Structure de prix du pro
  selectedCourseId: string;
  selectedCourseName: string;
  onBottomSheetChange?: (isOpen: boolean) => void;
  onBookingComplete?: () => void;
}

export interface BookingBottomSheetV2Ref {
  open: () => void;
  close: () => void;
}

export const BookingBottomSheetV2 = forwardRef<BookingBottomSheetV2Ref, BookingBottomSheetV2Props>(
  (
    {
      proId,
      proName,
      proPricing,
      selectedCourseId,
      selectedCourseName,
      onBottomSheetChange,
      onBookingComplete,
    },
    ref
  ) => {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const bottomSheetRef = useRef<BottomSheet>(null);
    const slideAnimation = useRef(new Animated.Value(0)).current;

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
      totalPrice: 0,
    });

    useImperativeHandle(ref, () => ({
      open: () => {
        setCurrentStep(1); // Reset to first step
        bottomSheetRef.current?.expand();
      },
      close: () => bottomSheetRef.current?.close(),
    }));

    const renderBackdrop = useCallback(
      (props: any) => (
        <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} opacity={0.5} />
      ),
      []
    );

    // Navigation entre étapes
    const goToNextStep = () => {
      if (currentStep < BOOKING_STEPS.length) {
        Animated.spring(slideAnimation, {
          toValue: -(currentStep * 100),
          useNativeDriver: true,
          friction: 8,
          tension: 65,
        }).start();
        setCurrentStep(currentStep + 1);
      }
    };

    const goToPreviousStep = () => {
      if (currentStep > 1) {
        Animated.spring(slideAnimation, {
          toValue: -((currentStep - 2) * 100),
          useNativeDriver: true,
          friction: 8,
          tension: 65,
        }).start();
        setCurrentStep(currentStep - 1);
      }
    };

    // Calcul du prix dynamique
    const calculatePrice = useCallback(
      (players: number, holes: number) => {
        // Logique de calcul basée sur proPricing, players et holes
        // À implémenter selon la structure exacte de proPricing
        const basePrice = 100; // Placeholder
        return basePrice * players;
      },
      [proPricing]
    );

    useEffect(() => {
      const newPrice = calculatePrice(bookingData.players, bookingData.holes);
      if (newPrice !== bookingData.totalPrice) {
        setBookingData((prev) => ({
          ...prev,
          totalPrice: newPrice,
        }));
      }
    }, [bookingData.players, bookingData.holes, bookingData.totalPrice, calculatePrice]);

    // Validation pour passer à l'étape suivante
    useEffect(() => {
      switch (currentStep) {
        case 1:
          setCanGoNext(true); // Toujours possible car valeurs par défaut
          break;
        case 2:
          setCanGoNext(bookingData.date !== null);
          break;
        case 3:
          setCanGoNext(bookingData.timeSlot !== null);
          break;
        case 4:
          setCanGoNext(true); // Récap toujours valide
          break;
        case 5:
          setCanGoNext(false); // Géré par le paiement
          break;
        default:
          setCanGoNext(false);
      }
    }, [currentStep, bookingData]);

    // Déterminer la hauteur du BottomSheet selon l'étape
    const getSnapPoints = () => {
      switch (currentStep) {
        case 1:
          return ['50%']; // Configuration
        case 2:
          return ['65%']; // Calendrier
        case 3:
          return ['55%']; // Créneaux
        case 4:
          return ['60%']; // Récapitulatif
        case 5:
          return ['65%']; // Paiement
        case 6:
          return ['45%']; // Confirmation
        default:
          return ['50%'];
      }
    };

    return (
      <BottomSheet
        ref={bottomSheetRef}
        index={-1}
        snapPoints={getSnapPoints()}
        enablePanDownToClose
        backdropComponent={renderBackdrop}
        handleIndicatorStyle={styles.indicator}
        backgroundStyle={styles.background}
        style={{
          zIndex: 200, // Force un z-index élevé pour passer au-dessus du header
        }}
        onChange={(index) => {
          if (index === -1) {
            setCurrentStep(1); // Reset on close
            onBottomSheetChange?.(false); // Notifier que la bottom sheet est fermée
          } else {
            onBottomSheetChange?.(true); // Notifier que la bottom sheet est ouverte
          }
        }}
      >
        <BottomSheetView style={[styles.content, { paddingBottom: insets.bottom }]}>
          {/* Header avec indicateur de progression */}
          <View style={styles.header}>
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

            <TouchableOpacity
              onPress={() => bottomSheetRef.current?.close()}
              style={styles.navButton}
            >
              <Ionicons name="close" size={24} color={Colors.neutral.charcoal} />
            </TouchableOpacity>
          </View>

          {/* Titre de l'étape courante */}
          <Text style={styles.stepTitle}>{BOOKING_STEPS[currentStep - 1].title}</Text>

          {/* Contenu des étapes */}
          <View style={styles.stepsContainer}>
            {/* Étape 1: Configuration (Joueurs + Trous) */}
            {currentStep === 1 && (
              <View style={styles.stepContent}>
                <Text style={styles.sectionTitle}>Nombre de joueurs</Text>
                <View style={styles.playersSelector}>
                  {[1, 2, 3].map((num) => (
                    <TouchableOpacity
                      key={num}
                      style={[
                        styles.optionButton,
                        bookingData.players === num && styles.optionButtonActive,
                      ]}
                      onPress={() => setBookingData((prev) => ({ ...prev, players: num }))}
                    >
                      <Text
                        style={[
                          styles.optionText,
                          bookingData.players === num && styles.optionTextActive,
                        ]}
                      >
                        {num} {num === 1 ? 'joueur' : 'joueurs'}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={styles.sectionTitle}>Type de parcours</Text>
                <View style={styles.holesSelector}>
                  {[9, 18].map((num) => (
                    <TouchableOpacity
                      key={num}
                      style={[
                        styles.optionButton,
                        styles.optionButtonLarge,
                        bookingData.holes === num && styles.optionButtonActive,
                      ]}
                      onPress={() => setBookingData((prev) => ({ ...prev, holes: num }))}
                    >
                      <Text
                        style={[
                          styles.optionText,
                          bookingData.holes === num && styles.optionTextActive,
                        ]}
                      >
                        {num} trous
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Affichage du prix dynamique */}
                <View style={styles.pricePreview}>
                  <Text style={styles.priceLabel}>Prix estimé</Text>
                  <Text style={styles.priceValue}>
                    {calculatePrice(bookingData.players, bookingData.holes)}€
                  </Text>
                </View>
              </View>
            )}

            {/* Étape 2: Sélection de la date */}
            {currentStep === 2 && (
              <CalendarStep
                selectedDate={bookingData.date}
                onDateSelect={(date) => setBookingData((prev) => ({ ...prev, date }))}
                proId={proId}
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
                proName={proName}
                courseName={selectedCourseName}
              />
            )}

            {/* Étape 5: Paiement */}
            {currentStep === 5 && (
              <PaymentStep
                totalAmount={bookingData.totalPrice}
                onPaymentSuccess={() => {
                  goToNextStep();
                }}
                onPaymentError={(error) => {
                  console.error('Payment error:', error);
                  // Gérer l'erreur de paiement
                }}
                bookingData={bookingData}
              />
            )}

            {/* Étape 6: Confirmation */}
            {currentStep === 6 && (
              <SuccessStep
                proName={proName}
                courseName={selectedCourseName}
                bookingData={bookingData}
              />
            )}
          </View>

          {/* Bouton d'action principal */}
          {currentStep < 6 && (
            <TouchableOpacity
              style={[styles.nextButton, !canGoNext && styles.nextButtonDisabled]}
              onPress={goToNextStep}
              disabled={!canGoNext}
            >
              <Text style={styles.nextButtonText}>{currentStep === 5 ? 'Payer' : 'Continuer'}</Text>
            </TouchableOpacity>
          )}

          {currentStep === 6 && (
            <TouchableOpacity
              style={styles.nextButton}
              onPress={() => {
                bottomSheetRef.current?.close();
                onBookingComplete?.();
                // Fermer toutes les modales et naviguer directement vers le profil
                router.dismissAll();
                router.replace('/profile');
              }}
            >
              <Text style={styles.nextButtonText}>Terminé</Text>
            </TouchableOpacity>
          )}
        </BottomSheetView>
      </BottomSheet>
    );
  }
);

BookingBottomSheetV2.displayName = 'BookingBottomSheetV2';

const styles = StyleSheet.create({
  background: {
    backgroundColor: Colors.neutral.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  indicator: {
    backgroundColor: Colors.neutral.mist,
    width: 40,
    height: 4,
    marginTop: 12,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 8,
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
    marginBottom: 24,
    textAlign: 'center',
  },
  stepsContainer: {
    flex: 1,
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
  },
  playersSelector: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  holesSelector: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
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
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
  },
  priceLabel: {
    fontSize: 14,
    color: Colors.neutral.slate,
  },
  priceValue: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.primary.navy,
  },
  nextButton: {
    backgroundColor: Colors.primary.navy,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 10,
  },
  nextButtonDisabled: {
    backgroundColor: Colors.neutral.mist,
  },
  nextButtonText: {
    color: Colors.neutral.white,
    fontSize: 16,
    fontWeight: '700',
  },
  placeholderText: {
    fontSize: 16,
    color: Colors.neutral.slate,
    textAlign: 'center',
    marginTop: 40,
  },
  successText: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.primary.navy,
    textAlign: 'center',
    marginTop: 40,
  },
  // Ajout manquant
  neutral: {
    snow: '#F7F7F7',
    slate: '#64748B',
  },
});
