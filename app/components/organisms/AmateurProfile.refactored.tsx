import React, { useEffect } from 'react';
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
import { Colors, Spacing, Typography, BorderRadius, Elevation } from '@/constants/theme';
import { Text, LoadingScreen, Avatar } from '@/components/atoms';
import { FullProfile } from '@/services/profile.service';
import { bookingService, BookingWithDetails } from '@/services/booking.service';
import { useAsyncOperation } from '@/hooks/useAsyncOperation';

const DEFAULT_AVATAR =
  'https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=400&h=400&fit=crop&crop=center';

interface BookingsData {
  upcoming: BookingWithDetails[];
  past: BookingWithDetails[];
}

interface AmateurProfileProps {
  profile: FullProfile;
  onRefresh: () => Promise<void>;
}

export function AmateurProfileRefactored({ profile, onRefresh }: AmateurProfileProps) {
  const router = useRouter();

  // ✅ AVANT: 3 états séparés + logique dupliquée
  // const [refreshing, setRefreshing] = useState(false);
  // const [upcomingBookings, setUpcomingBookings] = useState<BookingWithDetails[]>([]);
  // const [pastBookings, setPastBookings] = useState<BookingWithDetails[]>([]);
  // const [loadingBookings, setLoadingBookings] = useState(true);

  // ✅ APRÈS: 1 seul hook avec gestion automatique
  const bookingsOperation = useAsyncOperation<BookingsData>();
  const refreshOperation = useAsyncOperation<void>();

  const loadBookings = async (): Promise<BookingsData> => {
    if (!profile.id) {
      return { upcoming: [], past: [] };
    }

    const today = new Date().toISOString().split('T')[0];

    // Réservations à venir
    const { data: upcoming } = await bookingService.listBookings(
      {
        amateur_id: profile.id,
        start_date: today,
      },
      {
        sortBy: 'date',
        sortOrder: 'asc',
      }
    );

    // Réservations passées
    const { data: past } = await bookingService.listBookings(
      {
        amateur_id: profile.id,
        end_date: today,
      },
      {
        sortBy: 'date',
        sortOrder: 'desc',
        limit: 10,
      }
    );

    return {
      upcoming: upcoming || [],
      past: past || [],
    };
  };

  const handleRefresh = async () => {
    await refreshOperation.execute(async () => {
      await onRefresh();
      await bookingsOperation.execute(loadBookings);
    });
  };

  // Charger les données au montage
  useEffect(() => {
    bookingsOperation.execute(loadBookings);
  }, [profile.id]);

  // ✅ AVANT: Logique complexe de gestion d'état
  // ✅ APRÈS: État simple et clair
  const { upcoming = [], past = [] } = bookingsOperation.data || {};
  const isLoading = bookingsOperation.loading || refreshOperation.loading;

  if (bookingsOperation.loading && !bookingsOperation.data) {
    return <LoadingScreen />;
  }

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={isLoading}
          onRefresh={handleRefresh}
          colors={[Colors.primary]}
          tintColor={Colors.primary}
        />
      }
    >
      <Animated.View entering={FadeIn} style={styles.content}>
        {/* Header Profile */}
        <View style={styles.header}>
          <View style={styles.avatarContainer}>
            <Avatar source={profile.avatar_url || DEFAULT_AVATAR} size={80} style={styles.avatar} />
            <TouchableOpacity
              style={styles.editButton}
              onPress={() => router.push('/profile/edit')}
            >
              <Ionicons name="pencil" size={16} color={Colors.white} />
            </TouchableOpacity>
          </View>

          <View style={styles.profileInfo}>
            <Text style={styles.userName} numberOfLines={2}>
              {profile.full_name || 'Nom non renseigné'}
            </Text>
            {profile.location && (
              <View style={styles.locationContainer}>
                <Ionicons name="location-outline" size={14} color={Colors.textSecondary} />
                <Text style={styles.location} numberOfLines={1}>
                  {profile.location}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{upcoming.length}</Text>
            <Text style={styles.statLabel}>Parties à venir</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{past.length}</Text>
            <Text style={styles.statLabel}>Parties jouées</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{profile.golf_profile?.handicap || '-'}</Text>
            <Text style={styles.statLabel}>Handicap</Text>
          </View>
        </View>

        {/* Prochaines parties */}
        {upcoming.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Prochaines parties</Text>
            {upcoming.slice(0, 3).map((booking) => (
              <TouchableOpacity
                key={booking.id}
                style={styles.bookingCard}
                onPress={() => router.push(`/booking/${booking.id}`)}
              >
                <View style={styles.bookingHeader}>
                  <Text style={styles.bookingDate}>
                    {new Date(booking.date).toLocaleDateString('fr-FR', {
                      weekday: 'short',
                      day: '2-digit',
                      month: 'short',
                    })}
                  </Text>
                  <Text style={styles.bookingTime}>
                    {booking.start_time} - {booking.end_time}
                  </Text>
                </View>
                <Text style={styles.bookingCourse} numberOfLines={1}>
                  {booking.golf_courses?.name || 'Parcours non spécifié'}
                </Text>
                <Text style={styles.bookingPro} numberOfLines={1}>
                  Avec {booking.pro_profiles?.profiles?.full_name || 'Pro'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Actions rapides */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Actions</Text>
          <TouchableOpacity style={styles.actionButton} onPress={() => router.push('/parcours')}>
            <Ionicons name="golf" size={20} color={Colors.primary} />
            <Text style={styles.actionText}>Trouver un parcours</Text>
            <Ionicons name="chevron-forward" size={16} color={Colors.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} onPress={() => router.push('/pros')}>
            <Ionicons name="people" size={20} color={Colors.primary} />
            <Text style={styles.actionText}>Trouver un pro</Text>
            <Ionicons name="chevron-forward" size={16} color={Colors.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => router.push('/profile/settings')}
          >
            <Ionicons name="settings" size={20} color={Colors.primary} />
            <Text style={styles.actionText}>Paramètres</Text>
            <Ionicons name="chevron-forward" size={16} color={Colors.textSecondary} />
          </TouchableOpacity>
        </View>
      </Animated.View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    padding: Spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    marginRight: Spacing.md,
  },
  editButton: {
    position: 'absolute',
    bottom: -2,
    right: Spacing.md - 2,
    backgroundColor: Colors.primary,
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.white,
  },
  profileInfo: {
    flex: 1,
  },
  userName: {
    ...Typography.headingMd,
    marginBottom: Spacing.xs,
    color: Colors.text,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  location: {
    ...Typography.bodyMd,
    color: Colors.textSecondary,
    marginLeft: Spacing.xs,
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
    ...Elevation.sm,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    ...Typography.headingLg,
    color: Colors.primary,
    marginBottom: Spacing.xs,
  },
  statLabel: {
    ...Typography.caption,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  statDivider: {
    width: 1,
    backgroundColor: Colors.border,
    marginHorizontal: Spacing.md,
  },
  section: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    ...Typography.headingMd,
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  bookingCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    ...Elevation.xs,
  },
  bookingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  bookingDate: {
    ...Typography.bodyLg,
    fontWeight: '600',
    color: Colors.primary,
    textTransform: 'capitalize',
  },
  bookingTime: {
    ...Typography.bodyMd,
    color: Colors.textSecondary,
  },
  bookingCourse: {
    ...Typography.bodyMd,
    color: Colors.text,
    marginBottom: 2,
  },
  bookingPro: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    ...Elevation.xs,
  },
  actionText: {
    ...Typography.bodyLg,
    color: Colors.text,
    marginLeft: Spacing.md,
    flex: 1,
  },
});
