import React, { memo } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/constants/theme';
import { profileStyles } from '../styles/profileStyles';

interface BookingFooterProps {
  price: number;
  players: number;
  onPlayersChange: (value: number) => void;
  onBook: () => void;
  isAuthenticated: boolean;
  bookingButtonText: string;
  bookingButtonAccessibilityLabel: string;
  bookingButtonAccessibilityHint: string;
  canIncrementPlayers: boolean;
  canDecrementPlayers: boolean;
}

export const BookingFooter = memo<BookingFooterProps>(({
  price,
  players,
  onPlayersChange,
  onBook,
  isAuthenticated,
  bookingButtonText,
  bookingButtonAccessibilityLabel,
  bookingButtonAccessibilityHint,
  canIncrementPlayers,
  canDecrementPlayers,
}) => {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        profileStyles.bookingButtonContainer,
        { paddingBottom: insets.bottom + 12 }
      ]}
    >
      {/* Prix */}
      <View style={profileStyles.bookingPriceInfo}>
        {price > 0 ? (
          <>
            <Text style={profileStyles.bookingPricePrefix}>À partir de</Text>
            <Text style={profileStyles.bookingPrice}>{price}€</Text>
          </>
        ) : (
          <Text style={profileStyles.bookingPrice}>Sur devis</Text>
        )}
      </View>

      {/* Sélecteur de nombre de joueurs */}
      <View style={profileStyles.playersSelector}>
        <TouchableOpacity
          style={[profileStyles.playerButton, !canDecrementPlayers && profileStyles.playerButtonDisabled]}
          onPress={() => onPlayersChange(players - 1)}
          disabled={!canDecrementPlayers}
          activeOpacity={0.7}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="Diminuer le nombre de joueurs"
          accessibilityState={{ disabled: !canDecrementPlayers }}
          accessibilityValue={{ min: 1, max: 3, now: players, text: `${players} joueur${players > 1 ? 's' : ''}` }}
        >
          <Ionicons
            name="remove"
            size={20}
            color={!canDecrementPlayers ? Colors.neutral.mist : Colors.neutral.charcoal}
            accessibilityElementsHidden={true}
          />
        </TouchableOpacity>

        <View
          style={profileStyles.playersDisplay}
          accessible={true}
          accessibilityRole="text"
          accessibilityLabel={`${players} ${players === 1 ? 'joueur' : 'joueurs'} sélectionné${players > 1 ? 's' : ''}`}
        >
          <Text style={profileStyles.playersNumber} accessibilityElementsHidden={true}>{players}</Text>
          <Text style={profileStyles.playersLabel} accessibilityElementsHidden={true}>
            {players === 1 ? 'joueur' : 'joueurs'}
          </Text>
        </View>

        <TouchableOpacity
          style={[profileStyles.playerButton, !canIncrementPlayers && profileStyles.playerButtonDisabled]}
          onPress={() => onPlayersChange(players + 1)}
          disabled={!canIncrementPlayers}
          activeOpacity={0.7}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="Augmenter le nombre de joueurs"
          accessibilityState={{ disabled: !canIncrementPlayers }}
          accessibilityValue={{ min: 1, max: 3, now: players, text: `${players} joueur${players > 1 ? 's' : ''}` }}
        >
          <Ionicons
            name="add"
            size={20}
            color={!canIncrementPlayers ? Colors.neutral.mist : Colors.neutral.charcoal}
            accessibilityElementsHidden={true}
          />
        </TouchableOpacity>
      </View>

      {/* Bouton de réservation */}
      <TouchableOpacity
        style={profileStyles.bookingButton}
        onPress={onBook}
        activeOpacity={0.7}
        accessible={true}
        accessibilityRole="button"
        accessibilityLabel={bookingButtonAccessibilityLabel}
        accessibilityHint={bookingButtonAccessibilityHint}
      >
        <Text style={profileStyles.bookingButtonText} accessibilityElementsHidden={true}>
          {bookingButtonText}
        </Text>
      </TouchableOpacity>
    </View>
  );
});

BookingFooter.displayName = 'BookingFooter';