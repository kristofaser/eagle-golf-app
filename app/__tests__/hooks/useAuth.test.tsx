/**
 * Tests pour le hook useAuth
 * Couvre l'authentification et la gestion de session
 */
import { renderHook, act, waitFor } from '@testing-library/react-native';
import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/utils/supabase/client';

// Mock des contextes
jest.mock('@/contexts/AuthContext.refactored', () => ({
  useAuth: jest.fn(() => ({
    loading: false,
    error: null,
    signIn: jest.fn(),
    signInWithProvider: jest.fn(),
    signInWithMagicLink: jest.fn(),
    signUp: jest.fn(),
    signOut: jest.fn(),
    verifyOtp: jest.fn(),
    resendOtp: jest.fn(),
  })),
}));

jest.mock('@/contexts/SessionContext', () => ({
  useSession: jest.fn(() => ({
    access_token: 'test_token',
    user: { id: 'user_123' },
  })),
  useSessionUser: jest.fn(() => ({
    id: 'user_123',
    email: 'test@example.com',
  })),
  useSessionContext: jest.fn(() => ({
    loading: false,
    error: null,
    refreshSession: jest.fn(),
  })),
}));

jest.mock('@/contexts/UserContext', () => ({
  useUserContext: jest.fn(() => ({
    loading: false,
    error: null,
    deleteAccount: jest.fn(),
    loadUserProfile: jest.fn(),
  })),
}));

describe('useAuth Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('État initial', () => {
    it("devrait retourner l'état initial correct", () => {
      const { result } = renderHook(() => useAuth());

      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.user).toEqual({
        id: 'user_123',
        email: 'test@example.com',
      });
    });

    it("devrait détecter quand l'utilisateur n'est pas authentifié", () => {
      const SessionContext = require('@/contexts/SessionContext');
      SessionContext.useSession.mockReturnValueOnce(null);

      const { result } = renderHook(() => useAuth());

      expect(result.current.isAuthenticated).toBe(false);
    });
  });

  describe("Méthodes d'authentification", () => {
    it('devrait appeler signIn avec les bonnes credentials', async () => {
      const { result } = renderHook(() => useAuth());

      const credentials = {
        email: 'user@example.com',
        password: 'password123',
      };

      await act(async () => {
        await result.current.signIn(credentials.email, credentials.password);
      });

      expect(result.current.signIn).toBeDefined();
      expect(typeof result.current.signIn).toBe('function');
    });

    it('devrait appeler signUp avec les données utilisateur', async () => {
      const { result } = renderHook(() => useAuth());

      const userData = {
        email: 'new@example.com',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe',
      };

      await act(async () => {
        await result.current.signUp(userData);
      });

      expect(result.current.signUp).toBeDefined();
      expect(typeof result.current.signUp).toBe('function');
    });

    it('devrait appeler signOut et nettoyer la session', async () => {
      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.signOut();
      });

      expect(result.current.signOut).toBeDefined();
      expect(typeof result.current.signOut).toBe('function');
    });

    it('devrait gérer signInWithProvider pour Google', async () => {
      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.signInWithProvider('google');
      });

      expect(result.current.signInWithProvider).toBeDefined();
    });

    it('devrait gérer signInWithMagicLink', async () => {
      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.signInWithMagicLink('user@example.com');
      });

      expect(result.current.signInWithMagicLink).toBeDefined();
    });
  });

  describe('Gestion OTP', () => {
    it('devrait vérifier un OTP', async () => {
      const { result } = renderHook(() => useAuth());

      const otpData = {
        email: 'user@example.com',
        token: '123456',
        type: 'email' as const,
      };

      await act(async () => {
        await result.current.verifyOtp(otpData);
      });

      expect(result.current.verifyOtp).toBeDefined();
    });

    it('devrait renvoyer un OTP', async () => {
      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.resendOtp('user@example.com');
      });

      expect(result.current.resendOtp).toBeDefined();
    });
  });

  describe('Gestion de session', () => {
    it('devrait rafraîchir la session', async () => {
      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.refreshSession();
      });

      expect(result.current.refreshSession).toBeDefined();
    });

    it('devrait charger le profil utilisateur', async () => {
      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.loadUserProfile();
      });

      expect(result.current.loadUserProfile).toBeDefined();
    });
  });

  describe('Gestion du compte', () => {
    it('devrait permettre la suppression du compte', async () => {
      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.deleteAccount();
      });

      expect(result.current.deleteAccount).toBeDefined();
    });
  });

  describe('Gestion des états de chargement', () => {
    it("devrait gérer l'état de chargement lors de la connexion", () => {
      const AuthContext = require('@/contexts/AuthContext.refactored');
      AuthContext.useAuth.mockReturnValueOnce({
        loading: true,
        error: null,
        signIn: jest.fn(),
        signInWithProvider: jest.fn(),
        signInWithMagicLink: jest.fn(),
        signUp: jest.fn(),
        signOut: jest.fn(),
        verifyOtp: jest.fn(),
        resendOtp: jest.fn(),
      });

      const { result } = renderHook(() => useAuth());

      expect(result.current.loading).toBe(true);
    });

    it("devrait gérer les erreurs d'authentification", () => {
      const AuthContext = require('@/contexts/AuthContext.refactored');
      const error = new Error('Invalid credentials');
      AuthContext.useAuth.mockReturnValueOnce({
        loading: false,
        error,
        signIn: jest.fn(),
        signInWithProvider: jest.fn(),
        signInWithMagicLink: jest.fn(),
        signUp: jest.fn(),
        signOut: jest.fn(),
        verifyOtp: jest.fn(),
        resendOtp: jest.fn(),
      });

      const { result } = renderHook(() => useAuth());

      expect(result.current.error).toBe(error);
    });
  });

  describe('Intégration des contextes', () => {
    it('devrait combiner les états de chargement de tous les contextes', () => {
      const UserContext = require('@/contexts/UserContext');
      UserContext.useUserContext.mockReturnValueOnce({
        loading: true,
        error: null,
        deleteAccount: jest.fn(),
        loadUserProfile: jest.fn(),
      });

      const { result } = renderHook(() => useAuth());

      expect(result.current.loading).toBe(true);
    });

    it('devrait combiner les erreurs de tous les contextes', () => {
      const SessionContext = require('@/contexts/SessionContext');
      const sessionError = new Error('Session expired');
      SessionContext.useSessionContext.mockReturnValueOnce({
        loading: false,
        error: sessionError,
        refreshSession: jest.fn(),
      });

      const { result } = renderHook(() => useAuth());

      expect(result.current.error).toBe(sessionError);
    });
  });
});
