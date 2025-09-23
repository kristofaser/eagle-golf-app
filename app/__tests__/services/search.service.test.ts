import { searchService } from '../../services/search.service';
import { profileService } from '../../services/profile.service';
import { golfCourseService } from '../../services/golf-course.service';
import { bookingService } from '../../services/booking.service';
import { supabase } from '../../utils/supabase/client';

// Mock des services dependencies
jest.mock('../../services/profile.service');
jest.mock('../../services/golf-course.service');
jest.mock('../../services/booking.service');
jest.mock('../../utils/supabase/client');

describe('SearchService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // ========== PHASE 1: MÉTHODES DE BASE ==========

  describe('searchByGolfCourse', () => {
    const mockGolfCourse = {
      id: 'course-1',
      name: 'Golf Club Test',
      city: 'Paris',
      description: 'Un superbe parcours',
    };

    const mockAvailabilities = [
      {
        id: 'avail-1',
        pro_id: 'pro-1',
        golf_course_id: 'course-1',
        date: '2025-01-15',
        start_time: '09:00',
        max_players: 4,
        current_bookings: 1,
        profiles: {
          id: 'pro-1',
          first_name: 'Jean',
          last_name: 'Dupont',
          city: 'Paris',
        },
      },
      {
        id: 'avail-2',
        pro_id: 'pro-2',
        golf_course_id: 'course-1',
        date: '2025-01-15',
        start_time: '14:00',
        max_players: 3,
        current_bookings: 0,
        profiles: {
          id: 'pro-2',
          first_name: 'Marie',
          last_name: 'Martin',
          city: 'Lyon',
        },
      },
    ];

    it('devrait rechercher avec succès par parcours de golf', async () => {
      (golfCourseService.getGolfCourse as jest.Mock).mockResolvedValue({
        data: mockGolfCourse,
        error: null,
      });

      (bookingService.getProAvailabilities as jest.Mock).mockResolvedValue({
        data: mockAvailabilities,
        error: null,
      });

      const result = await searchService.searchByGolfCourse({
        golfCourseId: 'course-1',
        date: '2025-01-15',
      });

      expect(result.error).toBeNull();
      expect(result.data).toBeDefined();
      expect(result.data?.mode).toBe('by-course');
      expect(result.data?.golfCourses).toHaveLength(1);
      expect(result.data?.pros).toHaveLength(2);
      expect(result.data?.totalResults).toBe(2);
    });

    it('devrait filtrer par créneau matinal', async () => {
      (golfCourseService.getGolfCourse as jest.Mock).mockResolvedValue({
        data: mockGolfCourse,
        error: null,
      });

      (bookingService.getProAvailabilities as jest.Mock).mockResolvedValue({
        data: mockAvailabilities,
        error: null,
      });

      const result = await searchService.searchByGolfCourse({
        golfCourseId: 'course-1',
        date: '2025-01-15',
        timeSlot: 'morning',
      });

      expect(result.error).toBeNull();
      expect(result.data?.availabilities).toHaveLength(1);
      expect(result.data?.availabilities?.[0].start_time).toBe('09:00');
    });

    it('devrait filtrer par créneau après-midi', async () => {
      (golfCourseService.getGolfCourse as jest.Mock).mockResolvedValue({
        data: mockGolfCourse,
        error: null,
      });

      (bookingService.getProAvailabilities as jest.Mock).mockResolvedValue({
        data: mockAvailabilities,
        error: null,
      });

      const result = await searchService.searchByGolfCourse({
        golfCourseId: 'course-1',
        date: '2025-01-15',
        timeSlot: 'afternoon',
      });

      expect(result.error).toBeNull();
      expect(result.data?.availabilities).toHaveLength(1);
      expect(result.data?.availabilities?.[0].start_time).toBe('14:00');
    });

    it('devrait filtrer par nombre minimum de joueurs', async () => {
      const availabilitiesWithDifferentSlots = [
        {
          ...mockAvailabilities[0],
          max_players: 4,
          current_bookings: 3, // 1 place libre seulement
        },
        {
          ...mockAvailabilities[1],
          max_players: 4,
          current_bookings: 1, // 3 places libres
        },
      ];

      (golfCourseService.getGolfCourse as jest.Mock).mockResolvedValue({
        data: mockGolfCourse,
        error: null,
      });

      (bookingService.getProAvailabilities as jest.Mock).mockResolvedValue({
        data: availabilitiesWithDifferentSlots,
        error: null,
      });

      const result = await searchService.searchByGolfCourse({
        golfCourseId: 'course-1',
        date: '2025-01-15',
        minPlayers: 2,
      });

      expect(result.error).toBeNull();
      expect(result.data?.availabilities).toHaveLength(1);
      expect(result.data?.availabilities?.[0].id).toBe('avail-2');
    });

    it("devrait gérer le cas où le parcours n'existe pas", async () => {
      (golfCourseService.getGolfCourse as jest.Mock).mockResolvedValue({
        data: null,
        error: new Error('Parcours non trouvé'),
      });

      const result = await searchService.searchByGolfCourse({
        golfCourseId: 'nonexistent',
        date: '2025-01-15',
      });

      expect(result.data).toBeNull();
      expect(result.error).toEqual(
        expect.objectContaining({
          message: 'Parcours non trouvé',
        })
      );
    });

    it('devrait gérer les erreurs de récupération des disponibilités', async () => {
      (golfCourseService.getGolfCourse as jest.Mock).mockResolvedValue({
        data: mockGolfCourse,
        error: null,
      });

      (bookingService.getProAvailabilities as jest.Mock).mockResolvedValue({
        data: null,
        error: new Error('Erreur disponibilités'),
      });

      const result = await searchService.searchByGolfCourse({
        golfCourseId: 'course-1',
        date: '2025-01-15',
      });

      expect(result.data).toBeNull();
      expect(result.error).toEqual(
        expect.objectContaining({
          message: 'Erreur disponibilités',
        })
      );
    });

    it("devrait gérer le cas où aucune disponibilité n'est trouvée", async () => {
      (golfCourseService.getGolfCourse as jest.Mock).mockResolvedValue({
        data: mockGolfCourse,
        error: null,
      });

      (bookingService.getProAvailabilities as jest.Mock).mockResolvedValue({
        data: [],
        error: null,
      });

      const result = await searchService.searchByGolfCourse({
        golfCourseId: 'course-1',
        date: '2025-01-15',
      });

      expect(result.error).toBeNull();
      expect(result.data?.availabilities).toHaveLength(0);
      expect(result.data?.pros).toHaveLength(0);
      expect(result.data?.totalResults).toBe(0);
    });

    it('devrait déduplicamer les pros uniques', async () => {
      const availabilitiesWithDuplicatePro = [
        {
          ...mockAvailabilities[0],
          id: 'avail-1',
          pro_id: 'pro-1',
        },
        {
          ...mockAvailabilities[0],
          id: 'avail-3',
          pro_id: 'pro-1', // Même pro dans un autre créneau
          start_time: '11:00',
        },
      ];

      (golfCourseService.getGolfCourse as jest.Mock).mockResolvedValue({
        data: mockGolfCourse,
        error: null,
      });

      (bookingService.getProAvailabilities as jest.Mock).mockResolvedValue({
        data: availabilitiesWithDuplicatePro,
        error: null,
      });

      const result = await searchService.searchByGolfCourse({
        golfCourseId: 'course-1',
        date: '2025-01-15',
      });

      expect(result.error).toBeNull();
      expect(result.data?.pros).toHaveLength(1); // Pro unique malgré 2 créneaux
      expect(result.data?.availabilities).toHaveLength(2); // Mais 2 créneaux
    });
  });

  describe('searchByPro', () => {
    const mockPros = [
      {
        id: 'pro-1',
        first_name: 'Jean',
        last_name: 'Dupont',
        city: 'Paris',
        hourly_rate: 50,
        specialties: ['putting', 'driving'],
        languages: ['français', 'anglais'],
      },
      {
        id: 'pro-2',
        first_name: 'Marie',
        last_name: 'Martin',
        city: 'Lyon',
        hourly_rate: 75,
        specialties: ['swing', 'putting'],
        languages: ['français'],
      },
    ];

    const mockAvailabilitiesForPros = [
      {
        id: 'avail-1',
        pro_id: 'pro-1',
        golf_course_id: 'course-1',
        date: '2025-01-15',
        start_time: '09:00',
        golf_parcours: {
          id: 'course-1',
          name: 'Golf Club Paris',
          city: 'Paris',
        },
      },
    ];

    it('devrait rechercher des pros sans critères spécifiques', async () => {
      (profileService.listProProfiles as jest.Mock).mockResolvedValue({
        data: mockPros,
        error: null,
      });

      const result = await searchService.searchByPro({});

      expect(result.error).toBeNull();
      expect(result.data).toBeDefined();
      expect(result.data?.mode).toBe('by-pro');
      expect(result.data?.pros).toHaveLength(2);
      expect(result.data?.totalResults).toBe(2);
    });

    it('devrait appliquer les filtres de recherche des pros', async () => {
      (profileService.listProProfiles as jest.Mock).mockResolvedValue({
        data: mockPros,
        error: null,
      });

      await searchService.searchByPro({
        city: 'Paris',
        specialties: ['putting'],
        priceRange: { min: 40, max: 60 },
        canTravel: true,
        language: 'anglais',
      });

      expect(profileService.listProProfiles).toHaveBeenCalledWith(
        {
          city: 'Paris',
          specialties: ['putting'],
          minHourlyRate: 40,
          maxHourlyRate: 60,
          canTravel: true,
          languages: ['anglais'],
        },
        { limit: 50 }
      );
    });

    it('devrait récupérer les disponibilités quand une date est spécifiée', async () => {
      (profileService.listProProfiles as jest.Mock).mockResolvedValue({
        data: mockPros,
        error: null,
      });

      (bookingService.getProAvailabilities as jest.Mock)
        .mockResolvedValueOnce({
          data: mockAvailabilitiesForPros,
          error: null,
        })
        .mockResolvedValueOnce({
          data: [],
          error: null,
        });

      const result = await searchService.searchByPro({
        date: '2025-01-15',
      });

      expect(result.error).toBeNull();
      expect(result.data?.availabilities).toHaveLength(1);
      expect(result.data?.golfCourses).toHaveLength(1);
      expect(bookingService.getProAvailabilities).toHaveBeenCalledTimes(2);
    });

    it('devrait gérer les erreurs de récupération des pros', async () => {
      (profileService.listProProfiles as jest.Mock).mockResolvedValue({
        data: null,
        error: new Error('Erreur récupération pros'),
      });

      const result = await searchService.searchByPro({});

      expect(result.data).toBeNull();
      expect(result.error).toEqual(
        expect.objectContaining({
          message: 'Erreur récupération pros',
        })
      );
    });

    it("devrait filtrer les résultats des disponibilités en cas d'erreur partielle", async () => {
      (profileService.listProProfiles as jest.Mock).mockResolvedValue({
        data: mockPros,
        error: null,
      });

      (bookingService.getProAvailabilities as jest.Mock)
        .mockResolvedValueOnce({
          data: mockAvailabilitiesForPros,
          error: null,
        })
        .mockResolvedValueOnce({
          data: null,
          error: new Error('Erreur pour ce pro'),
        });

      const result = await searchService.searchByPro({
        date: '2025-01-15',
      });

      expect(result.error).toBeNull();
      expect(result.data?.availabilities).toHaveLength(1); // Seules les disponibilités valides
    });

    it('devrait déduplicamer les parcours de golf', async () => {
      const availabilitiesWithSameCourse = [
        ...mockAvailabilitiesForPros,
        {
          id: 'avail-2',
          pro_id: 'pro-2',
          golf_course_id: 'course-1', // Même parcours
          date: '2025-01-15',
          start_time: '14:00',
          golf_parcours: {
            id: 'course-1',
            name: 'Golf Club Paris',
            city: 'Paris',
          },
        },
      ];

      (profileService.listProProfiles as jest.Mock).mockResolvedValue({
        data: mockPros,
        error: null,
      });

      (bookingService.getProAvailabilities as jest.Mock)
        .mockResolvedValueOnce({
          data: availabilitiesWithSameCourse,
          error: null,
        })
        .mockResolvedValueOnce({
          data: [],
          error: null,
        });

      const result = await searchService.searchByPro({
        date: '2025-01-15',
      });

      expect(result.error).toBeNull();
      expect(result.data?.golfCourses).toHaveLength(1); // Parcours dédupliqué
      expect(result.data?.availabilities).toHaveLength(2); // Mais 2 créneaux
    });

    it('devrait fonctionner sans date spécifiée', async () => {
      (profileService.listProProfiles as jest.Mock).mockResolvedValue({
        data: mockPros,
        error: null,
      });

      const result = await searchService.searchByPro({
        city: 'Paris',
      });

      expect(result.error).toBeNull();
      expect(result.data?.pros).toHaveLength(2);
      expect(result.data?.availabilities).toHaveLength(0); // Pas de date = pas de disponibilités
      expect(result.data?.golfCourses).toHaveLength(0);
    });

    it("devrait gérer le cas où aucun pro n'est trouvé", async () => {
      (profileService.listProProfiles as jest.Mock).mockResolvedValue({
        data: [],
        error: null,
      });

      const result = await searchService.searchByPro({
        city: 'Ville inexistante',
      });

      expect(result.error).toBeNull();
      expect(result.data?.pros).toHaveLength(0);
      expect(result.data?.totalResults).toBe(0);
    });
  });

  describe('quickSearch', () => {
    const mockQuery = {
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          or: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue({
              data: [
                {
                  id: 'pro-1',
                  first_name: 'Jean',
                  last_name: 'Dupont',
                  user_type: 'pro',
                  pro_profiles: {
                    specialties: ['putting'],
                  },
                },
              ],
              error: null,
            }),
          }),
        }),
      }),
    };

    const mockQueryCourses = {
      select: jest.fn().mockReturnValue({
        or: jest.fn().mockReturnValue({
          limit: jest.fn().mockResolvedValue({
            data: [
              {
                id: 'course-1',
                name: 'Golf Club Test',
                city: 'Paris',
              },
            ],
            error: null,
          }),
        }),
      }),
    };

    it('devrait effectuer une recherche rapide pour tous les types', async () => {
      (supabase.from as jest.Mock)
        .mockReturnValueOnce(mockQuery)
        .mockReturnValueOnce(mockQueryCourses);

      const result = await searchService.quickSearch({
        query: 'test',
        type: 'all',
      });

      expect(result.error).toBeNull();
      expect(result.data?.pros).toHaveLength(1);
      expect(result.data?.golfCourses).toHaveLength(1);
      expect(result.data?.totalResults).toBe(2);
    });

    it('devrait rechercher uniquement les pros', async () => {
      (supabase.from as jest.Mock).mockReturnValueOnce(mockQuery);

      const result = await searchService.quickSearch({
        query: 'jean',
        type: 'pros',
      });

      expect(result.error).toBeNull();
      expect(result.data?.pros).toHaveLength(1);
      expect(result.data?.golfCourses).toHaveLength(0);
    });

    it('devrait rechercher uniquement les parcours', async () => {
      (supabase.from as jest.Mock).mockReturnValueOnce(mockQueryCourses);

      const result = await searchService.quickSearch({
        query: 'golf',
        type: 'courses',
      });

      expect(result.error).toBeNull();
      expect(result.data?.pros).toHaveLength(0);
      expect(result.data?.golfCourses).toHaveLength(1);
    });

    it('devrait appliquer la limite de résultats', async () => {
      (supabase.from as jest.Mock)
        .mockReturnValueOnce(mockQuery)
        .mockReturnValueOnce(mockQueryCourses);

      await searchService.quickSearch({
        query: 'test',
        limit: 5,
      });

      expect(mockQuery.select().eq().or().limit).toHaveBeenCalledWith(5);
      expect(mockQueryCourses.select().or().limit).toHaveBeenCalledWith(5);
    });
  });

  // ========== PHASE 2: RECHERCHES SPÉCIALISÉES ==========

  describe('getSuggestions', () => {
    const mockQueryPros = {
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          or: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue({
              data: [
                { first_name: 'Jean', last_name: 'Dupont' },
                { first_name: 'Marie', last_name: 'Martin' },
              ],
              error: null,
            }),
          }),
        }),
      }),
    };

    const mockQueryCourses = {
      select: jest.fn().mockReturnValue({
        ilike: jest.fn().mockReturnValue({
          limit: jest.fn().mockResolvedValue({
            data: [{ name: 'Golf Club Paris' }, { name: 'Golf Club Lyon' }],
            error: null,
          }),
        }),
      }),
    };

    const mockQueryCities = {
      select: jest.fn().mockReturnValue({
        ilike: jest.fn().mockReturnValue({
          limit: jest.fn().mockResolvedValue({
            data: [
              { city: 'Paris' },
              { city: 'Lyon' },
              { city: 'Paris' }, // Doublon pour tester la déduplication
            ],
            error: null,
          }),
        }),
      }),
    };

    it('devrait obtenir des suggestions de pros', async () => {
      (supabase.from as jest.Mock).mockReturnValueOnce(mockQueryPros);

      const result = await searchService.getSuggestions('jean', 'pros');

      expect(result.error).toBeNull();
      expect(result.data).toEqual(['Jean Dupont', 'Marie Martin']);
      expect(supabase.from).toHaveBeenCalledWith('profiles');
    });

    it('devrait obtenir des suggestions de parcours', async () => {
      (supabase.from as jest.Mock).mockReturnValueOnce(mockQueryCourses);

      const result = await searchService.getSuggestions('golf', 'courses');

      expect(result.error).toBeNull();
      expect(result.data).toEqual(['Golf Club Paris', 'Golf Club Lyon']);
      expect(supabase.from).toHaveBeenCalledWith('golf_parcours');
    });

    it('devrait obtenir des suggestions de villes et les dédupliquer', async () => {
      (supabase.from as jest.Mock).mockReturnValueOnce(mockQueryCities);

      const result = await searchService.getSuggestions('par', 'cities');

      expect(result.error).toBeNull();
      expect(result.data).toEqual(['Paris', 'Lyon']); // Paris dédupliqué
      expect(supabase.from).toHaveBeenCalledWith('golf_parcours');
    });

    it('devrait gérer les erreurs de requête pour les pros', async () => {
      const mockErrorQuery = {
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            or: jest.fn().mockReturnValue({
              limit: jest.fn().mockRejectedValue(new Error('Erreur base de données')),
            }),
          }),
        }),
      };

      (supabase.from as jest.Mock).mockReturnValueOnce(mockErrorQuery);

      const result = await searchService.getSuggestions('test', 'pros');

      expect(result.data).toBeNull();
      expect(result.error).toEqual(
        expect.objectContaining({
          message: 'Erreur base de données',
        })
      );
    });

    it('devrait gérer les erreurs de requête pour les parcours', async () => {
      const mockErrorQuery = {
        select: jest.fn().mockReturnValue({
          ilike: jest.fn().mockReturnValue({
            limit: jest.fn().mockRejectedValue(new Error('Erreur réseau')),
          }),
        }),
      };

      (supabase.from as jest.Mock).mockReturnValueOnce(mockErrorQuery);

      const result = await searchService.getSuggestions('test', 'courses');

      expect(result.data).toBeNull();
      expect(result.error).toEqual(
        expect.objectContaining({
          message: 'Erreur réseau',
        })
      );
    });

    it('devrait retourner un tableau vide si aucune donnée', async () => {
      const mockEmptyQuery = {
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            or: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue({
                data: null,
                error: null,
              }),
            }),
          }),
        }),
      };

      (supabase.from as jest.Mock).mockReturnValueOnce(mockEmptyQuery);

      const result = await searchService.getSuggestions('xyz', 'pros');

      expect(result.error).toBeNull();
      expect(result.data).toEqual([]);
    });

    it('devrait limiter les résultats à 5 éléments', async () => {
      (supabase.from as jest.Mock).mockReturnValueOnce(mockQueryPros);

      await searchService.getSuggestions('test', 'pros');

      expect(mockQueryPros.select().eq().or().limit).toHaveBeenCalledWith(5);
    });

    it('devrait formater correctement le pattern de recherche', async () => {
      (supabase.from as jest.Mock).mockReturnValueOnce(mockQueryCourses);

      await searchService.getSuggestions('golf club', 'courses');

      expect(mockQueryCourses.select().ilike).toHaveBeenCalledWith('name', 'golf club%');
    });
  });

  describe('searchDual', () => {
    const mockCoursesQuery = {
      select: jest.fn().mockReturnValue({
        or: jest.fn().mockReturnValue({
          limit: jest.fn().mockResolvedValue({
            data: [
              {
                id: 'course-1',
                name: 'Golf Club Paris',
                city: 'Paris',
                address: '123 Rue du Golf',
              },
            ],
            error: null,
          }),
        }),
      }),
    };

    const mockProsQuery = {
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          or: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue({
              data: [
                {
                  id: 'pro-1',
                  first_name: 'Jean',
                  last_name: 'Dupont',
                  city: 'Paris',
                  pro_profiles: { specialties: ['putting'] },
                },
              ],
              error: null,
            }),
          }),
        }),
      }),
    };

    const mockAvailabilityQuery = {
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            gt: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue({
                data: [{ id: 'avail-1' }],
                error: null,
              }),
            }),
          }),
        }),
      }),
    };

    const mockAvailabilityDetailsQuery = {
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: { current_bookings: 1, max_players: 4 },
            error: null,
          }),
        }),
      }),
    };

    it('devrait rechercher les parcours en mode by-course', async () => {
      (supabase.from as jest.Mock).mockReturnValueOnce(mockCoursesQuery);

      const result = await searchService.searchDual({
        query: 'golf paris',
        mode: 'by-course',
        limit: 5,
      });

      expect(result.error).toBeNull();
      expect(result.data).toHaveLength(1);
      expect(result.data?.[0]).toEqual(
        expect.objectContaining({
          name: 'Golf Club Paris',
          city: 'Paris',
        })
      );
    });

    it('devrait rechercher les pros en mode by-pro avec disponibilités', async () => {
      (supabase.from as jest.Mock)
        .mockReturnValueOnce(mockProsQuery)
        .mockReturnValueOnce(mockAvailabilityQuery)
        .mockReturnValueOnce(mockAvailabilityDetailsQuery);

      const result = await searchService.searchDual({
        query: 'jean',
        mode: 'by-pro',
      });

      expect(result.error).toBeNull();
      expect(result.data).toHaveLength(1);
      expect(result.data?.[0]).toEqual(
        expect.objectContaining({
          first_name: 'Jean',
          last_name: 'Dupont',
          has_availabilities: true,
        })
      );
    });

    it('devrait retourner un tableau vide pour une requête trop courte', async () => {
      const result = await searchService.searchDual({
        query: 'a',
        mode: 'by-course',
      });

      expect(result.error).toBeNull();
      expect(result.data).toEqual([]);
    });

    it('devrait gérer les erreurs de requête en mode by-course', async () => {
      const mockErrorQuery = {
        select: jest.fn().mockReturnValue({
          or: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue({
              data: null,
              error: new Error('Erreur requête'),
            }),
          }),
        }),
      };

      (supabase.from as jest.Mock).mockReturnValueOnce(mockErrorQuery);

      const result = await searchService.searchDual({
        query: 'test',
        mode: 'by-course',
      });

      expect(result.data).toBeNull();
      expect(result.error).toEqual(
        expect.objectContaining({
          message: 'Erreur requête',
        })
      );
    });

    it('devrait marquer les pros sans disponibilités', async () => {
      const emptyAvailabilityQuery = {
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              gt: jest.fn().mockReturnValue({
                limit: jest.fn().mockResolvedValue({
                  data: [], // Aucune disponibilité
                  error: null,
                }),
              }),
            }),
          }),
        }),
      };

      (supabase.from as jest.Mock)
        .mockReturnValueOnce(mockProsQuery)
        .mockReturnValueOnce(emptyAvailabilityQuery);

      const result = await searchService.searchDual({
        query: 'jean',
        mode: 'by-pro',
      });

      expect(result.error).toBeNull();
      expect(result.data?.[0]).toEqual(
        expect.objectContaining({
          has_availabilities: false,
        })
      );
    });

    it('devrait appliquer la limite de résultats', async () => {
      (supabase.from as jest.Mock).mockReturnValueOnce(mockCoursesQuery);

      await searchService.searchDual({
        query: 'test',
        mode: 'by-course',
        limit: 20,
      });

      expect(mockCoursesQuery.select().or().limit).toHaveBeenCalledWith(20);
    });
  });

  describe('advancedSearch', () => {
    it('devrait effectuer une recherche avancée avec tous les filtres', async () => {
      (profileService.listProProfiles as jest.Mock).mockResolvedValue({
        data: [
          {
            id: 'pro-1',
            first_name: 'Jean',
            last_name: 'Dupont',
            bio: 'Professionnel de golf expérimenté',
          },
        ],
        error: null,
      });

      (golfCourseService.listGolfCourses as jest.Mock).mockResolvedValue({
        data: [
          {
            id: 'course-1',
            name: 'Golf Club Test',
            description: 'Un magnifique parcours',
          },
        ],
        error: null,
      });

      const result = await searchService.advancedSearch({
        query: 'golf',
        filters: {
          date: '2025-01-15',
          city: 'Paris',
          priceMin: 50,
          priceMax: 100,
          specialties: ['putting'],
          amenities: ['restaurant'],
          nearLocation: {
            lat: 48.8566,
            lng: 2.3522,
            radiusKm: 10,
          },
        },
        pagination: {
          page: 1,
          limit: 20,
        },
      });

      expect(result.error).toBeNull();
      expect(result.data?.pros).toHaveLength(1);
      expect(result.data?.golfCourses).toHaveLength(1);
      expect(result.data?.totalResults).toBe(2);
    });

    it('devrait filtrer par requête textuelle', async () => {
      (profileService.listProProfiles as jest.Mock).mockResolvedValue({
        data: [
          {
            id: 'pro-1',
            first_name: 'Jean',
            last_name: 'Dupont',
            bio: 'Spécialiste putting',
          },
          {
            id: 'pro-2',
            first_name: 'Marie',
            last_name: 'Martin',
            bio: 'Expert en swing',
          },
        ],
        error: null,
      });

      (golfCourseService.listGolfCourses as jest.Mock).mockResolvedValue({
        data: [],
        error: null,
      });

      const result = await searchService.advancedSearch({
        query: 'putting',
        filters: {},
      });

      expect(result.error).toBeNull();
      expect(result.data?.pros).toHaveLength(1); // Seul Jean avec "putting" dans bio
      expect(result.data?.pros?.[0].first_name).toBe('Jean');
    });

    it('devrait fonctionner sans requête textuelle', async () => {
      (profileService.listProProfiles as jest.Mock).mockResolvedValue({
        data: [{ id: 'pro-1', first_name: 'Jean', last_name: 'Dupont' }],
        error: null,
      });

      (golfCourseService.listGolfCourses as jest.Mock).mockResolvedValue({
        data: [{ id: 'course-1', name: 'Golf Club' }],
        error: null,
      });

      const result = await searchService.advancedSearch({
        filters: { city: 'Paris' },
      });

      expect(result.error).toBeNull();
      expect(result.data?.pros).toHaveLength(1);
      expect(result.data?.golfCourses).toHaveLength(1);
    });
  });

  // ========== PHASE 3: EDGE CASES ET GESTION D'ERREURS COMPLEXES ==========

  describe('Edge cases et scenarios complexes', () => {
    it('devrait gérer les erreurs dans searchByGolfCourse avec dependencies qui échouent', async () => {
      (golfCourseService.getGolfCourse as jest.Mock).mockRejectedValue(
        new Error('Service indisponible')
      );

      const result = await searchService.searchByGolfCourse({
        golfCourseId: 'course-1',
        date: '2025-01-15',
      });

      expect(result.data).toBeNull();
      expect(result.error).toEqual(
        expect.objectContaining({
          message: 'Service indisponible',
        })
      );
    });

    it('devrait gérer les erreurs dans searchByPro avec dependencies qui échouent', async () => {
      (profileService.listProProfiles as jest.Mock).mockRejectedValue(
        new Error('Service profiles indisponible')
      );

      const result = await searchService.searchByPro({
        city: 'Paris',
      });

      expect(result.data).toBeNull();
      expect(result.error).toEqual(
        expect.objectContaining({
          message: 'Service profiles indisponible',
        })
      );
    });

    it('devrait gérer les erreurs dans quickSearch avec requêtes Supabase qui échouent', async () => {
      const mockErrorQuery = {
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            or: jest.fn().mockReturnValue({
              limit: jest.fn().mockRejectedValue(new Error('Connexion perdue')),
            }),
          }),
        }),
      };

      (supabase.from as jest.Mock).mockReturnValueOnce(mockErrorQuery);

      const result = await searchService.quickSearch({
        query: 'test',
        type: 'pros',
      });

      expect(result.data).toBeNull();
      expect(result.error).toEqual(
        expect.objectContaining({
          message: 'Connexion perdue',
        })
      );
    });

    it('devrait gérer les erreurs dans advancedSearch avec services qui échouent', async () => {
      (profileService.listProProfiles as jest.Mock).mockRejectedValue(
        new Error('Service en maintenance')
      );

      const result = await searchService.advancedSearch({
        filters: { city: 'Paris' },
      });

      expect(result.data).toBeNull();
      expect(result.error).toEqual(
        expect.objectContaining({
          message: 'Service en maintenance',
        })
      );
    });

    it('devrait filtrer correctement les pros avec profiles null dans quickSearch', async () => {
      const mockQuery = {
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            or: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue({
                data: [
                  {
                    id: 'pro-1',
                    first_name: 'Jean',
                    last_name: 'Dupont',
                    pro_profiles: { specialties: ['putting'] },
                  },
                  {
                    id: 'pro-2',
                    first_name: 'Marie',
                    last_name: 'Martin',
                    pro_profiles: null, // Profil incomplet
                  },
                ],
                error: null,
              }),
            }),
          }),
        }),
      };

      (supabase.from as jest.Mock).mockReturnValueOnce(mockQuery);

      const result = await searchService.quickSearch({
        query: 'test',
        type: 'pros',
      });

      expect(result.error).toBeNull();
      expect(result.data?.pros).toHaveLength(1); // Seul Jean avec pro_profiles valide
      expect(result.data?.pros?.[0].first_name).toBe('Jean');
    });

    it('devrait gérer les Promise.all avec erreurs partielles dans searchByPro', async () => {
      const mockPros = [
        { id: 'pro-1', first_name: 'Jean', last_name: 'Dupont' },
        { id: 'pro-2', first_name: 'Marie', last_name: 'Martin' },
      ];

      (profileService.listProProfiles as jest.Mock).mockResolvedValue({
        data: mockPros,
        error: null,
      });

      // Premier pro: succès, deuxième: échec
      (bookingService.getProAvailabilities as jest.Mock)
        .mockResolvedValueOnce({
          data: [
            {
              id: 'avail-1',
              pro_id: 'pro-1',
              golf_course_id: 'course-1',
              golf_parcours: { id: 'course-1', name: 'Golf Club' },
            },
          ],
          error: null,
        })
        .mockResolvedValueOnce({
          data: null,
          error: new Error('Erreur pour ce pro'),
        });

      const result = await searchService.searchByPro({
        date: '2025-01-15',
      });

      expect(result.error).toBeNull();
      expect(result.data?.availabilities).toHaveLength(1); // Seules les disponibilités valides
      expect(result.data?.golfCourses).toHaveLength(1);
    });

    it('devrait gérer des availabilities sans profiles dans searchByGolfCourse', async () => {
      const mockGolfCourse = {
        id: 'course-1',
        name: 'Golf Club Test',
        city: 'Paris',
      };

      const availabilitiesWithoutProfiles = [
        {
          id: 'avail-1',
          pro_id: 'pro-1',
          golf_course_id: 'course-1',
          date: '2025-01-15',
          start_time: '09:00',
          max_players: 4,
          current_bookings: 1,
          profiles: null, // Pas de données profile
        },
      ];

      (golfCourseService.getGolfCourse as jest.Mock).mockResolvedValue({
        data: mockGolfCourse,
        error: null,
      });

      (bookingService.getProAvailabilities as jest.Mock).mockResolvedValue({
        data: availabilitiesWithoutProfiles,
        error: null,
      });

      const result = await searchService.searchByGolfCourse({
        golfCourseId: 'course-1',
        date: '2025-01-15',
      });

      expect(result.error).toBeNull();
      expect(result.data?.pros).toHaveLength(0); // Aucun pro extrait à cause de profiles: null
      expect(result.data?.availabilities).toHaveLength(1); // Mais disponibilité présente
    });

    it('devrait gérer la limite par défaut dans searchDual', async () => {
      const mockCoursesQuery = {
        select: jest.fn().mockReturnValue({
          or: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue({
              data: [],
              error: null,
            }),
          }),
        }),
      };

      (supabase.from as jest.Mock).mockReturnValueOnce(mockCoursesQuery);

      await searchService.searchDual({
        query: 'test',
        mode: 'by-course',
        // Pas de limite spécifiée
      });

      expect(mockCoursesQuery.select().or().limit).toHaveBeenCalledWith(10); // Limite par défaut
    });

    it('devrait gérer les erreurs dans searchDual pour les pros avec disponibilités', async () => {
      const mockProsQuery = {
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            or: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue({
                data: [
                  {
                    id: 'pro-1',
                    first_name: 'Jean',
                    last_name: 'Dupont',
                    pro_profiles: { specialties: ['putting'] },
                  },
                ],
                error: null,
              }),
            }),
          }),
        }),
      };

      const mockAvailabilityErrorQuery = {
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              gt: jest.fn().mockReturnValue({
                limit: jest.fn().mockRejectedValue(new Error('Erreur disponibilités')),
              }),
            }),
          }),
        }),
      };

      (supabase.from as jest.Mock)
        .mockReturnValueOnce(mockProsQuery)
        .mockReturnValueOnce(mockAvailabilityErrorQuery);

      const result = await searchService.searchDual({
        query: 'jean',
        mode: 'by-pro',
      });

      // L'erreur dans Promise.all fait échouer toute la méthode
      expect(result.data).toBeNull();
      expect(result.error).toEqual(
        expect.objectContaining({
          message: 'Erreur disponibilités',
        })
      );
    });

    it('devrait appliquer les bons filtres dans advancedSearch', async () => {
      (profileService.listProProfiles as jest.Mock).mockResolvedValue({
        data: [],
        error: null,
      });

      (golfCourseService.listGolfCourses as jest.Mock).mockResolvedValue({
        data: [],
        error: null,
      });

      await searchService.advancedSearch({
        filters: {
          city: 'Paris',
          priceMin: 50,
          priceMax: 100,
          specialties: ['putting', 'swing'],
          amenities: ['restaurant', 'pro-shop'],
        },
        pagination: { page: 2, limit: 15 },
      });

      expect(profileService.listProProfiles).toHaveBeenCalledWith(
        {
          city: 'Paris',
          minHourlyRate: 50,
          maxHourlyRate: 100,
          specialties: ['putting', 'swing'],
        },
        { page: 2, limit: 15 }
      );

      expect(golfCourseService.listGolfCourses).toHaveBeenCalledWith(
        {
          city: 'Paris',
          amenities: ['restaurant', 'pro-shop'],
        },
        { page: 2, limit: 15 }
      );
    });

    it('devrait gérer le filtrage textuel avec caractères spéciaux', async () => {
      (profileService.listProProfiles as jest.Mock).mockResolvedValue({
        data: [
          {
            id: 'pro-1',
            first_name: 'Jean-Pierre',
            last_name: "O'Connor",
            bio: 'Spécialiste "putting" & driving',
          },
        ],
        error: null,
      });

      (golfCourseService.listGolfCourses as jest.Mock).mockResolvedValue({
        data: [
          {
            id: 'course-1',
            name: 'Golf & Country Club',
            description: 'Parcours "premium" avec vue',
          },
        ],
        error: null,
      });

      const result = await searchService.advancedSearch({
        query: 'putting',
        filters: {},
      });

      expect(result.error).toBeNull();
      expect(result.data?.pros).toHaveLength(1); // Trouvé malgré les guillemets
      expect(result.data?.golfCourses).toHaveLength(0); // "putting" pas dans description du parcours
    });
  });
});
