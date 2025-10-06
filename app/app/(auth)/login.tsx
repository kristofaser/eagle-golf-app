import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Keyboard,
  TouchableWithoutFeedback,
} from 'react-native';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/hooks/useAuth';
import { usePublicRoute } from '@/hooks/useProtectedRoute';
import { useAuthLayout } from '@/hooks/useResponsiveLayout';
import { Text, Input, Button, EagleLogo } from '@/components/atoms';
import { VideoBackground } from '@/components/organisms';
import { Colors, Spacing, Typography } from '@/constants/theme';
import { validateEmailWithError, sanitizeEmail } from '@/utils/validation';
import { detectErrorCode, getErrorMessage } from '@/constants/errorCodes';

export default function LoginScreen() {
  const router = useRouter();
  const { returnTo } = useLocalSearchParams();
  const { signIn } = useAuth();
  const { formMaxHeight } = useAuthLayout();

  // Rediriger si déjà connecté
  usePublicRoute({ redirectTo: (returnTo as string) || '/(tabs)' });

  const [email, setEmail] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  // Validation avec utils centralisés
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    const emailValidation = validateEmailWithError(email);
    if (!emailValidation.valid) {
      newErrors.email = emailValidation.error!;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const cleanEmail = sanitizeEmail(email);
      await signIn(cleanEmail);

      // Rediriger vers l'écran de vérification OTP
      router.push({
        pathname: '/(auth)/verify-otp',
        params: {
          email: cleanEmail,
        },
      });
    } catch (error: any) {
      // Gestion des erreurs avec codes constants
      console.error('Erreur connexion:', error);

      const errorCode = detectErrorCode(error);
      const errorMessage = getErrorMessage(errorCode);

      // Afficher l'erreur à l'utilisateur
      // Note: UniversalAlert non importé ici, l'erreur sera gérée dans le hook
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
        <VideoBackground showGradient showSkeleton skeletonType="login" />

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
                Connexion
              </Text>
              <Text variant="caption" style={[styles.subtitle, { color: Colors.neutral.white }]}>
                Un code sera envoyé par email
              </Text>
            </View>

            {/* Form Zone */}
            <View style={[styles.formZone, { maxHeight: formMaxHeight }]}>
              <Input
                value={email}
                onChangeText={setEmail}
                placeholder="Votre email"
                keyboardType="email-address"
                autoCapitalize="none"
                {...(errors.email ? { error: errors.email } : {})}
              />

              <Button
                onPress={handleLogin}
                variant="primary"
                size="large"
                style={styles.submitButton}
                disabled={isLoading}
                loading={isLoading}
              >
                Se connecter
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
                onPress={() => router.replace('/(auth)/register')}
                style={styles.secondaryButton}
              >
                Créer un compte
              </Button>

              <Text variant="caption" style={[styles.helpText, { color: Colors.neutral.white }]}>
                Inscription rapide avec un simple email
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
    marginBottom: Spacing.xl,
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
    textAlign: 'center',
  },
  formZone: {
    flex: 1,
    justifyContent: 'center',
    // maxHeight dynamique géré par useAuthLayout hook
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
