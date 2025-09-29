import React from 'react';
import { Tabs, useRouter } from 'expo-router';
import { Colors, Typography, TouchTarget } from '@/constants/theme';
import { useOverlay } from '@/contexts/OverlayContext';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { TouchableOpacity, View } from 'react-native';
import { useAuth } from '@/hooks/useAuth';
import { useUser } from '@/hooks/useUser';
import { Avatar, FavoriteBadge } from '@/components/atoms';
import { useTotalFavorites } from '@/hooks/useFavorites';
import {
  GolfBallIcon,
  GolfHoleIcon,
  Airplane01Icon,
  CrownIcon,
  Search01Icon,
  UserIcon,
  Home01Icon,
  FavouriteIcon,
} from '@hugeicons/core-free-icons';

export default function TabLayout() {
  const router = useRouter();
  const { isOverlayOpen } = useOverlay();
  const { user, isAuthenticated } = useAuth();
  const { profile } = useUser();
  const totalFavorites = useTotalFavorites();

  const handleSearchPress = () => {
    router.push('/search');
  };

  const handleFavoritesPress = () => {
    router.push('/favorites');
  };

  const handleProfilePress = () => {
    if (!isAuthenticated) {
      router.push('/(auth)/register');
    } else {
      router.push('/profile');
    }
  };

  return (
    <>
      <Tabs
        screenOptions={({ route }) => ({
          headerShown: true,
          headerStyle: {
            backgroundColor: Colors.neutral.ball,
            elevation: 0,
            shadowOpacity: 0,
            borderBottomWidth: 1,
            borderBottomColor: Colors.neutral.mist,
          },
          headerTitleStyle: {
            fontFamily: Typography.fontFamily.primary,
            fontSize: Typography.fontSize.h2,
            fontWeight: Typography.fontWeight.bold,
            color: Colors.neutral.charcoal,
          },
          headerTitle:
            route.name === 'index'
              ? 'Accueil'
              : route.name === 'pros'
                ? 'Pros'
                : route.name === 'parcours'
                  ? 'Parcours'
                  : route.name === 'voyages'
                    ? 'Voyages'
                    : route.name === 'premium'
                      ? 'Premium'
                      : '',
          headerLeft: () => (
            <TouchableOpacity
              onPress={handleProfilePress}
              style={[TouchTarget.minimum, { marginLeft: 16 }]}
            >
              <Avatar
                imageUrl={profile?.avatar_url}
                name={profile ? `${profile.first_name} ${profile.last_name}` : ''}
                size="small"
                variant="bordered"
                showOnlineIndicator={isAuthenticated}
                fallback={
                  <View
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 16,
                      backgroundColor: Colors.neutral.mist,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <HugeiconsIcon icon={UserIcon} size={16} color={Colors.primary.accent} />
                  </View>
                }
              />
            </TouchableOpacity>
          ),
          headerRight: () => (
            <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: 16 }}>
              {/* Bouton Favoris avec badge */}
              <TouchableOpacity
                onPress={handleFavoritesPress}
                style={[TouchTarget.minimum, { marginRight: 8, position: 'relative' }]}
              >
                <HugeiconsIcon
                  icon={FavouriteIcon}
                  size={24}
                  color={totalFavorites > 0 ? '#ef4444' : Colors.primary.accent}
                />
                <FavoriteBadge count={totalFavorites} size="small" />
              </TouchableOpacity>

              {/* Bouton Search */}
              <TouchableOpacity onPress={handleSearchPress} style={TouchTarget.minimum}>
                <HugeiconsIcon icon={Search01Icon} size={24} color={Colors.primary.accent} />
              </TouchableOpacity>
            </View>
          ),
          tabBarActiveTintColor: Colors.primary.accent,
          tabBarInactiveTintColor: Colors.neutral.course,
          tabBarLabelStyle: {
            fontFamily: Typography.fontFamily.primary,
            fontSize: Typography.fontSize.caption,
            fontWeight: Typography.fontWeight.medium,
          },
          tabBarStyle: {
            backgroundColor: Colors.neutral.ball,
            borderTopColor: Colors.neutral.mist,
            borderTopWidth: 1,
            paddingBottom: 5,
            paddingTop: 8,
            height: 68, // Hauteur suffisante pour icônes + labels
            display: isOverlayOpen ? 'none' : 'flex',
          },
        })}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Accueil',
            tabBarIcon: ({ color }) => <HugeiconsIcon icon={Home01Icon} size={24} color={color} />,
          }}
        />
        <Tabs.Screen
          name="pros"
          options={{
            title: 'Pros',
            tabBarIcon: ({ color }) => (
              <HugeiconsIcon icon={GolfBallIcon} size={24} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="parcours"
          options={{
            title: 'Parcours',
            tabBarIcon: ({ color }) => (
              <HugeiconsIcon icon={GolfHoleIcon} size={24} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="voyages"
          options={{
            title: 'Voyages',
            tabBarIcon: ({ color }) => (
              <HugeiconsIcon icon={Airplane01Icon} size={24} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="premium"
          options={{
            title: 'Premium',
            tabBarIcon: ({ color }) => <HugeiconsIcon icon={CrownIcon} size={24} color={color} />,
          }}
        />
      </Tabs>
    </>
  );
}