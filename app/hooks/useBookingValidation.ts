/**
 * useBookingValidation - Hook pour la logique de validation des réservations
 *
 * ✅ EXTRAIT du BookingScreen pour améliorer la modularité
 */
import { useCallback } from 'react';
import { Alert } from 'react-native';
import type { Step, TimeSlot } from './useBookingState';

interface ValidationState {
  currentStep: Step;
  selectedDate: string;
  selectedSlot: TimeSlot | null;
  numberOfPlayers: number;
  calculatedPrice: number;
  bookingConfirmed: boolean;
}

interface UseBookingValidationReturn {
  validateStep: (step: Step) => boolean;
  validateAndProceed: (step: Step, onSuccess: () => void) => void;
  getValidationErrors: (step: Step) => string[];
}

export function useBookingValidation(state: ValidationState): UseBookingValidationReturn {
  // Validation pour une étape spécifique
  const validateStep = useCallback(
    (step: Step): boolean => {
      switch (step) {
        case 1:
          return !!state.selectedDate;
        case 2:
          return !!(state.selectedDate && state.selectedSlot);
        case 3:
          return state.calculatedPrice > 0;
        case 4:
          return true; // Récapitulatif, toujours valide si on arrive ici
        case 5:
          return state.bookingConfirmed;
        default:
          return false;
      }
    },
    [state]
  );

  // Obtenir la liste des erreurs de validation pour une étape
  const getValidationErrors = useCallback(
    (step: Step): string[] => {
      const errors: string[] = [];

      switch (step) {
        case 1:
          if (!state.selectedDate) {
            errors.push('Veuillez sélectionner une date');
          }
          break;

        case 2:
          if (!state.selectedDate) {
            errors.push('Veuillez sélectionner une date');
          }
          if (!state.selectedSlot) {
            errors.push('Veuillez sélectionner un créneau horaire');
          }
          break;

        case 3:
          if (state.calculatedPrice <= 0) {
            errors.push('Le prix de la réservation doit être calculé');
          }
          break;

        case 4:
          // Pas d'erreurs spécifiques pour le récapitulatif
          break;

        case 5:
          if (!state.bookingConfirmed) {
            errors.push('La réservation doit être confirmée');
          }
          break;
      }

      return errors;
    },
    [state]
  );

  // Validation avec alerte et callback de succès
  const validateAndProceed = useCallback(
    (step: Step, onSuccess: () => void) => {
      const errors = getValidationErrors(step);

      if (errors.length === 0) {
        onSuccess();
      } else {
        // Afficher la première erreur dans une alerte
        Alert.alert('Information manquante', errors[0]);
      }
    },
    [getValidationErrors]
  );

  return {
    validateStep,
    validateAndProceed,
    getValidationErrors,
  };
}

// Utilitaire pour valider les données de réservation complètes
export interface BookingData {
  selectedDate: string;
  selectedSlot: TimeSlot | null;
  numberOfPlayers: number;
  holes: 9 | 18;
  calculatedPrice: number;
}

export function validateCompleteBooking(data: BookingData): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!data.selectedDate) {
    errors.push('Date de réservation manquante');
  }

  if (!data.selectedSlot) {
    errors.push('Créneau horaire manquant');
  }

  if (data.numberOfPlayers <= 0 || data.numberOfPlayers > 3) {
    errors.push('Nombre de joueurs invalide (1-3)');
  }

  if (![9, 18].includes(data.holes)) {
    errors.push('Nombre de trous invalide (9 ou 18)');
  }

  if (data.calculatedPrice <= 0) {
    errors.push('Prix de réservation invalide');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
