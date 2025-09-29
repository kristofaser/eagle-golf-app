import { Platform } from 'react-native';
import React, { useRef, useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ImageBackground } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BottomSheetModal, BottomSheetView } from '@gorhom/bottom-sheet';
import { Colors, Typography, Spacing, BorderRadius } from '@/constants/theme';
import { CircleAvatar } from '@/components/atoms/CircleAvatar';
import { BaseBottomSheet } from '@/components/sheets/BaseBottomSheet';
import { useFavoritePros } from '@/stores/useAppStore';
import { useFavoriteProfiles } from '@/hooks/useFavoriteProfiles';
import { useRouter } from 'expo-router';

export default function AccueilScreen() {
  const favoritePros = useFavoritePros();
  const { data: favoriteProfiles, isLoading, error } = useFavoriteProfiles();
  const router = useRouter();
  const exclusiveGameBottomSheetRef = useRef<BottomSheetModal>(null);
  const [countdown, setCountdown] = useState({ days: 0, hours: 0, minutes: 0 });

  const handleProPress = (proId: string) => {
    router.push(`/profile/${proId}`);
  };

  const handleExclusiveGamePress = () => {
    exclusiveGameBottomSheetRef.current?.present();
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

        setCountdown({ days, hours, minutes });
      } else {
        setCountdown({ days: 0, hours: 0, minutes: 0 });
      }
    };

    calculateCountdown();
    const interval = setInterval(calculateCountdown, 60000); // Mise à jour toutes les minutes

  const Container = Platform.OS === 'web' ? View : SafeAreaView;
    return () => clearInterval(interval);
  }, []);

  const renderFavoritePros = () => {
    if (favoritePros.length === 0) {
  const Container = Platform.OS === 'web' ? View : SafeAreaView;
      return (
        <View style={styles.emptyFavoritesContainer}>
          <Text style={styles.emptyText}>Aucun pro favori</Text>
          <Text style={styles.emptySubtext}>Explorez les profils pour ajouter vos favoris</Text>
        </View>
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
          <Text style={styles.sectionTitle}>Mes pros favoris</Text>
          {renderFavoritePros()}
        </View>

        {/* Offre membre Eagle */}
        <View style={styles.section}>
          <View style={styles.premiumCard}>
            <Text style={styles.premiumTitle}>Devenir Membre Eagle</Text>
            <Text style={styles.premiumSubtitle}>À implémenter</Text>
          </View>
        </View>

        {/* Partie exclusive à gagner */}
        <View style={styles.section}>
          <TouchableOpacity style={styles.exclusiveCard} activeOpacity={0.8} onPress={handleExclusiveGamePress}>
            <ImageBackground
              source={require('@/assets/images/joueur-mystere.png')}
              style={styles.exclusiveCardBackground}
              resizeMode="contain"
              imageStyle={styles.exclusiveBackgroundImage}
            >
              <View style={styles.exclusiveLayout}>
                <View style={styles.exclusiveImageZone} />
                <View style={styles.exclusiveTextZone}>
                  <View style={styles.exclusiveBadge}>
                    <Text style={styles.exclusiveBadgeText}>Partie exclusive à gagner</Text>
                  </View>
                  <Text style={styles.exclusiveDescription}>
                    Tentez de gagner une partie avec un Pro d'une valeur de 400€
                  </Text>
                  <View style={styles.countdownContainer}>
                    <View style={styles.countdownNumbers}>
                      <View style={styles.countdownItem}>
                        <View style={styles.countdownBox}>
                          <Text style={styles.countdownDigit}>
                            {countdown.days >= 100 ? countdown.days : countdown.days.toString().padStart(2, '0')}
                          </Text>
                        </View>
                        <View style={styles.countdownBadge}>
                          <Text style={styles.countdownBadgeText}>j</Text>
                        </View>
                      </View>
                      <View style={styles.countdownItem}>
                        <View style={styles.countdownBox}>
                          <Text style={styles.countdownDigit}>
                            {countdown.hours.toString().padStart(2, '0')}
                          </Text>
                        </View>
                        <View style={styles.countdownBadge}>
                          <Text style={styles.countdownBadgeText}>h</Text>
                        </View>
                      </View>
                      <View style={styles.countdownItem}>
                        <View style={styles.countdownBox}>
                          <Text style={styles.countdownDigit}>
                            {countdown.minutes.toString().padStart(2, '0')}
                          </Text>
                        </View>
                        <View style={styles.countdownBadge}>
                          <Text style={styles.countdownBadgeText}>mn</Text>
                        </View>
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
          <View style={styles.contestCard}>
            <Text style={styles.contestTitle}>Concours de Driving/Précision</Text>
            <Text style={styles.contestSubtitle}>À implémenter</Text>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Sheet pour le jeu exclusif */}
      <BaseBottomSheet
        ref={exclusiveGameBottomSheetRef}
        snapPoints={['50%', '80%']}
        enablePanDownToClose={true}
      >
        <BottomSheetView style={styles.bottomSheetContent}>
          <Text style={styles.bottomSheetTitle}>Partie exclusive à gagner</Text>
          <Text style={styles.bottomSheetSubtitle}>
            Tentez de gagner une partie avec un Pro d'une valeur de 400€
          </Text>
          <Text style={styles.bottomSheetPremium}>
            Jeu-concours réservé aux abonnés Premium
          </Text>
          <Text style={styles.bottomSheetPrice}>
            (À partir de 7,50€ HT/mois)
          </Text>
          <Text style={styles.bottomSheetText}>
            Contenu du jeu-concours à implémenter...
          </Text>
        </BottomSheetView>
      </BaseBottomSheet>
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
    padding: Spacing.l,
    minHeight: 120,
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
    backgroundColor: Colors.secondary.gold,
    borderRadius: BorderRadius.large,
    padding: Spacing.l,
    minHeight: 100,
    justifyContent: 'center',
  },
  premiumTitle: {
    fontFamily: Typography.fontFamily.primary,
    fontSize: Typography.fontSize.h4,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.neutral.white,
    marginBottom: Spacing.xs,
  },
  premiumSubtitle: {
    fontFamily: Typography.fontFamily.primary,
    fontSize: Typography.fontSize.body,
    color: Colors.neutral.white,
    opacity: 0.9,
  },
  exclusiveCard: {
    borderRadius: BorderRadius.large,
    overflow: 'hidden',
    height: 160, // Augmente la hauteur pour mieux voir l'image
    borderWidth: 2,
    borderColor: Colors.primary.electric,
  },
  exclusiveCardBackground: {
    width: '100%',
    height: 160,
  },
  exclusiveBackgroundImage: {
    left: 0, // Position l'image à gauche
    width: '40%', // L'image ne prend que 40% de la largeur
    height: '100%',
  },
  exclusiveLayout: {
    flex: 1,
    flexDirection: 'row',
  },
  exclusiveImageZone: {
    flex: 0.4, // 40% de la largeur pour l'image (zone transparente)
  },
  exclusiveTextZone: {
    flex: 0.6, // 60% de la largeur pour le texte
    backgroundColor: 'transparent', // Fond transparent
    justifyContent: 'center',
    padding: Spacing.m,
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
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.m,
  },
  countdownItem: {
    position: 'relative',
  },
  countdownBox: {
    backgroundColor: 'rgba(0, 50, 100, 0.9)', // Bleu foncé Eagle
    borderRadius: 30, // Cercle parfait réduit
    width: 60,
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countdownDigit: {
    fontFamily: Typography.fontFamily.primary,
    fontSize: Typography.fontSize.h3,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.neutral.white,
    textAlign: 'center',
  },
  countdownBadge: {
    position: 'absolute',
    bottom: -5,
    right: -5,
    backgroundColor: Colors.neutral.charcoal,
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.neutral.white,
  },
  countdownBadgeText: {
    fontFamily: Typography.fontFamily.primary,
    fontSize: Typography.fontSize.small,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.neutral.white,
  },
  contestCard: {
    backgroundColor: Colors.semantic.success.default,
    borderRadius: BorderRadius.large,
    padding: Spacing.l,
    minHeight: 100,
    justifyContent: 'center',
  },
  contestTitle: {
    fontFamily: Typography.fontFamily.primary,
    fontSize: Typography.fontSize.h4,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.neutral.white,
    marginBottom: Spacing.xs,
  },
  contestSubtitle: {
    fontFamily: Typography.fontFamily.primary,
    fontSize: Typography.fontSize.body,
    color: Colors.neutral.white,
    opacity: 0.9,
  },
  placeholderText: {
    fontFamily: Typography.fontFamily.primary,
    fontSize: Typography.fontSize.body,
    color: Colors.neutral.course,
    fontStyle: 'italic',
  },
  bottomSheetContent: {
    flex: 1,
    padding: Spacing.l,
    alignItems: 'center',
  },
  bottomSheetTitle: {
    fontFamily: Typography.fontFamily.primary,
    fontSize: Typography.fontSize.h3,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.primary.electric,
    marginBottom: Spacing.m,
    textAlign: 'center',
  },
  bottomSheetSubtitle: {
    fontFamily: Typography.fontFamily.primary,
    fontSize: Typography.fontSize.body,
    color: Colors.neutral.charcoal,
    textAlign: 'center',
    marginBottom: Spacing.m,
    fontWeight: Typography.fontWeight.medium,
  },
  bottomSheetPremium: {
    fontFamily: Typography.fontFamily.primary,
    fontSize: Typography.fontSize.body,
    color: Colors.primary.electric,
    textAlign: 'center',
    fontWeight: Typography.fontWeight.medium,
    marginBottom: Spacing.xs,
  },
  bottomSheetPrice: {
    fontFamily: Typography.fontFamily.primary,
    fontSize: Typography.fontSize.caption,
    color: Colors.neutral.course,
    textAlign: 'center',
    fontStyle: 'italic',
    marginBottom: Spacing.l,
  },
  bottomSheetText: {
    fontFamily: Typography.fontFamily.primary,
    fontSize: Typography.fontSize.body,
    color: Colors.neutral.charcoal,
    textAlign: 'center',
  },
});
