import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '@/components/atoms';
import { Colors, Spacing } from '@/constants/theme';

export default function AboutScreen() {
  const router = useRouter();

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'À propos',
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
            <Ionicons name="information-circle-outline" size={64} color={Colors.primary.accent} />
          </View>

          <Text variant="h2" color="charcoal" style={styles.title}>
            À propos
          </Text>

          <Text variant="body" color="gray" style={styles.version}>
            Version 1.0.0
          </Text>

          <Text variant="body" color="gray" style={styles.message}>
            À développer
          </Text>

          <Text variant="caption" color="gray" style={styles.description}>
            Cette section contiendra : • Informations sur l'application Eagle • Version actuelle et
            historique des mises à jour • Équipe de développement • Remerciements et crédits • Liens
            vers les réseaux sociaux
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
    marginBottom: Spacing.s,
    textAlign: 'center',
  },
  version: {
    marginBottom: Spacing.m,
    textAlign: 'center',
    fontWeight: '500',
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
