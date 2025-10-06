import React, { useRef, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ImageBackground, Animated, Platform } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius, Elevation } from '@/constants/theme';

export default function ExclusiveGameScreen() {
  const router = useRouter();
  const [isParticipating, setIsParticipating] = useState(false);
  const toggleAnim = useRef(new Animated.Value(0)).current;

  const handleToggleParticipation = () => {
    const newValue = !isParticipating;
    setIsParticipating(newValue);

    Animated.timing(toggleAnim, {
      toValue: newValue ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  };

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTransparent: true,
          headerTitle: '',
          presentation: 'card',
          animation: 'default',
          gestureEnabled: true,
          headerLeft: Platform.OS === 'ios' ? () => (
            <TouchableOpacity
              onPress={() => router.back()}
              style={{ paddingLeft: 10 }}
            >
              <Ionicons name="chevron-back" size={28} color={Colors.neutral.white} />
            </TouchableOpacity>
          ) : () => null, // Sur Android, pas de bouton retour visible
        }}
      />

      <View style={styles.container}>
        {/* Image Hero vraiment plein écran */}
        <View style={styles.heroContainer}>
          <ImageBackground
            source={require('@/assets/images/joueur-mystere.png')}
            style={styles.heroImage}
            resizeMode="cover"
          >
            <LinearGradient
              colors={['transparent', 'rgba(0, 0, 0, 0.5)', 'rgba(0, 0, 0, 0.8)']}
              style={styles.heroOverlay}
            >
              <Text style={styles.heroTitle}>Une expérience unique !</Text>
              <Text style={styles.heroDescription}>
                Pour célébrer le lancement d'Eagle, partagez 18 trous avec un joueur professionnel du circuit européen
              </Text>
              <Text style={styles.heroValue}>D'une valeur de 400€</Text>
              <Text style={styles.heroDate}>Du 1er au 31 octobre</Text>
            </LinearGradient>
          </ImageBackground>
        </View>

        {/* Contenu scrollable */}
        <ScrollView
          style={styles.content}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingTop: Spacing.l }}
        >
          {/* Multipliez vos chances de gagner */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Multipliez vos chances de gagner</Text>

            {/* Comparatif des chances - Capsules avec badges */}
            <View style={styles.chancesContainer}>
              {/* Utilisateur connecté */}
              <View style={styles.chanceItem}>
                <Text style={styles.chanceType}>Utilisateur connecté</Text>
                <View style={styles.notificationBadge}>
                  <Text style={styles.notificationNumber}>X1</Text>
                  <Text style={styles.notificationLabel}>chance</Text>
                </View>
              </View>

              {/* Premium mensuel */}
              <TouchableOpacity
                style={[styles.chanceItem, styles.chanceItemPremium]}
                activeOpacity={0.8}
              >
                <View style={styles.textContentPremium}>
                  <Text style={[styles.chanceType, styles.chanceTypePremium]}>Premium mensuel</Text>
                  <Text style={styles.chanceBecomePremium}>Devenir premium</Text>
                </View>
                <View style={[styles.notificationBadge, styles.notificationBadgeDark]}>
                  <Text style={styles.notificationNumber}>X3</Text>
                  <Text style={styles.notificationLabel}>chances</Text>
                </View>
              </TouchableOpacity>

              {/* Premium annuel */}
              <TouchableOpacity
                style={[styles.chanceItem, styles.chanceItemPremiumPlus]}
                activeOpacity={0.8}
              >
                <View style={styles.textContentPremium}>
                  <Text style={[styles.chanceType, styles.chanceTypePremium]}>Premium annuel</Text>
                  <Text style={styles.chanceBecomePremium}>Devenir premium</Text>
                </View>
                <View style={[styles.notificationBadge, styles.notificationBadgeDark]}>
                  <Text style={styles.notificationNumber}>X15</Text>
                  <Text style={styles.notificationLabel}>chances</Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>

        {/* Footer fixe */}
        <View style={styles.footerFixed}>
          <View style={styles.participationSimple}>
            <Text style={styles.participationTitle}>Participer au tirage</Text>
            <TouchableOpacity
              style={styles.toggle}
              activeOpacity={0.7}
              onPress={handleToggleParticipation}
            >
              <Animated.View style={[
                styles.toggleTrack,
                {
                  backgroundColor: toggleAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [Colors.neutral.mist, Colors.primary.electric],
                  }),
                },
              ]}>
                <Animated.View style={[
                  styles.toggleThumb,
                  {
                    transform: [{
                      translateX: toggleAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [2, 26],
                      }),
                    }],
                  },
                ]} />
              </Animated.View>
            </TouchableOpacity>
          </View>
          <TouchableOpacity activeOpacity={0.7} style={styles.footerLinkContainer}>
            <Text style={styles.footerLink}>Mentions légales</Text>
          </TouchableOpacity>
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.neutral.white,
  },
  heroContainer: {
    height: 320,
    width: '100%',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroOverlay: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: Spacing.l,
    paddingTop: Spacing.xxl,
  },
  heroTitle: {
    fontFamily: Typography.fontFamily.primary,
    fontSize: Typography.fontSize.h2,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.neutral.white,
    textAlign: 'center',
    marginBottom: Spacing.m,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
    lineHeight: Typography.lineHeight.h2,
    paddingHorizontal: Spacing.s,
  },
  heroDescription: {
    fontFamily: Typography.fontFamily.primary,
    fontSize: Typography.fontSize.h4,
    fontWeight: Typography.fontWeight.semiBold,
    color: Colors.neutral.white,
    textAlign: 'center',
    lineHeight: Typography.lineHeight.h4,
    marginBottom: Spacing.s,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
  heroValue: {
    fontFamily: Typography.fontFamily.primary,
    fontSize: Typography.fontSize.h3,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.neutral.white,
    textAlign: 'center',
    marginBottom: Spacing.xs,
    textShadowColor: 'rgba(0, 0, 0, 0.9)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  heroDate: {
    fontFamily: Typography.fontFamily.primary,
    fontSize: Typography.fontSize.body,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.neutral.white,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  content: {
    flex: 1,
    backgroundColor: Colors.neutral.white,
  },
  section: {
    marginBottom: Spacing.l,
    paddingHorizontal: Spacing.l,
  },
  sectionTitle: {
    fontFamily: Typography.fontFamily.primary,
    fontSize: Typography.fontSize.h4,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.neutral.charcoal,
    marginBottom: Spacing.m,
    textAlign: 'center',
  },
  chancesContainer: {
    flexDirection: 'column',
    gap: Spacing.m,
    marginBottom: Spacing.m,
  },
  chanceItem: {
    width: '100%',
    backgroundColor: Colors.neutral.cloud,
    borderRadius: BorderRadius.round,
    paddingVertical: Spacing.l,
    paddingLeft: Spacing.xl,
    paddingRight: 90,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 2,
    borderColor: Colors.neutral.silver,
    minHeight: 90,
    position: 'relative',
    ...Elevation.medium,
  },
  chanceItemPremium: {
    backgroundColor: Colors.primary.electric,
    borderColor: Colors.primary.electric,
    ...Elevation.large,
  },
  chanceItemPremiumPlus: {
    backgroundColor: Colors.primary.electric,
    borderColor: Colors.primary.electric,
    ...Elevation.large,
  },
  textContentPremium: {
    flex: 1,
  },
  notificationBadge: {
    position: 'absolute',
    right: 12,
    backgroundColor: Colors.primary.electric,
    borderRadius: 35,
    width: 70,
    height: 70,
    alignItems: 'center',
    justifyContent: 'center',
    ...Elevation.large,
  },
  notificationBadgeDark: {
    backgroundColor: Colors.neutral.charcoal,
  },
  notificationNumber: {
    fontFamily: Typography.fontFamily.primary,
    fontSize: Typography.fontSize.h4,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.neutral.white,
    lineHeight: 20,
  },
  notificationLabel: {
    fontFamily: Typography.fontFamily.primary,
    fontSize: 11,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.neutral.white,
    opacity: 0.9,
    lineHeight: 14,
  },
  chanceType: {
    fontFamily: Typography.fontFamily.primary,
    fontSize: Typography.fontSize.body,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.neutral.charcoal,
  },
  chanceTypePremium: {
    color: Colors.neutral.white,
  },
  chanceBecomePremium: {
    fontFamily: Typography.fontFamily.primary,
    fontSize: Typography.fontSize.caption,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.neutral.white,
    opacity: 0.9,
    marginTop: 2,
  },
  footerFixed: {
    backgroundColor: Colors.neutral.white,
    borderTopWidth: 1,
    borderTopColor: Colors.neutral.silver,
    paddingHorizontal: Spacing.l,
    paddingTop: Spacing.m,
    paddingBottom: Spacing.l,
    ...Elevation.minimal,
  },
  participationSimple: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  participationTitle: {
    fontFamily: Typography.fontFamily.primary,
    fontSize: Typography.fontSize.body,
    fontWeight: Typography.fontWeight.semiBold,
    color: Colors.neutral.charcoal,
  },
  toggle: {
    marginLeft: Spacing.m,
    minWidth: 56,
    minHeight: 32,
  },
  toggleTrack: {
    width: 56,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.neutral.silver,
    justifyContent: 'center',
    paddingHorizontal: 2,
    borderWidth: 1,
    borderColor: Colors.neutral.mist,
  },
  toggleThumb: {
    width: 28,
    height: 28,
    borderRadius: BorderRadius.round,
    backgroundColor: Colors.neutral.white,
    borderWidth: 1,
    borderColor: Colors.neutral.mist,
    ...Elevation.small,
  },
  footerLinkContainer: {
    alignItems: 'center',
    paddingTop: Spacing.s,
  },
  footerLink: {
    fontFamily: Typography.fontFamily.primary,
    fontSize: Typography.fontSize.caption,
    color: Colors.primary.electric,
    textDecorationLine: 'underline',
  },
});