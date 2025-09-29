import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
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
// import { BookingFooter } from './sections/BookingFooter'; // Temporairement désactivé
import { BookingFAB } from './sections/BookingFAB';

// Styles
import { profileStyles, IMAGE_HEIGHT } from './styles/profileStyles';

export default function ProfileScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { isAuthenticated, user, loading: authLoading } = useAuth();
  const profileId = Array.isArray(id) ? id[0] : id;

  // Les profils pros sont des pages vitrines publiques accessibles sans authentification
  // La protection auth est gérée au niveau des actions (réservation, favoris)
  // via useProFavorite et booking-modal qui affichent des alertes appropriées

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

  // Hook pour les animations
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
    handleBooking,
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

  // Afficher un skeleton loader pendant le chargement du profil
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

  // Afficher le profil pro
  return (
    <>
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />
      <View style={profileStyles.container}>
        {/* Image hero avec effet parallax */}
        <ProfileHeroImage
          imageUrl={profile.avatar_url}
          profileId={profileId || ''}
          profileName={`${profile.first_name} ${profile.last_name}`}
          parallaxImageStyle={parallaxImageStyle}
        />

        {/* ScrollView principal */}
        <Animated.ScrollView
          style={profileStyles.scrollView}
          onScroll={scrollHandler}
          scrollEventThrottle={16}
          showsVerticalScrollIndicator={false}
        >
          {/* Spacer pour le contenu scrollable */}
          <View style={{ height: IMAGE_HEIGHT }} />

          <Animated.View style={[profileStyles.content, contentAnimatedStyle]} accessible={false}>
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

        {/* Header animé */}
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
            onPress={() => {
              router.push({
                pathname: '/booking-modal',
              params: {
                proId: profileId || '',
                proName: `${profile.first_name} ${profile.last_name}`,
                selectedCourseId: selectedCourseId || '',
                selectedCourseName: selectedCourseName || 'Golf sélectionné',
              },
            });
          }}
          isAuthenticated={isAuthenticated}
        />
        )}

        {/* Ancien Footer - Gardé en commentaire pour pouvoir revenir facilement */}
        {/* <BookingFooter
          price={currentPrice}
          players={numberOfPlayers}
          onPlayersChange={handlePlayersChange}
          onBook={handleBooking}
          isAuthenticated={isAuthenticated}
          bookingButtonText={bookingButtonText}
          bookingButtonAccessibilityLabel={getBookingButtonAccessibilityLabel()}
          bookingButtonAccessibilityHint={getBookingButtonAccessibilityHint()}
          canIncrementPlayers={canIncrementPlayers}
          canDecrementPlayers={canDecrementPlayers}
        /> */}
      </View>
    </>
  );
}
