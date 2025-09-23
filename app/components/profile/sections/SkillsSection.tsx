import React, { memo, useCallback } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { HugeiconsIcon } from '@hugeicons/react-native';
import {
  BombIcon,
  GolfBatIcon,
  Target02Icon,
  AiBrain01Icon,
  Clapping02Icon,
  GolfHoleIcon,
  Video02Icon,
} from '@hugeicons/core-free-icons';
import { Colors } from '@/constants/theme';
import { DURATIONS } from '@/constants/animations';
import { profileStyles, sectionColors } from '../styles/profileStyles';

interface SkillsSectionProps {
  skills?: {
    skill_driving?: number | null;
    skill_irons?: number | null;
    skill_wedging?: number | null;
    skill_chipping?: number | null;
    skill_putting?: number | null;
    skill_mental?: number | null;
  };
  profileId: string;
}

const skillConfig = [
  { key: 'driving', label: 'Driving', field: 'skill_driving', icon: BombIcon },
  { key: 'irons', label: 'Fers', field: 'skill_irons', icon: GolfBatIcon },
  { key: 'wedging', label: 'Wedging', field: 'skill_wedging', icon: Target02Icon },
  { key: 'chipping', label: 'Chipping', field: 'skill_chipping', icon: Clapping02Icon },
  { key: 'putting', label: 'Putting', field: 'skill_putting', icon: GolfHoleIcon },
  { key: 'mental', label: 'Mental', field: 'skill_mental', icon: AiBrain01Icon },
];

export const SkillsSection = memo<SkillsSectionProps>(({ skills, profileId }) => {
  const router = useRouter();

  const renderSkillBar = useCallback(
    (label: string, value: number | null | undefined, icon: any, skillKey: string) => {
      // Les valeurs sont stockées sur une échelle de 0-100 dans la DB
      const skillValue = value || 0;
      const percentage = Math.min(100, Math.max(0, skillValue)); // Clamp entre 0 et 100

      const handleVideoPress = () => {
        if (skillKey) {
          console.log(`🎥 Navigation vers vidéo ${skillKey} pour ${profileId}`);
          router.push(`/video-skill/${profileId}/${skillKey}`);
        }
      };

      // Pas d'icône vidéo pour la compétence Mental
      const shouldShowVideo = skillKey && skillKey !== 'mental';

      return (
        <View
          style={profileStyles.skillRow}
          key={label}
          accessible={true}
          accessibilityRole="progressbar"
          accessibilityLabel={`${label}: ${Math.round(percentage)}%`}
          accessibilityValue={{
            min: 0,
            max: 100,
            now: Math.round(percentage),
            text: `${Math.round(percentage)} pourcent`,
          }}
        >
          <View style={profileStyles.skillLabelContainer}>
            <View style={profileStyles.skillLabelWithIcon}>
              {icon && (
                <View style={profileStyles.skillIconContainer}>
                  <HugeiconsIcon
                    icon={icon}
                    size={18}
                    color={Colors.neutral.charcoal}
                    strokeWidth={1.5}
                  />
                </View>
              )}
              <Text style={profileStyles.skillLabel}>{label}</Text>

              {/* Icône vidéo juste à côté du nom - sauf pour Mental */}
              {shouldShowVideo && (
                <TouchableOpacity
                  style={profileStyles.videoIconButton}
                  onPress={handleVideoPress}
                  activeOpacity={0.7}
                  accessible={true}
                  accessibilityRole="button"
                  accessibilityLabel={`Voir la vidéo de démonstration pour ${label}`}
                  accessibilityHint="Double-tap pour ouvrir la vidéo"
                >
                  <HugeiconsIcon
                    icon={Video02Icon}
                    size={18}
                    color={Colors.primary.accent}
                    strokeWidth={1.5}
                    accessibilityElementsHidden={true}
                  />
                </TouchableOpacity>
              )}
            </View>
          </View>
          <View style={profileStyles.skillBarContainer}>
            <View style={profileStyles.skillBarBackground}>
              <View
                style={[
                  profileStyles.skillBarFill,
                  {
                    width: `${percentage}%`,
                    backgroundColor: sectionColors.level.accent,
                  },
                ]}
              />
            </View>
            <Text style={profileStyles.skillValue}>{Math.round(percentage)}%</Text>
          </View>
        </View>
      );
    },
    [profileId, router]
  );

  if (!skills) return null;

  return (
    <Animated.View
      entering={FadeIn.delay(350).duration(DURATIONS.NORMAL)}
      style={[profileStyles.card, { backgroundColor: sectionColors.level.background }]}
      accessible={true}
      accessibilityRole="region"
      accessibilityLabel="Section compétences"
    >
      <View style={profileStyles.cardHeader}>
        <Text style={profileStyles.cardTitle} accessibilityRole="header">
          Compétences
        </Text>
      </View>
      <View style={[profileStyles.accentLine, { backgroundColor: sectionColors.level.accent }]} />

      {/* Skills avec barres de progression et icônes vidéo */}
      <View style={profileStyles.skillsContainer}>
        {skillConfig.map(({ key, label, field, icon }) =>
          renderSkillBar(label, skills[field as keyof typeof skills], icon, key)
        )}
      </View>
    </Animated.View>
  );
});

SkillsSection.displayName = 'SkillsSection';
