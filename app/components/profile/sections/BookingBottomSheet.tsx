import React, { forwardRef, useImperativeHandle, useRef, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import BottomSheet, { BottomSheetView, BottomSheetBackdrop } from '@gorhom/bottom-sheet';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/constants/theme';

interface BookingBottomSheetProps {
  price: number;
  players: number;
  onPlayersChange: (value: number) => void;
  onBook: () => void;
  isAuthenticated: boolean;
  canIncrementPlayers: boolean;
  canDecrementPlayers: boolean;
  selectedCourseName?: string;
}

export interface BookingBottomSheetRef {
  open: () => void;
  close: () => void;
}

export const BookingBottomSheet = forwardRef<BookingBottomSheetRef, BookingBottomSheetProps>(({
  price,
  players,
  onPlayersChange,
  onBook,
  isAuthenticated,
  canIncrementPlayers,
  canDecrementPlayers,
  selectedCourseName,
}, ref) => {
  const insets = useSafeAreaInsets();
  const bottomSheetRef = useRef<BottomSheet>(null);

  useImperativeHandle(ref, () => ({
    open: () => bottomSheetRef.current?.expand(),
    close: () => bottomSheetRef.current?.close(),
  }));

  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.5}
      />
    ),
    []
  );

  const handleBookingPress = () => {
    bottomSheetRef.current?.close();
    onBook();
  };

  return (
    <BottomSheet
      ref={bottomSheetRef}
      index={-1}
      snapPoints={['45%']}
      enablePanDownToClose
      backdropComponent={renderBackdrop}
      handleIndicatorStyle={styles.indicator}
      backgroundStyle={styles.background}
    >
      <BottomSheetView style={[styles.content, { paddingBottom: insets.bottom }]}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Configurer votre réservation</Text>
          <TouchableOpacity
            onPress={() => bottomSheetRef.current?.close()}
            style={styles.closeButton}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Fermer"
          >
            <Ionicons name="close" size={24} color={Colors.neutral.charcoal} />
          </TouchableOpacity>
        </View>

        {/* Golf sélectionné */}
        {selectedCourseName && (
          <View style={styles.courseInfo}>
            <Ionicons name="location-outline" size={20} color={Colors.primary.coral} />
            <Text style={styles.courseName}>{selectedCourseName}</Text>
          </View>
        )}

        {/* Sélecteur de joueurs */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Nombre de joueurs</Text>
          <View style={styles.playersSelector}>
            <TouchableOpacity
              style={[styles.playerButton, !canDecrementPlayers && styles.playerButtonDisabled]}
              onPress={() => onPlayersChange(players - 1)}
              disabled={!canDecrementPlayers}
              activeOpacity={0.7}
            >
              <Ionicons
                name="remove-circle"
                size={32}
                color={!canDecrementPlayers ? Colors.neutral.mist : Colors.primary.coral}
              />
            </TouchableOpacity>

            <View style={styles.playersDisplay}>
              <Text style={styles.playersNumber}>{players}</Text>
              <Text style={styles.playersLabel}>
                {players === 1 ? 'joueur' : 'joueurs'}
              </Text>
            </View>

            <TouchableOpacity
              style={[styles.playerButton, !canIncrementPlayers && styles.playerButtonDisabled]}
              onPress={() => onPlayersChange(players + 1)}
              disabled={!canIncrementPlayers}
              activeOpacity={0.7}
            >
              <Ionicons
                name="add-circle"
                size={32}
                color={!canIncrementPlayers ? Colors.neutral.mist : Colors.primary.coral}
              />
            </TouchableOpacity>
          </View>
          <Text style={styles.playersHint}>
            Le tarif peut varier selon le nombre de participants
          </Text>
        </View>

        {/* Prix récapitulatif */}
        <View style={styles.priceSection}>
          <Text style={styles.priceSectionTitle}>Tarif estimé</Text>
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Par joueur</Text>
            {price > 0 ? (
              <Text style={styles.priceValue}>{price}€</Text>
            ) : (
              <Text style={styles.priceValue}>Sur devis</Text>
            )}
          </View>
          {players > 1 && price > 0 && (
            <View style={[styles.priceRow, styles.totalRow]}>
              <Text style={styles.totalLabel}>Total ({players} joueurs)</Text>
              <Text style={styles.totalValue}>{price * players}€</Text>
            </View>
          )}
        </View>

        {/* Bouton de confirmation */}
        <TouchableOpacity
          style={styles.confirmButton}
          onPress={handleBookingPress}
          activeOpacity={0.8}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel={
            isAuthenticated
              ? `Confirmer la réservation pour ${players} ${players === 1 ? 'joueur' : 'joueurs'}`
              : 'Se connecter pour réserver'
          }
        >
          <Text style={styles.confirmButtonText}>
            {isAuthenticated ? 'Confirmer la réservation' : 'Se connecter pour réserver'}
          </Text>
        </TouchableOpacity>
      </BottomSheetView>
    </BottomSheet>
  );
});

BookingBottomSheet.displayName = 'BookingBottomSheet';

const styles = StyleSheet.create({
  background: {
    backgroundColor: Colors.neutral.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  indicator: {
    backgroundColor: Colors.neutral.mist,
    width: 40,
    height: 4,
    marginTop: 12,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    marginTop: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.neutral.charcoal,
  },
  closeButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  courseInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.neutral.snow,
    padding: 12,
    borderRadius: 12,
    marginBottom: 24,
  },
  courseName: {
    fontSize: 14,
    color: Colors.neutral.charcoal,
    marginLeft: 8,
    flex: 1,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.neutral.charcoal,
    marginBottom: 16,
  },
  playersSelector: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  playerButton: {
    padding: 8,
  },
  playerButtonDisabled: {
    opacity: 0.3,
  },
  playersDisplay: {
    alignItems: 'center',
    marginHorizontal: 32,
  },
  playersNumber: {
    fontSize: 36,
    fontWeight: '700',
    color: Colors.neutral.charcoal,
    lineHeight: 42,
  },
  playersLabel: {
    fontSize: 14,
    color: Colors.neutral.slate,
    marginTop: 4,
  },
  playersHint: {
    fontSize: 12,
    color: Colors.neutral.slate,
    textAlign: 'center',
    marginTop: 12,
  },
  priceSection: {
    backgroundColor: Colors.neutral.snow,
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  priceSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.neutral.slate,
    marginBottom: 12,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  priceLabel: {
    fontSize: 14,
    color: Colors.neutral.slate,
  },
  priceValue: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.neutral.charcoal,
  },
  totalRow: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.neutral.pearl,
    marginTop: 8,
    marginBottom: 0,
  },
  totalLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.neutral.charcoal,
  },
  totalValue: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.primary.coral,
  },
  confirmButton: {
    backgroundColor: Colors.primary.coral,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  confirmButtonText: {
    color: Colors.neutral.white,
    fontSize: 16,
    fontWeight: '700',
  },
});