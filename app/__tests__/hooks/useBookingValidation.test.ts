import { renderHook } from '@testing-library/react-native';
import { useBookingValidation } from '@/hooks/useBookingValidation';
import type { TimeSlot, Step } from '@/hooks/useBookingState';

describe('useBookingValidation', () => {
  const mockTimeSlot: TimeSlot = {
    time: '10:00',
    hour: '10h',
    period: 'morning',
    available: true,
  };

  const createValidationState = (overrides = {}) => ({
    currentStep: 1 as Step,
    selectedDate: '',
    selectedSlot: null as TimeSlot | null,
    numberOfPlayers: 1,
    calculatedPrice: 0,
    bookingConfirmed: false,
    ...overrides,
  });

  describe('validateStep', () => {
    it('should validate step 1 correctly', () => {
      const { result: emptyResult } = renderHook(() =>
        useBookingValidation(createValidationState({ currentStep: 1 }))
      );
      expect(emptyResult.current.validateStep(1)).toBe(false);

      const { result: withDateResult } = renderHook(() =>
        useBookingValidation(
          createValidationState({
            currentStep: 1,
            selectedDate: '2024-08-30',
          })
        )
      );
      expect(withDateResult.current.validateStep(1)).toBe(true);
    });

    it('should validate step 2 correctly', () => {
      const { result: emptyResult } = renderHook(() =>
        useBookingValidation(createValidationState({ currentStep: 2 }))
      );
      expect(emptyResult.current.validateStep(2)).toBe(false);

      const { result: dateOnlyResult } = renderHook(() =>
        useBookingValidation(
          createValidationState({
            currentStep: 2,
            selectedDate: '2024-08-30',
          })
        )
      );
      expect(dateOnlyResult.current.validateStep(2)).toBe(false);

      const { result: completeResult } = renderHook(() =>
        useBookingValidation(
          createValidationState({
            currentStep: 2,
            selectedDate: '2024-08-30',
            selectedSlot: mockTimeSlot,
          })
        )
      );
      expect(completeResult.current.validateStep(2)).toBe(true);
    });

    it('should validate step 3 correctly', () => {
      const { result: emptyResult } = renderHook(() =>
        useBookingValidation(createValidationState({ currentStep: 3 }))
      );
      expect(emptyResult.current.validateStep(3)).toBe(false);

      const { result: withPriceResult } = renderHook(() =>
        useBookingValidation(
          createValidationState({
            currentStep: 3,
            calculatedPrice: 100,
          })
        )
      );
      expect(withPriceResult.current.validateStep(3)).toBe(true);
    });

    it('should validate step 4 as always true', () => {
      const { result } = renderHook(() =>
        useBookingValidation(createValidationState({ currentStep: 4 }))
      );
      expect(result.current.validateStep(4)).toBe(true);
    });

    it('should validate step 5 correctly', () => {
      const { result: notConfirmedResult } = renderHook(() =>
        useBookingValidation(createValidationState({ currentStep: 5 }))
      );
      expect(notConfirmedResult.current.validateStep(5)).toBe(false);

      const { result: confirmedResult } = renderHook(() =>
        useBookingValidation(
          createValidationState({
            currentStep: 5,
            bookingConfirmed: true,
          })
        )
      );
      expect(confirmedResult.current.validateStep(5)).toBe(true);
    });
  });

  describe('getValidationErrors', () => {
    it('should return correct errors for step 1', () => {
      const { result } = renderHook(() =>
        useBookingValidation(createValidationState({ currentStep: 1 }))
      );

      const errors = result.current.getValidationErrors(1);
      expect(errors).toEqual(['Veuillez sélectionner une date']);
    });

    it('should return correct errors for step 2', () => {
      const { result: emptyResult } = renderHook(() =>
        useBookingValidation(createValidationState({ currentStep: 2 }))
      );

      const emptyErrors = emptyResult.current.getValidationErrors(2);
      expect(emptyErrors).toEqual([
        'Veuillez sélectionner une date',
        'Veuillez sélectionner un créneau horaire',
      ]);

      const { result: dateOnlyResult } = renderHook(() =>
        useBookingValidation(
          createValidationState({
            currentStep: 2,
            selectedDate: '2024-08-30',
          })
        )
      );

      const dateOnlyErrors = dateOnlyResult.current.getValidationErrors(2);
      expect(dateOnlyErrors).toEqual(['Veuillez sélectionner un créneau horaire']);
    });

    it('should return correct errors for step 3', () => {
      const { result } = renderHook(() =>
        useBookingValidation(createValidationState({ currentStep: 3 }))
      );

      const errors = result.current.getValidationErrors(3);
      expect(errors).toEqual(['Le prix de la réservation doit être calculé']);
    });

    it('should return no errors for step 4', () => {
      const { result } = renderHook(() =>
        useBookingValidation(createValidationState({ currentStep: 4 }))
      );

      const errors = result.current.getValidationErrors(4);
      expect(errors).toEqual([]);
    });

    it('should return correct errors for step 5', () => {
      const { result } = renderHook(() =>
        useBookingValidation(createValidationState({ currentStep: 5 }))
      );

      const errors = result.current.getValidationErrors(5);
      expect(errors).toEqual(['La réservation doit être confirmée']);
    });
  });

  describe('validateAndProceed', () => {
    it('should call onSuccess when validation passes', () => {
      const mockOnSuccess = jest.fn();
      const { result } = renderHook(() =>
        useBookingValidation(
          createValidationState({
            currentStep: 1,
            selectedDate: '2024-08-30',
          })
        )
      );

      result.current.validateAndProceed(1, mockOnSuccess);
      expect(mockOnSuccess).toHaveBeenCalledTimes(1);
    });

    it('should not call onSuccess when validation fails', () => {
      const mockOnSuccess = jest.fn();
      const { result } = renderHook(() =>
        useBookingValidation(createValidationState({ currentStep: 1 }))
      );

      result.current.validateAndProceed(1, mockOnSuccess);
      expect(mockOnSuccess).not.toHaveBeenCalled();
    });
  });
});
