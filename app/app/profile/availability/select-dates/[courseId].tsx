import {
  SafeAreaView,
  StyleSheet,
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Stack, useLocalSearchParams, router } from 'expo-router';
import { Calendar, DateData, LocaleConfig } from 'react-native-calendars';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Typography, BorderRadius } from '@/constants/theme';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withSequence,
  withDelay,
} from 'react-native-reanimated';
import { useAuth } from '@/hooks/useAuth';
import { golfParcoursService, GolfParcours } from '@/services/golf-parcours.service';
import { proAvailabilityService } from '@/services/pro-availability.service';
import { UniversalAlert } from '@/utils/alert';

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
  dayNamesShort: ['Dim.', 'Lun.', 'Mar.', 'Mer.', 'Jeu.', 'Ven.', 'Sam.'],
  today: "Aujourd'hui",
};
LocaleConfig.defaultLocale = 'fr';

export default function SelectDatesScreen() {
  const { user } = useAuth();
  const params = useLocalSearchParams<{
    courseId: string;
    courseName?: string;
    courseCity?: string;
    mode?: 'create' | 'edit';
    existingDates?: string;
  }>();

  const [golfCourse, setGolfCourse] = useState<GolfParcours | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedDates, setSelectedDates] = useState<string[]>([]);
  const [conflictDates, setConflictDates] = useState<string[]>([]);
  const [currentMonth, setCurrentMonth] = useState(new Date().toISOString().split('T')[0]);

  // Animations FAB
  const fabScale = useSharedValue(0);
  const fabTranslateY = useSharedValue(50);
  const fabOpacity = useSharedValue(0);
  const previousSelectedCount = useRef(selectedDates.length);

  // Style d'animation FAB
  const fabAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: fabScale.value }, { translateY: fabTranslateY.value }],
      opacity: fabOpacity.value,
    };
  });

  // Déterminer le mode et pré-remplir les dates si en mode édition
  const isEditMode = params.mode === 'edit';
  const existingDates = params.existingDates ? JSON.parse(params.existingDates) : [];

  useEffect(() => {
    loadGolfCourse();
    loadConflictDates();

    // Pré-remplir les dates existantes si en mode édition
    if (isEditMode && existingDates.length > 0) {
      setSelectedDates(existingDates);
    }
  }, [isEditMode]);

  // Animation FAB au changement de sélection
  useEffect(() => {
    if (selectedDates.length !== previousSelectedCount.current || isEditMode) {
      // Animation d'entrée avec délai
      const animationDelay = 200;

      if (selectedDates.length > 0 || isEditMode) {
        fabScale.value = withDelay(
          animationDelay,
          withSpring(1, {
            damping: 15,
            stiffness: 150,
          })
        );
        fabTranslateY.value = withDelay(
          animationDelay,
          withSpring(0, {
            damping: 15,
            stiffness: 100,
          })
        );
        fabOpacity.value = withDelay(
          animationDelay,
          withTiming(1, { duration: 200 })
        );
      } else {
        fabScale.value = withSpring(0);
        fabTranslateY.value = withSpring(50);
        fabOpacity.value = withTiming(0, { duration: 200 });
      }

      previousSelectedCount.current = selectedDates.length;
    }
  }, [selectedDates.length, isEditMode]);

  const loadGolfCourse = async () => {
    if (!params.courseId) return;

    try {
      setLoading(true);
      const response = await golfParcoursService.getGolfCourse(params.courseId);

      if (response.error) {
        throw response.error;
      }

      setGolfCourse(response.data);
    } catch (error) {
      console.error('Erreur chargement parcours:', error);
      UniversalAlert.error('Erreur', 'Impossible de charger les détails du parcours');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const loadConflictDates = async () => {
    if (!user?.id || !params.courseId) return;

    try {
      // En mode édition, exclure le parcours courant des conflits
      const excludeCourseId = isEditMode ? params.courseId : undefined;
      const dates = await proAvailabilityService.getConflictDates(user.id, excludeCourseId);
      setConflictDates(dates);
    } catch (error) {
      console.error('Erreur chargement dates conflits:', error);
    }
  };

  const markedDates = useMemo(() => {
    const marked: any = {};
    const today = new Date().toISOString().split('T')[0];

    // Marquer les dates sélectionnées
    selectedDates.forEach((date) => {
      marked[date] = {
        selected: true,
        selectedColor: Colors.primary.navy,
        selectedTextColor: Colors.neutral.white,
      };
    });

    // Marquer les dates en conflit (occupées ailleurs)
    conflictDates.forEach((date) => {
      if (!marked[date]) {
        marked[date] = {
          disabled: true,
          disableTouchEvent: true,
          customStyles: {
            container: {
              backgroundColor: Colors.semantic.error,
            },
            text: {
              color: Colors.neutral.white,
            },
          },
        };
      }
    });

    // Marquer aujourd'hui si pas déjà marqué
    if (!marked[today]) {
      marked[today] = {
        customStyles: {
          container: {
            borderColor: Colors.primary.electric,
            borderWidth: 2,
          },
          text: {
            color: Colors.primary.electric,
            fontWeight: 'bold',
          },
        },
      };
    }

    return marked;
  }, [selectedDates, conflictDates]);

  // Analyser les mois avec des dates existantes (mode édition uniquement)
  const monthsWithDates = useMemo(() => {
    if (!isEditMode || existingDates.length === 0) return [];

    // Grouper les dates par mois
    const monthGroups = new Map<string, { month: string; count: number; dates: string[] }>();

    existingDates.forEach((dateString: string) => {
      const monthKey = dateString.substring(0, 7); // "2025-03"
      const date = new Date(dateString);
      const monthLabel = date.toLocaleDateString('fr-FR', {
        month: 'long',
        year: 'numeric',
      });

      if (!monthGroups.has(monthKey)) {
        monthGroups.set(monthKey, {
          month: monthLabel,
          count: 0,
          dates: [],
        });
      }

      const group = monthGroups.get(monthKey)!;
      group.count += 1;
      group.dates.push(dateString);
    });

    // Trier par ordre chronologique
    return Array.from(monthGroups.entries())
      .map(([key, data]) => ({ key, ...data }))
      .sort((a, b) => a.key.localeCompare(b.key));
  }, [isEditMode, existingDates]);

  const navigateToMonth = (monthKey: string) => {
    // Naviguer vers le premier jour du mois spécifié
    const firstDayOfMonth = `${monthKey}-01`;
    setCurrentMonth(firstDayOfMonth);
  };

  const onDayPress = (day: DateData) => {
    const dateString = day.dateString;
    const today = new Date().toISOString().split('T')[0];

    // Ne pas permettre la sélection des dates passées
    if (dateString < today) return;

    // Ne pas permettre la sélection des dates en conflit
    if (conflictDates.includes(dateString)) return;

    setSelectedDates((prev) => {
      if (prev.includes(dateString)) {
        return prev.filter((d) => d !== dateString);
      } else {
        return [...prev, dateString].sort();
      }
    });
  };

  const handleSave = async () => {
    if (!user?.id || !params.courseId) return;

    // En mode édition avec 0 dates = suppression intelligente
    const isDeleteAction = isEditMode && selectedDates.length === 0;

    if (!isEditMode && selectedDates.length === 0) {
      UniversalAlert.info('Attention', 'Veuillez sélectionner au moins une date');
      return;
    }

    // Confirmation pour la suppression
    if (isDeleteAction) {
      UniversalAlert.show(
        'Supprimer les disponibilités',
        `Êtes-vous sûr de vouloir supprimer toutes vos disponibilités sur ${params.courseName || 'ce parcours'} ?`,
        [
          { text: 'Annuler', style: 'cancel' },
          {
            text: 'Supprimer',
            style: 'destructive',
            onPress: () => performDelete(),
          },
        ]
      );
      return;
    }

    performSave();
  };

  const performDelete = async () => {
    if (!user?.id || !params.courseId) {
      console.log('❌ [performDelete] Paramètres manquants:', {
        userId: user?.id,
        courseId: params.courseId,
      });
      return;
    }

    console.log('🗑️ [performDelete] Début suppression disponibilités:', {
      userId: user.id,
      courseId: params.courseId,
    });

    setSaving(true);
    try {
      // Vérifier s'il y a des réservations existantes
      console.log('🔍 [performDelete] Vérification des réservations existantes...');
      const { hasBookings, bookingsCount } =
        await proAvailabilityService.checkExistingBookingsForCourse(user.id, params.courseId);

      console.log('📋 [performDelete] Résultat vérification:', { hasBookings, bookingsCount });

      if (hasBookings) {
        console.log('🚫 [performDelete] Suppression bloquée - réservations existantes');
        UniversalAlert.info(
          'Impossible de supprimer',
          `Vous avez ${bookingsCount} réservation${bookingsCount > 1 ? 's' : ''} validée${bookingsCount > 1 ? 's' : ''} ou en attente sur ce parcours.\n\nVous ne pouvez pas supprimer vos disponibilités tant que des réservations sont actives.`
        );
        return;
      }

      // Aucune réservation, on peut supprimer
      console.log('✅ [performDelete] Aucune réservation - procéder à la suppression');
      const success = await proAvailabilityService.deleteProAvailabilitiesByCourse(
        user.id,
        params.courseId
      );

      console.log('📊 [performDelete] Résultat suppression:', { success });

      if (success) {
        console.log('✅ [performDelete] Suppression réussie');
        UniversalAlert.show('Succès', 'Disponibilités supprimées avec succès', [
          {
            text: 'OK',
            onPress: () => router.navigate('/profile/availability/'),
          },
        ]);
      } else {
        console.log('❌ [performDelete] Échec suppression');
        UniversalAlert.error('Erreur', 'Impossible de supprimer les disponibilités');
      }
    } catch (error) {
      console.error('Erreur suppression disponibilités:', error);
      UniversalAlert.error('Erreur', 'Une erreur est survenue');
    } finally {
      setSaving(false);
    }
  };

  const performSave = async () => {
    if (!user?.id || !params.courseId) return;

    setSaving(true);
    try {
      if (isEditMode) {
        // Utiliser la méthode intelligente qui retourne plus de détails
        const result = await proAvailabilityService.updateProAvailabilitiesIntelligent(
          user.id,
          params.courseId,
          selectedDates
        );

        if (result.success) {
          const actionText = 'modifiée';
          const actionTextPlural = 'modifiées';
          UniversalAlert.show(
            'Succès',
            `${selectedDates.length} disponibilité${selectedDates.length > 1 ? 's' : ''} ${selectedDates.length > 1 ? actionTextPlural : actionText} avec succès`,
            [
              {
                text: 'OK',
                onPress: () => router.navigate('/profile/availability/'),
              },
            ]
          );
        } else {
          // Afficher le message d'erreur détaillé
          UniversalAlert.info(
            'Attention',
            result.error || 'Impossible de mettre à jour les disponibilités'
          );
        }
      } else {
        // Création normale pour les nouvelles disponibilités
        const success = await proAvailabilityService.createProAvailabilities(
          user.id,
          params.courseId,
          selectedDates
        );

        if (success) {
          UniversalAlert.show(
            'Succès',
            `${selectedDates.length} disponibilité${selectedDates.length > 1 ? 's' : ''} ajoutée${selectedDates.length > 1 ? 's' : ''} avec succès`,
            [
              {
                text: 'OK',
                onPress: () => router.navigate('/profile/availability/'),
              },
            ]
          );
        } else {
          UniversalAlert.error('Erreur', 'Impossible de créer les disponibilités');
        }
      }
    } catch (error) {
      console.error('Erreur sauvegarde disponibilités:', error);
      UniversalAlert.error('Erreur', 'Une erreur est survenue');
    } finally {
      setSaving(false);
    }
  };

  if (!user) {
    return null;
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen
          options={{
            title: isEditMode ? 'Modifier les dates' : 'Sélectionner les dates',
            headerBackTitle: 'Retour',
          }}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary.accent} />
          <Text style={styles.loadingText}>Chargement...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: isEditMode ? 'Modifier les dates' : 'Sélectionner les dates',
          headerBackTitle: 'Retour',
        }}
      />
      <SafeAreaView style={styles.container}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Informations du parcours */}
          <View style={styles.courseInfoContainer}>
            <Text style={styles.courseName}>{params.courseName || golfCourse?.name}</Text>
            {(params.courseCity || golfCourse?.city) && (
              <View style={styles.courseLocation}>
                <Ionicons name="location-outline" size={16} color={Colors.ui.subtleGray} />
                <Text style={styles.courseCity}>{params.courseCity || golfCourse?.city}</Text>
              </View>
            )}
          </View>



          {/* Calendrier React Native Calendars */}
          <View style={styles.calendarSection}>
            <Calendar
              key={currentMonth}
              current={currentMonth}
              markedDates={markedDates}
              markingType="custom"
              onDayPress={onDayPress}
              onMonthChange={(month) => setCurrentMonth(month.dateString)}
              firstDay={1}
              minDate={new Date().toISOString().split('T')[0]}
              hideArrows={false}
              enableSwipeMonths={true}
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
                'stylesheet.calendar.header': {
                  week: {
                    marginTop: 5,
                    marginBottom: 10,
                    flexDirection: 'row',
                    justifyContent: 'space-around',
                  },
                  monthText: {
                    fontSize: 18,
                    fontWeight: '700',
                    color: Colors.neutral.charcoal,
                    margin: 10,
                  },
                },
                'stylesheet.day.basic': {
                  base: {
                    width: 40,
                    height: 40,
                    alignItems: 'center',
                    justifyContent: 'center',
                  },
                  text: {
                    marginTop: 0,
                    fontSize: 16,
                    fontWeight: '500',
                    color: Colors.neutral.charcoal,
                  },
                },
              }}
            />
          </View>

          {/* Navigation rapide par mois (mode édition uniquement) */}
          {isEditMode && monthsWithDates.length > 0 && (
            <View style={styles.monthNavigationList}>
              {monthsWithDates.map((monthData) => (
                <TouchableOpacity
                  key={monthData.key}
                  style={styles.monthNavigationBadge}
                  onPress={() => navigateToMonth(monthData.key)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.monthNavigationBadgeText}>
                    {monthData.month} ({monthData.count})
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </ScrollView>

      </SafeAreaView>

      {/* FAB Bouton Mettre à jour */}
      <Animated.View style={[styles.fabExtended, fabAnimatedStyle]}>
        <TouchableOpacity
          style={styles.fabButton}
          onPress={handleSave}
          disabled={saving || (!isEditMode && selectedDates.length === 0)}
          activeOpacity={0.8}
        >
          {saving ? (
            <ActivityIndicator color={Colors.neutral.white} size="small" />
          ) : (
            <>
              <Ionicons
                name={isEditMode && selectedDates.length === 0 ? 'trash-outline' : 'checkmark'}
                size={20}
                color={Colors.neutral.white}
              />
              <Text style={styles.fabExtendedText}>
                {isEditMode && selectedDates.length === 0
                  ? 'Supprimer'
                  : isEditMode
                    ? 'Mettre à jour'
                    : 'Confirmer'}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </Animated.View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.neutral.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 120, // Espace pour le bouton FAB
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: Spacing.m,
    fontSize: Typography.fontSize.body,
    color: Colors.ui.subtleGray,
  },
  courseInfoContainer: {
    backgroundColor: Colors.neutral.white,
    padding: Spacing.m,
    marginHorizontal: Spacing.m,
    marginTop: Spacing.m,
    borderRadius: BorderRadius.medium,
    shadowColor: Colors.neutral.charcoal,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  courseName: {
    fontSize: Typography.fontSize.h3,
    fontWeight: Typography.fontWeight.semiBold,
    color: Colors.neutral.charcoal,
    marginBottom: Spacing.xs,
  },
  courseLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  courseCity: {
    fontSize: Typography.fontSize.body,
    color: Colors.ui.subtleGray,
  },
  monthNavigationList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.s,
    paddingHorizontal: Spacing.m,
    paddingTop: Spacing.m,
  },
  monthNavigationBadge: {
    backgroundColor: Colors.primary.navy,
    paddingHorizontal: Spacing.m,
    paddingVertical: Spacing.s,
    borderRadius: BorderRadius.medium,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  monthNavigationBadgeText: {
    color: Colors.neutral.white,
    fontSize: Typography.fontSize.caption,
    fontWeight: Typography.fontWeight.semiBold,
  },
  calendarSection: {
    backgroundColor: Colors.neutral.white,
    borderRadius: 16,
    padding: 12,
    marginVertical: Spacing.m,
    marginHorizontal: Spacing.m,
    shadowColor: Colors.neutral.charcoal,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  // Styles FAB étendu (comme booking-modal)
  fabExtended: {
    position: 'absolute',
    bottom: 30,
    alignSelf: 'center',
    backgroundColor: Colors.primary.navy,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 28,
    shadowColor: Colors.neutral.charcoal,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 12,
    zIndex: 1000,
    minWidth: 140,
  },
  fabExtendedText: {
    color: Colors.neutral.white,
    fontSize: 16,
    fontWeight: '600',
  },
  fabButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
});
