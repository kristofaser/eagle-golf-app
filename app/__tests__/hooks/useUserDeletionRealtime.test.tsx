/**
 * Tests unitaires pour useUserDeletionRealtime
 * 
 * Teste toutes les fonctionnalités du hook de déconnexion automatique
 * en cas de suppression d'utilisateur par un administrateur.
 */
import React from 'react';
import { renderHook, waitFor, act } from '@testing-library/react-native';
import { Alert } from 'react-native';
import { useUserDeletionRealtime, useUserDeletionRealtimeSimple } from '@/hooks/useUserDeletionRealtime';
import { supabase } from '@/utils/supabase/client';

// Mock Supabase
jest.mock('@/utils/supabase/client');
const mockSupabase = supabase as jest.Mocked<typeof supabase>;

// Mock Alert uniquement
jest.mock('react-native/Libraries/Alert/Alert', () => ({
  alert: jest.fn(),
}));
const mockAlert = Alert.alert as jest.Mock;

// Mock console pour les tests
const mockConsoleLog = jest.spyOn(console, 'log').mockImplementation();
const mockConsoleError = jest.spyOn(console, 'error').mockImplementation();
const mockConsoleWarn = jest.spyOn(console, 'warn').mockImplementation();

describe('useUserDeletionRealtime', () => {
  let mockChannel: any;
  let mockSubscribe: jest.Mock;
  let mockOn: jest.Mock;
  let onDeleteHandler: (payload: any) => void;

  beforeEach(() => {
    jest.clearAllMocks();
    mockConsoleLog.mockClear();
    mockConsoleError.mockClear();
    mockConsoleWarn.mockClear();

    // Setup mock channel
    mockSubscribe = jest.fn();
    mockOn = jest.fn().mockReturnThis();
    
    mockChannel = {
      on: mockOn,
      subscribe: mockSubscribe,
    };

    mockSupabase.channel = jest.fn().mockReturnValue(mockChannel);
    mockSupabase.removeChannel = jest.fn();

    // Capturer le handler DELETE pour simuler les événements
    mockOn.mockImplementation((event, config, handler) => {
      if (event === 'postgres_changes' && config.event === 'DELETE') {
        onDeleteHandler = handler;
      }
      return mockChannel;
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Hook basique', () => {
    it('devrait initialiser correctement avec un userId', () => {
      const { result } = renderHook(() => 
        useUserDeletionRealtime('user-123', { debug: false })
      );

      expect(result.current.isActive).toBe(true);
      expect(mockSupabase.channel).toHaveBeenCalledWith(
        expect.stringContaining('user-deletion-user-123')
      );
    });

    it('ne devrait pas s\'abonner sans userId', () => {
      const { result } = renderHook(() => 
        useUserDeletionRealtime(null, { debug: true })
      );

      expect(result.current.isActive).toBe(false);
      expect(mockSupabase.channel).not.toHaveBeenCalled();
      expect(mockConsoleLog).toHaveBeenCalledWith(
        '⏭️ Realtime User Deletion: Pas d\'userId, skip subscription'
      );
    });

    it('devrait nettoyer la subscription au démontage', () => {
      const { unmount } = renderHook(() => 
        useUserDeletionRealtime('user-123')
      );

      unmount();

      expect(mockSupabase.removeChannel).toHaveBeenCalledWith(mockChannel);
    });
  });

  describe('Configuration du channel Realtime', () => {
    it('devrait configurer le channel avec les bons paramètres', () => {
      renderHook(() => useUserDeletionRealtime('user-123'));

      expect(mockSupabase.channel).toHaveBeenCalledWith(
        expect.stringContaining('user-deletion-user-123')
      );

      expect(mockOn).toHaveBeenCalledWith(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public', 
          table: 'profiles',
          filter: 'id=eq.user-123'
        },
        expect.any(Function)
      );

      expect(mockChannel.subscribe).toHaveBeenCalledWith(expect.any(Function));
    });

    it('devrait gérer les différents statuts de subscription', () => {
      renderHook(() => useUserDeletionRealtime('user-123', { debug: true }));

      const statusCallback = mockSubscribe.mock.calls[0][0];

      // Test statut SUBSCRIBED
      act(() => {
        statusCallback('SUBSCRIBED');
      });
      expect(mockConsoleLog).toHaveBeenCalledWith(
        '🔗 Realtime User Deletion: Statut subscription:', 'SUBSCRIBED'
      );

      // Test statut CHANNEL_ERROR
      act(() => {
        statusCallback('CHANNEL_ERROR');
      });
      expect(mockConsoleError).toHaveBeenCalledWith(
        '❌ Realtime User Deletion: Erreur de channel'
      );

      // Test statut TIMED_OUT
      act(() => {
        statusCallback('TIMED_OUT');
      });
      expect(mockConsoleWarn).toHaveBeenCalledWith(
        '⏰ Realtime User Deletion: Timeout de connexion'
      );
    });
  });

  describe('Gestion des événements DELETE', () => {
    let mockCallback: jest.Mock;

    beforeEach(() => {
      mockCallback = jest.fn();
    });

    it('devrait déclencher onUserDeleted quand le bon utilisateur est supprimé', async () => {
      renderHook(() => 
        useUserDeletionRealtime('user-123', { 
          onUserDeleted: mockCallback,
          showAlert: false
        })
      );

      // Simuler la suppression du profil
      const deletePayload = {
        old: { id: 'user-123', first_name: 'John' },
        new: null
      };

      await act(async () => {
        await onDeleteHandler(deletePayload);
      });

      expect(mockCallback).toHaveBeenCalledTimes(1);
    });

    it('ne devrait pas réagir à la suppression d\'un autre utilisateur', async () => {
      renderHook(() => 
        useUserDeletionRealtime('user-123', { 
          onUserDeleted: mockCallback,
          debug: true
        })
      );

      // Simuler la suppression d'un autre utilisateur  
      const deletePayload = {
        old: { id: 'user-456', first_name: 'Jane' },
        new: null
      };

      await act(async () => {
        await onDeleteHandler(deletePayload);
      });

      expect(mockCallback).not.toHaveBeenCalled();
      expect(mockConsoleLog).toHaveBeenCalledWith(
        '⏭️ Realtime User Deletion: Utilisateur différent ignoré',
        expect.objectContaining({
          deletedId: 'user-456',
          currentUserId: 'user-123'
        })
      );
    });

    it('devrait afficher une alerte par défaut', async () => {
      renderHook(() => 
        useUserDeletionRealtime('user-123', { 
          onUserDeleted: mockCallback
        })
      );

      const deletePayload = {
        old: { id: 'user-123' },
        new: null
      };

      await act(async () => {
        await onDeleteHandler(deletePayload);
      });

      expect(mockAlert).toHaveBeenCalledWith(
        'Compte supprimé',
        'Votre compte a été supprimé par un administrateur. Vous avez été déconnecté.',
        expect.arrayContaining([
          expect.objectContaining({
            text: 'OK',
            style: 'default'
          })
        ])
      );
    });

    it('devrait permettre de personnaliser le message', async () => {
      const customMessage = 'Message personnalisé de suppression';
      
      renderHook(() => 
        useUserDeletionRealtime('user-123', { 
          onUserDeleted: mockCallback,
          deletionMessage: customMessage
        })
      );

      const deletePayload = {
        old: { id: 'user-123' },
        new: null
      };

      await act(async () => {
        await onDeleteHandler(deletePayload);
      });

      expect(mockAlert).toHaveBeenCalledWith(
        'Compte supprimé',
        customMessage,
        expect.any(Array)
      );
    });

    it('devrait pouvoir désactiver l\'alerte', async () => {
      renderHook(() => 
        useUserDeletionRealtime('user-123', { 
          onUserDeleted: mockCallback,
          showAlert: false
        })
      );

      const deletePayload = {
        old: { id: 'user-123' },
        new: null
      };

      await act(async () => {
        await onDeleteHandler(deletePayload);
      });

      expect(mockAlert).not.toHaveBeenCalled();
      expect(mockCallback).toHaveBeenCalled();
    });
  });

  describe('Gestion d\'erreur', () => {
    it('devrait gérer les erreurs dans onUserDeleted', async () => {
      const failingCallback = jest.fn().mockRejectedValue(new Error('Erreur test'));

      renderHook(() => 
        useUserDeletionRealtime('user-123', { 
          onUserDeleted: failingCallback,
          showAlert: false,
          debug: true
        })
      );

      const deletePayload = {
        old: { id: 'user-123' },
        new: null
      };

      await act(async () => {
        await onDeleteHandler(deletePayload);
      });

      expect(failingCallback).toHaveBeenCalled();
      expect(mockConsoleError).toHaveBeenCalledWith(
        '❌ Realtime User Deletion: Erreur lors du traitement:',
        expect.any(Error)
      );
    });

    it('devrait essayer le callback même après une erreur', async () => {
      const errorCallback = jest.fn().mockImplementation(() => {
        throw new Error('Erreur première tentative');
      });

      renderHook(() => 
        useUserDeletionRealtime('user-123', { 
          onUserDeleted: errorCallback,
          showAlert: false
        })
      );

      const deletePayload = {
        old: { id: 'user-123' },
        new: null
      };

      await act(async () => {
        await onDeleteHandler(deletePayload);
      });

      // Le callback devrait être appelé deux fois (tentative + fallback)
      expect(errorCallback).toHaveBeenCalledTimes(2);
    });
  });

  describe('Fonctionnalités avancées', () => {
    it('devrait permettre la reconnexion manuelle', () => {
      const { result } = renderHook(() => 
        useUserDeletionRealtime('user-123', { debug: true })
      );

      act(() => {
        result.current.reconnect();
      });

      expect(mockSupabase.removeChannel).toHaveBeenCalledWith(mockChannel);
      expect(mockConsoleLog).toHaveBeenCalledWith(
        '🔄 Realtime User Deletion: Reconnexion forcée demandée'
      );
    });

    it('devrait éviter les subscriptions multiples', () => {
      const { rerender } = renderHook(
        ({ userId }) => useUserDeletionRealtime(userId, { debug: true }),
        { initialProps: { userId: 'user-123' } }
      );

      // Premier rendu - subscription créée
      expect(mockSupabase.channel).toHaveBeenCalledTimes(1);

      // Même userId - pas de nouvelle subscription
      rerender({ userId: 'user-123' });
      expect(mockSupabase.channel).toHaveBeenCalledTimes(1);
      expect(mockConsoleLog).toHaveBeenCalledWith(
        '⏭️ Realtime User Deletion: Subscription déjà active'
      );
    });
  });

  describe('Hook simplifié', () => {
    it('devrait fonctionner avec les options par défaut', () => {
      const mockCallback = jest.fn();
      
      const { result } = renderHook(() => 
        useUserDeletionRealtimeSimple('user-123', mockCallback)
      );

      expect(result.current.isActive).toBe(true);
      expect(mockSupabase.channel).toHaveBeenCalled();
    });

    it('devrait activer le debug en mode développement', () => {
      // Simuler mode développement
      const originalDev = (global as any).__DEV__;
      (global as any).__DEV__ = true;

      renderHook(() => 
        useUserDeletionRealtimeSimple('user-123', jest.fn())
      );

      expect(mockConsoleLog).toHaveBeenCalledWith(
        '🔗 Realtime User Deletion: Connexion pour userId:', 'user-123'
      );

      // Restaurer
      (global as any).__DEV__ = originalDev;
    });
  });
});