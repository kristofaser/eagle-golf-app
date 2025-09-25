/**
 * UserContext - Gestion du profil utilisateur
 * Responsabilités : Chargement profil, mise à jour, suppression compte
 *
 * ✅ REFACTORISÉ avec useAsyncOperation
 */
import React, { createContext, useContext, useCallback, useEffect } from 'react';
import { Alert } from 'react-native';
import { supabase } from '@/utils/supabase/client';
import { AuthUser, Profile } from '@/utils/supabase/auth.types';
import { useSessionContext } from './SessionContext';
import { useAsyncOperation } from '@/hooks/useAsyncOperation';
import { logger } from '@/utils/logger';
interface UserContextValue {
  loading: boolean;
  error: Error | null;
  loadUserProfile: (userId: string) => Promise<AuthUser | null>;
  updateProfile: (updates: Partial<Profile>) => Promise<void>;
  deleteAccount: () => Promise<void>;
  proRequestStatus: 'none' | 'pending' | 'approved' | 'rejected' | 'pro';
  proRequest: any | null;
  loadingProRequest: boolean;
  refreshProRequestStatus: () => Promise<void>;
}

const UserContext = createContext<UserContextValue | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const { session, user, setUser } = useSessionContext();

  // ✅ AVANT : État manuel dupliqué
  // const [loading, setLoading] = useState(true);
  // const [error, setError] = useState<Error | null>(null);

  // ✅ APRÈS : Hooks unifiés pour chaque opération
  const userOperation = useAsyncOperation<AuthUser | null>();
  const updateOperation = useAsyncOperation<Profile | null>();
  const deleteOperation = useAsyncOperation<boolean>();
  const proRequestOperation = useAsyncOperation<any>();

  // Fonction interne pour charger le profil (stable pour éviter la boucle)
  const loadUserProfileInternal = useCallback(
    async (userId: string): Promise<AuthUser | null> => {
      try {
        // Récupérer le profil principal
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .maybeSingle();

        if (error) throw error;

        if (!profile) {
          // 🚨 DIAGNOSTIC : Profil manquant - Identifier la cause réelle
          const {
            data: { user },
          } = await supabase.auth.getUser();

          if (user && user.id === userId) {
            logger.warn(
              '🚨 UserContext: Profil manquant détecté pour utilisateur authentifié:',
              userId
            );

            // Vérifier si c'est un problème de création incomplète
            const { data: authUser } = await supabase.auth.getUser();
            const isRecentlyCreated =
              authUser?.user &&
              new Date(authUser.user.created_at).getTime() > Date.now() - 10 * 60 * 1000; // 10 min

            if (isRecentlyCreated) {
              // 🚨 NOUVEAUX COMPTES : Ne pas déconnecter immédiatement
              // Laisser le temps à la création différée de profil amateur
              logger.warn(
                '⏳ UserContext: Profil manquant pour nouveau compte, attente création différée...'
              );

              // Ne pas déconnecter pour l'instant, laisser la chance à la création différée
              // Le profil sera rechargé automatiquement via l'effet dans SessionContext
              return null;
            } else {
              // Comptes anciens : comportement normal (vraie suppression admin)
              try {
                await supabase.auth.signOut();
                logger.dev(
                  '✅ UserContext: Déconnexion déclenchée pour profil manquant (compte ancien)'
                );

                Alert.alert(
                  'Compte supprimé',
                  'Votre compte a été supprimé par un administrateur. Vous avez été déconnecté.',
                  [{ text: 'OK', style: 'default' }]
                );
              } catch (error) {
                logger.error('❌ UserContext: Erreur lors de signOut:', error);
              }

              return null;
            }
          }

          return null;
        }

        // Utiliser la session actuelle directement (évite la dépendance)
        const {
          data: { session: currentSession },
        } = await supabase.auth.getSession();
        const currentUser = currentSession?.user;
        if (!currentUser) {
          return null;
        }

        const authUser: AuthUser = {
          ...currentUser,
          profile,
        };

        // Charger le profil spécifique selon le type
        if (profile.user_type === 'amateur') {
          const { data: amateurProfile } = await supabase
            .from('amateur_profiles')
            .select('*')
            .eq('user_id', userId)
            .maybeSingle();

          if (amateurProfile) {
            authUser.amateurProfile = amateurProfile;
          }
        } else if (profile.user_type === 'pro') {
          const { data: proProfile } = await supabase
            .from('pro_profiles')
            .select('*')
            .eq('user_id', userId)
            .maybeSingle();

          if (proProfile) {
            authUser.proProfile = proProfile;
          }
        }

        setUser(authUser);
        return authUser;
      } catch (error) {
        logger.error('Error loading user profile:', error);
        return null;
      }
    },
    [setUser]
  ); // Seulement setUser comme dépendance

  // Charger le profil utilisateur complet avec gestion d'état
  const loadUserProfile = useCallback(
    async (userId: string): Promise<AuthUser | null> => {
      const result = await userOperation.execute(() => loadUserProfileInternal(userId));
      return result;
    },
    [userOperation, loadUserProfileInternal]
  );

  // Charger automatiquement le profil quand la session change
  useEffect(() => {
    if (session?.user?.id) {
      // Ne charger le profil que s'il n'est pas déjà chargé ou en cours de chargement
      // Cela évite le race condition avec loadUserProfile appelé depuis verifyOtp
      if (user?.id === session.user.id) {
        // Le profil est déjà chargé pour cet utilisateur
        return;
      }

      // Utiliser la fonction interne pour éviter la boucle de dépendances
      loadUserProfileInternal(session.user.id);
    } else if (user) {
      // Pas de session, nettoyer SEULEMENT si l'utilisateur existe
      // Évite la boucle infinie en vérifiant que user n'est pas déjà null
      logger.dev('🧹 Nettoyage du profil utilisateur après déconnexion');
      setUser(null);
    }
    // RETIRER user?.id des dépendances pour casser la boucle circulaire
  }, [session?.user?.id, loadUserProfileInternal]);

  // Mise à jour du profil
  const updateProfile = useCallback(
    async (updates: Partial<Profile>) => {
      const result = await updateOperation.execute(async () => {
        if (!user?.id) throw new Error('Utilisateur non connecté');

        const { data, error } = await supabase
          .from('profiles')
          .update({
            ...updates,
            updated_at: new Date().toISOString(),
          })
          .eq('id', user.id)
          .select()
          .maybeSingle();

        if (error) throw error;

        // Recharger le profil complet
        await loadUserProfile(user.id);
        return data;
      });

      if (result) {
        Alert.alert('Succès', 'Profil mis à jour');
      } else if (updateOperation.error) {
        Alert.alert('Erreur', updateOperation.error.message);
        throw updateOperation.error;
      }
    },
    [user?.id, loadUserProfile, updateOperation]
  );

  // Supprimer le compte utilisateur
  const deleteAccount = useCallback(async () => {
    const result = await deleteOperation.execute(async () => {
      if (!user?.id) throw new Error('Utilisateur non connecté');

      // Récupérer le token de session
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) throw new Error('Session non trouvée');

      // Appeler la fonction Edge pour supprimer complètement le compte
      const { data, error: functionError } = await supabase.functions.invoke(
        'delete-user-account',
        {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        }
      );

      if (functionError) {
        throw functionError;
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      // Si la suppression est réussie, déconnecter l'utilisateur
      await supabase.auth.signOut();
      setUser(null);

      return true;
    });

    if (result) {
      Alert.alert(
        'Compte supprimé',
        'Votre compte et toutes vos données ont été supprimés définitivement.'
      );
    } else if (deleteOperation.error) {
      Alert.alert('Erreur', deleteOperation.error.message || 'Impossible de supprimer le compte');
      throw deleteOperation.error;
    }
  }, [user?.id, setUser, deleteOperation]);

  // Fonction pour charger le statut de demande pro
  const refreshProRequestStatus = useCallback(async () => {
    logger.dev('🔄 refreshProRequestStatus called');

    await proRequestOperation.execute(async () => {
      if (!user?.id) {
        logger.dev('❌ No user ID, returning none status');
        return { status: 'none', request: null };
      }

      try {
        // Vérifier si l'utilisateur est déjà pro
        if (user?.profile?.user_type === 'pro') {
          logger.dev('✅ User is already pro');
          return { status: 'pro', request: null };
        }

        // Récupérer la dernière demande pro
        logger.dev('📡 Fetching pro validation request for user:', user.id);
        const { data: request, error } = await supabase
          .from('pro_validation_requests')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (error && error.code !== 'PGRST116') {
          logger.error('❌ Erreur chargement demande pro:', error);
          throw error;
        }

        if (!request) {
          logger.dev('📭 No pro request found');
          return { status: 'none', request: null };
        }

        logger.dev('📬 Pro request found:', { status: request.status, id: request.id });

        // Si la demande est approuvée, recharger le profil complet pour mettre à jour user_type
        if (request.status === 'approved') {
          logger.dev('🎉 Demande pro approuvée, rechargement du profil complet');
          // Recharger le profil pour obtenir le nouveau user_type
          await loadUserProfile(user.id);
          // Après rechargement, le user_type devrait être 'pro'
          return { status: 'pro', request };
        }

        logger.dev('📋 Returning pro request status:', request.status || 'pending');
        return { status: request.status || 'pending', request };
      } catch (error) {
        logger.error('❌ Erreur refreshProRequestStatus:', error);
        return { status: 'none', request: null };
      }
    });
  }, [user?.id, user?.profile?.user_type, proRequestOperation, loadUserProfile]);

  // Charger le statut de demande pro au chargement et quand l'utilisateur change
  useEffect(() => {
    if (user?.id) {
      refreshProRequestStatus();
    }
  }, [user?.id]); // Retirer refreshProRequestStatus des dépendances pour éviter la boucle

  // Écouter les changements en temps réel sur pro_requests
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel('pro_validation_requests_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'pro_validation_requests',
          filter: `user_id=eq.${user.id}`,
        },
        async (payload) => {
          logger.dev('🔄 Pro request changé via realtime:', payload);
          logger.dev('Event type:', payload.eventType);
          logger.dev('New data:', payload.new);
          logger.dev('Old data:', payload.old);

          // Rafraîchir le statut quand la demande change
          await refreshProRequestStatus();
        }
      )
      .subscribe((status) => {
        logger.dev('🔌 Subscription status pro_validation_requests:', status);
      });

    return () => {
      logger.dev('🔌 Unsubscribing from pro_validation_requests channel');
      supabase.removeChannel(channel);
    };
  }, [user?.id]); // Retirer refreshProRequestStatus des dépendances

  // Écouter les changements sur le profil utilisateur (notamment user_type)
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel('profile_changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${user.id}`,
        },
        async (payload) => {
          logger.dev('🔄 Profil changé via realtime:', payload);
          logger.dev('Event type:', payload.eventType);
          logger.dev('New profile data:', payload.new);
          logger.dev('Old profile data:', payload.old);

          // Recharger le profil complet quand il change
          if (payload.new && payload.new.user_type !== user?.profile?.user_type) {
            logger.dev('✅ Changement de user_type détecté:', {
              old: user?.profile?.user_type,
              new: payload.new.user_type
            });
            await loadUserProfile(user.id);
            // Rafraîchir aussi le statut de demande pro
            await refreshProRequestStatus();
          } else {
            logger.dev('ℹ️ Profil changé mais user_type inchangé');
          }
        }
      )
      .subscribe((status) => {
        logger.dev('🔌 Subscription status profiles:', status);
      });

    return () => {
      logger.dev('🔌 Unsubscribing from profiles channel');
      supabase.removeChannel(channel);
    };
  }, [user?.id]); // Retirer les callbacks des dépendances

  const value: UserContextValue = {
    loading: userOperation.loading || updateOperation.loading || deleteOperation.loading,
    error: userOperation.error || updateOperation.error || deleteOperation.error,
    loadUserProfile,
    updateProfile,
    deleteAccount,
    proRequestStatus: proRequestOperation.data?.status || 'none',
    proRequest: proRequestOperation.data?.request || null,
    loadingProRequest: proRequestOperation.loading,
    refreshProRequestStatus,
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

export function useUserContext() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUserContext must be used within a UserProvider');
  }
  return context;
}

// Hook utilitaire pour accès rapide au profil
export function useProfile() {
  const { user } = useSessionContext();
  return user?.profile;
}
