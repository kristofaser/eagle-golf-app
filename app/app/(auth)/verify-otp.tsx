import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  TextInput,
  Alert,
  Vibration,
} from 'react-native';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/hooks/useAuth';
import { Text, Button, EagleLogo } from '@/components/atoms';
import { Colors, Spacing, Typography } from '@/constants/theme';

export default function VerifyOtpScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { verifyOtp, resendOtp } = useAuth();

  // Récupérer les paramètres passés depuis register ou login
  const email = params.email as string;
  const firstName = params.firstName as string;
  const lastName = params.lastName as string;

  // États
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [timer, setTimer] = useState(60); // 60 secondes avant de pouvoir renvoyer
  const [canResend, setCanResend] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [error, setError] = useState('');

  // Références pour les inputs
  const inputRefs = useRef<(TextInput | null)[]>([]);

  // Timer pour le bouton de renvoi
  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(interval);
    } else {
      setCanResend(true);
    }
    return undefined;
  }, [timer]);

  // Auto-submit quand le code est complet
  useEffect(() => {
    const fullCode = code.join('');
    if (fullCode.length === 6) {
      handleVerifyOtp();
    }
  }, [code]);

  // Gestion de la saisie du code
  const handleCodeChange = (value: string, index: number) => {
    // Ne garder que les chiffres
    const digit = value.replace(/[^0-9]/g, '').slice(-1);

    const newCode = [...code];
    newCode[index] = digit;
    setCode(newCode);
    setError(''); // Effacer l'erreur lors de la saisie

    // Auto-focus sur le prochain input
    if (digit && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  // Gestion du retour arrière
  const handleKeyPress = (key: string, index: number) => {
    if (key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  // Gestion du collage
  const handlePaste = (pastedText: string) => {
    const digits = pastedText.replace(/[^0-9]/g, '').slice(0, 6);
    if (digits.length === 6) {
      const newCode = digits.split('');
      setCode(newCode);
    }
  };

  // Vérifier le code OTP
  const handleVerifyOtp = async () => {
    const fullCode = code.join('');

    if (fullCode.length !== 6) {
      setError('Veuillez entrer le code complet');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // Vérifier le code OTP
      await verifyOtp(email, fullCode, 'email');

      // Succès - rediriger vers l'app
      router.replace('/(tabs)');
    } catch (error: any) {
      setAttempts((prev) => prev + 1);

      // Vibration sur erreur (mobile uniquement)
      if (Platform.OS !== 'web') {
        Vibration.vibrate(200);
      }

      // Gestion des erreurs spécifiques
      if (error.message?.includes('expired')) {
        setError('Code expiré. Demandez un nouveau code.');
      } else if (error.message?.includes('Invalid')) {
        setError('Code incorrect. Vérifiez et réessayez.');
      } else if (attempts >= 2) {
        setError('Trop de tentatives. Demandez un nouveau code.');
      } else {
        setError('Code incorrect. Vérifiez votre email.');
      }

      // Effacer le code après erreur
      setCode(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setIsLoading(false);
    }
  };

  // Renvoyer le code
  const handleResendCode = async () => {
    if (!canResend) return;

    setIsLoading(true);
    try {
      await resendOtp(email); // Renvoyer un nouveau code OTP

      // Réinitialiser le timer
      setTimer(60);
      setCanResend(false);
      setAttempts(0);
      setError('');
      setCode(['', '', '', '', '', '']);

      Alert.alert('Code envoyé', 'Un nouveau code a été envoyé à votre email');
      inputRefs.current[0]?.focus();
    } catch (error: any) {
      Alert.alert('Erreur', 'Impossible de renvoyer le code. Réessayez plus tard.');
    } finally {
      setIsLoading(false);
    }
  };

  // Changer d'email
  const handleChangeEmail = () => {
    Alert.alert(
      "Changer d'email",
      "Voulez-vous recommencer l'inscription avec une autre adresse email ?",
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Oui',
          onPress: () => router.back(),
        },
      ]
    );
  };

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Header */}
            <View style={styles.header}>
              <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                <Ionicons name="arrow-back" size={24} color={Colors.primary.navy} />
              </TouchableOpacity>
              <EagleLogo size={80} animated animationType="pulse" />
              <Text variant="h2" style={[styles.title, { color: Colors.primary.navy }]}>
                Vérifiez votre email
              </Text>
              <Text variant="body" style={[styles.subtitle, { color: Colors.neutral.course }]}>
                Un code à 6 chiffres a été envoyé à
              </Text>
              <Text
                variant="body"
                style={[styles.email, { color: Colors.primary.navy, fontWeight: '600' }]}
              >
                {email}
              </Text>
            </View>

            {/* Code Input */}
            <View style={styles.codeContainer}>
              <Text variant="caption" color="gray" style={styles.codeLabel}>
                Entrez le code à 6 chiffres
              </Text>

              <View style={styles.codeInputs}>
                {code.map((digit, index) => (
                  <TextInput
                    key={index}
                    ref={(ref) => {
                      inputRefs.current[index] = ref;
                    }}
                    style={[
                      styles.codeInput,
                      digit ? styles.codeInputFilled : {},
                      error ? styles.codeInputError : {},
                    ]}
                    value={digit}
                    onChangeText={(value) => handleCodeChange(value, index)}
                    onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, index)}
                    keyboardType="number-pad"
                    maxLength={1}
                    selectTextOnFocus
                    autoComplete={Platform.OS === 'ios' ? 'one-time-code' : 'off'}
                    textContentType={index === 0 ? 'oneTimeCode' : 'none'}
                    onPaste={(e: any) => {
                      if (index === 0) {
                        e.preventDefault();
                        const pastedText = e.nativeEvent?.clipboardData?.getData('text') || '';
                        handlePaste(pastedText);
                      }
                    }}
                    editable={!isLoading}
                  />
                ))}
              </View>

              {/* Erreur */}
              {error && (
                <Text variant="caption" color="error" style={styles.errorText}>
                  {error}
                </Text>
              )}
            </View>

            {/* Actions */}
            <View style={styles.actions}>
              {/* Timer ou bouton de renvoi */}
              <TouchableOpacity
                style={[styles.resendButton, !canResend && styles.resendButtonDisabled]}
                onPress={handleResendCode}
                disabled={!canResend || isLoading}
              >
                <Text
                  variant="body"
                  style={[
                    styles.resendText,
                    { color: canResend ? Colors.primary.electric : Colors.neutral.course },
                  ]}
                >
                  {canResend ? 'Renvoyer le code' : `Renvoyer dans ${timer}s`}
                </Text>
              </TouchableOpacity>

              {/* Changer d'email */}
              <TouchableOpacity onPress={handleChangeEmail} disabled={isLoading}>
                <Text
                  variant="body"
                  style={[styles.changeEmailText, { color: Colors.neutral.course }]}
                >
                  Changer d'email
                </Text>
              </TouchableOpacity>
            </View>

            {/* Bouton de vérification manuel (au cas où l'auto-submit ne fonctionne pas) */}
            {code.join('').length === 6 && (
              <Button
                onPress={handleVerifyOtp}
                variant="primary"
                size="large"
                style={styles.verifyButton}
                loading={isLoading}
                disabled={isLoading}
              >
                Vérifier le code
              </Button>
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.neutral.cloud,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: Spacing.l,
    paddingBottom: Spacing.xl,
  },
  header: {
    alignItems: 'center',
    marginTop: Spacing.xl,
    marginBottom: Spacing.xl,
  },
  backButton: {
    position: 'absolute',
    left: 0,
    top: 0,
    padding: Spacing.m,
    zIndex: 1,
  },
  title: {
    marginTop: Spacing.m,
  },
  subtitle: {
    marginTop: Spacing.xs,
    textAlign: 'center',
  },
  email: {
    marginTop: Spacing.xs,
    fontWeight: '600',
  },
  codeContainer: {
    marginTop: Spacing.xl,
    marginBottom: Spacing.xl,
  },
  codeLabel: {
    textAlign: 'center',
    marginBottom: Spacing.m,
  },
  codeInputs: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.s,
  },
  codeInput: {
    width: 50,
    height: 60,
    borderWidth: 2,
    borderColor: Colors.neutral.mist,
    borderRadius: 12,
    fontSize: 24,
    textAlign: 'center',
    backgroundColor: Colors.neutral.white,
    color: Colors.primary.navy,
  },
  codeInputFilled: {
    borderColor: Colors.primary.electric,
    backgroundColor: Colors.primary.lightBlue,
  },
  codeInputError: {
    borderColor: Colors.semantic.error,
    backgroundColor: Colors.semantic.error + '10',
  },
  errorText: {
    textAlign: 'center',
    marginTop: Spacing.s,
  },
  actions: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  resendButton: {
    padding: Spacing.m,
  },
  resendButtonDisabled: {
    opacity: 0.5,
  },
  resendText: {
    textDecorationLine: 'underline',
  },
  changeEmailText: {
    marginTop: Spacing.m,
    textDecorationLine: 'underline',
  },
  verifyButton: {
    marginTop: Spacing.l,
  },
});
