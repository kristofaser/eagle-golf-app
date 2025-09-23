/**
 * useBookingState - Hook centralisé pour la gestion d'état des réservations
 *
 * ✅ EXTRAIT du BookingScreen pour améliorer la réutilisabilité
 */
import { useState, useCallback } from 'react';

export interface TimeSlot {
  time: string;
  hour: string;
  period: 'morning' | 'afternoon';
  available: boolean;
}

export type Step = 1 | 2 | 3 | 4 | 5;

interface UseBookingStateReturn {
  // Navigation
  currentStep: Step;
  setCurrentStep: (step: Step) => void;
  goToNextStep: () => void;
  goToPreviousStep: () => void;

  // Sélection - Étape 1
  selectedCourse: string;
  setSelectedCourse: (course: string) => void;
  selectedDate: string;
  setSelectedDate: (date: string) => void;
  selectedSlot: TimeSlot | null;
  setSelectedSlot: (slot: TimeSlot | null) => void;
  availableSlots: TimeSlot[];
  setAvailableSlots: (slots: TimeSlot[]) => void;

  // Configuration - Étape 2
  numberOfPlayers: number;
  setNumberOfPlayers: (players: number) => void;
  holes: 9 | 18;
  setHoles: (holes: 9 | 18) => void;

  // Prix
  calculatedPrice: number;
  setCalculatedPrice: (price: number) => void;
  proFee: number;
  setProFee: (fee: number) => void;
  platformFee: number;
  setPlatformFee: (fee: number) => void;

  // Confirmation
  bookingConfirmed: boolean;
  setBookingConfirmed: (confirmed: boolean) => void;
  bookingId: string | null;
  setBookingId: (id: string | null) => void;

  // Availability
  availabilityId: string | null;
  setAvailabilityId: (id: string | null) => void;

  // Utilitaires
  resetBooking: () => void;
  canProceedToNextStep: () => boolean;
}

export function useBookingState(initialPlayers: number = 1): UseBookingStateReturn {
  // Navigation
  const [currentStep, setCurrentStep] = useState<Step>(1);

  // Sélection - Étape 1
  const [selectedCourse, setSelectedCourse] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);

  // Configuration - Étape 2
  const [numberOfPlayers, setNumberOfPlayers] = useState(initialPlayers);
  const [holes, setHoles] = useState<9 | 18>(9);

  // Prix
  const [calculatedPrice, setCalculatedPrice] = useState(0);
  const [proFee, setProFee] = useState(0);
  const [platformFee, setPlatformFee] = useState(0);

  // Confirmation
  const [bookingConfirmed, setBookingConfirmed] = useState(false);
  const [bookingId, setBookingId] = useState<string | null>(null);
  const [availabilityId, setAvailabilityId] = useState<string | null>(null);

  // Navigation helpers
  const goToNextStep = useCallback(() => {
    setCurrentStep((prev) => Math.min(5, prev + 1) as Step);
  }, []);

  const goToPreviousStep = useCallback(() => {
    setCurrentStep((prev) => Math.max(1, prev - 1) as Step);
  }, []);

  // Validation pour passer à l'étape suivante
  const canProceedToNextStep = useCallback((): boolean => {
    switch (currentStep) {
      case 1:
        return !!(selectedDate && selectedSlot);
      case 2:
        return numberOfPlayers > 0;
      case 3:
        return calculatedPrice > 0;
      case 4:
        return true; // Récapitulatif, toujours valide
      case 5:
        return bookingConfirmed;
      default:
        return false;
    }
  }, [currentStep, selectedDate, selectedSlot, numberOfPlayers, calculatedPrice, bookingConfirmed]);

  // Reset complet
  const resetBooking = useCallback(() => {
    setCurrentStep(1);
    setSelectedCourse('');
    setSelectedDate('');
    setSelectedSlot(null);
    setAvailableSlots([]);
    setNumberOfPlayers(initialPlayers);
    setHoles(9);
    setCalculatedPrice(0);
    setProFee(0);
    setPlatformFee(0);
    setBookingConfirmed(false);
    setBookingId(null);
    setAvailabilityId(null);
  }, [initialPlayers]);

  return {
    // Navigation
    currentStep,
    setCurrentStep,
    goToNextStep,
    goToPreviousStep,

    // Sélection
    selectedCourse,
    setSelectedCourse,
    selectedDate,
    setSelectedDate,
    selectedSlot,
    setSelectedSlot,
    availableSlots,
    setAvailableSlots,

    // Configuration
    numberOfPlayers,
    setNumberOfPlayers,
    holes,
    setHoles,

    // Prix
    calculatedPrice,
    setCalculatedPrice,
    proFee,
    setProFee,
    platformFee,
    setPlatformFee,

    // Confirmation
    bookingConfirmed,
    setBookingConfirmed,
    bookingId,
    setBookingId,

    // Availability
    availabilityId,
    setAvailabilityId,

    // Utilitaires
    resetBooking,
    canProceedToNextStep,
  };
}
