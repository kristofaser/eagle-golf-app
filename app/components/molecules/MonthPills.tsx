import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { Colors } from '@/constants/theme';

interface MonthPillsProps {
  availableDates: string[];
  onMonthSelect: (month: Date) => void;
  currentMonth?: Date;
}

export const MonthPills: React.FC<MonthPillsProps> = ({
  availableDates,
  onMonthSelect,
  currentMonth,
}) => {
  // Extraire les mois uniques des dates disponibles
  const getUniqueMonths = () => {
    const monthsSet = new Set<string>();
    const monthsData: { date: Date; label: string; key: string }[] = [];

    availableDates.forEach(dateStr => {
      const date = new Date(dateStr);
      const monthKey = `${date.getFullYear()}-${date.getMonth()}`;

      if (!monthsSet.has(monthKey)) {
        monthsSet.add(monthKey);
        monthsData.push({
          date: new Date(date.getFullYear(), date.getMonth(), 1),
          label: date.toLocaleDateString('fr-FR', { month: 'short' }),
          key: monthKey,
        });
      }
    });

    // Trier par date
    return monthsData.sort((a, b) => a.date.getTime() - b.date.getTime());
  };

  const uniqueMonths = getUniqueMonths();

  // Vérifier si un mois est le mois courant
  const isCurrentMonth = (month: Date) => {
    if (!currentMonth) return false;
    return (
      month.getFullYear() === currentMonth.getFullYear() &&
      month.getMonth() === currentMonth.getMonth()
    );
  };

  if (uniqueMonths.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {uniqueMonths.map((month) => (
          <TouchableOpacity
            key={month.key}
            style={[
              styles.pill,
              isCurrentMonth(month.date) && styles.pillSelected,
            ]}
            onPress={() => onMonthSelect(month.date)}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.pillText,
                isCurrentMonth(month.date) && styles.pillTextSelected,
              ]}
            >
              {month.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 16,
    marginBottom: 8,
  },
  scrollContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  pill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.neutral.snow,
    borderWidth: 1,
    borderColor: Colors.neutral.pearl,
  },
  pillSelected: {
    backgroundColor: Colors.primary.lightBlue,
    borderColor: Colors.primary.navy,
  },
  pillText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.neutral.charcoal,
    textAlign: 'center',
    minWidth: 32,
  },
  pillTextSelected: {
    color: Colors.primary.navy,
  },
});