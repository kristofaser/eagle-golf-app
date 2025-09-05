/**
 * BookingConfigurationStep - Composant de configuration de la réservation
 * (Nombre de joueurs et trous)
 *
 * ✅ EXTRAIT du BookingScreen pour améliorer la modularité
 */
import React, { memo } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius } from '@/constants/theme';
import { Text } from '@/components/atoms';

interface BookingConfigurationStepProps {
  numberOfPlayers: number;
  holes: 9 | 18;
  onNumberOfPlayersChange: (players: number) => void;
  onHolesChange: (holes: 9 | 18) => void;
}

export const BookingConfigurationStep = memo(function BookingConfigurationStep({
  numberOfPlayers,
  holes,
  onNumberOfPlayersChange,
  onHolesChange,
}: BookingConfigurationStepProps) {
  return (
    <ScrollView showsVerticalScrollIndicator={false}>
      {/* Nombre de joueurs */}
      <View style={styles.section}>
        <Text variant="body" weight="semiBold" color="charcoal" style={styles.sectionTitle}>
          Nombre de joueurs
        </Text>
        <View style={styles.playersSelector}>
          <TouchableOpacity
            style={[styles.playerButton, numberOfPlayers === 1 && styles.playerButtonDisabled]}
            onPress={() => onNumberOfPlayersChange(Math.max(1, numberOfPlayers - 1))}
            disabled={numberOfPlayers === 1}
          >
            <Ionicons
              name="remove"
              size={20}
              color={numberOfPlayers === 1 ? Colors.neutral.mist : Colors.neutral.charcoal}
            />
          </TouchableOpacity>

          <View style={styles.playersDisplay}>
            <Text variant="h3" weight="bold" color="charcoal">
              {numberOfPlayers}
            </Text>
            <Text variant="caption" color="iron">
              {numberOfPlayers === 1 ? 'joueur' : 'joueurs'}
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.playerButton, numberOfPlayers === 3 && styles.playerButtonDisabled]}
            onPress={() => onNumberOfPlayersChange(Math.min(3, numberOfPlayers + 1))}
            disabled={numberOfPlayers === 3}
          >
            <Ionicons
              name="add"
              size={20}
              color={numberOfPlayers === 3 ? Colors.neutral.mist : Colors.neutral.charcoal}
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Nombre de trous */}
      <View style={styles.section}>
        <Text variant="body" weight="semiBold" color="charcoal" style={styles.sectionTitle}>
          Nombre de trous
        </Text>
        <View style={styles.holesSelector}>
          <TouchableOpacity
            style={[styles.holeButton, holes === 9 && styles.holeButtonSelected]}
            onPress={() => onHolesChange(9)}
          >
            <Text
              variant="body"
              weight={holes === 9 ? 'semiBold' : 'medium'}
              color={holes === 9 ? 'white' : 'charcoal'}
            >
              9 trous
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.holeButton, holes === 18 && styles.holeButtonSelected]}
            onPress={() => onHolesChange(18)}
          >
            <Text
              variant="body"
              weight={holes === 18 ? 'semiBold' : 'medium'}
              color={holes === 18 ? 'white' : 'charcoal'}
            >
              18 trous
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
});

const styles = StyleSheet.create({
  section: {
    paddingHorizontal: Spacing.m,
    paddingVertical: Spacing.m,
  },
  sectionTitle: {
    marginBottom: Spacing.l,
    textAlign: 'center',
  },
  playersSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xl,
  },
  playerButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.neutral.cloud,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.neutral.mist,
  },
  playerButtonDisabled: {
    backgroundColor: Colors.neutral.mist,
    borderColor: Colors.neutral.pearl,
  },
  playersDisplay: {
    alignItems: 'center',
    marginHorizontal: Spacing.xl,
    minWidth: 80,
  },
  holesSelector: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: Spacing.m,
  },
  holeButton: {
    flex: 0.45,
    paddingVertical: Spacing.m,
    backgroundColor: Colors.neutral.cloud,
    borderRadius: BorderRadius.medium,
    borderWidth: 1,
    borderColor: Colors.neutral.mist,
    alignItems: 'center',
  },
  holeButtonSelected: {
    backgroundColor: Colors.primary.accent,
    borderColor: Colors.primary.navy,
  },
});
