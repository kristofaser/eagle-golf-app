import React, { useState, useEffect } from 'react';
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
import Animated, {
  FadeIn,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withDelay
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { GolfCartIcon, Location05Icon, EuroIcon, CalendarIcon, UserIcon, Settings02Icon, TrophyIcon } from '@hugeicons/core-free-icons';
import { Colors, Spacing, Typography, BorderRadius, Elevation } from '@/constants/theme';
import { Text, LoadingScreen, Avatar } from '@/components/atoms';
import { FullProfile } from '@/services/profile.service';
import { bookingService, Booking } from '@/services/booking.service';
import { CancelBookingBottomSheet } from './CancelBookingBottomSheet';
import { ProProfileEditBottomSheet } from './ProProfileEditBottomSheet';

const DEFAULT_AVATAR =
  'https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=400&h=400&fit=crop&crop=center';


interface ProProfileProps {
  profile: FullProfile;
  onRefresh: () => Promise<void>;
  openSection?: string;
}


export function ProProfile({ profile, onRefresh, openSection }: ProProfileProps) {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const [fabMenuOpen, setFabMenuOpen] = useState(false);
  const [menuItemsVisible, setMenuItemsVisible] = useState(false);

  // Animations FAB
  const fabScale = useSharedValue(0);
  const fabTranslateY = useSharedValue(50);

  // Animations menu items
  const menuItem1Scale = useSharedValue(0);
  const menuItem1TranslateY = useSharedValue(50);
  const menuItem2Scale = useSharedValue(0);
  const menuItem2TranslateY = useSharedValue(50);
  const menuItem3Scale = useSharedValue(0);
  const menuItem3TranslateY = useSharedValue(50);

  // Styles d'animation FAB
  const fabAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: fabScale.value },
      { translateY: fabTranslateY.value }
    ],
  }));

  // Styles d'animation menu items
  const menuItem1AnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: menuItem1Scale.value },
      { translateY: menuItem1TranslateY.value }
    ],
  }));

  const menuItem2AnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: menuItem2Scale.value },
      { translateY: menuItem2TranslateY.value }
    ],
  }));

  const menuItem3AnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: menuItem3Scale.value },
      { translateY: menuItem3TranslateY.value }
    ],
  }));
  const [upcomingBookings, setUpcomingBookings] = useState<Booking[]>([]);
  const [pastBookings, setPastBookings] = useState<Booking[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(true);
  const [cancelBottomSheetVisible, setCancelBottomSheetVisible] = useState(false);
  const [selectedBookingToCancel, setSelectedBookingToCancel] = useState<Booking | null>(null);
  const [editBottomSheetVisible, setEditBottomSheetVisible] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    await onRefresh();
    await loadBookings();
    setRefreshing(false);
  };

  const loadBookings = async () => {
    try {
      setLoadingBookings(true);
      const today = new Date().toISOString().split('T')[0];

      // Réservations à venir comme professionnel (inclure pending et confirmed)
      const { data: upcoming } = await bookingService.listBookings(
        {
          proId: profile.id,
          startDate: today,
        },
        { limit: 5 }
      );

      // Filtrer pour inclure les réservations payées (pending et confirmed)
      const filteredUpcoming = Array.isArray(upcoming)
        ? upcoming.filter(
            (booking) => booking.status === 'pending' || booking.status === 'confirmed'
          )
        : [];

      // Réservations passées pour les stats
      const { data: past } = await bookingService.listBookings(
        {
          proId: profile.id,
          endDate: today,
          status: 'completed',
        },
        { limit: 10 }
      );

      setUpcomingBookings(filteredUpcoming);
      setPastBookings(Array.isArray(past) ? past : []);
    } catch (error) {
      console.error('Erreur chargement réservations:', error);
    } finally {
      setLoadingBookings(false);
    }
  };

  useEffect(() => {
    loadBookings();
  }, [profile.id]);


  const totalGamesPlayed = pastBookings.length;
  const proProfile = profile?.pro_profiles || null;

  const handleFindClients = () => {
    router.push('/(tabs)/pros');
  };

  const handleManagePricing = () => {
    router.push('/profile/pricing');
  };

  const handleManageAvailability = () => {
    router.push('/profile/availability');
  };

  // Animation FAB au montage du composant
  useEffect(() => {
    // Animation d'entrée avec délai
    fabScale.value = 0;
    fabTranslateY.value = 50;

    // Animation Pop-in
    fabScale.value = withDelay(
      300,
      withSpring(1, {
        tension: 100,
        friction: 8,
      })
    );

    fabTranslateY.value = withDelay(
      300,
      withSpring(0, {
        tension: 80,
        friction: 8,
      })
    );
  }, []);

  // Animation des menu items lors de l'ouverture/fermeture
  useEffect(() => {
    if (fabMenuOpen) {
      // Montrer les items immédiatement
      setMenuItemsVisible(true);

      // Animation d'ouverture avec staggered effect plus réactif
      // Item 1 (le plus proche) - immédiat
      menuItem1Scale.value = withDelay(
        0,
        withSpring(1, { tension: 250, friction: 8 })
      );
      menuItem1TranslateY.value = withDelay(
        0,
        withSpring(0, { tension: 180, friction: 8 })
      );

      // Item 2 (milieu) - délai réduit
      menuItem2Scale.value = withDelay(
        50,
        withSpring(1, { tension: 250, friction: 8 })
      );
      menuItem2TranslateY.value = withDelay(
        50,
        withSpring(0, { tension: 180, friction: 8 })
      );

      // Item 3 (le plus loin) - délai réduit
      menuItem3Scale.value = withDelay(
        100,
        withSpring(1, { tension: 250, friction: 8 })
      );
      menuItem3TranslateY.value = withDelay(
        100,
        withSpring(0, { tension: 180, friction: 8 })
      );
    } else if (menuItemsVisible) {
      // Animation de fermeture avec cascade inversée
      // Item 3 (le plus loin) se ferme en premier
      menuItem3Scale.value = withDelay(
        0,
        withSpring(0, { tension: 250, friction: 8 })
      );
      menuItem3TranslateY.value = withDelay(
        0,
        withSpring(50, { tension: 180, friction: 8 })
      );

      // Item 2 (milieu) suit
      menuItem2Scale.value = withDelay(
        50,
        withSpring(0, { tension: 250, friction: 8 })
      );
      menuItem2TranslateY.value = withDelay(
        50,
        withSpring(50, { tension: 180, friction: 8 })
      );

      // Item 1 (le plus proche) se ferme en dernier
      menuItem1Scale.value = withDelay(
        100,
        withSpring(0, { tension: 250, friction: 8 })
      );
      menuItem1TranslateY.value = withDelay(
        100,
        withSpring(50, { tension: 180, friction: 8 })
      );

      // Masquer les items après l'animation de fermeture (200ms total)
      setTimeout(() => {
        setMenuItemsVisible(false);
      }, 200);
    }
  }, [fabMenuOpen]);

  const handleCancelBooking = (booking: Booking) => {
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

  if (loadingBookings) {
    return <LoadingScreen message="Chargement de votre profil..." />;
  }

  // Safety check: ensure profile data is complete before rendering
  if (!profile || !profile.id) {
    return <LoadingScreen message="Chargement du profil..." />;
  }

  const handleEditProfile = () => {
    setEditBottomSheetVisible(true);
  };

  const handleCloseEditBottomSheet = () => {
    setEditBottomSheetVisible(false);
  };

  const handleProfileUpdated = async () => {
    await onRefresh();
    await loadBookings();
  };

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
            {profile.first_name || ''} {profile.last_name || ''}
          </Text>
          <View style={styles.profileMeta}>
            {/* Division */}
            {proProfile?.division && (
              <Text variant="caption" color="charcoal" weight="medium">
                {proProfile.division}
              </Text>
            )}
          </View>
        </View>
        <View style={styles.editIcon}>
          <Ionicons name="chevron-forward" size={20} color={Colors.neutral.iron} />
        </View>
      </TouchableOpacity>


      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
      >
        {/* Parties Content */}
        <Animated.View entering={FadeIn.duration(300)}>
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text variant="body" weight="semiBold" color="charcoal">
                  Mes Parties
                </Text>
                {upcomingBookings && upcomingBookings.length > 3 && (
                  <TouchableOpacity>
                    <Text variant="caption" color="accent">
                      Voir tout ({upcomingBookings?.length || 0})
                    </Text>
                  </TouchableOpacity>
                )}
              </View>

              {Array.isArray(upcomingBookings) && upcomingBookings.length > 0 ? (
                <View style={styles.bookingsContainer}>
                  {upcomingBookings && upcomingBookings.slice(0, 5).map((booking) => booking ? (
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
                          booking.status === 'confirmed'
                            ? styles.confirmedBadge
                            : styles.pendingBadge,
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
                          imageUrl={booking?.amateur_profile?.avatar_url}
                          name={`${booking?.amateur_profile?.first_name || 'Amateur'} ${booking?.amateur_profile?.last_name || ''}`}
                          size="large"
                        />

                        {/* Informations au centre */}
                        <View style={styles.bookingInfo}>
                          {/* Nom de l'amateur */}
                          <Text variant="body" color="charcoal" weight="semiBold">
                            {booking?.amateur_profile?.first_name || 'Amateur'}{' '}
                            {booking?.amateur_profile?.last_name || ''}
                          </Text>

                          {/* Golf */}
                          <Text variant="caption" color="charcoal">
                            {booking?.golf_parcours?.name || 'Golf Course'}
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
                              {booking?.booking_date
                                ? new Date(booking.booking_date).toLocaleDateString('fr-FR', {
                                    day: '2-digit',
                                    month: '2-digit',
                                  })
                                : '--/--'
                              }
                            </Text>
                            <Text variant="caption" color="white" style={styles.timeText}>
                              {booking?.start_time?.slice(0, 5) || '--:--'}
                            </Text>
                          </View>
                        </View>
                      </View>
                    </View>
                  ) : null)}
                </View>
              ) : (
                <View style={styles.emptyState}>
                  <HugeiconsIcon
                    icon={GolfCartIcon}
                    size={48}
                    color={Colors.neutral.mist}
                    strokeWidth={1.5}
                  />
                  <Text variant="body" color="iron" style={styles.emptyTitle}>
                    Aucune partie prévue
                  </Text>
                  <Text variant="caption" color="gray" style={styles.emptyText}>
                    Vos prochaines parties avec des amateurs apparaîtront ici
                  </Text>
                </View>
              )}
            </View>
        </Animated.View>
      </ScrollView>

      {/* FAB Menu */}
      <View style={styles.fabContainer}>
        {/* Menu Items */}
        {menuItemsVisible && (
          <>
            <Animated.View style={[styles.fabMenuItem, { bottom: 260 }, menuItem3AnimatedStyle]}>
              <TouchableOpacity
                style={styles.fabMenuItemButton}
                onPress={() => {
                  setFabMenuOpen(false);
                  router.push('/profile/experiences');
                }}
              >
                <View style={styles.fabMenuItemIcon}>
                  <HugeiconsIcon icon={GolfCartIcon} size={16} color={Colors.primary.navy} />
                </View>
                <Text style={styles.fabMenuItemText}>
                  Mes expériences
                </Text>
              </TouchableOpacity>
            </Animated.View>

            <Animated.View style={[styles.fabMenuItem, { bottom: 200 }, menuItem3AnimatedStyle]}>
              <TouchableOpacity
                style={styles.fabMenuItemButton}
                onPress={() => {
                  setFabMenuOpen(false);
                  router.push('/profile/pro-settings');
                }}
              >
                <View style={styles.fabMenuItemIcon}>
                  <HugeiconsIcon icon={UserIcon} size={16} color={Colors.primary.navy} />
                </View>
                <Text style={styles.fabMenuItemText}>
                  Mes skills
                </Text>
              </TouchableOpacity>
            </Animated.View>

            <Animated.View style={[styles.fabMenuItem, { bottom: 140 }, menuItem2AnimatedStyle]}>
              <TouchableOpacity
                style={styles.fabMenuItemButton}
                onPress={() => {
                  setFabMenuOpen(false);
                  handleManageAvailability();
                }}
              >
                <View style={styles.fabMenuItemIcon}>
                  <HugeiconsIcon icon={CalendarIcon} size={16} color={Colors.primary.navy} />
                </View>
                <Text style={styles.fabMenuItemText}>
                  Mes dispos
                </Text>
              </TouchableOpacity>
            </Animated.View>

            <Animated.View style={[styles.fabMenuItem, { bottom: 80 }, menuItem1AnimatedStyle]}>
              <TouchableOpacity
                style={styles.fabMenuItemButton}
                onPress={() => {
                  setFabMenuOpen(false);
                  handleManagePricing();
                }}
              >
                <View style={styles.fabMenuItemIcon}>
                  <HugeiconsIcon icon={EuroIcon} size={16} color={Colors.primary.navy} />
                </View>
                <Text style={styles.fabMenuItemText}>
                  Mes tarifs
                </Text>
              </TouchableOpacity>
            </Animated.View>
          </>
        )}

        {/* Main FAB */}
        <Animated.View style={[styles.fab, fabAnimatedStyle]}>
          <TouchableOpacity
            style={styles.fabButton}
            onPress={() => setFabMenuOpen(!fabMenuOpen)}
            activeOpacity={0.8}
          >
            <HugeiconsIcon icon={Settings02Icon} size={20} color={Colors.neutral.white} />
          </TouchableOpacity>
        </Animated.View>
      </View>

      {/* BottomSheet d'annulation */}
      <CancelBookingBottomSheet
        visible={cancelBottomSheetVisible}
        booking={selectedBookingToCancel}
        userType="pro"
        onClose={handleCloseCancelBottomSheet}
        onConfirmCancel={handleConfirmCancel}
      />

      {/* BottomSheet d'édition du profil */}
      <ProProfileEditBottomSheet
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
  bookingsContainer: {
    gap: Spacing.s,
  },
  bookingCard: {
    backgroundColor: Colors.neutral.white,
    borderRadius: BorderRadius.large,
    padding: Spacing.m,
    marginBottom: Spacing.s,
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
  },
  bookingInfo: {
    flex: 1,
    marginLeft: Spacing.m,
    gap: Spacing.xs,
  },
  bookingLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xxs,
  },
  courseName: {
    flex: 1,
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
    alignItems: 'flex-end',
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
  ctaButton: {
    backgroundColor: Colors.primary.accent,
    paddingVertical: Spacing.s,
    paddingHorizontal: Spacing.l,
    borderRadius: BorderRadius.medium,
    marginTop: Spacing.m,
  },
  emptyBox: {
    alignItems: 'center',
    paddingVertical: Spacing.l,
    backgroundColor: Colors.neutral.background,
    borderRadius: BorderRadius.small,
    marginVertical: Spacing.xs,
  },
  pricingGrid: {
    flexDirection: 'row',
    gap: Spacing.m,
    marginBottom: Spacing.m,
  },
  pricingItem: {
    flex: 1,
    alignItems: 'center',
    padding: Spacing.m,
    backgroundColor: Colors.neutral.background,
    borderRadius: BorderRadius.small,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    marginTop: Spacing.m,
    paddingVertical: Spacing.m,
    backgroundColor: Colors.neutral.white,
    borderRadius: BorderRadius.medium,
    borderWidth: 1,
    borderColor: Colors.primary.accent,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
  },
  emptyTitle: {
    marginTop: Spacing.s,
    marginBottom: Spacing.xs,
  },
  emptyText: {
    textAlign: 'center',
    marginBottom: Spacing.m,
  },
  // FAB Styles
  fabContainer: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    zIndex: 1000,
  },
  fab: {
    backgroundColor: Colors.primary.navy,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.neutral.charcoal,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 12,
  },
  fabMenuItem: {
    position: 'absolute',
    right: 0,
    backgroundColor: Colors.primary.navy,
    borderRadius: 25,
    shadowColor: Colors.neutral.charcoal,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
    minWidth: 200,
  },
  fabMenuItemButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  fabMenuItemIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.neutral.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  fabMenuItemText: {
    flex: 1,
    color: Colors.neutral.white,
    fontSize: 13,
    fontWeight: '600',
  },
  fabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  fabText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.neutral.white,
  },
});
