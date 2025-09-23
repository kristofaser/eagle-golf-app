import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { siretValidationService } from '@/services/siret-validation.service';
import { Colors, Spacing, Typography, BorderRadius } from '@/constants/theme';

/**
 * Composant de test pour la validation SIRET
 * À utiliser temporairement pour tester le service
 */
export function SiretTestComponent() {
  const [siret, setSiret] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const testSiret = async () => {
    if (!siret.trim()) {
      Alert.alert('Erreur', 'Veuillez saisir un numéro SIRET');
      return;
    }

    setIsLoading(true);
    setResult(null);

    try {
      console.log('🔍 Test validation SIRET:', siret);
      const response = await siretValidationService.validateSiret(siret.trim());

      console.log('📋 Résultat:', response);
      setResult(response.data);

      // Affichage dans une alerte pour le test
      if (response.data?.isValid) {
        const message = [
          `✅ SIRET valide`,
          response.data.companyName && `🏢 ${response.data.companyName}`,
          response.data.address && `📍 ${response.data.address}`,
          response.data.isActive !== undefined &&
            `📊 ${response.data.isActive ? 'Actif' : 'Fermé'}`,
          response.data.error && `⚠️ ${response.data.error}`,
        ]
          .filter(Boolean)
          .join('\n');

        Alert.alert('SIRET Valide', message);
      } else {
        Alert.alert('SIRET Invalide', response.data?.error || 'Erreur inconnue');
      }
    } catch (error: any) {
      console.error('💥 Erreur test SIRET:', error);
      Alert.alert('Erreur', `Erreur lors du test: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const testPresetSirets = async () => {
    const testCases = [
      { name: 'SNCF Connect', siret: '55208426800039' },
      { name: 'Format invalide', siret: '123456789' },
      { name: 'Inexistant', siret: '12345678901234' },
    ];

    for (const testCase of testCases) {
      setSiret(testCase.siret);
      await new Promise((resolve) => setTimeout(resolve, 100)); // Petit délai visuel
      console.log(`🧪 Test automatique: ${testCase.name}`);

      const response = await siretValidationService.validateSiret(testCase.siret);
      console.log(`📋 ${testCase.name}:`, response.data?.isValid ? '✅ Valide' : '❌ Invalide');

      await new Promise((resolve) => setTimeout(resolve, 1000)); // Délai entre tests
    }

    Alert.alert('Tests automatiques', 'Tests terminés ! Voir la console pour les résultats.');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🧪 Test Validation SIRET</Text>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Numéro SIRET (14 chiffres) :</Text>
        <TextInput
          style={styles.input}
          value={siret}
          onChangeText={setSiret}
          placeholder="55208426800039"
          keyboardType="numeric"
          maxLength={14}
        />
      </View>

      <TouchableOpacity
        style={[styles.button, isLoading && styles.buttonDisabled]}
        onPress={testSiret}
        disabled={isLoading}
      >
        <Text style={styles.buttonText}>{isLoading ? '⏳ Validation...' : '🔍 Valider SIRET'}</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, styles.buttonSecondary]}
        onPress={testPresetSirets}
        disabled={isLoading}
      >
        <Text style={styles.buttonTextSecondary}>🧪 Tests automatiques</Text>
      </TouchableOpacity>

      {result && (
        <View style={styles.resultContainer}>
          <Text style={styles.resultTitle}>Résultat :</Text>

          <View
            style={[styles.resultCard, result.isValid ? styles.resultValid : styles.resultInvalid]}
          >
            <Text style={styles.resultStatus}>{result.isValid ? '✅ VALIDE' : '❌ INVALIDE'}</Text>

            {result.companyName && <Text style={styles.resultDetail}>🏢 {result.companyName}</Text>}

            {result.address && <Text style={styles.resultDetail}>📍 {result.address}</Text>}

            {result.isActive !== undefined && (
              <Text style={styles.resultDetail}>
                📊 {result.isActive ? 'Établissement actif' : 'Établissement fermé'}
              </Text>
            )}

            {result.error && <Text style={styles.resultError}>⚠️ {result.error}</Text>}
          </View>
        </View>
      )}

      <View style={styles.infoBox}>
        <Text style={styles.infoTitle}>💡 SIRET de test :</Text>
        <Text style={styles.infoText}>• 55208426800039 (SNCF Connect - valide)</Text>
        <Text style={styles.infoText}>• 123456789 (format invalide)</Text>
        <Text style={styles.infoText}>• 12345678901234 (format OK mais inexistant)</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: Spacing.l,
    backgroundColor: Colors.neutral.background,
  },
  title: {
    fontSize: Typography.fontSize.h2,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.neutral.charcoal,
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },
  inputGroup: {
    marginBottom: Spacing.l,
  },
  label: {
    fontSize: Typography.fontSize.body,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.neutral.charcoal,
    marginBottom: Spacing.s,
  },
  input: {
    backgroundColor: Colors.neutral.white,
    borderWidth: 1,
    borderColor: Colors.ui.inputBorder,
    borderRadius: BorderRadius.medium,
    paddingHorizontal: Spacing.m,
    paddingVertical: Spacing.m,
    fontSize: Typography.fontSize.body,
    color: Colors.neutral.charcoal,
  },
  button: {
    backgroundColor: Colors.primary.accent,
    borderRadius: BorderRadius.medium,
    paddingVertical: Spacing.m,
    paddingHorizontal: Spacing.l,
    marginBottom: Spacing.m,
    alignItems: 'center',
  },
  buttonSecondary: {
    backgroundColor: Colors.neutral.iron,
  },
  buttonDisabled: {
    backgroundColor: Colors.neutral.mist,
  },
  buttonText: {
    color: Colors.neutral.white,
    fontSize: Typography.fontSize.body,
    fontWeight: Typography.fontWeight.bold,
  },
  buttonTextSecondary: {
    color: Colors.neutral.white,
    fontSize: Typography.fontSize.body,
    fontWeight: Typography.fontWeight.medium,
  },
  resultContainer: {
    marginTop: Spacing.l,
    marginBottom: Spacing.l,
  },
  resultTitle: {
    fontSize: Typography.fontSize.body,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.neutral.charcoal,
    marginBottom: Spacing.s,
  },
  resultCard: {
    backgroundColor: Colors.neutral.white,
    borderRadius: BorderRadius.medium,
    padding: Spacing.m,
    borderWidth: 2,
  },
  resultValid: {
    borderColor: Colors.semantic.success,
  },
  resultInvalid: {
    borderColor: Colors.semantic.error,
  },
  resultStatus: {
    fontSize: Typography.fontSize.body,
    fontWeight: Typography.fontWeight.bold,
    marginBottom: Spacing.s,
  },
  resultDetail: {
    fontSize: Typography.fontSize.body,
    color: Colors.neutral.charcoal,
    marginBottom: Spacing.xs,
  },
  resultError: {
    fontSize: Typography.fontSize.caption,
    color: Colors.semantic.error,
    fontStyle: 'italic',
    marginTop: Spacing.xs,
  },
  infoBox: {
    backgroundColor: Colors.primary.accent + '10',
    borderRadius: BorderRadius.medium,
    padding: Spacing.m,
    marginTop: Spacing.xl,
  },
  infoTitle: {
    fontSize: Typography.fontSize.body,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.neutral.charcoal,
    marginBottom: Spacing.s,
  },
  infoText: {
    fontSize: Typography.fontSize.caption,
    color: Colors.neutral.iron,
    marginBottom: Spacing.xs,
  },
});
