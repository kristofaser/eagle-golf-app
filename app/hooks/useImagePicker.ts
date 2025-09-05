import { useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { Alert } from 'react-native';

export interface ImagePickerResult {
  uri: string;
  width: number;
  height: number;
  type?: string;
  fileSize?: number;
}

export function useImagePicker() {
  const [loading, setLoading] = useState(false);

  const requestPermissions = async (): Promise<boolean> => {
    try {
      const cameraPermission = await ImagePicker.requestCameraPermissionsAsync();
      const mediaLibraryPermission = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (cameraPermission.status !== 'granted' || mediaLibraryPermission.status !== 'granted') {
        Alert.alert(
          'Permissions requises',
          "Cette application a besoin d'accéder à votre caméra et à vos photos pour changer votre photo de profil.",
          [{ text: 'OK' }]
        );
        return false;
      }

      return true;
    } catch (error) {
      console.error('Erreur lors de la demande de permissions:', error);
      return false;
    }
  };

  const showImagePicker = async (): Promise<ImagePickerResult | null> => {
    setLoading(true);

    try {
      const hasPermissions = await requestPermissions();
      if (!hasPermissions) {
        return null;
      }

      return new Promise((resolve) => {
        Alert.alert(
          'Changer la photo de profil',
          'Choisissez une option',
          [
            {
              text: 'Annuler',
              style: 'cancel',
              onPress: () => resolve(null),
            },
            {
              text: 'Prendre une photo',
              onPress: async () => {
                const result = await takePhoto();
                resolve(result);
              },
            },
            {
              text: 'Choisir dans la galerie',
              onPress: async () => {
                const result = await pickFromGallery();
                resolve(result);
              },
            },
          ],
          { cancelable: true, onDismiss: () => resolve(null) }
        );
      });
    } finally {
      setLoading(false);
    }
  };

  const takePhoto = async (): Promise<ImagePickerResult | null> => {
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1], // Format carré pour la photo de profil
        quality: 0.8,
        base64: false,
      });

      if (!result.canceled && result.assets?.[0]) {
        const asset = result.assets[0];
        return {
          uri: asset.uri,
          width: asset.width,
          height: asset.height,
          type: asset.type,
          fileSize: asset.fileSize,
        };
      }

      return null;
    } catch (error) {
      console.error('Erreur lors de la prise de photo:', error);
      Alert.alert('Erreur', 'Impossible de prendre la photo');
      return null;
    }
  };

  const pickFromGallery = async (): Promise<ImagePickerResult | null> => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1], // Format carré pour la photo de profil
        quality: 0.8,
        base64: false,
      });

      if (!result.canceled && result.assets?.[0]) {
        const asset = result.assets[0];
        return {
          uri: asset.uri,
          width: asset.width,
          height: asset.height,
          type: asset.type,
          fileSize: asset.fileSize,
        };
      }

      return null;
    } catch (error) {
      console.error("Erreur lors de la sélection d'image:", error);
      Alert.alert('Erreur', "Impossible de sélectionner l'image");
      return null;
    }
  };

  const validateImage = (image: ImagePickerResult): { isValid: boolean; error?: string } => {
    // Vérifier la taille du fichier (max 5MB)
    if (image.fileSize && image.fileSize > 5 * 1024 * 1024) {
      return {
        isValid: false,
        error: "L'image est trop grande (max 5MB)",
      };
    }

    // Vérifier les dimensions minimales
    if (image.width < 150 || image.height < 150) {
      return {
        isValid: false,
        error: "L'image doit faire au moins 150x150 pixels",
      };
    }

    return { isValid: true };
  };

  return {
    loading,
    showImagePicker,
    takePhoto,
    pickFromGallery,
    validateImage,
    requestPermissions,
  };
}
