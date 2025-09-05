/**
 * Tests d'intégration pour SessionContext avec Realtime
 * 
 * Teste l'intégration du hook useUserDeletionRealtime dans SessionContext
 * pour valider que la déconnexion automatique fonctionne correctement.
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
jest.mock('react-native/Libraries/Alert/Alert', () => ({
  alert: jest.fn(),
}));

// Mock console pour les tests
const mockConsoleLog = jest.spyOn(console, 'log').mockImplementation();
const mockConsoleError = jest.spyOn(console, 'error').mockImplementation();

describe('SessionContext avec Realtime', () => {
  let mockChannel: any;
  let mockSubscribe: jest.Mock;
  let mockOn: jest.Mock;
  let onDeleteHandler: (payload: any) => void;
  let onAuthStateChangeHandler: (event: string, session: any) => void;

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <SessionProvider>{children}</SessionProvider>
  );

  beforeEach(() => {
    jest.clearAllMocks();
    mockConsoleLog.mockClear();
    mockConsoleError.mockClear();

    // Setup mock channel pour Realtime
    mockSubscribe = jest.fn();
    mockOn = jest.fn().mockReturnThis();
    
    mockChannel = {
      on: mockOn,
      subscribe: mockSubscribe,
    };

    mockSupabase.channel = jest.fn().mockReturnValue(mockChannel);
    mockSupabase.removeChannel = jest.fn();

    // Setup mocks pour auth
    mockSupabase.auth = {
      getSession: jest.fn().mockResolvedValue({
        data: { session: null }
      }),
      onAuthStateChange: jest.fn().mockReturnValue({
        data: { subscription: { unsubscribe: jest.fn() } }
      }),
      signOut: jest.fn().mockResolvedValue({ error: null }),
    } as any;

    // Setup Supabase query mocks pour la validation proactive
    const mockFrom = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      maybeSingle: jest.fn().mockResolvedValue({ data: { id: 'user-123' }, error: null }),
    };

    mockSupabase.from = jest.fn().mockReturnValue(mockFrom);

    // Capturer les handlers pour simuler les événements
    mockOn.mockImplementation((event, config, handler) => {
      if (event === 'postgres_changes' && config.event === 'DELETE') {
        onDeleteHandler = handler;
      }
      return mockChannel;
    });

    (mockSupabase.auth.onAuthStateChange as jest.Mock).mockImplementation((handler) => {
      onAuthStateChangeHandler = handler;
      return { data: { subscription: { unsubscribe: jest.fn() } } };
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Intégration de base', () => {
    it('ne devrait pas activer Realtime sans session utilisateur', () => {
      renderHook(() => useSessionContext(), { wrapper });

      // Pas de session = pas de subscription Realtime
      expect(mockSupabase.channel).not.toHaveBeenCalled();
    });

    it('devrait activer Realtime quand l\'utilisateur se connecte', async () => {
      const { result } = renderHook(() => useSessionContext(), { wrapper });

      // Simuler connexion utilisateur
      const mockSession = {
        user: { id: 'user-123' },
        access_token: 'token'
      };

      await act(async () => {
        onAuthStateChangeHandler('SIGNED_IN', mockSession);
      });

      await waitFor(() => {
        expect(mockSupabase.channel).toHaveBeenCalledWith(
          expect.stringContaining('user-deletion-user-123')
        );
      });
    });
  });

  describe('Déconnexion automatique via Realtime', () => {
    it('devrait déconnecter l\'utilisateur lors de suppression de profil', async () => {
      const { result } = renderHook(() => useSessionContext(), { wrapper });

      // 1. Simuler utilisateur connecté
      const mockSession = {
        user: { id: 'user-123' },
        access_token: 'token'
      };

      await act(async () => {
        onAuthStateChangeHandler('SIGNED_IN', mockSession);
      });

      // Attendre que Realtime soit configuré
      await waitFor(() => {
        expect(mockSupabase.channel).toHaveBeenCalled();
      });

      // 2. Simuler suppression du profil via admin
      const deletePayload = {
        old: { id: 'user-123', first_name: 'John' },
        new: null
      };

      await act(async () => {
        await onDeleteHandler(deletePayload);
      });

      // 3. Vérifier que signOut a été appelé
      expect(mockSupabase.auth.signOut).toHaveBeenCalledTimes(1);
      expect(mockConsoleLog).toHaveBeenCalledWith(
        '🚨 Realtime SessionContext: Utilisateur supprimé détecté, déconnexion...'
      );
      expect(mockConsoleLog).toHaveBeenCalledWith(
        '✅ Realtime SessionContext: Déconnexion réussie via signOut()'
      );
    });

    it('devrait nettoyer la session même si signOut échoue', async () => {
      const { result } = renderHook(() => useSessionContext(), { wrapper });

      // Simuler utilisateur connecté
      const mockSession = {
        user: { id: 'user-123' },
        access_token: 'token'
      };

      await act(async () => {
        onAuthStateChangeHandler('SIGNED_IN', mockSession);
      });

      // Simuler erreur lors de signOut
      (mockSupabase.auth.signOut as jest.Mock).mockRejectedValue(
        new Error('Erreur réseau')
      );

      // Simuler suppression du profil
      const deletePayload = {
        old: { id: 'user-123' },
        new: null
      };

      await act(async () => {
        await onDeleteHandler(deletePayload);
      });

      // Vérifier que le fallback a fonctionné
      expect(mockConsoleError).toHaveBeenCalledWith(
        '❌ Realtime SessionContext: Erreur lors de signOut():',
        expect.any(Error)
      );
      expect(mockConsoleLog).toHaveBeenCalledWith(
        '✅ Realtime SessionContext: Session forcée à null (fallback)'
      );

      // La session devrait être nettoyée
      expect(result.current.session).toBeNull();
    });

    it('ne devrait pas réagir à la suppression d\'un autre utilisateur', async () => {
      renderHook(() => useSessionContext(), { wrapper });

      // Simuler utilisateur connecté
      const mockSession = {
        user: { id: 'user-123' },
        access_token: 'token'
      };

      await act(async () => {
        onAuthStateChangeHandler('SIGNED_IN', mockSession);
      });

      // Simuler suppression d'un autre utilisateur
      const deletePayload = {
        old: { id: 'user-456', first_name: 'Jane' },
        new: null
      };

      await act(async () => {
        await onDeleteHandler(deletePayload);
      });

      // signOut ne devrait pas être appelé
      expect(mockSupabase.auth.signOut).not.toHaveBeenCalled();
    });
  });

  describe('Cascade de déconnexion', () => {
    it('devrait déclencher onAuthStateChange après signOut', async () => {
      const { result } = renderHook(() => useSessionContext(), { wrapper });

      // 1. Simuler utilisateur connecté
      const mockSession = {
        user: { id: 'user-123' },
        access_token: 'token'
      };

      await act(async () => {
        onAuthStateChangeHandler('SIGNED_IN', mockSession);
      });

      // Vérifier que la session est définie
      expect(result.current.session).toEqual(mockSession);

      // 2. Simuler que signOut déclenche onAuthStateChange avec null
      (mockSupabase.auth.signOut as jest.Mock).mockImplementation(async () => {
        // Simuler l'événement SIGNED_OUT automatique
        onAuthStateChangeHandler('SIGNED_OUT', null);
        return { error: null };
      });

      // 3. Simuler suppression du profil
      const deletePayload = {
        old: { id: 'user-123' },
        new: null
      };

      await act(async () => {
        await onDeleteHandler(deletePayload);
      });

      // 4. Vérifier que la session a été nettoyée via onAuthStateChange
      expect(result.current.session).toBeNull();
    });
  });

  describe('Nettoyage des ressources', () => {
    it('devrait nettoyer Realtime lors du changement d\'utilisateur', async () => {
      renderHook(() => useSessionContext(), { wrapper });

      // Utilisateur 1 se connecte
      await act(async () => {
        onAuthStateChangeHandler('SIGNED_IN', {
          user: { id: 'user-123' },
          access_token: 'token1'
        });
      });

      expect(mockSupabase.channel).toHaveBeenCalledWith(
        expect.stringContaining('user-deletion-user-123')
      );

      // Utilisateur 2 se connecte (remplace le premier)
      await act(async () => {
        onAuthStateChangeHandler('SIGNED_IN', {
          user: { id: 'user-456' },
          access_token: 'token2'
        });
      });

      // Devrait nettoyer l'ancien channel et créer le nouveau
      expect(mockSupabase.removeChannel).toHaveBeenCalled();
      expect(mockSupabase.channel).toHaveBeenCalledWith(
        expect.stringContaining('user-deletion-user-456')
      );
    });

    it('devrait nettoyer Realtime lors de la déconnexion', async () => {
      renderHook(() => useSessionContext(), { wrapper });

      // Utilisateur se connecte
      await act(async () => {
        onAuthStateChangeHandler('SIGNED_IN', {
          user: { id: 'user-123' },
          access_token: 'token'
        });
      });

      // Utilisateur se déconnecte
      await act(async () => {
        onAuthStateChangeHandler('SIGNED_OUT', null);
      });

      // Le channel devrait être nettoyé
      expect(mockSupabase.removeChannel).toHaveBeenCalledWith(mockChannel);
    });
  });
});