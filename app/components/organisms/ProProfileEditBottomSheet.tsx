import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView, Modal, SafeAreaView } from 'react-native';
import { UniversalAlert } from '@/utils/alert';
import { toast } from '@/utils/toast';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius } from '@/constants/theme';
import { Text, Input, Button, Avatar } from '@/components/atoms';
import { useSimpleProfileUpload } from '@/hooks/useImageUpload';
import { profileService, UpdateProfileData } from '@/services/profile.service';
import { FullProfile } from '@/services/profile.service';
import { useAuth } from '@/hooks/useAuth';

// Type pour les divisions
type ProDivision = 'DP World' | 'Ladies European Tour' | 'Legends Tour' | 'Hotel Planner' | 'Alps Tour' | 'Pro Golf' | 'Circuit FR';

// Liste des divisions
const PRO_DIVISIONS = [
  { key: 'DP World', label: 'DP World' },
  { key: 'Ladies European Tour', label: 'Ladies European Tour' },
  { key: 'Legends Tour', label: 'Legends Tour' },
  { key: 'Hotel Planner', label: 'Hotel Planner' },
  { key: 'Alps Tour', label: 'Alps Tour' },
  { key: 'Pro Golf', label: 'Pro Golf' },
  { key: 'Circuit FR', label: 'Circuit FR' },
] as const;

interface ProProfileEditBottomSheetProps {
  profile: FullProfile;
  visible: boolean;
  onClose: () => void;
  onProfileUpdated: () => void;
}

