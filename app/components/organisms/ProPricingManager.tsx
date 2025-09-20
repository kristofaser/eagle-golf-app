import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Colors } from '@/constants/theme';
import { pricingService, ProPricing } from '@/services/pricing.service';
import { logger } from '@/utils/logger';

interface ProPricingManagerProps {
  proId: string;
  isEditable: boolean;
  onPricesChange?: (prices: Record<string, string>) => void;
  hideButton?: boolean;
}

export function ProPricingManager({
  proId,
  isEditable,
  onPricesChange,
  hideButton = false,
}: ProPricingManagerProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [prices, setPrices] = useState<Record<string, string>>({
    '9_1': '',
    '9_2': '',
    '9_3': '',
    '18_1': '',
    '18_2': '',
    '18_3': '',
  });

  // Charger les tarifs existants
  useEffect(() => {
    loadPrices();
  }, [proId]);

  const loadPrices = async () => {
    setLoading(true);
    try {
      const pricingData = await pricingService.getProPricing(proId);
      const newPrices: Record<string, string> = {};

      pricingData.forEach((p) => {
        const key = `${p.holes}_${p.players_count}`;
        newPrices[key] = p.price.toString();
      });

      setPrices(newPrices);

      // Notifier le parent des prix initiaux
      if (onPricesChange) {
        onPricesChange(newPrices);
      }
    } catch (error) {
      logger.error('Erreur chargement tarifs', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePriceChange = (key: string, value: string) => {
    // Accepter uniquement les nombres
    const cleanValue = value.replace(/[^0-9]/g, '');
    const newPrices = { ...prices, [key]: cleanValue };
    setPrices(newPrices);

    // Notifier le parent si le callback est fourni
    if (onPricesChange) {
      onPricesChange(newPrices);
    }
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

      const success = await pricingService.updateProPricing(proId, pricingData);

      if (success) {
        Alert.alert('Succès', 'Vos tarifs ont été mis à jour');
      } else {
        Alert.alert('Erreur', 'Impossible de mettre à jour les tarifs');
      }
    } catch (error) {
      logger.error('Erreur sauvegarde tarifs', error);
      Alert.alert('Erreur', 'Une erreur est survenue');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={Colors.primary.accent} />
      </View>
    );
  }

  return (
    <>
      <View style={styles.container}>
        <Text style={styles.title}>Vos tarifs par personne</Text>

        {/* 9 Trous */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Parcours 9 trous</Text>

          <View style={styles.priceRow}>
            <View style={styles.priceLabel}>
              <Text style={styles.playerText}>1 joueur</Text>
            </View>
            <View style={styles.priceInputContainer}>
              <TextInput
                style={[styles.priceInput, !isEditable && styles.priceInputDisabled]}
                value={prices['9_1']}
                onChangeText={(value) => handlePriceChange('9_1', value)}
                keyboardType="numeric"
                placeholder="150"
                editable={isEditable}
              />
              <Text style={styles.currency}>€<Text style={styles.perPerson}>/Pers.</Text></Text>
            </View>
          </View>

          <View style={styles.priceRow}>
            <View style={styles.priceLabel}>
              <Text style={styles.playerText}>2 joueurs</Text>
            </View>
            <View style={styles.priceInputContainer}>
              <TextInput
                style={[styles.priceInput, !isEditable && styles.priceInputDisabled]}
                value={prices['9_2']}
                onChangeText={(value) => handlePriceChange('9_2', value)}
                keyboardType="numeric"
                placeholder="130"
                editable={isEditable}
              />
              <Text style={styles.currency}>€<Text style={styles.perPerson}>/Pers.</Text></Text>
            </View>
          </View>

          <View style={styles.priceRow}>
            <View style={styles.priceLabel}>
              <Text style={styles.playerText}>3 joueurs</Text>
            </View>
            <View style={styles.priceInputContainer}>
              <TextInput
                style={[styles.priceInput, !isEditable && styles.priceInputDisabled]}
                value={prices['9_3']}
                onChangeText={(value) => handlePriceChange('9_3', value)}
                keyboardType="numeric"
                placeholder="110"
                editable={isEditable}
              />
              <Text style={styles.currency}>€<Text style={styles.perPerson}>/Pers.</Text></Text>
            </View>
          </View>
        </View>

        {/* 18 Trous */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Parcours 18 trous</Text>

          <View style={styles.priceRow}>
            <View style={styles.priceLabel}>
              <Text style={styles.playerText}>1 joueur</Text>
            </View>
            <View style={styles.priceInputContainer}>
              <TextInput
                style={[styles.priceInput, !isEditable && styles.priceInputDisabled]}
                value={prices['18_1']}
                onChangeText={(value) => handlePriceChange('18_1', value)}
                keyboardType="numeric"
                placeholder="280"
                editable={isEditable}
              />
              <Text style={styles.currency}>€<Text style={styles.perPerson}>/Pers.</Text></Text>
            </View>
          </View>

          <View style={styles.priceRow}>
            <View style={styles.priceLabel}>
              <Text style={styles.playerText}>2 joueurs</Text>
            </View>
            <View style={styles.priceInputContainer}>
              <TextInput
                style={[styles.priceInput, !isEditable && styles.priceInputDisabled]}
                value={prices['18_2']}
                onChangeText={(value) => handlePriceChange('18_2', value)}
                keyboardType="numeric"
                placeholder="240"
                editable={isEditable}
              />
              <Text style={styles.currency}>€<Text style={styles.perPerson}>/Pers.</Text></Text>
            </View>
          </View>

          <View style={styles.priceRow}>
            <View style={styles.priceLabel}>
              <Text style={styles.playerText}>3 joueurs</Text>
            </View>
            <View style={styles.priceInputContainer}>
              <TextInput
                style={[styles.priceInput, !isEditable && styles.priceInputDisabled]}
                value={prices['18_3']}
                onChangeText={(value) => handlePriceChange('18_3', value)}
                keyboardType="numeric"
                placeholder="200"
                editable={isEditable}
              />
              <Text style={styles.currency}>€<Text style={styles.perPerson}>/Pers.</Text></Text>
            </View>
          </View>
        </View>

      </View>

      {isEditable && !hideButton && (
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
      )}
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.neutral.charcoal,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.ui.textGray,
    marginBottom: 4,
  },
  hint: {
    fontSize: 14,
    color: Colors.ui.subtleGray,
    marginBottom: 24,
  },
  section: {
    backgroundColor: Colors.neutral.white,
    borderRadius: 12,
    marginBottom: 16,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.neutral.charcoal,
    marginBottom: 16,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    padding: 8,
  },
  priceLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  playerIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  playerText: {
    fontSize: 16,
    color: Colors.neutral.charcoal,
  },
  priceInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  priceInput: {
    backgroundColor: Colors.neutral.white,
    borderWidth: 1,
    borderColor: Colors.shadows.light,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 18,
    fontWeight: '600',
    minWidth: 80,
    textAlign: 'right',
    color: Colors.neutral.charcoal,
  },
  priceInputDisabled: {
    backgroundColor: Colors.ui.lightBackground,
    borderColor: 'transparent',
  },
  currency: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.neutral.charcoal,
    marginLeft: 4,
  },
  perPerson: {
    fontSize: 14,
    fontWeight: '400',
    color: Colors.neutral.charcoal,
  },
  info: {
    fontSize: 14,
    color: Colors.ui.subtleGray,
    fontStyle: 'italic',
    marginBottom: 24,
    lineHeight: 20,
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
  stickyButtonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.neutral.white,
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingBottom: 30,
    borderTopWidth: 1,
    borderTopColor: Colors.shadows.light,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
});
