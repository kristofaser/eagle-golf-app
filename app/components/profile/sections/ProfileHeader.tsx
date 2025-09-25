import React, { memo } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import Animated from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/theme';
import { profileStyles, HEADER_HEIGHT } from '../styles/profileStyles';
import { FullProfile } from '@/services/profile.service';

interface ProfileHeaderProps {
  profile: FullProfile;
  scrollY: Animated.SharedValue<number>;
  animatedHeaderStyle: any;
  animatedHeaderContentStyle: any;
  animatedHeaderIconsStyle: any;
  isFavorite: boolean;
  isToggling: boolean;
  onToggleFavorite: () => void;
  isProAvailable: boolean;
}

export const ProfileHeader = memo<ProfileHeaderProps>(
  ({
    profile,
    scrollY,
    animatedHeaderStyle,
    animatedHeaderContentStyle,
    animatedHeaderIconsStyle,
    isFavorite,
    isToggling,
    onToggleFavorite,
    isProAvailable,
  }) => {
    const router = useRouter();
    const insets = useSafeAreaInsets();

    return (
      <Animated.View
        style={[
          profileStyles.header,
          animatedHeaderStyle,
          {
            height: HEADER_HEIGHT + insets.top,
            paddingTop: insets.top,
            zIndex: 100,
          },
        ]}
      >
        {/* Contenu noir (visible quand scrollé) */}
        <Animated.View style={[profileStyles.headerContent, animatedHeaderContentStyle]}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={profileStyles.iconButton}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Retour"
            accessibilityHint="Appuyez pour revenir à l'écran précédent"
          >
            <Ionicons
              name="arrow-back"
              size={28}
              color="black"
              accessibilityElementsHidden={true}
            />
          </TouchableOpacity>

          <View style={profileStyles.headerCenter}>
            <Text style={profileStyles.headerTitle}>
              {profile.first_name} {profile.last_name}
            </Text>
            <View style={profileStyles.headerAvailability}>
              <View
                style={[
                  profileStyles.availabilityDotSmall,
                  !isProAvailable && profileStyles.unavailableDot,
                ]}
              />
              <Text style={profileStyles.availabilityTextSmall}>
                {isProAvailable ? 'Disponible' : 'Indisponible'}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            onPress={onToggleFavorite}
            disabled={isToggling}
            style={profileStyles.iconButton}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel={isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
            accessibilityState={{ selected: isFavorite, disabled: isToggling }}
            accessibilityHint="Double-tap pour modifier le statut favori"
          >
            <Ionicons
              name={isFavorite ? 'heart' : 'heart-outline'}
              size={28}
              color={isFavorite ? Colors.semantic.error.default : 'black'}
              accessibilityElementsHidden={true}
            />
          </TouchableOpacity>
        </Animated.View>

        {/* Icônes blanches (visibles quand pas scrollé) */}
        <Animated.View
          style={[
            profileStyles.headerContent,
            profileStyles.headerIcons,
            animatedHeaderIconsStyle,
            { top: insets.top },
          ]}
        >
          <TouchableOpacity
            onPress={() => router.back()}
            style={profileStyles.iconButton}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Retour"
            accessibilityHint="Appuyez pour revenir à l'écran précédent"
          >
            <Ionicons
              name="arrow-back"
              size={28}
              color="white"
              accessibilityElementsHidden={true}
            />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={onToggleFavorite}
            disabled={isToggling}
            style={profileStyles.iconButton}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel={isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
            accessibilityState={{ selected: isFavorite, disabled: isToggling }}
            accessibilityHint="Double-tap pour modifier le statut favori"
          >
            <Ionicons
              name={isFavorite ? 'heart' : 'heart-outline'}
              size={28}
              color={isFavorite ? Colors.semantic.error.default : 'white'}
              accessibilityElementsHidden={true}
            />
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>
    );
  }
);

ProfileHeader.displayName = 'ProfileHeader';
