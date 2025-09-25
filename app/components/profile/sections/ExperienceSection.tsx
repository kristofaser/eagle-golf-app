import React, { memo } from 'react';
import { View, Text } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { DURATIONS } from '@/constants/animations';
import { profileStyles, sectionColors } from '../styles/profileStyles';

interface ExperienceItem {
  type: 'winner' | 'top5' | 'top10' | 'top20' | 'top30' | 'top40' | 'top50' | 'top60';
  description: string;
}

interface ExperienceSectionProps {
  experience?: ExperienceItem[] | string | null;
}

const getExperienceEmoji = (type: string) => {
  const emojis: Record<string, string> = {
    'winner': '🏆',
    'top5': '🥇',
    'top10': '🥈',
    'top20': '🥉',
    'top30': '📊',
    'top40': '📈',
    'top50': '📋',
    'top60': '📝'
  };
  return emojis[type] || '🏌️';
};

const getExperienceLabel = (type: string) => {
  const labels: Record<string, string> = {
    'winner': 'Victoire',
    'top5': 'Top 5',
    'top10': 'Top 10',
    'top20': 'Top 20',
    'top30': 'Top 30',
    'top40': 'Top 40',
    'top50': 'Top 50',
    'top60': 'Top 60'
  };
  return labels[type] || type.toUpperCase();
};

export const ExperienceSection = memo<ExperienceSectionProps>(({ experience }) => {
  // Parse JSON si c'est une string
  let experienceData: ExperienceItem[] = [];

  if (typeof experience === 'string') {
    try {
      experienceData = JSON.parse(experience);
    } catch {
      return null;
    }
  } else if (Array.isArray(experience)) {
    experienceData = experience;
  }

  if (!experienceData || experienceData.length === 0) {
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
        <Text style={profileStyles.cardTitle} accessibilityRole="header">
          Expérience
        </Text>
      </View>
      <View
        style={[profileStyles.accentLine, { backgroundColor: sectionColors.experience.accent }]}
      />

      <View style={profileStyles.experienceList}>
        {experienceData.map((exp: ExperienceItem, index: number) => (
          <View key={index} style={profileStyles.experienceItem}>
            <View style={profileStyles.experienceBadgeContainer}>
              <Text style={profileStyles.experienceEmoji}>{getExperienceEmoji(exp.type)}</Text>
              <Text style={profileStyles.experienceLabel}>{getExperienceLabel(exp.type)}</Text>
            </View>
            <Text style={profileStyles.experienceDescription}>{exp.description}</Text>
          </View>
        ))}
      </View>
    </Animated.View>
  );
});

ExperienceSection.displayName = 'ExperienceSection';
