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
                {...(errors.email && { error: errors.email })}
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
        </TouchableWithoutFeedback>
      </SafeAreaView>
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
    maxHeight: 200,
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
