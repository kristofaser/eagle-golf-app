import { useState } from 'react';
import { Alert } from 'react-native';
import { useSimpleImagePicker, SimpleImageResult } from './useSimpleImagePicker';
import { useUser } from './useUser';
import { ProfileService } from '@/services/profile.service';

export function useProfileUpload() {
  const [uploading, setUploading] = useState(false);
  const [tempImageUri, setTempImageUri] = useState<string | null>(null);
  const { user, updateProfile } = useUser();
  const { showImagePicker, validateImage } = useSimpleImagePicker();

  const profileService = new ProfileService();

  const handleImageSelection = async (): Promise<void> => {
    try {
      const selectedImage = await showImagePicker();

      if (!selectedImage) {
        return; // Utilisateur a annulé
      }

      // Valider l'image
      const validation = validateImage(selectedImage);
      if (!validation.isValid) {
        Alert.alert('Image invalide', validation.error || "L'image sélectionnée n'est pas valide");
        return;
      }

      // Afficher un aperçu temporaire
      setTempImageUri(selectedImage.uri);

      // Demander confirmation avant upload
      Alert.alert(
        'Confirmer le changement',
        'Voulez-vous utiliser cette image comme photo de profil ?',
        [
          {
            text: 'Annuler',
            style: 'cancel',
            onPress: () => setTempImageUri(null),
          },
          {
            text: 'Confirmer',
            onPress: () => uploadImage(selectedImage),
          },
        ]
      );
    } catch (error) {
      console.error("Erreur lors de la sélection d'image:", error);
      Alert.alert('Erreur', "Une erreur est survenue lors de la sélection de l'image");
    }
  };

  const uploadImage = async (image: SimpleImageResult): Promise<void> => {
    if (!user?.id) {
      Alert.alert('Erreur', 'Vous devez être connecté pour changer votre photo');
      return;
    }

    setUploading(true);

    try {
      // Pour les images de test, on met à jour directement l'URL
      // (en production, on uploadera vers Supabase)
      const uploadResult = {
        data: image.uri,
        error: null,
      };

      if (uploadResult.error) {
        throw new Error(uploadResult.error.message);
      }

      // Mettre à jour le profil local
      if (user.profile && uploadResult.data) {
        const updatedProfile = {
          ...user.profile,
          avatar_url: uploadResult.data,
        };

        await updateProfile(updatedProfile);
      }

      // Nettoyer l'aperçu temporaire
      setTempImageUri(null);

      Alert.alert('Succès', 'Votre photo de profil a été mise à jour !', [{ text: 'OK' }]);
    } catch (error: any) {
      console.error("Erreur lors de l'upload:", error);
      Alert.alert(
        "Erreur d'upload",
        error.message || 'Impossible de mettre à jour votre photo de profil'
      );
      setTempImageUri(null);
    } finally {
      setUploading(false);
    }
  };

  const removeProfileImage = async (): Promise<void> => {
    if (!user?.profile?.avatar_url) {
      return;
    }

    Alert.alert(
      'Supprimer la photo',
      'Êtes-vous sûr de vouloir supprimer votre photo de profil ?',
      [
        {
          text: 'Annuler',
          style: 'cancel',
        },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            setUploading(true);
            try {
              const updatedProfile = {
                ...user.profile!,
                avatar_url: null,
              };

              await updateProfile(updatedProfile);

              Alert.alert('Succès', 'Photo de profil supprimée');
            } catch (error: any) {
              console.error('Erreur lors de la suppression:', error);
              Alert.alert('Erreur', 'Impossible de supprimer la photo');
            } finally {
              setUploading(false);
            }
          },
        },
      ]
    );
  };

  const cancelTempImage = (): void => {
    setTempImageUri(null);
  };

  return {
    uploading,
    tempImageUri,
    handleImageSelection,
    removeProfileImage,
    cancelTempImage,
  };
}
