import { Session, User } from '@supabase/supabase-js';
import { Tables } from './types';

export type Profile = Tables<'profiles'>;
export type AmateurProfile = Tables<'amateur_profiles'>;
export type ProProfile = Tables<'pro_profiles'>;

export interface AuthUser extends User {
  profile?: Profile;
  amateurProfile?: AmateurProfile;
  proProfile?: ProProfile;
}

export interface AuthState {
  user: AuthUser | null;
  session: Session | null;
  loading: boolean;
  error: Error | null;
}

export interface AuthContextType extends AuthState {
  signIn: (email: string) => Promise<void>;
  signInWithProvider: (provider: 'google' | 'apple' | 'facebook') => Promise<void>;
  signInWithMagicLink: (email: string) => Promise<void>;
  signUp: (email: string, userData: SignUpData) => Promise<any>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<void>;
  refreshSession: () => Promise<void>;
  verifyOtp: (email: string, token: string, type?: 'signup' | 'recovery' | 'email') => Promise<any>;
  resendOtp: (email: string) => Promise<void>;
  deleteAccount: () => Promise<void>;
}

export interface SignUpData {
  firstName: string;
  lastName: string;
  userType: 'amateur' | 'pro';
  phone?: string;
  bio?: string;
}

export type AuthProvider = 'google' | 'apple' | 'facebook';

export interface AuthError {
  message: string;
  status?: number;
  code?: string;
}
