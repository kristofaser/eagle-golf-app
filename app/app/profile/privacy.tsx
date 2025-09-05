import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '@/components/atoms';
import { Colors, Spacing } from '@/constants/theme';

export default function PrivacyScreen() {
  const router = useRouter();

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Confidentialité',
          headerStyle: {
            backgroundColor: Colors.neutral.background,
          },
          headerTitleStyle: {
            color: Colors.neutral.charcoal,
            fontWeight: '600',
          },
          headerLeft: () => (
            <TouchableOpacity
              onPress={() => router.back()}
              style={{ paddingLeft: 16, paddingVertical: 8 }}
            >
              <Ionicons name="arrow-back" size={24} color={Colors.neutral.charcoal} />
            </TouchableOpacity>
          ),
        }}
      />

      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <View style={styles.iconContainer}>
            <Ionicons name="shield-checkmark-outline" size={64} color={Colors.primary.accent} />
          </View>

          <Text variant="h2" color="charcoal" style={styles.title}>
            Confidentialité
          </Text>

          <Text variant="body" color="gray" style={styles.message}>
            À développer
          </Text>

          <Text variant="caption" color="gray" style={styles.description}>
            Cette section contiendra : • Politique de confidentialité • Gestion des données
            personnelles • Paramètres de visibilité du profil • Contrôle des informations partagées
            • Droit à l'oubli et suppression des données
          </Text>
        </View>
      </SafeAreaView>
    </>
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
    marginBottom: Spacing.l,
  },
  title: {
    marginBottom: Spacing.m,
    textAlign: 'center',
  },
  message: {
    marginBottom: Spacing.l,
    textAlign: 'center',
    fontSize: 18,
  },
  description: {
    textAlign: 'center',
    lineHeight: 22,
  },
});
