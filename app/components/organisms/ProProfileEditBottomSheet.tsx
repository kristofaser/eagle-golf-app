import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  Modal,
  SafeAreaView,
  Platform,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Typography, BorderRadius } from '@/constants/theme';
import { Text, Input, Button, Avatar } from '@/components/atoms';
import { useSimpleProfileUpload } from '@/hooks/useImageUpload';
import { profileService, UpdateProfileData } from '@/services/profile.service';
import { FullProfile } from '@/services/profile.service';
import { useAuth } from '@/hooks/useAuth';

// Enum des divisions depuis la base de données
const PRO_DIVISIONS = [
  'DP World Tour',
  'HotelPlanner Tour',
  'Alps Tour',
  'Pro Golf Tour',
  'Ladies European Tour',
  'Legends Tour',
  'Circuit Français',
] as const;

type ProDivision = typeof PRO_DIVISIONS[number];

interface ProProfileEditBottomSheetProps {
  profile: FullProfile;
  visible: boolean;
  onClose: () => void;
  onProfileUpdated: () => void;
}

export function ProProfileEditBottomSheet({ profile, visible, onClose, onProfileUpdated }: ProProfileEditBottomSheetProps) {
  const { user, refreshSession, loadUserProfile } = useAuth();
  const {
    uploading: uploadingImage,
    tempImageUri,
    handleImageSelection,
    uploadProfileImage,
    hasSelectedImage,
  } = useSimpleProfileUpload();

  // États du formulaire
  const [firstName, setFirstName] = useState(profile?.first_name || '');
  const [lastName, setLastName] = useState(profile?.last_name || '');
  const [division, setDivision] = useState<ProDivision | ''>(
    (profile?.pro_profiles?.division as ProDivision) || ''
  );
  const [worldRanking, setWorldRanking] = useState(
    profile?.pro_profiles?.world_ranking?.toString() || ''
  );
  const [isLoading, setIsLoading] = useState(false);
  const [showDivisionPicker, setShowDivisionPicker] = useState(false);

  // Réinitialiser les champs quand le profil change
  useEffect(() => {
    if (profile) {
      setFirstName(profile.first_name || '');
      setLastName(profile.last_name || '');
      setDivision((profile.pro_profiles?.division as ProDivision) || '');
      setWorldRanking(profile.pro_profiles?.world_ranking?.toString() || '');
    }
  }, [profile]);

  const handleSave = async () => {
    if (!user?.id) {
      Alert.alert('Erreur', 'Utilisateur non connecté');
      return;
    }

    if (isLoading) return;

    // Validation du world ranking (nombre positif)
    if (worldRanking) {
      const rankingNum = parseInt(worldRanking);
      if (isNaN(rankingNum) || rankingNum < 1) {
        Alert.alert('Erreur', 'Le classement mondial doit être un nombre positif');
        return;
      }
    }

    setIsLoading(true);

    try {
      // Upload de l'image si une nouvelle image a été sélectionnée
      let avatarUrl = null;
      if (hasSelectedImage) {
        try {
          avatarUrl = await uploadProfileImage(user.id);
        } catch (uploadError) {
          console.error('Erreur upload image:', uploadError);
          Alert.alert(
            'Attention',
            "L'image n'a pas pu être uploadée, mais les autres modifications seront sauvegardées."
          );
        }
      }

      const updateData: UpdateProfileData = {
        profile: {
          first_name: firstName,
          last_name: lastName,
          ...(avatarUrl && { avatar_url: avatarUrl }),
        },
        proProfile: {
          division: division || null,
          world_ranking: worldRanking ? parseInt(worldRanking) : null,
        },
      };

      const { error } = await profileService.updateProfile(user.id, updateData);

      if (error) {
        throw error;
      }

      // Forcer le rechargement du profil utilisateur
      try {
        await refreshSession();
        await loadUserProfile(user.id);
        await new Promise((resolve) => setTimeout(resolve, 500));
      } catch (refreshError) {
        console.log('Erreur rafraîchissement session/profil:', refreshError);
      }

      Alert.alert('Succès', 'Vos informations ont été mises à jour', [
        {
          text: 'OK',
          onPress: () => {
            onProfileUpdated();
            onClose();
          },
        },
      ]);
    } catch (error) {
      console.error('Erreur mise à jour profil:', error);
      Alert.alert('Erreur', 'Impossible de mettre à jour le profil');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.header}>
          <Text variant="h3" color="charcoal" weight="semiBold">
            Modifier mes informations
          </Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={Colors.neutral.charcoal} />
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Avatar cliquable */}
          <View style={styles.avatarSection}>
            <TouchableOpacity
              onPress={handleImageSelection}
              disabled={isLoading}
              activeOpacity={0.8}
              style={styles.avatarTouchable}
            >
              <Avatar
                size="xlarge"
                name={`${firstName} ${lastName}`}
                source={
                  tempImageUri || profile?.avatar_url
                    ? { uri: tempImageUri || profile?.avatar_url }
                    : undefined
                }
              />
              {/* Icône camera en overlay */}
              <View style={styles.cameraOverlay}>
                <Ionicons
                  name="camera"
                  size={16}
                  color={Colors.neutral.white}
                />
              </View>
            </TouchableOpacity>
            {hasSelectedImage && (
              <Text variant="caption" color="primary" weight="medium" style={styles.selectedText}>
                Photo sélectionnée ✓
              </Text>
            )}
          </View>

          {/* Formulaire */}
          <View style={styles.form}>
            <View style={styles.row}>
              <View style={styles.halfInput}>
                <Input
                  label="Prénom"
                  value={firstName}
                  onChangeText={setFirstName}
                  placeholder="John"
                />
              </View>
              <View style={styles.halfInput}>
                <Input
                  label="Nom"
                  value={lastName}
                  onChangeText={setLastName}
                  placeholder="Doe"
                />
              </View>
            </View>

            {/* Division - Picker/Select */}
            <View style={styles.inputContainer}>
              <Text variant="label" color="charcoal" style={styles.label}>
                Division
              </Text>
              {Platform.OS === 'ios' ? (
                <TouchableOpacity
                  style={styles.selectButton}
                  onPress={() => setShowDivisionPicker(true)}
                >
                  <Text
                    variant="body"
                    color={division ? 'charcoal' : 'slate'}
                  >
                    {division || 'Sélectionner une division'}
                  </Text>
                  <Ionicons name="chevron-down" size={20} color={Colors.neutral.slate} />
                </TouchableOpacity>
              ) : (
                <View style={styles.pickerContainer}>
                  <Picker
                    selectedValue={division}
                    onValueChange={(value) => setDivision(value as ProDivision)}
                    style={styles.picker}
                  >
                    <Picker.Item label="Sélectionner une division" value="" />
                    {PRO_DIVISIONS.map((div) => (
                      <Picker.Item key={div} label={div} value={div} />
                    ))}
                  </Picker>
                </View>
              )}
              <Text variant="caption" color="slate" style={styles.helperText}>
                Circuit professionnel
              </Text>
            </View>

            {/* Classement mondial */}
            <Input
              label="Classement mondial"
              value={worldRanking}
              onChangeText={(text) => {
                // Permettre seulement les chiffres
                const numbersOnly = text.replace(/[^0-9]/g, '');
                setWorldRanking(numbersOnly);
              }}
              placeholder="150"
              keyboardType="numeric"
              helperText="Position mondiale (optionnel)"
              maxLength={5}
            />
          </View>

          <Button
            variant="primary"
            size="large"
            onPress={handleSave}
            loading={isLoading}
            disabled={isLoading}
            style={styles.saveButton}
          >
            {isLoading ? 'Enregistrement...' : 'Enregistrer les modifications'}
          </Button>
        </ScrollView>

        {/* Modal iOS pour la sélection de division */}
        {Platform.OS === 'ios' && (
          <Modal
            visible={showDivisionPicker}
            transparent={true}
            animationType="slide"
            onRequestClose={() => setShowDivisionPicker(false)}
          >
            <TouchableOpacity
              style={styles.pickerModalOverlay}
              activeOpacity={1}
              onPress={() => setShowDivisionPicker(false)}
            >
              <View style={styles.pickerModalContent}>
                <View style={styles.pickerModalHeader}>
                  <TouchableOpacity onPress={() => setShowDivisionPicker(false)}>
                    <Text variant="body" color="accent" weight="medium">
                      Annuler
                    </Text>
                  </TouchableOpacity>
                  <Text variant="body" color="charcoal" weight="semiBold">
                    Choisir une division
                  </Text>
                  <TouchableOpacity onPress={() => setShowDivisionPicker(false)}>
                    <Text variant="body" color="accent" weight="medium">
                      OK
                    </Text>
                  </TouchableOpacity>
                </View>
                <Picker
                  selectedValue={division}
                  onValueChange={(value) => setDivision(value as ProDivision)}
                  style={styles.iosPicker}
                >
                  <Picker.Item label="Aucune division" value="" />
                  {PRO_DIVISIONS.map((div) => (
                    <Picker.Item key={div} label={div} value={div} />
                  ))}
                </Picker>
              </View>
            </TouchableOpacity>
          </Modal>
        )}
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: Colors.neutral.white,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.l,
    paddingVertical: Spacing.m,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral.mist,
  },
  closeButton: {
    padding: Spacing.xs,
  },
  scrollContent: {
    paddingHorizontal: Spacing.l,
    paddingBottom: Spacing.xl,
  },
  avatarSection: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
  },
  avatarTouchable: {
    position: 'relative',
  },
  cameraOverlay: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: Colors.primary.navy,
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.neutral.white,
  },
  selectedText: {
    marginTop: Spacing.s,
  },
  form: {
    marginBottom: Spacing.xl,
  },
  row: {
    flexDirection: 'row',
    gap: Spacing.m,
  },
  halfInput: {
    flex: 1,
  },
  saveButton: {
    marginTop: Spacing.l,
  },
  inputContainer: {
    marginBottom: Spacing.m,
  },
  label: {
    marginBottom: Spacing.xs,
  },
  selectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.m,
    paddingVertical: Spacing.m,
    backgroundColor: Colors.neutral.pearl,
    borderRadius: BorderRadius.small,
    borderWidth: 1,
    borderColor: Colors.neutral.mist,
  },
  pickerContainer: {
    backgroundColor: Colors.neutral.pearl,
    borderRadius: BorderRadius.small,
    borderWidth: 1,
    borderColor: Colors.neutral.mist,
    overflow: 'hidden',
  },
  picker: {
    height: 50,
  },
  helperText: {
    marginTop: Spacing.xs,
  },
  pickerModalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  pickerModalContent: {
    backgroundColor: Colors.neutral.white,
    borderTopLeftRadius: BorderRadius.large,
    borderTopRightRadius: BorderRadius.large,
  },
  pickerModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.m,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral.mist,
  },
  iosPicker: {
    height: 200,
  },
});