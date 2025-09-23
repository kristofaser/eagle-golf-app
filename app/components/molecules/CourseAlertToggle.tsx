import React from 'react';
import { View, Text, Switch, StyleSheet, ActivityIndicator } from 'react-native';
import { Colors, Spacing, BorderRadius } from '@/constants/theme';
import { useCourseAlert } from '@/hooks/useCourseAlert';
import { Ionicons } from '@expo/vector-icons';

export interface CourseAlertToggleProps {
  /**
   * ID du parcours de golf
   */
  golfCourseId: string;

  /**
   * Nom du parcours pour l'affichage
   */
  courseName: string;

  /**
   * Style compact pour affichage dans la card
   * @default false
   */
  compact?: boolean;

  /**
   * Style personnalisé du container
   */
  style?: object;

  /**
   * Callback quand l'état change
   */
  onToggle?: (enabled: boolean) => void;
}

export const CourseAlertToggle: React.FC<CourseAlertToggleProps> = ({
  golfCourseId,
  courseName,
  compact = false,
  style,
  onToggle,
}) => {
  const { isEnabled, isLoading, error, toggleAlert } = useCourseAlert(golfCourseId);

  const handleToggle = async () => {
    const success = await toggleAlert();
    if (success) {
      onToggle?.(!isEnabled);
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.container, compact && styles.compactContainer, style]}>
        <ActivityIndicator size="small" color={Colors.primary.electric} />
        <Text style={[styles.loadingText, compact && styles.compactText]}>Chargement...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View
        style={[styles.container, styles.errorContainer, compact && styles.compactContainer, style]}
      >
        <Ionicons name="warning-outline" size={16} color={Colors.semantic.warning.default} />
        <Text style={[styles.errorText, compact && styles.compactText]}>
          {compact ? 'Erreur' : 'Erreur de chargement'}
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, compact && styles.compactContainer, style]}>
      <View style={styles.content}>
        <Ionicons
          name="notifications-outline"
          size={compact ? 16 : 20}
          color={isEnabled ? Colors.primary.electric : Colors.neutral.charcoal}
          style={styles.icon}
        />
        <Text style={[styles.text, compact && styles.compactText]}>
          {compact ? 'Être averti' : `Être averti quand un pro est disponible sur ${courseName}`}
        </Text>
      </View>
      <Switch
        value={isEnabled}
        onValueChange={handleToggle}
        trackColor={{
          false: Colors.neutral.mist,
          true: Colors.primary.electric + '40',
        }}
        thumbColor={isEnabled ? Colors.primary.electric : Colors.neutral.white}
        ios_backgroundColor={Colors.neutral.mist}
        style={compact && styles.compactSwitch}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.neutral.white,
    paddingHorizontal: Spacing.m,
    paddingVertical: Spacing.m,
    borderRadius: BorderRadius.medium,
    borderWidth: 1,
    borderColor: Colors.neutral.mist,
  },
  compactContainer: {
    paddingHorizontal: Spacing.s,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.small,
  },
  content: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: Spacing.s,
  },
  icon: {
    marginRight: Spacing.xs,
  },
  text: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: Colors.neutral.charcoal,
    lineHeight: 20,
  },
  compactText: {
    fontSize: 12,
    lineHeight: 16,
  },
  compactSwitch: {
    transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }],
  },
  errorContainer: {
    backgroundColor: Colors.semantic.warning.light,
    borderColor: Colors.semantic.warning.default + '40',
  },
  errorText: {
    color: Colors.semantic.warning.default,
    fontSize: 12,
    fontWeight: '500',
  },
  loadingText: {
    marginLeft: Spacing.xs,
    fontSize: 12,
    color: Colors.neutral.charcoal,
  },
});
