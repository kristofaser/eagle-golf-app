import React, { memo } from 'react';
import { View, Text } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { DURATIONS } from '@/constants/animations';
import { profileStyles, sectionColors } from '../styles/profileStyles';
import { ProAvailabilityCards } from '@/components/molecules/ProAvailabilityCards';
import { ProCourseAvailability } from '@/services/amateur-availability.service';

interface AvailabilitySectionProps {
  courses: ProCourseAvailability[];
  selectedCourseId: string | null;
  onCourseSelect: (courseId: string, courseName: string) => void;
  isLoadingCourses: boolean;
}

export const AvailabilitySection = memo<AvailabilitySectionProps>(
  ({ courses, selectedCourseId, onCourseSelect, isLoadingCourses }) => {
    if (courses.length === 0 && !isLoadingCourses) {
      return null;
    }

    return (
      <Animated.View
        entering={FadeIn.delay(300).duration(DURATIONS.NORMAL)}
        style={[profileStyles.card, { backgroundColor: sectionColors.availability.background }]}
        accessible={true}
        accessibilityRole="region"
        accessibilityLabel="Section disponibilités"
      >
        <View style={profileStyles.cardHeader}>
          <Text style={profileStyles.cardTitle} accessibilityRole="header">
            Disponibilités
          </Text>
        </View>
        <View
          style={[profileStyles.accentLine, { backgroundColor: sectionColors.availability.accent }]}
        />

        {/* Cards des parcours disponibles */}
        <ProAvailabilityCards
          availabilities={courses}
          selectedCourseId={selectedCourseId}
          onCourseSelect={onCourseSelect}
          loading={isLoadingCourses}
        />
      </Animated.View>
    );
  }
);

AvailabilitySection.displayName = 'AvailabilitySection';
