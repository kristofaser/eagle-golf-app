import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Keyboard,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/hooks/useAuth';
import { usePublicRoute } from '@/hooks/useProtectedRoute';
import { Text, Input, Button, EagleLogo } from '@/components/atoms';
import { Colors, Spacing, Typography } from '@/constants/theme';
import { UniversalAlert } from '@/utils/alert';

export default function RegisterScreen() {
  const router = useRouter();
  const { signUp } = useAuth();

  // Rediriger si déjà connecté
  usePublicRoute({ redirectTo: '/(tabs)' });

  // États du formulaire
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Validation du formulaire
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!firstName.trim()) {
      newErrors.firstName = 'Le prénom est requis';
    }
    if (!lastName.trim()) {
      newErrors.lastName = 'Le nom est requis';
    }
    if (!email.trim()) {
      newErrors.email = "L'email est requis";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Email invalide';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Gestion de l'inscription
  const handleRegister = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      await signUp(email, {
        firstName,
        lastName,
        userType: 'amateur', // Par défaut, tous les utilisateurs sont des amateurs
      });

      // Rediriger vers l'écran de vérification OTP
      router.push({
        pathname: '/(auth)/verify-otp',
        params: {
          email,
          firstName,
          lastName,
        },
      });
    } catch (error: any) {
      // Gestion des erreurs spécifiques avec messages clairs
      console.error('Erreur inscription:', error);

      if (error.message?.includes('Trop de tentatives')) {
        UniversalAlert.error(
          'Limite atteinte',
          "Vous avez effectué trop de tentatives d'inscription. Veuillez patienter quelques minutes avant de réessayer."
        );
      } else if (error.message?.includes('déjà utilisée')) {
        UniversalAlert.show(
          'Email déjà utilisé',
          'Cette adresse email est déjà associée à un compte. Essayez de vous connecter ou utilisez une autre adresse.',
          [
            { text: 'Se connecter', onPress: () => router.replace('/login') },
            { text: 'OK', style: 'cancel' },
          ]
        );
      } else {
        UniversalAlert.error('Erreur', error.message || "Une erreur est survenue lors de l'inscription");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />
      {/* Utilisation de View au lieu de SafeAreaView pour le web */}
      <View style={styles.container}>
        {/* Pas de TouchableWithoutFeedback sur le web - pas nécessaire pour fermer le clavier */}
        <View style={styles.content}>
          {/* Header Zone */}
          <View style={styles.headerZone}>
            <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={24} color={Colors.primary.navy} />
            </TouchableOpacity>
            <EagleLogo size={80} animated animationType="entrance" />
            <Text variant="h2" style={[styles.title, { color: Colors.primary.navy }]}>
              Créer un compte
            </Text>
            <Text variant="caption" style={[styles.subtitle, { color: Colors.neutral.course }]}>
              Rejoignez la communauté Eagle Golf
            </Text>
          </View>

          {/* Form Zone */}
          <View style={styles.formZone}>
            <View style={styles.row}>
              <View style={styles.halfInput}>
                <Input
                  label="Prénom"
                  value={firstName}
                  onChangeText={setFirstName}
                  placeholder="John"
                  {...(errors.firstName ? { error: errors.firstName } : {})}
                  autoCapitalize="words"
                  autoFocus={true} // Auto-focus sur web pour une meilleure UX
                />
              </View>
              <View style={styles.halfInput}>
                <Input
                  label="Nom"
                  value={lastName}
                  onChangeText={setLastName}
                  placeholder="Doe"
                  {...(errors.lastName ? { error: errors.lastName } : {})}
                  autoCapitalize="words"
                />
              </View>
            </View>

            <Input
              label="Email"
              value={email}
              onChangeText={setEmail}
              placeholder="john.doe@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
              {...(errors.email ? { error: errors.email } : {})}
            />

            <Button
              onPress={handleRegister}
              variant="primary"
              size="large"
              style={styles.submitButton}
              disabled={isLoading}
              loading={isLoading}
            >
              S'inscrire
            </Button>
          </View>

          {/* Footer Zone */}
          <View style={styles.footerZone}>
            <View style={styles.dividerContainer}>
              <View style={styles.divider} />
              <Text style={styles.dividerText}>OU</Text>
              <View style={styles.divider} />
            </View>

            <Button
              variant="secondary"
              size="large"
              onPress={() => router.replace('/(auth)/login')}
              style={styles.secondaryButton}
            >
              Me connecter
            </Button>

            <Text variant="caption" style={styles.helpText}>
              J'ai déjà un compte Eagle Golf
            </Text>
          </View>
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.neutral.cloud,
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.l,
    maxWidth: 500, // Limiter la largeur sur grand écran web
    width: '100%',
    alignSelf: 'center', // Centrer sur grand écran
  },
  headerZone: {
    alignItems: 'center',
    paddingTop: Spacing.xl,
    marginBottom: Spacing.l,
  },
  backButton: {
    position: 'absolute',
    left: -Spacing.l,
    top: 0,
    padding: Spacing.m,
    zIndex: 1,
  },
  title: {
    marginTop: Spacing.s,
  },
  subtitle: {
    marginTop: Spacing.xs,
  },
  formZone: {
    flex: 1,
    justifyContent: 'center',
    maxHeight: 280,
  },
  row: {
    flexDirection: 'row',
    gap: Spacing.s,
  },
  halfInput: {
    flex: 1,
  },
  submitButton: {
    marginTop: Spacing.l,
  },
  footerZone: {
    paddingBottom: Spacing.xl,
    marginTop: 'auto',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.m,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.neutral.mist,
  },
  dividerText: {
    marginHorizontal: Spacing.m,
    color: Colors.neutral.course,
    fontSize: Typography.fontSize.caption,
    fontWeight: Typography.fontWeight.medium,
  },
  secondaryButton: {
    marginBottom: Spacing.s,
  },
  helpText: {
    textAlign: 'center',
    color: Colors.neutral.course,
    fontSize: Typography.fontSize.caption,
  },
});