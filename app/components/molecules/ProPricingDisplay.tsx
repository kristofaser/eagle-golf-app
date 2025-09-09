import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Colors } from '@/constants/theme';
import { pricingService, ProPricing } from '@/services/pricing.service';
import { useQuery } from '@tanstack/react-query';

interface ProPricingDisplayProps {
  proId: string;
}

export function ProPricingDisplay({ proId }: ProPricingDisplayProps) {
  // Utiliser React Query pour charger les tarifs
  const { data: prices = [], isLoading: loading } = useQuery({
    queryKey: ['proPricing', proId],
    queryFn: async () => {
      const pricingData = await pricingService.getProPricing(proId);
      return pricingData;
    },
    enabled: !!proId,
    staleTime: 1000 * 60 * 5, // Considérer les données comme fraîches pendant 5 minutes
  });

  const getPrice = (holes: number, players: number): string => {
    const price = prices.find((p) => p.holes === holes && p.players_count === players);
    return price ? `${price.price / 100}€` : '-';
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="small" color={Colors.primary.accent} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Tarifs</Text>

      <View style={styles.priceGrid}>
        {/* 9 Trous */}
        <View style={styles.priceSection}>
          <Text style={styles.sectionTitle}>9 Trous</Text>

          <View style={styles.priceCard}>
            <View style={styles.priceRow}>
              <Text style={styles.playerLabel}>1 joueur</Text>
              <Text style={styles.priceValue}>{getPrice(9, 1)}</Text>
            </View>
            <View style={styles.priceRow}>
              <Text style={styles.playerLabel}>2 joueurs</Text>
              <Text style={styles.priceValue}>{getPrice(9, 2)}</Text>
            </View>
            <View style={styles.priceRow}>
              <Text style={styles.playerLabel}>3 joueurs</Text>
              <Text style={styles.priceValue}>{getPrice(9, 3)}</Text>
            </View>
          </View>
        </View>

        {/* 18 Trous */}
        <View style={styles.priceSection}>
          <Text style={styles.sectionTitle}>18 Trous</Text>

          <View style={styles.priceCard}>
            <View style={styles.priceRow}>
              <Text style={styles.playerLabel}>1 joueur</Text>
              <Text style={styles.priceValue}>{getPrice(18, 1)}</Text>
            </View>
            <View style={styles.priceRow}>
              <Text style={styles.playerLabel}>2 joueurs</Text>
              <Text style={styles.priceValue}>{getPrice(18, 2)}</Text>
            </View>
            <View style={styles.priceRow}>
              <Text style={styles.playerLabel}>3 joueurs</Text>
              <Text style={styles.priceValue}>{getPrice(18, 3)}</Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 0,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.neutral.charcoal,
    marginBottom: 20,
  },
  priceGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  priceSection: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.neutral.charcoal,
    marginBottom: 12,
    textAlign: 'center',
  },
  priceCard: {
    backgroundColor: Colors.ui.lightBackground,
    borderRadius: 12,
    padding: 12,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.shadows.light,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  playerLabel: {
    fontSize: 14,
    color: Colors.ui.textGray,
  },
  priceValue: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.primary.accent,
  },
});
