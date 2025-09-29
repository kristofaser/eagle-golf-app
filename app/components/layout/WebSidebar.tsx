import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text } from '@/components/atoms';
import { Colors, Spacing, BorderRadius } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, usePathname } from 'expo-router';

interface SidebarItem {
  id: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  route: string;
  badge?: number;
}

const SIDEBAR_ITEMS: SidebarItem[] = [
  {
    id: 'home',
    label: 'Accueil',
    icon: 'home-outline',
    route: '/',
  },
  {
    id: 'parcours',
    label: 'Parcours',
    icon: 'golf-outline',
    route: '/parcours',
  },
  {
    id: 'lessons',
    label: 'Mes Cours',
    icon: 'school-outline',
    route: '/lessons',
  },
  {
    id: 'profile',
    label: 'Profil',
    icon: 'person-outline',
    route: '/profile',
  },
  {
    id: 'settings',
    label: 'Paramètres',
    icon: 'settings-outline',
    route: '/settings',
  },
];

export const WebSidebar: React.FC = () => {
  const router = useRouter();
  const pathname = usePathname();

  const handleNavigate = (route: string) => {
    router.push(route as any);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.logoContainer}>
          <Ionicons name="golf" size={32} color={Colors.primary.accent} />
          <Text variant="h3" weight="bold" color="charcoal">
            Eagle Golf
          </Text>
        </View>
      </View>

      {/* Navigation */}
      <View style={styles.navigation}>
        {SIDEBAR_ITEMS.map((item) => {
          const isActive = pathname === item.route;

          return (
            <TouchableOpacity
              key={item.id}
              style={[
                styles.navItem,
                isActive && styles.navItemActive,
              ]}
              onPress={() => handleNavigate(item.route)}
            >
              <Ionicons
                name={isActive ? item.icon.replace('-outline', '') as any : item.icon}
                size={24}
                color={isActive ? Colors.primary.accent : Colors.neutral.iron}
              />
              <Text
                variant="body"
                weight={isActive ? 'semiBold' : 'regular'}
                color={isActive ? 'accent' : 'iron'}
                style={styles.navItemText}
              >
                {item.label}
              </Text>
              {item.badge && item.badge > 0 && (
                <View style={styles.badge}>
                  <Text variant="caption" weight="bold" color="white">
                    {item.badge > 99 ? '99+' : item.badge}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.supportButton}>
          <Ionicons name="help-circle-outline" size={20} color={Colors.neutral.iron} />
          <Text variant="caption" color="iron">
            Support & Aide
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.neutral.white,
  },
  header: {
    padding: Spacing.l,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral.pearl,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.s,
  },
  navigation: {
    flex: 1,
    padding: Spacing.m,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.m,
    borderRadius: BorderRadius.medium,
    marginBottom: Spacing.xs,
    position: 'relative',
    cursor: 'pointer', // Style web
  },
  navItemActive: {
    backgroundColor: Colors.primary.lightBlue,
  },
  navItemText: {
    marginLeft: Spacing.s,
    flex: 1,
  },
  badge: {
    backgroundColor: Colors.semantic.error.default,
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xs,
  },
  footer: {
    padding: Spacing.m,
    borderTopWidth: 1,
    borderTopColor: Colors.neutral.pearl,
  },
  supportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    padding: Spacing.s,
    cursor: 'pointer', // Style web
  },
});