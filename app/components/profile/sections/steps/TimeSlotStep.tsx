import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/theme';

interface TimeSlot {
  id: string;
  start: string;
  end: string;
  available: boolean;
}

interface TimeSlotStepProps {
  selectedSlot: string | null;
  onSlotSelect: (slotId: string) => void;
  selectedDate: Date | null;
  proId: string;
  availableSlots?: TimeSlot[];
  loading?: boolean;
}

// Générer les créneaux d'une heure de 7h à 14h
const generateTimeSlots = (): TimeSlot[] => {
  const slots: TimeSlot[] = [];
  for (let hour = 7; hour <= 14; hour++) {
    const startTime = `${hour.toString().padStart(2, '0')}:00`;
    const endTime = `${(hour + 1).toString().padStart(2, '0')}:00`;
    slots.push({
      id: `slot-${hour}`,
      start: startTime,
      end: endTime,
      available: true, // Par défaut disponible, sera remplacé par les vraies données
    });
  }
  return slots;
};

const DEFAULT_SLOTS: TimeSlot[] = generateTimeSlots();

export const TimeSlotStep: React.FC<TimeSlotStepProps> = ({
  selectedSlot,
  onSlotSelect,
  selectedDate,
  proId,
  availableSlots = DEFAULT_SLOTS,
  loading = false,
}) => {

  return (
    <View style={styles.container}>
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary.navy} />
          <Text style={styles.loadingText}>Chargement des créneaux...</Text>
        </View>
      ) : availableSlots.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="calendar-outline" size={48} color={Colors.neutral.mist} />
          <Text style={styles.emptyText}>Aucun créneau disponible pour cette date</Text>
        </View>
      ) : (
        <>
          <Text style={styles.sectionTitle}>Heure de départ souhaitée</Text>
          <Text style={styles.subtitle}>À partir de</Text>

          <ScrollView style={styles.slotsContainer} showsVerticalScrollIndicator={false}>
            <View style={styles.slotsGrid}>
              {availableSlots.map(slot => (
                <TouchableOpacity
                  key={slot.id}
                  style={[
                    styles.timeCircle,
                    !slot.available && styles.timeCircleDisabled,
                    selectedSlot === slot.start && styles.timeCircleSelected,
                  ]}
                  onPress={() => slot.available && onSlotSelect(slot.start)}
                  disabled={!slot.available}
                >
                  <Text style={[
                    styles.timeText,
                    selectedSlot === slot.start && styles.timeTextSelected,
                  ]}>
                    {slot.start.split(':')[0]}h
                  </Text>
                  {!slot.available && (
                    <Text style={styles.unavailableText}>Indisponible</Text>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          {selectedSlot && (
            <View style={styles.selectedInfo}>
              <Ionicons name="checkmark-circle" size={20} color={Colors.primary.electric} />
              <Text style={styles.selectedInfoText}>
                Eagle vous précisera l'heure de départ après validation auprès du parcours de Golf
              </Text>
            </View>
          )}
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.neutral.charcoal,
    marginBottom: 24,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: Colors.neutral.slate,
    marginBottom: 16,
    textAlign: 'center',
  },
  slotsContainer: {
    flex: 1,
  },
  slotsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    justifyContent: 'center',
  },
  timeCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: Colors.neutral.mist,
    backgroundColor: Colors.neutral.white,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  timeCircleDisabled: {
    borderColor: Colors.neutral.pearl,
    backgroundColor: Colors.neutral.snow,
    opacity: 0.6,
  },
  timeCircleSelected: {
    borderColor: Colors.primary.navy,
    backgroundColor: Colors.primary.navy,
  },
  timeText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.neutral.charcoal,
  },
  timeTextSelected: {
    color: Colors.neutral.white,
  },
  unavailableText: {
    position: 'absolute',
    bottom: -20,
    fontSize: 10,
    color: Colors.neutral.slate,
    textAlign: 'center',
  },
  selectedInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary.lightBlue,
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
    gap: 8,
  },
  selectedInfoText: {
    fontSize: 14,
    color: Colors.primary.navy,
    fontWeight: '500',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 16,
    color: Colors.neutral.slate,
    marginTop: 12,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: Colors.neutral.slate,
    marginTop: 12,
    textAlign: 'center',
  },
  // Ajouts manquants
  neutral: {
    snow: '#F7F7F7',
    pearl: '#E1E1E1',
    slate: '#64748B',
  },
});