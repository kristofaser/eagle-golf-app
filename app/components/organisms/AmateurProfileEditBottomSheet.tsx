import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  Modal,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Typography, BorderRadius } from '@/constants/theme';
import { Text, Input, Button, Avatar } from '@/components/atoms';
import { useSimpleProfileUpload } from '@/hooks/useImageUpload';
import { profileService, UpdateProfileData } from '@/services/profile.service';
import { FullProfile } from '@/services/profile.service';
import { useAuth } from '@/hooks/useAuth';

interface AmateurProfileEditBottomSheetProps {
  profile: FullProfile;
  visible: boolean;
  onClose: () => void;
  onProfileUpdated: () => void;
}

export function AmateurProfileEditBottomSheet({ profile, visible, onClose, onProfileUpdated }: AmateurProfileEditBottomSheetProps) {
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
  const [handicap, setHandicap] = useState(
    profile?.amateur_profiles?.handicap?.toString() || ''
  );
  const [licenseNumber, setLicenseNumber] = useState(
    profile?.amateur_profiles?.license_number || ''
  );
  const [isLoading, setIsLoading] = useState(false);

  // Réinitialiser les champs quand le profil change
  useEffect(() => {
    if (profile) {
      setFirstName(profile.first_name || '');
      setLastName(profile.last_name || '');
      setHandicap(profile.amateur_profiles?.handicap?.toString() || '');
      setLicenseNumber(profile.amateur_profiles?.license_number || '');
    }
  }, [profile]);

  const handleSave = async () => {
    if (!user?.id) {
      Alert.alert('Erreur', 'Utilisateur non connecté');
      return;
    }

    if (isLoading) return;

    // Validation du numéro de licence (9 chiffres)
    if (licenseNumber && (!/^\d{9}$/.test(licenseNumber))) {
      Alert.alert('Erreur', 'Le numéro de licence doit contenir exactement 9 chiffres');
      return;
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
        amateurProfile: {
          handicap: handicap ? parseInt(handicap) : null,
          license_number: licenseNumber || null,
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

            <Input
              label="Handicap"
              value={handicap}
              onChangeText={setHandicap}
              placeholder="18"
              keyboardType="numeric"
              helperText="Votre index officiel FFG"
            />

            <Input
              label="Numéro de licence FFG"
              value={licenseNumber}
              onChangeText={(text) => {
                // Permettre seulement les chiffres et limiter à 9 caractères
                const numbersOnly = text.replace(/[^0-9]/g, '').slice(0, 9);
                setLicenseNumber(numbersOnly);
              }}
              placeholder="123456789"
              keyboardType="numeric"
              helperText="9 chiffres - Optionnel"
              maxLength={9}
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
});