import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Colors } from '@/constants/theme';
import { pricingService, ProPricing } from '@/services/pricing.service';
import { useQuery } from '@tanstack/react-query';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { UserIcon, UserMultipleIcon, UserGroupIcon } from '@hugeicons/core-free-icons';

interface ProPricingDisplayProps {
  proId: string;
}

const getPlayerIcon = (players: number) => {
  switch (players) {
    case 1:
      return UserIcon;
    case 2:
      return UserMultipleIcon;
    case 3:
      return UserGroupIcon;
    default:
      return UserIcon;
  }
};

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

  const getPrice = (holes: number, players: number): { price: string; suffix: string } | null => {
    const price = prices.find((p) => p.holes === holes && p.players_count === players);
    // Les prix sont stockés directement en euros dans la base de données
    return price ? { price: `${price.price}€`, suffix: '/pers' } : null;
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

      <View style={styles.cardsContainer}>
        {/* Card 9 Trous */}
        <View style={styles.priceCard}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>9 Trous</Text>
            <View style={styles.cardSeparator} />
          </View>

          <View style={styles.priceItem}>
            <View style={styles.iconCircle}>
              <HugeiconsIcon icon={getPlayerIcon(1)} size={20} color={Colors.neutral.white} />
            </View>
            <View style={styles.priceValueContainer}>
              {getPrice(9, 1) ? (
                <>
                  <Text style={styles.priceMain}>{getPrice(9, 1)!.price}</Text>
                  <Text style={styles.priceSuffix}>{getPrice(9, 1)!.suffix}</Text>
                </>
              ) : (
                <Text style={styles.priceMain}>-</Text>
              )}
            </View>
          </View>

          <View style={styles.itemSeparator} />

          <View style={styles.priceItem}>
            <View style={styles.iconCircle}>
              <HugeiconsIcon icon={getPlayerIcon(2)} size={20} color={Colors.neutral.white} />
            </View>
            <View style={styles.priceValueContainer}>
              {getPrice(9, 2) ? (
                <>
                  <Text style={styles.priceMain}>{getPrice(9, 2)!.price}</Text>
                  <Text style={styles.priceSuffix}>{getPrice(9, 2)!.suffix}</Text>
                </>
              ) : (
                <Text style={styles.priceMain}>-</Text>
              )}
            </View>
          </View>

          <View style={styles.itemSeparator} />

          <View style={styles.priceItem}>
            <View style={styles.iconCircle}>
              <HugeiconsIcon icon={getPlayerIcon(3)} size={20} color={Colors.neutral.white} />
            </View>
            <View style={styles.priceValueContainer}>
              {getPrice(9, 3) ? (
                <>
                  <Text style={styles.priceMain}>{getPrice(9, 3)!.price}</Text>
                  <Text style={styles.priceSuffix}>{getPrice(9, 3)!.suffix}</Text>
                </>
              ) : (
                <Text style={styles.priceMain}>-</Text>
              )}
            </View>
          </View>
        </View>

        {/* Card 18 Trous */}
        <View style={styles.priceCard}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>18 Trous</Text>
            <View style={styles.cardSeparator} />
          </View>

          <View style={styles.priceItem}>
            <View style={styles.iconCircle}>
              <HugeiconsIcon icon={getPlayerIcon(1)} size={20} color={Colors.neutral.white} />
            </View>
            <View style={styles.priceValueContainer}>
              {getPrice(18, 1) ? (
                <>
                  <Text style={styles.priceMain}>{getPrice(18, 1)!.price}</Text>
                  <Text style={styles.priceSuffix}>{getPrice(18, 1)!.suffix}</Text>
                </>
              ) : (
                <Text style={styles.priceMain}>-</Text>
              )}
            </View>
          </View>

          <View style={styles.itemSeparator} />

          <View style={styles.priceItem}>
            <View style={styles.iconCircle}>
              <HugeiconsIcon icon={getPlayerIcon(2)} size={20} color={Colors.neutral.white} />
            </View>
            <View style={styles.priceValueContainer}>
              {getPrice(18, 2) ? (
                <>
                  <Text style={styles.priceMain}>{getPrice(18, 2)!.price}</Text>
                  <Text style={styles.priceSuffix}>{getPrice(18, 2)!.suffix}</Text>
                </>
              ) : (
                <Text style={styles.priceMain}>-</Text>
              )}
            </View>
          </View>

          <View style={styles.itemSeparator} />

          <View style={styles.priceItem}>
            <View style={styles.iconCircle}>
              <HugeiconsIcon icon={getPlayerIcon(3)} size={20} color={Colors.neutral.white} />
            </View>
            <View style={styles.priceValueContainer}>
              {getPrice(18, 3) ? (
                <>
                  <Text style={styles.priceMain}>{getPrice(18, 3)!.price}</Text>
                  <Text style={styles.priceSuffix}>{getPrice(18, 3)!.suffix}</Text>
                </>
              ) : (
                <Text style={styles.priceMain}>-</Text>
              )}
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
  cardsContainer: {
    flexDirection: 'row',
    gap: 16,
  },
  priceCard: {
    flex: 1,
    backgroundColor: Colors.neutral.white,
    borderRadius: 12,
    padding: 16,
    shadowColor: Colors.neutral.charcoal,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.neutral.charcoal,
    marginBottom: 8,
  },
  cardSeparator: {
    width: '100%',
    height: 1,
    backgroundColor: Colors.neutral.mist,
  },
  priceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  priceValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  priceMain: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.primary.accent,
    lineHeight: 22,
  },
  priceSuffix: {
    fontSize: 11,
    fontWeight: '400',
    color: Colors.neutral.iron,
    marginTop: 2,
  },
  itemSeparator: {
    width: '60%',
    height: 1,
    backgroundColor: Colors.neutral.pearl,
    alignSelf: 'center',
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primary.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
