import React from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity, Alert, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text, Button, Avatar } from '@/components/atoms';
import { Colors, Spacing, BorderRadius, Typography } from '@/constants/theme';
import { commonStyles } from '@/utils/commonStyles';
import { useAuth } from '@/hooks/useAuth';
import { useUser } from '@/hooks/useUser';
import { HugeiconsIcon } from '@hugeicons/react-native';
import {
  User02Icon,
  UserCircle02Icon,
  Settings01Icon,
  Award01Icon,
  HelpCircleIcon,
  InformationCircleIcon,
  Logout01Icon,
  ChevronRightIcon,
  Camera01Icon,
  Edit02Icon,
} from '@hugeicons/core-free-icons';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const { profile, fullName } = useUser();

  // Debug: Vérifier si les icônes sont correctement importées
  React.useEffect(() => {
    console.log('Icons check:', {
      User02Icon: typeof User02Icon,
      UserCircle02Icon: typeof UserCircle02Icon,
      Settings01Icon: typeof Settings01Icon,
      isArray: Array.isArray(User02Icon),
    });
  }, []);

  // Si non connecté, afficher l'écran de connexion
  if (!user) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.notConnectedContainer}>
          <View style={styles.illustrationContainer}>
            {UserCircle02Icon && (
              <HugeiconsIcon icon={UserCircle02Icon} size={120} color={Colors.neutral.mist} />
            )}
          </View>

          <Text variant="h2" color="charcoal" style={styles.notConnectedTitle}>
            Bienvenue sur Eagle
          </Text>

          <Text variant="body" color="iron" style={styles.notConnectedText}>
            Connectez-vous pour accéder à votre profil et profiter de toutes les fonctionnalités
          </Text>

          <View style={styles.authButtons}>
            <Button
              variant="primary"
              size="large"
              onPress={() => router.push('/(auth)/login')}
              style={styles.authButton}
            >
              Se connecter
            </Button>

            <Button
              variant="outline"
              size="large"
              onPress={() => router.push('/(auth)/register')}
              style={styles.authButton}
            >
              Créer un compte
            </Button>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // Menu items pour utilisateur connecté
  const handleEditProfile = () => router.push('/profile/edit');
  const handleSettings = () => router.push('/profile/settings');
  const handleBecomePro = () => router.push('/become-pro');
  const handleHelp = () => Alert.alert('Aide', 'Section aide à venir');
  const handleAbout = () => Alert.alert('À propos', 'Eagle v1.0.0\n© 2025 Eagle Golf');

  const handleSignOut = () => {
    Alert.alert('Déconnexion', 'Êtes-vous sûr de vouloir vous déconnecter ?', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Déconnexion',
        style: 'destructive',
        onPress: async () => {
          await signOut();
          router.replace('/(auth)/login');
        },
      },
    ]);
  };

  const MenuItem = ({
    icon,
    title,
    subtitle,
    onPress,
    color = Colors.neutral.charcoal,
    showBadge = false,
  }: any) => (
    <TouchableOpacity style={styles.menuItem} onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.menuIconContainer, { backgroundColor: color + '15' }]}>
        {icon && <HugeiconsIcon icon={icon} size={22} color={color} />}
      </View>
      <View style={styles.menuContent}>
        <Text variant="body" color="charcoal" weight="medium">
          {title}
        </Text>
        {subtitle && (
          <Text variant="caption" color="iron" style={styles.menuSubtitle}>
            {subtitle}
          </Text>
        )}
      </View>
      {showBadge && (
        <View style={styles.badge}>
          <Text variant="caption" color="ball" weight="bold">
            PRO
          </Text>
        </View>
      )}
      {ChevronRightIcon && (
        <HugeiconsIcon icon={ChevronRightIcon} size={20} color={Colors.neutral.iron} />
      )}
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header Profil */}
      <View style={styles.header}>
        <View style={styles.profileSection}>
          <TouchableOpacity style={styles.avatarContainer} onPress={handleEditProfile}>
            {profile?.avatar_url ? (
              <Image source={{ uri: profile.avatar_url }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                {User02Icon && (
                  <HugeiconsIcon icon={User02Icon} size={40} color={Colors.neutral.ball} />
                )}
              </View>
            )}
            <View style={styles.editBadge}>
              {Camera01Icon && (
                <HugeiconsIcon icon={Camera01Icon} size={16} color={Colors.neutral.ball} />
              )}
            </View>
          </TouchableOpacity>

          <View style={styles.profileInfo}>
            <Text variant="h2" color="charcoal" weight="bold">
              {fullName || 'Utilisateur'}
            </Text>
            <Text variant="body" color="iron">
              {user.email}
            </Text>
            {profile?.user_type === 'pro' && (
              <View style={styles.proTag}>
                <Text variant="caption" color="ball" weight="bold">
                  PROFESSIONNEL
                </Text>
              </View>
            )}
          </View>
        </View>

        <TouchableOpacity style={styles.editButton} onPress={handleEditProfile}>
          {Edit02Icon && (
            <HugeiconsIcon icon={Edit02Icon} size={18} color={Colors.primary.accent} />
          )}
          <Text variant="body" color="primary" weight="medium">
            Modifier
          </Text>
        </TouchableOpacity>
      </View>

      {/* Quick Stats */}
      {profile?.user_type === 'pro' && (
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text variant="h3" color="charcoal" weight="bold">
              12
            </Text>
            <Text variant="caption" color="iron">
              Réservations
            </Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text variant="h3" color="charcoal" weight="bold">
              4.8
            </Text>
            <Text variant="caption" color="iron">
              Note moyenne
            </Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text variant="h3" color="charcoal" weight="bold">
              98%
            </Text>
            <Text variant="caption" color="iron">
              Satisfaction
            </Text>
          </View>
        </View>
      )}

      {/* Menu Sections */}
      <View style={styles.menuSection}>
        <Text variant="caption" color="iron" style={styles.sectionTitle}>
          MON COMPTE
        </Text>

        <MenuItem
          icon={User02Icon}
          title="Modifier mon profil"
          subtitle="Nom, photo, informations"
          onPress={handleEditProfile}
          color={Colors.primary.accent}
        />

        <MenuItem
          icon={Settings01Icon}
          title="Paramètres"
          subtitle="Notifications, confidentialité"
          onPress={handleSettings}
          color={Colors.neutral.charcoal}
        />

        {profile?.user_type !== 'pro' && (
          <MenuItem
            icon={Award01Icon}
            title="Devenir Pro"
            subtitle="Donnez des cours et gagnez de l'argent"
            onPress={handleBecomePro}
            color={Colors.semantic.success}
            showBadge={true}
          />
        )}
      </View>

      <View style={styles.menuSection}>
        <Text variant="caption" color="iron" style={styles.sectionTitle}>
          SUPPORT
        </Text>

        <MenuItem
          icon={HelpCircleIcon}
          title="Aide et FAQ"
          subtitle="Trouvez des réponses à vos questions"
          onPress={handleHelp}
          color={Colors.primary.accent}
        />

        <MenuItem
          icon={InformationCircleIcon}
          title="À propos"
          subtitle="Version et informations légales"
          onPress={handleAbout}
          color={Colors.neutral.charcoal}
        />
      </View>

      {/* Logout Button */}
      <TouchableOpacity style={styles.logoutButton} onPress={handleSignOut}>
        {Logout01Icon && (
          <HugeiconsIcon icon={Logout01Icon} size={20} color={Colors.semantic.error} />
        )}
        <Text variant="body" style={{ color: Colors.semantic.error }} weight="medium">
          Déconnexion
        </Text>
      </TouchableOpacity>

      {/* Footer */}
      <View style={styles.footer}>
        <Text variant="caption" color="iron" style={{ textAlign: 'center' }}>
          Eagle Golf © 2025{'\n'}Version 1.0.0
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.neutral.background,
  },

  // Not connected state
  notConnectedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
  },
  illustrationContainer: {
    marginBottom: Spacing.xl,
  },
  notConnectedTitle: {
    textAlign: 'center',
    marginBottom: Spacing.m,
  },
  notConnectedText: {
    textAlign: 'center',
    marginBottom: Spacing.xl,
    lineHeight: 22,
  },
  authButtons: {
    width: '100%',
    gap: Spacing.m,
  },
  authButton: {
    width: '100%',
  },

  // Connected state - Header
  header: {
    backgroundColor: Colors.neutral.ball,
    paddingHorizontal: Spacing.l,
    paddingVertical: Spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral.mist,
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.m,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: Spacing.m,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.neutral.mist,
  },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primary.accent + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  editBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.primary.accent,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.neutral.ball,
  },
  profileInfo: {
    flex: 1,
  },
  proTag: {
    backgroundColor: Colors.primary.accent,
    paddingHorizontal: Spacing.s,
    paddingVertical: Spacing.xxs,
    borderRadius: BorderRadius.small,
    alignSelf: 'flex-start',
    marginTop: Spacing.xs,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.m,
    borderRadius: BorderRadius.medium,
    borderWidth: 1,
    borderColor: Colors.primary.accent,
  },

  // Stats
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.neutral.ball,
    marginHorizontal: Spacing.l,
    marginTop: Spacing.m,
    padding: Spacing.m,
    borderRadius: BorderRadius.medium,
    borderWidth: 1,
    borderColor: Colors.neutral.mist,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    backgroundColor: Colors.neutral.mist,
    marginVertical: Spacing.xs,
  },

  // Menu
  menuSection: {
    marginTop: Spacing.l,
    paddingHorizontal: Spacing.l,
  },
  sectionTitle: {
    marginBottom: Spacing.s,
    letterSpacing: 1,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.neutral.ball,
    padding: Spacing.m,
    borderRadius: BorderRadius.medium,
    marginBottom: Spacing.s,
  },
  menuIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.m,
  },
  menuContent: {
    flex: 1,
  },
  menuSubtitle: {
    marginTop: 2,
  },
  badge: {
    backgroundColor: Colors.semantic.success,
    paddingHorizontal: Spacing.xs,
    paddingVertical: 2,
    borderRadius: BorderRadius.small,
    marginRight: Spacing.xs,
  },

  // Logout
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.s,
    marginTop: Spacing.xl,
    marginHorizontal: Spacing.l,
    paddingVertical: Spacing.m,
    borderRadius: BorderRadius.medium,
    borderWidth: 1,
    borderColor: Colors.semantic.error + '30',
    backgroundColor: Colors.semantic.error + '10',
  },

  // Footer
  footer: {
    paddingVertical: Spacing.xl,
    paddingBottom: Spacing.xxxl,
  },
});
