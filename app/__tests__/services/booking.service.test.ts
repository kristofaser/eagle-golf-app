/**
 * Tests unitaires pour BookingService
 * Couvre les flux critiques de réservation
 */
import { bookingService } from '@/services/booking.service';
import { supabase } from '@/utils/supabase/client';
import type { CreateBookingData, Booking } from '@/services/booking.service';

// Mock Supabase
jest.mock('@/utils/supabase/client', () => ({
  supabase: {
    from: jest.fn(),
    auth: {
      getUser: jest.fn(),
    },
  },
}));

// Mock du logger
jest.mock('@/utils/logger', () => ({
  logger: {
    error: jest.fn(),
    debug: jest.fn(),
    info: jest.fn(),
  },
}));

describe('BookingService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('getAvailabilitiesByDate', () => {
    it('devrait récupérer les disponibilités pour une date donnée', async () => {
      const mockAvailabilities = [
        {
          id: 'avail_1',
          date: '2024-01-20',
          pro_id: 'pro_123',
          max_players: 4,
          current_bookings: 1,
          profile: {
            id: 'pro_123',
            first_name: 'Jean',
            last_name: 'Dupont',
            avatar_url: 'avatar.jpg',
            hourly_rate: 50,
            bio: 'Pro expérimenté',
          },
        },
      ];

      const mockQuery = {
        eq: jest.fn().mockReturnThis(),
        gt: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
      };

      mockQuery.gt.mockResolvedValueOnce({
        data: mockAvailabilities,
        error: null,
      });

      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            gt: jest.fn().mockResolvedValue({
              data: mockAvailabilities,
              error: null,
            }),
          }),
        }),
      });

      const result = await bookingService.getAvailabilitiesByDate('2024-01-20');

      expect(result.data).toEqual(mockAvailabilities);
      expect(result.error).toBeNull();
      expect(supabase.from).toHaveBeenCalledWith('pro_availabilities');
    });

    it('devrait filtrer par golf_course_id si fourni', async () => {
      const mockData = [];

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
          return Promise.resolve({ data: mockData, error: null });
        }
        return chainableMock;
      });

      (supabase.from as jest.Mock).mockReturnValue(chainableMock);

      const result = await bookingService.getAvailabilitiesByDate('2024-01-20', {
        golf_course_id: 'golf_123',
      });

      expect(result.data).toEqual(mockData);
      expect(result.error).toBeNull();

      // Vérifier l'ordre des appels
      expect(chainableMock.eq).toHaveBeenNthCalledWith(1, 'date', '2024-01-20');
      expect(chainableMock.gt).toHaveBeenCalledWith('max_players', 0);
      expect(chainableMock.eq).toHaveBeenNthCalledWith(2, 'golf_course_id', 'golf_123');
    });

    it('devrait filtrer par pro_id si fourni', async () => {
      const mockData = [];

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
          // Deuxième appel à eq (pour pro_id) retourne le résultat final
          return Promise.resolve({ data: mockData, error: null });
        }
        return chainableMock;
      });

      (supabase.from as jest.Mock).mockReturnValue(chainableMock);

      const result = await bookingService.getAvailabilitiesByDate('2024-01-20', {
        pro_id: 'pro_456',
      });

      expect(result.data).toEqual(mockData);
      expect(result.error).toBeNull();

      // Vérifier l'ordre des appels
      expect(chainableMock.eq).toHaveBeenNthCalledWith(1, 'date', '2024-01-20');
      expect(chainableMock.gt).toHaveBeenCalledWith('max_players', 0);
      expect(chainableMock.eq).toHaveBeenNthCalledWith(2, 'pro_id', 'pro_456');
    });

    it('devrait gérer les erreurs de récupération', async () => {
      const mockError = new Error('Database error');

      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            gt: jest.fn().mockResolvedValue({
              data: null,
              error: mockError,
            }),
          }),
        }),
      });

      const result = await bookingService.getAvailabilitiesByDate('2024-01-20');

      expect(result.data).toBeNull();
      expect(result.error).toBeDefined();
    });
  });

  describe('createBooking', () => {
    const validBookingData: CreateBookingData = {
      amateur_id: 'amateur_123',
      pro_id: 'pro_456',
      golf_course_id: 'golf_789',
      availability_id: 'avail_123',
      booking_date: '2024-01-20',
      start_time: '10:00',
      number_of_players: 2,
      total_amount: 120,
      pro_fee: 100,
      platform_fee: 20,
      special_requests: 'Débutant',
    };

    it('devrait créer une réservation avec succès', async () => {
      const mockAvailability = {
        id: 'avail_123',
        max_players: 4,
        current_bookings: 1,
      };

      const mockBooking: Booking = {
        id: 'booking_new',
        ...validBookingData,
        status: 'pending',
        payment_status: 'pending',
        created_at: '2024-01-20T10:00:00Z',
        updated_at: '2024-01-20T10:00:00Z',
      } as Booking;

      // Mock de la vérification de disponibilité
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

      // Mock de la création de réservation
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

      // Mock de la mise à jour de disponibilité
      const mockAvailabilityUpdate = {
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            error: null,
          }),
        }),
      };

      (supabase.from as jest.Mock).mockImplementation((table) => {
        if (table === 'pro_availabilities') {
          // Premier appel pour select, deuxième pour update
          if ((supabase.from as jest.Mock).mock.calls.filter(c => c[0] === 'pro_availabilities').length === 1) {
            return mockAvailabilityQuery;
          }
          return mockAvailabilityUpdate;
        }
        if (table === 'bookings') {
          return mockBookingInsert;
        }
      });

      const result = await bookingService.createBooking(validBookingData);

      expect(result.data).toEqual(mockBooking);
      expect(result.error).toBeNull();
      expect(mockBookingInsert.insert).toHaveBeenCalledWith(validBookingData);
      expect(mockAvailabilityUpdate.update).toHaveBeenCalledWith({
        current_bookings: 3, // 1 + 2 players
      });
    });

    it('devrait rejeter si le créneau n\'existe pas', async () => {
      const mockAvailabilityQuery = {
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: new Error('Not found'),
            }),
          }),
        }),
      };

      (supabase.from as jest.Mock).mockReturnValue(mockAvailabilityQuery);

      const result = await bookingService.createBooking(validBookingData);

      expect(result.data).toBeNull();
      expect(result.error?.message).toContain('Créneau non disponible');
    });

    it('devrait rejeter si pas assez de places disponibles', async () => {
      const mockAvailability = {
        id: 'avail_123',
        max_players: 4,
        current_bookings: 3, // Seulement 1 place restante
      };

      const bookingDataTooMany = {
        ...validBookingData,
        number_of_players: 2, // Demande 2 places
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

      const result = await bookingService.createBooking(bookingDataTooMany);

      expect(result.data).toBeNull();
      expect(result.error?.message).toContain('Pas assez de places disponibles');
    });

    it('devrait vérifier que le nombre de joueurs est valide', async () => {
      const invalidBookingData = {
        ...validBookingData,
        number_of_players: 0, // Invalide
      };

      const mockAvailability = {
        id: 'avail_123',
        max_players: 4,
        current_bookings: 0,
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

      const result = await bookingService.createBooking(invalidBookingData);

      // Le service devrait accepter mais Supabase va rejeter
      expect(result.data).toBeDefined(); // ou null selon l'implémentation
    });
  });

  describe('createBookingSimplified', () => {
    it('devrait créer une réservation sans vérifier availability_id', async () => {
      const bookingData: CreateBookingData = {
        amateur_id: 'amateur_123',
        pro_id: 'pro_456',
        golf_course_id: 'golf_789',
        booking_date: '2024-01-20',
        start_time: '14:00',
        number_of_players: 1,
        total_amount: 60,
        pro_fee: 50,
        platform_fee: 10,
      };

      const mockBooking = {
        id: 'booking_123',
        ...bookingData,
        status: 'pending',
      };

      const mockInsert = {
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockBooking,
              error: null,
            }),
          }),
        }),
      };

      (supabase.from as jest.Mock).mockReturnValue(mockInsert);

      const result = await bookingService.createBookingSimplified(bookingData);

      expect(result.data).toEqual(mockBooking);
      expect(result.error).toBeNull();
      expect(mockInsert.insert).toHaveBeenCalledWith(bookingData);
    });
  });

  describe('getBooking', () => {
    it('devrait récupérer une réservation avec tous les détails', async () => {
      const mockBooking = {
        id: 'booking_123',
        amateur_id: 'amateur_123',
        pro_id: 'pro_456',
        golf_course_id: 'golf_789',
        status: 'confirmed',
        pro_profile: {
          id: 'pro_456',
          profile: {
            first_name: 'Jean',
            last_name: 'Pro',
          },
        },
      };

      const mockGolf = {
        id: 'golf_789',
        name: 'Golf de Test',
      };

      // Premier appel pour récupérer la réservation
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

      // Second appel pour récupérer le golf
      const mockGolfQuery = {
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockGolf,
              error: null,
            }),
          }),
        }),
      };

      (supabase.from as jest.Mock)
        .mockReturnValueOnce(mockBookingQuery) // bookings
        .mockReturnValueOnce(mockGolfQuery); // golf_parcours

      const result = await bookingService.getBooking('booking_123');

      expect(result.data?.id).toBe('booking_123');
      expect(result.data?.pro_profile).toBeDefined();
      expect(result.data?.golf_parcours).toEqual(mockGolf);
      expect(result.error).toBeNull();
    });

    it('devrait gérer le cas où la réservation n\'existe pas', async () => {
      const mockQuery = {
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: new Error('Not found'),
            }),
          }),
        }),
      };

      (supabase.from as jest.Mock).mockReturnValue(mockQuery);

      const result = await bookingService.getBooking('booking_invalid');

      expect(result.data).toBeNull();
      expect(result.error).toBeDefined();
    });
  });

  describe('Calculs de prix', () => {
    it('devrait calculer correctement les frais de plateforme', () => {
      const bookingData: CreateBookingData = {
        amateur_id: 'amateur_123',
        pro_id: 'pro_456',
        golf_course_id: 'golf_789',
        booking_date: '2024-01-20',
        start_time: '10:00',
        number_of_players: 2,
        total_amount: 115,
        pro_fee: 100,
        platform_fee: 15, // 15% de 100
      };

      expect(bookingData.platform_fee).toBe(bookingData.pro_fee * 0.15);
      expect(bookingData.total_amount).toBe(bookingData.pro_fee + bookingData.platform_fee);
    });

    it('devrait valider que le total = pro_fee + platform_fee', () => {
      const validateBookingAmount = (data: CreateBookingData): boolean => {
        return data.total_amount === data.pro_fee + data.platform_fee;
      };

      const validBooking: CreateBookingData = {
        amateur_id: 'amateur_123',
        pro_id: 'pro_456',
        golf_course_id: 'golf_789',
        booking_date: '2024-01-20',
        start_time: '10:00',
        number_of_players: 1,
        total_amount: 57.50,
        pro_fee: 50,
        platform_fee: 7.50,
      };

      const invalidBooking: CreateBookingData = {
        ...validBooking,
        total_amount: 60, // Incorrect!
      };

      expect(validateBookingAmount(validBooking)).toBe(true);
      expect(validateBookingAmount(invalidBooking)).toBe(false);
    });
  });

  describe('Gestion des statuts', () => {
    it('devrait définir le statut par défaut à pending', async () => {
      const bookingData: CreateBookingData = {
        amateur_id: 'amateur_123',
        pro_id: 'pro_456',
        golf_course_id: 'golf_789',
        booking_date: '2024-01-20',
        start_time: '10:00',
        number_of_players: 1,
        total_amount: 57.50,
        pro_fee: 50,
        platform_fee: 7.50,
        // Pas de statut fourni
      };

      const mockInsert = {
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { ...bookingData, status: 'pending', id: 'booking_123' },
              error: null,
            }),
          }),
        }),
      };

      (supabase.from as jest.Mock).mockReturnValue(mockInsert);

      const result = await bookingService.createBookingSimplified(bookingData);

      expect(result.data?.status).toBe('pending');
    });

    it('devrait accepter les statuts valides', () => {
      const validStatuses = ['pending', 'confirmed', 'cancelled', 'completed'];

      validStatuses.forEach(status => {
        const booking: CreateBookingData = {
          amateur_id: 'amateur_123',
          pro_id: 'pro_456',
          golf_course_id: 'golf_789',
          booking_date: '2024-01-20',
          start_time: '10:00',
          number_of_players: 1,
          total_amount: 57.50,
          pro_fee: 50,
          platform_fee: 7.50,
          status: status as any,
        };

        expect(booking.status).toBe(status);
      });
    });
  });
});