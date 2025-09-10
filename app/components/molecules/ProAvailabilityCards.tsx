import React, { memo } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
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
            style={[
              styles.card,
              isSelected && styles.cardSelected,
            ]}
            onPress={() => onCourseSelect(course.golf_course_id, course.golf_course_name)}
            activeOpacity={0.7}
          >
            {isSelected && (
              <View style={styles.checkIcon}>
                <Ionicons name="checkmark-circle" size={24} color={Colors.semantic.success} />
              </View>
            )}
            <Text
              variant="body"
              weight={isSelected ? 'semiBold' : 'medium'}
              color="charcoal"
              numberOfLines={2}
              style={styles.courseName}
            >
              {course.golf_course_name}
            </Text>
            <Text
              variant="caption"
              color="iron"
              style={styles.distance}
            >
              {course.distance_km !== undefined 
                ? `${course.distance_km} km` 
                : course.city}
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
  card: {
    backgroundColor: Colors.neutral.white,
    borderRadius: BorderRadius.medium,
    borderWidth: 1,
    borderColor: Colors.neutral.mist,
    paddingHorizontal: Spacing.m,
    paddingVertical: Spacing.m,
    marginBottom: Spacing.s,
    position: 'relative',
    ...Elevation.small,
  },
  cardSelected: {
    borderColor: Colors.semantic.success,
    borderWidth: 2,
    backgroundColor: Colors.neutral.ball,
    ...Elevation.medium,
  },
  checkIcon: {
    position: 'absolute',
    top: Spacing.s,
    right: Spacing.s,
    zIndex: 1,
  },
  courseName: {
    marginBottom: Spacing.xs,
  },
  distance: {
    marginTop: 'auto',
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