import React, { memo } from 'react';
import { View, Text } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { DURATIONS } from '@/constants/animations';
import { profileStyles, sectionColors } from '../styles/profileStyles';

interface ExperienceItem {
  type: 'winner' | 'top5' | 'top10' | 'top20' | 'top30';
  description: string;
}

interface ExperienceSectionProps {
  experience?: ExperienceItem[] | null;
}

export const ExperienceSection = memo<ExperienceSectionProps>(({ experience }) => {
  if (!experience || !Array.isArray(experience) || experience.length === 0) {
    return null;
  }

  return (
    <Animated.View
      entering={FadeIn.delay(400).duration(DURATIONS.NORMAL)}
      style={[profileStyles.card, { backgroundColor: sectionColors.experience.background }]}
      accessible={true}
      accessibilityRole="region"
      accessibilityLabel="Section expérience"
    >
      <View style={profileStyles.cardHeader}>
        <Text style={profileStyles.cardTitle} accessibilityRole="header">Expérience</Text>
      </View>
      <View style={[profileStyles.accentLine, { backgroundColor: sectionColors.experience.accent }]} />

      <View style={profileStyles.experienceList}>
        {experience.map((exp: ExperienceItem, index: number) => (
          <View key={index} style={profileStyles.experienceItem}>
            <View
              style={[
                profileStyles.experienceBadge,
                exp.type === 'winner' && profileStyles.winnerBadge,
                exp.type === 'top5' && profileStyles.top5Badge,
                exp.type === 'top10' && profileStyles.top10Badge,
                exp.type === 'top20' && profileStyles.top20Badge,
                exp.type === 'top30' && profileStyles.top30Badge,
              ]}
            >
              <Ionicons
                name={exp.type === 'winner' ? 'trophy' : 'medal'}
                size={14}
                color="white"
              />
              <Text style={profileStyles.experienceBadgeText}>
                {exp.type === 'winner' ? 'Victoire' : exp.type.toUpperCase()}
              </Text>
            </View>
            <Text style={profileStyles.experienceDescription}>{exp.description}</Text>
          </View>
        ))}
      </View>
    </Animated.View>
  );
});

ExperienceSection.displayName = 'ExperienceSection';