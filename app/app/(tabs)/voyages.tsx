import { Platform, Dimensions } from 'react-native';
import React, { useCallback, useMemo } from 'react';
import { View, StyleSheet, ActivityIndicator, RefreshControl, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Colors, Spacing } from '@/constants/theme';
import { Text, TravelNotificationFAB } from '@/components/atoms';
import { TripCard, TripData } from '@/components/molecules/TripCard';
import { commonStyles } from '@/utils/commonStyles';
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
  date: '',
});

export default function VoyagesScreen() {
  const { isEnabled, toggleNotifications } = useTravelNotifications();
  const { trips, isLoading, error, refresh } = useTrips();

  // Calcul de la largeur des cartes pour 2 colonnes
  const { width: screenWidth } = Dimensions.get('window');
  const CARD_SPACING = Spacing.m;
  const HORIZONTAL_PADDING = Spacing.m * 2; // padding gauche + droite
  const CARD_WIDTH = useMemo(() => {
    return (screenWidth - HORIZONTAL_PADDING - CARD_SPACING) / 2;
  }, [screenWidth]);

  const handleTripPress = useCallback((trip: TripData) => {
    // Pas d'action pour le moment
    logger.dev('Tap sur voyage:', trip.title);
  }, []);

  const handleTripHover = useCallback((tripId: string) => {
    logger.dev(`📦 Préchargement du voyage: ${tripId}`);
  }, []);

  const handleNotificationToggle = useCallback(() => {
    void (async () => {
      const success = await toggleNotifications(!isEnabled);
      if (success) {
        logger.dev(`📢 Alertes voyage ${!isEnabled ? 'activées' : 'désactivées'}`);
      } else {
        logger.error('❌ Erreur lors de la mise à jour des alertes voyage');
      }
    })();
  }, [toggleNotifications, isEnabled]);

  const handleRefresh = useCallback(() => {
    void refresh();
  }, [refresh]);

  const renderTripCard = useCallback(
    ({ item }: { item: Trip }) => {
      const tripData = mapTripToTripData(item);
      return (
        <TripCard
          data={tripData}
          onPress={handleTripPress}
          onHover={handleTripHover}
          cardWidth={CARD_WIDTH}
          cardHeight={CARD_WIDTH}
        />
      );
    },
    [handleTripPress, handleTripHover, CARD_WIDTH]
  );

  // Afficher le loader pendant le chargement
  if (isLoading) {
  const Container = Platform.OS === 'web' ? View : SafeAreaView;
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
  const Container = Platform.OS === 'web' ? View : SafeAreaView;
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

  const Container = Platform.OS === 'web' ? View : SafeAreaView;
  return (
    <Container style={styles.container} edges={[]}>
      <StatusBar style="dark" />

      <View style={styles.contentContainer}>
        <FlatList
          data={trips}
          renderItem={renderTripCard}
          keyExtractor={(item) => item.id}
          numColumns={2}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.gridContent}
          columnWrapperStyle={styles.row}
          ListHeaderComponent={
            <View style={styles.headerContainer}>
              <Text variant="body" color="charcoal" style={styles.headerText}>
                Des séjours uniques aux côtés des pros...{'\n'}
                Préparez-vous à vivre le golf autrement !
              </Text>
            </View>
          }
          refreshControl={
            <RefreshControl
              refreshing={isLoading}
              onRefresh={handleRefresh}
              tintColor={Colors.primary.accent}
            />
          }
          windowSize={10}
          initialNumToRender={6}
          maxToRenderPerBatch={6}
          removeClippedSubviews={true}
        />

        {/* FAB pour les alertes voyage */}
        <TravelNotificationFAB isEnabled={isEnabled} onPress={handleNotificationToggle} />
      </View>
    </Container>
  );
}

const styles = StyleSheet.create({
  container: commonStyles.container,
  contentContainer: {
    flex: 1,
  },
  gridContent: {
    paddingHorizontal: Spacing.m,
    paddingBottom: Spacing.xl, // Espace pour éviter la tab bar
  },
  headerContainer: {
    paddingVertical: Spacing.l,
    paddingHorizontal: Spacing.xs,
  },
  headerText: {
    textAlign: 'center',
    lineHeight: 22,
  },
  row: {
    justifyContent: 'space-between',
    marginBottom: Spacing.m,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});
