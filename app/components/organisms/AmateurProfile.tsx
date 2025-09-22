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
import { Location05Icon } from '@hugeicons/core-free-icons';
import { Colors, Spacing, Typography, BorderRadius, Elevation } from '@/constants/theme';
import { Text, LoadingScreen, Avatar } from '@/components/atoms';
import { FullProfile } from '@/services/profile.service';
import { bookingService, BookingWithDetails } from '@/services/booking.service';

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

      // Réservations passées pour les stats
      const { data: past } = await bookingService.listBookings(
        {
          userId: profile.id,
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
            {profile.amateur_profiles?.handicap !== null && (
              <>
                <Text variant="body" color="iron">
                  Handicap {profile.amateur_profiles?.handicap || 'N/A'}
                </Text>
                <Text variant="body" color="iron">
                  {' '}
                  •{' '}
                </Text>
              </>
            )}
            <Text variant="body" color="iron">
              {totalGamesPlayed} partie{totalGamesPlayed !== 1 ? 's' : ''} jouée
              {totalGamesPlayed !== 1 ? 's' : ''}
            </Text>
          </View>
        </View>
      </View>

      <ScrollView
        ref={scrollViewRef}
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
      >
        {/* Mes Parties */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text variant="h3" color="charcoal" weight="semiBold" style={styles.cardTitle}>
              Mes Parties
            </Text>
            {upcomingBookings.length > 3 && (
              <TouchableOpacity>
                <Text variant="caption" color="accent" weight="medium">
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
                      imageUrl={booking.pro_profile?.profile?.avatar_url}
                      name={`${booking.pro_profile?.profile?.first_name || 'Pro'} ${booking.pro_profile?.profile?.last_name || ''}`}
                      size="large"
                    />

                    {/* Informations empilées à droite */}
                    <View style={styles.bookingInfo}>
                      {/* Nom du pro */}
                      <Text variant="body" color="charcoal" weight="semiBold">
                        {booking.pro_profile?.profile?.first_name || 'Pro'}{' '}
                        {booking.pro_profile?.profile?.last_name || ''}
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
  profileInfo: {
    flex: 1,
  },
  profileMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.xxs,
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
    borderRadius: BorderRadius.small,
    marginBottom: Spacing.xs,
    ...Elevation.small,
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
