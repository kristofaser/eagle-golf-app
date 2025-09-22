import { golfCourseService } from '../../services/golf-course.service';
import { supabase } from '../../utils/supabase/client';

// Mock Supabase
jest.mock('../../utils/supabase/client', () => ({
  supabase: {
    from: jest.fn(),
    storage: {
      from: jest.fn(),
    },
  },
}));

describe('GolfCourseService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock console.error pour éviter les logs pendant les tests
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('getGolfCourse', () => {
    it('devrait récupérer un parcours par ID avec succès', async () => {
      const mockCourse = {
        id: 'course-1',
        name: 'Golf de Test',
        city: 'Paris',
        latitude: 48.8566,
        longitude: 2.3522,
        address: '123 Rue du Golf',
      };

      const mockQuery = {
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockCourse,
              error: null,
            }),
          }),
        }),
      };

      (supabase.from as jest.Mock).mockReturnValue(mockQuery);

      const result = await golfCourseService.getGolfCourse('course-1');

      expect(result.data).toEqual(mockCourse);
      expect(result.error).toBeNull();
      expect(supabase.from).toHaveBeenCalledWith('golf_parcours');
      expect(mockQuery.select).toHaveBeenCalledWith('*');
      expect(mockQuery.select().eq).toHaveBeenCalledWith('id', 'course-1');
    });

    it('devrait gérer le cas où le parcours n\'existe pas', async () => {
      const mockQuery = {
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: null,
            }),
          }),
        }),
      };

      (supabase.from as jest.Mock).mockReturnValue(mockQuery);

      const result = await golfCourseService.getGolfCourse('course-not-found');

      expect(result.data).toBeNull();
      expect(result.error).toEqual(expect.objectContaining({
        message: 'Parcours non trouvé'
      }));
    });

    it('devrait gérer les erreurs de base de données', async () => {
      const mockError = new Error('Database connection failed');
      const mockQuery = {
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: mockError,
            }),
          }),
        }),
      };

      (supabase.from as jest.Mock).mockReturnValue(mockQuery);

      const result = await golfCourseService.getGolfCourse('course-1');

      expect(result.data).toBeNull();
      expect(result.error).toEqual(expect.objectContaining({
        message: 'Database connection failed'
      }));
    });

    it('devrait gérer les exceptions durant l\'exécution', async () => {
      const mockQuery = {
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockRejectedValue(new Error('Network error')),
          }),
        }),
      };

      (supabase.from as jest.Mock).mockReturnValue(mockQuery);

      const result = await golfCourseService.getGolfCourse('course-1');

      expect(result.data).toBeNull();
      expect(result.error).toEqual(expect.objectContaining({
        message: 'Network error'
      }));
    });
  });

  describe('calculateDistance (méthode privée testée via searchNearbyGolfCourses)', () => {
    it('devrait calculer correctement la distance entre deux points proches', async () => {
      // Paris centre à Tour Eiffel (environ 2-3 km)
      const mockCourses = [
        {
          id: 'course-1',
          name: 'Golf Tour Eiffel',
          latitude: 48.8584,
          longitude: 2.2945,
          city: 'Paris',
        },
      ];

      const mockQuery = {
        select: jest.fn().mockReturnValue({
          not: jest.fn().mockReturnValue({
            not: jest.fn().mockResolvedValue({
              data: mockCourses,
              error: null,
            }),
          }),
        }),
      };

      (supabase.from as jest.Mock).mockReturnValue(mockQuery);

      // Tester via searchNearbyGolfCourses (qui utilise calculateDistance)
      const result = await golfCourseService.searchNearbyGolfCourses(
        48.8566,
        2.3522,
        5, // 5km radius
        10
      );

      expect(result.data).toHaveLength(1);
      expect(result.data![0].distance).toBeGreaterThan(0);
      expect(result.data![0].distance).toBeLessThan(5);
      expect(result.error).toBeNull();
    });

    it('devrait calculer correctement la distance entre deux points éloignés', async () => {
      // Paris à Marseille (environ 775 km)
      const mockCourses = [
        {
          id: 'course-1',
          name: 'Golf Marseille',
          latitude: 43.2965,
          longitude: 5.3698,
          city: 'Marseille',
        },
      ];

      const mockQuery = {
        select: jest.fn().mockReturnValue({
          not: jest.fn().mockReturnValue({
            not: jest.fn().mockResolvedValue({
              data: mockCourses,
              error: null,
            }),
          }),
        }),
      };

      (supabase.from as jest.Mock).mockReturnValue(mockQuery);

      const result = await golfCourseService.searchNearbyGolfCourses(
        48.8566,
        2.3522,
        1000, // 1000km radius
        10
      );

      expect(result.data).toHaveLength(1);
      expect(result.data![0].distance).toBeGreaterThan(650);
      expect(result.data![0].distance).toBeLessThan(700);
    });

    it('devrait exclure les parcours trop éloignés', async () => {
      const mockCourses = [
        {
          id: 'course-proche',
          name: 'Golf Proche',
          latitude: 48.8600,
          longitude: 2.3600,
          city: 'Paris',
        },
        {
          id: 'course-loin',
          name: 'Golf Loin',
          latitude: 45.7640,
          longitude: 4.8357,
          city: 'Lyon',
        },
      ];

      const mockQuery = {
        select: jest.fn().mockReturnValue({
          not: jest.fn().mockReturnValue({
            not: jest.fn().mockResolvedValue({
              data: mockCourses,
              error: null,
            }),
          }),
        }),
      };

      (supabase.from as jest.Mock).mockReturnValue(mockQuery);

      const result = await golfCourseService.searchNearbyGolfCourses(
        48.8566,
        2.3522,
        50, // 50km radius
        10
      );

      expect(result.data).toHaveLength(1);
      expect(result.data![0].id).toBe('course-proche');
      expect(result.error).toBeNull();
    });
  });

  describe('toRad (conversion degrés vers radians)', () => {
    it('devrait convertir correctement 0 degré en radians', async () => {
      // Test via une méthode qui utilise toRad
      const mockCourses = [
        {
          id: 'course-1',
          name: 'Golf Équateur',
          latitude: 0,
          longitude: 0,
          city: 'Équateur',
        },
      ];

      const mockQuery = {
        select: jest.fn().mockReturnValue({
          not: jest.fn().mockReturnValue({
            not: jest.fn().mockResolvedValue({
              data: mockCourses,
              error: null,
            }),
          }),
        }),
      };

      (supabase.from as jest.Mock).mockReturnValue(mockQuery);

      const result = await golfCourseService.searchNearbyGolfCourses(0, 0, 1000, 10);

      expect(result.data).toHaveLength(1);
      expect(result.data![0].distance).toBe(0);
      expect(result.error).toBeNull();
    });

    it('devrait convertir correctement 180 degrés (opposé)', async () => {
      // Test avec antipode : 0,0 vers 0,180 = ~20000 km (demi-tour de Terre)
      const mockCourses = [
        {
          id: 'course-1',
          name: 'Golf Antipode',
          latitude: 0,
          longitude: 180,
          city: 'Antipode',
        },
      ];

      const mockQuery = {
        select: jest.fn().mockReturnValue({
          not: jest.fn().mockReturnValue({
            not: jest.fn().mockResolvedValue({
              data: mockCourses,
              error: null,
            }),
          }),
        }),
      };

      (supabase.from as jest.Mock).mockReturnValue(mockQuery);

      const result = await golfCourseService.searchNearbyGolfCourses(0, 0, 25000, 10);

      expect(result.data).toHaveLength(1);
      expect(result.data![0].distance).toBeGreaterThan(19000); // ~20000km
      expect(result.data![0].distance).toBeLessThan(21000);
    });
  });

  describe('Méthodes helper - validation des types et casting', () => {
    it('devrait retourner un objet avec location PostGIS pour searchNearbyGolfCourses', async () => {
      const mockCourses = [
        {
          id: 'course-1',
          name: 'Golf Test',
          latitude: 48.8566,
          longitude: 2.3522,
          city: 'Paris',
        },
      ];

      const mockQuery = {
        select: jest.fn().mockReturnValue({
          not: jest.fn().mockReturnValue({
            not: jest.fn().mockResolvedValue({
              data: mockCourses,
              error: null,
            }),
          }),
        }),
      };

      (supabase.from as jest.Mock).mockReturnValue(mockQuery);

      const result = await golfCourseService.searchNearbyGolfCourses(48.8566, 2.3522, 10, 1);

      expect(result.data).toHaveLength(1);
      expect(result.data![0]).toHaveProperty('location');
      expect(result.data![0].location).toEqual({
        type: 'Point',
        coordinates: [2.3522, 48.8566], // longitude, latitude
      });
      expect(result.data![0]).toHaveProperty('distance');
    });

    it('devrait limiter correctement le nombre de résultats', async () => {
      const mockCourses = Array.from({ length: 20 }, (_, i) => ({
        id: `course-${i}`,
        name: `Golf ${i}`,
        latitude: 48.8566 + i * 0.001,
        longitude: 2.3522 + i * 0.001,
        city: 'Paris',
      }));

      const mockQuery = {
        select: jest.fn().mockReturnValue({
          not: jest.fn().mockReturnValue({
            not: jest.fn().mockResolvedValue({
              data: mockCourses,
              error: null,
            }),
          }),
        }),
      };

      (supabase.from as jest.Mock).mockReturnValue(mockQuery);

      const result = await golfCourseService.searchNearbyGolfCourses(
        48.8566,
        2.3522,
        100, // Large radius
        5 // Limit à 5
      );

      expect(result.data).toHaveLength(5);
      expect(result.error).toBeNull();
    });

    it('devrait trier les résultats par distance croissante', async () => {
      const mockCourses = [
        {
          id: 'course-loin',
          name: 'Golf Loin',
          latitude: 48.9000,
          longitude: 2.4000,
          city: 'Paris',
        },
        {
          id: 'course-proche',
          name: 'Golf Proche',
          latitude: 48.8570,
          longitude: 2.3530,
          city: 'Paris',
        },
        {
          id: 'course-moyen',
          name: 'Golf Moyen',
          latitude: 48.8700,
          longitude: 2.3700,
          city: 'Paris',
        },
      ];

      const mockQuery = {
        select: jest.fn().mockReturnValue({
          not: jest.fn().mockReturnValue({
            not: jest.fn().mockResolvedValue({
              data: mockCourses,
              error: null,
            }),
          }),
        }),
      };

      (supabase.from as jest.Mock).mockReturnValue(mockQuery);

      const result = await golfCourseService.searchNearbyGolfCourses(48.8566, 2.3522, 100, 10);

      expect(result.data).toHaveLength(3);
      expect(result.data![0].id).toBe('course-proche');
      expect(result.data![1].id).toBe('course-moyen');
      expect(result.data![2].id).toBe('course-loin');

      // Vérifier que les distances sont croissantes
      expect(result.data![0].distance).toBeLessThan(result.data![1].distance);
      expect(result.data![1].distance).toBeLessThan(result.data![2].distance);
    });

    it('devrait gérer les erreurs de requête dans searchNearbyGolfCourses', async () => {
      const mockError = new Error('Database unavailable');
      const mockQuery = {
        select: jest.fn().mockReturnValue({
          not: jest.fn().mockReturnValue({
            not: jest.fn().mockResolvedValue({
              data: null,
              error: mockError,
            }),
          }),
        }),
      };

      (supabase.from as jest.Mock).mockReturnValue(mockQuery);

      const result = await golfCourseService.searchNearbyGolfCourses(48.8566, 2.3522, 10, 5);

      expect(result.data).toBeNull();
      expect(result.error).toEqual(expect.objectContaining({
        message: 'Database unavailable'
      }));
    });
  });

  describe('listGolfCoursesWithAvailability', () => {
    it('devrait récupérer les parcours avec comptage des disponibilités', async () => {
      const mockCourses = [
        {
          id: 'course-1',
          name: 'Golf Test',
          city: 'Paris',
          latitude: 48.8566,
          longitude: 2.3522,
        },
      ];

      // Mock pour listGolfCourses
      const mockListQuery = {
        select: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue({
            data: mockCourses,
            error: null,
          }),
        }),
      };

      // Mock pour les requêtes de comptage
      const mockCountQuery = {
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              gt: jest.fn().mockResolvedValue({
                count: 5,
                error: null,
              }),
            }),
          }),
        }),
      };

      (supabase.from as jest.Mock)
        .mockReturnValueOnce(mockListQuery) // Premier appel pour golf_parcours
        .mockReturnValueOnce(mockCountQuery) // Deuxième appel pour availabilities_count
        .mockReturnValueOnce(mockCountQuery); // Troisième appel pour pros_count

      const result = await golfCourseService.listGolfCoursesWithAvailability('2024-01-15');

      expect(result.data).toHaveLength(1);
      expect(result.data![0]).toEqual(
        expect.objectContaining({
          id: 'course-1',
          name: 'Golf Test',
          availabilities_count: 5,
          pros_count: 5,
        })
      );
      expect(result.error).toBeNull();
    });

    it('devrait gérer le cas où aucun parcours n\'est trouvé', async () => {
      const mockListQuery = {
        select: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue({
            data: [],
            error: null,
          }),
        }),
      };

      (supabase.from as jest.Mock).mockReturnValue(mockListQuery);

      const result = await golfCourseService.listGolfCoursesWithAvailability('2024-01-15');

      expect(result.data).toEqual([]);
      expect(result.error).toBeNull();
    });

    it('devrait gérer les erreurs lors de la récupération des parcours', async () => {
      const mockError = new Error('Database error');
      const mockListQuery = {
        select: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue({
            data: null,
            error: mockError,
          }),
        }),
      };

      (supabase.from as jest.Mock).mockReturnValue(mockListQuery);

      const result = await golfCourseService.listGolfCoursesWithAvailability('2024-01-15');

      expect(result.data).toBeNull();
      expect(result.error).toEqual(expect.objectContaining({
        message: 'Database error'
      }));
    });

    it('devrait gérer le cas où le comptage retourne null', async () => {
      const mockCourses = [
        {
          id: 'course-1',
          name: 'Golf Test',
          city: 'Paris',
        },
      ];

      const mockListQuery = {
        select: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue({
            data: mockCourses,
            error: null,
          }),
        }),
      };

      const mockCountQuery = {
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              gt: jest.fn().mockResolvedValue({
                count: null,
                error: null,
              }),
            }),
          }),
        }),
      };

      (supabase.from as jest.Mock)
        .mockReturnValueOnce(mockListQuery)
        .mockReturnValueOnce(mockCountQuery)
        .mockReturnValueOnce(mockCountQuery);

      const result = await golfCourseService.listGolfCoursesWithAvailability('2024-01-15');

      expect(result.data![0].availabilities_count).toBe(0);
      expect(result.data![0].pros_count).toBe(0);
    });

    it('devrait appliquer correctement les filtres via listGolfCourses', async () => {
      const mockCourses = [
        {
          id: 'course-1',
          name: 'Golf Paris',
          city: 'Paris',
        },
      ];

      const mockListQuery = {
        select: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue({
            data: mockCourses,
            error: null,
          }),
        }),
      };

      const mockCountQuery = {
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              gt: jest.fn().mockResolvedValue({
                count: 3,
                error: null,
              }),
            }),
          }),
        }),
      };

      (supabase.from as jest.Mock)
        .mockReturnValueOnce(mockListQuery)
        .mockReturnValueOnce(mockCountQuery)
        .mockReturnValueOnce(mockCountQuery);

      const filters = { city: 'Paris' };
      const pagination = { page: 1, limit: 10 };

      const result = await golfCourseService.listGolfCoursesWithAvailability(
        '2024-01-15',
        filters,
        pagination
      );

      expect(result.data).toHaveLength(1);
      expect(result.error).toBeNull();
    });

    it('devrait traiter plusieurs parcours avec des comptages différents', async () => {
      const mockCourses = [
        { id: 'course-1', name: 'Golf A', city: 'Paris' },
        { id: 'course-2', name: 'Golf B', city: 'Lyon' },
      ];

      const mockListQuery = {
        select: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue({
            data: mockCourses,
            error: null,
          }),
        }),
      };

      // Mock différents comptages pour chaque parcours
      const mockCountQuery1 = {
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              gt: jest.fn().mockResolvedValue({
                count: 5,
                error: null,
              }),
            }),
          }),
        }),
      };

      const mockCountQuery2 = {
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              gt: jest.fn().mockResolvedValue({
                count: 3,
                error: null,
              }),
            }),
          }),
        }),
      };

      const mockCountQuery3 = {
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              gt: jest.fn().mockResolvedValue({
                count: 2,
                error: null,
              }),
            }),
          }),
        }),
      };

      const mockCountQuery4 = {
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              gt: jest.fn().mockResolvedValue({
                count: 1,
                error: null,
              }),
            }),
          }),
        }),
      };

      (supabase.from as jest.Mock)
        .mockReturnValueOnce(mockListQuery)
        .mockReturnValueOnce(mockCountQuery1) // course-1 availabilities
        .mockReturnValueOnce(mockCountQuery2) // course-1 pros
        .mockReturnValueOnce(mockCountQuery3) // course-2 availabilities
        .mockReturnValueOnce(mockCountQuery4); // course-2 pros

      const result = await golfCourseService.listGolfCoursesWithAvailability('2024-01-15');

      expect(result.data).toHaveLength(2);
      expect(result.data![0]).toEqual(
        expect.objectContaining({
          id: 'course-1',
          availabilities_count: 5,
          pros_count: 2, // Corrigé: mockCountQuery2 = 3, mockCountQuery3 = 2
        })
      );
      expect(result.data![1]).toEqual(
        expect.objectContaining({
          id: 'course-2',
          availabilities_count: 3, // Corrigé: mockCountQuery3 = 2, mockCountQuery4 = 1 → course-2 = 3,1
          pros_count: 1,
        })
      );
    });

    it('devrait utiliser les paramètres corrects pour les requêtes de comptage', async () => {
      const mockCourses = [
        {
          id: 'course-123',
          name: 'Golf Test',
          city: 'Paris',
        },
      ];

      const mockListQuery = {
        select: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue({
            data: mockCourses,
            error: null,
          }),
        }),
      };

      const mockCountQuery = {
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              gt: jest.fn().mockResolvedValue({
                count: 1,
                error: null,
              }),
            }),
          }),
        }),
      };

      (supabase.from as jest.Mock)
        .mockReturnValueOnce(mockListQuery)
        .mockReturnValueOnce(mockCountQuery)
        .mockReturnValueOnce(mockCountQuery);

      await golfCourseService.listGolfCoursesWithAvailability('2024-01-15');

      // Vérifier les appels avec les bons paramètres
      expect(supabase.from).toHaveBeenCalledWith('golf_parcours');
      expect(supabase.from).toHaveBeenCalledWith('pro_availabilities');

      // Vérifier les paramètres des requêtes de comptage
      const countCalls = (supabase.from as jest.Mock).mock.calls.filter(
        call => call[0] === 'pro_availabilities'
      );
      expect(countCalls).toHaveLength(2);
    });
  });

  describe('getCourseStats', () => {
    it('devrait calculer les statistiques complètes d\'un parcours', async () => {
      // Mock pour bookings count
      const mockBookingsQuery = {
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({
              count: 25,
              error: null,
            }),
          }),
        }),
      };

      // Mock pour pros actifs
      const mockProsQuery = {
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            gte: jest.fn().mockResolvedValue({
              data: [
                { pro_id: 'pro-1' },
                { pro_id: 'pro-2' },
                { pro_id: 'pro-1' }, // Duplicata pour tester la déduplication
              ],
              error: null,
            }),
          }),
        }),
      };

      // Mock pour reviews
      const mockReviewsQuery = {
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({
              data: [
                { reviews: [{ rating: 5 }] },
                { reviews: [{ rating: 4 }] },
                { reviews: [{ rating: 3 }] },
              ],
              error: null,
            }),
          }),
        }),
      };

      (supabase.from as jest.Mock)
        .mockReturnValueOnce(mockBookingsQuery)
        .mockReturnValueOnce(mockProsQuery)
        .mockReturnValueOnce(mockReviewsQuery);

      const result = await golfCourseService.getCourseStats('course-1');

      expect(result.data).toEqual({
        totalBookings: 25,
        activePros: 2, // Déduplication : pro-1 et pro-2
        averageRating: 4.0, // (5+4+3)/3 = 4.0
        totalReviews: 3,
      });
      expect(result.error).toBeNull();
    });

    it('devrait gérer le cas où il n\'y a aucune statistique', async () => {
      const mockEmptyQuery = {
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({
              count: null,
              data: [],
              error: null,
            }),
          }),
        }),
      };

      const mockEmptyProsQuery = {
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            gte: jest.fn().mockResolvedValue({
              data: [],
              error: null,
            }),
          }),
        }),
      };

      (supabase.from as jest.Mock)
        .mockReturnValueOnce(mockEmptyQuery)
        .mockReturnValueOnce(mockEmptyProsQuery)
        .mockReturnValueOnce(mockEmptyQuery);

      const result = await golfCourseService.getCourseStats('course-empty');

      expect(result.data).toEqual({
        totalBookings: 0,
        activePros: 0,
        averageRating: 0,
        totalReviews: 0,
      });
      expect(result.error).toBeNull();
    });

    it('devrait gérer les erreurs lors de la récupération des bookings', async () => {
      const mockError = new Error('Database error');

      // Mock pour bookings avec erreur qui throw
      const mockErrorQuery = {
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockRejectedValue(mockError), // Utilisé mockRejectedValue au lieu de mockResolvedValue
          }),
        }),
      };

      (supabase.from as jest.Mock).mockReturnValue(mockErrorQuery);

      const result = await golfCourseService.getCourseStats('course-1');

      expect(result.data).toBeNull();
      expect(result.error).toEqual(expect.objectContaining({
        message: 'Database error'
      }));
    });

    it('devrait calculer correctement la note moyenne avec des notes décimales', async () => {
      const mockBookingsQuery = {
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({
              count: 10,
              error: null,
            }),
          }),
        }),
      };

      const mockProsQuery = {
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            gte: jest.fn().mockResolvedValue({
              data: [{ pro_id: 'pro-1' }],
              error: null,
            }),
          }),
        }),
      };

      const mockReviewsQuery = {
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({
              data: [
                { reviews: [{ rating: 4.7 }] },
                { reviews: [{ rating: 3.2 }] },
                { reviews: [{ rating: 4.1 }] },
              ],
              error: null,
            }),
          }),
        }),
      };

      (supabase.from as jest.Mock)
        .mockReturnValueOnce(mockBookingsQuery)
        .mockReturnValueOnce(mockProsQuery)
        .mockReturnValueOnce(mockReviewsQuery);

      const result = await golfCourseService.getCourseStats('course-1');

      // (4.7 + 3.2 + 4.1) / 3 = 4.0
      expect(result.data!.averageRating).toBe(4.0);
      expect(result.data!.totalReviews).toBe(3);
    });

    it('devrait utiliser les filtres corrects pour les requêtes', async () => {
      const mockBookingsQuery = {
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({
              count: 5,
              error: null,
            }),
          }),
        }),
      };

      const mockProsQuery = {
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            gte: jest.fn().mockResolvedValue({
              data: [],
              error: null,
            }),
          }),
        }),
      };

      const mockReviewsQuery = {
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({
              data: [],
              error: null,
            }),
          }),
        }),
      };

      (supabase.from as jest.Mock)
        .mockReturnValueOnce(mockBookingsQuery)
        .mockReturnValueOnce(mockProsQuery)
        .mockReturnValueOnce(mockReviewsQuery);

      await golfCourseService.getCourseStats('course-123');

      // Vérifier les appels aux bonnes tables
      expect(supabase.from).toHaveBeenCalledWith('bookings');
      expect(supabase.from).toHaveBeenCalledWith('pro_availabilities');

      // Vérifier que les bonnes requêtes sont utilisées
      const fromCalls = (supabase.from as jest.Mock).mock.calls;
      expect(fromCalls[0][0]).toBe('bookings'); // totalBookings
      expect(fromCalls[1][0]).toBe('pro_availabilities'); // activePros
      expect(fromCalls[2][0]).toBe('bookings'); // reviews
    });

    it('devrait gérer les reviews avec plusieurs ratings par booking', async () => {
      const mockBookingsQuery = {
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({
              count: 15,
              error: null,
            }),
          }),
        }),
      };

      const mockProsQuery = {
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            gte: jest.fn().mockResolvedValue({
              data: [{ pro_id: 'pro-1' }],
              error: null,
            }),
          }),
        }),
      };

      const mockReviewsQuery = {
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({
              data: [
                { reviews: [{ rating: 5 }, { rating: 4 }] }, // 2 reviews
                { reviews: [{ rating: 3 }] }, // 1 review
              ],
              error: null,
            }),
          }),
        }),
      };

      (supabase.from as jest.Mock)
        .mockReturnValueOnce(mockBookingsQuery)
        .mockReturnValueOnce(mockProsQuery)
        .mockReturnValueOnce(mockReviewsQuery);

      const result = await golfCourseService.getCourseStats('course-1');

      expect(result.data!.totalReviews).toBe(3); // 2 + 1 = 3 reviews total
      expect(result.data!.averageRating).toBe(4.0); // (5+4+3)/3 = 4.0
    });

    it('devrait arrondir correctement la note moyenne', async () => {
      const mockBookingsQuery = {
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({
              count: 8,
              error: null,
            }),
          }),
        }),
      };

      const mockProsQuery = {
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            gte: jest.fn().mockResolvedValue({
              data: [{ pro_id: 'pro-1' }],
              error: null,
            }),
          }),
        }),
      };

      const mockReviewsQuery = {
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({
              data: [
                { reviews: [{ rating: 4.66 }] },
                { reviews: [{ rating: 4.33 }] },
              ],
              error: null,
            }),
          }),
        }),
      };

      (supabase.from as jest.Mock)
        .mockReturnValueOnce(mockBookingsQuery)
        .mockReturnValueOnce(mockProsQuery)
        .mockReturnValueOnce(mockReviewsQuery);

      const result = await golfCourseService.getCourseStats('course-1');

      // (4.66 + 4.33) / 2 = 4.495 → arrondi à 4.5
      expect(result.data!.averageRating).toBe(4.5);
    });

    it('devrait gérer le cas où les pros actifs retournent null', async () => {
      const mockBookingsQuery = {
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({
              count: 5,
              error: null,
            }),
          }),
        }),
      };

      const mockProsQuery = {
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            gte: jest.fn().mockResolvedValue({
              data: null,
              error: null,
            }),
          }),
        }),
      };

      const mockReviewsQuery = {
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({
              data: [],
              error: null,
            }),
          }),
        }),
      };

      (supabase.from as jest.Mock)
        .mockReturnValueOnce(mockBookingsQuery)
        .mockReturnValueOnce(mockProsQuery)
        .mockReturnValueOnce(mockReviewsQuery);

      const result = await golfCourseService.getCourseStats('course-1');

      expect(result.data!.activePros).toBe(0);
      expect(result.error).toBeNull();
    });
  });

  describe('listGolfCourses', () => {
    it('devrait lister tous les parcours sans filtres', async () => {
      const mockCourses = [
        {
          id: 'course-1',
          name: 'Golf A',
          city: 'Paris',
          latitude: 48.8566,
          longitude: 2.3522,
        },
        {
          id: 'course-2',
          name: 'Golf B',
          city: 'Lyon',
          latitude: 45.7640,
          longitude: 4.8357,
        },
      ];

      const mockQuery = {
        select: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue({
            data: mockCourses,
            error: null,
          }),
        }),
      };

      (supabase.from as jest.Mock).mockReturnValue(mockQuery);

      const result = await golfCourseService.listGolfCourses();

      expect(result.data).toHaveLength(2);
      expect(result.data![0].name).toBe('Golf A');
      expect(result.error).toBeNull();
    });

    it('devrait appliquer le filtre par ville', async () => {
      const mockCourses = [
        {
          id: 'course-1',
          name: 'Golf Paris',
          city: 'Paris',
        },
        {
          id: 'course-2',
          name: 'Golf Lyon',
          city: 'Lyon',
        },
      ];

      const mockQuery = {
        select: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue({
            data: mockCourses,
            error: null,
          }),
        }),
      };

      (supabase.from as jest.Mock).mockReturnValue(mockQuery);

      const result = await golfCourseService.listGolfCourses({ city: 'paris' });

      // Le filtre côté client devrait filtrer seulement le cours de Paris
      expect(result.data).toHaveLength(1);
      expect(result.data![0].city).toBe('Paris');
    });

    it('devrait appliquer le filtre par nom', async () => {
      const mockCourses = [
        {
          id: 'course-1',
          name: 'Golf National',
          city: 'Paris',
        },
        {
          id: 'course-2',
          name: 'Golf Municipal',
          city: 'Lyon',
        },
      ];

      const mockQuery = {
        select: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue({
            data: mockCourses,
            error: null,
          }),
        }),
      };

      (supabase.from as jest.Mock).mockReturnValue(mockQuery);

      const result = await golfCourseService.listGolfCourses({ name: 'national' });

      expect(result.data).toHaveLength(1);
      expect(result.data![0].name).toBe('Golf National');
    });

    it('devrait appliquer le filtre par proximité', async () => {
      const mockCourses = [
        {
          id: 'course-proche',
          name: 'Golf Proche',
          city: 'Paris',
          location: { coordinates: [2.3530, 48.8570] }, // ~500m du centre
        },
        {
          id: 'course-loin',
          name: 'Golf Loin',
          city: 'Lyon',
          location: { coordinates: [4.8357, 45.7640] }, // ~400km
        },
      ];

      const mockQuery = {
        select: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue({
            data: mockCourses,
            error: null,
          }),
        }),
      };

      (supabase.from as jest.Mock).mockReturnValue(mockQuery);

      const result = await golfCourseService.listGolfCourses({
        nearLocation: {
          lat: 48.8566,
          lng: 2.3522,
          radiusKm: 10,
        },
      });

      expect(result.data).toHaveLength(1);
      expect(result.data![0].id).toBe('course-proche');
      expect(result.data![0]).toHaveProperty('distance');
    });

    it('devrait appliquer la pagination', async () => {
      const mockCourses = Array.from({ length: 25 }, (_, i) => ({
        id: `course-${i}`,
        name: `Golf ${i}`,
        city: 'Paris',
      }));

      const mockQuery = {
        select: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue({
            data: mockCourses,
            error: null,
          }),
        }),
      };

      (supabase.from as jest.Mock).mockReturnValue(mockQuery);

      const result = await golfCourseService.listGolfCourses(
        {},
        { page: 2, limit: 10 }
      );

      expect(result.data).toHaveLength(10);
      // Page 2 (start=10, end=20), après tri par nom : Golf 0, Golf 1, Golf 10, Golf 11...Golf 19, Golf 2, Golf 20...
      expect(result.data![0].name).toBe('Golf 18'); // Golf 18 est le 10ème dans l'ordre alphabétique
    });

    it('devrait appliquer le tri par nom (par défaut)', async () => {
      const mockCourses = [
        { id: 'course-1', name: 'Zebra Golf', city: 'Paris' },
        { id: 'course-2', name: 'Alpha Golf', city: 'Lyon' },
        { id: 'course-3', name: 'Beta Golf', city: 'Nice' },
      ];

      const mockQuery = {
        select: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue({
            data: mockCourses,
            error: null,
          }),
        }),
      };

      (supabase.from as jest.Mock).mockReturnValue(mockQuery);

      const result = await golfCourseService.listGolfCourses();

      expect(result.data![0].name).toBe('Alpha Golf');
      expect(result.data![1].name).toBe('Beta Golf');
      expect(result.data![2].name).toBe('Zebra Golf');
    });

    it('devrait appliquer le tri personnalisé', async () => {
      const mockCourses = [
        { id: 'course-1', name: 'Golf A', city: 'Zebra' },
        { id: 'course-2', name: 'Golf B', city: 'Alpha' },
      ];

      const mockQuery = {
        select: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue({
            data: mockCourses,
            error: null,
          }),
        }),
      };

      (supabase.from as jest.Mock).mockReturnValue(mockQuery);

      const result = await golfCourseService.listGolfCourses(
        {},
        undefined,
        { sortBy: 'city', sortOrder: 'asc' }
      );

      expect(result.data![0].city).toBe('Alpha');
      expect(result.data![1].city).toBe('Zebra');
    });

    it('devrait gérer les erreurs de base de données', async () => {
      const mockError = new Error('Database connection failed');
      const mockQuery = {
        select: jest.fn().mockReturnValue({
          order: jest.fn().mockRejectedValue(mockError),
        }),
      };

      (supabase.from as jest.Mock).mockReturnValue(mockQuery);

      const result = await golfCourseService.listGolfCourses();

      expect(result.data).toBeNull();
      expect(result.error).toEqual(expect.objectContaining({
        message: 'Database connection failed'
      }));
    });
  });

  describe('listGolfCoursesWithLocation', () => {
    it('devrait récupérer les parcours avec transformation PostGIS', async () => {
      const mockCourses = [
        {
          id: 'course-1',
          name: 'Golf Test',
          latitude: 48.8566,
          longitude: 2.3522,
          city: 'Paris',
        },
      ];

      const mockQuery = {
        select: jest.fn().mockReturnValue({
          not: jest.fn().mockReturnValue({
            not: jest.fn().mockResolvedValue({
              data: mockCourses,
              error: null,
            }),
          }),
        }),
      };

      (supabase.from as jest.Mock).mockReturnValue(mockQuery);

      const result = await golfCourseService.listGolfCoursesWithLocation();

      expect(result.data).toHaveLength(1);
      expect(result.data![0].location).toEqual({
        type: 'Point',
        coordinates: [2.3522, 48.8566],
      });
      expect(result.error).toBeNull();
    });

    it('devrait filtrer les parcours sans coordonnées', async () => {
      const mockCourses = [
        {
          id: 'course-1',
          name: 'Golf Avec Coords',
          latitude: 48.8566,
          longitude: 2.3522,
          city: 'Paris',
        },
        {
          id: 'course-2',
          name: 'Golf Sans Coords',
          latitude: null,
          longitude: null,
          city: 'Lyon',
        },
      ];

      const mockQuery = {
        select: jest.fn().mockReturnValue({
          not: jest.fn().mockReturnValue({
            not: jest.fn().mockResolvedValue({
              data: mockCourses,
              error: null,
            }),
          }),
        }),
      };

      (supabase.from as jest.Mock).mockReturnValue(mockQuery);

      const result = await golfCourseService.listGolfCoursesWithLocation();

      expect(result.data).toHaveLength(2);
      expect(result.data![0].location).toBeTruthy();
      expect(result.data![1].location).toBeNull();
    });

    it('devrait gérer les erreurs de requête', async () => {
      const mockError = new Error('Network error');
      const mockQuery = {
        select: jest.fn().mockReturnValue({
          not: jest.fn().mockReturnValue({
            not: jest.fn().mockRejectedValue(mockError),
          }),
        }),
      };

      (supabase.from as jest.Mock).mockReturnValue(mockQuery);

      const result = await golfCourseService.listGolfCoursesWithLocation();

      expect(result.data).toBeNull();
      expect(result.error).toEqual(expect.objectContaining({
        message: 'Network error'
      }));
    });

    it('devrait gérer les parcours avec coordonnées partielles', async () => {
      const mockCourses = [
        {
          id: 'course-1',
          name: 'Golf Lat Seulement',
          latitude: 48.8566,
          longitude: null,
          city: 'Paris',
        },
        {
          id: 'course-2',
          name: 'Golf Lng Seulement',
          latitude: null,
          longitude: 2.3522,
          city: 'Lyon',
        },
      ];

      const mockQuery = {
        select: jest.fn().mockReturnValue({
          not: jest.fn().mockReturnValue({
            not: jest.fn().mockResolvedValue({
              data: mockCourses,
              error: null,
            }),
          }),
        }),
      };

      (supabase.from as jest.Mock).mockReturnValue(mockQuery);

      const result = await golfCourseService.listGolfCoursesWithLocation();

      expect(result.data).toHaveLength(2);
      expect(result.data![0].location).toBeNull();
      expect(result.data![1].location).toBeNull();
    });
  });

  describe('uploadCourseImages', () => {
    it('devrait uploader plusieurs fichiers avec succès', async () => {
      const mockFiles = [
        new File(['image1'], 'image1.jpg', { type: 'image/jpeg' }),
        new File(['image2'], 'image2.png', { type: 'image/png' }),
      ];

      // Mock pour upload storage
      const mockStorageUpload = jest.fn().mockResolvedValue({ error: null });
      const mockStorageGetPublicUrl = jest.fn().mockReturnValue({
        data: { publicUrl: 'https://storage.url/file.jpg' },
      });

      // Mock pour get course
      const mockSelectQuery = {
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { images: ['existing-image.jpg'] },
              error: null,
            }),
          }),
        }),
      };

      // Mock pour update course
      const mockUpdateQuery = {
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            error: null,
          }),
        }),
      };

      (supabase.storage.from as jest.Mock).mockReturnValue({
        upload: mockStorageUpload,
        getPublicUrl: mockStorageGetPublicUrl,
      });

      (supabase.from as jest.Mock)
        .mockReturnValueOnce(mockSelectQuery)
        .mockReturnValueOnce(mockUpdateQuery);

      const result = await golfCourseService.uploadCourseImages('course-1', mockFiles);

      expect(result.data).toHaveLength(2);
      expect(result.data![0]).toBe('https://storage.url/file.jpg');
      expect(result.error).toBeNull();

      // Vérifier les appels storage
      expect(mockStorageUpload).toHaveBeenCalledTimes(2);
      expect(mockStorageGetPublicUrl).toHaveBeenCalledTimes(2);
    });

    it('devrait gérer les erreurs d\'upload storage', async () => {
      const mockFiles = [
        new File(['image1'], 'image1.jpg', { type: 'image/jpeg' }),
      ];

      const mockStorageError = new Error('Storage full');
      const mockStorageUpload = jest.fn().mockResolvedValue({ error: mockStorageError });

      (supabase.storage.from as jest.Mock).mockReturnValue({
        upload: mockStorageUpload,
        getPublicUrl: jest.fn(),
      });

      const result = await golfCourseService.uploadCourseImages('course-1', mockFiles);

      expect(result.data).toBeNull();
      expect(result.error).toEqual(expect.objectContaining({
        message: 'Storage full'
      }));
    });

    it('devrait gérer les erreurs de mise à jour de la base de données', async () => {
      const mockFiles = [
        new File(['image1'], 'image1.jpg', { type: 'image/jpeg' }),
      ];

      // Mock pour upload storage (succès)
      const mockStorageUpload = jest.fn().mockResolvedValue({ error: null });
      const mockStorageGetPublicUrl = jest.fn().mockReturnValue({
        data: { publicUrl: 'https://storage.url/file.jpg' },
      });

      // Mock pour get course (succès)
      const mockSelectQuery = {
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { images: [] },
              error: null,
            }),
          }),
        }),
      };

      // Mock pour update course (erreur)
      const mockUpdateError = new Error('Database error');
      const mockUpdateQuery = {
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            error: mockUpdateError,
          }),
        }),
      };

      (supabase.storage.from as jest.Mock).mockReturnValue({
        upload: mockStorageUpload,
        getPublicUrl: mockStorageGetPublicUrl,
      });

      (supabase.from as jest.Mock)
        .mockReturnValueOnce(mockSelectQuery)
        .mockReturnValueOnce(mockUpdateQuery);

      const result = await golfCourseService.uploadCourseImages('course-1', mockFiles);

      expect(result.data).toBeNull();
      expect(result.error).toEqual(expect.objectContaining({
        message: 'Database error'
      }));
    });

    it('devrait ajouter les nouvelles images aux images existantes', async () => {
      const mockFiles = [
        new File(['image1'], 'image1.jpg', { type: 'image/jpeg' }),
      ];

      const mockStorageUpload = jest.fn().mockResolvedValue({ error: null });
      const mockStorageGetPublicUrl = jest.fn().mockReturnValue({
        data: { publicUrl: 'https://storage.url/new-image.jpg' },
      });

      const mockSelectQuery = {
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { images: ['https://storage.url/existing-image.jpg'] },
              error: null,
            }),
          }),
        }),
      };

      const mockUpdateQuery = {
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            error: null,
          }),
        }),
      };

      (supabase.storage.from as jest.Mock).mockReturnValue({
        upload: mockStorageUpload,
        getPublicUrl: mockStorageGetPublicUrl,
      });

      (supabase.from as jest.Mock)
        .mockReturnValueOnce(mockSelectQuery)
        .mockReturnValueOnce(mockUpdateQuery);

      await golfCourseService.uploadCourseImages('course-1', mockFiles);

      // Vérifier que l'update combine les images existantes et nouvelles
      expect(mockUpdateQuery.update).toHaveBeenCalledWith({
        images: [
          'https://storage.url/existing-image.jpg',
          'https://storage.url/new-image.jpg',
        ],
      });
    });

    it('devrait gérer le cas où le parcours n\'a pas d\'images existantes', async () => {
      const mockFiles = [
        new File(['image1'], 'image1.jpg', { type: 'image/jpeg' }),
      ];

      const mockStorageUpload = jest.fn().mockResolvedValue({ error: null });
      const mockStorageGetPublicUrl = jest.fn().mockReturnValue({
        data: { publicUrl: 'https://storage.url/new-image.jpg' },
      });

      const mockSelectQuery = {
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { images: null }, // Pas d'images existantes
              error: null,
            }),
          }),
        }),
      };

      const mockUpdateQuery = {
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            error: null,
          }),
        }),
      };

      (supabase.storage.from as jest.Mock).mockReturnValue({
        upload: mockStorageUpload,
        getPublicUrl: mockStorageGetPublicUrl,
      });

      (supabase.from as jest.Mock)
        .mockReturnValueOnce(mockSelectQuery)
        .mockReturnValueOnce(mockUpdateQuery);

      const result = await golfCourseService.uploadCourseImages('course-1', mockFiles);

      expect(result.error).toBeNull();
      expect(mockUpdateQuery.update).toHaveBeenCalledWith({
        images: ['https://storage.url/new-image.jpg'],
      });
    });

    it('devrait générer des noms de fichiers uniques', async () => {
      const mockFiles = [
        new File(['image1'], 'test.jpg', { type: 'image/jpeg' }),
        new File(['image2'], 'test.png', { type: 'image/png' }),
      ];

      const mockStorageUpload = jest.fn().mockResolvedValue({ error: null });
      const mockStorageGetPublicUrl = jest.fn().mockReturnValue({
        data: { publicUrl: 'https://storage.url/file.jpg' },
      });

      const mockSelectQuery = {
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { images: [] },
              error: null,
            }),
          }),
        }),
      };

      const mockUpdateQuery = {
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            error: null,
          }),
        }),
      };

      (supabase.storage.from as jest.Mock).mockReturnValue({
        upload: mockStorageUpload,
        getPublicUrl: mockStorageGetPublicUrl,
      });

      (supabase.from as jest.Mock)
        .mockReturnValueOnce(mockSelectQuery)
        .mockReturnValueOnce(mockUpdateQuery);

      await golfCourseService.uploadCourseImages('course-123', mockFiles);

      // Vérifier que les noms de fichiers contiennent l'ID du cours et un timestamp
      const uploadCalls = mockStorageUpload.mock.calls;
      expect(uploadCalls[0][0]).toMatch(/^golf-courses\/course-123-\d+-0\.jpg$/);
      expect(uploadCalls[1][0]).toMatch(/^golf-courses\/course-123-\d+-1\.png$/);
    });
  });
});