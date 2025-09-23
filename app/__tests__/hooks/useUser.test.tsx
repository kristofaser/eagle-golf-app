/**
 * Tests pour le hook useUser
 * Couvre la gestion des données utilisateur et profil
 */
import { renderHook } from '@testing-library/react-native';
import { useUser } from '@/hooks/useUser';

// Mock des contextes utilisés par useUser
jest.mock('@/contexts/AppProviders', () => ({
  useSessionUser: jest.fn(),
  useProfile: jest.fn(),
}));

jest.mock('@/contexts/UserContext', () => ({
  useUserContext: jest.fn(),
}));

jest.mock('@/contexts/SessionContext', () => ({
  useSessionContext: jest.fn(),
}));

const mockUseSessionUser = require('@/contexts/AppProviders').useSessionUser;
const mockUseProfile = require('@/contexts/AppProviders').useProfile;
const mockUseUserContext = require('@/contexts/UserContext').useUserContext;
const mockUseSessionContext = require('@/contexts/SessionContext').useSessionContext;

describe('useUser Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Valeurs par défaut
    mockUseSessionUser.mockReturnValue(null);
    mockUseProfile.mockReturnValue(null);
    mockUseUserContext.mockReturnValue({
      updateProfile: jest.fn(),
      loading: false,
    });
    mockUseSessionContext.mockReturnValue({
      loading: false,
    });
  });

  describe('État initial', () => {
    it("devrait retourner null quand aucun utilisateur n'est connecté", () => {
      const { result } = renderHook(() => useUser());

      expect(result.current.user).toBeNull();
      expect(result.current.profile).toBeNull();
      expect(result.current.loading).toBe(false);
    });

    it('devrait charger les données utilisateur au montage', () => {
      const mockUser = {
        id: 'user_123',
        email: 'test@example.com',
        amateurProfile: {
          id: 'amateur_123',
          handicap: 18,
          experience_level: 'intermediate',
        },
      };

      mockUseSessionUser.mockReturnValue(mockUser);

      const { result } = renderHook(() => useUser());

      expect(result.current.user).toEqual(mockUser);
      expect(result.current.amateurProfile).toEqual(mockUser.amateurProfile);
    });
  });

  describe('Chargement du profil', () => {
    it('devrait charger le profil utilisateur depuis Supabase', () => {
      const mockProfile = {
        id: 'user_123',
        first_name: 'John',
        last_name: 'Doe',
        avatar_url: 'https://example.com/avatar.jpg',
        user_type: 'amateur',
      };

      mockUseProfile.mockReturnValue(mockProfile);

      const { result } = renderHook(() => useUser());

      expect(result.current.profile).toEqual(mockProfile);
      expect(result.current.fullName).toBe('John Doe');
      expect(result.current.initials).toBe('JD');
    });

    it('devrait gérer les erreurs de chargement du profil', () => {
      mockUseProfile.mockReturnValue(null);
      mockUseUserContext.mockReturnValue({
        updateProfile: jest.fn(),
        loading: false,
        error: new Error('Profile not found'),
      });

      const { result } = renderHook(() => useUser());

      expect(result.current.profile).toBeNull();
    });
  });

  describe('Mise à jour du profil', () => {
    it('devrait mettre à jour le profil utilisateur', () => {
      const mockUpdateProfile = jest.fn();
      mockUseUserContext.mockReturnValue({
        updateProfile: mockUpdateProfile,
        loading: false,
      });

      const { result } = renderHook(() => useUser());

      expect(result.current.updateProfile).toBe(mockUpdateProfile);
    });

    it('devrait gérer les erreurs de mise à jour', () => {
      const mockUpdateProfile = jest.fn().mockRejectedValue(new Error('Update failed'));
      mockUseUserContext.mockReturnValue({
        updateProfile: mockUpdateProfile,
        loading: false,
      });

      const { result } = renderHook(() => useUser());

      expect(result.current.updateProfile).toBe(mockUpdateProfile);
    });
  });

  describe('Vérification du type de profil', () => {
    it('devrait détecter un profil Pro', () => {
      const mockProfile = {
        id: 'user_123',
        first_name: 'John',
        last_name: 'Pro',
        user_type: 'pro',
      };

      const mockUser = {
        id: 'user_123',
        proProfile: {
          id: 'pro_123',
          specialties: ['putting', 'driving'],
          handicap: 2,
        },
      };

      mockUseProfile.mockReturnValue(mockProfile);
      mockUseSessionUser.mockReturnValue(mockUser);

      const { result } = renderHook(() => useUser());

      expect(result.current.isPro).toBe(true);
      expect(result.current.isAmateur).toBe(false);
      expect(result.current.specialties).toEqual(['putting', 'driving']);
    });

    it('devrait détecter un profil Amateur', () => {
      const mockProfile = {
        id: 'user_123',
        first_name: 'Jane',
        last_name: 'Amateur',
        user_type: 'amateur',
      };

      const mockUser = {
        id: 'user_123',
        amateurProfile: {
          id: 'amateur_123',
          handicap: 18,
          experience_level: 'beginner',
        },
      };

      mockUseProfile.mockReturnValue(mockProfile);
      mockUseSessionUser.mockReturnValue(mockUser);

      const { result } = renderHook(() => useUser());

      expect(result.current.isPro).toBe(false);
      expect(result.current.isAmateur).toBe(true);
      expect(result.current.experienceLevel).toBe('beginner');
      expect(result.current.handicap).toBe(18);
    });
  });

  describe('États de chargement', () => {
    it('devrait indiquer le chargement pendant la récupération des données', () => {
      mockUseUserContext.mockReturnValue({
        updateProfile: jest.fn(),
        loading: true,
      });
      mockUseSessionContext.mockReturnValue({
        loading: false,
      });

      const { result } = renderHook(() => useUser());

      expect(result.current.loading).toBe(true);
    });

    it("devrait gérer les erreurs d'authentification", () => {
      mockUseSessionContext.mockReturnValue({
        loading: false,
        error: new Error('Not authenticated'),
      });

      const { result } = renderHook(() => useUser());

      expect(result.current.loading).toBe(false);
    });
  });

  describe('Propriétés calculées', () => {
    it('devrait calculer le nom complet', () => {
      const mockProfile = {
        first_name: 'John',
        last_name: 'Doe',
      };

      mockUseProfile.mockReturnValue(mockProfile);

      const { result } = renderHook(() => useUser());

      expect(result.current.fullName).toBe('John Doe');
    });

    it('devrait calculer les initiales', () => {
      const mockProfile = {
        first_name: 'John',
        last_name: 'Doe',
      };

      mockUseProfile.mockReturnValue(mockProfile);

      const { result } = renderHook(() => useUser());

      expect(result.current.initials).toBe('JD');
    });

    it("devrait retourner l'URL de l'avatar", () => {
      const mockProfile = {
        first_name: 'John',
        last_name: 'Doe',
        avatar_url: 'https://example.com/avatar.jpg',
      };

      mockUseProfile.mockReturnValue(mockProfile);

      const { result } = renderHook(() => useUser());

      expect(result.current.avatarUrl).toBe('https://example.com/avatar.jpg');
    });

    it('devrait retourner null pour hourlyRate (deprecated)', () => {
      const { result } = renderHook(() => useUser());

      expect(result.current.hourlyRate).toBeNull();
    });
  });
});
