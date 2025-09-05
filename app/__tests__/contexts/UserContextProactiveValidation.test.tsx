/**
 * Tests pour la validation proactive des utilisateurs supprimés dans UserContext
 * 
 * Teste la fonctionnalité de déconnexion automatique pour les utilisateurs
 * qui ont été supprimés par un administrateur AVANT l'activation du Realtime.
 */
import React from 'react';
import { renderHook, waitFor, act } from '@testing-library/react-native';
import { Alert } from 'react-native';
import { UserProvider, useUserContext } from '@/contexts/UserContext';
import { SessionProvider } from '@/contexts/SessionContext';
import { supabase } from '@/utils/supabase/client';

// Mock Supabase
jest.mock('@/utils/supabase/client');
const mockSupabase = supabase as jest.Mocked<typeof supabase>;

// Mock useAsyncOperation
jest.mock('@/hooks/useAsyncOperation', () => ({
  useAsyncOperation: () => ({
    loading: false,
    error: null,
    execute: jest.fn().mockImplementation((fn) => fn()),
  }),
}));

// Mock Alert uniquement
jest.mock('react-native/Libraries/Alert/Alert', () => ({
  alert: jest.fn(),
}));

// Mock console pour les tests
const mockConsoleWarn = jest.spyOn(console, 'warn').mockImplementation();
const mockConsoleLog = jest.spyOn(console, 'log').mockImplementation();
const mockConsoleError = jest.spyOn(console, 'error').mockImplementation();

