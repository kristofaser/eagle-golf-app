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
import React, { useState, useEffect } from 'react';
import { Link, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Typography, BorderRadius } from '@/constants/theme';
import { useAuth } from '@/hooks/useAuth';
import { proAvailabilityService, ProAvailabilityGroup } from '@/services/pro-availability.service';

export default function AvailabilityScreen() {
  const { user } = useAuth();
  const [availabilityGroups, setAvailabilityGroups] = useState<ProAvailabilityGroup[]>([]);
  const [loading, setLoading] = useState(true);

  // Recharger les données quand l'écran devient focus
  useFocusEffect(
    React.useCallback(() => {
      if (user?.id) {
        loadAvailabilities();
      }
    }, [user?.id])
  );

  const loadAvailabilities = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      const groups = await proAvailabilityService.getProAvailabilitiesGrouped(user.id);
      setAvailabilityGroups(groups);
    } catch (error) {
      console.error('Erreur chargement disponibilités:', error);
      Alert.alert('Erreur', 'Impossible de charger vos disponibilités');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteGroup = async (courseId: string, courseName: string) => {
    if (!user?.id) return;

    Alert.alert(
      'Supprimer les disponibilités',
      `Êtes-vous sûr de vouloir supprimer toutes vos disponibilités sur ${courseName} ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            const success = await proAvailabilityService.deleteProAvailabilitiesByCourse(
              user.id,
              courseId
            );
            if (success) {
              loadAvailabilities();
            } else {
              Alert.alert('Erreur', 'Impossible de supprimer les disponibilités');
            }
          },
        },
      ]
    );
  };

  const formatDateRange = (dates: string[]): string => {
    if (dates.length === 0) return '';
    if (dates.length === 1) return new Date(dates[0]).toLocaleDateString('fr-FR');
    
    const sortedDates = [...dates].sort();
    const firstDate = new Date(sortedDates[0]).toLocaleDateString('fr-FR');
    const lastDate = new Date(sortedDates[sortedDates.length - 1]).toLocaleDateString('fr-FR');
    
    return `${firstDate} - ${lastDate}`;
  };

  if (!user) {
    return null;
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary.accent} />
          <Text style={styles.loadingText}>Chargement...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Instructions */}
        <View style={styles.instructionsContainer}>
          <Ionicons name="information-circle-outline" size={20} color={Colors.primary.accent} />
          <Text style={styles.instructionsText}>
            Gérez vos disponibilités par parcours de golf
          </Text>
        </View>

        {/* Liste des disponibilités */}
        {availabilityGroups.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons 
              name="calendar-outline" 
              size={64} 
              color={Colors.ui.subtleGray} 
              style={styles.emptyIcon} 
            />
            <Text style={styles.emptyTitle}>Aucune disponibilité</Text>
            <Text style={styles.emptySubtitle}>
              Ajoutez vos premières disponibilités pour recevoir des réservations
            </Text>
          </View>
        ) : (
          availabilityGroups.map((group) => (
            <View key={group.course.id} style={styles.groupCard}>
              <View style={styles.groupHeader}>
                <View style={styles.groupInfo}>
                  <Text style={styles.courseName}>{group.course.name}</Text>
                  <View style={styles.courseDetails}>
                    <Text style={styles.courseCity}>{group.course.city}</Text>
                    <Text style={styles.courseSeparator}>•</Text>
                    <View style={styles.courseDatesCount}>
                      <Ionicons name="calendar" size={14} color={Colors.primary.accent} />
                      <Text style={styles.courseDatesText}>
                        {group.dates.length} jour{group.dates.length > 1 ? 's' : ''}
                      </Text>
                    </View>
                  </View>
                </View>
                <View style={styles.actionButtons}>
                  <Link
                    href={{
                      pathname: "/profile/availability/select-dates/[courseId]",
                      params: {
                        courseId: group.course.id,
                        courseName: group.course.name,
                        courseCity: group.course.city,
                        mode: 'edit',
                        existingDates: JSON.stringify(group.dates)
                      }
                    }}
                    asChild
                  >
                    <TouchableOpacity style={styles.editButton}>
                      <Ionicons name="pencil-outline" size={20} color={Colors.primary.accent} />
                    </TouchableOpacity>
                  </Link>
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => handleDeleteGroup(group.course.id, group.course.name)}
                  >
                    <Ionicons name="trash-outline" size={20} color={Colors.semantic.error} />
                  </TouchableOpacity>
                </View>
              </View>

            </View>
          ))
        )}
      </ScrollView>

      {/* Bouton flottant */}
      <View style={styles.fabContainer}>
        <Link href="/profile/availability/select-course" asChild>
          <TouchableOpacity style={styles.fab}>
            <Ionicons name="add" size={24} color="white" />
            <Text style={styles.fabText}>Ajouter</Text>
          </TouchableOpacity>
        </Link>
      </View>
    </SafeAreaView>
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
    padding: Spacing.m,
    paddingBottom: 100, // Espace pour le FAB
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
  instructionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.ui.lightBackground,
    padding: Spacing.m,
    borderRadius: BorderRadius.medium,
    marginBottom: Spacing.l,
    gap: Spacing.s,
  },
  instructionsText: {
    flex: 1,
    fontSize: 14,
    color: Colors.neutral.charcoal,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    marginBottom: Spacing.l,
  },
  emptyTitle: {
    fontSize: Typography.fontSize.h3,
    fontWeight: Typography.fontWeight.semiBold,
    color: Colors.neutral.charcoal,
    marginBottom: Spacing.s,
  },
  emptySubtitle: {
    fontSize: Typography.fontSize.body,
    color: Colors.ui.subtleGray,
    textAlign: 'center',
    paddingHorizontal: Spacing.xl,
  },
  groupCard: {
    backgroundColor: Colors.neutral.white,
    borderRadius: BorderRadius.medium,
    padding: Spacing.m,
    marginBottom: Spacing.m,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  groupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.m,
  },
  groupInfo: {
    flex: 1,
  },
  courseName: {
    fontSize: Typography.fontSize.h4,
    fontWeight: Typography.fontWeight.semiBold,
    color: Colors.neutral.charcoal,
    marginBottom: Spacing.xs,
  },
  courseDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.xs,
  },
  courseSeparator: {
    fontSize: Typography.fontSize.caption,
    color: Colors.ui.subtleGray,
    marginHorizontal: Spacing.xs,
  },
  courseCity: {
    fontSize: Typography.fontSize.caption,
    color: Colors.ui.subtleGray,
  },
  courseDatesCount: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  courseDatesText: {
    fontSize: Typography.fontSize.caption,
    color: Colors.primary.accent,
    fontWeight: Typography.fontWeight.semiBold,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  editButton: {
    padding: Spacing.s,
  },
  deleteButton: {
    padding: Spacing.s,
  },
  fabContainer: {
    position: 'absolute',
    bottom: Spacing.l,
    right: Spacing.l,
  },
  fab: {
    backgroundColor: Colors.primary.accent,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.l,
    paddingVertical: Spacing.m,
    borderRadius: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    gap: Spacing.s,
  },
  fabText: {
    color: 'white',
    fontSize: Typography.fontSize.body,
    fontWeight: Typography.fontWeight.semiBold,
  },
});