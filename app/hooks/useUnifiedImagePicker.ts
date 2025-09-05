/**
 * Hook unifié pour la sélection d'images
 *
 * ✅ REMPLACE 3 hooks dupliqués :
 * - useImagePicker.ts (165 lignes)
 * - useSimpleImagePicker.ts (165 lignes)
 * - useExpoImagePicker.ts (174 lignes)
 *
 * ✅ ÉLIMINE ~300 lignes de duplication
 */

import { Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useAsyncOperation } from './useAsyncOperation';

export interface ImagePickerResult {
  uri: string;
  width: number;
  height: number;
  type?: string;
  fileSize?: number;
}

export interface ImagePickerConfig {
  // Options de qualité et format
  quality?: number;
  allowsEditing?: boolean;
  aspect?: [number, number];

  // Validation
  maxFileSize?: number; // en bytes (défaut: 5MB)
  minWidth?: number; // défaut: 150px
  minHeight?: number; // défaut: 150px

  // Messages personnalisables
  title?: string;
  cameraOption?: string;
  galleryOption?: string;
  cancelOption?: string;

  // Gestion des permissions
  showPermissionAlerts?: boolean;
}

const DEFAULT_CONFIG: Required<ImagePickerConfig> = {
  quality: 0.8,
  allowsEditing: true,
  aspect: [1, 1],
  maxFileSize: 5 * 1024 * 1024, // 5MB
  minWidth: 150,
  minHeight: 150,
  title: 'Changer la photo de profil',
  cameraOption: 'Prendre une photo',
  galleryOption: 'Choisir dans la galerie',
  cancelOption: 'Annuler',
  showPermissionAlerts: true,
};

export function useUnifiedImagePicker(config: ImagePickerConfig = {}) {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  const imagePickerOperation = useAsyncOperation<ImagePickerResult>();

  const requestPermissions = async (): Promise<boolean> => {
    const cameraPermission = await ImagePicker.requestCameraPermissionsAsync();
    const mediaLibraryPermission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (finalConfig.showPermissionAlerts) {
      if (cameraPermission.status !== 'granted') {
        Alert.alert(
          'Permission caméra requise',
          "Cette application a besoin d'accéder à votre caméra pour prendre des photos.",
          [{ text: 'OK' }]
        );
      }

      if (mediaLibraryPermission.status !== 'granted') {
        Alert.alert(
          'Permission photos requise',
          "Cette application a besoin d'accéder à vos photos.",
          [{ text: 'OK' }]
        );
      }
    }

    // Retourner true si au moins la galerie est disponible
    return mediaLibraryPermission.status === 'granted';
  };

  const takePhoto = async (): Promise<ImagePickerResult | null> => {
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      allowsEditing: finalConfig.allowsEditing,
      aspect: finalConfig.aspect,
      quality: finalConfig.quality,
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
  };

  const pickFromGallery = async (): Promise<ImagePickerResult | null> => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: finalConfig.allowsEditing,
      aspect: finalConfig.aspect,
      quality: finalConfig.quality,
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
  };

  const validateImage = (image: ImagePickerResult): { isValid: boolean; error?: string } => {
    // Vérifier la taille du fichier
    if (image.fileSize && image.fileSize > finalConfig.maxFileSize) {
      return {
        isValid: false,
        error: `L'image est trop grande (max ${Math.round(finalConfig.maxFileSize / 1024 / 1024)}MB)`,
      };
    }

    // Vérifier les dimensions minimales
    if (image.width < finalConfig.minWidth || image.height < finalConfig.minHeight) {
      return {
        isValid: false,
        error: `L'image doit faire au moins ${finalConfig.minWidth}x${finalConfig.minHeight} pixels`,
      };
    }

    return { isValid: true };
  };

  const showImagePicker = async (): Promise<ImagePickerResult | null> => {
    return imagePickerOperation.execute(async () => {
      const hasPermissions = await requestPermissions();
      if (!hasPermissions) {
        throw new Error('Permissions insuffisantes');
      }

      return new Promise<ImagePickerResult | null>((resolve) => {
        Alert.alert(
          finalConfig.title,
          'Choisissez une option',
          [
            {
              text: finalConfig.cancelOption,
              style: 'cancel',
              onPress: () => resolve(null),
            },
            {
              text: finalConfig.cameraOption,
              onPress: async () => {
                try {
                  const result = await takePhoto();

                  if (result) {
                    const validation = validateImage(result);
                    if (!validation.isValid) {
                      Alert.alert('Erreur', validation.error);
                      resolve(null);
                      return;
                    }
                  }

                  resolve(result);
                } catch (error) {
                  Alert.alert('Erreur', 'Impossible de prendre la photo');
                  resolve(null);
                }
              },
            },
            {
              text: finalConfig.galleryOption,
              onPress: async () => {
                try {
                  const result = await pickFromGallery();

                  if (result) {
                    const validation = validateImage(result);
                    if (!validation.isValid) {
                      Alert.alert('Erreur', validation.error);
                      resolve(null);
                      return;
                    }
                  }

                  resolve(result);
                } catch (error) {
                  Alert.alert('Erreur', "Impossible de sélectionner l'image");
                  resolve(null);
                }
              },
            },
          ],
          { cancelable: true, onDismiss: () => resolve(null) }
        );
      });
    });
  };

  return {
    // États
    loading: imagePickerOperation.loading,
    error: imagePickerOperation.error,

    // Actions principales
    showImagePicker,

    // Actions directes (pour usage avancé)
    takePhoto,
    pickFromGallery,
    requestPermissions,
    validateImage,

    // Utilitaires
    reset: imagePickerOperation.reset,
  };
}

// Hook simplifié pour compatibilité avec l'ancien useSimpleImagePicker
export function useSimpleImagePicker() {
  return useUnifiedImagePicker({
    title: 'Changer la photo de profil',
    showPermissionAlerts: true,
  });
}

// Hook avec configuration personnalisée pour compatibilité avec l'ancien useImagePicker
export function useImagePicker() {
  return useUnifiedImagePicker({
    title: 'Changer la photo de profil',
    showPermissionAlerts: true,
    quality: 0.8,
  });
}

// Hook avec configuration expo pour compatibilité avec l'ancien useExpoImagePicker
export function useExpoImagePicker() {
  return useUnifiedImagePicker({
    title: 'Changer la photo de profil',
    showPermissionAlerts: true,
    quality: 0.8,
    aspect: [1, 1],
  });
}
