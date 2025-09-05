/**
 * Tests unitaires pour SessionContext
 */
import React from 'react';
import { renderHook, waitFor } from '@testing-library/react-native';
import { SessionProvider, useSessionContext, useSession } from '@/contexts/SessionContext';
import { supabase } from '@/utils/supabase/client';

// Mock Supabase
jest.mock('@/utils/supabase/client');

describe('SessionContext', () => {
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <SessionProvider>{children}</SessionProvider>
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('État initial', () => {
    it('devrait initialiser avec loading true et session null', async () => {
      (supabase.auth.getSession as jest.Mock).mockResolvedValue({
        data: { session: null },
      });

      const { result } = renderHook(() => useSessionContext(), { wrapper });

      expect(result.current.loading).toBe(true);
      expect(result.current.session).toBeNull();
      expect(result.current.user).toBeNull();

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
    });
  });

  describe('Chargement de session', () => {
    it('devrait charger une session existante', async () => {
      const mockSession = {
        user: { id: 'user-1', email: 'test@example.com' },
        access_token: 'token',
      };

      (supabase.auth.getSession as jest.Mock).mockResolvedValue({
        data: { session: mockSession },
      });

      const { result } = renderHook(() => useSessionContext(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
        expect(result.current.session).toEqual(mockSession);
      });
    });
  });

  describe('Rafraîchissement de session', () => {
    it('devrait rafraîchir la session avec succès', async () => {
      const newSession = {
        user: { id: 'user-1', email: 'test@example.com' },
        access_token: 'new-token',
      };

      (supabase.auth.refreshSession as jest.Mock).mockResolvedValue({
        data: { session: newSession },
        error: null,
      });

      (supabase.auth.getSession as jest.Mock).mockResolvedValue({
        data: { session: null },
      });

      const { result } = renderHook(() => useSessionContext(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await result.current.refreshSession();

      expect(result.current.session).toEqual(newSession);
      expect(result.current.error).toBeNull();
    });

    it('devrait gérer les erreurs de rafraîchissement', async () => {
      const error = new Error('Network error');

      (supabase.auth.refreshSession as jest.Mock).mockResolvedValue({
        data: null,
        error,
      });

      (supabase.auth.getSession as jest.Mock).mockResolvedValue({
        data: { session: null },
      });

      const { result } = renderHook(() => useSessionContext(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await result.current.refreshSession();

      expect(result.current.error).toEqual(error);
    });
  });

  describe('Setters', () => {
    it('devrait permettre de définir la session', async () => {
      (supabase.auth.getSession as jest.Mock).mockResolvedValue({
        data: { session: null },
      });

      const { result } = renderHook(() => useSessionContext(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const newSession = {
        user: { id: 'user-2', email: 'new@example.com' },
        access_token: 'token-2',
      };

      result.current.setSession(newSession as any);

      expect(result.current.session).toEqual(newSession);
    });

    it("devrait permettre de définir l'utilisateur", async () => {
      (supabase.auth.getSession as jest.Mock).mockResolvedValue({
        data: { session: null },
      });

      const { result } = renderHook(() => useSessionContext(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const newUser = {
        id: 'user-3',
        email: 'user@example.com',
        profile: { first_name: 'John', last_name: 'Doe' },
      };

      result.current.setUser(newUser as any);

      expect(result.current.user).toEqual(newUser);
    });
  });

  describe('Hooks utilitaires', () => {
    it('useSession devrait retourner la session', async () => {
      const mockSession = {
        user: { id: 'user-1', email: 'test@example.com' },
        access_token: 'token',
      };

      (supabase.auth.getSession as jest.Mock).mockResolvedValue({
        data: { session: mockSession },
      });

      const { result } = renderHook(() => useSession(), { wrapper });

      await waitFor(() => {
        expect(result.current).toEqual(mockSession);
      });
    });
  });

  describe('Erreur si utilisé hors du provider', () => {
    it('devrait lever une erreur si useSessionContext est utilisé sans provider', () => {
      // Désactiver console.error temporairement
      const originalError = console.error;
      console.error = jest.fn();

      expect(() => {
        renderHook(() => useSessionContext());
      }).toThrow('useSessionContext must be used within a SessionProvider');

      console.error = originalError;
    });
  });
});
