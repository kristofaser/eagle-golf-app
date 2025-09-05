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

interface UserContextValue {
  loading: boolean;
  error: Error | null;
  loadUserProfile: (userId: string) => Promise<AuthUser | null>;
  updateProfile: (updates: Partial<Profile>) => Promise<void>;
  deleteAccount: () => Promise<void>;
}

const UserContext = createContext<UserContextValue | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const { session, user, setUser } = useSessionContext();

  // ✅ AVANT : État manuel dupliqué
  // const [loading, setLoading] = useState(true);
  // const [error, setError] = useState<Error | null>(null);

  // ✅ APRÈS : Hook unifié
  const userOperation = useAsyncOperation<AuthUser>();

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
          // 🚨 VALIDATION CONTINUE : Si profil n'existe pas, peut être supprimé par admin
          const {
            data: { user },
          } = await supabase.auth.getUser();
          
          if (user && user.id === userId) {
            // JWT encore valide mais pas de profil → Possiblement supprimé par admin
            console.warn('🚨 UserContext: Profil manquant détecté, vérification suppression admin');
            
            // Déclencher la déconnexion via SessionContext parent
            try {
              await supabase.auth.signOut();
              console.log('✅ UserContext: Déconnexion déclenchée pour profil manquant');
              
              // Afficher message utilisateur
              Alert.alert(
                'Compte supprimé',
                'Votre compte a été supprimé par un administrateur. Vous avez été déconnecté.',
                [{ text: 'OK', style: 'default' }]
              );
              
            } catch (error) {
              console.error('❌ UserContext: Erreur lors de signOut:', error);
            }
            
            return null;
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
            .single();

          if (amateurProfile) {
            authUser.amateurProfile = amateurProfile;
          }
        } else if (profile.user_type === 'pro') {
          const { data: proProfile } = await supabase
            .from('pro_profiles')
            .select('*')
            .eq('user_id', userId)
            .single();

          if (proProfile) {
            authUser.proProfile = proProfile;
          }
        }

        setUser(authUser);
        return authUser;
      } catch (error) {
        console.error('Error loading user profile:', error);
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
      console.log('🧹 Nettoyage du profil utilisateur après déconnexion');
      setUser(null);
    }
    // RETIRER user?.id des dépendances pour casser la boucle circulaire
  }, [session?.user?.id, loadUserProfileInternal]);

  // Mise à jour du profil
  const updateProfile = useCallback(
    async (updates: Partial<Profile>) => {
      const result = await userOperation.execute(async () => {
        if (!user?.id) throw new Error('Utilisateur non connecté');

        const { data, error } = await supabase
          .from('profiles')
          .update({
            ...updates,
            updated_at: new Date().toISOString(),
          })
          .eq('id', user.id)
          .select()
          .single();

        if (error) throw error;

        // Recharger le profil complet
        await loadUserProfile(user.id);
        return data;
      });

      if (result) {
        Alert.alert('Succès', 'Profil mis à jour');
      } else if (userOperation.error) {
        Alert.alert('Erreur', userOperation.error.message);
        throw userOperation.error;
      }
    },
    [user?.id, loadUserProfile]
  );

  // Supprimer le compte utilisateur
  const deleteAccount = useCallback(async () => {
    const result = await userOperation.execute(async () => {
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
    } else if (userOperation.error) {
      Alert.alert('Erreur', userOperation.error.message || 'Impossible de supprimer le compte');
      throw userOperation.error;
    }
  }, [user?.id, setUser]);

  const value: UserContextValue = {
    loading: userOperation.loading,
    error: userOperation.error,
    loadUserProfile,
    updateProfile,
    deleteAccount,
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
