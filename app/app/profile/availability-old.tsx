import {
  SafeAreaView,
  StyleSheet,
  ScrollView,
  View,
  TouchableOpacity,
  ActivityIndicator,
  Text,
  Alert,
} from 'react-native';
import React, { useState, useEffect } from 'react';
import { Stack, router } from 'expo-router';
import { Colors } from '@/constants/theme';
import { ProAvailabilityCalendar } from '@/components/organisms/ProAvailabilityCalendar';
import { useAuth } from '@/hooks/useAuth';
import { availabilityService } from '@/services/availability.service';
import { useQueryClient } from '@tanstack/react-query';
import { useUserContext } from '@/contexts/UserContext';
import { useProProfileTab } from '@/contexts/ProProfileContext';

interface AvailabilityData {
  date: string;
  is_available: boolean;
  is_booked?: boolean;
}

function AvailabilityContent() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { loadUserProfile } = useUserContext();
  const { setActiveTab } = useProProfileTab();
  const [availabilityData, setAvailabilityData] = useState<AvailabilityData[]>([]);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  if (!user) {
    return null;
  }

  const handleAvailabilityChange = (data: AvailabilityData[]) => {
    setAvailabilityData(data);
    setHasChanges(true);
  };

  const handleSave = async () => {
    if (!availabilityData || availabilityData.length === 0) {
      Alert.alert('Erreur', 'Aucune modification à sauvegarder');
      return;
    }

    setSaving(true);
    try {
      // Sauvegarder TOUTES les modifications (disponibles ET non-disponibles)
      // pour que les suppressions soient prises en compte
      const success = await availabilityService.updateProDailyAvailabilities(
        user.id,
        availabilityData
      );

      if (success) {
        // Pas de nettoyage - on garde toutes les entrées pour permettre les suppressions

        // Invalider les queries React Query pour forcer le rechargement
        await queryClient.invalidateQueries({ queryKey: ['proProfile'] });
        await queryClient.invalidateQueries({ queryKey: ['proDailyAvailabilities', user.id] });

        // Recharger le profil utilisateur dans le contexte
        await loadUserProfile(user.id);

        // Activer l'onglet services
        setActiveTab('services');

        // Fermer la modal immédiatement
        router.back();
      } else {
        Alert.alert('Erreur', 'Impossible de sauvegarder vos disponibilités');
      }
    } catch (error) {
      console.error('Erreur sauvegarde disponibilités:', error);
      Alert.alert('Erreur', 'Une erreur est survenue');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Gérer mes disponibilités',
          headerBackTitle: 'Retour',
        }}
      />
      <SafeAreaView style={styles.container}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <ProAvailabilityCalendar proId={user.id} onSave={handleAvailabilityChange} />
        </ScrollView>

        <View style={styles.stickyButtonContainer}>
          {hasChanges && (
            <View style={styles.changesIndicator}>
              <Text style={styles.changesText}>Modifications non sauvegardées</Text>
            </View>
          )}
          <TouchableOpacity
            style={[styles.saveButton, saving && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.saveButtonText}>Enregistrer mes disponibilités</Text>
            )}
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </>
  );
}

export default function AvailabilityScreen() {
  return <AvailabilityContent />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.neutral.background,
  },
  scrollContent: {
    paddingBottom: 100, // Espace pour le bouton
  },
  stickyButtonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.neutral.white,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 30,
    borderTopWidth: 1,
    borderTopColor: Colors.shadows.light,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  saveButton: {
    backgroundColor: Colors.primary.accent,
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  changesIndicator: {
    backgroundColor: Colors.semantic.warningLight,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    marginBottom: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.semantic.warning,
  },
  changesText: {
    fontSize: 14,
    color: Colors.semantic.warning,
    fontWeight: '600',
  },
});
