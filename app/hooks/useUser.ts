/**
 * Hook useUser - Wrapper pour accès facilité aux données utilisateur
 */
import { useMemo } from 'react';
import { useSessionUser, useProfile } from '@/contexts/AppProviders';
import { useUserContext } from '@/contexts/UserContext';
import { useSessionContext } from '@/contexts/SessionContext';

export function useUser() {
  const user = useSessionUser();
  const profile = useProfile();
  const { updateProfile, loading: userLoading } = useUserContext();
  const { loading: sessionLoading } = useSessionContext();

  const loading = userLoading || sessionLoading;

  const isAmateur = useMemo(() => {
    // Par défaut, si pas de profil ou pas de user_type, on considère comme amateur
    if (!profile) return true;
    return profile.user_type === 'amateur' || !profile.user_type;
  }, [profile]);

  const isPro = useMemo(() => {
    // Un utilisateur n'est pro que s'il est explicitement marqué comme tel
    return profile?.user_type === 'pro';
  }, [profile]);

  const fullName = useMemo(() => {
    if (!profile) return '';
    return `${profile.first_name} ${profile.last_name}`.trim();
  }, [profile]);

  const initials = useMemo(() => {
    if (!profile) return '';
    const first = profile.first_name?.[0] || '';
    const last = profile.last_name?.[0] || '';
    return `${first}${last}`.toUpperCase();
  }, [profile]);

  const avatarUrl = useMemo(() => {
    return profile?.avatar_url || null;
  }, [profile]);

  const handicap = useMemo(() => {
    if (isAmateur) {
      return user?.amateurProfile?.handicap || null;
    }
    if (isPro) {
      return user?.proProfile?.handicap || null;
    }
    return null;
  }, [user, isAmateur, isPro]);

  const hourlyRate = useMemo(() => {
    if (isPro && user?.proProfile) {
      return user.proProfile.hourly_rate;
    }
    return null;
  }, [user, isPro]);

  const specialties = useMemo(() => {
    if (isPro && user?.proProfile) {
      return user.proProfile.specialties || [];
    }
    return [];
  }, [user, isPro]);

  const experienceLevel = useMemo(() => {
    if (isAmateur && user?.amateurProfile) {
      return user.amateurProfile.experience_level || null;
    }
    return null;
  }, [user, isAmateur]);

  return {
    user,
    profile,
    amateurProfile: user?.amateurProfile || null,
    proProfile: user?.proProfile || null,
    loading,
    isAmateur,
    isPro,
    fullName,
    initials,
    avatarUrl,
    handicap,
    hourlyRate,
    specialties,
    experienceLevel,
    updateProfile,
  };
}
