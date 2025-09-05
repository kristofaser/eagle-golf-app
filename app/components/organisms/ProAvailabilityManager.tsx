import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Typography, BorderRadius } from '@/constants/theme';
import { proAvailabilityService } from '@/services/pro-availability.service';

interface ProAvailabilityManagerProps {
  proId: string;
  onSave?: (data: AvailabilityData) => void;
  hideButton?: boolean;
}

interface AvailabilityData {
  recurringAvailability: {
    [key: string]: boolean;
  };
  isGloballyAvailable: boolean;
}

const DAYS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
const PERIODS = ['Matin', 'Après-midi'];

export function ProAvailabilityManager({
  proId,
  onSave,
  hideButton = false,
}: ProAvailabilityManagerProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // État principal
  const [isGloballyAvailable, setIsGloballyAvailable] = useState(true);
  const [recurringAvailability, setRecurringAvailability] = useState<{ [key: string]: boolean }>(
    {}
  );

  // Charger les disponibilités depuis la base de données
  useEffect(() => {
    loadAvailabilitySettings();
  }, [proId]);

  const loadAvailabilitySettings = async () => {
    try {
      setLoading(true);
      const settings = await availabilityService.getProAvailabilitySettings(proId);

      if (settings) {
        // Utiliser les données existantes
        setRecurringAvailability(settings.recurring_availability || {});
        setIsGloballyAvailable(settings.is_globally_available);

        // Notifier le parent
        if (onSave) {
          onSave({
            recurringAvailability: settings.recurring_availability || {},
            isGloballyAvailable: settings.is_globally_available,
          });
        }
      } else {
        // Initialiser avec les valeurs par défaut
        const initialAvailability: { [key: string]: boolean } = {};
        DAYS.forEach((day, dayIndex) => {
          PERIODS.forEach((period, periodIndex) => {
            const key = `${dayIndex}_${periodIndex}`;
            // Par défaut : disponible en semaine, matin seulement le weekend
            if (dayIndex < 5) {
              // Lundi à Vendredi
              initialAvailability[key] = true;
            } else {
              // Samedi et Dimanche
              initialAvailability[key] = periodIndex === 0; // Matin seulement
            }
          });
        });
        setRecurringAvailability(initialAvailability);

        // Notifier le parent des données initiales
        if (onSave) {
          onSave({
            recurringAvailability: initialAvailability,
            isGloballyAvailable: true,
          });
        }
      }
    } catch (error) {
      console.error('Erreur chargement disponibilités:', error);
      Alert.alert('Erreur', 'Impossible de charger vos disponibilités');
    } finally {
      setLoading(false);
    }
  };

  const toggleAvailability = (dayIndex: number, periodIndex: number) => {
    const key = `${dayIndex}_${periodIndex}`;
    const newAvailability = {
      ...recurringAvailability,
      [key]: !recurringAvailability[key],
    };
    setRecurringAvailability(newAvailability);

    // Notifier le parent
    if (onSave) {
      onSave({
        recurringAvailability: newAvailability,
        isGloballyAvailable,
      });
    }
  };

  const toggleAllDay = (dayIndex: number) => {
    const morning = `${dayIndex}_0`;
    const afternoon = `${dayIndex}_1`;
    const currentState = recurringAvailability[morning] && recurringAvailability[afternoon];

    const newAvailability = {
      ...recurringAvailability,
      [morning]: !currentState,
      [afternoon]: !currentState,
    };
    setRecurringAvailability(newAvailability);

    // Notifier le parent
    if (onSave) {
      onSave({
        recurringAvailability: newAvailability,
        isGloballyAvailable,
      });
    }
  };

  const selectAll = () => {
    const newAvailability: { [key: string]: boolean } = {};
    DAYS.forEach((_, dayIndex) => {
      PERIODS.forEach((_, periodIndex) => {
        newAvailability[`${dayIndex}_${periodIndex}`] = true;
      });
    });
    setRecurringAvailability(newAvailability);

    // Notifier le parent
    if (onSave) {
      onSave({
        recurringAvailability: newAvailability,
        isGloballyAvailable,
      });
    }
  };

  const deselectAll = () => {
    const newAvailability: { [key: string]: boolean } = {};
    DAYS.forEach((_, dayIndex) => {
      PERIODS.forEach((_, periodIndex) => {
        newAvailability[`${dayIndex}_${periodIndex}`] = false;
      });
    });
    setRecurringAvailability(newAvailability);

    // Notifier le parent
    if (onSave) {
      onSave({
        recurringAvailability: newAvailability,
        isGloballyAvailable,
      });
    }
  };

  const handleSave = () => {
    setSaving(true);

    const data: AvailabilityData = {
      recurringAvailability,
      isGloballyAvailable,
    };

    // Simuler la sauvegarde
    setTimeout(() => {
      setSaving(false);
      Alert.alert('Succès', 'Vos disponibilités ont été mises à jour');
      onSave?.(data);
    }, 1000);
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color={Colors.primary.accent} />
        <Text style={styles.loadingText}>Chargement de vos disponibilités...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Toggle global */}
      <View style={styles.section}>
        <View style={styles.globalToggle}>
          <View style={styles.toggleContent}>
            <Text style={styles.toggleLabel}>Disponible pour les réservations</Text>
            <Text style={styles.toggleHint}>
              Désactivez pour bloquer toutes les nouvelles réservations
            </Text>
          </View>
          <Switch
            value={isGloballyAvailable}
            onValueChange={(value) => {
              setIsGloballyAvailable(value);
              // Notifier le parent
              if (onSave) {
                onSave({
                  recurringAvailability,
                  isGloballyAvailable: value,
                });
              }
            }}
            trackColor={{ false: Colors.ui.lightGray, true: Colors.primary.accent }}
            thumbColor={Colors.neutral.white}
          />
        </View>
      </View>

      {/* Disponibilités récurrentes */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Mes disponibilités habituelles</Text>

        <View style={styles.availabilityGrid}>
          {/* Header avec les jours */}
          <View style={styles.gridHeader}>
            <View style={styles.periodLabel} />
            {DAYS.map((day, index) => (
              <TouchableOpacity
                key={day}
                style={styles.dayHeader}
                onPress={() => toggleAllDay(index)}
              >
                <Text style={styles.dayHeaderText}>{day.slice(0, 2)}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Lignes pour chaque période */}
          {PERIODS.map((period, periodIndex) => (
            <View key={period} style={styles.gridRow}>
              <Text style={styles.periodText}>{period}</Text>
              {DAYS.map((_, dayIndex) => {
                const key = `${dayIndex}_${periodIndex}`;
                const isAvailable = recurringAvailability[key];

                return (
                  <TouchableOpacity
                    key={key}
                    style={[styles.availabilityCell, isAvailable && styles.availableCellActive]}
                    onPress={() => toggleAvailability(dayIndex, periodIndex)}
                  >
                    {isAvailable && (
                      <Ionicons name="checkmark" size={20} color={Colors.neutral.white} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          ))}
        </View>

        {/* Boutons d'actions rapides */}
        <View style={styles.quickActionsContainer}>
          <TouchableOpacity onPress={selectAll} style={styles.quickActionButton}>
            <Text style={styles.quickActionButtonText}>Tout sélectionner</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={deselectAll} style={styles.quickActionButton}>
            <Text style={styles.quickActionButtonText}>Tout désélectionner</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Bouton Enregistrer */}
      {!hideButton && (
        <TouchableOpacity
          style={[styles.saveButton, saving && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color={Colors.neutral.white} />
          ) : (
            <Text style={styles.saveButtonText}>Enregistrer mes disponibilités</Text>
          )}
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.neutral.background,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: Spacing.xxl,
  },
  loadingText: {
    marginTop: Spacing.m,
    fontSize: Typography.fontSize.body,
    color: Colors.neutral.iron,
  },
  section: {
    padding: Spacing.m,
    backgroundColor: Colors.neutral.white,
    marginBottom: Spacing.s,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.h4,
    fontWeight: Typography.fontWeight.semiBold,
    color: Colors.neutral.charcoal,
    marginBottom: Spacing.m,
  },
  globalToggle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  toggleContent: {
    flex: 1,
    marginRight: Spacing.m,
  },
  toggleLabel: {
    fontSize: Typography.fontSize.body,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.neutral.charcoal,
  },
  toggleHint: {
    fontSize: Typography.fontSize.small,
    color: Colors.ui.subtleGray,
    marginTop: 4,
  },
  quickActionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: Spacing.m,
    gap: Spacing.s,
  },
  quickActionButton: {
    flex: 1,
    paddingVertical: Spacing.s,
    paddingHorizontal: Spacing.m,
    backgroundColor: Colors.ui.lightBackground,
    borderRadius: BorderRadius.medium,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.ui.lightGray,
  },
  quickActionButtonText: {
    fontSize: Typography.fontSize.body,
    color: Colors.primary.accent,
    fontWeight: Typography.fontWeight.medium,
  },
  availabilityGrid: {
    borderWidth: 1,
    borderColor: Colors.ui.lightGray,
    borderRadius: BorderRadius.medium,
    overflow: 'hidden',
  },
  gridHeader: {
    flexDirection: 'row',
    backgroundColor: Colors.ui.lightBackground,
    borderBottomWidth: 1,
    borderBottomColor: Colors.ui.lightGray,
  },
  periodLabel: {
    width: 80,
    padding: Spacing.s,
  },
  dayHeader: {
    flex: 1,
    padding: Spacing.s,
    alignItems: 'center',
  },
  dayHeaderText: {
    fontSize: Typography.fontSize.small,
    fontWeight: Typography.fontWeight.semiBold,
    color: Colors.neutral.charcoal,
    textAlign: 'center',
  },
  gridRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: Colors.ui.lightGray,
  },
  periodText: {
    width: 80,
    padding: Spacing.s,
    fontSize: Typography.fontSize.small,
    color: Colors.neutral.charcoal,
  },
  availabilityCell: {
    flex: 1,
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderLeftWidth: 1,
    borderLeftColor: Colors.ui.lightGray,
    backgroundColor: Colors.neutral.white,
  },
  availableCellActive: {
    backgroundColor: Colors.primary.accent,
  },
  saveButton: {
    backgroundColor: Colors.primary.accent,
    paddingVertical: Spacing.m,
    marginHorizontal: Spacing.m,
    marginVertical: Spacing.l,
    borderRadius: BorderRadius.medium,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    fontSize: Typography.fontSize.body,
    fontWeight: Typography.fontWeight.semiBold,
    color: Colors.neutral.white,
  },
});
