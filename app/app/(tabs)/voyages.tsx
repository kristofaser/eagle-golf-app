import React, { useCallback } from 'react';
import { View, StyleSheet, ScrollView, ActivityIndicator, RefreshControl } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Colors, Spacing } from '@/constants/theme';
import { Text } from '@/components/atoms';
import { TripCard, TripData } from '@/components/molecules/TripCard';
import { TravelNotificationToggle } from '@/components/molecules/TravelNotificationToggle';
import { commonStyles } from '@/utils/commonStyles';
import { useResponsiveCardSize } from '@/hooks/useResponsiveCardSize';
import { useTravelNotifications } from '@/hooks/useTravelNotifications';
import { useTrips } from '@/hooks/useTrips';
import { Trip } from '@/types/trip';

// Fonction pour mapper les données Trip vers TripData pour le composant
const mapTripToTripData = (trip: Trip): TripData => ({
  id: trip.id,
  title: trip.title,
  country: trip.country,
  imageUrl: trip.image_url,
  duration: '',
  price: '',
  rating: 0,
  golfCourses: 0,
  description: '',
  featured: false,
  status: trip.status as 'completed' | 'full',
  date: '',
});

export default function VoyagesScreen() {
  const { isTablet } = useResponsiveCardSize();
  const { isEnabled, toggleNotifications } = useTravelNotifications();
  const { completedTrips, fullTrips, isLoading, error, refresh } = useTrips();

  const handleTripPress = useCallback((trip: TripData) => {
    // Pas d'action pour le moment
    console.log('Tap sur voyage:', trip.title);
  }, []);

  const handleTripHover = useCallback((tripId: string) => {
    console.log(`📦 Préchargement du voyage: ${tripId}`);
  }, []);

  const handleNotificationToggle = useCallback(async (enabled: boolean) => {
    const success = await toggleNotifications(enabled);
    if (success) {
      console.log(`📢 Alertes voyage ${enabled ? 'activées' : 'désactivées'}`);
    } else {
      console.error('❌ Erreur lors de la mise à jour des alertes voyage');
    }
  }, [toggleNotifications]);

  const renderTripCard = useCallback(
    (trip: Trip) => {
      const tripData = mapTripToTripData(trip);
      return (
        <TripCard
          key={trip.id}
          data={tripData}
          onPress={handleTripPress}
          onHover={handleTripHover}
        />
      );
    },
    [handleTripPress, handleTripHover]
  );

  // Afficher le loader pendant le chargement
  if (isLoading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color={Colors.primary.accent} />
        <Text variant="body" color="course" style={{ marginTop: Spacing.m }}>
          Chargement des voyages...
        </Text>
      </View>
    );
  }

  // Afficher une erreur si nécessaire
  if (error) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Text variant="h3" color="charcoal" style={{ marginBottom: Spacing.m }}>
          Erreur de chargement
        </Text>
        <Text variant="body" color="course">
          {error}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      
      <View style={styles.contentContainer}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          style={styles.scrollView}
          refreshControl={
            <RefreshControl
              refreshing={isLoading}
              onRefresh={refresh}
              tintColor={Colors.primary.accent}
            />
          }>
          {/* Section Voyages récents */}
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
              <Text variant="h3" color="charcoal" style={styles.sectionTitle}>
                Voyages récents
              </Text>
            </View>
            <ScrollView
              horizontal={true}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={[
                styles.scrollViewContent,
                isTablet && styles.scrollViewContentTablet,
              ]}
              removeClippedSubviews={true}
            >
              {completedTrips.map(renderTripCard)}
            </ScrollView>
          </View>

          {/* Section Voyages complets */}
          {fullTrips.length > 0 && (
            <View style={styles.sectionContainer}>
              <View style={styles.sectionHeader}>
                <Text variant="h3" color="charcoal" style={styles.sectionTitle}>
                  Voyages complets
                </Text>
              </View>
              <ScrollView
                horizontal={true}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={[
                  styles.scrollViewContent,
                  isTablet && styles.scrollViewContentTablet,
                ]}
                removeClippedSubviews={true}
              >
                {fullTrips.map(renderTripCard)}
              </ScrollView>
            </View>
          )}
        </ScrollView>

        {/* Toggle sticky en bas */}
        <TravelNotificationToggle
          isEnabled={isEnabled}
          onToggle={handleNotificationToggle}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: commonStyles.container,
  contentContainer: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionContainer: {
    marginTop: Spacing.l,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.m,
    marginBottom: Spacing.m,
  },
  sectionTitle: {
    flex: 1,
  },
  scrollViewContent: {
    paddingLeft: Spacing.m,
    paddingRight: Spacing.m,
  },
  scrollViewContentTablet: {
    paddingHorizontal: Spacing.m * 2,
  },
});
