/**
 * AuthContext - Gestion de l'authentification uniquement
 * Responsabilités : Connexion, inscription, déconnexion, réinitialisation mot de passe
 *
 * ✅ REFACTORISÉ avec useAsyncOperation - Élimine la duplication loading/error
 */
import React, { createContext, useContext, useCallback } from 'react';
import { Alert, Platform } from 'react-native';
import * as Linking from 'expo-linking';
import { supabase } from '@/utils/supabase/client';
import { SignUpData, AuthProvider as AuthProviderType } from '@/utils/supabase/auth.types';
import { useSessionContext } from './SessionContext';
import { useUserContext } from './UserContext';
import { useAsyncOperation } from '@/hooks/useAsyncOperation';

interface AuthContextValue {
  loading: boolean;
  error: Error | null;
  signIn: (email: string) => Promise<any>;
  signInWithProvider: (provider: AuthProviderType) => Promise<void>;
  signInWithMagicLink: (email: string) => Promise<void>;
  signUp: (email: string, userData: SignUpData) => Promise<any>;
  signOut: () => Promise<void>;
  verifyOtp: (email: string, token: string, type?: 'signup' | 'recovery' | 'email') => Promise<any>;
  resendOtp: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setSession } = useSessionContext();
  const { loadUserProfile } = useUserContext();

  // ✅ AVANT: État manuel loading/error dupliqué
  // const [loading, setLoading] = useState(false);
  // const [error, setError] = useState<Error | null>(null);

  // ✅ APRÈS: Hook unifié pour toutes les opérations auth
  const authOperation = useAsyncOperation();

  // Connexion avec OTP (passwordless)
  const signIn = useCallback(async (email: string) => {
    try {
      const result = await authOperation.execute(async () => {
        // 🚨 VALIDATION PAR OTP SUFFISANTE
        // L'OTP valide déjà que l'email existe et est contrôlé par l'utilisateur
        console.log('🔍 AuthContext: Procédure OTP pour:', email);

        // Procédure OTP normale si profil existe ou en cas d'erreur réseau
        const { error } = await supabase.auth.signInWithOtp({
          email,
          options: {
            shouldCreateUser: false, // Ne pas créer d'utilisateur lors de la connexion
          },
        });

        if (error) {
          // Personnaliser les messages d'erreur Supabase
          if (error.message?.includes('rate limit') || error.status === 429) {
            throw new Error('Trop de tentatives. Veuillez attendre quelques minutes avant de réessayer.');
          } else if (error.message?.includes('Email not confirmed')) {
            throw new Error('Votre compte n\'est pas encore activé. Vérifiez votre boîte mail.');
          }
          throw error;
        }

        console.log('✅ AuthContext: OTP envoyé avec succès pour:', email);

        // Retourner l'email pour passer à l'écran OTP
        return { email };
      });

      return result;
    } catch (error) {
      // Gestion d'erreur avec message utilisateur
      Alert.alert('Erreur de connexion', error.message);
      throw error;
    }
  }, []);

  // Connexion avec provider OAuth
  const signInWithProvider = useCallback(async (provider: AuthProviderType) => {
    const result = await authOperation.execute(async () => {
      const redirectTo = Platform.select({
        web: `${window.location.origin}/auth/callback`,
        default: Linking.createURL('/auth/callback'),
      });

      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo,
          skipBrowserRedirect: Platform.OS !== 'web',
        },
      });

      if (error) throw error;

      // Sur mobile, ouvrir le navigateur pour OAuth
      if (Platform.OS !== 'web') {
        const { data } = await supabase.auth.signInWithOAuth({
          provider,
          options: {
            redirectTo,
          },
        });

        if (data.url) {
          await Linking.openURL(data.url);
        }
      }
    });

    // Gestion d'erreur avec message utilisateur
    if (!result && authOperation.error) {
      Alert.alert('Erreur de connexion', authOperation.error.message);
      throw authOperation.error;
    }
  }, []);

  // Connexion avec Magic Link
  const signInWithMagicLink = useCallback(async (email: string) => {
    const result = await authOperation.execute(async () => {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: Platform.select({
            web: `${window.location.origin}/auth/callback`,
            default: Linking.createURL('/auth/callback'),
          }),
        },
      });

      if (error) throw error;

      Alert.alert('Email envoyé', 'Vérifiez votre boîte mail pour vous connecter');
    });

    if (!result && authOperation.error) {
      Alert.alert('Erreur', authOperation.error.message);
      throw authOperation.error;
    }
  }, []);

  // Inscription avec OTP (passwordless)
  const signUp = useCallback(async (email: string, userData: SignUpData) => {
    const result = await authOperation.execute(async () => {
      // Utiliser signInWithOtp pour envoyer un code OTP
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: true,
          data: {
            first_name: userData.firstName,
            last_name: userData.lastName,
            user_type: userData.userType || 'amateur',
            email: email,
          },
        },
      });

      if (error) {
        // Gestion des erreurs spécifiques
        if (error.message?.includes('rate limit') || error.status === 429) {
          throw new Error(
            'Trop de tentatives. Veuillez attendre quelques minutes avant de réessayer.'
          );
        } else if (error.message?.includes('already registered')) {
          throw new Error('Cette adresse email est déjà utilisée.');
        }
        throw error;
      }

      // Retourner les données pour passer à l'écran OTP
      return { email, userData };
    });

    if (!result && authOperation.error) {
      throw authOperation.error;
    }

    return result;
  }, []);

  // Vérifier le code OTP et créer le profil
  const verifyOtp = useCallback(
    async (email: string, token: string, type: 'signup' | 'recovery' | 'email' = 'email') => {
      const result = await authOperation.execute(async () => {
        // Vérifier le code OTP
        const { data, error } = await supabase.auth.verifyOtp({
          email,
          token,
          type: type || 'email',
        });

        if (error) throw error;
        if (!data.user) throw new Error('Erreur lors de la vérification');

        // Créer les profils après vérification réussie
        if (data.user && data.session) {
          const userData = data.user.user_metadata;

          // Vérifier si le profil existe déjà
          const { data: existingProfile } = await supabase
            .from('profiles')
            .select('id')
            .eq('id', data.user.id)
            .maybeSingle();

          if (!existingProfile) {
            // Créer le profil principal
            const profileData = {
              id: data.user.id,
              first_name: userData.first_name || '',
              last_name: userData.last_name || '',
              user_type: userData.user_type || 'amateur',
              email: email, // Ajouter l'email pour éviter les valeurs null
            };

            const { error: profileError } = await supabase.from('profiles').insert(profileData);

            if (profileError) {
              console.error('Erreur création profil:', profileError);
              // Ne pas bloquer si le profil existe déjà
              if (profileError.code !== '23505') {
                throw profileError;
              }
            } else {
              console.log('✅ Profil principal créé, profil amateur sera créé en différé après établissement JWT');
            }
          }

          // D'abord définir la session pour établir le contexte JWT
          setSession(data.session);

          // Attendre que la session soit établie avant de créer le profil amateur
          if (userData.user_type === 'amateur' || !userData.user_type) {
            // Petit délai pour s'assurer que le JWT context est établi
            setTimeout(async () => {
              try {
                console.log('🔄 Création différée du profil amateur avec contexte JWT établi');
                const { error: amateurError } = await supabase.from('amateur_profiles').insert({
                  user_id: data.user.id,
                });

                if (amateurError && amateurError.code !== '23505') {
                  console.error('❌ Erreur création profil amateur différée:', amateurError);
                  // Ne pas throw ici car on est dans un setTimeout
                  Alert.alert(
                    'Erreur de profil', 
                    'Votre profil principal a été créé mais le profil amateur a échoué. Contactez le support.'
                  );
                } else {
                  console.log('✅ Profil amateur créé avec succès en mode différé');
                }
              } catch (error) {
                console.error('❌ Erreur lors de la création différée:', error);
              }
            }, 1000);
          }

          // Charger le profil avec un délai pour s'assurer que la création est terminée
          setTimeout(async () => {
            try {
              await loadUserProfile(data.user.id);
            } catch (error) {
              console.error('Erreur chargement profil après OTP:', error);
            }
          }, 1500); // Délai plus long pour attendre la création amateur
        }

        return { user: data.user, session: data.session };
      });

      if (!result && authOperation.error) {
        throw authOperation.error;
      }

      return result;
    },
    [setSession, loadUserProfile]
  );

  // Renvoyer le code OTP
  const resendOtp = useCallback(async (email: string) => {
    const result = await authOperation.execute(async () => {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: false,
        },
      });

      if (error) throw error;
    });

    if (!result && authOperation.error) {
      throw authOperation.error;
    }
  }, []);

  // Déconnexion
  const signOut = useCallback(async () => {
    const result = await authOperation.execute(async () => {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      setSession(null);
    });

    if (!result && authOperation.error) {
      Alert.alert('Erreur', authOperation.error.message);
      throw authOperation.error;
    }
  }, [setSession]);

  const value: AuthContextValue = {
    loading: authOperation.loading,
    error: authOperation.error,
    signIn,
    signInWithProvider,
    signInWithMagicLink,
    signUp,
    signOut,
    verifyOtp,
    resendOtp,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
}

// Hooks utilitaires pour compatibilité
export function useAuth() {
  return useAuthContext();
}
