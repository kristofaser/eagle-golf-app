import React from 'react';
import { View, Text, TouchableOpacity, Platform } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import Animated from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/theme';
import { ProfileSkeleton } from '@/components/atoms/ProfileSkeleton';
import { useAuth } from '@/hooks/useAuth';

// Hooks
import { useProfileScreen } from './hooks/useProfileScreen';
import { useProfileAnimations } from './hooks/useProfileAnimations';
import { useBookingFlow } from './hooks/useBookingFlow';

// Sections
import { ProfileHeader } from './sections/ProfileHeader';
import { ProfileHeroImage } from './sections/ProfileHeroImage';
import { ProfileInfo } from './sections/ProfileInfo';
import { AvailabilitySection } from './sections/AvailabilitySection';
import { SkillsSection } from './sections/SkillsSection';
import { ExperienceSection } from './sections/ExperienceSection';
import { BookingFAB } from './sections/BookingFAB';

// Styles
import { profileStyles, IMAGE_HEIGHT } from './styles/profileStyles';

// Injecter des styles CSS pour optimiser les animations sur le web
if (Platform.OS === 'web' && typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `
    /* Optimisations pour les animations web */
    .animated-container {
      will-change: transform, opacity;
      -webkit-backface-visibility: hidden;
      backface-visibility: hidden;
      -webkit-transform: translateZ(0);
      transform: translateZ(0);
    }

    /* Smooth scrolling pour le web */
    .profile-scroll-view {
      scroll-behavior: smooth;
      -webkit-overflow-scrolling: touch;
    }

    /* Transitions fluides pour les effets de parallaxe */
    .parallax-image {
      transition: transform 0.1s ease-out;
      will-change: transform;
    }

    /* Header animations */
    .animated-header {
      transition: background-color 0.2s ease-out, border-color 0.2s ease-out;
      will-change: background-color, opacity;
    }
  `;
  document.head.appendChild(style);
}

