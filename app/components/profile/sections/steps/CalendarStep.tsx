import React, { useMemo, useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Calendar, LocaleConfig } from 'react-native-calendars';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/theme';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { MonthPills } from '@/components/molecules/MonthPills';

// Configuration du calendrier en français
LocaleConfig.locales['fr'] = {
  monthNames: [
    'Janvier',
    'Février',
    'Mars',
    'Avril',
    'Mai',
    'Juin',
    'Juillet',
    'Août',
    'Septembre',
    'Octobre',
    'Novembre',
    'Décembre',
  ],
  monthNamesShort: [
    'Janv.',
    'Févr.',
    'Mars',
    'Avril',
    'Mai',
    'Juin',
    'Juil.',
    'Août',
    'Sept.',
    'Oct.',
    'Nov.',
    'Déc.',
  ],
  dayNames: ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'],
  dayNamesShort: ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'],
  today: "Aujourd'hui",
};
LocaleConfig.defaultLocale = 'fr';

interface CalendarStepProps {
  selectedDate: Date | null;
  onDateSelect: (date: Date) => void;
  availableDates?: string[]; // Dates où le pro est disponible
  proId: string;
  proName: string;
}

export const CalendarStep: React.FC<CalendarStepProps> = ({
  selectedDate,
  onDateSelect,
  availableDates = [],
  proId,
  proName,
}) => {
  const [currentDisplayedMonth, setCurrentDisplayedMonth] = useState<Date>(() => {
    // Si il y a une date sélectionnée, l'utiliser
    if (selectedDate) {
      return selectedDate;
    }

    // Sinon, utiliser le premier mois avec des disponibilités
    if (availableDates.length > 0) {
      const firstAvailableDate = availableDates
        .map((dateStr) => new Date(dateStr))
        .sort((a, b) => a.getTime() - b.getTime())[0];
      return new Date(firstAvailableDate.getFullYear(), firstAvailableDate.getMonth(), 1);
    }

    // Par défaut, mois actuel
    return new Date();
  });

  // Mettre à jour le mois affiché quand les disponibilités changent
  useEffect(() => {
    if (availableDates.length > 0 && !selectedDate) {
      const firstAvailableDate = availableDates
        .map((dateStr) => new Date(dateStr))
        .sort((a, b) => a.getTime() - b.getTime())[0];
      const firstAvailableMonth = new Date(
        firstAvailableDate.getFullYear(),
        firstAvailableDate.getMonth(),
        1
      );
      setCurrentDisplayedMonth(firstAvailableMonth);
    }
  }, [availableDates, selectedDate]);

  // Préparer les dates marquées avec useMemo pour éviter les re-rendus
  const markedDates = useMemo(() => {
    const marks: any = {};
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Marquer les dates disponibles
    availableDates.forEach((dateStr) => {
      marks[dateStr] = {
        marked: true,
        dotColor: Colors.primary.electric,
      };
    });

    // Marquer la date sélectionnée
    if (selectedDate) {
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      marks[dateStr] = {
        ...marks[dateStr],
        selected: true,
        selectedColor: Colors.primary.navy,
        selectedTextColor: Colors.neutral.white,
      };
    }

    return marks;
  }, [selectedDate, availableDates]);

  const handleDayPress = (day: any) => {
    const date = new Date(day.dateString);
    onDateSelect(date);
  };

  const handleMonthSelect = (month: Date) => {
    setCurrentDisplayedMonth(month);
  };

  const isDateAvailable = (dateString: string) => {
    // Si pas de disponibilités définies, toutes les dates futures sont ok
    if (availableDates.length === 0) {
      const date = new Date(dateString);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return date >= today;
    }
    return availableDates.includes(dateString);
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.infoBox}>
          <Ionicons name="information-circle-outline" size={20} color={Colors.primary.electric} />
          <Text style={styles.infoText}>Sélectionnez une date pour votre partie</Text>
        </View>

        <View style={styles.calendarWrapper}>
          <Calendar
            key={format(currentDisplayedMonth, 'yyyy-MM')}
            current={format(currentDisplayedMonth, 'yyyy-MM-dd')}
            minDate={format(new Date(), 'yyyy-MM-dd')}
            maxDate={format(new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd')} // 3 mois
            onDayPress={handleDayPress}
            markedDates={markedDates}
            monthFormat={'MMMM yyyy'}
            hideExtraDays={true}
            firstDay={1}
            hideArrows={true}
            enableSwipeMonths={false}
            onMonthChange={(month) => {
              setCurrentDisplayedMonth(new Date(month.dateString));
            }}
            style={styles.calendar}
            theme={{
              backgroundColor: Colors.neutral.white,
              calendarBackground: Colors.neutral.white,
              textSectionTitleColor: Colors.neutral.slate,
              selectedDayBackgroundColor: Colors.primary.navy,
              selectedDayTextColor: Colors.neutral.white,
              todayTextColor: Colors.primary.electric,
              dayTextColor: Colors.neutral.charcoal,
              textDisabledColor: Colors.neutral.mist,
              dotColor: Colors.primary.electric,
              selectedDotColor: Colors.neutral.white,
              arrowColor: Colors.primary.navy,
              monthTextColor: Colors.neutral.charcoal,
              textDayFontFamily: 'System',
              textMonthFontFamily: 'System',
              textDayHeaderFontFamily: 'System',
              textDayFontWeight: '500',
              textMonthFontWeight: '700',
              textDayHeaderFontWeight: '600',
              textDayFontSize: 16,
              textMonthFontSize: 18,
              textDayHeaderFontSize: 12,
            }}
            dayComponent={({ date, state, marking }: any) => {
              const isAvailable = date ? isDateAvailable(date.dateString) : false;
              const isSelected = marking?.selected;
              const isToday = state === 'today';
              const isDisabled = state === 'disabled' || !isAvailable;
              const hasAvailability = marking?.marked && !isSelected;

              return (
                <TouchableOpacity
                  style={[
                    styles.dayContainer,
                    isSelected && styles.daySelected,
                    isToday && !isSelected && styles.dayToday,
                    hasAvailability && styles.dayWithAvailability,
                    isDisabled && styles.dayDisabled,
                  ]}
                  onPress={() => !isDisabled && handleDayPress(date)}
                  disabled={isDisabled}
                >
                  <Text
                    style={[
                      styles.dayText,
                      isSelected && styles.dayTextSelected,
                      isToday && !isSelected && styles.dayTextToday,
                      hasAvailability && styles.dayTextWithAvailability,
                    ]}
                  >
                    {date?.day}
                  </Text>
                </TouchableOpacity>
              );
            }}
          />
        </View>

        {availableDates.length > 0 && (
          <View style={styles.availabilityHeader}>
            <Text style={styles.availabilityText}>Disponibilités de {proName}</Text>
          </View>
        )}

        <MonthPills
          availableDates={availableDates}
          onMonthSelect={handleMonthSelect}
          currentMonth={currentDisplayedMonth}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 16,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary.lightBlue,
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    width: '100%',
  },
  infoText: {
    fontSize: 14,
    color: Colors.primary.navy,
    marginLeft: 8,
    flex: 1,
  },
  calendarWrapper: {
    width: '100%',
  },
  calendar: {
    width: '100%',
  },
  dayContainer: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 19,
  },
  daySelected: {
    backgroundColor: Colors.primary.navy,
  },
  dayWithAvailability: {
    borderWidth: 1,
    borderColor: Colors.primary.electric,
  },
  dayDisabled: {
    opacity: 0.3,
  },
  dayText: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.neutral.charcoal,
  },
  dayTextSelected: {
    color: Colors.neutral.white,
    fontWeight: '700',
  },
  dayTextToday: {
    color: Colors.neutral.charcoal,
    fontWeight: '700',
  },
  dayTextWithAvailability: {
    color: Colors.primary.electric,
    fontWeight: '600',
  },
  availabilityHeader: {
    marginTop: 16,
    marginBottom: 8,
    alignItems: 'center',
  },
  availabilityText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.neutral.charcoal,
  },
});
