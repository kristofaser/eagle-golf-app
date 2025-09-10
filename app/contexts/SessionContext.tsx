/**
 * SessionContext - Gestion de la session et des tokens
 * Responsabilités : État session, rafraîchissement, listener auth state, déconnexion automatique
 */
import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session } from '@supabase/supabase-js';
import { Alert } from 'react-native';
import { supabase } from '@/utils/supabase/client';
import { AuthUser } from '@/utils/supabase/auth.types';
import { useUserDeletionRealtime } from '@/hooks/useUserDeletionRealtime';

interface SessionState {
  session: Session | null;
  user: AuthUser | null;
  loading: boolean;
  error: Error | null;
}

interface SessionContextValue extends SessionState {
  refreshSession: () => Promise<void>;
  setSession: (session: Session | null) => void;
  setUser: (user: AuthUser | null) => void;
}

const SessionContext = createContext<SessionContextValue | undefined>(undefined);

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<SessionState>({
    session: null,
    user: null,
    loading: true,
    error: null,
  });

  // 🚨 NOUVEAU : Écoute Realtime pour déconnexion automatique si utilisateur supprimé
  // Flag de sécurité pour désactiver en cas de problème
  // ⚠️ DÉSACTIVÉ TEMPORAIREMENT : Realtime n'est pas activé sur la table profiles dans Supabase
  const ENABLE_REALTIME_DELETION = false; // !process.env.JEST_WORKER_ID && process.env.NODE_ENV !== 'test';
  
  // Utiliser le hook correctement (toujours appelé, mais avec userId conditionnel)
  useUserDeletionRealtime(
    ENABLE_REALTIME_DELETION ? state.session?.user?.id : null,
    {
      debug: false, // Désactiver les logs verbose
      onUserDeleted: async () => {
        console.log('🚨 Realtime SessionContext: Utilisateur supprimé détecté, déconnexion...');
        
        try {
          // ✅ SÉCURISÉ : Utilise la méthode existante bien testée
          await supabase.auth.signOut();
          console.log('✅ Realtime SessionContext: Déconnexion réussie via signOut()');
          
          // Le reste se fera automatiquement via onAuthStateChange ci-dessous
          // qui va déclencher setState avec session: null
          
        } catch (error) {
          console.error('❌ Realtime SessionContext: Erreur lors de signOut():', error);
          
          // 🔄 FALLBACK : Forcer le nettoyage de session même en cas d'erreur
          setState(prev => ({
            ...prev,
            session: null,
            user: null,
            error: null,
            loading: false,
          }));
          
          console.log('✅ Realtime SessionContext: Session forcée à null (fallback)');
        }
      }
    }
  );

  // Initialiser et écouter les changements de session
  useEffect(() => {
    // Récupérer la session initiale
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      // 🚨 VALIDATION PROACTIVE : Vérifier si l'utilisateur existe encore
      if (session?.user?.id) {
        try {
          const { data: profile, error } = await supabase
            .from('profiles')
            .select('id')
            .eq('id', session.user.id)
            .maybeSingle();

          if (!profile && !error) {
            // Profil supprimé mais JWT encore valide → Déconnexion automatique
            console.warn('🚨 SessionContext: Utilisateur supprimé détecté au startup, déconnexion automatique');
            
            try {
              // Afficher l'alerte cohérente avec Realtime
              Alert.alert(
                'Compte supprimé',
                'Votre compte a été supprimé par un administrateur. Vous avez été déconnecté.',
                [{ text: 'OK', style: 'default' }]
              );
            } catch (alertError) {
              console.warn('⚠️ SessionContext: Alert non disponible, continuant la déconnexion');
            }
            
            try {
              await supabase.auth.signOut();
              console.log('✅ SessionContext: Déconnexion proactive réussie');
              // L'état sera mis à jour via onAuthStateChange ci-dessous
              return; // Pas besoin de setState ici
            } catch (signOutError) {
              console.error('❌ SessionContext: Erreur lors de signOut proactif:', signOutError);
              // Fallback : forcer la session à null
              setState((prev) => ({
                ...prev,
                session: null,
                loading: false,
              }));
              return;
            }
          }
        } catch (profileError) {
          console.error('⚠️ SessionContext: Erreur lors de la validation proactive:', profileError);
          // Continuer avec la session existante en cas d'erreur réseau
        }
      }

      // Session normale
      setState((prev) => ({
        ...prev,
        session,
        loading: false,
      }));
    });

    // Écouter les changements d'état d'authentification
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setState((prev) => ({
        ...prev,
        session,
        loading: false,
      }));
    });

    return () => subscription.unsubscribe();
  }, []);

  // Rafraîchir la session
  const refreshSession = async () => {
    try {
      const { data, error } = await supabase.auth.refreshSession();
      if (error) throw error;

      if (data.session) {
        setState((prev) => ({
          ...prev,
          session: data.session,
          error: null,
        }));
      }
    } catch (error: any) {
      console.error('Error refreshing session:', error);
      setState((prev) => ({
        ...prev,
        error,
      }));
    }
  };

  const setSession = (session: Session | null) => {
    setState((prev) => ({ ...prev, session }));
  };

  const setUser = (user: AuthUser | null) => {
    setState((prev) => ({ ...prev, user }));
  };

  const value: SessionContextValue = {
    ...state,
    refreshSession,
    setSession,
    setUser,
  };

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSessionContext() {
  const context = useContext(SessionContext);
  if (context === undefined) {
    throw new Error('useSessionContext must be used within a SessionProvider');
  }
  return context;
}

// Hooks utilitaires pour accès rapide
export function useSession() {
  const { session } = useSessionContext();
  return session;
}

export function useSessionUser() {
  const { user } = useSessionContext();
  return user;
}
