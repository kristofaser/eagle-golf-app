import {
  SafeAreaView,
  StyleSheet,
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import React, { useState, useEffect, useMemo } from 'react';
import { Stack, useLocalSearchParams, router } from 'expo-router';
import { Calendar, DateData, LocaleConfig } from 'react-native-calendars';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Typography, BorderRadius } from '@/constants/theme';
import { useAuth } from '@/hooks/useAuth';
import { golfParcoursService, GolfParcours } from '@/services/golf-parcours.service';
import { proAvailabilityService } from '@/services/pro-availability.service';

// Configuration du calendrier en français
LocaleConfig.locales['fr'] = {
  monthNames: [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ],
  monthNamesShort: [
    'Janv.', 'Févr.', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juil.', 'Août', 'Sept.', 'Oct.', 'Nov.', 'Déc.'
  ],
  dayNames: ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'],
  dayNamesShort: ['Dim.', 'Lun.', 'Mar.', 'Mer.', 'Jeu.', 'Ven.', 'Sam.'],
  today: "Aujourd'hui"
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
      Alert.alert('Erreur', 'Impossible de charger les détails du parcours');
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
    selectedDates.forEach(date => {
      marked[date] = {
        selected: true,
        selectedColor: Colors.primary.accent,
        selectedTextColor: Colors.neutral.white,
      };
    });

    // Marquer les dates en conflit (occupées ailleurs)
    conflictDates.forEach(date => {
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
            borderColor: Colors.primary.accent,
            borderWidth: 1,
          },
          text: {
            color: Colors.primary.accent,
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
    const monthGroups = new Map<string, { month: string, count: number, dates: string[] }>();
    
    existingDates.forEach((dateString: string) => {
      const monthKey = dateString.substring(0, 7); // "2025-03"
      const date = new Date(dateString);
      const monthLabel = date.toLocaleDateString('fr-FR', { 
        month: 'long', 
        year: 'numeric' 
      });
      
      if (!monthGroups.has(monthKey)) {
        monthGroups.set(monthKey, {
          month: monthLabel,
          count: 0,
          dates: []
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

    setSelectedDates(prev => {
      if (prev.includes(dateString)) {
        return prev.filter(d => d !== dateString);
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
      Alert.alert('Attention', 'Veuillez sélectionner au moins une date');
      return;
    }

    // Confirmation pour la suppression
    if (isDeleteAction) {
      Alert.alert(
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
    if (!user?.id || !params.courseId) return;
    
    setSaving(true);
    try {
      const success = await proAvailabilityService.deleteProAvailabilitiesByCourse(
        user.id,
        params.courseId
      );

      if (success) {
        Alert.alert(
          'Succès',
          'Disponibilités supprimées avec succès',
          [
            {
              text: 'OK',
              onPress: () => router.navigate('/profile/availability/'),
            },
          ]
        );
      } else {
        Alert.alert('Erreur', 'Impossible de supprimer les disponibilités');
      }
    } catch (error) {
      console.error('Erreur suppression disponibilités:', error);
      Alert.alert('Erreur', 'Une erreur est survenue');
    } finally {
      setSaving(false);
    }
  };

  const performSave = async () => {
    if (!user?.id || !params.courseId) return;

    setSaving(true);
    try {
      const success = isEditMode 
        ? await proAvailabilityService.updateProAvailabilities(
            user.id,
            params.courseId,
            selectedDates
          )
        : await proAvailabilityService.createProAvailabilities(
            user.id,
            params.courseId,
            selectedDates
          );

      if (success) {
        const actionText = isEditMode ? 'modifiée' : 'ajoutée';
        const actionTextPlural = isEditMode ? 'modifiées' : 'ajoutées';
        Alert.alert(
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
        Alert.alert('Erreur', 'Impossible de sauvegarder vos disponibilités');
      }
    } catch (error) {
      console.error('Erreur sauvegarde disponibilités:', error);
      Alert.alert('Erreur', 'Une erreur est survenue');
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
            <Text style={styles.courseName}>
              {params.courseName || golfCourse?.name}
            </Text>
            {(params.courseCity || golfCourse?.city) && (
              <View style={styles.courseLocation}>
                <Ionicons name="location-outline" size={16} color={Colors.ui.subtleGray} />
                <Text style={styles.courseCity}>
                  {params.courseCity || golfCourse?.city}
                </Text>
              </View>
            )}
          </View>

          {/* Instructions */}
          <View style={styles.instructionsContainer}>
            <Ionicons name="information-circle-outline" size={20} color={Colors.primary.accent} />
            <Text style={styles.instructionsText}>
              {isEditMode 
                ? 'Modifiez les dates où vous serez disponible sur ce parcours'
                : 'Sélectionnez les dates où vous serez disponible sur ce parcours'
              }
            </Text>
          </View>

          {/* Légende */}
          <View style={styles.legendContainer}>
            <View style={styles.legendItem}>
              <View style={[styles.legendColor, styles.legendSelected]} />
              <Text style={styles.legendText}>Sélectionné</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendColor, styles.legendConflict]} />
              <Text style={styles.legendText}>Occupé ailleurs</Text>
            </View>
          </View>

          {/* Calendrier React Native Calendars */}
          <Calendar
            key={currentMonth}
            current={currentMonth}
            markedDates={markedDates}
            markingType="custom"
            onDayPress={onDayPress}
            onMonthChange={(month) => setCurrentMonth(month.dateString)}
            firstDay={1}
            minDate={new Date().toISOString().split('T')[0]}
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

        {/* Bouton de sauvegarde */}
        <View style={styles.saveButtonContainer}>
          <TouchableOpacity
            style={[
              styles.saveButton,
              isEditMode && selectedDates.length === 0 ? styles.deleteButton : null,
              saving && styles.saveButtonDisabled,
              !isEditMode && selectedDates.length === 0 && styles.saveButtonDisabled
            ]}
            onPress={handleSave}
            disabled={saving || (!isEditMode && selectedDates.length === 0)}
          >
            {saving ? (
              <ActivityIndicator color="white" />
            ) : (
              <>
                <Ionicons 
                  name={isEditMode && selectedDates.length === 0 ? "trash-outline" : "checkmark"} 
                  size={20} 
                  color="white" 
                />
                <Text style={styles.saveButtonText}>
                  {isEditMode && selectedDates.length === 0 
                    ? 'Supprimer les disponibilités'
                    : isEditMode 
                      ? `Mettre à jour${selectedDates.length > 0 ? ` (${selectedDates.length})` : ''}`
                      : `Confirmer${selectedDates.length > 0 ? ` (${selectedDates.length})` : ''}`
                  }
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </SafeAreaView>
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
    paddingBottom: 100, // Espace pour le bouton
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
    borderBottomWidth: 1,
    borderBottomColor: Colors.ui.inputBorder,
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
  instructionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.ui.lightBackground,
    padding: Spacing.m,
    gap: Spacing.s,
  },
  instructionsText: {
    flex: 1,
    fontSize: 14,
    color: Colors.neutral.charcoal,
  },
  legendContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: Colors.neutral.white,
    padding: Spacing.m,
    borderBottomWidth: 1,
    borderBottomColor: Colors.ui.inputBorder,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendSelected: {
    backgroundColor: Colors.primary.accent,
  },
  legendConflict: {
    backgroundColor: Colors.semantic.error,
  },
  legendText: {
    fontSize: Typography.fontSize.caption,
    color: Colors.neutral.charcoal,
  },
  monthNavigationList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.s,
    paddingHorizontal: Spacing.m,
    paddingTop: Spacing.m,
  },
  monthNavigationBadge: {
    backgroundColor: Colors.primary.accent,
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
  saveButtonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.neutral.white,
    paddingHorizontal: Spacing.m,
    paddingTop: Spacing.m,
    paddingBottom: Spacing.xl,
    borderTopWidth: 1,
    borderTopColor: Colors.ui.inputBorder,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  saveButton: {
    backgroundColor: Colors.primary.accent,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: Spacing.m,
    borderRadius: BorderRadius.medium,
    gap: Spacing.s,
  },
  deleteButton: {
    backgroundColor: Colors.semantic.error,
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    color: 'white',
    fontSize: Typography.fontSize.body,
    fontWeight: Typography.fontWeight.semiBold,
  },
});