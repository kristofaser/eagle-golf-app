import React from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '@/components/atoms';
import { Colors, Spacing, BorderRadius } from '@/constants/theme';

// Divisions disponibles
const DIVISIONS = [
  'Division 1',
  'Division 2',
  'Division 3',
  'Division 4',
  'Division 5',
  'Pro Elite',
  'Pro Senior',
  'Pro Ladies',
];

export default function DivisionSelectScreen() {
  const router = useRouter();
  const { currentDivision } = useLocalSearchParams<{ currentDivision?: string }>();

  const handleDivisionSelect = (selectedDivision: string) => {
    // Retourner à la page précédente avec la division sélectionnée
    router.back();
    // La valeur sera gérée par les paramètres de navigation ou un état global
    // Pour l'instant, on simule juste le retour
  };

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Choisir une division',
          headerBackTitle: 'Retour',
        }}
      />

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.divisionList}>
          {DIVISIONS.map((division) => (
            <TouchableOpacity
              key={division}
              style={[
                styles.divisionItem,
                currentDivision === division && styles.selectedDivisionItem
              ]}
              onPress={() => handleDivisionSelect(division)}
              activeOpacity={0.8}
            >
              <Text
                variant="body"
                color={currentDivision === division ? "white" : "charcoal"}
                weight={currentDivision === division ? "semiBold" : "medium"}
              >
                {division}
              </Text>
              {currentDivision === division && (
                <Ionicons name="checkmark" size={20} color={Colors.neutral.white} />
              )}
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
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
  },
  scrollContent: {
    paddingBottom: Spacing.xl,
  },
  divisionList: {
    paddingHorizontal: Spacing.l,
    paddingTop: Spacing.l,
  },
  divisionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.l,
    paddingHorizontal: Spacing.l,
    borderRadius: BorderRadius.medium,
    marginVertical: Spacing.xs,
    backgroundColor: Colors.neutral.white,
    borderWidth: 1,
    borderColor: Colors.neutral.mist,
  },
  selectedDivisionItem: {
    backgroundColor: Colors.primary.accent,
    borderColor: Colors.primary.accent,
  },
});