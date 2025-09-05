import React from 'react';
import { View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Text, Button } from '@/components/atoms';
import { Colors, Spacing } from '@/constants/theme';

export default function UnauthorizedScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Ionicons name="lock-closed" size={80} color={Colors.semantic.warning} />
        </View>

        <Text variant="h2" color="charcoal" style={styles.title}>
          Accès non autorisé
        </Text>

        <Text variant="body" color="gray" style={styles.message}>
          Vous n'avez pas les permissions nécessaires pour accéder à cette page.
        </Text>

        <View style={styles.buttonContainer}>
          <Button
            variant="primary"
            size="large"
            onPress={() => router.replace('/(tabs)')}
            style={styles.button}
          >
            Retour à l'accueil
          </Button>

          <Button
            variant="secondary"
            size="large"
            onPress={() => router.back()}
            style={styles.button}
          >
            Page précédente
          </Button>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.neutral.background,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
  },
  iconContainer: {
    marginBottom: Spacing.xl,
  },
  title: {
    marginBottom: Spacing.m,
    textAlign: 'center',
  },
  message: {
    marginBottom: Spacing.xxl,
    textAlign: 'center',
    maxWidth: 300,
  },
  buttonContainer: {
    width: '100%',
    maxWidth: 300,
  },
  button: {
    marginBottom: Spacing.m,
  },
});
