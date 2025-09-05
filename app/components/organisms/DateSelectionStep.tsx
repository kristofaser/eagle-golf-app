/**
 * DateSelectionStep - Composant de sélection de date pour la réservation
 *
 * ✅ EXTRAIT du BookingScreen pour améliorer la modularité
 */
import React, { memo } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Calendar, DateData } from 'react-native-calendars';
import { Colors, Spacing } from '@/constants/theme';
import { Text } from '@/components/atoms';

interface DateSelectionStepProps {
  selectedDate: string;
  markedDates: any;
  minDate?: string;
  maxDate?: string;
  isProAvailableOnDate: (date: string) => boolean;
  onDateSelect: (dateString: string) => void;
}

export const DateSelectionStep = memo(function DateSelectionStep({
  selectedDate,
  markedDates,
  minDate,
  maxDate,
  isProAvailableOnDate,
  onDateSelect,
}: DateSelectionStepProps) {
  return (
    <ScrollView showsVerticalScrollIndicator={false}>
      {/* Calendrier */}
      <View style={styles.section}>
        <Text variant="body" weight="semiBold" color="charcoal" style={styles.sectionTitle}>
          Choisissez une date
        </Text>

        {/* Légende */}
        <View style={styles.calendarLegend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendCircle, { backgroundColor: Colors.semantic.success }]} />
            <Text variant="caption" color="iron">
              Disponible
            </Text>
          </View>
        </View>

        <Calendar
          markedDates={markedDates}
          markingType="custom"
          current={selectedDate || undefined}
          onDayPress={(day: DateData) => {
            // Sélectionner seulement si le pro est disponible
            if (isProAvailableOnDate(day.dateString)) {
              onDateSelect(day.dateString);
            }
            // Ne plus afficher d'alerte pour les jours non disponibles
          }}
          minDate={minDate}
          maxDate={maxDate}
          firstDay={1}
          theme={{
            backgroundColor: Colors.neutral.white,
            calendarBackground: Colors.neutral.white,
            selectedDayBackgroundColor: Colors.primary.accent,
            selectedDayTextColor: Colors.neutral.white,
            todayTextColor: Colors.primary.accent,
            dayTextColor: Colors.neutral.charcoal,
            textDisabledColor: Colors.neutral.mist,
            monthTextColor: Colors.neutral.charcoal,
            arrowColor: Colors.primary.accent,
            textMonthFontWeight: '600',
            textDayFontSize: 14,
            textMonthFontSize: 16,
            textDayHeaderFontSize: 12,
          }}
        />
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
    marginBottom: Spacing.s,
  },
  calendarLegend: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: Spacing.s,
    paddingHorizontal: Spacing.xs,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: Spacing.m,
  },
  legendCircle: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: Spacing.xs,
  },
});
