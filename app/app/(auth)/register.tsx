import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Keyboard,
  TouchableWithoutFeedback,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/hooks/useAuth';
import { usePublicRoute } from '@/hooks/useProtectedRoute';
import { useAuthLayout } from '@/hooks/useResponsiveLayout';
import { Text, Input, Button, EagleLogo } from '@/components/atoms';
import { VideoBackground } from '@/components/organisms';
import { Colors, Spacing, Typography } from '@/constants/theme';
import { UniversalAlert } from '@/utils/alert';
import { validateEmailWithError, validateNameWithError, sanitizeEmail, sanitizeName } from '@/utils/validation';
import { AUTH_ERROR_CODES, detectErrorCode, getErrorMessage } from '@/constants/errorCodes';

export default function RegisterScreen() {
  const router = useRouter();
  const { signUp } = useAuth();
  const { formMaxHeight } = useAuthLayout();

  // Rediriger si déjà connecté
  usePublicRoute({ redirectTo: '/(tabs)' });

  // États du formulaire
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Validation du formulaire avec utils centralisés
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Validation prénom
    const firstNameValidation = validateNameWithError(firstName, 'Le prénom');
    if (!firstNameValidation.valid) {
      newErrors.firstName = firstNameValidation.error!;
    }

    // Validation nom
    const lastNameValidation = validateNameWithError(lastName, 'Le nom');
    if (!lastNameValidation.valid) {
      newErrors.lastName = lastNameValidation.error!;
    }

    // Validation email
    const emailValidation = validateEmailWithError(email);
    if (!emailValidation.valid) {
      newErrors.email = emailValidation.error!;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Gestion de l'inscription avec error codes
  const handleRegister = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      // Nettoyer les données avant envoi
      const cleanEmail = sanitizeEmail(email);
      const cleanFirstName = sanitizeName(firstName);
      const cleanLastName = sanitizeName(lastName);

      await signUp(cleanEmail, {
        firstName: cleanFirstName,
        lastName: cleanLastName,
        userType: 'amateur',
      });

      // Rediriger vers l'écran de vérification OTP
      router.push({
        pathname: '/(auth)/verify-otp',
        params: {
          email: cleanEmail,
          firstName: cleanFirstName,
          lastName: cleanLastName,
        },
      });
    } catch (error: any) {
      // Gestion des erreurs avec codes constants
      console.error('Erreur inscription:', error);

      const errorCode = detectErrorCode(error);
      const errorMessage = getErrorMessage(errorCode);

      // Actions spécifiques selon le type d'erreur
      if (errorCode === AUTH_ERROR_CODES.EMAIL_ALREADY_EXISTS) {
        UniversalAlert.show(
          'Email déjà utilisé',
          errorMessage,
          [
            { text: 'Se connecter', onPress: () => router.replace('/login') },
            { text: 'OK', style: 'cancel' },
          ]
        );
      } else if (errorCode === AUTH_ERROR_CODES.RATE_LIMIT_EXCEEDED) {
        UniversalAlert.error('Limite atteinte', errorMessage);
      } else {
        UniversalAlert.error('Erreur', errorMessage);
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
      <View style={{ flex: 1 }}>
        {/* Vidéo de fond avec gradient optimisé */}
        <VideoBackground showGradient showSkeleton skeletonType="register" />

        <SafeAreaView style={styles.container}>
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
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
              <Text variant="caption" style={[styles.subtitle, { color: Colors.neutral.white }]}>
                Rejoignez la communauté Eagle Golf
              </Text>
            </View>

            {/* Form Zone */}
            <View style={[styles.formZone, { maxHeight: formMaxHeight }]}>
              <View style={styles.row}>
                <View style={styles.halfInput}>
                  <Input
                    value={firstName}
                    onChangeText={setFirstName}
                    placeholder="Votre prénom"
                    {...(errors.firstName ? { error: errors.firstName } : {})}
                    autoCapitalize="words"
                  />
                </View>
                <View style={styles.halfInput}>
                  <Input
                    value={lastName}
                    onChangeText={setLastName}
                    placeholder="Votre nom"
                    {...(errors.lastName ? { error: errors.lastName } : {})}
                    autoCapitalize="words"
                  />
                </View>
              </View>

              <Input
                value={email}
                onChangeText={setEmail}
                placeholder="Votre email"
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
                <Text style={[styles.dividerText, { color: Colors.neutral.white }]}>OU</Text>
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

              <Text variant="caption" style={[styles.helpText, { color: Colors.neutral.white }]}>
                J'ai déjà un compte Eagle Golf
              </Text>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </SafeAreaView>
    </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.l,
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
    // maxHeight dynamique géré par useAuthLayout hook
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
