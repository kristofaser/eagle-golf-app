/**
 * DateSelectionStep - Composant de sélection de date pour la réservation
 *
 * ✅ EXTRAIT du BookingScreen pour améliorer la modularité
 */
import React, { memo, useState, useEffect, useMemo } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Calendar, DateData } from 'react-native-calendars';
import { Colors, Spacing, BorderRadius } from '@/constants/theme';
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
  // Calculer les mois avec des disponibilités
  const monthsWithAvailability = useMemo(() => {
    const months = new Map<string, { month: number; year: number; name: string }>();
    
    // Parcourir toutes les dates marquées
    Object.keys(markedDates || {}).forEach(dateString => {
      // Vérifier que la date a bien une disponibilité (customStyles défini)
      if (markedDates[dateString]?.customStyles) {
        const date = new Date(dateString);
        const monthKey = `${date.getFullYear()}-${date.getMonth()}`;
        
        if (!months.has(monthKey)) {
          const monthNames = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];
          months.set(monthKey, {
            month: date.getMonth(),
            year: date.getFullYear(),
            name: `${monthNames[date.getMonth()]} ${date.getFullYear()}`
          });
        }
      }
    });
    
    // Convertir en array et trier par date
    return Array.from(months.values()).sort((a, b) => {
      if (a.year !== b.year) return a.year - b.year;
      return a.month - b.month;
    });
  }, [markedDates]);

  // Déterminer le mois initial (premier mois avec disponibilités ou mois actuel)
  const initialMonth = useMemo(() => {
    if (monthsWithAvailability.length > 0) {
      const firstMonth = monthsWithAvailability[0];
      // Ajouter 1 au mois car le Calendar component attend des mois de 1-12
      const year = firstMonth.year;
      const month = String(firstMonth.month + 1).padStart(2, '0');
      const result = `${year}-${month}-01`;
      return result;
    }
    return undefined;
  }, [monthsWithAvailability]);

  const [currentMonth, setCurrentMonth] = useState(initialMonth);

  // Mettre à jour le mois quand initialMonth change
  useEffect(() => {
    if (initialMonth) {
      setCurrentMonth(initialMonth);
    }
  }, [initialMonth]);

  // Fonction pour naviguer vers un mois spécifique
  const navigateToMonth = (month: number, year: number) => {
    // month est déjà en format 0-11, on doit le convertir en format YYYY-MM-DD
    const monthStr = String(month + 1).padStart(2, '0');
    const dateStr = `${year}-${monthStr}-01`;
    setCurrentMonth(dateStr);
  };
  return (
    <ScrollView showsVerticalScrollIndicator={false}>
      {/* Calendrier */}
      <View style={styles.section}>
        <Calendar
          markedDates={markedDates}
          markingType="custom"
          current={currentMonth || selectedDate || undefined}
          key={currentMonth} // Force le calendrier à se mettre à jour
          onDayPress={(day: DateData) => {
            // Sélectionner seulement si le pro est disponible
            if (isProAvailableOnDate(day.dateString)) {
              onDateSelect(day.dateString);
            }
            // Ne plus afficher d'alerte pour les jours non disponibles
          }}
          onMonthChange={(month: DateData) => {
            setCurrentMonth(month.dateString);
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
        
        {/* Badges de navigation par mois */}
        {monthsWithAvailability.length > 0 && (
          <View style={styles.monthBadgesContainer}>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.monthBadgesScroll}
            >
              {monthsWithAvailability.map((monthInfo) => {
                const monthKey = `${monthInfo.year}-${monthInfo.month}`;
                const isCurrentMonth = currentMonth && 
                  new Date(currentMonth).getMonth() === monthInfo.month && 
                  new Date(currentMonth).getFullYear() === monthInfo.year;
                
                return (
                  <TouchableOpacity
                    key={monthKey}
                    style={[
                      styles.monthBadge,
                      isCurrentMonth && styles.monthBadgeActive
                    ]}
                    onPress={() => navigateToMonth(monthInfo.month, monthInfo.year)}
                    activeOpacity={0.7}
                  >
                    <Text 
                      variant="caption" 
                      weight={isCurrentMonth ? 'semiBold' : 'medium'}
                      color={isCurrentMonth ? 'white' : 'accent'}
                    >
                      {monthInfo.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
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
  monthBadgesContainer: {
    marginTop: Spacing.m,
    paddingTop: Spacing.m,
    borderTopWidth: 1,
    borderTopColor: Colors.neutral.mist,
  },
  monthBadgesScroll: {
    paddingHorizontal: Spacing.xs,
    gap: Spacing.s,
  },
  monthBadge: {
    paddingHorizontal: Spacing.m,
    paddingVertical: Spacing.s,
    borderRadius: BorderRadius.medium,
    borderWidth: 1,
    borderColor: Colors.primary.accent,
    backgroundColor: Colors.neutral.white,
    marginRight: Spacing.s,
  },
  monthBadgeActive: {
    backgroundColor: Colors.primary.accent,
    borderColor: Colors.primary.accent,
  },
});
