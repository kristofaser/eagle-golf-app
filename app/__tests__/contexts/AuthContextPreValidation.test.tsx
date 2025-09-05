/**
 * Tests pour la validation pré-OTP dans AuthContext
 * 
 * Teste la nouvelle fonctionnalité qui empêche l'envoi d'OTP
 * pour des comptes inexistants ou supprimés.
 */
import React from 'react';
import { renderHook, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import { AuthProvider, useAuth } from '@/contexts/AuthContext.refactored';
import { SessionProvider } from '@/contexts/SessionContext';
import { UserProvider } from '@/contexts/UserContext';
import { supabase } from '@/utils/supabase/client';

// Mock Supabase
jest.mock('@/utils/supabase/client');
const mockSupabase = supabase as jest.Mocked<typeof supabase>;

// Mock Alert uniquement
const mockAlert = jest.fn();
jest.mock('react-native/Libraries/Alert/Alert', () => ({
  alert: mockAlert,
}));

// Mock useAsyncOperation
jest.mock('@/hooks/useAsyncOperation', () => ({
  useAsyncOperation: () => ({
    loading: false,
    error: null,
    execute: jest.fn().mockImplementation((fn) => fn()),
  }),
}));

// Mock console pour les tests
const mockConsoleLog = jest.spyOn(console, 'log').mockImplementation();
const mockConsoleWarn = jest.spyOn(console, 'warn').mockImplementation();
const mockConsoleError = jest.spyOn(console, 'error').mockImplementation();

describe('AuthContext - Validation Pré-OTP', () => {
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <SessionProvider>
      <UserProvider>
        <AuthProvider>{children}</AuthProvider>
      </UserProvider>
    </SessionProvider>
  );

  beforeEach(() => {
    jest.clearAllMocks();
    mockConsoleLog.mockClear();
    mockConsoleWarn.mockClear();
    mockConsoleError.mockClear();

    // Setup Supabase auth mocks
    mockSupabase.auth = {
      signInWithOtp: jest.fn(),
    } as any;

    // Setup Supabase query mocks
    const mockFrom = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      maybeSingle: jest.fn(),
    };

    mockSupabase.from = jest.fn().mockReturnValue(mockFrom);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Validation des comptes existants', () => {
    it('devrait bloquer la connexion pour un compte inexistant', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      // Mock : Aucun profil trouvé
      (mockSupabase.from('profiles').select().eq().maybeSingle as jest.Mock)
        .mockResolvedValue({ 
          data: null, 
          error: null 
        });

      // Tenter la connexion
      let error;
      try {
        await result.current.signIn('inexistant@example.com');
      } catch (e) {
        error = e;
      }

      // Vérifications
      expect(mockConsoleWarn).toHaveBeenCalledWith(
        '🚨 AuthContext: Aucun profil trouvé pour:', 'inexistant@example.com'
      );

      expect(error).toBeDefined();
      expect(error.message).toBe('Aucun compte trouvé avec cette adresse email. Vérifiez votre email ou créez un nouveau compte.');

      // OTP ne devrait pas être envoyé
      expect(mockSupabase.auth.signInWithOtp).not.toHaveBeenCalled();

      // Alerte d'erreur affichée
      expect(mockAlert).toHaveBeenCalledWith(
        'Erreur de connexion',
        'Aucun compte trouvé avec cette adresse email. Vérifiez votre email ou créez un nouveau compte.'
      );
    });

    it('devrait permettre la connexion pour un compte existant', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      // Mock : Profil existant trouvé
      (mockSupabase.from('profiles').select().eq().maybeSingle as jest.Mock)
        .mockResolvedValue({ 
          data: { 
            id: 'user-123', 
            email: 'existant@example.com' 
          }, 
          error: null 
        });

      // Mock : OTP envoyé avec succès
      (mockSupabase.auth.signInWithOtp as jest.Mock).mockResolvedValue({
        error: null
      });

      // Tenter la connexion
      const result_signin = await result.current.signIn('existant@example.com');

      // Vérifications
      expect(mockConsoleLog).toHaveBeenCalledWith(
        '✅ AuthContext: Profil trouvé pour:', 'existant@example.com', 'ID:', 'user-123'
      );

      expect(mockConsoleLog).toHaveBeenCalledWith(
        '✅ AuthContext: OTP envoyé avec succès pour:', 'existant@example.com'
      );

      // OTP devrait être envoyé
      expect(mockSupabase.auth.signInWithOtp).toHaveBeenCalledWith({
        email: 'existant@example.com',
        options: {
          shouldCreateUser: false,
        },
      });

      // Pas d'alerte d'erreur
      expect(mockAlert).not.toHaveBeenCalled();

      // Résultat correct
      expect(result_signin).toEqual({ email: 'existant@example.com' });
    });

    it('devrait continuer normalement en cas d\'erreur de validation réseau', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      // Mock : Erreur réseau lors de la vérification profil
      (mockSupabase.from('profiles').select().eq().maybeSingle as jest.Mock)
        .mockRejectedValue(new Error('Network error'));

      // Mock : OTP envoyé avec succès (fallback)
      (mockSupabase.auth.signInWithOtp as jest.Mock).mockResolvedValue({
        error: null
      });

      // Tenter la connexion
      const result_signin = await result.current.signIn('test@example.com');

      // Vérifications
      expect(mockConsoleWarn).toHaveBeenCalledWith(
        '⚠️ AuthContext: Impossible de valider le profil, continuant:',
        expect.any(Error)
      );

      // OTP devrait être envoyé quand même (fallback)
      expect(mockSupabase.auth.signInWithOtp).toHaveBeenCalled();

      // Résultat correct
      expect(result_signin).toEqual({ email: 'test@example.com' });
    });
  });

  describe('Gestion des erreurs Supabase améliorée', () => {
    it('devrait personnaliser le message pour rate limiting', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      // Mock : Profil existant
      (mockSupabase.from('profiles').select().eq().maybeSingle as jest.Mock)
        .mockResolvedValue({ 
          data: { id: 'user-123', email: 'test@example.com' }, 
          error: null 
        });

      // Mock : Erreur de rate limiting
      (mockSupabase.auth.signInWithOtp as jest.Mock).mockResolvedValue({
        error: { 
          message: 'rate limit exceeded',
          status: 429 
        }
      });

      // Tenter la connexion
      let error;
      try {
        await result.current.signIn('test@example.com');
      } catch (e) {
        error = e;
      }

      // Vérification du message personnalisé
      expect(error.message).toBe('Trop de tentatives. Veuillez attendre quelques minutes avant de réessayer.');
    });
  });
});