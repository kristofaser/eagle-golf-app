import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/hooks/useAuth';
import { profileService } from '@/services/profile.service';
import { Text, LoadingScreen } from '@/components/atoms';
import { Colors, Spacing, BorderRadius } from '@/constants/theme';
import { useQueryClient } from '@tanstack/react-query';
import { useUserContext } from '@/contexts/UserContext';
import { UniversalAlert } from '@/utils/alert';

// Liste des divisions depuis la base de données (synchronisé avec Supabase ENUM)
const PRO_DIVISIONS = [
  { key: 'DP World', label: 'DP World', emoji: '🏆' },
  { key: 'Ladies European Tour', label: 'Ladies European Tour', emoji: '👩‍🦰' },
  { key: 'Legends Tour', label: 'Legends Tour', emoji: '🎖️' },
  { key: 'Hotel Planner', label: 'Hotel Planner', emoji: '🏨' },
  { key: 'Alps Tour & Pro Golf', label: 'Alps Tour & Pro Golf', emoji: '⛰️' },
  { key: 'Circuit FR', label: 'Circuit FR', emoji: '🇫🇷' },
] as const;

export default function DivisionScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { loadUserProfile } = useUserContext();
  const queryClient = useQueryClient();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedDivision, setSelectedDivision] = useState<string | null>(null);

  // Charger la division actuelle
  useEffect(() => {
    const loadData = async () => {
      if (!user?.id) return;

      try {
        setLoading(true);
        const { data: profile, error } = await profileService.getFullProfile(user.id);

        if (error) throw error;

        if (profile?.pro_profiles?.division) {
          setSelectedDivision(profile.pro_profiles.division);
        }
      } catch (error) {
        console.error('Erreur lors du chargement:', error);
        UniversalAlert.error('Erreur', 'Impossible de charger les données');
      } finally {
        setLoading(false);
      }
    };

    void loadData();
  }, [user?.id]);

  const handleSelectDivision = (divisionKey: string) => {
    if (!user?.id) return;

    // Si c'est déjà la division sélectionnée, permettre de la déselectionner
    const newDivision = selectedDivision === divisionKey ? null : divisionKey;

    setSelectedDivision(newDivision);
    void saveDivision(newDivision);
  };

  const saveDivision = async (division: string | null) => {
    if (!user?.id) return;

    try {
      setSaving(true);

      const { error } = await profileService.updateProfile(user.id, {
        proProfile: {
          division: division,
        },
      });

      if (error) throw error;

      // Invalider tous les caches de profil
      await queryClient.invalidateQueries({ queryKey: ['profile'] });
      await queryClient.invalidateQueries({ queryKey: ['fullProfile'] });

      // Recharger le profil dans le contexte global
      await loadUserProfile(user.id);

      // Retourner à l'écran précédent (BottomSheet "Modifier mes informations")
      router.back();
    } catch (err) {
      console.error('Erreur lors de la sauvegarde:', err);
      UniversalAlert.error('Erreur', 'Impossible de sauvegarder les modifications');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <Text variant="caption" color="iron" style={styles.subtitle}>
            Sélectionnez votre circuit professionnel
          </Text>

          <View style={styles.divisionsList}>
            {PRO_DIVISIONS.map((division) => {
              const isSelected = selectedDivision === division.key;
              return (
                <TouchableOpacity
                  key={division.key}
                  style={[styles.divisionItem, isSelected && styles.divisionItemSelected]}
                  onPress={() => handleSelectDivision(division.key)}
                  activeOpacity={0.7}
                >
                  <View style={styles.divisionContent}>
                    <Text variant="h4" style={styles.divisionEmoji}>
                      {division.emoji}
                    </Text>
                    <Text
                      variant="body"
                      color={isSelected ? 'accent' : 'charcoal'}
                      weight={isSelected ? 'semiBold' : 'regular'}
                      style={styles.divisionLabel}
                    >
                      {division.label}
                    </Text>
                  </View>
                  {isSelected && (
                    <Ionicons name="checkmark-circle" size={24} color={Colors.primary.accent} />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Option "Aucune division" */}
          <TouchableOpacity
            style={[
              styles.divisionItem,
              styles.noDivisionItem,
              selectedDivision === null && styles.divisionItemSelected,
            ]}
            onPress={() => handleSelectDivision('')}
            activeOpacity={0.7}
          >
            <View style={styles.divisionContent}>
              <Text
                variant="body"
                color={selectedDivision === null ? 'accent' : 'gray'}
                weight={selectedDivision === null ? 'semiBold' : 'regular'}
              >
                Aucune division
              </Text>
            </View>
            {selectedDivision === null && (
              <Ionicons name="checkmark-circle" size={24} color={Colors.primary.accent} />
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>

      {saving && (
        <View style={styles.savingIndicator}>
          <Text variant="caption" color="gray">
            Sauvegarde en cours...
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.neutral.pearl,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: Spacing.l,
  },
  subtitle: {
    marginBottom: Spacing.xl,
    textAlign: 'center',
  },
  divisionsList: {
    marginBottom: Spacing.m,
  },
  divisionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.m,
    paddingHorizontal: Spacing.l,
    backgroundColor: Colors.neutral.white,
    borderRadius: BorderRadius.medium,
    marginBottom: Spacing.s,
    shadowColor: Colors.neutral.charcoal,
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  divisionItemSelected: {
    borderColor: Colors.primary.accent,
    backgroundColor: Colors.primary.light,
  },
  divisionContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.m,
  },
  divisionEmoji: {
    fontSize: 24,
  },
  divisionLabel: {
    flex: 1,
  },
  noDivisionItem: {
    marginTop: Spacing.m,
  },
  savingIndicator: {
    position: 'absolute',
    bottom: Spacing.l,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
});
