import React, { memo } from 'react';
import { View, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, Elevation } from '@/constants/theme';
import { Text } from '@/components/atoms';
import { ProCourseAvailability } from '@/services/amateur-availability.service';

interface ProAvailabilityCardsProps {
  availabilities: ProCourseAvailability[];
  selectedCourseId: string | null;
  onCourseSelect: (courseId: string, courseName: string) => void;
  loading?: boolean;
}

const ProAvailabilityCardsComponent: React.FC<ProAvailabilityCardsProps> = ({
  availabilities,
  selectedCourseId,
  onCourseSelect,
  loading = false,
}) => {
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color={Colors.primary.accent} />
        <Text variant="body" color="iron" style={styles.loadingText}>
          Chargement des disponibilités...
        </Text>
      </View>
    );
  }

  if (!availabilities || availabilities.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text variant="body" color="iron" style={styles.emptyText}>
          Aucune disponibilité pour le moment
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {availabilities.map((course) => {
        const isSelected = selectedCourseId === course.golf_course_id;

        return (
          <TouchableOpacity
            key={course.golf_course_id}
            style={[styles.listItem, isSelected && styles.listItemSelected]}
            onPress={() => onCourseSelect(course.golf_course_id, course.golf_course_name)}
            activeOpacity={0.7}
          >
            <View style={styles.leftContent}>
              <Ionicons
                name={isSelected ? 'checkmark-circle' : 'ellipse-outline'}
                size={20}
                color={isSelected ? Colors.semantic.success : Colors.neutral.iron}
              />
              <Text
                variant="body"
                weight={isSelected ? 'semiBold' : 'medium'}
                color={isSelected ? 'charcoal' : 'charcoal'}
                numberOfLines={1}
                style={styles.cityName}
              >
                {course.city}
              </Text>
            </View>
            <Text
              variant="body"
              weight={isSelected ? 'semiBold' : 'medium'}
              color="iron"
              style={styles.distance}
            >
              {course.distance_km !== undefined ? `${course.distance_km} km` : ''}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

export const ProAvailabilityCards = memo(ProAvailabilityCardsComponent);

const styles = StyleSheet.create({
  container: {
    paddingVertical: Spacing.xs,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.m,
    paddingVertical: Spacing.s,
    marginBottom: Spacing.xs,
    borderRadius: BorderRadius.large,
    backgroundColor: Colors.neutral.white,
    borderWidth: 1,
    borderColor: Colors.neutral.mist,
  },
  listItemSelected: {
    backgroundColor: Colors.neutral.ball,
    borderColor: Colors.semantic.success,
    borderWidth: 1.5,
  },
  leftContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  cityName: {
    marginLeft: Spacing.s,
    flex: 1,
  },
  distance: {
    marginLeft: Spacing.s,
  },
  loadingContainer: {
    padding: Spacing.l,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: Spacing.s,
  },
  emptyContainer: {
    padding: Spacing.l,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    textAlign: 'center',
  },
});
