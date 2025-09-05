/**
 * @deprecated Ce composant utilise l'ancien système pro_daily_availabilities
 * Utilisez le nouveau système via /profile/availability/ à la place
 */
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Typography, BorderRadius } from '@/constants/theme';
import { availabilityService } from '@/services/availability.service';

interface ProAvailabilityCalendarProps {
  proId: string;
  onSave?: (availabilities: AvailabilityData[]) => void;
}

interface AvailabilityData {
  date: string;
  is_available: boolean;
  is_booked?: boolean;
}

// Fonction utilitaire pour convertir une Date en string YYYY-MM-DD en timezone locale
const formatDateLocal = (date: Date): string => {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

export const ProAvailabilityCalendar: React.FC<ProAvailabilityCalendarProps> = ({
  proId,
  onSave,
}) => {
  const [displayMonth, setDisplayMonth] = useState(new Date());

  // Map des disponibilités (date string -> disponibilité)
  const [availabilities, setAvailabilities] = useState<Map<string, AvailabilityData>>(new Map());
  const [originalAvailabilities, setOriginalAvailabilities] = useState<
    Map<string, AvailabilityData>
  >(new Map());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Charger les disponibilités existantes au montage
  useEffect(() => {
    loadAvailabilities();
  }, [proId]);

  // Recharger les disponibilités quand l'écran redevient focus (après sauvegarde)
  useFocusEffect(
    React.useCallback(() => {
      loadAvailabilities();
    }, [proId])
  );

  const loadAvailabilities = async () => {
    try {
      setLoading(true);

      // Dates de début et fin (aujourd'hui + 60 jours)
      const startDate = new Date();
      startDate.setHours(0, 0, 0, 0);

      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 60);
      endDate.setHours(23, 59, 59, 999);

      // Utiliser les dates locales pour éviter les décalages de timezone
      const startDateStr = formatDateLocal(startDate);
      const endDateStr = formatDateLocal(endDate);

      const dailyAvailabilities = await availabilityService.getProDailyAvailabilities(
        proId,
        startDateStr,
        endDateStr
      );

      // Créer une map des disponibilités existantes
      const availMap = new Map<string, AvailabilityData>();
      dailyAvailabilities.forEach((avail) => {
        availMap.set(avail.date, {
          date: avail.date,
          is_available: avail.is_available,
          is_booked: avail.is_booked,
        });
      });

      setAvailabilities(availMap);
      setOriginalAvailabilities(new Map(availMap));
    } catch (err) {
      console.error('Erreur chargement disponibilités:', err);
      Alert.alert('Erreur', 'Impossible de charger vos disponibilités');
    } finally {
      setLoading(false);
    }
  };

  // Générer les jours du mois
  const generateMonthDays = (month: Date) => {
    const year = month.getFullYear();
    const monthIndex = month.getMonth();
    const firstDay = new Date(year, monthIndex, 1);
    const lastDay = new Date(year, monthIndex + 1, 0);
    const daysInMonth = lastDay.getDate();

    // Jour de la semaine du premier jour (0 = dimanche, 1 = lundi, etc.)
    let startDayOfWeek = firstDay.getDay();
    // Convertir pour que lundi = 0
    startDayOfWeek = startDayOfWeek === 0 ? 6 : startDayOfWeek - 1;

    const days: (Date | null)[] = [];

    // Ajouter des jours vides au début
    for (let i = 0; i < startDayOfWeek; i++) {
      days.push(null);
    }

    // Ajouter les jours du mois
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, monthIndex, day));
    }

    return days;
  };

  // Basculer la disponibilité d'une date
  const toggleDateAvailability = (date: Date) => {
    // Utiliser la date locale pour éviter les décalages de timezone
    const dateStr = formatDateLocal(date);
    const currentAvailability = availabilities.get(dateStr);

    // Ne pas permettre de modifier si c'est déjà réservé
    if (currentAvailability?.is_booked) {
      Alert.alert('Créneau réservé', 'Ce créneau a déjà été réservé et ne peut pas être modifié');
      return;
    }

    const newAvailabilities = new Map(availabilities);

    if (currentAvailability) {
      // Si la date existe, on inverse son état
      newAvailabilities.set(dateStr, {
        ...currentAvailability,
        is_available: !currentAvailability.is_available,
      });
    } else {
      // Si la date n'existe pas, on la marque comme disponible
      newAvailabilities.set(dateStr, {
        date: dateStr,
        is_available: true,
        is_booked: false,
      });
    }

    setAvailabilities(newAvailabilities);
    checkForChanges(newAvailabilities);
  };

  // Vérifier s'il y a des changements
  const checkForChanges = (newAvailabilities: Map<string, AvailabilityData>) => {
    // Notifier le parent des changements
    if (onSave) {
      const availabilitiesArray = Array.from(newAvailabilities.values());
      onSave(availabilitiesArray);
    }
  };

  // Vérifier si une date est dans le passé
  const isDatePast = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };

  // Vérifier si une date est au-delà de la limite de 60 jours
  const isDateBeyondLimit = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const maxDate = new Date(today);
    maxDate.setDate(maxDate.getDate() + 60);
    return date > maxDate;
  };

  // Obtenir le statut d'une date
  const getDateStatus = (date: Date) => {
    const dateStr = formatDateLocal(date);
    const availability = availabilities.get(dateStr);

    return {
      isAvailable: availability?.is_available || false,
      isBooked: availability?.is_booked || false,
    };
  };

  // Formatter le nom du mois
  const formatMonthYear = (date: Date) => {
    const monthName = date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
    return monthName.charAt(0).toUpperCase() + monthName.slice(1);
  };

  // Navigation entre les mois
  const goToPreviousMonth = () => {
    const prev = new Date(displayMonth);
    prev.setMonth(prev.getMonth() - 1);
    setDisplayMonth(prev);
  };

  const goToNextMonth = () => {
    const next = new Date(displayMonth);
    next.setMonth(next.getMonth() + 1);
    setDisplayMonth(next);
  };

  // Vérifier si on peut naviguer (basé sur 2 mois à partir d'aujourd'hui)
  const canGoPrevious = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const firstDayOfDisplayMonth = new Date(displayMonth.getFullYear(), displayMonth.getMonth(), 1);
    const firstDayOfCurrentMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    return firstDayOfDisplayMonth > firstDayOfCurrentMonth;
  };

  const canGoNext = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Calculer la date limite (60 jours à partir d'aujourd'hui)
    const maxDate = new Date(today);
    maxDate.setDate(maxDate.getDate() + 60);

    // Obtenir le dernier jour du mois affiché
    const lastDayOfDisplayMonth = new Date(
      displayMonth.getFullYear(),
      displayMonth.getMonth() + 1,
      0
    );

    // On peut naviguer vers le mois suivant si on n'a pas dépassé la limite de 60 jours
    return lastDayOfDisplayMonth < maxDate;
  };

  // Rendre un jour
  const renderDay = (date: Date | null, index: number) => {
    if (!date) {
      return <View key={`empty-${index}`} style={styles.emptyDay} />;
    }

    const isPast = isDatePast(date);
    const isBeyondLimit = isDateBeyondLimit(date);
    const isDisabled = isPast || isBeyondLimit;
    const { isAvailable, isBooked } = getDateStatus(date);
    const isToday = date.toDateString() === new Date().toDateString();

    return (
      <TouchableOpacity
        key={formatDateLocal(date)}
        style={styles.dayWrapper}
        onPress={() => !isDisabled && !isBooked && toggleDateAvailability(date)}
        disabled={isDisabled || isBooked}
      >
        <View
          style={[
            styles.dayContainer,
            isDisabled && styles.dayPast,
            isAvailable && !isDisabled && styles.dayAvailable,
            isBooked && styles.dayBooked,
            isToday && styles.dayToday,
          ]}
        >
          <Text
            style={[
              styles.dayText,
              isDisabled && styles.dayTextPast,
              isAvailable && !isDisabled && styles.dayTextAvailable,
              isBooked && styles.dayTextBooked,
              isToday && styles.dayTextToday,
            ]}
          >
            {date.getDate()}
          </Text>
        </View>
        {isBooked && (
          <View style={styles.bookedIndicator}>
            <View style={styles.bookedDot} />
          </View>
        )}
      </TouchableOpacity>
    );
  };

  // Rendre un mois
  const renderMonth = (month: Date) => {
    const days = generateMonthDays(month);

    return (
      <View style={styles.monthContainer}>
        {/* En-têtes des jours */}
        <View style={styles.weekDaysContainer}>
          {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map((day) => (
            <Text key={day} style={styles.weekDayText}>
              {day}
            </Text>
          ))}
        </View>

        {/* Grille des jours */}
        <View style={styles.daysGrid}>{days.map((date, index) => renderDay(date, index))}</View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary.accent} />
        <Text style={styles.loadingText}>Chargement de vos disponibilités...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Instructions */}
      <View style={styles.instructionsContainer}>
        <Ionicons name="information-circle-outline" size={20} color={Colors.primary.accent} />
        <Text style={styles.instructionsText}>Appuyez sur les jours où vous êtes disponible</Text>
      </View>

      {/* Navigation du mois avec flèches */}
      <View style={styles.monthNavigation}>
        <TouchableOpacity
          style={[styles.navButton, !canGoPrevious() && styles.navButtonDisabled]}
          onPress={goToPreviousMonth}
          disabled={!canGoPrevious()}
        >
          <Ionicons
            name="chevron-back"
            size={24}
            color={canGoPrevious() ? Colors.neutral.charcoal : Colors.ui.inputBorder}
          />
        </TouchableOpacity>

        <Text style={styles.monthTitle}>{formatMonthYear(displayMonth)}</Text>

        <TouchableOpacity
          style={[styles.navButton, !canGoNext() && styles.navButtonDisabled]}
          onPress={goToNextMonth}
          disabled={!canGoNext()}
        >
          <Ionicons
            name="chevron-forward"
            size={24}
            color={canGoNext() ? Colors.neutral.charcoal : Colors.ui.inputBorder}
          />
        </TouchableOpacity>
      </View>

      {/* Calendrier */}
      <ScrollView style={styles.calendarContainer} showsVerticalScrollIndicator={false}>
        {renderMonth(displayMonth)}
      </ScrollView>

      {/* Légende */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendCircle, { backgroundColor: Colors.primary.accent }]} />
          <Text style={styles.legendText}>Disponible</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendCircle, { backgroundColor: Colors.ui.inputBorder }]} />
          <Text style={styles.legendText}>Non disponible</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendCircle, { backgroundColor: Colors.semantic.warning }]} />
          <Text style={styles.legendText}>Réservé</Text>
        </View>
      </View>
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
  instructionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.ui.lightBackground,
    padding: Spacing.m,
    borderRadius: BorderRadius.medium,
    marginBottom: Spacing.l,
    marginHorizontal: Spacing.m,
    gap: Spacing.s,
  },
  instructionsText: {
    flex: 1,
    fontSize: 14,
    color: Colors.neutral.charcoal,
  },
  monthNavigation: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.m,
    marginBottom: Spacing.l,
  },
  navButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
    backgroundColor: Colors.ui.lightBackground,
  },
  navButtonDisabled: {
    opacity: 0.3,
  },
  monthTitle: {
    fontSize: Typography.fontSize.h3,
    fontWeight: Typography.fontWeight.semiBold,
    color: Colors.neutral.charcoal,
    textTransform: 'capitalize',
  },
  calendarContainer: {
    flex: 1,
    paddingHorizontal: Spacing.m,
  },
  monthContainer: {
    marginBottom: Spacing.xl,
  },
  weekDaysContainer: {
    flexDirection: 'row',
    marginBottom: Spacing.m,
  },
  weekDayText: {
    flex: 1,
    textAlign: 'center',
    fontSize: 13,
    color: Colors.ui.subtleGray,
    fontWeight: '500',
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayWrapper: {
    width: '14.28%',
    aspectRatio: 1,
    padding: 3,
    position: 'relative',
  },
  dayContainer: {
    flex: 1,
    borderRadius: 999,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  emptyDay: {
    width: '14.28%',
    aspectRatio: 1,
  },
  dayText: {
    fontSize: 16,
    color: Colors.ui.subtleGray,
  },
  dayPast: {
    opacity: 0.3,
  },
  dayTextPast: {
    color: Colors.ui.inputBorder,
  },
  dayToday: {
    borderWidth: 2,
    borderColor: Colors.primary.accent,
  },
  dayAvailable: {
    backgroundColor: Colors.primary.accent,
  },
  dayTextAvailable: {
    color: Colors.neutral.white,
    fontWeight: '600',
  },
  dayBooked: {
    backgroundColor: Colors.semantic.warning,
  },
  dayTextBooked: {
    color: Colors.neutral.white,
    fontWeight: '600',
  },
  dayTextToday: {
    fontWeight: '700',
  },
  bookedIndicator: {
    position: 'absolute',
    bottom: 0,
    alignSelf: 'center',
  },
  bookedDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.semantic.warning,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingTop: Spacing.m,
    paddingBottom: Spacing.s,
    paddingHorizontal: Spacing.m,
    gap: Spacing.l,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  legendCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },
  legendText: {
    fontSize: 13,
    color: Colors.ui.subtleGray,
  },
});
