import { useState, useCallback, useMemo, useEffect } from 'react';
import { Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { useProProfile, useProFavorite } from '@/hooks/useProProfile';
import { useQuery } from '@tanstack/react-query';
import { useGeolocation } from '@/hooks/useGeolocation';
import { profileService, FullProfile } from '@/services/profile.service';
import { golfCourseService, GolfCourse } from '@/services/golf-course.service';
import { amateurAvailabilityService } from '@/services/amateur-availability.service';

interface UseProfileScreenProps {
  profileId: string;
}

export const useProfileScreen = ({ profileId }: UseProfileScreenProps) => {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const { location: userLocation } = useGeolocation();

  // Utiliser le hook optimisé avec cache
  const {
    profile,
    availabilities,
    pricing,
    isLoading,
    error: queryError,
    refetch,
  } = useProProfile(profileId || '', !!profileId);

  // Hook pour gérer les favoris
  const { isFavorite, toggleFavorite, isToggling } = useProFavorite(profileId || '');

  // États locaux pour l'édition
  const [golfCourses, setGolfCourses] = useState<GolfCourse[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editedProfile, setEditedProfile] = useState<FullProfile | null>(null);

  // Vérifier si c'est mon profil
  const isMyProfile = user?.id === profileId;
  const isPro = profile?.user_type === 'pro';

  // Récupérer les paramètres de disponibilité du pro
  const { data: proAvailabilitySettings } = useQuery({
    queryKey: ['proAvailability', profileId],
    queryFn: async () => {
      // La méthode getProAvailabilitySettings n'existe plus dans le nouveau système
      // TODO: Implémenter récupération des settings depuis pro-availability si nécessaire
      const settings = null;
      return settings;
    },
    enabled: !!profileId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Récupérer les parcours où le pro est disponible
  const { data: proCourses = [], isLoading: isLoadingCourses } = useQuery({
    queryKey: ['proCourses', profileId, userLocation?.latitude, userLocation?.longitude],
    queryFn: async () => {
      if (!profileId || !isPro) return [];


      const { data, error } = await amateurAvailabilityService.getProAvailableCourses(
        profileId,
        userLocation?.latitude,
        userLocation?.longitude
      );

      if (error) {
        console.error('Erreur chargement parcours:', error);
        return [];
      }


      return data || [];
    },
    enabled: !!profileId && isPro,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Charger les parcours de golf
  const loadGolfCourses = useCallback(async () => {
    try {
      const { data } = await golfCourseService.listGolfCourses();
      if (data) {
        setGolfCourses(data);
      }
    } catch (err) {
      console.error('Erreur chargement parcours:', err);
    }
  }, []);

  useEffect(() => {
    if (profileId) {
      loadGolfCourses();
    }
  }, [profileId, loadGolfCourses]);


  // Mettre à jour editedProfile quand le profil change
  useEffect(() => {
    if (profile) {
      setEditedProfile(profile);
    }
  }, [profile]);

  // Calculer le prix minimum parmi tous les tarifs (avec commission de 20%)
  const getMinPrice = useMemo(() => {
    return (playersCount?: number) => {
      if (!pricing || pricing.length === 0) {
        // Fallback sur l'ancien prix si pas de pricing
        const basePrice = profile?.pro_profiles?.price_18_holes_1_player || 0;
        // Ajouter la commission de 20%
        return Math.round(basePrice * 1.2);
      }

      // Si un nombre de joueurs est spécifié, filtrer pour ce nombre
      if (playersCount) {
        const pricesForPlayers = pricing
          .filter((p) => p.price > 0 && p.players_count === playersCount)
          .map((p) => p.price);

        if (pricesForPlayers.length > 0) {
          const minPrice = Math.min(...pricesForPlayers);
          // Ajouter la commission de 20% (prix déjà en euros depuis le service)
          return Math.round(minPrice * 1.2);
        }

        // Si pas de prix pour ce nombre de joueurs, prendre le minimum global
      }

      // Filtrer les prix valides (> 0) et prendre le minimum
      const validPrices = pricing.filter((p) => p.price > 0).map((p) => p.price);

      if (validPrices.length === 0) {
        return 0;
      }

      const minPrice = Math.min(...validPrices);
      // Ajouter la commission de 20% (prix déjà en euros depuis le service)
      return Math.round(minPrice * 1.2);
    };
  }, [pricing, profile?.pro_profiles?.price_18_holes_1_player]);



  // Fonction pour sauvegarder le profil édité
  const handleSave = useCallback(async () => {
    if (!editedProfile || !isMyProfile) return;

    try {
      const updateData: any = {
        profile: {
          first_name: editedProfile.first_name,
          last_name: editedProfile.last_name,
          phone: editedProfile.phone,
          city: editedProfile.city,
        },
      };

      if (profile?.user_type === 'amateur' && editedProfile.amateur_profiles) {
        updateData.amateurProfile = {
          handicap: editedProfile.amateur_profiles.handicap,
          club_affiliation: editedProfile.amateur_profiles.club_affiliation,
          golf_course_id: editedProfile.amateur_profiles.golf_course_id,
          license_number: editedProfile.amateur_profiles.license_number,
        };
      } else if (profile?.user_type === 'pro' && editedProfile.pro_profiles) {
        updateData.proProfile = {
          date_of_birth: editedProfile.pro_profiles.date_of_birth,
          siret: editedProfile.pro_profiles.siret,
          company_status: editedProfile.pro_profiles.company_status,
          division: editedProfile.pro_profiles.division,
          world_ranking: editedProfile.pro_profiles.world_ranking,
          skills: editedProfile.pro_profiles.skills,
          experience: editedProfile.pro_profiles.experience,
        };
      }

      const { error } = await profileService.updateProfile(profileId!, updateData);

      if (error) {
        Alert.alert('Erreur', 'Impossible de sauvegarder les modifications');
      } else {
        setIsEditing(false);
        Alert.alert('Succès', 'Profil mis à jour');
      }
    } catch (err) {
      console.error('Erreur sauvegarde:', err);
      Alert.alert('Erreur', 'Une erreur est survenue');
    }
  }, [editedProfile, isMyProfile, profile, profileId]);

  // Déterminer si le pro est disponible
  const isProAvailable = proAvailabilitySettings?.is_globally_available ?? false;

  return {
    // Profile data
    profile,
    availabilities,
    pricing,
    isLoading,
    error: queryError,
    refetch,

    // Favorites
    isFavorite,
    toggleFavorite,
    isToggling,

    // Golf courses
    golfCourses,
    proCourses,
    isLoadingCourses,

    // Editing
    isEditing,
    setIsEditing,
    editedProfile,
    setEditedProfile,
    handleSave,

    // Pricing
    getMinPrice,

    // Status
    isMyProfile,
    isPro,
    isProAvailable,

    // Details
    proDetails: profile?.pro_profiles,
    amateurDetails: profile?.amateur_profiles,
  };
};