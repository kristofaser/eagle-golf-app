/**
 * TimeSlotSelectionStep - Composant de sélection des créneaux horaires
 *
 * ✅ EXTRAIT du BookingScreen pour améliorer la modularité
 */
import React, { memo } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius } from '@/constants/theme';
import { Text } from '@/components/atoms';

export interface TimeSlot {
  time: string;
  hour: string;
  period: 'morning' | 'afternoon';
  available: boolean;
}

interface TimeSlotSelectionStepProps {
  selectedDate: string;
  selectedSlot: TimeSlot | null;
  availableSlots: TimeSlot[];
  formatDateShort: (date: string) => string;
  onSlotSelect: (slot: TimeSlot) => void;
}

export const TimeSlotSelectionStep = memo(function TimeSlotSelectionStep({
  selectedDate,
  selectedSlot,
  availableSlots,
  formatDateShort,
  onSlotSelect,
}: TimeSlotSelectionStepProps) {
  return (
    <ScrollView showsVerticalScrollIndicator={false}>
      {/* Date sélectionnée */}
      <View style={styles.section}>
        <Text variant="h3" weight="semiBold" color="charcoal" style={styles.selectedDateTitle}>
          {selectedDate && formatDateShort(selectedDate)}
        </Text>
        <Text variant="body" weight="medium" color="iron" style={styles.sectionSubtitle}>
          Choisissez l'heure de départ souhaitée
        </Text>

        {availableSlots.length > 0 ? (
          <View style={styles.slotsGrid}>
            {availableSlots.map((slot, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.slotButton,
                  selectedSlot?.time === slot.time && styles.slotButtonSelected,
                  !slot.available && styles.slotButtonDisabled,
                ]}
                onPress={() => slot.available && onSlotSelect(slot)}
                disabled={!slot.available}
              >
                <Text
                  variant="body"
                  weight={selectedSlot?.time === slot.time ? 'semiBold' : 'medium'}
                  color={
                    !slot.available
                      ? 'mist'
                      : selectedSlot?.time === slot.time
                        ? 'white'
                        : 'charcoal'
                  }
                >
                  {slot.time}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <View style={styles.noSlotsContainer}>
            <Ionicons name="calendar-outline" size={48} color={Colors.neutral.mist} />
            <Text variant="body" color="iron" style={styles.noSlotsText}>
              Aucun créneau disponible pour cette date
            </Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
});

const styles = StyleSheet.create({
  section: {
    paddingHorizontal: Spacing.m,
    paddingVertical: Spacing.m,
  },
  selectedDateTitle: {
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  sectionSubtitle: {
    textAlign: 'center',
    marginBottom: Spacing.l,
  },
  slotsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    paddingHorizontal: Spacing.s,
    gap: '5%',
  },
  slotButton: {
    width: '30%',
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.xxs,
    backgroundColor: Colors.neutral.cloud,
    borderRadius: BorderRadius.small,
    borderWidth: 1,
    borderColor: Colors.neutral.mist,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.s,
  },
  slotButtonSelected: {
    backgroundColor: Colors.primary.accent,
    borderColor: Colors.primary.navy,
  },
  slotButtonDisabled: {
    backgroundColor: Colors.neutral.mist,
    borderColor: Colors.neutral.pearl,
  },
  noSlotsContainer: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
  },
  noSlotsText: {
    marginTop: Spacing.s,
    textAlign: 'center',
  },
});
