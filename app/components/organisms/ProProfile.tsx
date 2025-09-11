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
import Animated, { FadeIn } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { GolfCartIcon, Location05Icon } from '@hugeicons/core-free-icons';
import { Colors, Spacing, Typography, BorderRadius, Elevation } from '@/constants/theme';
import { Text, LoadingScreen, Avatar } from '@/components/atoms';
import { ProPricingDisplay } from '@/components/molecules/ProPricingDisplay';
import { ProAvailabilityDisplay } from '@/components/molecules/ProAvailabilityDisplay';
import { FullProfile } from '@/services/profile.service';
import { bookingService, Booking } from '@/services/booking.service';
import { useProProfileTab } from '@/contexts/ProProfileContext';

const DEFAULT_AVATAR =
  'https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=400&h=400&fit=crop&crop=center';

interface ProProfileProps {
  profile: FullProfile;
  onRefresh: () => Promise<void>;
}

type TabType = 'parties' | 'services';

export function ProProfile({ profile, onRefresh }: ProProfileProps) {
  const router = useRouter();
  const { activeTab, setActiveTab } = useProProfileTab();
  const [refreshing, setRefreshing] = useState(false);
  const [upcomingBookings, setUpcomingBookings] = useState<Booking[]>([]);
  const [pastBookings, setPastBookings] = useState<Booking[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(true);

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
      const filteredUpcoming = (upcoming || []).filter(
        (booking) => booking.status === 'pending' || booking.status === 'confirmed'
      );

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

  const totalGamesPlayed = pastBookings.length;
  const proProfile = profile.pro_profiles;
  const averageRating = 4.8; // TODO: Calculer depuis les reviews
  const totalReviews = 12; // TODO: Calculer depuis les reviews

  const handleFindClients = () => {
    router.push('/(tabs)/pros');
  };

  const handleManagePricing = () => {
    router.push('/profile/pricing');
  };

  const handleManageAvailability = () => {
    router.push('/profile/availability');
  };

  if (loadingBookings) {
    return <LoadingScreen message="Chargement de votre profil..." />;
  }

  return (
    <View style={styles.container}>
      {/* Profile Header */}
      <View style={styles.profileHeader}>
        <View style={styles.avatarContainer}>
          <Avatar
            imageUrl={profile.avatar_url}
            name={`${profile.first_name} ${profile.last_name}`}
            size="large"
            variant="elevated"
          />
        </View>
        <View style={styles.profileInfo}>
          <Text variant="h3" color="charcoal" weight="semiBold">
            {profile.first_name} {profile.last_name}
          </Text>
          <View style={styles.profileMeta}>
            <View style={styles.ratingContainer}>
              <Ionicons name="star" size={14} color={Colors.secondary.champion} />
              <Text variant="body" color="iron">
                {averageRating.toFixed(1)} ({totalReviews})
              </Text>
            </View>
            {proProfile?.division && (
              <>
                <Text variant="body" color="iron">
                  {' '}
                  •{' '}
                </Text>
                <Text variant="body" color="iron">
                  {proProfile.division}
                </Text>
              </>
            )}
          </View>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        <Pressable
          style={[styles.tab, activeTab === 'parties' && styles.activeTab]}
          onPress={() => setActiveTab('parties')}
        >
          <Text
            variant="body"
            color={activeTab === 'parties' ? 'accent' : 'iron'}
            weight={activeTab === 'parties' ? 'semiBold' : 'medium'}
          >
            Parties
          </Text>
        </Pressable>
        <Pressable
          style={[styles.tab, activeTab === 'services' && styles.activeTab]}
          onPress={() => setActiveTab('services')}
        >
          <Text
            variant="body"
            color={activeTab === 'services' ? 'accent' : 'iron'}
            weight={activeTab === 'services' ? 'semiBold' : 'medium'}
          >
            Services
          </Text>
        </Pressable>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
      >
        {/* Parties Tab Content */}
        {activeTab === 'parties' && (
          <Animated.View entering={FadeIn.duration(300)}>
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text variant="body" weight="semiBold" color="charcoal">
                  Mes Parties
                </Text>
                {upcomingBookings.length > 3 && (
                  <TouchableOpacity>
                    <Text variant="caption" color="accent">
                      Voir tout ({upcomingBookings.length})
                    </Text>
                  </TouchableOpacity>
                )}
              </View>

              {upcomingBookings.length > 0 ? (
                <View style={styles.bookingsContainer}>
                  {upcomingBookings.slice(0, 5).map((booking) => (
                    <View key={booking.id} style={styles.bookingCard}>
                      <View style={styles.bookingContent}>
                        {/* Avatar à gauche */}
                        <Avatar
                          imageUrl={booking.amateur_profiles?.profiles?.avatar_url}
                          name={`${booking.amateur_profiles?.profiles?.first_name || 'Amateur'} ${booking.amateur_profiles?.profiles?.last_name || ''}`}
                          size="large"
                        />

                        {/* Informations empilées à droite */}
                        <View style={styles.bookingInfo}>
                          {/* Nom de l'amateur */}
                          <Text variant="body" color="charcoal" weight="semiBold">
                            {booking.amateur_profiles?.profiles?.first_name || 'Amateur'}{' '}
                            {booking.amateur_profiles?.profiles?.last_name || ''}
                          </Text>

                          {/* Golf avec icône */}
                          <View style={styles.bookingLocation}>
                            <HugeiconsIcon
                              icon={Location05Icon}
                              size={14}
                              color={Colors.primary.accent}
                              strokeWidth={2}
                            />
                            <Text variant="caption" color="charcoal" style={styles.courseName}>
                              {booking.golf_parcours?.name || 'Golf Course'}
                            </Text>
                          </View>

                          {/* Date et heure */}
                          <Text variant="caption" color="iron">
                            {new Date(booking.booking_date).toLocaleDateString('fr-FR', {
                              weekday: 'long',
                              day: '2-digit',
                              month: 'long',
                            })}{' '}
                            à {booking.start_time.slice(0, 5)}
                          </Text>

                          {/* Badge statut sous la date */}
                          <View
                            style={[
                              styles.statusBadgeInline,
                              booking.status === 'confirmed'
                                ? styles.confirmedBadge
                                : styles.pendingBadge,
                            ]}
                          >
                            <Text variant="caption" color="white" weight="medium">
                              {booking.status === 'confirmed'
                                ? 'Confirmé'
                                : 'En attente de confirmation'}
                            </Text>
                          </View>
                        </View>
                      </View>
                    </View>
                  ))}
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
        )}

        {/* Services Tab Content */}
        {activeTab === 'services' && (
          <Animated.View entering={FadeIn.duration(300)}>
            {/* Pricing */}
            <View style={styles.card}>
              <ProPricingDisplay proId={profile.id} />
              <TouchableOpacity style={styles.actionButton} onPress={handleManagePricing}>
                <Ionicons name="settings-outline" size={20} color={Colors.primary.accent} />
                <Text variant="body" color="accent" weight="medium">
                  Gérer mes tarifs
                </Text>
              </TouchableOpacity>
            </View>

            {/* Availability */}
            <View style={styles.card}>
              <ProAvailabilityDisplay proId={profile.id} />
              <TouchableOpacity style={styles.actionButton} onPress={handleManageAvailability}>
                <Ionicons name="calendar-outline" size={20} color={Colors.primary.accent} />
                <Text variant="body" color="accent" weight="medium">
                  Gérer mes disponibilités
                </Text>
              </TouchableOpacity>
              
              {/* Bouton Profil Professionnel */}
              <TouchableOpacity 
                style={[styles.actionButton, { marginTop: Spacing.s }]} 
                onPress={() => router.push('/profile/pro-settings')}
              >
                <Ionicons name="star-outline" size={20} color={Colors.primary.accent} />
                <Text variant="body" color="accent" weight="medium">
                  Profil professionnel
                </Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        )}
      </ScrollView>
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
    paddingHorizontal: Spacing.l,
    paddingVertical: Spacing.l,
    backgroundColor: Colors.neutral.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral.mist,
  },
  avatarContainer: {
    width: 68,
    height: 68,
    borderRadius: 34,
    borderWidth: 2,
    borderColor: Colors.primary.accent,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.m,
  },
  avatarFallback: {
    backgroundColor: Colors.primary.accent,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileInfo: {
    flex: 1,
  },
  profileMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.xxs,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: Colors.neutral.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral.mist,
  },
  tab: {
    flex: 1,
    paddingVertical: Spacing.m,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: Colors.primary.accent,
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
    borderRadius: BorderRadius.medium,
    padding: Spacing.m,
    marginBottom: Spacing.s,
    ...Elevation.small,
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
  statusBadgeInline: {
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.xs,
    paddingVertical: 2,
    borderRadius: BorderRadius.small,
    marginTop: Spacing.xs,
  },
  confirmedBadge: {
    backgroundColor: Colors.semantic.success,
  },
  pendingBadge: {
    backgroundColor: Colors.semantic.warning,
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
});
