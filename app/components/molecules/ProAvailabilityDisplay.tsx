import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Spacing, Typography } from '@/constants/theme';

interface ProAvailabilityDisplayProps {
  proId: string;
}

export function ProAvailabilityDisplay({ proId }: ProAvailabilityDisplayProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Disponibilités</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.m,
  },
  title: {
    fontSize: Typography.fontSize.body,
    fontWeight: Typography.fontWeight.semiBold,
    color: Colors.neutral.charcoal,
  },
});
