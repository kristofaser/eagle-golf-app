import React, { useCallback } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Colors, Spacing } from '@/constants/theme';
import { Text } from '@/components/atoms';
import { TripCard, TripData } from '@/components/molecules/TripCard';
import { TravelNotificationToggle } from '@/components/molecules/TravelNotificationToggle';
import { commonStyles } from '@/utils/commonStyles';
import { useResponsiveCardSize } from '@/hooks/useResponsiveCardSize';
import { useTravelNotifications } from '@/hooks/useTravelNotifications';

// Données fictives des voyages golf
const tripData: TripData[] = [
  {
    id: '1',
    title: 'Marrakech Golf Experience',
    country: 'Maroc',
    imageUrl: 'https://images.unsplash.com/photo-1539650116574-75c0c6cec282?w=400&h=300&fit=crop&crop=center',
    duration: '7 jours',
    price: '1,850€',
    rating: 4.8,
    golfCourses: 4,
    description: 'Découvrez les parcours légendaires de Marrakech dans un cadre exceptionnel',
    featured: true,
    status: 'completed',
    date: 'Nov 2024',
  },
  {
    id: '2',
    title: 'Dubai Golf Luxury',
    country: 'Émirats Arabes Unis',
    imageUrl: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=400&h=300&fit=crop&crop=center',
    duration: '5 jours',
    price: '2,400€',
    rating: 4.9,
    golfCourses: 3,
    description: 'Golf de luxe dans le désert avec des parcours d\'exception',
    featured: false,
    status: 'full',
    date: 'Jan 2025',
  },
  {
    id: '3',
    title: 'Singapore Golf City',
    country: 'Singapour',
    imageUrl: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=300&fit=crop&crop=center',
    duration: '6 jours',
    price: '2,200€',
    rating: 4.7,
    golfCourses: 5,
    description: 'Golf urbain dans la ville-état la plus moderne d\'Asie',
    featured: false,
    status: 'completed',
    date: 'Oct 2024',
  },
  {
    id: '4',
    title: 'St Andrews Heritage',
    country: 'Écosse',
    imageUrl: 'https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=400&h=300&fit=crop&crop=center',
    duration: '8 jours',
    price: '3,200€',
    rating: 4.9,
    golfCourses: 6,
    description: 'Pèlerinage sur les links légendaires du berceau du golf',
    featured: true,
    status: 'full',
    date: 'Mars 2025',
  },
  {
    id: '5',
    title: 'Pebble Beach Experience',
    country: 'États-Unis',
    imageUrl: 'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=400&h=300&fit=crop&crop=center',
    duration: '6 jours',
    price: '4,500€',
    rating: 5.0,
    golfCourses: 4,
    description: 'Les parcours côtiers mythiques de la côte californienne',
    featured: false,
    status: 'completed',
    date: 'Sep 2024',
  },
];

export default function VoyagesScreen() {
  const { isTablet } = useResponsiveCardSize();
  const { isEnabled, toggleNotifications } = useTravelNotifications();

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
    (trip: TripData) => (
      <TripCard
        key={trip.id}
        data={trip}
        onPress={handleTripPress}
        onHover={handleTripHover}
      />
    ),
    [handleTripPress, handleTripHover]
  );

  // Séparer les voyages par statut
  const completedTrips = tripData.filter(trip => trip.status === 'completed');
  const fullTrips = tripData.filter(trip => trip.status === 'full');

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      
      <View style={styles.contentContainer}>
        <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollView}>
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
