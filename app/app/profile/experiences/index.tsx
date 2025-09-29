import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/hooks/useAuth';
import { profileService, FullProfile } from '@/services/profile.service';
import { Text, LoadingScreen } from '@/components/atoms';
import { Colors, Spacing, Typography, BorderRadius } from '@/constants/theme';
import { useQueryClient } from '@tanstack/react-query';
import { useUserContext } from '@/contexts/UserContext';
import { UniversalAlert } from '@/utils/alert';

// Types pour les expériences
const EXPERIENCE_TYPES = [
  { key: 'winner', label: '🏆 Victoire', emoji: '🏆' },
  { key: 'top5', label: '🥇 Top 5', emoji: '🥇' },
  { key: 'top10', label: '🥈 Top 10', emoji: '🥈' },
  { key: 'top20', label: '🥉 Top 20', emoji: '🥉' },
  { key: 'top30', label: '📊 Top 30', emoji: '📊' },
  { key: 'top40', label: '📈 Top 40', emoji: '📈' },
  { key: 'top50', label: '📋 Top 50', emoji: '📋' },
  { key: 'top60', label: '📝 Top 60', emoji: '📝' },
] as const;

interface AddExperienceModalProps {
  visible: boolean;
  onClose: () => void;
  onAdd: (experience: { type: string; description: string }) => void;
}

