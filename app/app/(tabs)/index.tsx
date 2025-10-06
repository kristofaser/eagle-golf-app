import { Platform } from 'react-native';
import React, { useRef, useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ImageBackground, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing, BorderRadius, Elevation } from '@/constants/theme';
import { CircleAvatar } from '@/components/atoms/CircleAvatar';
import { useFavoritePros } from '@/stores/useAppStore';
import { useFavoriteProfiles } from '@/hooks/useFavoriteProfiles';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { CrownIcon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { EagleLogo } from '@/components/atoms/EagleLogo';

export default function AccueilScreen() {
  const favoritePros = useFavoritePros();
  const { data: favoriteProfiles, isLoading, error } = useFavoriteProfiles();
  const router = useRouter();
  const [countdown, setCountdown] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const shineAnim = useRef(new Animated.Value(0)).current;

  const handleProPress = (proId: string) => {
    router.push(`/profile/${proId}`);
  };

  const handleExclusiveGamePress = () => {
    router.push('/exclusive-game');
  };

  const handleContestPress = () => {
    router.push('/contest-driving');
  };

  useEffect(() => {
    const calculateCountdown = () => {
      const targetDate = new Date('2025-10-21T23:59:59');
      const now = new Date();
      const difference = targetDate.getTime() - now.getTime();

      if (difference > 0) {
        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);

        setCountdown({ days, hours, minutes, seconds });
      } else {
        setCountdown({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      }
    };

    calculateCountdown();
    const interval = setInterval(calculateCountdown, 1000); // Mise à jour toutes les secondes

    // Animation de brillance
    Animated.loop(
      Animated.sequence([
        Animated.timing(shineAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(shineAnim, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start();

  const Container = Platform.OS === 'web' ? View : SafeAreaView;
    return () => clearInterval(interval);
  }, []);

  const handleEmptyFavoritesPress = () => {
    router.push('/(tabs)/pros');
  };

  const renderFavoritePros = () => {
    if (favoritePros.length === 0) {
  const Container = Platform.OS === 'web' ? View : SafeAreaView;
      return (
        <TouchableOpacity
          style={styles.emptyFavoritesContainer}
          activeOpacity={0.7}
          onPress={handleEmptyFavoritesPress}
        >
          <Text style={styles.emptyText}>Aucun pro dans vos favoris</Text>
          <Text style={styles.emptySubtext}>Découvrez les profils et ajoutez-les ici</Text>
        </TouchableOpacity>
      );
    }

    if (isLoading) {
  const Container = Platform.OS === 'web' ? View : SafeAreaView;
      return (
        <View style={styles.emptyFavoritesContainer}>
          <Text style={styles.emptyText}>Chargement...</Text>
        </View>
      );
    }

    if (error || !favoriteProfiles) {
  const Container = Platform.OS === 'web' ? View : SafeAreaView;
      return (
        <View style={styles.emptyFavoritesContainer}>
          <Text style={styles.emptyText}>Erreur de chargement</Text>
          <Text style={styles.emptySubtext}>Impossible de charger vos pros favoris</Text>
        </View>
      );
    }

  const Container = Platform.OS === 'web' ? View : SafeAreaView;
    return (
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.avatarsScrollView}>
        {favoriteProfiles.map((profile, index) => (
            <TouchableOpacity
              key={profile.id}
              onPress={() => handleProPress(profile.id)}
              style={[styles.avatarContainer, index === 0 && styles.firstAvatar]}
              activeOpacity={0.7}
            >
              <CircleAvatar
                size={64}
                avatarUrl={profile.imageUrl}
                fallbackInitials={profile.title?.split(' ').map(n => n[0]).join('').substring(0, 2)}
                borderWidth={2}
                borderColor={Colors.primary.electric}
              />
            </TouchableOpacity>
        ))}
      </ScrollView>
    );
  };

  const Container = Platform.OS === 'web' ? View : SafeAreaView;
  return (
    <Container style={styles.container} edges={[]}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Mes pros favoris */}
        <View style={[styles.section, styles.firstSection]}>
          {renderFavoritePros()}
        </View>

        {/* Offre membre Eagle */}
        <View style={styles.section}>
          <TouchableOpacity style={styles.premiumCard} activeOpacity={0.8}>
            <View style={styles.premiumRow}>
              <View style={styles.premiumTextContent}>
                <Text style={styles.premiumTitle}>Eagle Premium</Text>
                <Text style={styles.premiumSubtitle}>Accédez aux contenus exclusifs</Text>
                <Text style={styles.premiumFeatures}>Vidéos • Lifestyle • Tournois</Text>
              </View>
              <View style={styles.premiumLogoWrapper}>
                <EagleLogo size={80} variant="white" />
              </View>
            </View>
          </TouchableOpacity>
        </View>

        {/* Partie exclusive à gagner */}
        <View style={styles.section}>
          <TouchableOpacity style={styles.exclusiveCard} activeOpacity={0.8} onPress={handleExclusiveGamePress}>
            <ImageBackground
              source={require('@/assets/images/joueur-mystere.png')}
              style={styles.exclusiveCardBackground}
              resizeMode="cover"
              imageStyle={styles.exclusiveBackgroundImage}
            >
              <View style={styles.exclusiveLayout}>
                <View style={styles.exclusiveImageZone} />
                <View style={styles.exclusiveTextZone}>
                  <Text style={styles.exclusiveTitle}>Gagnez une partie avec un Pro !</Text>
                  <View style={styles.exclusiveValueContainer}>
                    <Text style={styles.exclusiveValueText}>d'une valeur de </Text>
                    <Text style={styles.exclusivePriceSimple}>400€</Text>
                  </View>
                  <View style={styles.countdownContainer}>
                    <View style={styles.countdownNumbers}>
                      <View style={styles.countdownItem}>
                        <View style={styles.countdownBox}>
                          <Text style={styles.countdownDigit}>
                            {countdown.days >= 100 ? countdown.days : countdown.days.toString().padStart(2, '0')}
                          </Text>
                        </View>
                        <Text style={styles.countdownLabel}>jours</Text>
                      </View>
                      <Text style={styles.countdownSeparator}>:</Text>
                      <View style={styles.countdownItem}>
                        <View style={styles.countdownBox}>
                          <Text style={styles.countdownDigit}>
                            {countdown.hours.toString().padStart(2, '0')}
                          </Text>
                        </View>
                        <Text style={styles.countdownLabel}>heures</Text>
                      </View>
                      <Text style={styles.countdownSeparator}>:</Text>
                      <View style={styles.countdownItem}>
                        <View style={styles.countdownBox}>
                          <Text style={styles.countdownDigit}>
                            {countdown.minutes.toString().padStart(2, '0')}
                          </Text>
                        </View>
                        <Text style={styles.countdownLabel}>min</Text>
                      </View>
                      <Text style={styles.countdownSeparator}>:</Text>
                      <View style={styles.countdownItem}>
                        <View style={styles.countdownBox}>
                          <Text style={styles.countdownDigit}>
                            {countdown.seconds.toString().padStart(2, '0')}
                          </Text>
                        </View>
                        <Text style={styles.countdownLabel}>sec</Text>
                      </View>
                    </View>
                  </View>
                </View>
              </View>
            </ImageBackground>
          </TouchableOpacity>
        </View>

        {/* Concours de Driving/Précision */}
        <View style={styles.section}>
          <TouchableOpacity style={styles.contestCard} activeOpacity={0.8} onPress={handleContestPress}>
            <ImageBackground
              source={require('@/assets/images/balle2golf.jpeg')}
              style={styles.contestCardBackground}
              resizeMode="cover"
              imageStyle={styles.contestBackgroundImage}
            >
              <LinearGradient
                colors={['rgba(0, 0, 0, 0.3)', 'rgba(0, 0, 0, 0.6)']}
                style={styles.contestOverlay}
              >
                <Text style={styles.contestTitle}>Concours de Driving/Précision</Text>
                <Text style={styles.contestSubtitle}>Les meilleurs scores de nos membres</Text>
              </LinearGradient>
            </ImageBackground>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </Container>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.neutral.cloud,
  },
  scrollView: {
    flex: 1,
  },
  section: {
    marginBottom: Spacing.l,
    paddingHorizontal: Spacing.m,
  },
  firstSection: {
    paddingTop: Spacing.l,
  },
  sectionTitle: {
    fontFamily: Typography.fontFamily.primary,
    fontSize: Typography.fontSize.h4,
    fontWeight: Typography.fontWeight.semiBold,
    color: Colors.neutral.charcoal,
    marginBottom: Spacing.m,
  },
  emptyFavoritesContainer: {
    paddingVertical: Spacing.m,
    paddingHorizontal: Spacing.l,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontFamily: Typography.fontFamily.primary,
    fontSize: Typography.fontSize.body,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.neutral.iron,
    marginBottom: Spacing.xs,
  },
  emptySubtext: {
    fontFamily: Typography.fontFamily.primary,
    fontSize: Typography.fontSize.caption,
    color: Colors.neutral.course,
    textAlign: 'center',
  },
  avatarsScrollView: {
    marginLeft: -Spacing.m, // Compenser le padding de la section
  },
  avatarContainer: {
    marginLeft: Spacing.m,
  },
  firstAvatar: {
    marginLeft: Spacing.m,
  },
  premiumCard: {
    backgroundColor: 'rgba(0, 50, 100, 0.95)',
    borderRadius: BorderRadius.large,
    padding: Spacing.l,
    overflow: 'hidden',
  },
  premiumRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  premiumTextContent: {
    flex: 1,
    paddingRight: Spacing.m,
    justifyContent: 'center',
  },
  premiumTitle: {
    fontFamily: Typography.fontFamily.primary,
    fontSize: Typography.fontSize.h3,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.neutral.white,
    marginBottom: Spacing.xs,
  },
  premiumSubtitle: {
    fontFamily: Typography.fontFamily.primary,
    fontSize: Typography.fontSize.caption,
    color: Colors.neutral.white,
    opacity: 0.85,
    marginBottom: Spacing.xs,
  },
  premiumFeatures: {
    fontFamily: Typography.fontFamily.primary,
    fontSize: Typography.fontSize.small,
    color: Colors.neutral.white,
    fontWeight: Typography.fontWeight.medium,
  },
  premiumLogoWrapper: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  premiumContent: {
    marginBottom: Spacing.m,
  },
  premiumAdvantage: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.s,
  },
  premiumAdvantageIcon: {
    fontSize: Typography.fontSize.body,
    color: '#FFD700',
    fontWeight: Typography.fontWeight.bold,
    marginRight: Spacing.s,
    width: 20,
  },
  premiumAdvantageText: {
    fontFamily: Typography.fontFamily.primary,
    fontSize: Typography.fontSize.body,
    color: Colors.neutral.white,
    flex: 1,
  },
  premiumFooter: {
    alignItems: 'center',
  },
  premiumPriceTag: {
    paddingHorizontal: Spacing.m,
    paddingVertical: Spacing.s,
    borderRadius: BorderRadius.medium,
  },
  premiumPriceTagText: {
    fontFamily: Typography.fontFamily.primary,
    fontSize: Typography.fontSize.body,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.neutral.white,
    textAlign: 'center',
  },
  exclusiveCard: {
    borderRadius: BorderRadius.large,
    overflow: 'hidden',
    height: 220,
  },
  exclusiveCardBackground: {
    width: '100%',
    height: 220,
  },
  exclusiveBackgroundImage: {
    width: '100%',
    height: '100%',
  },
  exclusiveLayout: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  exclusiveImageZone: {
    display: 'none',
  },
  exclusiveTextZone: {
    width: '100%',
    backgroundColor: 'transparent',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingHorizontal: Spacing.m,
    paddingBottom: Spacing.m,
  },
  exclusiveTitle: {
    fontFamily: Typography.fontFamily.primary,
    fontSize: Typography.fontSize.h3,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.neutral.white,
    textAlign: 'center',
    marginBottom: Spacing.xs,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  exclusiveValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.m,
  },
  exclusiveValueText: {
    fontFamily: Typography.fontFamily.primary,
    fontSize: Typography.fontSize.body,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.neutral.white,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  exclusivePriceSimple: {
    fontFamily: Typography.fontFamily.primary,
    fontSize: Typography.fontSize.h1,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.neutral.white,
    textShadowColor: 'rgba(0, 0, 0, 0.9)',
    textShadowOffset: { width: 0, height: 3 },
    textShadowRadius: 6,
    marginLeft: Spacing.xs,
  },
  premiumPriceContainer: {
    borderRadius: BorderRadius.medium,
    overflow: 'hidden',
  },
  premiumPriceGradient: {
    paddingHorizontal: Spacing.s,
    paddingVertical: Spacing.xs / 2,
  },
  premiumPriceText: {
    fontFamily: Typography.fontFamily.primary,
    fontSize: Typography.fontSize.h2,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.neutral.white,
    textShadowColor: 'rgba(0, 0, 0, 0.9)',
    textShadowOffset: { width: 0, height: 3 },
    textShadowRadius: 6,
  },
  exclusiveBadge: {
    backgroundColor: Colors.primary.electric,
    borderRadius: BorderRadius.small,
    paddingHorizontal: Spacing.s,
    paddingVertical: Spacing.xs / 2,
    alignSelf: 'flex-start',
    marginBottom: Spacing.xs,
  },
  exclusiveBadgeText: {
    fontFamily: Typography.fontFamily.primary,
    fontSize: Typography.fontSize.caption,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.neutral.white,
  },
  exclusiveDescription: {
    fontFamily: Typography.fontFamily.primary,
    fontSize: Typography.fontSize.caption,
    color: Colors.neutral.charcoal,
    marginBottom: Spacing.xs / 2,
    lineHeight: 16,
  },
  exclusivePremium: {
    fontFamily: Typography.fontFamily.primary,
    fontSize: Typography.fontSize.small,
    color: Colors.neutral.iron,
    fontWeight: Typography.fontWeight.medium,
    marginBottom: Spacing.xs / 4,
  },
  exclusivePrice: {
    fontFamily: Typography.fontFamily.primary,
    fontSize: Typography.fontSize.small,
    color: Colors.neutral.course,
    fontStyle: 'italic',
  },
  countdownContainer: {
    marginTop: Spacing.s,
    alignItems: 'center',
  },
  countdownNumbers: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'center',
    gap: Spacing.xs,
  },
  countdownItem: {
    alignItems: 'center',
  },
  countdownBox: {
    backgroundColor: 'rgba(0, 50, 100, 0.9)',
    borderRadius: BorderRadius.small,
    paddingHorizontal: Spacing.s,
    paddingVertical: Spacing.xs,
    minWidth: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countdownDigit: {
    fontFamily: Typography.fontFamily.primary,
    fontSize: Typography.fontSize.h4,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.neutral.white,
    textAlign: 'center',
  },
  countdownSeparator: {
    fontFamily: Typography.fontFamily.primary,
    fontSize: Typography.fontSize.h4,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.neutral.white,
    marginHorizontal: 2,
    paddingTop: Spacing.xs,
  },
  countdownLabel: {
    fontFamily: Typography.fontFamily.primary,
    fontSize: Typography.fontSize.small,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.neutral.white,
    marginTop: Spacing.xs / 2,
    textAlign: 'center',
  },
  contestCard: {
    borderRadius: BorderRadius.large,
    overflow: 'hidden',
    height: 200,
  },
  contestCardBackground: {
    width: '100%',
    height: 200,
  },
  contestBackgroundImage: {
    width: '100%',
    height: '100%',
  },
  contestOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.l,
  },
  contestTitle: {
    fontFamily: Typography.fontFamily.primary,
    fontSize: Typography.fontSize.h3,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.neutral.white,
    textAlign: 'center',
    marginBottom: Spacing.xs,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  contestSubtitle: {
    fontFamily: Typography.fontFamily.primary,
    fontSize: Typography.fontSize.body,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.neutral.white,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  placeholderText: {
    fontFamily: Typography.fontFamily.primary,
    fontSize: Typography.fontSize.body,
    color: Colors.neutral.course,
    fontStyle: 'italic',
  },
});
