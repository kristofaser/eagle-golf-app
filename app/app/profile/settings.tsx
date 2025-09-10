import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Switch, Alert } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/hooks/useAuth';
import { useUser } from '@/hooks/useUser';
import { Text, Button } from '@/components/atoms';
import { DeleteAccountModal } from '@/components/organisms/DeleteAccountModal';
import { Colors, Spacing, Typography, BorderRadius } from '@/constants/theme';

export default function ProfileSettingsScreen() {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const { isPro } = useUser();
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // États pour les préférences (à implémenter avec persistence)
  const [notifications, setNotifications] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);

  const handleSignOut = async () => {
    Alert.alert('Déconnexion', 'Êtes-vous sûr de vouloir vous déconnecter ?', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Déconnexion',
        style: 'destructive',
        onPress: async () => {
          await signOut();
          router.replace('/(tabs)/pros');
        },
      },
    ]);
  };

  const handleDeleteAccount = () => {
    setShowDeleteModal(true);
  };

  const SettingItem = ({
    icon,
    title,
    subtitle,
    onPress,
    showArrow = true,
    rightElement,
    danger = false,
  }: {
    icon: string;
    title: string;
    subtitle?: string;
    onPress?: () => void;
    showArrow?: boolean;
    rightElement?: React.ReactNode;
    danger?: boolean;
  }) => (
    <TouchableOpacity
      style={styles.settingItem}
      onPress={() => {
        console.log('TouchableOpacity pressé pour:', title);
        if (onPress) {
          onPress();
        }
      }}
      activeOpacity={0.7}
    >
      <View style={styles.settingIcon} pointerEvents="none">
        <Ionicons
          name={icon as any}
          size={24}
          color={danger ? Colors.semantic.error : Colors.primary.accent}
        />
      </View>
      <View style={styles.settingContent} pointerEvents="none">
        <Text variant="body" color={danger ? 'error' : 'charcoal'} style={styles.settingTitle}>
          {title}
        </Text>
        {subtitle && (
          <Text variant="caption" color="gray" style={styles.settingSubtitle}>
            {subtitle}
          </Text>
        )}
      </View>
      <View pointerEvents="none">
        {rightElement ||
          (showArrow && onPress && (
            <Ionicons name="chevron-forward" size={20} color={Colors.neutral.course} />
          ))}
      </View>
    </TouchableOpacity>
  );

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Paramètres',
          headerStyle: {
            backgroundColor: Colors.neutral.background,
          },
          headerTitleStyle: {
            color: Colors.neutral.charcoal,
            fontWeight: '600',
          },
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
              <Ionicons name="arrow-back" size={24} color={Colors.neutral.charcoal} />
            </TouchableOpacity>
          ),
        }}
      />

      <SafeAreaView style={styles.container} edges={['bottom']}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {/* Section Compte */}
          <View style={styles.section}>
            <Text variant="caption" color="gray" style={styles.sectionTitle}>
              COMPTE
            </Text>
            <View style={styles.sectionContent}>
              <TouchableOpacity
                style={styles.settingItem}
                onPress={() => router.push('/profile/edit')}
                activeOpacity={0.7}
              >
                <View style={styles.settingIcon}>
                  <Ionicons name="person-outline" size={24} color={Colors.primary.accent} />
                </View>
                <View style={styles.settingContent}>
                  <Text variant="body" color="charcoal" style={styles.settingTitle}>
                    Informations personnelles
                  </Text>
                  <Text variant="caption" color="gray" style={styles.settingSubtitle}>
                    Nom, téléphone, ville, informations golf...
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={Colors.neutral.course} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Section Notifications */}
          <View style={styles.section}>
            <Text variant="caption" color="gray" style={styles.sectionTitle}>
              NOTIFICATIONS
            </Text>
            <View style={styles.sectionContent}>
              <SettingItem
                icon="notifications-outline"
                title="Notifications push"
                subtitle="Recevoir des notifications sur votre appareil"
                showArrow={false}
                rightElement={
                  <Switch
                    value={notifications}
                    onValueChange={setNotifications}
                    trackColor={{
                      false: Colors.neutral.lightGray,
                      true: Colors.primary.accent,
                    }}
                    thumbColor={notifications ? Colors.neutral.white : Colors.neutral.gray}
                  />
                }
              />
              <SettingItem
                icon="mail-outline"
                title="Notifications par email"
                subtitle="Recevoir des mises à jour par email"
                showArrow={false}
                rightElement={
                  <Switch
                    value={emailNotifications}
                    onValueChange={setEmailNotifications}
                    trackColor={{
                      false: Colors.neutral.lightGray,
                      true: Colors.primary.accent,
                    }}
                    thumbColor={emailNotifications ? Colors.neutral.white : Colors.neutral.gray}
                  />
                }
              />
            </View>
          </View>

          {/* Section Support */}
          <View style={styles.section}>
            <Text variant="caption" color="gray" style={styles.sectionTitle}>
              SUPPORT
            </Text>
            <View style={styles.sectionContent}>
              <TouchableOpacity
                style={styles.settingItem}
                onPress={() => router.push('/profile/help')}
                activeOpacity={0.7}
              >
                <View style={styles.settingIcon}>
                  <Ionicons name="help-circle-outline" size={24} color={Colors.primary.accent} />
                </View>
                <View style={styles.settingContent}>
                  <Text variant="body" color="charcoal" style={styles.settingTitle}>
                    Centre d'aide
                  </Text>
                  <Text variant="caption" color="gray" style={styles.settingSubtitle}>
                    FAQ et guides d'utilisation
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={Colors.neutral.course} />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.settingItem}
                onPress={() => router.push('/profile/contact')}
                activeOpacity={0.7}
              >
                <View style={styles.settingIcon}>
                  <Ionicons name="chatbubble-outline" size={24} color={Colors.primary.accent} />
                </View>
                <View style={styles.settingContent}>
                  <Text variant="body" color="charcoal" style={styles.settingTitle}>
                    Nous contacter
                  </Text>
                  <Text variant="caption" color="gray" style={styles.settingSubtitle}>
                    Obtenir de l'aide de notre équipe
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={Colors.neutral.course} />
              </TouchableOpacity>

              {!isPro && (
                <TouchableOpacity
                  style={styles.settingItem}
                  onPress={() => router.push('/profile/pro-status')}
                  activeOpacity={0.7}
                >
                  <View style={styles.settingIcon}>
                    <Ionicons name="star-outline" size={24} color={Colors.primary.accent} />
                  </View>
                  <View style={styles.settingContent}>
                    <Text variant="body" color="charcoal" style={styles.settingTitle}>
                      Pour les professionnels
                    </Text>
                    <Text variant="caption" color="gray" style={styles.settingSubtitle}>
                      Devenez professionnel sur Eagle
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={Colors.neutral.course} />
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={styles.settingItem}
                onPress={() => router.push('/profile/privacy')}
                activeOpacity={0.7}
              >
                <View style={styles.settingIcon}>
                  <Ionicons
                    name="shield-checkmark-outline"
                    size={24}
                    color={Colors.primary.accent}
                  />
                </View>
                <View style={styles.settingContent}>
                  <Text variant="body" color="charcoal" style={styles.settingTitle}>
                    Confidentialité
                  </Text>
                  <Text variant="caption" color="gray" style={styles.settingSubtitle}>
                    Gérer vos données personnelles
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={Colors.neutral.course} />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.settingItem}
                onPress={() => router.push('/profile/terms')}
                activeOpacity={0.7}
              >
                <View style={styles.settingIcon}>
                  <Ionicons name="document-text-outline" size={24} color={Colors.primary.accent} />
                </View>
                <View style={styles.settingContent}>
                  <Text variant="body" color="charcoal" style={styles.settingTitle}>
                    Conditions d'utilisation
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={Colors.neutral.course} />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.settingItem}
                onPress={() => router.push('/profile/about')}
                activeOpacity={0.7}
              >
                <View style={styles.settingIcon}>
                  <Ionicons
                    name="information-circle-outline"
                    size={24}
                    color={Colors.primary.accent}
                  />
                </View>
                <View style={styles.settingContent}>
                  <Text variant="body" color="charcoal" style={styles.settingTitle}>
                    À propos
                  </Text>
                  <Text variant="caption" color="gray" style={styles.settingSubtitle}>
                    Version 1.0.0
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={Colors.neutral.course} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Actions dangereuses */}
          <View style={styles.dangerSection}>
            <TouchableOpacity style={styles.dangerButton} onPress={handleSignOut}>
              <Ionicons name="log-out-outline" size={20} color={Colors.semantic.error} />
              <Text variant="body" color="error" style={styles.dangerButtonText}>
                Se déconnecter
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.dangerButton, styles.deleteButton]}
              onPress={handleDeleteAccount}
            >
              <Ionicons name="trash-outline" size={20} color={Colors.semantic.error} />
              <Text variant="body" color="error" style={styles.dangerButtonText}>
                Supprimer mon compte
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>

      {/* Modal de suppression */}
      <DeleteAccountModal visible={showDeleteModal} onClose={() => setShowDeleteModal(false)} />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.neutral.background,
  },
  headerButton: {
    paddingLeft: 16,
    paddingVertical: 8,
  },
  content: {
    paddingBottom: Spacing.xl,
  },
  section: {
    marginTop: Spacing.l,
  },
  sectionTitle: {
    marginHorizontal: Spacing.l,
    marginBottom: Spacing.s,
    fontWeight: '600',
  },
  sectionContent: {
    backgroundColor: Colors.neutral.white,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: Colors.neutral.lightGray + '50',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.m,
    paddingHorizontal: Spacing.l,
    minHeight: 60,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.neutral.lightGray + '50',
  },
  settingIcon: {
    width: 40,
    alignItems: 'center',
  },
  settingContent: {
    flex: 1,
    marginLeft: Spacing.s,
  },
  settingTitle: {
    marginBottom: 2,
  },
  settingSubtitle: {
    marginTop: 2,
  },
  dangerSection: {
    marginTop: Spacing.xl,
    paddingHorizontal: Spacing.l,
  },
  dangerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.m,
    borderWidth: 1,
    borderColor: Colors.semantic.error,
    borderRadius: 8,
    marginBottom: Spacing.m,
  },
  deleteButton: {
    backgroundColor: Colors.semantic.error + '10',
  },
  dangerButtonText: {
    marginLeft: Spacing.s,
    fontWeight: '500',
  },
});
