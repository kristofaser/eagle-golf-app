import {
  View,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Text,
} from 'react-native';
import React, { useState, useEffect, useRef } from 'react';
import { Colors, Spacing } from '@/constants/theme';
import { ProPricingManager } from '@/components/organisms/ProPricingManager';
import { useAuth } from '@/hooks/useAuth';
import { pricingService, ProPricing } from '@/services/pricing.service';
import { useQueryClient } from '@tanstack/react-query';
import { useUserContext } from '@/contexts/UserContext';
import { useProProfileTab } from '@/contexts/ProProfileContext';
import { Ionicons } from '@expo/vector-icons';

function PricingContent() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { loadUserProfile } = useUserContext();
  const { setActiveTab } = useProProfileTab();
  const [showSaved, setShowSaved] = useState(false);
  const saveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Cleanup des timers au démontage
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, []);

  if (!user) {
    return null;
  }

  const handleAutoSave = async (prices: Record<string, string>) => {
    // Clear le timer de debounce précédent
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Debounce de 1 seconde pour éviter trop de requêtes
    debounceTimerRef.current = setTimeout(async () => {
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

        // Ne sauvegarder que s'il y a au moins un prix valide
        if (pricingData.length > 0) {
          const success = await pricingService.updateProPricing(user.id, pricingData);

          if (success) {
            // Invalider les queries React Query
            await queryClient.invalidateQueries({ queryKey: ['profile'] });
            await queryClient.invalidateQueries({ queryKey: ['proPricing', user.id] });

            // Recharger le profil utilisateur dans le contexte
            await loadUserProfile(user.id);

            // Afficher le message "Sauvegardé"
            setShowSaved(true);

            // Clear le timer précédent s'il existe
            if (saveTimerRef.current) clearTimeout(saveTimerRef.current);

            // Cacher le message après 2 secondes
            saveTimerRef.current = setTimeout(() => {
              setShowSaved(false);
            }, 2000);

            // Activer l'onglet services
            setActiveTab('services');
          }
        }
      } catch (error) {
        console.error('Erreur sauvegarde automatique tarifs:', error);
      }
    }, 1000);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Indicateur flottant de sauvegarde */}
      {showSaved && (
        <View style={styles.savedIndicator}>
          <Ionicons name="checkmark-circle" size={16} color={Colors.semantic.success.default} />
          <Text style={styles.savedText}>Sauvegardé</Text>
        </View>
      )}

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <ProPricingManager
          proId={user.id}
          isEditable={true}
          onPricesChange={handleAutoSave}
          hideButton={true}
        />
      </ScrollView>
    </SafeAreaView>
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
    paddingBottom: 20, // Espace normal sans bouton
  },
  savedIndicator: {
    position: 'absolute',
    top: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.s,
    paddingHorizontal: Spacing.m,
    backgroundColor: Colors.neutral.charcoal,
    borderRadius: 20,
    zIndex: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  savedText: {
    marginLeft: 4,
    fontSize: 14,
    color: Colors.neutral.white,
    fontWeight: '600',
  },
});