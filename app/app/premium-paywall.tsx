import React from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text, Button } from '@/components/atoms';
import { Colors, Spacing, Typography, BorderRadius } from '@/constants/theme';

export default function PremiumPaywallModal() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { skillName } = useLocalSearchParams();

  const handleUpgrade = () => {
    router.back();
    // Petite pause pour laisser l'animation de fermeture se terminer
    setTimeout(() => {
      router.push('/(tabs)/premium');
    }, 300);
  };

  const benefits = [
    {
      icon: 'golf-outline' as const,
      title: 'Accès à toutes les vidéos Skills',
      description: 'Irons, Wedging, Chipping, Putting et Driving',
    },
    {
      icon: 'bulb-outline' as const,
      title: "Tips de la semaine d'un pro",
      description: 'Nouveaux conseils chaque semaine par des pros',
    },
    {
      icon: 'videocam-outline' as const,
      title: 'Vidéos 3 trous du pro',
      description: 'Regardez les pros jouer 3 trous de leur parcours',
    },
    {
      icon: 'bag-outline' as const,
      title: "In The Bag d'un pro",
      description: 'Découvrez le matériel utilisé par les professionnels',
    },
    {
      icon: 'sparkles-outline' as const,
      title: 'Concours de Drive / Précision',
      description: 'Du contenu premium ajouté régulièrement',
    },
  ];

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      {/* Header avec bouton de fermeture */}
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
          <Ionicons name="close" size={24} color={Colors.neutral.iron} />
        </TouchableOpacity>
      </View>

      {/* Contenu principal */}
      <View style={styles.content}>
        {/* Titre */}
        <Text variant="h2" color="charcoal" align="center" style={styles.title}>
          Devenez membre Premium
        </Text>

        {/* Description générale */}
        <Text variant="body" color="iron" align="center" style={styles.description}>
          Accédez à tous les contenus exclusifs
        </Text>

        {/* Liste des avantages */}
        <View style={styles.benefitsContainer}>
          {benefits.map((benefit, index) => (
            <View key={index} style={styles.benefitCapsule}>
              <Ionicons
                name="checkmark-circle"
                size={20}
                color={Colors.semantic.success.default}
                style={styles.benefitIcon}
              />
              <Text variant="body" weight="semiBold" color="charcoal" style={styles.benefitText}>
                {benefit.title}
              </Text>
            </View>
          ))}
        </View>
      </View>

      {/* Actions avec prix */}
      <View style={[styles.actions, { paddingBottom: insets.bottom + Spacing.m }]}>
        {/* Section Prix */}
        <View style={styles.pricingRow}>
          <View style={styles.pricingOption}>
            <Text variant="caption" style={[styles.pricingLabel, { color: Colors.neutral.white }]}>
              Mensuel
            </Text>
            <Text variant="h3" weight="bold" style={{ color: Colors.neutral.white }}>
              7,50€
            </Text>
            <Text variant="caption" style={{ color: Colors.neutral.pearl }}>
              par mois
            </Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.pricingOption}>
            <Text variant="caption" style={[styles.pricingLabel, { color: Colors.neutral.white }]}>
              Annuel
            </Text>
            <Text variant="h3" weight="bold" style={{ color: Colors.neutral.white }}>
              65,99€
            </Text>
            <Text variant="caption" style={{ color: Colors.neutral.pearl }}>
              5,50€/mois
            </Text>
          </View>
        </View>

        <Button onPress={handleUpgrade} variant="primary" size="lg" style={styles.upgradeButton}>
          Devenir Premium
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.neutral.white,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: Spacing.m,
    paddingBottom: 0,
  },
  closeButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: BorderRadius.round,
    backgroundColor: Colors.neutral.cloud,
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.l,
    paddingTop: Spacing.l,
  },
  title: {
    marginBottom: Spacing.m,
  },
  description: {
    marginBottom: Spacing.l,
    lineHeight: 22,
  },
  benefitsContainer: {
    marginBottom: Spacing.m,
  },
  benefitCapsule: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.neutral.cloud,
    borderRadius: BorderRadius.large,
    padding: Spacing.m,
    marginBottom: Spacing.s,
  },
  benefitIcon: {
    marginRight: Spacing.s,
  },
  benefitText: {
    flex: 1,
  },
  pricingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.neutral.charcoal,
    borderRadius: BorderRadius.large,
    padding: Spacing.l,
    marginBottom: Spacing.l,
  },
  pricingOption: {
    flex: 1,
    alignItems: 'center',
  },
  pricingLabel: {
    marginBottom: Spacing.xxs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  divider: {
    width: 1,
    height: 60,
    backgroundColor: Colors.neutral.iron,
    marginHorizontal: Spacing.m,
  },
  actions: {
    padding: Spacing.l,
    paddingTop: Spacing.l,
    borderTopWidth: 1,
    borderTopColor: Colors.neutral.pearl,
    backgroundColor: Colors.neutral.white,
  },
  upgradeButton: {
    width: '100%',
  },
});