const AddExperienceModal: React.FC<AddExperienceModalProps> = ({ visible, onClose, onAdd }) => {
  const [selectedType, setSelectedType] = useState('');
  const [description, setDescription] = useState('');
  const [showTypePicker, setShowTypePicker] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  // Écouter les événements du clavier
  useEffect(() => {
    const keyboardDidShow = (event: any) => {
      setKeyboardHeight(event.endCoordinates.height);
    };

    const keyboardDidHide = () => {
      setKeyboardHeight(0);
    };

    const showSubscription = Keyboard.addListener('keyboardDidShow', keyboardDidShow);
    const hideSubscription = Keyboard.addListener('keyboardDidHide', keyboardDidHide);

    return () => {
      showSubscription?.remove();
      hideSubscription?.remove();
    };
  }, []);

  const handleAdd = () => {
    if (selectedType && description.trim()) {
      onAdd({ type: selectedType, description: description.trim() });
      setSelectedType('');
      setDescription('');
      setShowTypePicker(false);
      onClose();
    }
  };

  const selectedTypeData = EXPERIENCE_TYPES.find((type) => type.key === selectedType);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text variant="h4" color="charcoal" weight="semiBold">
            Ajouter une expérience
          </Text>
          <TouchableOpacity onPress={onClose} style={styles.modalCloseButton}>
            <Ionicons name="close" size={24} color={Colors.neutral.charcoal} />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={[styles.modalContent, { marginBottom: keyboardHeight }]}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.formContainer}>
            <Text variant="body" color="charcoal" weight="medium" style={styles.inputLabel}>
              Type de résultat *
            </Text>

            <TouchableOpacity
              style={styles.typeSelector}
              onPress={() => setShowTypePicker(!showTypePicker)}
              activeOpacity={0.7}
            >
              <Text variant="body" color={selectedType ? 'charcoal' : 'gray'}>
                {selectedTypeData ? `${selectedTypeData.emoji} ${selectedTypeData.label}` : 'Sélectionner un type'}
              </Text>
              <Ionicons
                name={showTypePicker ? "chevron-up" : "chevron-down"}
                size={20}
                color={Colors.neutral.course}
              />
            </TouchableOpacity>

            {showTypePicker && (
              <View style={styles.optionsList}>
                {EXPERIENCE_TYPES.map((type) => (
                  <TouchableOpacity
                    key={type.key}
                    style={[
                      styles.option,
                      selectedType === type.key && styles.optionSelected,
                    ]}
                    onPress={() => {
                      setSelectedType(type.key);
                      setShowTypePicker(false);
                    }}
                    activeOpacity={0.7}
                  >
                    <Text
                      variant="body"
                      color={selectedType === type.key ? 'accent' : 'charcoal'}
                      weight={selectedType === type.key ? 'semiBold' : 'regular'}
                    >
                      {type.emoji} {type.label}
                    </Text>
                    {selectedType === type.key && (
                      <Ionicons name="checkmark" size={20} color={Colors.primary.accent} />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            )}

            <Text variant="body" color="charcoal" weight="medium" style={styles.inputLabel}>
              Description *
            </Text>

            <TextInput
              style={styles.descriptionInput}
              placeholder="Ex: Open de France 2024, T3 après 54 trous..."
              placeholderTextColor={Colors.neutral.iron}
              value={description}
              onChangeText={setDescription}
              multiline
              textAlignVertical="top"
              autoCorrect
              spellCheck
            />

            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[
                  styles.addButton,
                  (!selectedType || !description.trim()) && styles.addButtonDisabled,
                ]}
                onPress={handleAdd}
                disabled={!selectedType || !description.trim()}
                activeOpacity={0.7}
              >
                <Text style={styles.addButtonText}>
                  Ajouter l'expérience
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};

export default function ExperiencesScreen() {
  const { user } = useAuth();
  const { userProfile, loadUserProfile } = useUserContext();
  const queryClient = useQueryClient();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [experiences, setExperiences] = useState<Array<{ type: string; description: string }>>([]);
  const [showExperienceModal, setShowExperienceModal] = useState(false);

  // Charger les données existantes
  useEffect(() => {
    const loadData = async () => {
      if (!user?.id) return;

      try {
        setLoading(true);
        const { data: profile, error } = await profileService.getFullProfile(user.id);

        if (error) throw error;

        if (profile?.pro_profiles) {
          // Gérer les différents formats possibles de données
          let existingExperiences = [];

          if (profile.pro_profiles.experience) {
            const exp = profile.pro_profiles.experience;

            // Si c'est déjà un tableau, l'utiliser directement
            if (Array.isArray(exp)) {
              existingExperiences = exp;
            }
            // Si c'est une chaîne, essayer de la parser
            else if (typeof exp === 'string') {
              try {
                existingExperiences = JSON.parse(exp);
                // Vérifier que le résultat est bien un tableau
                if (!Array.isArray(existingExperiences)) {
                  existingExperiences = [];
                }
              } catch (e) {
                console.error('Erreur parsing experience:', e);
                existingExperiences = [];
              }
            }
            // Si c'est un objet (ancien format), le convertir
            else if (typeof exp === 'object' && !Array.isArray(exp)) {
              // Ignorer l'ancien format d'objet avec compteurs
              existingExperiences = [];
            }
          }

          setExperiences(existingExperiences);
        }
      } catch (error) {
        console.error('Erreur lors du chargement:', error);
        UniversalAlert.error('Erreur', 'Impossible de charger les données');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user?.id]);

  const handleAddExperience = async (newExperience: { type: string; description: string }) => {
    const updatedExperiences = [...experiences, newExperience];
    setExperiences(updatedExperiences);
    await saveExperiences(updatedExperiences);
  };

  const handleDeleteExperience = async (index: number) => {
    UniversalAlert.show(
      'Supprimer l\'expérience',
      'Êtes-vous sûr de vouloir supprimer cette expérience ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            const updatedExperiences = experiences.filter((_, i) => i !== index);
            setExperiences(updatedExperiences);
            await saveExperiences(updatedExperiences);
          },
        },
      ]
    );
  };

  const saveExperiences = async (experiencesToSave: Array<{ type: string; description: string }>) => {
    if (!user?.id) return;

    try {
      setSaving(true);

      const { error } = await profileService.updateProfile(user.id, {
        proProfile: {
          experience: experiencesToSave, // Envoyer directement le tableau, pas de JSON.stringify
        }
      });

      if (error) throw error;

      // Invalider TOUS les caches de profil pour assurer la cohérence
      // Cela inclut le profil personnel ET le profil vitrine public
      await queryClient.invalidateQueries({ queryKey: ['profile'] });
      await queryClient.invalidateQueries({ queryKey: ['fullProfile'] });

      // Recharger le profil dans le contexte global
      await loadUserProfile(user.id);

    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
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
            Gérez vos résultats en tournois officiels
          </Text>

          {experiences.length > 0 ? (
            <View style={styles.experiencesList}>
              {experiences.map((experience, index) => {
                const typeData = EXPERIENCE_TYPES.find((t) => t.key === experience.type);
                return (
                  <View key={index} style={styles.experienceItem}>
                    <View style={styles.experienceContent}>
                      <Text variant="body" color="charcoal" weight="medium">
                        {typeData?.emoji}{' '}
                        {typeData?.label.replace(/🏆|🥇|🥈|🥉|📊|📈|📋|📝\s/, '')}
                      </Text>
                      <Text variant="caption" color="gray" style={styles.experienceDescription}>
                        {experience.description}
                      </Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => handleDeleteExperience(index)}
                      style={styles.deleteButton}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="trash-outline" size={20} color={Colors.semantic.error} />
                    </TouchableOpacity>
                  </View>
                );
              })}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Text variant="body" color="gray" style={styles.emptyStateText}>
                Aucune expérience ajoutée pour le moment
              </Text>
            </View>
          )}

          {/* Bouton Ajouter */}
          <TouchableOpacity
            style={styles.addExperienceButton}
            onPress={() => setShowExperienceModal(true)}
            activeOpacity={0.7}
          >
            <Ionicons name="add-circle-outline" size={24} color={Colors.primary.accent} />
            <Text variant="body" color="accent" weight="medium" style={styles.addExperienceText}>
              Ajouter une expérience
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Modal d'ajout d'expérience */}
      <AddExperienceModal
        visible={showExperienceModal}
        onClose={() => setShowExperienceModal(false)}
        onAdd={handleAddExperience}
      />

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
  experiencesList: {
    marginBottom: Spacing.xl,
  },
  experienceItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
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
  },
  experienceContent: {
    flex: 1,
    marginRight: Spacing.m,
  },
  experienceDescription: {
    marginTop: Spacing.xs,
    lineHeight: 18,
  },
  deleteButton: {
    padding: Spacing.xs,
  },
  emptyState: {
    paddingVertical: Spacing.xxl,
    alignItems: 'center',
  },
  emptyStateText: {
    textAlign: 'center',
  },
  addExperienceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.l,
    backgroundColor: Colors.neutral.white,
    borderWidth: 2,
    borderColor: Colors.primary.accent,
    borderRadius: BorderRadius.medium,
    borderStyle: 'dashed',
  },
  addExperienceText: {
    marginLeft: Spacing.s,
  },
  savingIndicator: {
    position: 'absolute',
    bottom: Spacing.l,
    left: 0,
    right: 0,
    alignItems: 'center',
  },

  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: Colors.neutral.pearl,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.l,
    paddingVertical: Spacing.m,
    backgroundColor: Colors.neutral.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral.mist,
  },
  modalCloseButton: {
    padding: Spacing.xs,
  },
  modalContent: {
    flex: 1,
  },
  formContainer: {
    padding: Spacing.l,
  },
  inputLabel: {
    marginBottom: Spacing.s,
  },
  typeSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.m,
    paddingVertical: Spacing.m,
    backgroundColor: Colors.neutral.white,
    borderWidth: 1,
    borderColor: Colors.neutral.mist,
    borderRadius: BorderRadius.medium,
    marginBottom: Spacing.m,
    minHeight: 48,
  },
  optionsList: {
    backgroundColor: Colors.neutral.white,
    borderWidth: 1,
    borderColor: Colors.neutral.mist,
    borderRadius: BorderRadius.medium,
    marginBottom: Spacing.m,
    maxHeight: 300,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.m,
    paddingVertical: Spacing.m,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral.pearl,
  },
  optionSelected: {
    backgroundColor: Colors.primary.light,
  },
  descriptionInput: {
    minHeight: 120,
    paddingHorizontal: Spacing.m,
    paddingVertical: Spacing.m,
    backgroundColor: Colors.neutral.white,
    borderWidth: 1,
    borderColor: Colors.neutral.mist,
    borderRadius: BorderRadius.medium,
    fontSize: Typography.fontSize.body,
    color: Colors.neutral.charcoal,
    marginBottom: Spacing.xl,
    textAlignVertical: 'top',
  },
  buttonContainer: {
    marginTop: Spacing.m,
  },
  addButton: {
    backgroundColor: Colors.primary.accent,
    paddingVertical: Spacing.m,
    borderRadius: BorderRadius.medium,
    alignItems: 'center',
    minHeight: 48,
  },
  addButtonDisabled: {
    backgroundColor: Colors.neutral.course,
    opacity: 0.7,
  },
  addButtonText: {
    color: Colors.neutral.white,
    fontSize: Typography.fontSize.body,
    fontWeight: Typography.fontWeight.semiBold,
  },
});