describe('UserContext - Validation Proactive', () => {
  let mockSetUser: jest.Mock;

  const createWrapper = () => {
    return ({ children }: { children: React.ReactNode }) => (
      <SessionProvider>
        <UserProvider>{children}</UserProvider>
      </SessionProvider>
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockConsoleWarn.mockClear();
    mockConsoleLog.mockClear();
    mockConsoleError.mockClear();

    mockSetUser = jest.fn();

    // Setup Supabase auth mocks complets
    mockSupabase.auth = {
      getUser: jest.fn(),
      getSession: jest.fn().mockResolvedValue({
        data: { session: null }
      }),
      signOut: jest.fn(),
      onAuthStateChange: jest.fn().mockReturnValue({
        data: { subscription: { unsubscribe: jest.fn() } }
      }),
    } as any;

    // Setup Supabase query mocks
    const mockFrom = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      maybeSingle: jest.fn(),
      single: jest.fn(),
    };

    mockSupabase.from = jest.fn().mockReturnValue(mockFrom);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Cas retroactif - Utilisateur déjà supprimé', () => {
    it('devrait déconnecter automatiquement un utilisateur avec JWT valide mais profil supprimé', async () => {
      const { result } = renderHook(() => useUserContext(), {
        wrapper: createWrapper(),
      });

      // Mock : Profil supprimé (null) mais JWT encore valide
      (mockSupabase.from('profiles').select().eq().maybeSingle as jest.Mock)
        .mockResolvedValue({ 
          data: null, 
          error: null 
        });

      (mockSupabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { 
          user: { id: 'user-123', email: 'test@example.com' }
        }
      });

      (mockSupabase.auth.signOut as jest.Mock).mockResolvedValue({ error: null });

      // Déclencher le chargement du profil
      await act(async () => {
        const profile = await result.current.loadUserProfile('user-123');
        expect(profile).toBeNull();
      });

      // Vérifications de la déconnexion automatique
      expect(mockConsoleWarn).toHaveBeenCalledWith(
        '🚨 UserContext: Profil supprimé détecté, déconnexion automatique pour userId:', 
        'user-123'
      );

      expect(mockSupabase.auth.signOut).toHaveBeenCalledTimes(1);
      expect(mockSetUser).toHaveBeenCalledWith(null);

      expect(Alert.alert).toHaveBeenCalledWith(
        'Compte supprimé',
        'Votre compte a été supprimé par un administrateur. Vous avez été déconnecté.',
        [{ text: 'OK', style: 'default' }]
      );

      expect(mockConsoleLog).toHaveBeenCalledWith(
        '✅ UserContext: Déconnexion réussie pour utilisateur supprimé'
      );
    });

    it('devrait utiliser le fallback si signOut échoue', async () => {
      const { result } = renderHook(() => useUserContext(), {
        wrapper: createWrapper(),
      });

      // Mock : Profil supprimé
      (mockSupabase.from('profiles').select().eq().maybeSingle as jest.Mock)
        .mockResolvedValue({ 
          data: null, 
          error: null 
        });

      (mockSupabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { 
          user: { id: 'user-123' }
        }
      });

      // Mock : signOut échoue
      (mockSupabase.auth.signOut as jest.Mock).mockRejectedValue(
        new Error('Erreur réseau')
      );

      await act(async () => {
        const profile = await result.current.loadUserProfile('user-123');
        expect(profile).toBeNull();
      });

      // Vérifications du fallback
      expect(mockSupabase.auth.signOut).toHaveBeenCalledTimes(1);
      
      expect(mockConsoleError).toHaveBeenCalledWith(
        '❌ UserContext: Erreur lors de la déconnexion automatique:',
        expect.any(Error)
      );

      // Le fallback devrait quand même nettoyer l'état
      expect(mockSetUser).toHaveBeenCalledWith(null);
    });

    it('ne devrait pas déclencher la déconnexion si pas de JWT valide', async () => {
      const { result } = renderHook(() => useUserContext(), {
        wrapper: createWrapper(),
      });

      // Mock : Profil supprimé ET pas de JWT valide
      (mockSupabase.from('profiles').select().eq().maybeSingle as jest.Mock)
        .mockResolvedValue({ 
          data: null, 
          error: null 
        });

      (mockSupabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: null }
      });

      await act(async () => {
        const profile = await result.current.loadUserProfile('user-123');
        expect(profile).toBeNull();
      });

      // Pas de déconnexion déclenchée
      expect(mockSupabase.auth.signOut).not.toHaveBeenCalled();
      expect(Alert.alert).not.toHaveBeenCalled();
      expect(mockConsoleWarn).not.toHaveBeenCalled();
    });

    it('ne devrait pas déclencher la déconnexion si l\'ID utilisateur ne correspond pas', async () => {
      const { result } = renderHook(() => useUserContext(), {
        wrapper: createWrapper(),
      });

      // Mock : Profil supprimé pour user-123
      (mockSupabase.from('profiles').select().eq().maybeSingle as jest.Mock)
        .mockResolvedValue({ 
          data: null, 
          error: null 
        });

      // Mock : JWT pour un autre utilisateur
      (mockSupabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { 
          user: { id: 'user-456' }
        }
      });

      await act(async () => {
        const profile = await result.current.loadUserProfile('user-123');
        expect(profile).toBeNull();
      });

      // Pas de déconnexion déclenchée (IDs différents)
      expect(mockSupabase.auth.signOut).not.toHaveBeenCalled();
      expect(Alert.alert).not.toHaveBeenCalled();
    });
  });

  describe('Comportement normal avec profil existant', () => {
    it('ne devrait pas déclencher la validation si le profil existe', async () => {
      const { result } = renderHook(() => useUserContext(), {
        wrapper: createWrapper(),
      });

      // Mock : Profil existe normalement
      const mockProfile = {
        id: 'user-123',
        first_name: 'John',
        user_type: 'amateur'
      };

      (mockSupabase.from('profiles').select().eq().maybeSingle as jest.Mock)
        .mockResolvedValue({ 
          data: mockProfile, 
          error: null 
        });

      (mockSupabase.auth.getSession as jest.Mock).mockResolvedValue({
        data: { 
          session: { user: { id: 'user-123' } }
        }
      });

      await act(async () => {
        const profile = await result.current.loadUserProfile('user-123');
        expect(profile).not.toBeNull();
      });

      // Pas de validation de suppression déclenchée
      expect(mockConsoleWarn).not.toHaveBeenCalled();
      expect(mockSupabase.auth.signOut).not.toHaveBeenCalled();
      expect(Alert.alert).not.toHaveBeenCalled();
    });
  });

  describe('Intégration avec Realtime', () => {
    it('devrait fournir une expérience utilisateur cohérente avec Realtime', async () => {
      const { result } = renderHook(() => useUserContext(), {
        wrapper: createWrapper(),
      });

      // Mock : Utilisateur supprimé retroactivement
      (mockSupabase.from('profiles').select().eq().maybeSingle as jest.Mock)
        .mockResolvedValue({ data: null, error: null });

      (mockSupabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: { id: 'user-123' } }
      });

      (mockSupabase.auth.signOut as jest.Mock).mockResolvedValue({ error: null });

      await act(async () => {
        await result.current.loadUserProfile('user-123');
      });

      // Vérifier que l'alerte est identique à celle de Realtime
      expect(Alert.alert).toHaveBeenCalledWith(
        'Compte supprimé',
        'Votre compte a été supprimé par un administrateur. Vous avez été déconnecté.',
        [{ text: 'OK', style: 'default' }]
      );
    });
  });
});