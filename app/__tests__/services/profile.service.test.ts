/**
 * Tests pour ProfileService
 * Couvre la gestion des profils utilisateur (amateur/pro)
 */
import { profileService } from '@/services/profile.service';
import { supabase } from '@/utils/supabase/client';

// Mocks
jest.mock('@/utils/supabase/client', () => ({
  supabase: {
    from: jest.fn(),
    storage: {
      from: jest.fn(),
    },
    auth: {
      admin: {
        getUserById: jest.fn(),
      },
    },
  },
}));

jest.mock('@/utils/logger', () => ({
  logger: {
    error: jest.fn(),
    debug: jest.fn(),
    dev: jest.fn(),
    info: jest.fn(),
  },
}));

describe('ProfileService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('getProfile', () => {
    it('devrait récupérer un profil utilisateur avec succès', async () => {
      const mockProfile = {
        id: 'user_123',
        first_name: 'John',
        last_name: 'Doe',
        user_type: 'amateur',
        city: 'Paris',
        avatar_url: 'https://example.com/avatar.jpg',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      const mockQuery = {
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockProfile,
              error: null,
            }),
          }),
        }),
      };

      (supabase.from as jest.Mock).mockReturnValue(mockQuery);

      const result = await profileService.getProfile('user_123');

      expect(supabase.from).toHaveBeenCalledWith('profiles');
      expect(mockQuery.select).toHaveBeenCalledWith('*');
      expect(result.data).toEqual(mockProfile);
      expect(result.error).toBeNull();
    });

    it("devrait gérer le cas où le profil n'existe pas", async () => {
      const mockQuery = {
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: { message: 'No rows returned', code: 'PGRST116' },
            }),
          }),
        }),
      };

      (supabase.from as jest.Mock).mockReturnValue(mockQuery);

      const result = await profileService.getProfile('user_notfound');

      expect(result.data).toBeNull();
      expect(result.error).toBeDefined();
      expect(result.error?.message).toContain('No rows returned');
    });

    it('devrait gérer les erreurs réseau', async () => {
      const mockQuery = {
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: new Error('Network error'),
            }),
          }),
        }),
      };

      (supabase.from as jest.Mock).mockReturnValue(mockQuery);

      const result = await profileService.getProfile('user_123');

      expect(result.data).toBeNull();
      expect(result.error).toBeDefined();
    });
  });

  describe('getFullProfile', () => {
    it('devrait récupérer un profil amateur complet avec succès', async () => {
      const mockProfile = {
        id: 'user_123',
        first_name: 'Jane',
        last_name: 'Amateur',
        user_type: 'amateur',
        email: 'jane@example.com',
        city: 'Lyon',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      const mockAmateurProfile = {
        id: 'amateur_123',
        user_id: 'user_123',
        handicap: 18,
        experience_level: 'beginner',
        created_at: '2024-01-01T00:00:00Z',
      };

      const mockUser = {
        id: 'user_123',
        email: 'jane@example.com',
      };

      // Mock profil principal
      const mockProfileQuery = {
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockProfile,
              error: null,
            }),
          }),
        }),
      };

      // Mock profil amateur
      const mockAmateurQuery = {
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockAmateurProfile,
              error: null,
            }),
          }),
        }),
      };

      (supabase.from as jest.Mock)
        .mockReturnValueOnce(mockProfileQuery) // Premier appel pour profiles
        .mockReturnValueOnce(mockAmateurQuery); // Deuxième appel pour amateur_profiles

      // Mock auth.admin.getUserById
      (supabase.auth.admin.getUserById as jest.Mock).mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const result = await profileService.getFullProfile('user_123');

      expect(result.data).toBeDefined();
      expect(result.data?.id).toBe('user_123');
      expect(result.data?.first_name).toBe('Jane');
      expect(result.data?.email).toBe('jane@example.com');
      expect(result.data?.amateur_profiles).toEqual(mockAmateurProfile);
      expect(result.data?.pro_profiles).toBeUndefined();
      expect(result.error).toBeNull();
    });

    it('devrait récupérer un profil pro complet avec succès', async () => {
      const mockProfile = {
        id: 'user_456',
        first_name: 'John',
        last_name: 'Pro',
        user_type: 'pro',
        email: 'john@example.com',
        city: 'Marseille',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      const mockProProfile = {
        id: 'pro_456',
        user_id: 'user_456',
        handicap: 2,
        specialties: ['putting', 'driving'],
        created_at: '2024-01-01T00:00:00Z',
      };

      const mockUser = {
        id: 'user_456',
        email: 'john@example.com',
      };

      // Mock profil principal
      const mockProfileQuery = {
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockProfile,
              error: null,
            }),
          }),
        }),
      };

      // Mock profil pro
      const mockProQuery = {
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockProProfile,
              error: null,
            }),
          }),
        }),
      };

      (supabase.from as jest.Mock)
        .mockReturnValueOnce(mockProfileQuery) // Premier appel pour profiles
        .mockReturnValueOnce(mockProQuery); // Deuxième appel pour pro_profiles

      // Mock auth.admin.getUserById
      (supabase.auth.admin.getUserById as jest.Mock).mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const result = await profileService.getFullProfile('user_456');

      expect(result.data).toBeDefined();
      expect(result.data?.id).toBe('user_456');
      expect(result.data?.first_name).toBe('John');
      expect(result.data?.user_type).toBe('pro');
      expect(result.data?.pro_profiles).toEqual(mockProProfile);
      expect(result.data?.amateur_profiles).toBeUndefined();
      expect(result.error).toBeNull();
    });

    it("devrait gérer le cas où le profil principal n'existe pas", async () => {
      const mockProfileQuery = {
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: { message: 'Profile not found', code: 'PGRST116' },
            }),
          }),
        }),
      };

      (supabase.from as jest.Mock).mockReturnValue(mockProfileQuery);

      const result = await profileService.getFullProfile('user_notfound');

      expect(result.data).toBeNull();
      expect(result.error).toBeDefined();
    });

    it("devrait gérer l'échec de récupération de l'email utilisateur", async () => {
      const mockProfile = {
        id: 'user_123',
        first_name: 'John',
        last_name: 'Doe',
        user_type: 'amateur',
        email: null, // Pas d'email dans le profil
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      const mockProfileQuery = {
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockProfile,
              error: null,
            }),
          }),
        }),
      };

      const mockAmateurQuery = {
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { handicap: 18 },
              error: null,
            }),
          }),
        }),
      };

      (supabase.from as jest.Mock)
        .mockReturnValueOnce(mockProfileQuery)
        .mockReturnValueOnce(mockAmateurQuery);

      // Mock échec auth.admin.getUserById
      (supabase.auth.admin.getUserById as jest.Mock).mockRejectedValue(new Error('Auth error'));

      const result = await profileService.getFullProfile('user_123');

      expect(result.data).toBeDefined();
      expect(result.data?.email).toBeNull();
      expect(result.error).toBeNull();
    });
  });

  describe('getProProfile', () => {
    it('devrait récupérer un profil pro avec détails', async () => {
      const mockProProfileWithDetails = {
        id: 'user_456',
        first_name: 'John',
        last_name: 'Pro',
        user_type: 'pro',
        city: 'Nice',
        pro_profiles: {
          id: 'pro_456',
          user_id: 'user_456',
          handicap: 3,
          specialties: ['putting', 'chipping'],
          bio: 'Professeur de golf expérimenté',
        },
      };

      const mockQuery = {
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: mockProProfileWithDetails,
                error: null,
              }),
            }),
          }),
        }),
      };

      (supabase.from as jest.Mock).mockReturnValue(mockQuery);

      const result = await profileService.getProProfile('user_456');

      expect(supabase.from).toHaveBeenCalledWith('profiles');
      expect(mockQuery.select).toHaveBeenCalledWith(`
          *,
          pro_profiles(*)
        `);
      expect(result.data).toEqual(mockProProfileWithDetails);
      expect(result.data?.pro_profiles?.handicap).toBe(3);
      expect(result.error).toBeNull();
    });

    it("devrait retourner null si l'utilisateur n'est pas un pro", async () => {
      const mockQuery = {
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: null,
                error: { message: 'No pro profile found', code: 'PGRST116' },
              }),
            }),
          }),
        }),
      };

      (supabase.from as jest.Mock).mockReturnValue(mockQuery);

      const result = await profileService.getProProfile('user_amateur');

      expect(result.data).toBeNull();
      expect(result.error).toBeDefined();
    });
  });

  describe('getAmateurProfile', () => {
    it('devrait récupérer un profil amateur avec détails', async () => {
      const mockAmateurProfileWithDetails = {
        id: 'user_123',
        first_name: 'Jane',
        last_name: 'Amateur',
        user_type: 'amateur',
        city: 'Toulouse',
        amateur_profiles: {
          id: 'amateur_123',
          user_id: 'user_123',
          handicap: 24,
          experience_level: 'intermediate',
          goals: ['améliorer le putting'],
        },
      };

      const mockQuery = {
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: mockAmateurProfileWithDetails,
                error: null,
              }),
            }),
          }),
        }),
      };

      (supabase.from as jest.Mock).mockReturnValue(mockQuery);

      const result = await profileService.getAmateurProfile('user_123');

      expect(supabase.from).toHaveBeenCalledWith('profiles');
      expect(mockQuery.select).toHaveBeenCalledWith(`
          *,
          amateur_profiles!inner(*)
        `);
      expect(result.data).toEqual(mockAmateurProfileWithDetails);
      expect(result.data?.amateur_profiles?.handicap).toBe(24);
      expect(result.error).toBeNull();
    });

    it("devrait retourner null si l'utilisateur n'est pas un amateur", async () => {
      const mockQuery = {
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: null,
                error: { message: 'No amateur profile found', code: 'PGRST116' },
              }),
            }),
          }),
        }),
      };

      (supabase.from as jest.Mock).mockReturnValue(mockQuery);

      const result = await profileService.getAmateurProfile('user_pro');

      expect(result.data).toBeNull();
      expect(result.error).toBeDefined();
    });

    it('devrait gérer les erreurs de base de données', async () => {
      const mockQuery = {
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: null,
                error: new Error('Database connection failed'),
              }),
            }),
          }),
        }),
      };

      (supabase.from as jest.Mock).mockReturnValue(mockQuery);

      const result = await profileService.getAmateurProfile('user_123');

      expect(result.data).toBeNull();
      expect(result.error).toBeDefined();
    });
  });

  describe('updateProfile', () => {
    it('devrait mettre à jour seulement le profil principal', async () => {
      const userId = 'user_123';
      const updateData = {
        profile: {
          first_name: 'John Updated',
          last_name: 'Doe Updated',
          city: 'Paris Updated',
        },
      };

      // Mock mise à jour profil principal
      const mockUpdateQuery = {
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            data: null,
            error: null,
          }),
        }),
      };

      // Mock récupération profil mis à jour
      const mockGetQuery = {
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: {
                id: userId,
                first_name: 'John Updated',
                last_name: 'Doe Updated',
                city: 'Paris Updated',
                updated_at: '2024-01-02T00:00:00Z',
              },
              error: null,
            }),
          }),
        }),
      };

      (supabase.from as jest.Mock)
        .mockReturnValueOnce(mockUpdateQuery) // Premier appel pour update
        .mockReturnValueOnce(mockGetQuery); // Deuxième appel pour getProfile

      const result = await profileService.updateProfile(userId, updateData);

      expect(supabase.from).toHaveBeenCalledWith('profiles');
      expect(mockUpdateQuery.update).toHaveBeenCalledWith({
        ...updateData.profile,
        updated_at: expect.any(String),
      });
      expect(result.data).toBeDefined();
      expect(result.data?.first_name).toBe('John Updated');
      expect(result.error).toBeNull();
    });

    it('devrait mettre à jour le profil principal ET le profil pro', async () => {
      const userId = 'user_456';
      const updateData = {
        profile: {
          first_name: 'John Pro',
          city: 'Nice',
        },
        proProfile: {
          handicap: 1,
          bio: 'Champion de golf professionnel',
        },
      };

      // Mock mise à jour profil principal
      const mockProfileUpdateQuery = {
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            data: null,
            error: null,
          }),
        }),
      };

      // Mock mise à jour profil pro
      const mockProUpdateQuery = {
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            data: null,
            error: null,
          }),
        }),
      };

      // Mock récupération profil mis à jour
      const mockGetQuery = {
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: {
                id: userId,
                first_name: 'John Pro',
                city: 'Nice',
                user_type: 'pro',
                updated_at: '2024-01-02T00:00:00Z',
              },
              error: null,
            }),
          }),
        }),
      };

      (supabase.from as jest.Mock)
        .mockReturnValueOnce(mockProfileUpdateQuery) // profiles table
        .mockReturnValueOnce(mockProUpdateQuery) // pro_profiles table
        .mockReturnValueOnce(mockGetQuery); // getProfile

      const result = await profileService.updateProfile(userId, updateData);

      // Vérifier appel profiles
      expect(supabase.from).toHaveBeenNthCalledWith(1, 'profiles');
      expect(mockProfileUpdateQuery.update).toHaveBeenCalledWith({
        ...updateData.profile,
        updated_at: expect.any(String),
      });

      // Vérifier appel pro_profiles
      expect(supabase.from).toHaveBeenNthCalledWith(2, 'pro_profiles');
      expect(mockProUpdateQuery.update).toHaveBeenCalledWith(updateData.proProfile);

      expect(result.data).toBeDefined();
      expect(result.error).toBeNull();
    });

    it('devrait mettre à jour le profil principal ET le profil amateur', async () => {
      const userId = 'user_789';
      const updateData = {
        profile: {
          first_name: 'Jane Amateur',
          city: 'Lyon',
        },
        amateurProfile: {
          handicap: 20,
          experience_level: 'advanced',
          goals: ['améliorer le putting', 'réduire le score'],
        },
      };

      // Mock mise à jour profil principal
      const mockProfileUpdateQuery = {
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            data: null,
            error: null,
          }),
        }),
      };

      // Mock mise à jour profil amateur
      const mockAmateurUpdateQuery = {
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            data: null,
            error: null,
          }),
        }),
      };

      // Mock récupération profil mis à jour
      const mockGetQuery = {
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: {
                id: userId,
                first_name: 'Jane Amateur',
                city: 'Lyon',
                user_type: 'amateur',
                updated_at: '2024-01-02T00:00:00Z',
              },
              error: null,
            }),
          }),
        }),
      };

      (supabase.from as jest.Mock)
        .mockReturnValueOnce(mockProfileUpdateQuery) // profiles table
        .mockReturnValueOnce(mockAmateurUpdateQuery) // amateur_profiles table
        .mockReturnValueOnce(mockGetQuery); // getProfile

      const result = await profileService.updateProfile(userId, updateData);

      // Vérifier appel profiles
      expect(supabase.from).toHaveBeenNthCalledWith(1, 'profiles');
      expect(mockProfileUpdateQuery.update).toHaveBeenCalledWith({
        ...updateData.profile,
        updated_at: expect.any(String),
      });

      // Vérifier appel amateur_profiles
      expect(supabase.from).toHaveBeenNthCalledWith(2, 'amateur_profiles');
      expect(mockAmateurUpdateQuery.update).toHaveBeenCalledWith(updateData.amateurProfile);

      expect(result.data).toBeDefined();
      expect(result.error).toBeNull();
    });

    it('devrait mettre à jour TOUTES les tables simultanément', async () => {
      const userId = 'user_complete';
      const updateData = {
        profile: {
          first_name: 'Complete User',
          last_name: 'Updated',
          city: 'Bordeaux',
        },
        proProfile: {
          handicap: 0,
          bio: 'Professeur expert',
        },
        amateurProfile: {
          handicap: 15,
          experience_level: 'intermediate',
        },
      };

      // Mock mise à jour profil principal
      const mockProfileUpdateQuery = {
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ data: null, error: null }),
        }),
      };

      // Mock mise à jour profil pro
      const mockProUpdateQuery = {
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ data: null, error: null }),
        }),
      };

      // Mock mise à jour profil amateur
      const mockAmateurUpdateQuery = {
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ data: null, error: null }),
        }),
      };

      // Mock récupération profil mis à jour
      const mockGetQuery = {
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: {
                id: userId,
                first_name: 'Complete User',
                last_name: 'Updated',
                city: 'Bordeaux',
                updated_at: '2024-01-02T00:00:00Z',
              },
              error: null,
            }),
          }),
        }),
      };

      (supabase.from as jest.Mock)
        .mockReturnValueOnce(mockProfileUpdateQuery) // profiles
        .mockReturnValueOnce(mockProUpdateQuery) // pro_profiles
        .mockReturnValueOnce(mockAmateurUpdateQuery) // amateur_profiles
        .mockReturnValueOnce(mockGetQuery); // getProfile

      const result = await profileService.updateProfile(userId, updateData);

      // Vérifier les 3 appels de mise à jour
      expect(supabase.from).toHaveBeenNthCalledWith(1, 'profiles');
      expect(supabase.from).toHaveBeenNthCalledWith(2, 'pro_profiles');
      expect(supabase.from).toHaveBeenNthCalledWith(3, 'amateur_profiles');

      expect(result.data).toBeDefined();
      expect(result.error).toBeNull();
    });

    it("devrait gérer l'erreur lors de la mise à jour du profil principal", async () => {
      const userId = 'user_error';
      const updateData = {
        profile: {
          first_name: 'Error User',
        },
      };

      // Mock erreur sur profiles
      const mockProfileUpdateQuery = {
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            data: null,
            error: new Error('Profile update failed'),
          }),
        }),
      };

      (supabase.from as jest.Mock).mockReturnValue(mockProfileUpdateQuery);

      const result = await profileService.updateProfile(userId, updateData);

      expect(result.data).toBeNull();
      expect(result.error).toBeDefined();
      expect(result.error?.message).toContain('Profile update failed');
    });

    it("devrait gérer l'erreur lors de la mise à jour du profil pro", async () => {
      const userId = 'user_pro_error';
      const updateData = {
        profile: {
          first_name: 'Pro User',
        },
        proProfile: {
          handicap: -1, // Valeur invalide qui peut causer une erreur
        },
      };

      // Mock succès pour profiles
      const mockProfileUpdateQuery = {
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ data: null, error: null }),
        }),
      };

      // Mock erreur pour pro_profiles
      const mockProUpdateQuery = {
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            data: null,
            error: new Error('Invalid handicap value'),
          }),
        }),
      };

      (supabase.from as jest.Mock)
        .mockReturnValueOnce(mockProfileUpdateQuery) // profiles (succès)
        .mockReturnValueOnce(mockProUpdateQuery); // pro_profiles (erreur)

      const result = await profileService.updateProfile(userId, updateData);

      expect(result.data).toBeNull();
      expect(result.error).toBeDefined();
      expect(result.error?.message).toContain('Invalid handicap value');
    });

    it("devrait gérer l'erreur lors de la récupération du profil mis à jour", async () => {
      const userId = 'user_get_error';
      const updateData = {
        profile: {
          first_name: 'Get Error User',
        },
      };

      // Mock succès pour update
      const mockProfileUpdateQuery = {
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ data: null, error: null }),
        }),
      };

      // Mock erreur pour getProfile (appelé à la fin)
      const mockGetQuery = {
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: new Error('Failed to retrieve updated profile'),
            }),
          }),
        }),
      };

      (supabase.from as jest.Mock)
        .mockReturnValueOnce(mockProfileUpdateQuery) // update profiles
        .mockReturnValueOnce(mockGetQuery); // getProfile

      const result = await profileService.updateProfile(userId, updateData);

      expect(result.data).toBeNull();
      expect(result.error).toBeDefined();
    });

    it("ne devrait rien faire si aucune donnée n'est fournie", async () => {
      const userId = 'user_empty';
      const updateData = {}; // Aucune donnée

      // Mock getProfile (appelé à la fin même sans update)
      const mockGetQuery = {
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: {
                id: userId,
                first_name: 'Unchanged User',
                unchanged: true,
              },
              error: null,
            }),
          }),
        }),
      };

      (supabase.from as jest.Mock).mockReturnValue(mockGetQuery);

      const result = await profileService.updateProfile(userId, updateData);

      // Aucun appel d'update ne devrait être fait
      expect(supabase.from).toHaveBeenCalledTimes(1); // Seulement getProfile
      expect(result.data).toBeDefined();
      expect(result.data?.first_name).toBe('Unchanged User');
      expect(result.error).toBeNull();
    });
  });

  describe('listProProfiles', () => {
    it('devrait lister tous les profils pros sans filtres', async () => {
      const mockProProfiles = [
        {
          id: 'pro_001',
          first_name: 'John',
          last_name: 'Pro1',
          user_type: 'pro',
          city: 'Paris',
          pro_profiles: {
            id: 'pro_profile_001',
            user_id: 'pro_001',
            handicap: 2,
            bio: 'Expert en putting',
          },
        },
        {
          id: 'pro_002',
          first_name: 'Jane',
          last_name: 'Pro2',
          user_type: 'pro',
          city: 'Lyon',
          pro_profiles: {
            id: 'pro_profile_002',
            user_id: 'pro_002',
            handicap: 1,
            bio: 'Spécialiste du drive',
          },
        },
      ];

      const mockQuery = {
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockResolvedValue({
              data: mockProProfiles,
              error: null,
              count: 2,
            }),
          }),
        }),
      };

      (supabase.from as jest.Mock).mockReturnValue(mockQuery);

      const result = await profileService.listProProfiles();

      expect(supabase.from).toHaveBeenCalledWith('profiles');
      expect(mockQuery.select).toHaveBeenCalledWith(
        `
        *,
        pro_profiles!inner(*)
      `,
        { count: 'exact' }
      );
      expect(mockQuery.select().eq).toHaveBeenCalledWith('user_type', 'pro');
      expect(result.data).toEqual(mockProProfiles);
      expect(result.data?.length).toBe(2);
      expect(result.error).toBeNull();
    });

    it('devrait appliquer le filtre city avec recherche partielle', async () => {
      const mockParisianPros = [
        {
          id: 'pro_paris',
          first_name: 'Pierre',
          last_name: 'Parisien',
          user_type: 'pro',
          city: 'Paris 15ème',
          pro_profiles: {
            handicap: 1,
          },
        },
      ];

      const mockQuery = {
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            ilike: jest.fn().mockReturnValue({
              order: jest.fn().mockResolvedValue({
                data: mockParisianPros,
                error: null,
                count: 1,
              }),
            }),
          }),
        }),
      };

      (supabase.from as jest.Mock).mockReturnValue(mockQuery);

      const filters = { city: 'Paris' };
      const result = await profileService.listProProfiles(filters);

      expect(mockQuery.select().eq().ilike).toHaveBeenCalledWith('city', '%Paris%');
      expect(result.data).toEqual(mockParisianPros);
      expect(result.error).toBeNull();
    });

    it('devrait appliquer la pagination', async () => {
      const mockPagedPros = [
        { id: 'pro_page2_1', first_name: 'Pro', last_name: '3' },
        { id: 'pro_page2_2', first_name: 'Pro', last_name: '4' },
      ];

      const mockQuery = {
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockReturnValue({
              range: jest.fn().mockResolvedValue({
                data: mockPagedPros,
                error: null,
                count: 10, // Total de 10 pros
              }),
            }),
          }),
        }),
      };

      (supabase.from as jest.Mock).mockReturnValue(mockQuery);

      const pagination = { page: 2, limit: 2 }; // Page 2, 2 items par page
      const result = await profileService.listProProfiles(undefined, pagination);

      expect(mockQuery.select().eq().order().range).toHaveBeenCalledWith(2, 3); // from: 2, to: 3
      expect(result.data).toEqual(mockPagedPros);
      expect(result.error).toBeNull();
    });

    it('devrait appliquer le tri par colonne spécifique', async () => {
      const mockSortedPros = [
        { id: 'pro_low_handicap', first_name: 'Champion', pro_profiles: { handicap: 0 } },
        { id: 'pro_mid_handicap', first_name: 'Good', pro_profiles: { handicap: 3 } },
      ];

      const mockQuery = {
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockResolvedValue({
              data: mockSortedPros,
              error: null,
              count: 2,
            }),
          }),
        }),
      };

      (supabase.from as jest.Mock).mockReturnValue(mockQuery);

      const sort = { sortBy: 'handicap', sortOrder: 'asc' as const };
      const result = await profileService.listProProfiles(undefined, undefined, sort);

      expect(mockQuery.select().eq().order).toHaveBeenCalledWith('pro_profiles.handicap', {
        ascending: true,
      });
      expect(result.data).toEqual(mockSortedPros);
      expect(result.error).toBeNull();
    });

    it('devrait utiliser le tri par défaut (created_at desc)', async () => {
      const mockDefaultSortedPros = [
        { id: 'pro_recent', created_at: '2024-01-02T00:00:00Z' },
        { id: 'pro_older', created_at: '2024-01-01T00:00:00Z' },
      ];

      const mockQuery = {
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockResolvedValue({
              data: mockDefaultSortedPros,
              error: null,
              count: 2,
            }),
          }),
        }),
      };

      (supabase.from as jest.Mock).mockReturnValue(mockQuery);

      const result = await profileService.listProProfiles();

      expect(mockQuery.select().eq().order).toHaveBeenCalledWith('created_at', {
        ascending: false,
      });
      expect(result.data).toEqual(mockDefaultSortedPros);
      expect(result.error).toBeNull();
    });

    it('devrait combiner filtres, pagination et tri', async () => {
      const mockComplexResult = [
        {
          id: 'pro_complex',
          first_name: 'Complex',
          last_name: 'Pro',
          city: 'Marseille',
          pro_profiles: {
            handicap: 2,
          },
        },
      ];

      const mockQuery = {
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            ilike: jest.fn().mockReturnValue({
              order: jest.fn().mockReturnValue({
                range: jest.fn().mockResolvedValue({
                  data: mockComplexResult,
                  error: null,
                  count: 5,
                }),
              }),
            }),
          }),
        }),
      };

      (supabase.from as jest.Mock).mockReturnValue(mockQuery);

      const filters = { city: 'Marseille' };
      const pagination = { page: 1, limit: 10 };
      const sort = { sortBy: 'handicap', sortOrder: 'asc' as const };

      const result = await profileService.listProProfiles(filters, pagination, sort);

      // Vérifier que toutes les options sont appliquées
      expect(mockQuery.select().eq().ilike().order().range).toHaveBeenCalledWith(0, 9);
      expect(result.data).toEqual(mockComplexResult);
      expect(result.error).toBeNull();
    });

    it('devrait gérer les erreurs de base de données', async () => {
      const mockQuery = {
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockResolvedValue({
              data: null,
              error: new Error('Database connection failed'),
            }),
          }),
        }),
      };

      (supabase.from as jest.Mock).mockReturnValue(mockQuery);

      const result = await profileService.listProProfiles();

      expect(result.data).toBeNull();
      expect(result.error).toBeDefined();
      expect(result.error?.message).toContain('Database connection failed');
    });

    it("devrait retourner une liste vide si aucun pro n'est trouvé", async () => {
      const mockQuery = {
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockResolvedValue({
              data: [],
              error: null,
              count: 0,
            }),
          }),
        }),
      };

      (supabase.from as jest.Mock).mockReturnValue(mockQuery);

      const result = await profileService.listProProfiles();

      expect(result.data).toEqual([]);
      expect(result.error).toBeNull();
    });
  });

  describe('getProsByGolfCourse', () => {
    it('devrait récupérer les pros disponibles sur un parcours', async () => {
      const golfCourseId = 'golf_123';
      const today = new Date().toISOString().split('T')[0];

      // Mock disponibilités
      const mockAvailabilities = [
        { pro_id: 'pro_001' },
        { pro_id: 'pro_002' },
        { pro_id: 'pro_001' }, // Doublon volontaire pour tester la déduplication
      ];

      // Mock profils pros
      const mockProProfiles = [
        {
          id: 'pro_001',
          first_name: 'John',
          last_name: 'GolfPro',
          user_type: 'pro',
          pro_profiles: {
            id: 'pro_profile_001',
            user_id: 'pro_001',
            handicap: 2,
          },
        },
        {
          id: 'pro_002',
          first_name: 'Jane',
          last_name: 'TeachPro',
          user_type: 'pro',
          pro_profiles: {
            id: 'pro_profile_002',
            user_id: 'pro_002',
            handicap: 1,
          },
        },
      ];

      // Mock query pour pro_availabilities
      const mockAvailabilityQuery = {
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            gte: jest.fn().mockResolvedValue({
              data: mockAvailabilities,
              error: null,
            }),
          }),
        }),
      };

      // Mock query pour profiles
      const mockProfileQuery = {
        select: jest.fn().mockReturnValue({
          in: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue({
                data: mockProProfiles,
                error: null,
              }),
            }),
          }),
        }),
      };

      (supabase.from as jest.Mock)
        .mockReturnValueOnce(mockAvailabilityQuery) // pro_availabilities
        .mockReturnValueOnce(mockProfileQuery); // profiles

      const result = await profileService.getProsByGolfCourse(golfCourseId);

      // Vérifier appel pro_availabilities
      expect(supabase.from).toHaveBeenNthCalledWith(1, 'pro_availabilities');
      expect(mockAvailabilityQuery.select).toHaveBeenCalledWith('pro_id');
      expect(mockAvailabilityQuery.select().eq).toHaveBeenCalledWith(
        'golf_course_id',
        golfCourseId
      );
      expect(mockAvailabilityQuery.select().eq().gte).toHaveBeenCalledWith('date', today);

      // Vérifier appel profiles
      expect(supabase.from).toHaveBeenNthCalledWith(2, 'profiles');
      expect(mockProfileQuery.select().in).toHaveBeenCalledWith('id', ['pro_001', 'pro_002']); // IDs uniques
      expect(mockProfileQuery.select().in().eq).toHaveBeenCalledWith('user_type', 'pro');

      expect(result.data).toEqual(mockProProfiles);
      expect(result.error).toBeNull();
    });

    it('devrait filtrer seulement les pros avec des créneaux disponibles', async () => {
      const golfCourseId = 'golf_456';
      const options = { onlyAvailable: true };

      const mockAvailabilities = [{ pro_id: 'pro_available' }];

      const mockProProfiles = [
        {
          id: 'pro_available',
          first_name: 'Available',
          last_name: 'Pro',
          user_type: 'pro',
          pro_profiles: {
            handicap: 3,
          },
        },
      ];

      // Mock avec filtre onlyAvailable
      const mockAvailabilityQuery = {
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            gte: jest.fn().mockReturnValue({
              gt: jest.fn().mockResolvedValue({
                data: mockAvailabilities,
                error: null,
              }),
            }),
          }),
        }),
      };

      const mockProfileQuery = {
        select: jest.fn().mockReturnValue({
          in: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue({
                data: mockProProfiles,
                error: null,
              }),
            }),
          }),
        }),
      };

      (supabase.from as jest.Mock)
        .mockReturnValueOnce(mockAvailabilityQuery)
        .mockReturnValueOnce(mockProfileQuery);

      const result = await profileService.getProsByGolfCourse(golfCourseId, options);

      // Vérifier filtre availability
      expect(mockAvailabilityQuery.select().eq().gte().gt).toHaveBeenCalledWith(
        'max_players',
        'current_bookings'
      );
      expect(result.data).toEqual(mockProProfiles);
      expect(result.error).toBeNull();
    });

    it('devrait appliquer une limite personnalisée', async () => {
      const golfCourseId = 'golf_789';
      const options = { limit: 5 };

      const mockAvailabilities = [
        { pro_id: 'pro_001' },
        { pro_id: 'pro_002' },
        { pro_id: 'pro_003' },
      ];

      const mockProProfiles = [
        { id: 'pro_001', first_name: 'Pro1' },
        { id: 'pro_002', first_name: 'Pro2' },
        { id: 'pro_003', first_name: 'Pro3' },
      ];

      const mockAvailabilityQuery = {
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            gte: jest.fn().mockResolvedValue({
              data: mockAvailabilities,
              error: null,
            }),
          }),
        }),
      };

      const mockProfileQuery = {
        select: jest.fn().mockReturnValue({
          in: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue({
                data: mockProProfiles,
                error: null,
              }),
            }),
          }),
        }),
      };

      (supabase.from as jest.Mock)
        .mockReturnValueOnce(mockAvailabilityQuery)
        .mockReturnValueOnce(mockProfileQuery);

      const result = await profileService.getProsByGolfCourse(golfCourseId, options);

      expect(mockProfileQuery.select().in().eq().limit).toHaveBeenCalledWith(5);
      expect(result.data).toEqual(mockProProfiles);
      expect(result.error).toBeNull();
    });

    it("devrait retourner une liste vide si aucune disponibilité n'existe", async () => {
      const golfCourseId = 'golf_empty';

      const mockAvailabilityQuery = {
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            gte: jest.fn().mockResolvedValue({
              data: [], // Aucune disponibilité
              error: null,
            }),
          }),
        }),
      };

      (supabase.from as jest.Mock).mockReturnValue(mockAvailabilityQuery);

      const result = await profileService.getProsByGolfCourse(golfCourseId);

      expect(result.data).toEqual([]);
      expect(result.error).toBeNull();
      // Ne devrait pas appeler la deuxième query profiles
      expect(supabase.from).toHaveBeenCalledTimes(1);
    });

    it("devrait retourner une liste vide si aucune disponibilité n'est trouvée", async () => {
      const golfCourseId = 'golf_null';

      const mockAvailabilityQuery = {
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            gte: jest.fn().mockResolvedValue({
              data: null, // null au lieu de []
              error: null,
            }),
          }),
        }),
      };

      (supabase.from as jest.Mock).mockReturnValue(mockAvailabilityQuery);

      const result = await profileService.getProsByGolfCourse(golfCourseId);

      expect(result.data).toEqual([]);
      expect(result.error).toBeNull();
    });

    it('devrait gérer les erreurs lors de la récupération des disponibilités', async () => {
      const golfCourseId = 'golf_error';

      const mockAvailabilityQuery = {
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            gte: jest.fn().mockResolvedValue({
              data: null,
              error: new Error('Availability query failed'),
            }),
          }),
        }),
      };

      (supabase.from as jest.Mock).mockReturnValue(mockAvailabilityQuery);

      const result = await profileService.getProsByGolfCourse(golfCourseId);

      expect(result.data).toBeNull();
      expect(result.error).toBeDefined();
      expect(result.error?.message).toContain('Availability query failed');
    });

    it('devrait gérer les erreurs lors de la récupération des profils', async () => {
      const golfCourseId = 'golf_profile_error';

      const mockAvailabilities = [{ pro_id: 'pro_001' }];

      const mockAvailabilityQuery = {
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            gte: jest.fn().mockResolvedValue({
              data: mockAvailabilities,
              error: null,
            }),
          }),
        }),
      };

      const mockProfileQuery = {
        select: jest.fn().mockReturnValue({
          in: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue({
                data: null,
                error: new Error('Profile query failed'),
              }),
            }),
          }),
        }),
      };

      (supabase.from as jest.Mock)
        .mockReturnValueOnce(mockAvailabilityQuery)
        .mockReturnValueOnce(mockProfileQuery);

      const result = await profileService.getProsByGolfCourse(golfCourseId);

      expect(result.data).toBeNull();
      expect(result.error).toBeDefined();
      expect(result.error?.message).toContain('Profile query failed');
    });

    it('devrait combiner onlyAvailable et limit', async () => {
      const golfCourseId = 'golf_combined';
      const options = { onlyAvailable: true, limit: 3 };

      const mockAvailabilities = [{ pro_id: 'pro_available_1' }, { pro_id: 'pro_available_2' }];

      const mockProProfiles = [
        { id: 'pro_available_1', first_name: 'Available1' },
        { id: 'pro_available_2', first_name: 'Available2' },
      ];

      const mockAvailabilityQuery = {
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            gte: jest.fn().mockReturnValue({
              gt: jest.fn().mockResolvedValue({
                data: mockAvailabilities,
                error: null,
              }),
            }),
          }),
        }),
      };

      const mockProfileQuery = {
        select: jest.fn().mockReturnValue({
          in: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue({
                data: mockProProfiles,
                error: null,
              }),
            }),
          }),
        }),
      };

      (supabase.from as jest.Mock)
        .mockReturnValueOnce(mockAvailabilityQuery)
        .mockReturnValueOnce(mockProfileQuery);

      const result = await profileService.getProsByGolfCourse(golfCourseId, options);

      // Vérifier les deux options appliquées
      expect(mockAvailabilityQuery.select().eq().gte().gt).toHaveBeenCalledWith(
        'max_players',
        'current_bookings'
      );
      expect(mockProfileQuery.select().in().eq().limit).toHaveBeenCalledWith(3);
      expect(result.data).toEqual(mockProProfiles);
      expect(result.error).toBeNull();
    });

    it('devrait utiliser la limite par défaut de 20', async () => {
      const golfCourseId = 'golf_default_limit';

      const mockAvailabilities = [{ pro_id: 'pro_001' }];
      const mockProProfiles = [{ id: 'pro_001', first_name: 'Pro1' }];

      const mockAvailabilityQuery = {
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            gte: jest.fn().mockResolvedValue({
              data: mockAvailabilities,
              error: null,
            }),
          }),
        }),
      };

      const mockProfileQuery = {
        select: jest.fn().mockReturnValue({
          in: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue({
                data: mockProProfiles,
                error: null,
              }),
            }),
          }),
        }),
      };

      (supabase.from as jest.Mock)
        .mockReturnValueOnce(mockAvailabilityQuery)
        .mockReturnValueOnce(mockProfileQuery);

      const result = await profileService.getProsByGolfCourse(golfCourseId);

      expect(mockProfileQuery.select().in().eq().limit).toHaveBeenCalledWith(20); // Limite par défaut
      expect(result.data).toEqual(mockProProfiles);
      expect(result.error).toBeNull();
    });
  });

  describe('convertToPro', () => {
    const mockProData = {
      date_of_birth: '1985-06-15',
      siret: '12345678901234',
      company_status: 'auto-entrepreneur',
      phone_number: '+33612345678',
      id_card_front_url: 'https://example.com/id_front.jpg',
      id_card_back_url: 'https://example.com/id_back.jpg',
      price_9_holes_1_player: 5000, // 50€ en centimes
      price_9_holes_2_players: 4000, // 40€ en centimes
      price_9_holes_3_players: 3500, // 35€ en centimes
      price_18_holes_1_player: 8000, // 80€ en centimes
      price_18_holes_2_players: 7000, // 70€ en centimes
      price_18_holes_3_players: 6500, // 65€ en centimes
    };

    it('devrait créer une demande de validation pro avec succès', async () => {
      const userId = 'user_convert';

      // Mock vérification aucune demande existante
      const mockExistingQuery = {
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            in: jest.fn().mockReturnValue({
              maybeSingle: jest.fn().mockResolvedValue({
                data: null, // Aucune demande existante
                error: null,
              }),
            }),
          }),
        }),
      };

      // Mock insertion nouvelle demande
      const mockInsertQuery = {
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { id: 'request_123' },
              error: null,
            }),
          }),
        }),
      };

      (supabase.from as jest.Mock)
        .mockReturnValueOnce(mockExistingQuery) // pro_validation_requests check
        .mockReturnValueOnce(mockInsertQuery); // pro_validation_requests insert

      const result = await profileService.convertToPro(userId, mockProData);

      // Vérifier vérification demande existante
      expect(supabase.from).toHaveBeenNthCalledWith(1, 'pro_validation_requests');
      expect(mockExistingQuery.select).toHaveBeenCalledWith('id, status');
      expect(mockExistingQuery.select().eq).toHaveBeenCalledWith('user_id', userId);
      expect(mockExistingQuery.select().eq().in).toHaveBeenCalledWith('status', [
        'pending',
        'approved',
      ]);

      // Vérifier insertion nouvelle demande
      expect(supabase.from).toHaveBeenNthCalledWith(2, 'pro_validation_requests');
      expect(mockInsertQuery.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: userId,
          date_of_birth: mockProData.date_of_birth,
          siret: mockProData.siret,
          company_status: mockProData.company_status,
          phone_number: mockProData.phone_number,
          status: 'pending',
          created_at: expect.any(String),
        })
      );

      expect(result.data).toEqual({ request_id: 'request_123' });
      expect(result.error).toBeNull();
    });

    it('devrait refuser si une demande pending existe déjà', async () => {
      const userId = 'user_pending';

      // Mock demande pending existante
      const mockExistingQuery = {
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            in: jest.fn().mockReturnValue({
              maybeSingle: jest.fn().mockResolvedValue({
                data: {
                  id: 'existing_request',
                  status: 'pending',
                },
                error: null,
              }),
            }),
          }),
        }),
      };

      (supabase.from as jest.Mock).mockReturnValue(mockExistingQuery);

      const result = await profileService.convertToPro(userId, mockProData);

      expect(result.data).toBeNull();
      expect(result.error).toBeDefined();
      expect(result.error?.message).toContain('Une demande de validation est déjà en cours');

      // Ne devrait pas essayer d'insérer
      expect(supabase.from).toHaveBeenCalledTimes(1);
    });

    it('devrait refuser si une demande approved existe déjà', async () => {
      const userId = 'user_approved';

      // Mock demande approved existante
      const mockExistingQuery = {
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            in: jest.fn().mockReturnValue({
              maybeSingle: jest.fn().mockResolvedValue({
                data: {
                  id: 'approved_request',
                  status: 'approved',
                },
                error: null,
              }),
            }),
          }),
        }),
      };

      (supabase.from as jest.Mock).mockReturnValue(mockExistingQuery);

      const result = await profileService.convertToPro(userId, mockProData);

      expect(result.data).toBeNull();
      expect(result.error).toBeDefined();
      expect(result.error?.message).toContain('Vous êtes déjà professionnel');
    });

    it('devrait accepter si une demande rejected existe (nouvelle tentative)', async () => {
      const userId = 'user_retry';

      // Mock demande rejected (permet nouvelle tentative)
      const mockExistingQuery = {
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            in: jest.fn().mockReturnValue({
              maybeSingle: jest.fn().mockResolvedValue({
                data: null, // Pas de demande pending/approved
                error: null,
              }),
            }),
          }),
        }),
      };

      const mockInsertQuery = {
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { id: 'retry_request_456' },
              error: null,
            }),
          }),
        }),
      };

      (supabase.from as jest.Mock)
        .mockReturnValueOnce(mockExistingQuery)
        .mockReturnValueOnce(mockInsertQuery);

      const result = await profileService.convertToPro(userId, mockProData);

      expect(result.data).toEqual({ request_id: 'retry_request_456' });
      expect(result.error).toBeNull();
    });

    it('devrait gérer les tarifs optionnels (valeurs nulles)', async () => {
      const userId = 'user_minimal';
      const minimalProData = {
        date_of_birth: '1990-01-01',
        siret: '98765432109876',
        company_status: 'SASU',
        phone_number: '+33698765432',
        // Pas de tarifs fournis
      };

      const mockExistingQuery = {
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            in: jest.fn().mockReturnValue({
              maybeSingle: jest.fn().mockResolvedValue({
                data: null,
                error: null,
              }),
            }),
          }),
        }),
      };

      const mockInsertQuery = {
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { id: 'minimal_request_789' },
              error: null,
            }),
          }),
        }),
      };

      (supabase.from as jest.Mock)
        .mockReturnValueOnce(mockExistingQuery)
        .mockReturnValueOnce(mockInsertQuery);

      const result = await profileService.convertToPro(userId, minimalProData);

      // Vérifier que les tarifs non fournis sont définis à null
      expect(mockInsertQuery.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          price_9_holes_1_player: null,
          price_9_holes_2_players: null,
          price_9_holes_3_players: null,
          price_18_holes_1_player: null,
          price_18_holes_2_players: null,
          price_18_holes_3_players: null,
        })
      );

      expect(result.data).toEqual({ request_id: 'minimal_request_789' });
      expect(result.error).toBeNull();
    });

    it("devrait continuer l'insertion même si la vérification échoue", async () => {
      const userId = 'user_check_error';

      // Simuler : vérification échoue mais insertion réussit
      // (comportement actuel du service - il ne vérifie pas l'erreur de la première requête)
      const mockQuery = {
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            in: jest.fn().mockReturnValue({
              maybeSingle: jest.fn().mockResolvedValue({
                data: null,
                error: new Error('Database check failed'),
              }),
            }),
          }),
        }),
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { id: 'request_with_check_error_123' },
              error: null,
            }),
          }),
        }),
      };

      (supabase.from as jest.Mock).mockReturnValue(mockQuery);

      const result = await profileService.convertToPro(userId, mockProData);

      // Le service continue et réussit l'insertion malgré l'échec de vérification
      expect(result.data).toEqual({ request_id: 'request_with_check_error_123' });
      expect(result.error).toBeNull();
    });

    it("devrait gérer les erreurs lors de l'insertion de la demande", async () => {
      const userId = 'user_insert_error';

      const mockExistingQuery = {
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            in: jest.fn().mockReturnValue({
              maybeSingle: jest.fn().mockResolvedValue({
                data: null,
                error: null,
              }),
            }),
          }),
        }),
      };

      const mockInsertQuery = {
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: new Error('Insert validation failed'),
            }),
          }),
        }),
      };

      (supabase.from as jest.Mock)
        .mockReturnValueOnce(mockExistingQuery)
        .mockReturnValueOnce(mockInsertQuery);

      const result = await profileService.convertToPro(userId, mockProData);

      expect(result.data).toBeNull();
      expect(result.error).toBeDefined();
      expect(result.error?.message).toContain('Insert validation failed');
    });

    it('devrait valider les données obligatoires', async () => {
      const userId = 'user_validation';
      const completeProData = {
        ...mockProData,
        id_card_front_url: 'https://example.com/front.jpg',
        id_card_back_url: 'https://example.com/back.jpg',
      };

      const mockExistingQuery = {
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            in: jest.fn().mockReturnValue({
              maybeSingle: jest.fn().mockResolvedValue({
                data: null,
                error: null,
              }),
            }),
          }),
        }),
      };

      const mockInsertQuery = {
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { id: 'complete_request' },
              error: null,
            }),
          }),
        }),
      };

      (supabase.from as jest.Mock)
        .mockReturnValueOnce(mockExistingQuery)
        .mockReturnValueOnce(mockInsertQuery);

      const result = await profileService.convertToPro(userId, completeProData);

      // Vérifier que toutes les données sont présentes
      expect(mockInsertQuery.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: userId,
          date_of_birth: completeProData.date_of_birth,
          siret: completeProData.siret,
          company_status: completeProData.company_status,
          phone_number: completeProData.phone_number,
          id_card_front_url: completeProData.id_card_front_url,
          id_card_back_url: completeProData.id_card_back_url,
          price_9_holes_1_player: completeProData.price_9_holes_1_player,
          price_18_holes_3_players: completeProData.price_18_holes_3_players,
          status: 'pending',
          created_at: expect.any(String),
        })
      );

      expect(result.data).toEqual({ request_id: 'complete_request' });
      expect(result.error).toBeNull();
    });
  });

  describe('getProRequestStatus', () => {
    it('devrait retourner "none" si aucune demande n\'existe', async () => {
      const userId = 'user_no_request';

      const mockQuery = {
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockReturnValue({
              limit: jest.fn().mockReturnValue({
                maybeSingle: jest.fn().mockResolvedValue({
                  data: null,
                  error: null,
                }),
              }),
            }),
          }),
        }),
      };

      (supabase.from as jest.Mock).mockReturnValue(mockQuery);

      const result = await profileService.getProRequestStatus(userId);

      expect(result.data).toEqual({ status: 'none' });
      expect(result.error).toBeNull();

      expect(supabase.from).toHaveBeenCalledWith('pro_validation_requests');
      expect(mockQuery.select).toHaveBeenCalledWith(
        'id, status, admin_notes, created_at, validated_at'
      );
      expect(mockQuery.select().eq).toHaveBeenCalledWith('user_id', userId);
      expect(mockQuery.select().eq().order).toHaveBeenCalledWith('created_at', {
        ascending: false,
      });
      expect(mockQuery.select().eq().order().limit).toHaveBeenCalledWith(1);
    });

    it('devrait retourner le statut pending avec les détails', async () => {
      const userId = 'user_pending';
      const mockRequest = {
        id: 'request_pending_123',
        status: 'pending',
        admin_notes: null,
        created_at: '2025-01-15T10:00:00Z',
        validated_at: null,
      };

      const mockQuery = {
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockReturnValue({
              limit: jest.fn().mockReturnValue({
                maybeSingle: jest.fn().mockResolvedValue({
                  data: mockRequest,
                  error: null,
                }),
              }),
            }),
          }),
        }),
      };

      (supabase.from as jest.Mock).mockReturnValue(mockQuery);

      const result = await profileService.getProRequestStatus(userId);

      expect(result.data).toEqual({
        status: 'pending',
        request_id: 'request_pending_123',
        admin_notes: null,
        created_at: '2025-01-15T10:00:00Z',
        validated_at: null,
      });
      expect(result.error).toBeNull();
    });

    it('devrait retourner le statut approved avec les détails', async () => {
      const userId = 'user_approved';
      const mockRequest = {
        id: 'request_approved_456',
        status: 'approved',
        admin_notes: 'Profil validé avec succès',
        created_at: '2025-01-10T10:00:00Z',
        validated_at: '2025-01-12T14:30:00Z',
      };

      const mockQuery = {
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockReturnValue({
              limit: jest.fn().mockReturnValue({
                maybeSingle: jest.fn().mockResolvedValue({
                  data: mockRequest,
                  error: null,
                }),
              }),
            }),
          }),
        }),
      };

      (supabase.from as jest.Mock).mockReturnValue(mockQuery);

      const result = await profileService.getProRequestStatus(userId);

      expect(result.data).toEqual({
        status: 'approved',
        request_id: 'request_approved_456',
        admin_notes: 'Profil validé avec succès',
        created_at: '2025-01-10T10:00:00Z',
        validated_at: '2025-01-12T14:30:00Z',
      });
      expect(result.error).toBeNull();
    });

    it('devrait retourner le statut rejected avec les notes admin', async () => {
      const userId = 'user_rejected';
      const mockRequest = {
        id: 'request_rejected_789',
        status: 'rejected',
        admin_notes: 'Documents manquants : diplôme PGA',
        created_at: '2025-01-08T10:00:00Z',
        validated_at: '2025-01-09T16:45:00Z',
      };

      const mockQuery = {
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockReturnValue({
              limit: jest.fn().mockReturnValue({
                maybeSingle: jest.fn().mockResolvedValue({
                  data: mockRequest,
                  error: null,
                }),
              }),
            }),
          }),
        }),
      };

      (supabase.from as jest.Mock).mockReturnValue(mockQuery);

      const result = await profileService.getProRequestStatus(userId);

      expect(result.data).toEqual({
        status: 'rejected',
        request_id: 'request_rejected_789',
        admin_notes: 'Documents manquants : diplôme PGA',
        created_at: '2025-01-08T10:00:00Z',
        validated_at: '2025-01-09T16:45:00Z',
      });
      expect(result.error).toBeNull();
    });

    it('devrait récupérer seulement la demande la plus récente', async () => {
      const userId = 'user_multiple_requests';

      // La plus récente est retournée (approved après un rejected)
      const mockLatestRequest = {
        id: 'request_latest_999',
        status: 'approved',
        admin_notes: 'Nouvelle demande validée',
        created_at: '2025-01-15T10:00:00Z',
        validated_at: '2025-01-16T11:00:00Z',
      };

      const mockQuery = {
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockReturnValue({
              limit: jest.fn().mockReturnValue({
                maybeSingle: jest.fn().mockResolvedValue({
                  data: mockLatestRequest,
                  error: null,
                }),
              }),
            }),
          }),
        }),
      };

      (supabase.from as jest.Mock).mockReturnValue(mockQuery);

      const result = await profileService.getProRequestStatus(userId);

      expect(result.data?.status).toBe('approved');
      expect(result.data?.request_id).toBe('request_latest_999');
      expect(result.error).toBeNull();

      // Vérifier que l'ordre est correct (desc = plus récent d'abord)
      expect(mockQuery.select().eq().order).toHaveBeenCalledWith('created_at', {
        ascending: false,
      });
      expect(mockQuery.select().eq().order().limit).toHaveBeenCalledWith(1);
    });

    it('devrait gérer les erreurs de base de données', async () => {
      const userId = 'user_db_error';

      const mockQuery = {
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockReturnValue({
              limit: jest.fn().mockReturnValue({
                maybeSingle: jest.fn().mockResolvedValue({
                  data: null,
                  error: new Error('Database connection failed'),
                }),
              }),
            }),
          }),
        }),
      };

      (supabase.from as jest.Mock).mockReturnValue(mockQuery);

      const result = await profileService.getProRequestStatus(userId);

      expect(result.data).toBeNull();
      expect(result.error).toBeDefined();
      expect(result.error?.message).toContain('Database connection failed');
    });
  });

  describe('uploadAvatar', () => {
    it('devrait uploader un File avec succès', async () => {
      const userId = 'user_upload_file';
      const mockFile = new File(['fake-image-content'], 'profile.jpg', {
        type: 'image/jpeg',
      });

      // Mock Supabase storage
      const mockStorage = {
        upload: jest.fn().mockResolvedValue({
          data: { path: 'avatars/user_upload_file-1234567890.jpg' },
          error: null,
        }),
        getPublicUrl: jest.fn().mockReturnValue({
          data: {
            publicUrl:
              'https://storage.supabase.co/profiles/avatars/user_upload_file-1234567890.jpg',
          },
        }),
      };

      const mockStorageFrom = jest.fn().mockReturnValue(mockStorage);
      (supabase.storage as any) = {
        from: mockStorageFrom,
      };

      // Mock Date.now pour prévisible le nom de fichier
      const mockDateNow = jest.spyOn(Date, 'now').mockReturnValue(1234567890);

      const result = await profileService.uploadAvatar(userId, mockFile);

      expect(result.data).toBe(
        'https://storage.supabase.co/profiles/avatars/user_upload_file-1234567890.jpg'
      );
      expect(result.error).toBeNull();

      expect(mockStorageFrom).toHaveBeenCalledWith('profiles');
      expect(mockStorage.upload).toHaveBeenCalledWith(
        'avatars/user_upload_file-1234567890.jpg',
        mockFile,
        {
          upsert: true,
          cacheControl: '3600',
        }
      );
      expect(mockStorage.getPublicUrl).toHaveBeenCalledWith(
        'avatars/user_upload_file-1234567890.jpg'
      );

      mockDateNow.mockRestore();
    });

    it('devrait uploader un Blob avec succès', async () => {
      const userId = 'user_upload_blob';
      const mockBlob = new Blob(['fake-image-data'], { type: 'image/png' });

      const mockStorage = {
        upload: jest.fn().mockResolvedValue({
          data: { path: 'avatars/user_upload_blob-9876543210.jpg' },
          error: null,
        }),
        getPublicUrl: jest.fn().mockReturnValue({
          data: {
            publicUrl:
              'https://storage.supabase.co/profiles/avatars/user_upload_blob-9876543210.jpg',
          },
        }),
      };

      const mockStorageFrom = jest.fn().mockReturnValue(mockStorage);
      (supabase.storage as any) = { from: mockStorageFrom };

      const mockDateNow = jest.spyOn(Date, 'now').mockReturnValue(9876543210);

      const result = await profileService.uploadAvatar(userId, mockBlob);

      expect(result.data).toBe(
        'https://storage.supabase.co/profiles/avatars/user_upload_blob-9876543210.jpg'
      );
      expect(result.error).toBeNull();

      // Pour un Blob, l'extension par défaut est jpg
      expect(mockStorage.upload).toHaveBeenCalledWith(
        'avatars/user_upload_blob-9876543210.jpg',
        mockBlob,
        {
          upsert: true,
          cacheControl: '3600',
        }
      );

      mockDateNow.mockRestore();
    });

    it("devrait gérer les erreurs d'upload storage", async () => {
      const userId = 'user_upload_error';
      const mockFile = new File(['content'], 'profile.jpg', { type: 'image/jpeg' });

      const mockStorage = {
        upload: jest.fn().mockResolvedValue({
          data: null,
          error: new Error('Storage quota exceeded'),
        }),
        getPublicUrl: jest.fn(),
      };

      (supabase.storage as any) = { from: jest.fn().mockReturnValue(mockStorage) };

      const result = await profileService.uploadAvatar(userId, mockFile);

      expect(result.data).toBeNull();
      expect(result.error).toBeDefined();
      expect(result.error?.message).toContain('Storage quota exceeded');
    });

    it("devrait gérer les exceptions durant l'upload", async () => {
      const userId = 'user_exception';
      const mockFile = new File(['content'], 'profile.jpg', { type: 'image/jpeg' });

      // Mock storage qui throw une exception
      const mockStorage = {
        upload: jest.fn().mockRejectedValue(new Error('Network error')),
      };

      (supabase.storage as any) = { from: jest.fn().mockReturnValue(mockStorage) };

      const result = await profileService.uploadAvatar(userId, mockFile);

      expect(result.data).toBeNull();
      expect(result.error).toBeDefined();
      expect(result.error?.message).toContain('Network error');
    });
  });

  describe('uploadAvatarWithFormData', () => {
    let originalFormData: any;

    beforeEach(() => {
      // Mock global fetch pour React Native
      global.fetch = jest.fn();
      global.FileReader = jest.fn();
      global.atob = jest.fn();

      // Mock FormData pour React Native
      originalFormData = global.FormData;
      global.FormData = jest.fn().mockImplementation(() => {
        const formData = new Map();
        return {
          append: jest.fn((key: string, value: any) => formData.set(key, value)),
          get: jest.fn((key: string) => formData.get(key)),
        };
      });
    });

    afterEach(() => {
      jest.clearAllMocks();
      global.FormData = originalFormData;
    });

    it('devrait uploader avec FormData React Native avec succès', async () => {
      const userId = 'user_formdata_upload';
      const fileName = 'avatar.jpg';

      // Créer un mock FormData avec file URI valide
      const mockFile = {
        uri: 'file:///path/to/image.jpg',
        type: 'image/jpeg',
        name: 'avatar.jpg',
      };

      const mockFormData = {
        get: jest.fn().mockReturnValue(mockFile),
        append: jest.fn(),
      };

      // Simulate adding the file
      mockFormData.append('file', mockFile as any);

      // Mock fetch response pour récupérer le blob
      const mockBlob = new Blob(['fake-image-data'], { type: 'image/jpeg' });
      (global.fetch as jest.Mock).mockResolvedValue({
        blob: jest.fn().mockResolvedValue(mockBlob),
      });

      // Mock FileReader pour base64 conversion - version synchrone pour test
      const mockFileReader = {
        onloadend: null as any,
        onerror: null as any,
        readAsDataURL: jest.fn().mockImplementation(function (this: any) {
          // Appel synchrone pour les tests
          this.result = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD//2Q==';
          if (this.onloadend) this.onloadend();
        }),
        result: null,
      };
      (global.FileReader as jest.Mock).mockImplementation(() => mockFileReader);

      // Mock atob pour décoder base64
      (global.atob as jest.Mock).mockImplementation((base64: string) => {
        // Simuler décodage base64 -> binary string
        return 'fake-binary-string-from-' + base64.slice(0, 10);
      });

      // Mock Supabase storage
      const mockStorage = {
        upload: jest.fn().mockResolvedValue({
          data: { path: 'avatars/user_formdata_upload-1234567890.jpg' },
          error: null,
        }),
        getPublicUrl: jest.fn().mockReturnValue({
          data: {
            publicUrl:
              'https://storage.supabase.co/profiles/avatars/user_formdata_upload-1234567890.jpg',
          },
        }),
      };

      (supabase.storage as any) = { from: jest.fn().mockReturnValue(mockStorage) };

      const mockDateNow = jest.spyOn(Date, 'now').mockReturnValue(1234567890);

      const result = await profileService.uploadAvatarWithFormData(
        userId,
        mockFormData as any,
        fileName
      );

      expect(result.data).toBe(
        'https://storage.supabase.co/profiles/avatars/user_formdata_upload-1234567890.jpg'
      );
      expect(result.error).toBeNull();

      expect(global.fetch).toHaveBeenCalledWith('file:///path/to/image.jpg');
      expect(mockFileReader.readAsDataURL).toHaveBeenCalledWith(mockBlob);
      expect(mockStorage.upload).toHaveBeenCalledWith(
        'avatars/user_formdata_upload-1234567890.jpg',
        expect.any(Uint8Array),
        {
          contentType: 'image/jpeg',
          upsert: true,
        }
      );

      mockDateNow.mockRestore();
    });

    it('devrait gérer le fichier invalide dans FormData', async () => {
      const userId = 'user_invalid_file';
      const fileName = 'avatar.jpg';

      // FormData avec file invalide (sans uri)
      const invalidFile = { name: 'test.jpg' }; // Pas d'uri
      const mockFormData = {
        get: jest.fn().mockReturnValue(invalidFile),
        append: jest.fn(),
      };

      const result = await profileService.uploadAvatarWithFormData(
        userId,
        mockFormData as any,
        fileName
      );

      expect(result.data).toBeNull();
      expect(result.error).toBeDefined();
      expect(result.error?.message).toContain('Fichier invalide dans FormData');
    });

    it('devrait gérer les erreurs de fetch du fichier', async () => {
      const userId = 'user_fetch_error';
      const fileName = 'avatar.jpg';

      const mockFile = {
        uri: 'file:///invalid/path.jpg',
        type: 'image/jpeg',
      };
      const mockFormData = {
        get: jest.fn().mockReturnValue(mockFile),
        append: jest.fn(),
      };

      // Mock fetch qui échoue
      (global.fetch as jest.Mock).mockRejectedValue(new Error('File not found'));

      const result = await profileService.uploadAvatarWithFormData(
        userId,
        mockFormData as any,
        fileName
      );

      expect(result.data).toBeNull();
      expect(result.error).toBeDefined();
      expect(result.error?.message).toContain('File not found');
    });

    it('devrait gérer les erreurs de FileReader', async () => {
      const userId = 'user_reader_error';
      const fileName = 'avatar.jpg';

      const mockFile = {
        uri: 'file:///path/to/corrupted.jpg',
        type: 'image/jpeg',
      };
      const mockFormData = {
        get: jest.fn().mockReturnValue(mockFile),
        append: jest.fn(),
      };

      const mockBlob = new Blob(['corrupted-data'], { type: 'image/jpeg' });
      (global.fetch as jest.Mock).mockResolvedValue({
        blob: jest.fn().mockResolvedValue(mockBlob),
      });

      // Mock FileReader qui échoue - version synchrone pour test
      const mockFileReader = {
        onloadend: null as any,
        onerror: null as any,
        readAsDataURL: jest.fn().mockImplementation(function (this: any) {
          // Appel synchrone de l'erreur
          if (this.onerror) this.onerror(new Error('FileReader failed'));
        }),
      };
      (global.FileReader as jest.Mock).mockImplementation(() => mockFileReader);

      const result = await profileService.uploadAvatarWithFormData(
        userId,
        mockFormData as any,
        fileName
      );

      expect(result.data).toBeNull();
      expect(result.error).toBeDefined();
      expect(result.error?.message).toContain('FileReader failed');
    });

    it("devrait gérer les erreurs d'upload vers Supabase", async () => {
      const userId = 'user_supabase_error';
      const fileName = 'avatar.jpg';

      const mockFile = {
        uri: 'file:///path/to/image.jpg',
        type: 'image/jpeg',
      };
      const mockFormData = {
        get: jest.fn().mockReturnValue(mockFile),
        append: jest.fn(),
      };

      const mockBlob = new Blob(['image-data'], { type: 'image/jpeg' });
      (global.fetch as jest.Mock).mockResolvedValue({
        blob: jest.fn().mockResolvedValue(mockBlob),
      });

      // Mock FileReader qui réussit
      const mockFileReader = {
        onloadend: null as any,
        onerror: null as any,
        readAsDataURL: jest.fn().mockImplementation(function (this: any) {
          // Appel synchrone pour tests
          this.result = 'data:image/jpeg;base64,validBase64Data';
          if (this.onloadend) this.onloadend();
        }),
      };
      (global.FileReader as jest.Mock).mockImplementation(() => mockFileReader);

      (global.atob as jest.Mock).mockReturnValue('binary-data');

      // Mock Supabase storage qui échoue
      const mockStorage = {
        upload: jest.fn().mockResolvedValue({
          data: null,
          error: new Error('Supabase storage error'),
        }),
      };

      (supabase.storage as any) = { from: jest.fn().mockReturnValue(mockStorage) };

      const result = await profileService.uploadAvatarWithFormData(
        userId,
        mockFormData as any,
        fileName
      );

      expect(result.data).toBeNull();
      expect(result.error).toBeDefined();
      expect(result.error?.message).toContain('Supabase storage error');
    });
  });

  describe('submitGolfCourse', () => {
    it('devrait soumettre un nouveau parcours de golf avec succès', async () => {
      const golfCourseData = {
        name: 'Golf de Saint-Tropez',
        address: '123 Route du Golf',
        city: 'Saint-Tropez',
        postal_code: '83990',
        phone: '+33 4 94 55 02 02',
        email: 'contact@golf-saint-tropez.fr',
        website: 'https://golf-saint-tropez.fr',
        description: 'Parcours 18 trous face à la mer',
        holes_count: 18,
        par: 72,
        course_type: 'championship' as const,
        submitted_by: 'user_submitter',
      };

      const mockResponse = {
        id: 'course_submission_123',
        ...golfCourseData,
        status: 'pending',
        created_at: '2025-01-15T10:00:00Z',
        validated_at: null,
        admin_notes: null,
      };

      const mockQuery = {
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockResponse,
              error: null,
            }),
          }),
        }),
      };

      (supabase.from as jest.Mock).mockReturnValue(mockQuery);

      const result = await profileService.submitGolfCourse(golfCourseData);

      expect(result.data).toEqual(mockResponse);
      expect(result.error).toBeNull();

      expect(supabase.from).toHaveBeenCalledWith('golf_course_submissions');
      expect(mockQuery.insert).toHaveBeenCalledWith(golfCourseData);
      expect(mockQuery.insert().select).toHaveBeenCalled();
      expect(mockQuery.insert().select().single).toHaveBeenCalled();
    });

    it("devrait gérer les erreurs d'insertion", async () => {
      const golfCourseData = {
        name: 'Golf Invalid',
        address: 'Invalid Address',
        city: 'Invalid City',
        postal_code: '12345',
        submitted_by: 'user_invalid',
      };

      const mockQuery = {
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: new Error('Database constraint violation'),
            }),
          }),
        }),
      };

      (supabase.from as jest.Mock).mockReturnValue(mockQuery);

      const result = await profileService.submitGolfCourse(golfCourseData);

      expect(result.data).toBeNull();
      expect(result.error).toBeDefined();
      expect(result.error?.message).toContain('Database constraint violation');
    });

    it('devrait laisser passer les exceptions durant la soumission', async () => {
      const golfCourseData = {
        name: 'Golf Exception',
        address: 'Exception Address',
        city: 'Exception City',
        postal_code: '99999',
        submitted_by: 'user_exception',
      };

      const mockQuery = {
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockRejectedValue(new Error('Network timeout')),
          }),
        }),
      };

      (supabase.from as jest.Mock).mockReturnValue(mockQuery);

      // Le service submitGolfCourse n'a pas de try/catch, l'exception remonte
      await expect(profileService.submitGolfCourse(golfCourseData)).rejects.toThrow(
        'Network timeout'
      );
    });
  });

  describe('getProStats', () => {
    it("devrait calculer les statistiques complètes d'un pro", async () => {
      const proId = 'pro_stats_complete';

      // Mock pour totalBookings count
      const mockBookingsQuery = {
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({
              count: 15, // 15 réservations complétées
              error: null,
            }),
          }),
        }),
      };

      // Mock pour reviews (notes)
      const mockReviewsQuery = {
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            data: [{ rating: 4.5 }, { rating: 5.0 }, { rating: 4.0 }, { rating: 4.8 }],
            error: null,
          }),
        }),
      };

      // Mock pour payments (revenus)
      const mockPaymentsQuery = {
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({
              data: [
                { pro_fee: 8000 }, // 80€
                { pro_fee: 12000 }, // 120€
                { pro_fee: 6000 }, // 60€
              ],
              error: null,
            }),
          }),
        }),
      };

      // Séquence des appels à supabase.from
      (supabase.from as jest.Mock)
        .mockReturnValueOnce(mockBookingsQuery) // 1er appel: bookings count
        .mockReturnValueOnce(mockReviewsQuery) // 2ème appel: reviews
        .mockReturnValueOnce(mockPaymentsQuery); // 3ème appel: payments

      const result = await profileService.getProStats(proId);

      expect(result.data).toEqual({
        totalBookings: 15,
        averageRating: 4.6, // (4.5+5.0+4.0+4.8)/4 = 4.575 → 4.6 arrondi
        totalReviews: 4,
        totalEarnings: 260, // (8000+12000+6000)/100 = 260€
      });
      expect(result.error).toBeNull();

      // Vérifier les appels corrects
      expect(supabase.from).toHaveBeenCalledWith('bookings');
      expect(supabase.from).toHaveBeenCalledWith('reviews');
      expect(supabase.from).toHaveBeenCalledTimes(3);

      expect(mockBookingsQuery.select).toHaveBeenCalledWith('*', { count: 'exact', head: true });
      expect(mockReviewsQuery.select).toHaveBeenCalledWith('rating');
      expect(mockPaymentsQuery.select).toHaveBeenCalledWith('pro_fee');
    });

    it('devrait gérer un pro sans statistiques', async () => {
      const proId = 'pro_no_stats';

      // Mock pour bookings (aucune)
      const mockBookingsQuery = {
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({
              count: 0,
              error: null,
            }),
          }),
        }),
      };

      // Mock pour reviews (aucune)
      const mockReviewsQuery = {
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            data: [],
            error: null,
          }),
        }),
      };

      // Mock pour payments (aucun)
      const mockPaymentsQuery = {
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
        .mockReturnValueOnce(mockReviewsQuery)
        .mockReturnValueOnce(mockPaymentsQuery);

      const result = await profileService.getProStats(proId);

      expect(result.data).toEqual({
        totalBookings: 0,
        averageRating: 0,
        totalReviews: 0,
        totalEarnings: 0,
      });
      expect(result.error).toBeNull();
    });

    it('devrait gérer les erreurs lors de la récupération des bookings', async () => {
      const proId = 'pro_bookings_error';

      const mockBookingsQuery = {
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockRejectedValue(new Error('Bookings query failed')),
          }),
        }),
      };

      (supabase.from as jest.Mock).mockReturnValue(mockBookingsQuery);

      const result = await profileService.getProStats(proId);

      expect(result.data).toBeNull();
      expect(result.error).toBeDefined();
      expect(result.error?.message).toContain('Bookings query failed');
    });

    it('devrait gérer les erreurs lors de la récupération des reviews', async () => {
      const proId = 'pro_reviews_error';

      // Mock bookings qui réussit
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

      // Mock reviews qui échoue
      const mockReviewsQuery = {
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockRejectedValue(new Error('Reviews query failed')),
        }),
      };

      (supabase.from as jest.Mock)
        .mockReturnValueOnce(mockBookingsQuery)
        .mockReturnValueOnce(mockReviewsQuery);

      const result = await profileService.getProStats(proId);

      expect(result.data).toBeNull();
      expect(result.error).toBeDefined();
      expect(result.error?.message).toContain('Reviews query failed');
    });

    it('devrait calculer correctement la moyenne avec une note', async () => {
      const proId = 'pro_single_review';

      const mockBookingsQuery = {
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({
              count: 1,
              error: null,
            }),
          }),
        }),
      };

      const mockReviewsQuery = {
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            data: [{ rating: 4.7 }], // Une seule note
            error: null,
          }),
        }),
      };

      const mockPaymentsQuery = {
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({
              data: [{ pro_fee: 5000 }], // 50€
              error: null,
            }),
          }),
        }),
      };

      (supabase.from as jest.Mock)
        .mockReturnValueOnce(mockBookingsQuery)
        .mockReturnValueOnce(mockReviewsQuery)
        .mockReturnValueOnce(mockPaymentsQuery);

      const result = await profileService.getProStats(proId);

      expect(result.data).toEqual({
        totalBookings: 1,
        averageRating: 4.7, // Une seule note = pas d'arrondi nécessaire
        totalReviews: 1,
        totalEarnings: 50,
      });
      expect(result.error).toBeNull();
    });
  });
});
