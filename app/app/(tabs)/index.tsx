import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing } from '@/constants/theme';

export default function AccueilScreen() {
  return (
    <SafeAreaView style={styles.container} edges={[]}>
      <View style={styles.content}>
        <Text style={styles.title}>Écran Accueil</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.neutral.white,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: Spacing.xl, // Espace pour éviter la tab bar
  },
  title: {
    fontFamily: Typography.fontFamily.primary,
    fontSize: Typography.fontSize.h1,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.neutral.charcoal,
  },
});
