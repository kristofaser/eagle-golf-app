import {
  View,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  ActivityIndicator,
  Text,
  Alert,
} from 'react-native';
import React, { useState, useEffect } from 'react';
import { Colors } from '@/constants/theme';
import { ProPricingManager } from '@/components/organisms/ProPricingManager';
import { useAuth } from '@/hooks/useAuth';
import { Stack, router } from 'expo-router';
import { pricingService, ProPricing } from '@/services/pricing.service';
import { useQueryClient } from '@tanstack/react-query';
import { useUserContext } from '@/contexts/UserContext';
import { useProProfileTab } from '@/contexts/ProProfileContext';

function PricingContent() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { loadUserProfile } = useUserContext();
  const { setActiveTab } = useProProfileTab();
  const [prices, setPrices] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  if (!user) {
    return null;
  }

  const handlePricesChange = (newPrices: Record<string, string>) => {
    setPrices(newPrices);
  };

  const handleSave = async () => {
    // Validation
    const hasEmptyPrices = Object.values(prices).some((p) => !p || p === '0');
    if (hasEmptyPrices) {
      Alert.alert('Erreur', 'Veuillez renseigner tous les tarifs');
      return;
    }

    setSaving(true);
    try {
      const pricingData: ProPricing[] = [];

      // Construire les données de tarification
      [9, 18].forEach((holes) => {
        [1, 2, 3].forEach((players) => {
          const key = `${holes}_${players}`;
          const price = parseFloat(prices[key] || '0');
          if (price > 0) {
            pricingData.push({
              holes: holes as 9 | 18,
              players_count: players as 1 | 2 | 3,
              price,
            });
          }
        });
      });

      const success = await pricingService.updateProPricing(user.id, pricingData);

      if (success) {
        // Invalider les queries React Query pour forcer le rechargement du profil
        await queryClient.invalidateQueries({ queryKey: ['proProfile'] });
        // Invalider spécifiquement les tarifs de cet utilisateur
        await queryClient.invalidateQueries({ queryKey: ['proPricing', user.id] });

        // Recharger le profil utilisateur dans le contexte
        await loadUserProfile(user.id);

        // Activer l'onglet services
        setActiveTab('services');

        // Fermer la modal immédiatement
        router.back();
      } else {
        Alert.alert('Erreur', 'Impossible de mettre à jour les tarifs');
      }
    } catch (error) {
      console.error('Erreur sauvegarde tarifs:', error);
      Alert.alert('Erreur', 'Une erreur est survenue');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Gestion des Tarifs',
          headerBackTitle: 'Retour',
        }}
      />
      <SafeAreaView style={styles.container}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <ProPricingManager
            proId={user.id}
            isEditable={true}
            onPricesChange={handlePricesChange}
            hideButton={true}
          />
        </ScrollView>

        <View style={styles.stickyButtonContainer}>
          <TouchableOpacity
            style={[styles.saveButton, saving && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.saveButtonText}>Enregistrer les tarifs</Text>
            )}
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </>
  );
}

export default function PricingScreen() {
  return <PricingContent />;
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
});
