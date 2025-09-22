import React, { useCallback } from 'react';
import { View, StyleSheet, ActivityIndicator, RefreshControl, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import Animated, {
  useSharedValue,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import { Colors, Spacing } from '@/constants/theme';
import { DURATIONS, EASING_CURVES, PARALLAX_CONFIG } from '@/constants/animations';
import { Text } from '@/components/atoms';
import { TripCard, TripData } from '@/components/molecules/TripCard';
import { TravelNotificationToggle } from '@/components/molecules/TravelNotificationToggle';
import { commonStyles } from '@/utils/commonStyles';
import { useResponsiveCardSize } from '@/hooks/useResponsiveCardSize';
import { useTravelNotifications } from '@/hooks/useTravelNotifications';
import { useTrips } from '@/hooks/useTrips';
import { Trip } from '@/types/trip';
import { logger } from '@/utils/logger';

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

  // Animation values for smooth scrolling
  const scrollY = useSharedValue(0);

  // Scroll handler optimized for 60fps
  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      'worklet';
      scrollY.value = event.contentOffset.y;
    },
  });

  // Header parallax animation
  const headerAnimatedStyle = useAnimatedStyle(() => {
    'worklet';
    const opacity = interpolate(
      scrollY.value,
      [0, 100],
      [1, 0.8],
      Extrapolation.CLAMP
    );

    const translateY = interpolate(
      scrollY.value,
      [0, 200],
      [0, -50],
      Extrapolation.CLAMP
    );

    return {
      opacity,
      transform: [{ translateY }],
    };
  }, []);

  // Section fade-in animation
  const sectionAnimatedStyle = useAnimatedStyle(() => {
    'worklet';
    const opacity = interpolate(
      scrollY.value,
      [0, 50],
      [0.7, 1],
      Extrapolation.CLAMP
    );

    return {
      opacity,
    };
  }, []);

  const handleTripPress = useCallback((trip: TripData) => {
    // Pas d'action pour le moment
    logger.dev('Tap sur voyage:', trip.title);
  }, []);

  const handleTripHover = useCallback((tripId: string) => {
    logger.dev(`📦 Préchargement du voyage: ${tripId}`);
  }, []);

  const handleNotificationToggle = useCallback(async (enabled: boolean) => {
    const success = await toggleNotifications(enabled);
    if (success) {
      logger.dev(`📢 Alertes voyage ${enabled ? 'activées' : 'désactivées'}`);
    } else {
      logger.error('❌ Erreur lors de la mise à jour des alertes voyage');
    }
  }, [toggleNotifications]);

  const renderTripCard = useCallback(
    ({ item }: { item: Trip }) => {
      const tripData = mapTripToTripData(item);
      return (
        <TripCard
          data={tripData}
          onPress={handleTripPress}
          onHover={handleTripHover}
        />
      );
    },
    [handleTripPress, handleTripHover]
  );

  // Optimisation FlatList avec dimensions pré-calculées
  const CARD_WIDTH = 280; // Largeur standard des cartes
  const CARD_SPACING = Spacing.m;

  const getItemLayout = useCallback((data: any, index: number) => ({
    length: CARD_WIDTH + CARD_SPACING,
    offset: (CARD_WIDTH + CARD_SPACING) * index,
    index,
  }), []);

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
    <SafeAreaView style={styles.container} edges={[]}>
      <StatusBar style="dark" />
      
      <View style={styles.contentContainer}>
        <Animated.ScrollView
          onScroll={scrollHandler}
          scrollEventThrottle={1}
          showsVerticalScrollIndicator={false}
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={isLoading}
              onRefresh={refresh}
              tintColor={Colors.primary.accent}
            />
          }>
          {/* Section Voyages récents */}
          <Animated.View style={[styles.sectionContainer, sectionAnimatedStyle]}>
            <Animated.View style={[styles.sectionHeader, headerAnimatedStyle]}>
              <Text variant="h3" color="charcoal" style={styles.sectionTitle}>
                Voyages récents
              </Text>
            </Animated.View>
            <FlatList
              data={completedTrips}
              renderItem={renderTripCard}
              keyExtractor={(item) => item.id}
              horizontal={true}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={[
                styles.scrollViewContent,
                isTablet && styles.scrollViewContentTablet,
              ]}
              getItemLayout={getItemLayout}
              windowSize={5}
              initialNumToRender={3}
              maxToRenderPerBatch={2}
              removeClippedSubviews={true}
              decelerationRate="fast"
              snapToInterval={CARD_WIDTH + CARD_SPACING}
              snapToAlignment="start"
            />
          </Animated.View>

          {/* Section Voyages complets */}
          {fullTrips.length > 0 && (
            <Animated.View style={[styles.sectionContainer, sectionAnimatedStyle]}>
              <Animated.View style={[styles.sectionHeader, headerAnimatedStyle]}>
                <Text variant="h3" color="charcoal" style={styles.sectionTitle}>
                  Voyages complets
                </Text>
              </Animated.View>
              <FlatList
                data={fullTrips}
                renderItem={renderTripCard}
                keyExtractor={(item) => item.id}
                horizontal={true}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={[
                  styles.scrollViewContent,
                  isTablet && styles.scrollViewContentTablet,
                ]}
                getItemLayout={getItemLayout}
                windowSize={5}
                initialNumToRender={3}
                maxToRenderPerBatch={2}
                removeClippedSubviews={true}
                decelerationRate="fast"
                snapToInterval={CARD_WIDTH + CARD_SPACING}
                snapToAlignment="start"
              />
            </Animated.View>
          )}
        </Animated.ScrollView>

        {/* Toggle sticky en bas */}
        <TravelNotificationToggle
          isEnabled={isEnabled}
          onToggle={handleNotificationToggle}
        />
      </View>
    </SafeAreaView>
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
  scrollContent: {
    paddingBottom: Spacing.xl, // Espace pour éviter la tab bar
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
