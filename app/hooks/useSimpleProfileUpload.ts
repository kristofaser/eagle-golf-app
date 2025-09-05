import { useState } from 'react';
import { Alert } from 'react-native';
import { useExpoImagePicker, ImagePickerResult } from './useExpoImagePicker';
import { profileService } from '@/services/profile.service';

export function useSimpleProfileUpload() {
  const [uploading, setUploading] = useState(false);
  const [tempImageUri, setTempImageUri] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<ImagePickerResult | null>(null);
  const { showImagePicker, validateImage } = useExpoImagePicker();

  const handleImageSelection = async (): Promise<void> => {
    try {
      const image = await showImagePicker();

      if (!image) {
        return; // Utilisateur a annulé
      }

      // Valider l'image
      const validation = validateImage(image);
      if (!validation.isValid) {
        Alert.alert('Image invalide', validation.error || "L'image sélectionnée n'est pas valide");
        return;
      }

      // Afficher un aperçu temporaire et garder l'image en mémoire
      setTempImageUri(image.uri);
      setSelectedImage(image);

      Alert.alert(
        'Photo sélectionnée',
        `Image prête à être uploadée !\nTaille: ${image.width}x${image.height}${image.fileSize ? `\nPoids: ${Math.round(image.fileSize / 1024)}KB` : ''}`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error("Erreur lors de la sélection d'image:", error);
      Alert.alert('Erreur', "Une erreur est survenue lors de la sélection de l'image");
    }
  };

  const uploadProfileImage = async (userId: string): Promise<string | null> => {
    if (!selectedImage) {
      // Pas d'image sélectionnée
      return null;
    }

    // Début de l'upload
    setUploading(true);

    try {
      // Upload de l'image pour l'utilisateur

      // Créer un FormData pour l'upload (meilleure compatibilité React Native)
      const formData = new FormData();
      const photo = {
        uri: selectedImage.uri,
        type: selectedImage.type || 'image/jpeg',
        name: `avatar-${userId}.jpg`,
      } as any;

      formData.append('file', photo);

      // Upload direct vers Supabase Storage avec FormData
      const { data: avatarUrl, error } = await profileService.uploadAvatarWithFormData(
        userId,
        formData,
        photo.name
      );

      if (error) {
        console.error('Erreur service upload:', error);
        throw error;
      }

      // Upload réussi

      // Réinitialiser l'image sélectionnée après un upload réussi
      setSelectedImage(null);
      setTempImageUri(null);

      return avatarUrl;
    } catch (error) {
      console.error("Erreur lors de l'upload de l'image:", error);
      throw error;
    } finally {
      // Fin de l'upload
      setUploading(false);
    }
  };

  const cancelTempImage = (): void => {
    setTempImageUri(null);
    setSelectedImage(null);
  };

  return {
    uploading,
    tempImageUri,
    handleImageSelection,
    uploadProfileImage,
    cancelTempImage,
    hasSelectedImage: !!selectedImage,
  };
}
