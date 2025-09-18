import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, BorderRadius, Spacing } from '@/constants/theme';
import { Text } from '@/components/atoms';

interface SkillTagProps {
  skill: string;
  hasVideo?: boolean;
  onVideoPress?: () => void;
}

const SkillTag: React.FC<SkillTagProps> = ({
  skill,
  hasVideo = false,
  onVideoPress
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.tag}>
        <Text variant="caption" color="charcoal" weight="medium">
          {skill}
        </Text>
      </View>

      {hasVideo && (
        <TouchableOpacity
          style={styles.videoButton}
          onPress={onVideoPress}
          activeOpacity={0.7}
        >
          <Ionicons
            name="play-circle"
            size={20}
            color={Colors.primary.accent}
          />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: Spacing.s,
    marginBottom: Spacing.xs,
  },
  tag: {
    backgroundColor: Colors.neutral.mist,
    paddingHorizontal: Spacing.s,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.small,
  },
  videoButton: {
    marginLeft: Spacing.xs,
    padding: 2,
  },
});

export { SkillTag };