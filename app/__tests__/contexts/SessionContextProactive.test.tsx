/**
 * Tests pour la validation proactive dans SessionContext
 * 
 * Teste la nouvelle fonctionnalité de déconnexion automatique au startup
 * quand un utilisateur supprimé tente de se reconnecter.
 */
import React from 'react';
import { renderHook, waitFor, act } from '@testing-library/react-native';
import { Alert } from 'react-native';
import { SessionProvider, useSessionContext } from '@/contexts/SessionContext';
import { supabase } from '@/utils/supabase/client';

// Mock Supabase
jest.mock('@/utils/supabase/client');
const mockSupabase = supabase as jest.Mocked<typeof supabase>;

// Mock Alert uniquement
const mockAlert = jest.fn();
jest.mock('react-native/Libraries/Alert/Alert', () => ({
  alert: mockAlert,
}));

// Mock console pour les tests
const mockConsoleWarn = jest.spyOn(console, 'warn').mockImplementation();
const mockConsoleLog = jest.spyOn(console, 'log').mockImplementation();
const mockConsoleError = jest.spyOn(console, 'error').mockImplementation();

// Mock useUserDeletionRealtime pour éviter les conflits
jest.mock('@/hooks/useUserDeletionRealtime', () => ({
  useUserDeletionRealtime: jest.fn().mockReturnValue({
    isActive: false,
    isSubscribed: false,
    reconnect: jest.fn(),
  }),
}));

describe('SessionContext - Validation Proactive', () => {
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <SessionProvider>{children}</SessionProvider>
  );

  beforeEach(() => {
    jest.clearAllMocks();
    mockConsoleWarn.mockClear();
    mockConsoleLog.mockClear();
    mockConsoleError.mockClear();

    // Setup mocks complets pour Supabase
    mockSupabase.auth = {
      getSession: jest.fn(),
      onAuthStateChange: jest.fn().mockReturnValue({
        data: { subscription: { unsubscribe: jest.fn() } }
      }),
      signOut: jest.fn().mockResolvedValue({ error: null }),
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

  describe('Validation au démarrage', () => {
    it('devrait déconnecter un utilisateur supprimé au startup', async () => {
      // Mock : Session avec JWT valide mais profil supprimé
      (mockSupabase.auth.getSession as jest.Mock).mockResolvedValue({
        data: { 
          session: { 
            user: { id: 'user-123' },
            access_token: 'valid-jwt-token'
          }
        }
      });

      // Mock : Profil n'existe plus (supprimé par admin)
      (mockSupabase.from('profiles').select().eq().maybeSingle as jest.Mock)
        .mockResolvedValue({ 
          data: null, // Profil supprimé
          error: null 
        });

      // Mock : signOut réussi
      (mockSupabase.auth.signOut as jest.Mock).mockResolvedValue({ error: null });

      // Render le hook
      const { result } = renderHook(() => useSessionContext(), { wrapper });

      // Attendre que l'effet se déclenche
      await waitFor(() => {
        expect(mockSupabase.from).toHaveBeenCalledWith('profiles');
      });

      await waitFor(() => {
        expect(mockConsoleWarn).toHaveBeenCalledWith(
          '🚨 SessionContext: Utilisateur supprimé détecté au startup, déconnexion automatique'
        );
      });

      // Vérifier que signOut a été appelé
      expect(mockSupabase.auth.signOut).toHaveBeenCalledTimes(1);

      // Vérifier que l'alerte a été affichée
      expect(mockAlert).toHaveBeenCalledWith(
        'Compte supprimé',
        'Votre compte a été supprimé par un administrateur. Vous avez été déconnecté.',
        [{ text: 'OK', style: 'default' }]
      );

      expect(mockConsoleLog).toHaveBeenCalledWith(
        '✅ SessionContext: Déconnexion proactive réussie'
      );
    });

    it('devrait utiliser le fallback si signOut échoue', async () => {
      // Mock : Session avec JWT valide mais profil supprimé
      (mockSupabase.auth.getSession as jest.Mock).mockResolvedValue({
        data: { 
          session: { 
            user: { id: 'user-123' }
          }
        }
      });

      // Mock : Profil n'existe plus
      (mockSupabase.from('profiles').select().eq().maybeSingle as jest.Mock)
        .mockResolvedValue({ data: null, error: null });

      // Mock : signOut échoue
      (mockSupabase.auth.signOut as jest.Mock).mockRejectedValue(
        new Error('Erreur réseau')
      );

      const { result } = renderHook(() => useSessionContext(), { wrapper });

      // Attendre le traitement
      await waitFor(() => {
        expect(mockSupabase.auth.signOut).toHaveBeenCalledTimes(1);
      });

      await waitFor(() => {
        expect(mockConsoleError).toHaveBeenCalledWith(
          '❌ SessionContext: Erreur lors de signOut proactif:',
          expect.any(Error)
        );
      });

      // Vérifier que la session est quand même nettoyée (fallback)
      expect(result.current.session).toBeNull();
    });

    it('ne devrait pas déclencher la validation si pas de session', async () => {
      // Mock : Pas de session
      (mockSupabase.auth.getSession as jest.Mock).mockResolvedValue({
        data: { session: null }
      });

      renderHook(() => useSessionContext(), { wrapper });

      await waitFor(() => {
        expect(mockSupabase.auth.getSession).toHaveBeenCalled();
      });

      // Pas de validation de profil déclenchée
      expect(mockSupabase.from).not.toHaveBeenCalled();
      expect(mockSupabase.auth.signOut).not.toHaveBeenCalled();
    });

    it('devrait continuer normalement si le profil existe', async () => {
      // Mock : Session avec profil existant
      (mockSupabase.auth.getSession as jest.Mock).mockResolvedValue({
        data: { 
          session: { 
            user: { id: 'user-123' }
          }
        }
      });

      // Mock : Profil existe
      (mockSupabase.from('profiles').select().eq().maybeSingle as jest.Mock)
        .mockResolvedValue({ 
          data: { id: 'user-123', first_name: 'John' }, 
          error: null 
        });

      const { result } = renderHook(() => useSessionContext(), { wrapper });

      await waitFor(() => {
        expect(mockSupabase.from).toHaveBeenCalledWith('profiles');
      });

      // Session maintenue normalement
      expect(result.current.session).not.toBeNull();
      expect(mockSupabase.auth.signOut).not.toHaveBeenCalled();
      expect(mockAlert).not.toHaveBeenCalled();
    });
  });
});