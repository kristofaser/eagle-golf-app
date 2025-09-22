import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
// Hooks temporairement désactivés pour debug
// import { useProtectedRoute } from '@/hooks/useProtectedRoute';
import { useUser } from '@/hooks/useUser';
import { useAuth } from '@/hooks/useAuth';
import { useSimpleProfileUpload } from '@/hooks/useImageUpload';
import { Text, Input, Button, Avatar } from '@/components/atoms';
import { Colors, Spacing } from '@/constants/theme';
import { profileService, UpdateProfileData } from '@/services/profile.service';

export default function EditProfileScreen() {
  const router = useRouter();

  // Protection automatique de la route - temporairement désactivé
  const isChecking = false;
  const { refreshSession, loadUserProfile } = useAuth();
  const { user, profile, fullName, isPro, isAmateur, amateurProfile, proProfile } = useUser();
  const {
    uploading: uploadingImage,
    tempImageUri,
    handleImageSelection,
    uploadProfileImage,
    hasSelectedImage,
  } = useSimpleProfileUpload();

  // États du formulaire - Profil de base
  const [firstName, setFirstName] = useState(profile?.first_name || '');
  const [lastName, setLastName] = useState(profile?.last_name || '');
  // Pour les pros uniquement
  const [phone, setPhone] = useState(profile?.phone || '');
  const [city, setCity] = useState(profile?.city || '');

  // États spécifiques Amateur
  const [handicap, setHandicap] = useState(amateurProfile?.handicap?.toString() || '');
  const [clubAffiliation, setClubAffiliation] = useState(amateurProfile?.club_affiliation || '');
  const [golfCourseId, setGolfCourseId] = useState(amateurProfile?.golf_course_id || '');
  const [licenseNumber, setLicenseNumber] = useState(amateurProfile?.license_number || '');

  const [isLoading, setIsLoading] = useState(false);

  // Timeout de sécurité pour éviter le blocage infini
  useEffect(() => {
    if (isLoading) {
      const timeout = setTimeout(() => {
        console.error('Timeout de sécurité - Réinitialisation de isLoading');
        setIsLoading(false);
        Alert.alert('Erreur', "L'opération a pris trop de temps. Veuillez réessayer.");
      }, 30000); // 30 secondes de timeout

      return () => clearTimeout(timeout);
    }
  }, [isLoading]);

  // Si on est encore en train de vérifier l'authentification
  if (isChecking) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text variant="body" color="gray">
            Chargement...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const handleSave = async () => {
    if (!user?.id) {
      Alert.alert('Erreur', 'Utilisateur non connecté');
      return;
    }

    // Vérifier qu'on n'est pas déjà en train de sauvegarder
    if (isLoading) {
      console.log('Sauvegarde déjà en cours, annulation');
      return;
    }

    console.log('=== Début handleSave ===');
    setIsLoading(true);

    try {
      // Upload de l'image si une nouvelle image a été sélectionnée
      let avatarUrl = null;
      if (hasSelectedImage) {
        try {
          console.log("Début upload de l'image...");
          avatarUrl = await uploadProfileImage(user.id);
          console.log('Image uploadée avec succès:', avatarUrl);
        } catch (uploadError) {
          console.error('Erreur upload image:', uploadError);
          // On continue la sauvegarde même si l'upload échoue
          Alert.alert(
            'Attention',
            "L'image n'a pas pu être uploadée, mais les autres modifications seront sauvegardées."
          );
        }
      }

      console.log('Préparation des données de mise à jour...');
      const updateData: UpdateProfileData = {
        profile: {
          first_name: firstName,
          last_name: lastName,
          // Inclure phone, city seulement pour les pros
          ...(isPro && { phone, city }),
          // Ajouter l'URL de l'avatar si elle a été uploadée
          ...(avatarUrl && { avatar_url: avatarUrl }),
        },
      };
      console.log('Données à mettre à jour:', JSON.stringify(updateData, null, 2));

      // Ajouter les données spécifiques selon le type d'utilisateur
      if (isAmateur) {
        updateData.amateurProfile = {
          handicap: handicap ? parseInt(handicap) : null,
          club_affiliation: clubAffiliation || null,
          golf_course_id: golfCourseId || null,
          license_number: licenseNumber || null,
        };
      }

      console.log('Appel updateProfile...');
      const { error } = await profileService.updateProfile(user.id, updateData);

      if (error) {
        console.error('Erreur retournée par updateProfile:', error);
        throw error;
      }

      console.log('Profil mis à jour avec succès');

      // Forcer le rechargement complet du profil utilisateur
      try {
        console.log('Rechargement de la session et du profil utilisateur...');
        await refreshSession();

        // Forcer aussi le rechargement explicite du profil utilisateur
        await loadUserProfile(user.id);

        // Petite pause pour laisser le temps aux contextes de se mettre à jour
        await new Promise((resolve) => setTimeout(resolve, 500));

        console.log('Rechargement terminé avec succès');
      } catch (refreshError) {
        console.log('Erreur rafraîchissement session/profil:', refreshError);
        // Continuer même si le refresh échoue
      }

      Alert.alert('Succès', 'Votre profil a été mis à jour avec succès', [
        {
          text: 'OK',
          onPress: () => {
            // Retourner au profil principal en remplaçant l'écran actuel
            router.replace('/profile');
          },
        },
      ]);
    } catch (error) {
      console.error('Erreur mise à jour profil:', error);
      Alert.alert('Erreur', 'Impossible de mettre à jour le profil');
    } finally {
      console.log('=== Fin handleSave - setIsLoading(false) ===');
      setIsLoading(false);
    }
  };

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: isPro ? 'Mon Profil Pro' : 'Mes Informations',
          headerStyle: {
            backgroundColor: Colors.neutral.background,
          },
          headerTitleStyle: {
            color: Colors.neutral.charcoal,
            fontWeight: '600',
          },
          headerLeft: () => (
            <TouchableOpacity
              onPress={() => router.back()}
              style={{ paddingLeft: 16, paddingVertical: 8 }}
            >
              <Ionicons name="arrow-back" size={24} color={Colors.neutral.charcoal} />
            </TouchableOpacity>
          ),
        }}
      />

      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Avatar */}
            <View style={styles.avatarSection}>
              <Avatar
                size="xlarge"
                name={fullName}
                source={
                  tempImageUri || profile?.avatar_url
                    ? { uri: tempImageUri || profile?.avatar_url }
                    : undefined
                }
              />
              <TouchableOpacity
                style={styles.changePhotoButton}
                onPress={handleImageSelection}
                disabled={isLoading}
              >
                <Text variant="body" color="primary">
                  {hasSelectedImage ? 'Photo sélectionnée ✓' : 'Changer la photo'}
                </Text>
              </TouchableOpacity>
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
                label="Email"
                value={user?.email || ''}
                editable={false}
                style={styles.disabledInput}
              />

              {/* Champs spécifiques aux pros */}
              {isPro && (
                <>
                  <Input
                    label="Téléphone"
                    value={phone}
                    onChangeText={setPhone}
                    placeholder="+33 6 12 34 56 78"
                    keyboardType="phone-pad"
                  />

                  <Input
                    label="Ville"
                    value={city}
                    onChangeText={setCity}
                    placeholder="Paris, Lyon, Marseille..."
                  />
                </>
              )}

              {/* Informations spécifiques Amateur */}
              {isAmateur && (
                <View style={styles.section}>
                  <Text variant="h4" color="charcoal" style={styles.sectionTitle}>
                    Informations Golf
                  </Text>

                  <Input
                    label="Handicap"
                    value={handicap}
                    onChangeText={setHandicap}
                    placeholder="18"
                    keyboardType="numeric"
                  />

                  <Input
                    label="Club d'affiliation"
                    value={clubAffiliation}
                    onChangeText={setClubAffiliation}
                    placeholder="Nom de votre club de golf (optionnel)"
                  />

                  <Input
                    label="Numéro de licence"
                    value={licenseNumber}
                    onChangeText={setLicenseNumber}
                    placeholder="Votre numéro de licence FFG (optionnel)"
                  />

                  <Input
                    label="Parcours de golf favori"
                    value={golfCourseId}
                    onChangeText={setGolfCourseId}
                    placeholder="Sélectionner un parcours (optionnel)"
                    editable={false}
                    style={styles.disabledInput}
                  />
                  <Text variant="caption" color="gray" style={styles.helperText}>
                    Parcours non référencé ? Vous pourrez le soumettre plus tard.
                  </Text>
                </View>
              )}


              <Button
                variant="primary"
                size="large"
                onPress={handleSave}
                loading={isLoading}
                disabled={isLoading}
                style={styles.saveButton}
              >
                {isLoading ? 'Enregistrement en cours...' : 'Enregistrer les modifications'}
              </Button>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.neutral.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: Spacing.l,
    paddingBottom: Spacing.xl,
  },
  avatarSection: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
  },
  changePhotoButton: {
    marginTop: Spacing.m,
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
  disabledInput: {
    backgroundColor: Colors.neutral.lightGray,
    opacity: 0.7,
  },
  section: {
    marginTop: Spacing.xl,
    paddingTop: Spacing.l,
    borderTopWidth: 1,
    borderTopColor: Colors.neutral.mist,
  },
  sectionTitle: {
    marginBottom: Spacing.l,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.m,
    paddingHorizontal: Spacing.s,
    backgroundColor: Colors.neutral.white,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.neutral.mist,
    marginVertical: Spacing.s,
  },
  switchContent: {
    flex: 1,
  },
  saveButton: {
    marginTop: Spacing.xl,
  },
  helperText: {
    marginTop: -Spacing.s,
    marginBottom: Spacing.s,
  },
});
