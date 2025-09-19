import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Modal,
  TextInput,
  Keyboard,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { Video02Icon } from '@hugeicons/core-free-icons';
import { useAuth } from '@/hooks/useAuth';
import { profileService, FullProfile } from '@/services/profile.service';
import { Text, Button, Input, LoadingScreen } from '@/components/atoms';
import { SingleVideoUploadManager } from '@/components/organisms/SingleVideoUploadManager';
import { Colors, Spacing, Typography, BorderRadius } from '@/constants/theme';
import { useQueryClient } from '@tanstack/react-query';
import { useUserContext } from '@/contexts/UserContext';
import { supabase } from '@/utils/supabase/client';
import { s3, getPublicUrl, generateVideoKey, BUCKET_NAME } from '@/utils/scaleway';

// Liste des divisions professionnelles officielles
const PRO_DIVISIONS = [
  'DP World Tour',
  'HotelPlanner Tour',
  'Alps Tour',
  'Pro Golf Tour',
  'Ladies European Tour',
  'Legends Tour',
  'Circuit Français',
] as const;

interface SkillSliderProps {
  label: string;
  value: number;
  onValueChange: (value: number) => void;
  onCameraPress?: () => void;
}

const SkillSlider: React.FC<SkillSliderProps> = ({ label, value, onValueChange, onCameraPress }) => {
  // S'assurer que value est un nombre valide
  const safeValue = isNaN(value) || value === undefined || value === null ? 0 : value;

  const handleSliderPress = (increment: number) => {
    const newValue = Math.max(0, Math.min(100, safeValue + increment));
    onValueChange(newValue);
  };

  return (
    <View style={styles.skillContainer}>
      <View style={styles.skillHeader}>
        <View style={styles.skillLabelContainer}>
          <Text variant="body" color="charcoal" weight="medium" style={styles.skillLabel}>
            {label}
          </Text>
          {onCameraPress && (
            <TouchableOpacity
              style={styles.cameraButton}
              onPress={onCameraPress}
              activeOpacity={0.7}
            >
              <HugeiconsIcon
                icon={Video02Icon}
                size={16}
                color={Colors.primary.accent}
                strokeWidth={1.5}
              />
            </TouchableOpacity>
          )}
        </View>
        <View style={styles.skillValue}>
          <Text variant="body" color="accent" weight="semiBold">
            {safeValue}%
          </Text>
        </View>
      </View>

      {/* Slider personnalisé avec boutons */}
      <View style={styles.sliderContainer}>
        <View style={styles.sliderControls}>
          <TouchableOpacity
            style={styles.sliderButton}
            onPress={() => handleSliderPress(-10)}
            activeOpacity={0.7}
          >
            <Ionicons name="remove" size={16} color={Colors.primary.accent} />
          </TouchableOpacity>

          <View style={styles.sliderTrack}>
            <View style={styles.sliderTrackBackground}>
              <View style={[styles.sliderTrackFill, { width: `${safeValue}%` }]} />
            </View>

            {/* Boutons de valeur rapide */}
            <View style={styles.quickValues}>
              {[25, 50, 75].map((quickValue) => (
                <TouchableOpacity
                  key={quickValue}
                  style={[
                    styles.quickValueButton,
                    { left: `${quickValue - 2}%` },
                    safeValue === quickValue && styles.quickValueButtonActive,
                  ]}
                  onPress={() => onValueChange(quickValue)}
                  activeOpacity={0.7}
                >
                  <Text variant="caption" color={safeValue === quickValue ? 'white' : 'gray'}>
                    {quickValue}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <TouchableOpacity
            style={styles.sliderButton}
            onPress={() => handleSliderPress(10)}
            activeOpacity={0.7}
          >
            <Ionicons name="add" size={16} color={Colors.primary.accent} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

interface DivisionPickerProps {
  selectedDivision: string;
  onDivisionChange: (division: string) => void;
}

interface DivisionPickerModalProps {
  visible: boolean;
  onClose: () => void;
  selectedDivision: string;
  onDivisionChange: (division: string) => void;
}

const DivisionPickerModal: React.FC<DivisionPickerModalProps> = ({
  visible,
  onClose,
  selectedDivision,
  onDivisionChange,
}) => {
  const handleSelectDivision = (division: string) => {
    onDivisionChange(division);
    onClose();
  };

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
            Sélectionner une division
          </Text>
          <TouchableOpacity onPress={onClose} style={styles.modalCloseButton}>
            <Ionicons name="close" size={24} color={Colors.neutral.charcoal} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.modalContent}>
          {PRO_DIVISIONS.map((division) => (
            <TouchableOpacity
              key={division}
              style={[
                styles.divisionOption,
                selectedDivision === division && styles.divisionOptionSelected,
              ]}
              onPress={() => handleSelectDivision(division)}
              activeOpacity={0.7}
            >
              <Text
                variant="body"
                color={selectedDivision === division ? 'accent' : 'charcoal'}
                weight={selectedDivision === division ? 'semiBold' : 'regular'}
              >
                {division}
              </Text>
              {selectedDivision === division && (
                <Ionicons name="checkmark" size={20} color={Colors.primary.accent} />
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};

const DivisionPicker: React.FC<DivisionPickerProps> = ({ selectedDivision, onDivisionChange }) => {
  const [showPicker, setShowPicker] = useState(false);

  return (
    <>
      <Text variant="body" color="charcoal" weight="medium" style={styles.inputLabel}>
        Division professionnelle *
      </Text>

      <TouchableOpacity
        style={styles.divisionSelector}
        onPress={() => setShowPicker(true)}
        activeOpacity={0.7}
      >
        <Text variant="body" color={selectedDivision ? 'charcoal' : 'gray'}>
          {selectedDivision || 'Sélectionner une division'}
        </Text>
        <Ionicons name="chevron-down" size={20} color={Colors.neutral.course} />
      </TouchableOpacity>

      <DivisionPickerModal
        visible={showPicker}
        onClose={() => setShowPicker(false)}
        selectedDivision={selectedDivision}
        onDivisionChange={onDivisionChange}
      />
    </>
  );
};

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

  useEffect(() => {
    if (showTypePicker) {
      console.log("🎯 Liste des types ouverte, nombre d'options:", EXPERIENCE_TYPES.length);
    }
  }, [showTypePicker]);

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
      setShowTypePicker(false); // Reset l'état du picker
      onClose();
    }
  };

  const handleSelectType = (type: string) => {
    console.log('🔥 Type sélectionné:', type);
    setSelectedType(type);
    setShowTypePicker(false);
  };

  // Reset le picker quand le modal se ferme
  useEffect(() => {
    if (!visible) {
      setShowTypePicker(false);
      setSelectedType('');
      setDescription('');
    }
  }, [visible]);

  const selectedTypeData = EXPERIENCE_TYPES.find((t) => t.key === selectedType);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.modalContainer}>
        {/* Header */}
        <View style={styles.modalHeader}>
          <Text variant="h4" color="charcoal" weight="semiBold">
            {showTypePicker ? '🎯 Type de résultat' : 'Ajouter une expérience'}
          </Text>
          <TouchableOpacity
            onPress={showTypePicker ? () => setShowTypePicker(false) : onClose}
            style={styles.modalCloseButton}
          >
            <Ionicons
              name={showTypePicker ? 'arrow-back' : 'close'}
              size={24}
              color={Colors.neutral.charcoal}
            />
          </TouchableOpacity>
        </View>

        {/* Contenu conditionnel */}
        {showTypePicker ? (
          // Vue de sélection de type
          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            {EXPERIENCE_TYPES.map((type) => (
              <TouchableOpacity
                key={type.key}
                onPress={() => {
                  console.log('🚀 TouchableOpacity pressé pour:', type.key);
                  handleSelectType(type.key);
                }}
                style={[
                  styles.typeOptionInline,
                  selectedType === type.key && styles.typeOptionInlineSelected,
                ]}
              >
                <Text
                  style={[
                    styles.typeOptionText,
                    selectedType === type.key && styles.typeOptionTextSelected,
                  ]}
                >
                  {type.label}
                </Text>
                {selectedType === type.key && (
                  <Ionicons name="checkmark" size={20} color={Colors.primary.accent} />
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        ) : (
          // Vue du formulaire principal avec scroll simple
          <>
            <ScrollView
              style={[styles.modalContent, { paddingBottom: keyboardHeight > 0 ? 80 : 0 }]}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              <Text variant="body" color="charcoal" weight="medium" style={styles.inputLabel}>
                Type de résultat *
              </Text>

              <TouchableOpacity
                style={styles.typeSelector}
                onPress={() => {
                  console.log('📋 Ouverture du sélecteur de type');
                  setShowTypePicker(true);
                }}
                activeOpacity={0.7}
              >
                <Text variant="body" color={selectedType ? 'charcoal' : 'gray'}>
                  {selectedTypeData ? selectedTypeData.label : 'Sélectionner un type'}
                </Text>
                <Ionicons name="chevron-down" size={20} color={Colors.neutral.course} />
              </TouchableOpacity>

              <Text variant="body" color="charcoal" weight="medium" style={styles.inputLabel}>
                Description *
              </Text>

              <TextInput
                value={description}
                onChangeText={setDescription}
                placeholder="Ex: Open de France 2023, Championnat Européen..."
                multiline
                numberOfLines={4}
                style={styles.descriptionInput}
                textAlignVertical="top"
              />
            </ScrollView>

            {/* Footer avec bouton - fixe au-dessus du clavier */}
            <View
              style={[
                styles.floatingFooter,
                keyboardHeight > 0 && {
                  bottom: keyboardHeight + 10,
                  backgroundColor: Colors.neutral.white,
                  borderTopWidth: 1,
                  borderTopColor: Colors.neutral.lightGray + '50',
                  shadowColor: Colors.shadows.dark,
                  shadowOffset: { width: 0, height: -2 },
                  shadowOpacity: 0.1,
                  shadowRadius: 4,
                  elevation: 5,
                },
              ]}
            >
              <TouchableOpacity
                style={[
                  styles.addButton,
                  (!selectedType || !description.trim()) && styles.addButtonDisabled,
                ]}
                onPress={handleAdd}
                disabled={!selectedType || !description.trim()}
                activeOpacity={0.7}
              >
                <Text style={styles.addButtonText}>Ajouter l'expérience</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </SafeAreaView>
    </Modal>
  );
};

export default function ProSettingsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { loadUserProfile } = useUserContext();
  const [profile, setProfile] = useState<FullProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // État pour le modal d'expérience
  const [showExperienceModal, setShowExperienceModal] = useState(false);

  // État pour le modal d'upload vidéo
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [selectedSkill, setSelectedSkill] = useState<string>('');
  const [currentVideoUrl, setCurrentVideoUrl] = useState<string | null>(null);

  // États pour les données modifiables
  const [division, setDivision] = useState('');
  const [worldRanking, setWorldRanking] = useState('');
  const [skillDriving, setSkillDriving] = useState(0);
  const [skillIrons, setSkillIrons] = useState(0);
  const [skillWedging, setSkillWedging] = useState(0);
  const [skillChipping, setSkillChipping] = useState(0);
  const [skillPutting, setSkillPutting] = useState(0);
  const [skillMental, setSkillMental] = useState(0);

  // États pour l'expérience (liste dynamique)
  const [experiences, setExperiences] = useState<Array<{ type: string; description: string }>>([]);

  useEffect(() => {
    void loadProfile();
  }, []);

  const loadProfile = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      const { data: profileData, error } = await profileService.getFullProfile(user.id);

      if (error || !profileData) {
        Alert.alert('Erreur', 'Impossible de charger votre profil');
        return;
      }

      setProfile(profileData);
      const proProfile = profileData.pro_profiles;

      if (proProfile) {
        setDivision(proProfile.division || '');
        setWorldRanking(proProfile.world_ranking?.toString() || '');
        setSkillDriving(proProfile.skill_driving || 0);
        setSkillIrons(proProfile.skill_irons || 0);
        setSkillWedging(proProfile.skill_wedging || 0);
        setSkillChipping(proProfile.skill_chipping || 0);
        setSkillPutting(proProfile.skill_putting || 0);
        setSkillMental(proProfile.skill_mental || 0);

        // Charger les données d'expérience depuis le JSONB
        const experience = proProfile.experience as any;
        if (experience && Array.isArray(experience)) {
          setExperiences(experience);
        } else {
          // Si c'est l'ancien format (objet avec compteurs), initialiser un tableau vide
          setExperiences([]);
        }
      }
    } catch (error) {
      console.error('Erreur chargement profil:', error);
      Alert.alert('Erreur', 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user?.id) return;

    try {
      setSaving(true);

      const updateData = {
        proProfile: {
          division: division.trim(),
          world_ranking: worldRanking ? parseInt(worldRanking) : null,
          skill_driving: skillDriving,
          skill_irons: skillIrons,
          skill_wedging: skillWedging,
          skill_chipping: skillChipping,
          skill_putting: skillPutting,
          skill_mental: skillMental,
          experience: experiences,
        },
      };

      const { error } = await profileService.updateProfile(user.id, updateData);

      if (error) {
        Alert.alert('Erreur', 'Impossible de sauvegarder les modifications');
        return;
      }

      // Invalider le cache React Query pour forcer le rechargement du profil
      await queryClient.invalidateQueries({ queryKey: ['proProfile', user.id] });
      // Invalider la liste des pros pour que l'écran pros.tsx se mette à jour automatiquement
      await queryClient.invalidateQueries({ queryKey: ['proProfiles'] });

      // Recharger le profil utilisateur dans le contexte pour mettre à jour l'écran Mon profil pro
      await loadUserProfile(user.id);

      Alert.alert('Succès', 'Vos informations professionnelles ont été mises à jour', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (error) {
      console.error('Erreur sauvegarde:', error);
      Alert.alert('Erreur', 'Une erreur est survenue');
    } finally {
      setSaving(false);
    }
  };

  const handleAddExperience = (experience: { type: string; description: string }) => {
    setExperiences((prev) => [...prev, experience]);
  };

  const handleDeleteExperience = (index: number) => {
    setExperiences((prev) => prev.filter((_, i) => i !== index));
  };

  const handleCameraPress = async (skillKey: string) => {
    setSelectedSkill(skillKey);
    await loadCurrentVideo(skillKey);
    setShowVideoModal(true);
  };

  const loadCurrentVideo = async (skillKey: string) => {
    try {
      if (!user?.id) return;

      // Générer la clé d'objet Scaleway
      const objectKey = generateVideoKey(user.id, skillKey);

      // Vérifier si le fichier existe sur Scaleway
      const headParams = {
        Bucket: BUCKET_NAME,
        Key: objectKey,
      };

      try {
        await s3.headObject(headParams).promise();

        // Le fichier existe, générer l'URL publique
        const publicUrl = getPublicUrl(objectKey);
        console.log('Vidéo existante trouvée:', publicUrl);

        setCurrentVideoUrl(publicUrl);
      } catch (headError: any) {
        if (headError.code === 'NotFound') {
          // Pas de vidéo pour cette compétence
          setCurrentVideoUrl(null);
        } else {
          console.error('Erreur lors de la vérification du fichier:', headError);
          setCurrentVideoUrl(null);
        }
      }
    } catch (error) {
      console.error('Erreur lors du chargement de la vidéo:', error);
      setCurrentVideoUrl(null);
    }
  };

  const getSkillLabel = (skillKey: string) => {
    const skillLabels: { [key: string]: string } = {
      driving: 'Driving',
      irons: 'Jeu de fer',
      wedging: 'Wedging',
      chipping: 'Chipping',
      putting: 'Putting',
      mental: 'Mental',
    };
    return skillLabels[skillKey] || skillKey;
  };

  const handleVideoUploaded = (skillKey: string, videoUrl: string) => {
    console.log(`✅ Vidéo uploadée pour ${skillKey}: ${videoUrl}`);
    // Mettre à jour l'URL courante avec la nouvelle vidéo
    setCurrentVideoUrl(videoUrl);
    // Fermer le modal après upload réussi
    setShowVideoModal(false);
  };

  const handleVideoDeleted = (skillKey: string) => {
    console.log(`🗑️ Vidéo supprimée pour ${skillKey}`);
    // Réinitialiser l'URL courante
    setCurrentVideoUrl(null);
    // Fermer le modal après suppression
    setShowVideoModal(false);
  };

  if (loading) {
    return <LoadingScreen message="Chargement de votre profil professionnel..." />;
  }

  if (!profile?.pro_profiles) {
    return (
      <View style={styles.errorContainer}>
        <Text variant="body" color="error">
          Profil professionnel non trouvé
        </Text>
        <Button title="Retour" onPress={() => router.back()} />
      </View>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Profil Professionnel',
          headerStyle: {
            backgroundColor: Colors.neutral.background,
          },
          headerTitleStyle: {
            color: Colors.neutral.charcoal,
            fontWeight: '600',
          },
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
              <Ionicons name="arrow-back" size={24} color={Colors.neutral.charcoal} />
            </TouchableOpacity>
          ),
        }}
      />

      <SafeAreaView style={styles.container} edges={['bottom']}>
        <KeyboardAvoidingView
          style={styles.container}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            {/* Section Division & Classement */}
            <View style={styles.section}>
              <Text variant="caption" color="gray" style={styles.sectionTitle}>
                INFORMATIONS GÉNÉRALES
              </Text>
              <View style={styles.sectionContent}>
                <DivisionPicker selectedDivision={division} onDivisionChange={setDivision} />

                <View style={styles.inputSpacing}>
                  <Input
                    label="Classement mondial"
                    value={worldRanking}
                    onChangeText={setWorldRanking}
                    placeholder="150"
                    keyboardType="numeric"
                  />
                </View>
              </View>
            </View>

            {/* Section Compétences */}
            <View style={styles.section}>
              <Text variant="caption" color="gray" style={styles.sectionTitle}>
                COMPÉTENCES TECHNIQUES
              </Text>
              <Text variant="caption" color="iron" style={styles.sectionSubtitle}>
                Évaluez vos compétences de 0 à 100%
              </Text>
              <View style={styles.sectionContent}>
                <SkillSlider
                  label="Driving"
                  value={skillDriving}
                  onValueChange={setSkillDriving}
                  onCameraPress={() => {
                    handleCameraPress('driving').catch(console.error);
                  }}
                />

                <SkillSlider
                  label="Fers"
                  value={skillIrons}
                  onValueChange={setSkillIrons}
                  onCameraPress={() => {
                    handleCameraPress('irons').catch(console.error);
                  }}
                />

                <SkillSlider
                  label="Wedging"
                  value={skillWedging}
                  onValueChange={setSkillWedging}
                  onCameraPress={() => {
                    handleCameraPress('wedging').catch(console.error);
                  }}
                />

                <SkillSlider
                  label="Chipping"
                  value={skillChipping}
                  onValueChange={setSkillChipping}
                  onCameraPress={() => {
                    handleCameraPress('chipping').catch(console.error);
                  }}
                />

                <SkillSlider
                  label="Putting"
                  value={skillPutting}
                  onValueChange={setSkillPutting}
                  onCameraPress={() => {
                    handleCameraPress('putting').catch(console.error);
                  }}
                />

                <SkillSlider
                  label="Mental"
                  value={skillMental}
                  onValueChange={setSkillMental}
                  onCameraPress={() => {
                    handleCameraPress('mental').catch(console.error);
                  }}
                />
              </View>
            </View>

            {/* Section Expérience */}
            <View style={styles.section}>
              <Text variant="caption" color="gray" style={styles.sectionTitle}>
                EXPÉRIENCE
              </Text>
              <Text variant="caption" color="iron" style={styles.sectionSubtitle}>
                Résultats en tournois officiels
              </Text>
              <View style={styles.sectionContent}>
                {/* Liste des expériences */}
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
                        <Ionicons name="trash-outline" size={18} color={Colors.semantic.error} />
                      </TouchableOpacity>
                    </View>
                  );
                })}

                {/* Bouton Ajouter */}
                <TouchableOpacity
                  style={styles.addExperienceButton}
                  onPress={() => setShowExperienceModal(true)}
                  activeOpacity={0.7}
                >
                  <Ionicons name="add-circle-outline" size={20} color={Colors.primary.accent} />
                  <Text
                    variant="body"
                    color="accent"
                    weight="medium"
                    style={styles.addExperienceText}
                  >
                    Ajouter une expérience
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

          </ScrollView>

          {/* Bouton de sauvegarde fixe */}
          <View style={styles.saveContainer}>
            <TouchableOpacity
              style={[styles.saveButton, (saving || !division.trim()) && styles.saveButtonDisabled]}
              onPress={handleSave}
              disabled={saving || !division.trim()}
              activeOpacity={0.7}
            >
              <Text style={styles.saveButtonText}>{saving ? 'Sauvegarde...' : 'Sauvegarder'}</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>

      {/* Modal d'ajout d'expérience */}
      <AddExperienceModal
        visible={showExperienceModal}
        onClose={() => setShowExperienceModal(false)}
        onAdd={handleAddExperience}
      />

      {/* Modal d'upload vidéo */}
      <Modal
        visible={showVideoModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => {
          setShowVideoModal(false);
        }}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text variant="h4" color="charcoal" weight="semiBold">
              Gérer la vidéo - {selectedSkill}
            </Text>
            <TouchableOpacity
              onPress={() => setShowVideoModal(false)}
              style={styles.modalCloseButton}
            >
              <Ionicons name="close" size={24} color={Colors.neutral.charcoal} />
            </TouchableOpacity>
          </View>

          <SingleVideoUploadManager
            skillKey={selectedSkill}
            skillLabel={getSkillLabel(selectedSkill)}
            currentVideoUrl={currentVideoUrl}
            onVideoUploaded={handleVideoUploaded}
            onVideoDeleted={handleVideoDeleted}
          />
        </SafeAreaView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.neutral.background,
  },
  headerButton: {
    paddingLeft: 16,
    paddingVertical: 8,
  },
  content: {
    paddingBottom: 100,
  },
  section: {
    marginTop: Spacing.l,
  },
  sectionTitle: {
    marginHorizontal: Spacing.l,
    marginBottom: Spacing.xs,
    fontWeight: '600',
  },
  sectionSubtitle: {
    marginHorizontal: Spacing.l,
    marginBottom: Spacing.s,
  },
  sectionContent: {
    backgroundColor: Colors.neutral.white,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: Colors.neutral.lightGray + '50',
    paddingHorizontal: Spacing.l,
    paddingVertical: Spacing.m,
  },
  skillContainer: {
    marginBottom: Spacing.l,
  },
  skillHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.s,
  },
  skillLabelContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  skillLabel: {
    flex: 0,
  },
  cameraButton: {
    padding: Spacing.xs,
    marginLeft: Spacing.xs,
  },
  skillValue: {
    minWidth: 50,
    alignItems: 'flex-end',
  },
  sliderContainer: {
    marginTop: Spacing.s,
  },
  sliderControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.s,
  },
  sliderButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.neutral.background,
    borderWidth: 1,
    borderColor: Colors.primary.accent,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sliderTrack: {
    flex: 1,
    position: 'relative',
  },
  sliderTrackBackground: {
    height: 8,
    backgroundColor: Colors.neutral.lightGray,
    borderRadius: 4,
    overflow: 'hidden',
  },
  sliderTrackFill: {
    height: '100%',
    backgroundColor: Colors.primary.accent,
    borderRadius: 4,
  },
  quickValues: {
    position: 'absolute',
    top: -20,
    left: 0,
    right: 0,
    height: 16,
  },
  quickValueButton: {
    position: 'absolute',
    width: 24,
    height: 16,
    backgroundColor: Colors.neutral.white,
    borderWidth: 1,
    borderColor: Colors.neutral.lightGray,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickValueButtonActive: {
    backgroundColor: Colors.primary.accent,
    borderColor: Colors.primary.accent,
  },
  saveContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.neutral.white,
    borderTopWidth: 1,
    borderTopColor: Colors.neutral.lightGray + '50',
    paddingHorizontal: Spacing.l,
    paddingVertical: Spacing.m,
    paddingBottom: Spacing.xl,
  },
  saveButton: {
    backgroundColor: Colors.primary.accent,
    paddingVertical: Spacing.m,
    paddingHorizontal: Spacing.l,
    borderRadius: BorderRadius.medium,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  saveButtonDisabled: {
    backgroundColor: Colors.neutral.course,
    opacity: 0.7,
  },
  saveButtonText: {
    color: Colors.neutral.white,
    fontSize: Typography.fontSize.body,
    fontWeight: Typography.fontWeight.semiBold,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },

  // Styles pour DivisionPicker et les modals
  inputLabel: {
    marginBottom: Spacing.xs,
    fontWeight: Typography.fontWeight.medium,
  },
  inputSpacing: {
    marginTop: Spacing.m,
  },
  divisionSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.m,
    paddingVertical: Spacing.s + 2,
    backgroundColor: Colors.neutral.white,
    borderWidth: 1,
    borderColor: Colors.neutral.mist,
    borderRadius: BorderRadius.medium,
    minHeight: 48,
  },
  // Styles pour les modals
  modalContainer: {
    flex: 1,
    backgroundColor: Colors.neutral.background,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.l,
    paddingVertical: Spacing.m,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral.lightGray + '50',
    backgroundColor: Colors.neutral.white,
  },
  modalCloseButton: {
    padding: Spacing.xs,
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: Spacing.l,
    paddingTop: Spacing.m,
  },
  modalFooter: {
    paddingHorizontal: Spacing.l,
    paddingTop: Spacing.m,
    paddingBottom: Spacing.xl,
    backgroundColor: Colors.neutral.white,
    borderTopWidth: 1,
    borderTopColor: Colors.neutral.lightGray + '50',
  },
  divisionOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.m,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.neutral.lightGray + '30',
  },
  divisionOptionSelected: {
    backgroundColor: Colors.primary.accent + '10',
    marginHorizontal: -Spacing.l,
    paddingHorizontal: Spacing.l,
    borderRadius: BorderRadius.small,
  },

  // Styles pour nouvelle section Expérience
  experienceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.s,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.neutral.lightGray + '30',
  },
  experienceContent: {
    flex: 1,
    marginRight: Spacing.s,
  },
  experienceDescription: {
    marginTop: Spacing.xxs,
  },
  deleteButton: {
    padding: Spacing.xs,
  },
  addExperienceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.m,
    marginTop: Spacing.s,
    borderWidth: 1,
    borderColor: Colors.primary.accent,
    borderRadius: BorderRadius.medium,
    borderStyle: 'dashed',
  },
  addExperienceText: {
    marginLeft: Spacing.xs,
  },


  // Styles pour AddExperienceBottomSheet
  typeSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.m,
    paddingVertical: Spacing.s + 2,
    backgroundColor: Colors.neutral.white,
    borderWidth: 1,
    borderColor: Colors.neutral.mist,
    borderRadius: BorderRadius.medium,
    minHeight: 48,
    marginBottom: Spacing.m,
  },
  descriptionInput: {
    minHeight: 100,
    maxHeight: 120,
    paddingHorizontal: Spacing.m,
    paddingVertical: Spacing.s + 2,
    backgroundColor: Colors.neutral.white,
    borderWidth: 1,
    borderColor: Colors.neutral.mist,
    borderRadius: BorderRadius.medium,
    fontSize: Typography.fontSize.body,
    color: Colors.neutral.charcoal,
    marginBottom: Spacing.xl,
  },
  buttonContainer: {
    marginTop: Spacing.xl,
    marginBottom: Spacing.xl,
  },
  addButton: {
    backgroundColor: Colors.primary.accent,
    paddingVertical: Spacing.m,
    paddingHorizontal: Spacing.l,
    borderRadius: BorderRadius.medium,
    alignItems: 'center',
    justifyContent: 'center',
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

  // Styles pour le modal selon la documentation officielle
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)', // Fond semi-transparent
  },
  modalView: {
    margin: 20,
    backgroundColor: Colors.neutral.white,
    borderRadius: 20,
    padding: 35,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    width: '90%',
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.neutral.charcoal,
    marginBottom: 20,
    textAlign: 'center',
  },
  optionsList: {
    maxHeight: 400,
    width: '100%',
  },
  optionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral.lightGray + '30',
  },
  optionItemSelected: {
    backgroundColor: Colors.primary.accent + '10',
    borderRadius: 8,
    borderBottomWidth: 0,
    marginVertical: 2,
  },
  optionText: {
    fontSize: 16,
    color: Colors.neutral.charcoal,
  },
  optionTextSelected: {
    color: Colors.primary.accent,
    fontWeight: '600',
  },
  closeButton: {
    marginTop: 20,
    backgroundColor: Colors.primary.accent,
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 10,
  },
  closeButtonText: {
    color: Colors.neutral.white,
    fontSize: 16,
    fontWeight: '600',
  },

  // Styles pour la sélection inline de type
  typeOptionInline: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.m,
    paddingHorizontal: Spacing.l,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral.lightGray + '30',
  },
  typeOptionInlineSelected: {
    backgroundColor: Colors.primary.accent + '10',
    borderRadius: 8,
    borderBottomWidth: 0,
    marginVertical: 2,
    marginHorizontal: -Spacing.l,
    paddingHorizontal: Spacing.l,
  },
  typeOptionText: {
    fontSize: 16,
    color: Colors.neutral.charcoal,
  },
  typeOptionTextSelected: {
    color: Colors.primary.accent,
    fontWeight: '600',
  },

  // Style pour KeyboardAvoidingView selon la documentation officielle
  keyboardAvoidingContainer: {
    flex: 1,
    justifyContent: 'space-between',
  },

  // Styles pour KeyboardAwareScrollView
  keyboardAwareContent: {
    flexGrow: 1,
    paddingBottom: Spacing.xl,
  },
  formContent: {
    flex: 1,
  },
  modalFooterInline: {
    paddingTop: Spacing.l,
    paddingBottom: Spacing.xl,
  },

  // Style pour le footer flottant au-dessus du clavier
  floatingFooter: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: Spacing.l,
    paddingTop: Spacing.m,
    paddingBottom: Spacing.m,
  },
});
