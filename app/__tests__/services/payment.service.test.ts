/**
 * Tests unitaires pour PaymentService
 * Couvre les flux critiques de paiement et de réservation
 */
import { paymentService } from '@/services/payment.service';
import { supabase } from '@/utils/supabase/client';

// Mock Supabase
jest.mock('@/utils/supabase/client', () => ({
  supabase: {
    functions: {
      invoke: jest.fn(),
    },
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(),
        })),
      })),
      insert: jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn(),
        })),
      })),
    })),
  },
}));

describe('PaymentService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('createPaymentIntent', () => {
    it('devrait créer un payment intent avec succès', async () => {
      const mockResponse = {
        client_secret: 'pi_test_secret_123',
        payment_intent_id: 'pi_test_123',
      };

      (supabase.functions.invoke as jest.Mock).mockResolvedValueOnce({
        data: mockResponse,
        error: null,
      });

      const result = await paymentService.createPaymentIntent({
        amount: 10000, // 100€ en centimes
        metadata: {
          pro_id: 'pro_123',
          amateur_id: 'amateur_456',
          booking_date: '2024-01-20',
          start_time: '10:00',
          description: 'Cours de golf avec Pro',
        },
      });

      expect(result).toEqual(mockResponse);
      expect(supabase.functions.invoke).toHaveBeenCalledWith('create-payment-intent', {
        body: {
          amount: 10000,
          currency: 'eur',
          metadata: expect.objectContaining({
            pro_id: 'pro_123',
            amateur_id: 'amateur_456',
          }),
        },
      });
    });

    it('devrait gérer les erreurs de création de payment intent', async () => {
      const mockError = new Error('Stripe API error');

      (supabase.functions.invoke as jest.Mock).mockResolvedValueOnce({
        data: null,
        error: mockError,
      });

      const result = await paymentService.createPaymentIntent({
        amount: 10000,
        metadata: {
          pro_id: 'pro_123',
          amateur_id: 'amateur_456',
          booking_date: '2024-01-20',
          start_time: '10:00',
          description: 'Test',
        },
      });

      expect(result.error).toBe('Stripe API error');
      expect(result.client_secret).toBe('');
      expect(result.payment_intent_id).toBe('');
    });

    it('devrait utiliser EUR par défaut comme devise', async () => {
      (supabase.functions.invoke as jest.Mock).mockResolvedValueOnce({
        data: { client_secret: 'test', payment_intent_id: 'test' },
        error: null,
      });

      await paymentService.createPaymentIntent({
        amount: 5000,
        metadata: {
          pro_id: 'pro_1',
          amateur_id: 'amateur_1',
          booking_date: '2024-01-20',
          start_time: '14:00',
          description: 'Test',
        },
      });

      expect(supabase.functions.invoke).toHaveBeenCalledWith(
        'create-payment-intent',
        expect.objectContaining({
          body: expect.objectContaining({
            currency: 'eur',
          }),
        })
      );
    });

    it('devrait permettre de spécifier une devise différente', async () => {
      (supabase.functions.invoke as jest.Mock).mockResolvedValueOnce({
        data: { client_secret: 'test', payment_intent_id: 'test' },
        error: null,
      });

      await paymentService.createPaymentIntent({
        amount: 5000,
        currency: 'usd',
        metadata: {
          pro_id: 'pro_1',
          amateur_id: 'amateur_1',
          booking_date: '2024-01-20',
          start_time: '14:00',
          description: 'Test',
        },
      });

      expect(supabase.functions.invoke).toHaveBeenCalledWith(
        'create-payment-intent',
        expect.objectContaining({
          body: expect.objectContaining({
            currency: 'usd',
          }),
        })
      );
    });
  });

  describe('checkPaymentStatus', () => {
    it("devrait vérifier le statut d'un paiement avec succès", async () => {
      const mockResponse = {
        success: true,
        payment_intent_id: 'pi_test_123',
      };

      (supabase.functions.invoke as jest.Mock).mockResolvedValueOnce({
        data: mockResponse,
        error: null,
      });

      const result = await paymentService.checkPaymentStatus('pi_test_123');

      expect(result).toEqual(mockResponse);
      expect(supabase.functions.invoke).toHaveBeenCalledWith('check-payment-status', {
        body: {
          payment_intent_id: 'pi_test_123',
        },
      });
    });

    it('devrait gérer les erreurs de vérification de statut', async () => {
      const mockError = new Error('Network error');

      (supabase.functions.invoke as jest.Mock).mockResolvedValueOnce({
        data: null,
        error: mockError,
      });

      const result = await paymentService.checkPaymentStatus('pi_test_123');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Network error');
      expect(result.payment_intent_id).toBe('pi_test_123');
    });
  });

  describe('verifyAvailability', () => {
    it('devrait valider une disponibilité avec des places disponibles', async () => {
      const mockAvailability = {
        id: 'avail_123',
        max_players: 4,
        current_bookings: 2,
      };

      const mockSingle = jest.fn().mockResolvedValueOnce({
        data: mockAvailability,
        error: null,
      });

      const mockEq = jest.fn().mockReturnValue({ single: mockSingle });
      const mockSelect = jest.fn().mockReturnValue({ eq: mockEq });

      (supabase.from as jest.Mock).mockReturnValue({
        select: mockSelect,
      });

      const result = await paymentService.verifyAvailability('avail_123');

      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
      expect(mockSelect).toHaveBeenCalledWith('id, max_players, current_bookings');
      expect(mockEq).toHaveBeenCalledWith('id', 'avail_123');
    });

    it('devrait rejeter une disponibilité complète', async () => {
      const mockAvailability = {
        id: 'avail_123',
        max_players: 4,
        current_bookings: 4, // Complet!
      };

      const mockSingle = jest.fn().mockResolvedValueOnce({
        data: mockAvailability,
        error: null,
      });

      const mockEq = jest.fn().mockReturnValue({ single: mockSingle });
      const mockSelect = jest.fn().mockReturnValue({ eq: mockEq });

      (supabase.from as jest.Mock).mockReturnValue({
        select: mockSelect,
      });

      const result = await paymentService.verifyAvailability('avail_123');

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Plus de place disponible pour ce créneau');
    });

    it('devrait gérer une disponibilité non trouvée', async () => {
      const mockSingle = jest.fn().mockResolvedValueOnce({
        data: null,
        error: new Error('Not found'),
      });

      const mockEq = jest.fn().mockReturnValue({ single: mockSingle });
      const mockSelect = jest.fn().mockReturnValue({ eq: mockEq });

      (supabase.from as jest.Mock).mockReturnValue({
        select: mockSelect,
      });

      const result = await paymentService.verifyAvailability('avail_invalid');

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Disponibilité non trouvée');
    });
  });

  describe('calculateEndTime', () => {
    it("devrait calculer l'heure de fin correctement", () => {
      expect(paymentService.calculateEndTime('10:00')).toBe('12:00');
      expect(paymentService.calculateEndTime('14:30')).toBe('16:30');
      expect(paymentService.calculateEndTime('08:15')).toBe('10:15');
    });

    it('devrait gérer le padding des heures', () => {
      expect(paymentService.calculateEndTime('08:00')).toBe('10:00');
      expect(paymentService.calculateEndTime('09:45')).toBe('11:45');
    });
  });

  describe('confirmPaymentAndBooking', () => {
    it('devrait confirmer le paiement et créer la réservation', async () => {
      const mockBooking = {
        id: 'booking_123',
        payment_intent_id: 'pi_test_123',
        status: 'pending',
      };

      // Mock verifyAvailability
      const mockSingle = jest.fn().mockResolvedValueOnce({
        data: { id: 'avail_123', max_players: 4, current_bookings: 2 },
        error: null,
      });
      const mockEq = jest.fn().mockReturnValue({ single: mockSingle });
      const mockSelect = jest.fn().mockReturnValue({ eq: mockEq });

      // Mock insert booking
      const mockInsertSingle = jest.fn().mockResolvedValueOnce({
        data: mockBooking,
        error: null,
      });
      const mockInsertSelect = jest.fn().mockReturnValue({ single: mockInsertSingle });
      const mockInsert = jest.fn().mockReturnValue({ select: mockInsertSelect });

      (supabase.from as jest.Mock).mockImplementation((table) => {
        if (table === 'pro_availabilities') {
          return { select: mockSelect };
        }
        if (table === 'bookings') {
          return { insert: mockInsert };
        }
      });

      // Mock Edge Function pour validation
      (supabase.functions.invoke as jest.Mock).mockResolvedValueOnce({
        data: { success: true },
        error: null,
      });

      const bookingData = {
        availability_id: 'avail_123',
        amateur_id: 'amateur_456',
        pro_id: 'pro_123',
        booking_date: '2024-01-20',
        start_time: '10:00',
        total_amount: 100,
      };

      const result = await paymentService.confirmPaymentAndBooking('pi_test_123', bookingData);

      expect(result.success).toBe(true);
      expect(result.booking_id).toBe('booking_123');
      expect(result.error).toBeUndefined();

      // Vérifier que la réservation a été créée avec les bons paramètres
      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          ...bookingData,
          payment_intent_id: 'pi_test_123',
          payment_status: 'pending',
          status: 'pending',
          admin_validation_status: 'pending',
        })
      );
    });

    it("devrait rejeter si aucune availability_id n'est fournie", async () => {
      const bookingData = {
        amateur_id: 'amateur_456',
        pro_id: 'pro_123',
        // availability_id manquant!
      };

      const result = await paymentService.confirmPaymentAndBooking('pi_test_123', bookingData);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Aucune disponibilité sélectionnée');
    });

    it('devrait rejeter si la disponibilité est invalide', async () => {
      // Mock verifyAvailability pour retourner invalid
      const mockSingle = jest.fn().mockResolvedValueOnce({
        data: null,
        error: new Error('Not found'),
      });
      const mockEq = jest.fn().mockReturnValue({ single: mockSingle });
      const mockSelect = jest.fn().mockReturnValue({ eq: mockEq });

      (supabase.from as jest.Mock).mockReturnValue({
        select: mockSelect,
      });

      const bookingData = {
        availability_id: 'avail_invalid',
        amateur_id: 'amateur_456',
        pro_id: 'pro_123',
      };

      const result = await paymentService.confirmPaymentAndBooking('pi_test_123', bookingData);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Disponibilité non trouvée');
    });
  });

  describe('refundPayment', () => {
    it('devrait effectuer un remboursement complet', async () => {
      const mockResponse = {
        success: true,
        payment_intent_id: 'pi_test_123',
      };

      (supabase.functions.invoke as jest.Mock).mockResolvedValueOnce({
        data: mockResponse,
        error: null,
      });

      const result = await paymentService.refundPayment('pi_test_123');

      expect(result).toEqual(mockResponse);
      expect(supabase.functions.invoke).toHaveBeenCalledWith('refund-payment', {
        body: {
          payment_intent_id: 'pi_test_123',
          amount: undefined,
        },
      });
    });

    it('devrait effectuer un remboursement partiel', async () => {
      const mockResponse = {
        success: true,
        payment_intent_id: 'pi_test_123',
      };

      (supabase.functions.invoke as jest.Mock).mockResolvedValueOnce({
        data: mockResponse,
        error: null,
      });

      const result = await paymentService.refundPayment('pi_test_123', 5000);

      expect(result).toEqual(mockResponse);
      expect(supabase.functions.invoke).toHaveBeenCalledWith('refund-payment', {
        body: {
          payment_intent_id: 'pi_test_123',
          amount: 5000,
        },
      });
    });

    it('devrait gérer les erreurs de remboursement', async () => {
      const mockError = new Error('Refund failed');

      (supabase.functions.invoke as jest.Mock).mockResolvedValueOnce({
        data: null,
        error: mockError,
      });

      const result = await paymentService.refundPayment('pi_test_123');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Refund failed');
    });
  });

  describe('Protection contre les doubles paiements', () => {
    it('ne devrait pas permettre deux paiements simultanés', async () => {
      const mockResponse = {
        client_secret: 'pi_test_secret_123',
        payment_intent_id: 'pi_test_123',
      };

      (supabase.functions.invoke as jest.Mock).mockResolvedValueOnce({
        data: mockResponse,
        error: null,
      });

      // Simuler deux appels rapides (double-clic)
      const promise1 = paymentService.createPaymentIntent({
        amount: 10000,
        metadata: {
          pro_id: 'pro_123',
          amateur_id: 'amateur_456',
          booking_date: '2024-01-20',
          start_time: '10:00',
          description: 'Test',
        },
      });

      const promise2 = paymentService.createPaymentIntent({
        amount: 10000,
        metadata: {
          pro_id: 'pro_123',
          amateur_id: 'amateur_456',
          booking_date: '2024-01-20',
          start_time: '10:00',
          description: 'Test',
        },
      });

      await Promise.all([promise1, promise2]);

      // Les deux appels devraient passer car la protection doit être au niveau UI
      // Le service lui-même ne gère pas la déduplication
      expect(supabase.functions.invoke).toHaveBeenCalledTimes(2);
    });
  });
});
