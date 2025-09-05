import { renderHook, act } from '@testing-library/react-native';
import { useBookingState, type TimeSlot } from '@/hooks/useBookingState';

describe('useBookingState', () => {
  const mockTimeSlot: TimeSlot = {
    time: '10:00',
    hour: '10h',
    period: 'morning',
    available: true,
  };

  it('should initialize with correct default state', () => {
    const { result } = renderHook(() => useBookingState());

    expect(result.current.currentStep).toBe(1);
    expect(result.current.selectedDate).toBe('');
    expect(result.current.selectedSlot).toBeNull();
    expect(result.current.numberOfPlayers).toBe(1);
    expect(result.current.holes).toBe(9);
    expect(result.current.calculatedPrice).toBe(0);
    expect(result.current.bookingConfirmed).toBe(false);
  });

  it('should initialize with custom initial players', () => {
    const { result } = renderHook(() => useBookingState(3));
    expect(result.current.numberOfPlayers).toBe(3);
  });

  it('should handle step navigation', () => {
    const { result } = renderHook(() => useBookingState());

    act(() => {
      result.current.goToNextStep();
    });
    expect(result.current.currentStep).toBe(2);

    act(() => {
      result.current.goToPreviousStep();
    });
    expect(result.current.currentStep).toBe(1);
  });

  it('should prevent navigation beyond step limits', () => {
    const { result } = renderHook(() => useBookingState());

    // Test upper limit
    act(() => {
      result.current.setCurrentStep(5);
      result.current.goToNextStep();
    });
    expect(result.current.currentStep).toBe(5);

    // Test lower limit
    act(() => {
      result.current.setCurrentStep(1);
      result.current.goToPreviousStep();
    });
    expect(result.current.currentStep).toBe(1);
  });

  it('should handle date and slot selection', () => {
    const { result } = renderHook(() => useBookingState());

    act(() => {
      result.current.setSelectedDate('2024-08-30');
    });
    expect(result.current.selectedDate).toBe('2024-08-30');

    act(() => {
      result.current.setSelectedSlot(mockTimeSlot);
    });
    expect(result.current.selectedSlot).toEqual(mockTimeSlot);
  });

  it('should handle booking configuration', () => {
    const { result } = renderHook(() => useBookingState());

    act(() => {
      result.current.setNumberOfPlayers(2);
    });
    expect(result.current.numberOfPlayers).toBe(2);

    act(() => {
      result.current.setHoles(18);
    });
    expect(result.current.holes).toBe(18);
  });

  it('should handle price calculation', () => {
    const { result } = renderHook(() => useBookingState());

    act(() => {
      result.current.setCalculatedPrice(150);
      result.current.setProFee(120);
      result.current.setPlatformFee(30);
    });

    expect(result.current.calculatedPrice).toBe(150);
    expect(result.current.proFee).toBe(120);
    expect(result.current.platformFee).toBe(30);
  });

  it('should validate step progression correctly', () => {
    const { result } = renderHook(() => useBookingState());

    // Step 1: requires date and slot
    expect(result.current.canProceedToNextStep()).toBe(false);

    act(() => {
      result.current.setSelectedDate('2024-08-30');
    });
    expect(result.current.canProceedToNextStep()).toBe(false);

    act(() => {
      result.current.setSelectedSlot(mockTimeSlot);
    });
    expect(result.current.canProceedToNextStep()).toBe(true);

    // Step 2: requires numberOfPlayers > 0
    act(() => {
      result.current.setCurrentStep(2);
    });
    expect(result.current.canProceedToNextStep()).toBe(true);

    // Step 3: requires calculatedPrice > 0
    act(() => {
      result.current.setCurrentStep(3);
    });
    expect(result.current.canProceedToNextStep()).toBe(false);

    act(() => {
      result.current.setCalculatedPrice(100);
    });
    expect(result.current.canProceedToNextStep()).toBe(true);
  });

  it('should reset booking state completely', () => {
    const { result } = renderHook(() => useBookingState(2));

    // Set some state
    act(() => {
      result.current.setCurrentStep(3);
      result.current.setSelectedDate('2024-08-30');
      result.current.setSelectedSlot(mockTimeSlot);
      result.current.setNumberOfPlayers(3);
      result.current.setHoles(18);
      result.current.setCalculatedPrice(200);
      result.current.setBookingConfirmed(true);
    });

    // Reset
    act(() => {
      result.current.resetBooking();
    });

    // Check reset state
    expect(result.current.currentStep).toBe(1);
    expect(result.current.selectedDate).toBe('');
    expect(result.current.selectedSlot).toBeNull();
    expect(result.current.numberOfPlayers).toBe(2); // Should use initialPlayers
    expect(result.current.holes).toBe(9);
    expect(result.current.calculatedPrice).toBe(0);
    expect(result.current.bookingConfirmed).toBe(false);
  });
});
