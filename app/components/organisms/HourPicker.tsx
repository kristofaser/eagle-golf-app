import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn } from 'react-native-reanimated';
import { Colors, Spacing, Typography } from '@/constants/theme';
import { bookingService } from '@/services/booking.service';

interface HourPickerProps {
  proId: string;
  date: Date;
  period: 'morning' | 'afternoon';
  onTimeSelect: (time: string, golfCourseId: string, golfCourseName: string) => void;
  selectedTime?: string | null;
}

interface TimeSlot {
  time: string;
  available: boolean;
  golfCourseId?: string;
  golfCourseName?: string;
}

export const HourPicker: React.FC<HourPickerProps> = ({
  proId,
  date,
  period,
  onTimeSelect,
  selectedTime,
}) => {
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(selectedTime || null);
  const [golfInfo, setGolfInfo] = useState<{ id: string; name: string } | null>(null);

  // Générer les créneaux horaires selon la période
  const generateTimeSlots = () => {
    const slots: TimeSlot[] = [];
    const startHour = period === 'morning' ? 6 : 12;
    const endHour = period === 'morning' ? 12 : 19;

    for (let hour = startHour; hour < endHour; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const timeString = `${hour.toString().padStart(2, '0')}:${minute
          .toString()
          .padStart(2, '0')}`;
        slots.push({
          time: timeString,
          available: false,
        });
      }
    }
    return slots;
  };

  // Charger les disponibilités pour la date et période sélectionnées
  useEffect(() => {
    loadAvailabilities();
  }, [proId, date, period]);

  const loadAvailabilities = async () => {
    try {
      setLoading(true);

      const dateString = date.toISOString().split('T')[0];

      const { data, error } = await bookingService.getProAvailabilities({
        proId,
        startDate: dateString,
        endDate: dateString,
      });

      if (!error && data && data.length > 0) {
        const slots = generateTimeSlots();

        // Marquer les créneaux disponibles
        data.forEach((avail) => {
          const startTime = avail.start_time.slice(0, 5); // Format HH:MM
          const slotIndex = slots.findIndex((slot) => slot.time === startTime);

          if (slotIndex !== -1) {
            slots[slotIndex] = {
              ...slots[slotIndex],
              available: true,
              golfCourseId: avail.golf_course_id,
              golfCourseName: avail.golf_courses?.name || 'Golf',
            };
          }
        });

        // Récupérer les infos du premier golf disponible
        const firstAvailable = slots.find((slot) => slot.available);
        if (firstAvailable && firstAvailable.golfCourseId) {
          setGolfInfo({
            id: firstAvailable.golfCourseId,
            name: firstAvailable.golfCourseName || 'Golf',
          });
        }

        setTimeSlots(slots);
      } else {
        // Si pas de données, tous les créneaux sont indisponibles
        setTimeSlots(generateTimeSlots());
      }
    } catch (err) {
      console.error('Erreur chargement créneaux:', err);
      setTimeSlots(generateTimeSlots());
    } finally {
      setLoading(false);
    }
  };

  const handleTimeSelect = (slot: TimeSlot) => {
    if (!slot.available) return;

    setSelectedSlot(slot.time);
    onTimeSelect(
      slot.time,
      slot.golfCourseId || golfInfo?.id || '',
      slot.golfCourseName || golfInfo?.name || 'Golf'
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary.accent} />
        <Text style={styles.loadingText}>Chargement des créneaux...</Text>
      </View>
    );
  }

  const availableSlots = timeSlots.filter((slot) => slot.available);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Heure de début :</Text>
        {availableSlots.length > 0 && (
          <Text style={styles.availableCount}>{availableSlots.length} créneaux disponibles</Text>
        )}
      </View>

      {availableSlots.length === 0 ? (
        <View style={styles.noSlotsContainer}>
          <Ionicons name="calendar-outline" size={48} color={Colors.ui.inputBorder} />
          <Text style={styles.noSlotsText}>Aucun créneau disponible pour cette période</Text>
          <Text style={styles.noSlotsSubtext}>Essayez une autre période ou une autre date</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.slotsContainer}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.slotsContent}
        >
          <View style={styles.slotsGrid}>
            {timeSlots.map((slot, index) => (
              <Animated.View
                key={slot.time}
                entering={FadeIn.delay(index * 20)}
                style={styles.slotWrapper}
              >
                <TouchableOpacity
                  style={[
                    styles.slotButton,
                    !slot.available && styles.slotButtonDisabled,
                    selectedSlot === slot.time && slot.available && styles.slotButtonSelected,
                  ]}
                  onPress={() => handleTimeSelect(slot)}
                  disabled={!slot.available}
                >
                  <Text
                    style={[
                      styles.slotText,
                      !slot.available && styles.slotTextDisabled,
                      selectedSlot === slot.time && slot.available && styles.slotTextSelected,
                    ]}
                  >
                    {slot.time}
                  </Text>
                  {slot.available && (
                    <View style={styles.availableIndicator}>
                      <View
                        style={[
                          styles.availableDot,
                          selectedSlot === slot.time && styles.availableDotSelected,
                        ]}
                      />
                    </View>
                  )}
                </TouchableOpacity>
              </Animated.View>
            ))}
          </View>

          {/* Informations sur le golf */}
          {golfInfo && (
            <View style={styles.golfInfoContainer}>
              <Ionicons name="location" size={20} color={Colors.primary.accent} />
              <Text style={styles.golfInfoText}>Les parties se déroulent au {golfInfo.name}</Text>
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: Spacing.m,
    fontSize: 16,
    color: Colors.ui.subtleGray,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: Spacing.l,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.neutral.charcoal,
  },
  availableCount: {
    fontSize: 14,
    color: Colors.semantic.success,
    fontWeight: '500',
  },
  slotsContainer: {
    flex: 1,
  },
  slotsContent: {
    paddingBottom: Spacing.xl,
  },
  slotsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -Spacing.xs,
  },
  slotWrapper: {
    width: '25%',
    padding: Spacing.xs,
  },
  slotButton: {
    backgroundColor: Colors.ui.lightBackground,
    paddingVertical: Spacing.m,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.shadows.light,
    position: 'relative',
  },
  slotButtonDisabled: {
    backgroundColor: Colors.ui.veryLightGray,
    borderColor: Colors.ui.inputBorder,
    opacity: 0.5,
  },
  slotButtonSelected: {
    backgroundColor: Colors.primary.accent,
    borderColor: Colors.primary.accent,
  },
  slotText: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.neutral.charcoal,
  },
  slotTextDisabled: {
    color: Colors.ui.subtleGray,
  },
  slotTextSelected: {
    color: Colors.neutral.white,
    fontWeight: '600',
  },
  availableIndicator: {
    position: 'absolute',
    top: 4,
    right: 4,
  },
  availableDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.semantic.success,
  },
  availableDotSelected: {
    backgroundColor: Colors.neutral.white,
  },
  noSlotsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  noSlotsText: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.neutral.charcoal,
    marginTop: Spacing.m,
    textAlign: 'center',
  },
  noSlotsSubtext: {
    fontSize: 16,
    color: Colors.ui.subtleGray,
    marginTop: Spacing.s,
    textAlign: 'center',
  },
  golfInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.xl,
    padding: Spacing.m,
    backgroundColor: Colors.ui.lightBackground,
    borderRadius: 12,
  },
  golfInfoText: {
    fontSize: 14,
    color: Colors.ui.textGray,
    marginLeft: Spacing.s,
    flex: 1,
  },
});
