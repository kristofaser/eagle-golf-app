import { useState, useCallback, useEffect } from 'react';
import { Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { FullProfile } from '@/services/profile.service';
import { ProCourseAvailability } from '@/services/amateur-availability.service';

interface UseBookingFlowProps {
  profile: FullProfile | null;
  profileId: string;
  getMinPrice: (playersCount?: number) => number;
  proCourses: ProCourseAvailability[];
  isLoadingCourses: boolean;
}

export const useBookingFlow = ({
  profile,
  profileId,
  getMinPrice,
  proCourses,
  isLoadingCourses,
}: UseBookingFlowProps) => {
  const router = useRouter();
  const { isAuthenticated } = useAuth();

  // États locaux pour la réservation
  const [numberOfPlayers, setNumberOfPlayers] = useState(1);
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [selectedCourseName, setSelectedCourseName] = useState<string | null>(null);

  // Fonction pour gérer la sélection d'un parcours
  const handleCourseSelect = useCallback((courseId: string, courseName: string) => {
    setSelectedCourseId(courseId);
    setSelectedCourseName(courseName);
  }, []);

  // Sélectionner automatiquement le parcours le plus proche quand les données sont chargées
  useEffect(() => {
    const hasGeolocation =
      proCourses && proCourses.length > 0 && proCourses[0].distance_km !== undefined;

    // Attendre d'avoir la géolocalisation pour faire une sélection intelligente
    if (
      proCourses &&
      proCourses.length > 0 &&
      !selectedCourseId &&
      !isLoadingCourses &&
      hasGeolocation
    ) {
      // Sélectionner le premier parcours (le plus proche grâce au tri par distance)
      const closestCourse = proCourses[0];
      handleCourseSelect(closestCourse.golf_course_id, closestCourse.golf_course_name);
    }
  }, [proCourses, selectedCourseId, isLoadingCourses, handleCourseSelect]);

  // Fonction pour gérer le changement du nombre de joueurs
  const handlePlayersChange = useCallback((value: number) => {
    setNumberOfPlayers(Math.min(3, Math.max(1, value)));
  }, []);

  // Fonction pour incrémenter le nombre de joueurs
  const incrementPlayers = useCallback(() => {
    handlePlayersChange(numberOfPlayers + 1);
  }, [numberOfPlayers, handlePlayersChange]);

  // Fonction pour décrémenter le nombre de joueurs
  const decrementPlayers = useCallback(() => {
    handlePlayersChange(numberOfPlayers - 1);
  }, [numberOfPlayers, handlePlayersChange]);

  // Fonction pour gérer la réservation
  const handleBooking = useCallback(() => {
    const minPrice = getMinPrice ? getMinPrice(numberOfPlayers) : 0;

    if (!isAuthenticated) {
      Alert.alert(
        'Connexion requise',
        'Vous devez être connecté pour réserver une partie avec ce professionnel.',
        [
          { text: 'Annuler', style: 'cancel' },
          {
            text: 'Se connecter',
            onPress: () =>
              router.push({
                pathname: '/(auth)/register',
                params: { returnTo: `/profile/${profileId}` },
              }),
          },
        ]
      );
    } else if (!selectedCourseId || !selectedCourseName) {
      Alert.alert(
        'Sélection requise',
        'Veuillez sélectionner un parcours de golf avant de réserver.',
        [{ text: 'OK', style: 'default' }]
      );
    } else {
      router.push({
        pathname: '/book-pro/[proId]',
        params: {
          proId: profileId,
          proName: `${profile?.first_name} ${profile?.last_name}`,
          price: minPrice.toString(),
          players: numberOfPlayers.toString(),
          courseId: selectedCourseId,
          courseName: selectedCourseName,
        },
      });
    }
  }, [
    getMinPrice,
    numberOfPlayers,
    isAuthenticated,
    selectedCourseId,
    selectedCourseName,
    router,
    profileId,
    profile,
  ]);

  // Fonction pour réinitialiser la sélection
  const resetSelection = useCallback(() => {
    setNumberOfPlayers(1);
    setSelectedCourseId(null);
    setSelectedCourseName(null);
  }, []);

  // Calculer le prix actuel
  const currentPrice = getMinPrice ? getMinPrice(numberOfPlayers) : 0;

  // Vérifier si on peut réserver
  const canBook = isAuthenticated && selectedCourseId !== null;

  // Texte du bouton de réservation
  const bookingButtonText = isAuthenticated ? 'Réserver' : 'Se connecter';

  // Label d'accessibilité pour le bouton
  const getBookingButtonAccessibilityLabel = () => {
    if (!isAuthenticated) {
      return 'Se connecter pour réserver';
    }
    return `Réserver une session avec ${profile?.first_name} ${profile?.last_name}`;
  };

  // Hint d'accessibilité pour le bouton
  const getBookingButtonAccessibilityHint = () => {
    if (!isAuthenticated) {
      return 'Appuyez pour vous connecter et pouvoir réserver';
    }
    if (!selectedCourseId) {
      return "Sélectionnez d'abord un parcours de golf";
    }
    return `Appuyez pour réserver ${numberOfPlayers} place${
      numberOfPlayers > 1 ? 's' : ''
    } à ${currentPrice}€`;
  };

  return {
    // États
    numberOfPlayers,
    selectedCourseId,
    selectedCourseName,
    currentPrice,
    canBook,

    // Actions
    handleCourseSelect,
    handlePlayersChange,
    incrementPlayers,
    decrementPlayers,
    handleBooking,
    resetSelection,

    // Textes et accessibilité
    bookingButtonText,
    getBookingButtonAccessibilityLabel,
    getBookingButtonAccessibilityHint,

    // Limites
    maxPlayers: 3,
    minPlayers: 1,
    canIncrementPlayers: numberOfPlayers < 3,
    canDecrementPlayers: numberOfPlayers > 1,
  };
};