export default function ProfileScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { isAuthenticated, user } = useAuth();
  const profileId = Array.isArray(id) ? id[0] : id;

  // Hook principal avec toute la logique métier
  const {
    profile,
    isLoading,
    error: queryError,
    refetch,
    isFavorite,
    toggleFavorite,
    isToggling,
    proCourses,
    isLoadingCourses,
    isPro,
    isProAvailable,
    proDetails,
    getMinPrice,
  } = useProfileScreen({ profileId: profileId || '' });

  // Hook pour les animations - avec ajustements pour le web
  const {
    scrollY,
    scrollHandler,
    animatedHeaderStyle,
    animatedHeaderContentStyle,
    animatedHeaderIconsStyle,
    parallaxImageStyle,
    contentAnimatedStyle,
  } = useProfileAnimations();

  // Hook pour la logique de réservation
  const {
    numberOfPlayers,
    selectedCourseId,
    selectedCourseName,
    currentPrice,
    handleCourseSelect,
    handlePlayersChange,
    bookingButtonText,
    getBookingButtonAccessibilityLabel,
    getBookingButtonAccessibilityHint,
    canIncrementPlayers,
    canDecrementPlayers,
  } = useBookingFlow({
    profile,
    profileId: profileId || '',
    getMinPrice,
    proCourses,
    isLoadingCourses,
  });

  // Sur web, on navigue vers booking-modal comme sur mobile
  const handleBooking = () => {
    router.push({
      pathname: '/booking-modal',
      params: {
        proId: profileId || '',
        proName: `${profile.first_name} ${profile.last_name}`,
        selectedCourseId: selectedCourseId || '',
        selectedCourseName: selectedCourseName || 'Golf sélectionné',
        players: numberOfPlayers.toString(),
        price: currentPrice.toString(),
      },
    });
  };

  // Afficher un skeleton loader pendant le chargement
  if (isLoading) {
    return <ProfileSkeleton />;
  }

  // Afficher une erreur si nécessaire
  if (queryError || !profile) {
    return (
      <View style={[profileStyles.container, profileStyles.centerContent]}>
        <Text style={profileStyles.errorText}>{queryError?.message || 'Profil non trouvé'}</Text>
        <TouchableOpacity onPress={() => refetch()} style={profileStyles.backButton}>
          <Text style={profileStyles.backButtonText}>Réessayer</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => router.back()}
          style={[profileStyles.backButton, { marginTop: 10 }]}
        >
          <Text style={profileStyles.backButtonText}>Retour</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Si c'est un profil amateur, ils n'ont pas de page vitrine publique
  if (!isPro) {
    return (
      <>
        <Stack.Screen
          options={{
            headerShown: true,
            title: 'Profil non disponible',
          }}
        />

        <View style={[profileStyles.container, profileStyles.centerContent]}>
          <Ionicons name="person-circle-outline" size={80} color={Colors.neutral.mist} />
          <Text style={profileStyles.notAvailableTitle}>Profil non disponible</Text>
          <Text style={profileStyles.notAvailableText}>
            Seuls les professionnels ont une page vitrine publique.
          </Text>
          <TouchableOpacity onPress={() => router.back()} style={profileStyles.backButton}>
            <Text style={profileStyles.backButtonText}>Retour</Text>
          </TouchableOpacity>
        </View>
      </>
    );
  }

  // Afficher le profil pro avec animations adaptées pour le web
  return (
    <>
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />
      <View style={profileStyles.container}>
        {/* Image hero avec effet parallax adapté pour le web */}
        <ProfileHeroImage
          imageUrl={profile.avatar_url}
          profileId={profileId || ''}
          profileName={`${profile.first_name} ${profile.last_name}`}
          parallaxImageStyle={parallaxImageStyle}
        />

        {/* ScrollView principal avec classes CSS pour optimisation web */}
        <Animated.ScrollView
          style={profileStyles.scrollView}
          className="profile-scroll-view"
          onScroll={scrollHandler}
          scrollEventThrottle={16}
          showsVerticalScrollIndicator={false}
          // Désactiver le bounce sur web pour une expérience plus native web
          bounces={false}
          // Optimisations pour le web
          decelerationRate="fast"
        >
          {/* Spacer pour le contenu scrollable */}
          <View style={{ height: IMAGE_HEIGHT }} />

          <Animated.View
            style={[profileStyles.content, contentAnimatedStyle]}
            className="animated-container"
            accessible={false}
          >
            {/* Informations du profil */}
            <ProfileInfo profile={profile} isProAvailable={isProAvailable} />

            {/* Section Disponibilités */}
            {proCourses.length > 0 && (
              <AvailabilitySection
                courses={proCourses}
                selectedCourseId={selectedCourseId}
                onCourseSelect={handleCourseSelect}
                isLoadingCourses={isLoadingCourses}
              />
            )}

            {/* Section Compétences */}
            <SkillsSection skills={proDetails} profileId={profileId || ''} />

            {/* Section Expérience */}
            {proDetails?.experience && <ExperienceSection experience={proDetails.experience} />}
          </Animated.View>
        </Animated.ScrollView>

        {/* Header animé avec classes CSS pour optimisation */}
        <ProfileHeader
          profile={profile}
          scrollY={scrollY}
          animatedHeaderStyle={animatedHeaderStyle}
          animatedHeaderContentStyle={animatedHeaderContentStyle}
          animatedHeaderIconsStyle={animatedHeaderIconsStyle}
          isFavorite={isFavorite}
          isToggling={isToggling}
          onToggleFavorite={toggleFavorite}
          isProAvailable={isProAvailable}
        />

        {/* Footer de réservation - Version FAB */}
        {/* Ne pas afficher le bouton de réservation si c'est son propre profil */}
        {user?.id !== profileId && (
          <BookingFAB
            price={currentPrice}
            players={numberOfPlayers}
            onPress={handleBooking}
            isAuthenticated={isAuthenticated}
          />
        )}
      </View>
    </>
  );
}