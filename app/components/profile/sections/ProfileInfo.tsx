import React, { memo } from 'react';
import { View, Text } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { DURATIONS } from '@/constants/animations';
import { profileStyles } from '../styles/profileStyles';
import { FullProfile } from '@/services/profile.service';

interface ProfileInfoProps {
  profile: FullProfile;
  isProAvailable: boolean;
}

export const ProfileInfo = memo<ProfileInfoProps>(({ profile, isProAvailable }) => {
  const proDetails = profile.pro_profiles;

  return (
    <View
      style={profileStyles.headerRow}
      accessible={true}
      accessibilityRole="header"
      accessibilityLabel={`${profile.first_name} ${profile.last_name}, ${proDetails?.division || ''} ${
        proDetails?.world_ranking ? `Classement mondial ${proDetails.world_ranking}` : ''
      }, ${isProAvailable ? 'Disponible' : 'Indisponible'}`}
    >
      <View style={profileStyles.titleContainer}>
        <Animated.Text style={profileStyles.title} sharedTransitionTag={`title-${profile.id}`}>
          {profile.first_name} {profile.last_name}
        </Animated.Text>

        {/* Division et Ranking sur la même ligne */}
        <Animated.View
          entering={FadeIn.delay(250).duration(DURATIONS.NORMAL)}
          style={profileStyles.badgesRow}
        >
          {proDetails?.division && (
            <Text style={profileStyles.divisionText}>{proDetails.division}</Text>
          )}
          {proDetails?.world_ranking && (
            <Text style={profileStyles.rankingText}>WR {proDetails.world_ranking}</Text>
          )}
        </Animated.View>
      </View>

      <Animated.View
        style={profileStyles.availabilityIndicator}
        entering={FadeIn.delay(200).duration(DURATIONS.NORMAL)}
      >
        <View
          style={[profileStyles.availabilityDot, !isProAvailable && profileStyles.unavailableDot]}
        />
        <Text
          style={[profileStyles.availabilityText, !isProAvailable && profileStyles.unavailableText]}
        >
          {isProAvailable ? 'Disponible' : 'Indisponible'}
        </Text>
      </Animated.View>
    </View>
  );
});

ProfileInfo.displayName = 'ProfileInfo';