export function ProProfileEditBottomSheet({
  profile,
  visible,
  onClose,
  onProfileUpdated,
}: ProProfileEditBottomSheetProps) {
  const { user, refreshSession, loadUserProfile } = useAuth();
  const {
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
  const [showDivisionModal, setShowDivisionModal] = useState(false);

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
      UniversalAlert.error('Erreur', 'Utilisateur non connecté');
      return;
    }

    if (isLoading) return;

    // Validation du world ranking (nombre positif)
    if (worldRanking) {
      const rankingNum = parseInt(worldRanking);
      if (isNaN(rankingNum) || rankingNum < 1) {
        UniversalAlert.error('Erreur', 'Le classement mondial doit être un nombre positif');
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
          UniversalAlert.info(
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

      toast.success('Mis à jour !');
      onProfileUpdated();
      onClose();
    } catch (error) {
      console.error('Erreur mise à jour profil:', error);
      UniversalAlert.error('Erreur', 'Impossible de mettre à jour le profil');
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
                <Ionicons name="camera" size={16} color={Colors.neutral.white} />
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
                  value={firstName}
                  onChangeText={setFirstName}
                  placeholder="Votre prénom"
                />
              </View>
              <View style={styles.halfInput}>
                <Input value={lastName} onChangeText={setLastName} placeholder="Votre nom" />
              </View>
            </View>

            {/* Division - Cliquable pour ouvrir modal */}
            <View style={styles.inputContainer}>
              <Text variant="label" color="charcoal" style={styles.label}>
                Division
              </Text>
              <TouchableOpacity
                style={styles.selectButton}
                onPress={() => setShowDivisionModal(true)}
                activeOpacity={0.7}
              >
                <Text variant="body" color={division ? 'charcoal' : 'slate'}>
                  {division || 'Sélectionner une division'}
                </Text>
                <Ionicons name="chevron-forward" size={20} color={Colors.neutral.slate} />
              </TouchableOpacity>
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
      </SafeAreaView>

      {/* Modal Division */}
      <Modal
        visible={showDivisionModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowDivisionModal(false)}
      >
        <SafeAreaView style={styles.divisionModalContainer}>
          <View style={styles.divisionModalHeader}>
            <Text variant="h3" color="charcoal" weight="semiBold">
              Division
            </Text>
            <TouchableOpacity onPress={() => setShowDivisionModal(false)} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={Colors.neutral.charcoal} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.divisionModalContent} showsVerticalScrollIndicator={false}>
            <Text variant="caption" color="iron" style={styles.divisionSubtitle}>
              Sélectionnez votre circuit professionnel
            </Text>

            <View style={styles.divisionsList}>
              {PRO_DIVISIONS.map((div, index) => {
                // Après Hotel Planner, on insère Alps Tour et Pro Golf côte à côte
                if (div.key === 'Hotel Planner') {
                  return (
                    <React.Fragment key="hotel-planner-group">
                      {/* Hotel Planner normal */}
                      <TouchableOpacity
                        style={[
                          styles.divisionItem,
                          division === 'Hotel Planner' && styles.divisionItemSelected,
                        ]}
                        onPress={() => {
                          setDivision('Hotel Planner');
                          setShowDivisionModal(false);
                        }}
                        activeOpacity={0.7}
                      >
                        <View style={styles.divisionContent}>
                          <Text
                            variant="body"
                            color={division === 'Hotel Planner' ? 'accent' : 'charcoal'}
                            weight={division === 'Hotel Planner' ? 'semiBold' : 'regular'}
                            style={styles.divisionLabel}
                          >
                            Hotel Planner
                          </Text>
                        </View>
                        {division === 'Hotel Planner' && (
                          <Ionicons name="checkmark-circle" size={24} color={Colors.primary.accent} />
                        )}
                      </TouchableOpacity>

                      {/* Ligne spéciale pour Alps Tour et Pro Golf côte à côte */}
                      <View style={styles.twoColumnsRow}>
                        {/* Alps Tour */}
                        <TouchableOpacity
                          style={[
                            styles.divisionItem,
                            styles.halfWidthItem,
                            division === 'Alps Tour' && styles.divisionItemSelected,
                          ]}
                          onPress={() => {
                            setDivision('Alps Tour');
                            setShowDivisionModal(false);
                          }}
                          activeOpacity={0.7}
                        >
                          <View style={styles.divisionContent}>
                            <Text
                              variant="body"
                              color={division === 'Alps Tour' ? 'accent' : 'charcoal'}
                              weight={division === 'Alps Tour' ? 'semiBold' : 'regular'}
                              style={styles.divisionLabel}
                            >
                              Alps Tour
                            </Text>
                          </View>
                          {division === 'Alps Tour' && (
                            <Ionicons
                              name="checkmark-circle"
                              size={24}
                              color={Colors.primary.accent}
                            />
                          )}
                        </TouchableOpacity>

                        {/* Pro Golf */}
                        <TouchableOpacity
                          style={[
                            styles.divisionItem,
                            styles.halfWidthItem,
                            division === 'Pro Golf' && styles.divisionItemSelected,
                          ]}
                          onPress={() => {
                            setDivision('Pro Golf');
                            setShowDivisionModal(false);
                          }}
                          activeOpacity={0.7}
                        >
                          <View style={styles.divisionContent}>
                            <Text
                              variant="body"
                              color={division === 'Pro Golf' ? 'accent' : 'charcoal'}
                              weight={division === 'Pro Golf' ? 'semiBold' : 'regular'}
                              style={styles.divisionLabel}
                            >
                              Pro Golf
                            </Text>
                          </View>
                          {division === 'Pro Golf' && (
                            <Ionicons
                              name="checkmark-circle"
                              size={24}
                              color={Colors.primary.accent}
                            />
                          )}
                        </TouchableOpacity>
                      </View>
                    </React.Fragment>
                  );
                }

                // On saute Alps Tour et Pro Golf car ils sont déjà rendus après Hotel Planner
                if (div.key === 'Alps Tour' || div.key === 'Pro Golf') {
                  return null;
                }

                const isSelected = division === div.key;
                return (
                  <TouchableOpacity
                    key={div.key}
                    style={[styles.divisionItem, isSelected && styles.divisionItemSelected]}
                    onPress={() => {
                      setDivision(div.key as ProDivision);
                      setShowDivisionModal(false);
                    }}
                    activeOpacity={0.7}
                  >
                    <View style={styles.divisionContent}>
                      <Text
                        variant="body"
                        color={isSelected ? 'accent' : 'charcoal'}
                        weight={isSelected ? 'semiBold' : 'regular'}
                        style={styles.divisionLabel}
                      >
                        {div.label}
                      </Text>
                    </View>
                    {isSelected && (
                      <Ionicons name="checkmark-circle" size={24} color={Colors.primary.accent} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>
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
  helperText: {
    marginTop: Spacing.xs,
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
    minHeight: 48,
  },
  // Styles Modal Division
  divisionModalContainer: {
    flex: 1,
    backgroundColor: Colors.neutral.pearl,
  },
  divisionModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.l,
    paddingVertical: Spacing.m,
    backgroundColor: Colors.neutral.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral.mist,
  },
  divisionModalContent: {
    flex: 1,
    padding: Spacing.l,
  },
  divisionSubtitle: {
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
  divisionLabel: {
    flex: 1,
  },
  twoColumnsRow: {
    flexDirection: 'row',
    gap: Spacing.s,
  },
  halfWidthItem: {
    flex: 1,
  },
});
