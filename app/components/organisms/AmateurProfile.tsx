import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  RefreshControl,
  Pressable,
} from 'react-native';
import { useRouter } from 'expo-router';
import Animated, { FadeIn } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { Location05Icon, UserIcon, UserMultipleIcon, UserGroupIcon } from '@hugeicons/core-free-icons';
import { Colors, Spacing, Typography, BorderRadius, Elevation } from '@/constants/theme';
import { Text, LoadingScreen, Avatar } from '@/components/atoms';
import { FullProfile } from '@/services/profile.service';
import { bookingService, BookingWithDetails } from '@/services/booking.service';
import { CancelBookingBottomSheet } from './CancelBookingBottomSheet';
import { AmateurProfileEditBottomSheet } from './AmateurProfileEditBottomSheet';

const DEFAULT_AVATAR =
  'https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=400&h=400&fit=crop&crop=center';

interface AmateurProfileProps {
  profile: FullProfile;
  onRefresh: () => Promise<void>;
  openSection?: string;
}

export function AmateurProfile({ profile, onRefresh, openSection }: AmateurProfileProps) {
  const router = useRouter();
  const scrollViewRef = useRef<ScrollView>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [upcomingBookings, setUpcomingBookings] = useState<BookingWithDetails[]>([]);
  const [pastBookings, setPastBookings] = useState<BookingWithDetails[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(true);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [showAllBookings, setShowAllBookings] = useState(false);
  const [cancelBottomSheetVisible, setCancelBottomSheetVisible] = useState(false);
  const [selectedBookingToCancel, setSelectedBookingToCancel] = useState<BookingWithDetails | null>(
    null
  );
  const [editBottomSheetVisible, setEditBottomSheetVisible] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    await onRefresh();
    await loadBookings();
    setRefreshing(false);
  };

  const loadBookings = async () => {
    if (!profile.id) return;

    try {
      setLoadingBookings(true);
      const today = new Date().toISOString().split('T')[0];

      // Réservations à venir (inclure pending et confirmed)
      const { data: upcoming } = await bookingService.listBookings(
        {
          userId: profile.id,
          startDate: today,
        },
        { limit: 5 }
      );

      // Filtrer pour inclure les réservations payées (pending et confirmed)
      const filteredUpcoming = (upcoming || []).filter(
        (booking) => booking.status === 'pending' || booking.status === 'confirmed'
      );

      // Trier par date et heure de partie (de la plus proche à la plus loin)
      const sortedUpcoming = filteredUpcoming.sort((a, b) => {
        const dateTimeA = new Date(`${a.booking_date}T${a.start_time}`);
        const dateTimeB = new Date(`${b.booking_date}T${b.start_time}`);
        return dateTimeA.getTime() - dateTimeB.getTime();
      });

      // Réservations passées pour les stats
      const { data: past } = await bookingService.listBookings(
        {
          userId: profile.id,
          endDate: today,
          status: 'completed',
        },
        { limit: 10 }
      );

      setUpcomingBookings(sortedUpcoming || []);
      setPastBookings(past || []);
    } catch (error) {
      console.error('Erreur chargement réservations:', error);
    } finally {
      setLoadingBookings(false);
    }
  };

  useEffect(() => {
    loadBookings();
  }, [profile.id]);

  // Ouvrir automatiquement la section demandée
  useEffect(() => {
    if (openSection === 'mes-parties') {
      setExpandedSection('mes-parties');
      // Scroll vers la section des réservations après un délai pour laisser le temps au rendu
      setTimeout(() => {
        scrollViewRef.current?.scrollTo({ y: 400, animated: true });
      }, 500);
    }
  }, [openSection]);

  const totalGamesPlayed = pastBookings.length;
  const favoriteGolfCourse =
    pastBookings.length > 0
      ? pastBookings.reduce(
          (acc, booking) => {
            const course = booking.golf_parcours?.name || 'Golf Course';
            acc[course] = (acc[course] || 0) + 1;
            return acc;
          },
          {} as Record<string, number>
        )
      : {};

  const mostPlayedCourse =
    Object.keys(favoriteGolfCourse).length > 0
      ? Object.entries(favoriteGolfCourse).sort((a, b) => b[1] - a[1])[0][0]
      : 'Aucun';

  const handleFindPros = () => {
    router.push('/(tabs)/pros');
  };

  const handleBookGame = () => {
    router.push('/(tabs)/pros');
  };

  const handleCancelBooking = (booking: BookingWithDetails) => {
    setSelectedBookingToCancel(booking);
    setCancelBottomSheetVisible(true);
  };

  const handleConfirmCancel = async (bookingId: string) => {
    try {
      const response = await bookingService.cancelBooking(bookingId);

      if (response.error) {
        console.error('Erreur annulation:', response.error);
        // TODO: Afficher une erreur à l'utilisateur
        throw new Error(response.error.message);
      }

      console.log('Réservation annulée avec succès:', response.data);

      // Recharger les réservations après annulation
      await loadBookings();
    } catch (error) {
      console.error("Erreur lors de l'annulation:", error);
      throw error; // Relancer l'erreur pour que la BottomSheet puisse la gérer
    }
  };

  const handleCloseCancelBottomSheet = () => {
    setCancelBottomSheetVisible(false);
    setSelectedBookingToCancel(null);
  };

  const handleEditProfile = () => {
    setEditBottomSheetVisible(true);
  };

  const handleCloseEditBottomSheet = () => {
    setEditBottomSheetVisible(false);
  };

  const handleProfileUpdated = async () => {
    await loadBookings();
  };

  // Fonction pour obtenir l'icône selon le nombre de joueurs
  const getPlayerIcon = (numberOfPlayers: number | null) => {
    switch (numberOfPlayers) {
      case 1:
        return UserIcon;
      case 2:
        return UserMultipleIcon;
      case 3:
      default:
        return UserGroupIcon;
    }
  };

  // Fonction pour obtenir le texte selon le nombre de joueurs
  const getPlayerText = (numberOfPlayers: number | null) => {
    const count = numberOfPlayers || 1;
    return count === 1 ? '1 joueur' : `${count} joueurs`;
  };

  if (loadingBookings) {
    return <LoadingScreen message="Chargement de votre profil..." />;
  }

  return (
    <View style={styles.container}>
      {/* Profile Header */}
      <TouchableOpacity style={styles.profileHeader} onPress={handleEditProfile} activeOpacity={0.9}>
        <View style={styles.avatarContainer}>
          <Avatar
            imageUrl={profile.avatar_url}
            name={`${profile.first_name} ${profile.last_name}`}
            size="medium"
            borderWidth={0}
          />
        </View>
        <View style={styles.profileInfo}>
          <Text variant="h3" color="charcoal" weight="semiBold">
            {profile.first_name} {profile.last_name}
          </Text>
          <View style={styles.profileMeta}>
            {/* Handicap */}
            {profile.amateur_profiles?.handicap !== null && (
              <Text variant="caption" color="charcoal" weight="medium">
                Handicap {profile.amateur_profiles?.handicap}
              </Text>
            )}

            {/* Numéro de licence */}
            {profile.amateur_profiles?.license_number && (
              <Text variant="caption" color="charcoal" weight="medium">
                Licence {profile.amateur_profiles.license_number}
              </Text>
            )}
          </View>
        </View>
        <View style={styles.editIcon}>
          <Ionicons name="chevron-forward" size={20} color={Colors.neutral.iron} />
        </View>
      </TouchableOpacity>

      <ScrollView
        ref={scrollViewRef}
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
      >
        {/* Mes Parties */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text variant="h3" color="charcoal" weight="semiBold">
              Mes Parties
            </Text>
            {upcomingBookings.length > 5 && (
              <TouchableOpacity onPress={() => setShowAllBookings(!showAllBookings)}>
                <Text variant="caption" color="accent" weight="medium">
                  {showAllBookings ? 'Voir moins' : `Voir tout (${upcomingBookings.length})`}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {upcomingBookings && upcomingBookings.length > 0 ? (
            <View style={styles.bookingsContainer}>
              {upcomingBookings.slice(0, showAllBookings ? upcomingBookings.length : 5).map((booking) => (
                <View
                  key={booking.id}
                  style={[
                    styles.bookingCard,
                    booking.status === 'confirmed' ? styles.confirmedCard : styles.pendingCard,
                  ]}
                >
                  {/* Badge statut en haut à droite */}
                  <View
                    style={[
                      styles.statusBadgeCorner,
                      booking.status === 'confirmed' ? styles.confirmedBadge : styles.pendingBadge,
                    ]}
                  >
                    <Ionicons
                      name={booking.status === 'confirmed' ? 'checkmark-circle' : 'time'}
                      size={24}
                      color={Colors.neutral.white}
                    />
                  </View>

                  <View style={styles.bookingContent}>
                    {/* Avatar à gauche */}
                    <Avatar
                      imageUrl={booking.pro_profile?.profile?.avatar_url}
                      name={`${booking.pro_profile?.profile?.first_name || 'Pro'} ${booking.pro_profile?.profile?.last_name || ''}`}
                      size="large"
                    />

                    {/* Informations au centre */}
                    <View style={styles.bookingInfo}>
                      {/* Nom du pro */}
                      <Text variant="body" color="charcoal" weight="semiBold">
                        {booking.pro_profile?.profile?.first_name || 'Pro'}{' '}
                        {booking.pro_profile?.profile?.last_name || ''}
                      </Text>

                      {/* Golf */}
                      <Text variant="caption" color="charcoal">
                        {booking.golf_parcours?.name || 'Golf Course'}
                      </Text>

                      {/* Bouton Annuler discret */}
                      <TouchableOpacity
                        style={styles.cancelButton}
                        onPress={() => handleCancelBooking(booking)}
                      >
                        <Text variant="caption" color="iron" weight="medium">
                          Annuler
                        </Text>
                      </TouchableOpacity>
                    </View>

                    {/* Date et heure à droite */}
                    <View style={styles.bookingDateTime}>
                      <View style={styles.dateBadge}>
                        <Text variant="caption" color="white" weight="semiBold">
                          {new Date(booking.booking_date).toLocaleDateString('fr-FR', {
                            day: '2-digit',
                            month: '2-digit',
                          })}
                        </Text>
                        <Text variant="caption" color="white" style={styles.timeText}>
                          {booking.start_time.slice(0, 5)}
                        </Text>
                      </View>

                      {/* Nombre de joueurs */}
                      <View style={styles.playersInfo}>
                        <HugeiconsIcon
                          icon={getPlayerIcon(booking.number_of_players)}
                          size={32}
                          color={Colors.neutral.iron}
                        />
                        <Text variant="caption" color="iron" style={styles.playersText}>
                          {getPlayerText(booking.number_of_players)}
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="golf-outline" size={64} color={Colors.neutral.course} />
              <Text variant="h3" color="charcoal" style={styles.emptyTitle}>
                Aucune partie prévue
              </Text>
              <Text variant="body" color="gray" style={styles.emptyText}>
                Découvrez nos professionnels et réservez votre prochaine partie de golf
              </Text>
              <TouchableOpacity style={styles.primaryButton} onPress={handleBookGame}>
                <Ionicons name="add" size={20} color={Colors.neutral.white} />
                <Text variant="body" color="white" weight="medium">
                  Trouver un pro
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>

      {/* BottomSheet d'annulation */}
      <CancelBookingBottomSheet
        visible={cancelBottomSheetVisible}
        booking={selectedBookingToCancel}
        userType="amateur"
        onClose={handleCloseCancelBottomSheet}
        onConfirmCancel={handleConfirmCancel}
      />

      {/* Modal d'édition du profil */}
      <AmateurProfileEditBottomSheet
        profile={profile}
        visible={editBottomSheetVisible}
        onClose={handleCloseEditBottomSheet}
        onProfileUpdated={handleProfileUpdated}
      />

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.neutral.background,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 0, // Pas de padding côté avatar
    paddingRight: Spacing.l,
    paddingVertical: 0, // Pas de padding vertical
    height: 68, // Hauteur de la capsule
    marginHorizontal: Spacing.m,
    marginVertical: Spacing.s,
    backgroundColor: Colors.neutral.white,
    borderTopLeftRadius: 34, // Rayon identique à l'avatar
    borderBottomLeftRadius: 34,
    borderTopRightRadius: 34,
    borderBottomRightRadius: 34,
    ...Elevation.small,
    shadowColor: Colors.neutral.charcoal,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  avatarContainer: {
    width: 68,
    height: 68,
    borderRadius: 34,
    borderWidth: 0, // Pas de bordure pour fusion parfaite
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.m,
    marginLeft: 0, // Aligné parfaitement
    backgroundColor: 'transparent', // Transparent pour fusion
  },
  profileInfo: {
    flex: 1,
  },
  profileMeta: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    marginTop: 0, // Suppression de l'espace
    gap: Spacing.xxs,
  },
  infoChip: {
    backgroundColor: Colors.neutral.cloud,
    paddingHorizontal: Spacing.s,
    paddingVertical: Spacing.xxs / 2,
    borderRadius: BorderRadius.small,
    borderWidth: 1,
    borderColor: Colors.neutral.mist,
  },
  editIcon: {
    marginLeft: 'auto',
    paddingLeft: Spacing.s,
  },
  content: {
    flex: 1,
  },
  card: {
    marginHorizontal: Spacing.m,
    marginTop: Spacing.m,
    padding: Spacing.m,
  },
  cardTitle: {
    marginBottom: Spacing.m,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.m,
  },
  bookingCard: {
    padding: Spacing.m,
    backgroundColor: Colors.neutral.white,
    borderRadius: BorderRadius.large,
    marginBottom: Spacing.xs,
    borderWidth: 2,
    ...Elevation.small,
  },
  confirmedCard: {
    borderColor: Colors.semantic.success.default,
  },
  pendingCard: {
    borderColor: Colors.semantic.warning.default,
  },
  bookingContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.m,
  },
  bookingInfo: {
    flex: 1,
    gap: Spacing.xs,
  },
  statusBadgeCorner: {
    position: 'absolute',
    top: -16,
    right: -16,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  confirmedBadge: {
    backgroundColor: Colors.semantic.success.default,
  },
  pendingBadge: {
    backgroundColor: Colors.semantic.warning.default,
  },
  cancelButton: {
    marginTop: Spacing.xs,
    alignSelf: 'flex-start',
  },
  bookingDateTime: {
    alignItems: 'center',
  },
  dateBadge: {
    backgroundColor: Colors.neutral.charcoal,
    paddingHorizontal: Spacing.xs,
    paddingVertical: Spacing.xxs,
    borderRadius: BorderRadius.small,
    alignItems: 'center',
    minWidth: 50,
  },
  timeText: {
    marginTop: 1,
  },
  playersInfo: {
    alignItems: 'center',
    marginTop: Spacing.xs,
    gap: Spacing.xxs,
  },
  playersText: {
    fontSize: 10,
    lineHeight: 12,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: Spacing.l,
    marginBottom: Spacing.m,
  },
  bookingsContainer: {
    gap: Spacing.s,
  },
  bookingLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  courseName: {
    flex: 1,
  },
  actionsContainer: {
    marginHorizontal: Spacing.m,
    marginTop: Spacing.l,
    gap: Spacing.m,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.m,
    backgroundColor: Colors.primary.accent,
    borderRadius: BorderRadius.medium,
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.m,
    backgroundColor: Colors.neutral.white,
    borderRadius: BorderRadius.medium,
    borderWidth: 1,
    borderColor: Colors.primary.accent,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing.xxl,
  },
  emptyTitle: {
    marginTop: Spacing.l,
    marginBottom: Spacing.m,
    textAlign: 'center',
  },
  emptyText: {
    textAlign: 'center',
    marginBottom: Spacing.xl,
    paddingHorizontal: Spacing.l,
    lineHeight: 22,
  },
});
