import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Keyboard,
} from 'react-native';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/hooks/useAuth';
import { usePublicRoute } from '@/hooks/useProtectedRoute';
import { Text, Input, Button, EagleLogo } from '@/components/atoms';
import { Colors, Spacing, Typography } from '@/constants/theme';

export default function LoginScreen() {
  const router = useRouter();
  const { returnTo } = useLocalSearchParams();
  const { signIn } = useAuth();

  // Rediriger si déjà connecté
  usePublicRoute({ redirectTo: (returnTo as string) || '/(tabs)' });

  const [email, setEmail] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!email.trim()) {
      newErrors.email = "L'email est requis";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Email invalide';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      await signIn(email);

      // Rediriger vers l'écran de vérification OTP
      router.push({
        pathname: '/(auth)/verify-otp',
        params: {
          email,
        },
      });
    } catch (error) {
      // L'erreur est déjà gérée dans le hook
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
              Connexion
            </Text>
            <Text variant="caption" style={[styles.subtitle, { color: Colors.neutral.course }]}>
              Un code sera envoyé par email
            </Text>
          </View>

          {/* Form Zone */}
          <View style={styles.formZone}>
            <Input
              label="Email"
              value={email}
              onChangeText={setEmail}
              placeholder="john.doe@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
              autoFocus={true} // Auto-focus sur web pour une meilleure UX
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
              <Text style={styles.dividerText}>OU</Text>
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

            <Text variant="caption" style={styles.helpText}>
              Inscription rapide avec un simple email
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
    paddingBottom: Spacing.xl,
  },
  backButton: {
    position: 'absolute',
    left: 0,
    top: Spacing.xl,
    padding: Spacing.s,
    zIndex: 1,
  },
  title: {
    marginTop: Spacing.m,
    textAlign: 'center',
  },
  subtitle: {
    marginTop: Spacing.xs,
    textAlign: 'center',
  },
  formZone: {
    flex: 1,
    justifyContent: 'center',
    paddingVertical: Spacing.xl,
  },
  submitButton: {
    marginTop: Spacing.l,
  },
  footerZone: {
    paddingBottom: Spacing.xl,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: Spacing.l,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.neutral.mist,
  },
  dividerText: {
    paddingHorizontal: Spacing.m,
    fontFamily: Typography.fontFamily.primary,
    fontSize: Typography.fontSize.caption,
    color: Colors.neutral.course,
  },
  secondaryButton: {
    marginBottom: Spacing.m,
  },
  helpText: {
    textAlign: 'center',
    color: Colors.neutral.course,
  },
});