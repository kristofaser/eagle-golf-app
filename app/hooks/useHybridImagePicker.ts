import { useState } from 'react';
import { Alert } from 'react-native';

export interface HybridImageResult {
  uri: string;
  width?: number;
  height?: number;
  type?: string;
  fileSize?: number;
}

// Images de test en fallback
const FALLBACK_IMAGES = [
  'https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=400&h=400&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=400&h=400&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&h=400&fit=crop&crop=face',
];

export function useHybridImagePicker() {
  const [loading, setLoading] = useState(false);

  const showImagePicker = async (): Promise<HybridImageResult | null> => {
    setLoading(true);

    try {
      // Essayer d'importer expo-image-picker
      try {
        const ImagePicker = require('expo-image-picker');

        // Vérifier que les fonctions existent
        if (
          ImagePicker &&
          ImagePicker.requestMediaLibraryPermissionsAsync &&
          ImagePicker.launchImageLibraryAsync
        ) {
          return await useNativeImagePicker(ImagePicker);
        } else {
          throw new Error('ImagePicker functions not available');
        }
      } catch (error) {
        // expo-image-picker non disponible, utilisation du fallback
        return await useFallbackImagePicker();
      }
    } finally {
      setLoading(false);
    }
  };

  const useNativeImagePicker = async (ImagePicker: any): Promise<HybridImageResult | null> => {
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
              const result = await takePhotoNative(ImagePicker);
              resolve(result);
            },
          },
          {
            text: 'Choisir dans la galerie',
            onPress: async () => {
              const result = await pickFromGalleryNative(ImagePicker);
              resolve(result);
            },
          },
        ],
        { cancelable: true, onDismiss: () => resolve(null) }
      );
    });
  };

  const useFallbackImagePicker = async (): Promise<HybridImageResult | null> => {
    return new Promise((resolve) => {
      const imageOptions = FALLBACK_IMAGES.map((url, index) => ({
        text: `Image ${index + 1}`,
        onPress: () => resolve({ uri: url }),
      }));

      Alert.alert(
        'Choisir une photo (mode test)',
        'expo-image-picker non disponible, sélectionnez une image de test',
        [
          {
            text: 'Annuler',
            style: 'cancel',
            onPress: () => resolve(null),
          },
          ...imageOptions,
        ],
        { cancelable: true, onDismiss: () => resolve(null) }
      );
    });
  };

  const takePhotoNative = async (ImagePicker: any): Promise<HybridImageResult | null> => {
    try {
      // Demander permissions
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (permission.status !== 'granted') {
        Alert.alert('Permission refusée', 'Accès à la caméra requis');
        return null;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
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
      console.error('Erreur caméra:', error);
      Alert.alert('Erreur', "Impossible d'accéder à la caméra");
      return null;
    }
  };

  const pickFromGalleryNative = async (ImagePicker: any): Promise<HybridImageResult | null> => {
    try {
      // Demander permissions
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (permission.status !== 'granted') {
        Alert.alert('Permission refusée', 'Accès aux photos requis');
        return null;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
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
      console.error('Erreur galerie:', error);
      Alert.alert('Erreur', "Impossible d'accéder à la galerie");
      return null;
    }
  };

  const validateImage = (image: HybridImageResult): { isValid: boolean; error?: string } => {
    // Vérifier la taille du fichier (max 5MB)
    if (image.fileSize && image.fileSize > 5 * 1024 * 1024) {
      return {
        isValid: false,
        error: "L'image est trop grande (max 5MB)",
      };
    }

    // Vérifier les dimensions minimales
    if (image.width && image.height && (image.width < 150 || image.height < 150)) {
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
    validateImage,
  };
}
