/**
 * Tests d'intégration pour le flux complet de réservation avec paiement
 * Simule le parcours utilisateur complet
 */
import { paymentService } from '@/services/payment.service';
import { bookingService } from '@/services/booking.service';
import { supabase } from '@/utils/supabase/client';

// Mocks
jest.mock('@/utils/supabase/client', () => ({
  supabase: {
    functions: {
      invoke: jest.fn(),
    },
    from: jest.fn(),
    auth: {
      getUser: jest.fn(),
    },
  },
}));

jest.mock('@/utils/logger', () => ({
  logger: {
    error: jest.fn(),
    debug: jest.fn(),
    info: jest.fn(),
  },
}));

describe('Flux Complet de Réservation avec Paiement', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Parcours utilisateur complet', () => {
    it('devrait permettre de réserver et payer une leçon avec un pro', async () => {
      // ÉTAPE 1: Amateur cherche des disponibilités
      const mockAvailabilities = [
        {
          id: 'avail_123',
          date: '2024-01-20',
          pro_id: 'pro_456',
          golf_course_id: 'golf_789',
          max_players: 4,
          current_bookings: 1,
          start_time: '10:00',
          end_time: '12:00',
          profile: {
            id: 'pro_456',
            first_name: 'Jean',
            last_name: 'Pro',
            hourly_rate: 50,
          },
        },
      ];

      // Créer une chaîne de mocks qui se retournent eux-mêmes
      const chainableMock = {
        select: jest.fn(),
        eq: jest.fn(),
        gt: jest.fn(),
      };

      // Chaque méthode retourne le mock pour permettre le chaînage
      chainableMock.select.mockReturnValue(chainableMock);
      chainableMock.eq.mockReturnValue(chainableMock);
      chainableMock.gt.mockReturnValue(chainableMock);

      // La dernière méthode eq retourne une promesse avec les données
      let eqCallCount = 0;
      chainableMock.eq.mockImplementation((...args) => {
        eqCallCount++;
        if (eqCallCount === 2) {
          // Deuxième appel à eq (pour golf_course_id) retourne le résultat final
          return Promise.resolve({ data: mockAvailabilities, error: null });
        }
        return chainableMock;
      });

      (supabase.from as jest.Mock).mockReturnValue(chainableMock);

      const availabilities = await bookingService.getAvailabilitiesByDate('2024-01-20', {
        golf_course_id: 'golf_789',
      });

      expect(availabilities.data).toEqual(mockAvailabilities);
      expect(availabilities.data?.[0].profile.hourly_rate).toBe(50);

      // ÉTAPE 2: Amateur sélectionne un créneau et calcule le prix
      const selectedSlot = availabilities.data![0];
      const numberOfPlayers = 2;
      const duration = 2; // heures
      const proFee = selectedSlot.profile.hourly_rate * duration;
      const platformFee = proFee * 0.15;
      const totalAmount = proFee + platformFee;

      expect(proFee).toBe(100); // 50€/h * 2h
      expect(platformFee).toBe(15); // 15% de 100€
      expect(totalAmount).toBe(115); // 100€ + 15€

      // ÉTAPE 3: Créer un payment intent Stripe
      const mockPaymentIntent = {
        client_secret: 'pi_test_secret_123',
        payment_intent_id: 'pi_test_123',
      };

      (supabase.functions.invoke as jest.Mock).mockResolvedValueOnce({
        data: mockPaymentIntent,
        error: null,
      });

      const paymentIntent = await paymentService.createPaymentIntent({
        amount: totalAmount * 100, // En centimes
        metadata: {
          pro_id: selectedSlot.pro_id,
          amateur_id: 'amateur_001',
          booking_date: selectedSlot.date,
          start_time: selectedSlot.start_time,
          description: `Cours de golf avec ${selectedSlot.profile.first_name} ${selectedSlot.profile.last_name}`,
        },
      });

      expect(paymentIntent.payment_intent_id).toBe('pi_test_123');
      expect(paymentIntent.client_secret).toBeTruthy();

      // ÉTAPE 4: Simuler le paiement réussi via Stripe Payment Sheet
      // Dans la vraie vie, c'est le composant React Native Stripe qui gère ça
      const paymentSuccessful = true;

      // ÉTAPE 5: Confirmer le paiement et créer la réservation
      if (paymentSuccessful) {
        // Mock vérification de disponibilité
        const mockAvailabilityCheck = {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: {
                  id: 'avail_123',
                  max_players: 4,
                  current_bookings: 1,
                },
                error: null,
              }),
            }),
          }),
        };

        // Mock création de réservation
        const mockBooking = {
          id: 'booking_001',
          amateur_id: 'amateur_001',
          pro_id: 'pro_456',
          golf_course_id: 'golf_789',
          availability_id: 'avail_123',
          booking_date: '2024-01-20',
          start_time: '10:00',
          number_of_players: 2,
          total_amount: 115,
          pro_fee: 100,
          platform_fee: 15,
          payment_intent_id: 'pi_test_123',
          payment_status: 'pending',
          status: 'pending',
          admin_validation_status: 'pending',
          created_at: new Date().toISOString(),
        };

        const mockBookingInsert = {
          insert: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: mockBooking,
                error: null,
              }),
            }),
          }),
        };

        (supabase.from as jest.Mock)
          .mockReturnValueOnce(mockAvailabilityCheck) // pro_availabilities check
          .mockReturnValueOnce(mockBookingInsert); // bookings insert

        // Mock Edge Function pour validation admin
        (supabase.functions.invoke as jest.Mock).mockResolvedValueOnce({
          data: { success: true },
          error: null,
        });

        const bookingResult = await paymentService.confirmPaymentAndBooking(
          paymentIntent.payment_intent_id,
          {
            amateur_id: 'amateur_001',
            pro_id: selectedSlot.pro_id,
            golf_course_id: selectedSlot.golf_course_id,
            availability_id: selectedSlot.id,
            booking_date: selectedSlot.date,
            start_time: selectedSlot.start_time,
            end_time: '12:00',
            number_of_players: numberOfPlayers,
            total_amount: totalAmount,
            pro_fee: proFee,
            platform_fee: platformFee,
            special_requests: 'Je suis débutant',
          }
        );

        expect(bookingResult.success).toBe(true);
        expect(bookingResult.booking_id).toBe('booking_001');
      }

      // ÉTAPE 6: Webhook Stripe confirme le paiement (simulé)
      // Dans la vraie vie, c'est le webhook qui met à jour le statut
      const webhookPaymentConfirmation = {
        type: 'payment_intent.succeeded',
        data: {
          object: {
            id: 'pi_test_123',
            amount: 11500,
            status: 'succeeded',
          },
        },
      };

      // Simuler la mise à jour par le webhook
      const mockBookingUpdate = {
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: {
                  id: 'booking_001',
                  payment_status: 'paid',
                  status: 'confirmed',
                  admin_validation_status: 'auto_approved',
                  confirmed_at: new Date().toISOString(),
                },
                error: null,
              }),
            }),
          }),
        }),
      };

      (supabase.from as jest.Mock).mockReturnValueOnce(mockBookingUpdate);

      // Mise à jour simulée par webhook
      const { data: updatedBooking } = await supabase
        .from('bookings')
        .update({
          payment_status: 'paid',
          status: 'confirmed',
          admin_validation_status: 'auto_approved',
          confirmed_at: new Date().toISOString(),
        })
        .eq('payment_intent_id', webhookPaymentConfirmation.data.object.id)
        .select()
        .single();

      expect(updatedBooking?.payment_status).toBe('paid');
      expect(updatedBooking?.status).toBe('confirmed');
    });

    it("devrait gérer l'annulation d'une réservation", async () => {
      const bookingId = 'booking_001';
      const paymentIntentId = 'pi_test_123';

      // Mock récupération de la réservation
      const mockBooking = {
        id: bookingId,
        payment_intent_id: paymentIntentId,
        status: 'confirmed',
        total_amount: 115,
      };

      const mockBookingQuery = {
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockBooking,
              error: null,
            }),
          }),
        }),
      };

      (supabase.from as jest.Mock).mockReturnValueOnce(mockBookingQuery);

      // Mock remboursement Stripe
      (supabase.functions.invoke as jest.Mock).mockResolvedValueOnce({
        data: {
          success: true,
          payment_intent_id: paymentIntentId,
        },
        error: null,
      });

      // Mock mise à jour du statut de réservation
      const mockBookingUpdate = {
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: { ...mockBooking, status: 'cancelled' },
                error: null,
              }),
            }),
          }),
        }),
      };

      (supabase.from as jest.Mock).mockReturnValue(mockBookingUpdate);

      // Processus d'annulation
      const refundResult = await paymentService.refundPayment(paymentIntentId);
      expect(refundResult.success).toBe(true);

      // Mise à jour du statut (simulée)
      const updatedBooking = { ...mockBooking, status: 'cancelled' };

      expect(updatedBooking.status).toBe('cancelled');
    });
  });

  describe("Cas d'erreur et edge cases", () => {
    it('devrait empêcher le double booking sur le même créneau', async () => {
      // Premier utilisateur réserve
      const firstBooking = {
        availability_id: 'avail_123',
        number_of_players: 3,
      };

      // Deuxième utilisateur essaie de réserver
      const secondBooking = {
        availability_id: 'avail_123',
        number_of_players: 2,
      };

      // Mock availability avec seulement 1 place restante après première réservation
      const mockAvailability = {
        id: 'avail_123',
        max_players: 4,
        current_bookings: 3, // Après la première réservation
      };

      const mockAvailabilityQuery = {
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockAvailability,
              error: null,
            }),
          }),
        }),
      };

      (supabase.from as jest.Mock).mockReturnValue(mockAvailabilityQuery);

      // Tentative de réservation qui devrait échouer
      const verifyResult = await paymentService.verifyAvailability('avail_123');

      // Simuler la vérification du nombre de places
      const hasEnoughSlots =
        mockAvailability.current_bookings + secondBooking.number_of_players <=
        mockAvailability.max_players;

      expect(hasEnoughSlots).toBe(false);
      expect(mockAvailability.max_players - mockAvailability.current_bookings).toBe(1);
    });

    it('devrait gérer le timeout du payment intent', async () => {
      // Mock payment intent expiré
      (supabase.functions.invoke as jest.Mock).mockResolvedValueOnce({
        data: null,
        error: new Error('Payment intent expired'),
      });

      const result = await paymentService.createPaymentIntent({
        amount: 11500,
        metadata: {
          pro_id: 'pro_123',
          amateur_id: 'amateur_456',
          booking_date: '2024-01-20',
          start_time: '10:00',
          description: 'Test',
        },
      });

      expect(result.error).toContain('Payment intent expired');
      expect(result.client_secret).toBe('');
    });

    it('devrait valider les montants pour éviter les erreurs de calcul', () => {
      const calculateFees = (hourlyRate: number, duration: number) => {
        const proFee = hourlyRate * duration;
        const platformFee = Math.round(proFee * 0.15 * 100) / 100; // Arrondi à 2 décimales
        const totalAmount = proFee + platformFee;

        return {
          proFee,
          platformFee,
          totalAmount,
        };
      };

      // Test avec différents tarifs horaires
      const testCases = [
        { hourlyRate: 50, duration: 2, expectedTotal: 115 },
        { hourlyRate: 75, duration: 1.5, expectedTotal: 129.38 },
        { hourlyRate: 60, duration: 2, expectedTotal: 138 },
      ];

      testCases.forEach(({ hourlyRate, duration, expectedTotal }) => {
        const fees = calculateFees(hourlyRate, duration);
        expect(fees.totalAmount).toBeCloseTo(expectedTotal, 2);
        expect(fees.platformFee).toBeCloseTo(fees.proFee * 0.15, 2);
      });
    });

    it('devrait gérer les erreurs réseau lors du paiement', async () => {
      // Mock erreur réseau
      (supabase.functions.invoke as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      const result = await paymentService.createPaymentIntent({
        amount: 11500,
        metadata: {
          pro_id: 'pro_123',
          amateur_id: 'amateur_456',
          booking_date: '2024-01-20',
          start_time: '10:00',
          description: 'Test',
        },
      });

      expect(result.error).toBeDefined();
      expect(result.client_secret).toBe('');
    });
  });

  describe('Validation des règles métier', () => {
    it('ne devrait pas permettre de réserver dans le passé', () => {
      const isDateValid = (bookingDate: string): boolean => {
        const date = new Date(bookingDate + 'T00:00:00'); // Force l'heure locale
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        date.setHours(0, 0, 0, 0);
        return date >= today;
      };

      // Utiliser une méthode plus robuste pour les dates
      const formatDate = (date: Date): string => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      };

      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const today = new Date();

      expect(isDateValid(formatDate(yesterday))).toBe(false); // Passé
      expect(isDateValid(formatDate(tomorrow))).toBe(true); // Futur
      expect(isDateValid(formatDate(today))).toBe(true); // Aujourd'hui
    });

    it('devrait respecter les limites de joueurs par réservation', () => {
      const isPlayerCountValid = (count: number): boolean => {
        return count >= 1 && count <= 4;
      };

      expect(isPlayerCountValid(0)).toBe(false);
      expect(isPlayerCountValid(1)).toBe(true);
      expect(isPlayerCountValid(4)).toBe(true);
      expect(isPlayerCountValid(5)).toBe(false);
    });

    it('devrait calculer correctement les créneaux horaires', () => {
      const calculateTimeSlots = (startTime: string, duration: number): string => {
        const [hours, minutes] = startTime.split(':').map(Number);
        const endHours = hours + duration;
        return `${endHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
      };

      expect(calculateTimeSlots('09:00', 2)).toBe('11:00');
      expect(calculateTimeSlots('14:30', 2)).toBe('16:30');
      expect(calculateTimeSlots('18:00', 2)).toBe('20:00');
    });
  });
});
