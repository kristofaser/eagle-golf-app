/**
 * Hook unifié et complet pour la sélection et l'upload d'images
 *
 * ✨ REMPLACE LES 7 HOOKS :
 * - useImagePicker
 * - useSimpleImagePicker
 * - useExpoImagePicker
 * - useHybridImagePicker
 * - useUnifiedImagePicker
 * - useProfileUpload
 * - useSimpleProfileUpload
 *
 * ✅ Une seule source de vérité
 * ✅ Configuration flexible
 * ✅ Support upload Supabase
 * ✅ Rétrocompatibilité totale
 */

import { useState, useCallback } from 'react';
import { Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useAsyncOperation } from './useAsyncOperation';
import { profileService } from '@/services/profile.service';
import { useUser } from './useUser';
import { logger } from '@/utils/logger';
import { supabase } from '@/utils/supabase/client';

// ============================================
// Types et Interfaces
// ============================================

export interface ImageResult {
  uri: string;
  width: number;
  height: number;
  type?: string;
  fileSize?: number;
  fileName?: string;
  base64?: string;
}

export interface ImageUploadConfig {
  // === Options de sélection ===
  source?: 'camera' | 'gallery' | 'both'; // défaut: 'both'
  quality?: number; // 0-1, défaut: 0.8
  allowsEditing?: boolean; // défaut: true
  aspect?: [number, number]; // défaut: [1, 1]
  base64?: boolean; // inclure base64, défaut: false

  // === Validation ===
  maxFileSize?: number; // en bytes, défaut: 5MB
  minWidth?: number; // défaut: 150px
  minHeight?: number; // défaut: 150px
  allowedTypes?: string[]; // défaut: ['image/jpeg', 'image/png']

  // === Upload Supabase ===
  uploadTo?: 'profile' | 'custom' | null; // défaut: null (pas d'upload)
  bucket?: string; // nom du bucket Supabase
  path?: string; // chemin custom dans le bucket
  autoUpload?: boolean; // upload automatique après sélection

  // === UI / Messages ===
  title?: string;
  cameraButtonText?: string;
  galleryButtonText?: string;
  cancelButtonText?: string;
  showPermissionAlerts?: boolean;
  confirmBeforeUpload?: boolean;

  // === Callbacks ===
  onImageSelected?: (image: ImageResult) => void;
  onUploadProgress?: (progress: number) => void;
  onUploadComplete?: (url: string) => void;
  onError?: (error: Error) => void;
}

const DEFAULT_CONFIG: Required<
  Omit<ImageUploadConfig, 'onImageSelected' | 'onUploadProgress' | 'onUploadComplete' | 'onError'>
> = {
  source: 'both',
  quality: 0.8,
  allowsEditing: true,
  aspect: [1, 1],
  base64: false,
  maxFileSize: 5 * 1024 * 1024, // 5MB
  minWidth: 150,
  minHeight: 150,
  allowedTypes: ['image/jpeg', 'image/png'],
  uploadTo: null,
  bucket: 'avatars',
  path: '',
  autoUpload: false,
  title: 'Sélectionner une image',
  cameraButtonText: 'Prendre une photo',
  galleryButtonText: 'Choisir dans la galerie',
  cancelButtonText: 'Annuler',
  showPermissionAlerts: true,
  confirmBeforeUpload: true,
};

// ============================================
// Hook Principal
// ============================================

export function useImageUpload(config: ImageUploadConfig = {}) {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };

  const [selectedImage, setSelectedImage] = useState<ImageResult | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);

  const { user, updateProfile } = useUser();
  const imageOperation = useAsyncOperation<ImageResult>();
  const uploadOperation = useAsyncOperation<string>();

  // ============================================
  // Permissions
  // ============================================

  const requestPermissions = useCallback(async (): Promise<boolean> => {
    try {
      const permissions = await Promise.all([
        finalConfig.source !== 'gallery'
          ? ImagePicker.requestCameraPermissionsAsync()
          : Promise.resolve({ status: 'granted' }),
        finalConfig.source !== 'camera'
          ? ImagePicker.requestMediaLibraryPermissionsAsync()
          : Promise.resolve({ status: 'granted' }),
      ]);

      const allGranted = permissions.every((p) => p.status === 'granted');

      if (!allGranted && finalConfig.showPermissionAlerts) {
        Alert.alert(
          'Permissions requises',
          "Cette application a besoin d'accéder à votre caméra et/ou galerie.",
          [{ text: 'OK' }]
        );
      }

      return allGranted;
    } catch (error) {
      logger.error('Erreur permissions:', error);
      return false;
    }
  }, [finalConfig.source, finalConfig.showPermissionAlerts]);

  // ============================================
  // Validation
  // ============================================

  const validateImage = useCallback(
    (image: ImageResult): { isValid: boolean; error?: string } => {
      // Validation taille fichier
      if (image.fileSize && image.fileSize > finalConfig.maxFileSize) {
        const maxMB = (finalConfig.maxFileSize / (1024 * 1024)).toFixed(1);
        return { isValid: false, error: `L'image dépasse ${maxMB}MB` };
      }

      // Validation dimensions
      if (image.width < finalConfig.minWidth || image.height < finalConfig.minHeight) {
        return {
          isValid: false,
          error: `L'image doit faire au moins ${finalConfig.minWidth}x${finalConfig.minHeight}px`,
        };
      }

      // Validation type
      if (image.type && !finalConfig.allowedTypes.includes(image.type)) {
        return { isValid: false, error: "Format d'image non supporté" };
      }

      return { isValid: true };
    },
    [finalConfig]
  );

  // ============================================
  // Sélection d'image
  // ============================================

  const takePhoto = useCallback(async (): Promise<ImageResult | null> => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return null;

    const result = await ImagePicker.launchCameraAsync({
      quality: finalConfig.quality,
      allowsEditing: finalConfig.allowsEditing,
      aspect: finalConfig.aspect,
      base64: finalConfig.base64,
    });

    if (result.canceled || !result.assets?.[0]) return null;

    const asset = result.assets[0];
    return {
      uri: asset.uri,
      width: asset.width,
      height: asset.height,
      type: asset.type,
      fileSize: asset.fileSize,
      fileName: asset.fileName,
      base64: asset.base64,
    };
  }, [finalConfig, requestPermissions]);

  const pickFromGallery = useCallback(async (): Promise<ImageResult | null> => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return null;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: finalConfig.quality,
      allowsEditing: finalConfig.allowsEditing,
      aspect: finalConfig.aspect,
      base64: finalConfig.base64,
    });

    if (result.canceled || !result.assets?.[0]) return null;

    const asset = result.assets[0];
    return {
      uri: asset.uri,
      width: asset.width,
      height: asset.height,
      type: asset.type || 'image/jpeg',
      fileSize: asset.fileSize,
      fileName: asset.fileName,
      base64: asset.base64,
    };
  }, [finalConfig, requestPermissions]);

  // ============================================
  // Upload vers Supabase
  // ============================================

  const uploadToSupabase = useCallback(
    async (image: ImageResult): Promise<string> => {
      if (finalConfig.uploadTo === 'profile' && user) {
        // Upload spécifique au profil
        // Convertir l'URI en blob pour l'upload
        const response = await fetch(image.uri);
        const blob = await response.blob();
        const result = await profileService.uploadAvatar(user.id, blob);

        if (result.error) {
          throw new Error(result.error.message);
        }

        const url = result.data!;
        // Mise à jour du profil
        await updateProfile({ avatar_url: url });

        return url;
      } else if (finalConfig.uploadTo === 'custom' && finalConfig.bucket) {
        // Upload custom
        const fileName = finalConfig.path
          ? `${finalConfig.path}/${Date.now()}.jpg`
          : `${Date.now()}.jpg`;

        // Ici, implémenter l'upload vers un bucket custom
        // const url = await supabase.storage.from(finalConfig.bucket).upload(fileName, image);
        // return url;

        throw new Error('Upload custom non implémenté');
      }

      throw new Error('Configuration upload invalide');
    },
    [finalConfig, user, profileService, updateProfile]
  );

  // ============================================
  // Action principale
  // ============================================

  const selectImage = useCallback(async (): Promise<ImageResult | null> => {
    return imageOperation.execute(async () => {
      let image: ImageResult | null = null;

      // Sélection selon la source
      if (finalConfig.source === 'camera') {
        image = await takePhoto();
      } else if (finalConfig.source === 'gallery') {
        image = await pickFromGallery();
      } else {
        // Mode 'both' - afficher un menu
        image = await new Promise<ImageResult | null>((resolve) => {
          Alert.alert(finalConfig.title, undefined, [
            {
              text: finalConfig.cancelButtonText,
              style: 'cancel',
              onPress: () => resolve(null),
            },
            {
              text: finalConfig.cameraButtonText,
              onPress: async () => resolve(await takePhoto()),
            },
            {
              text: finalConfig.galleryButtonText,
              onPress: async () => resolve(await pickFromGallery()),
            },
          ]);
        });
      }

      if (!image) return null;

      // Validation
      const validation = validateImage(image);
      if (!validation.isValid) {
        Alert.alert('Image invalide', validation.error);
        return null;
      }

      setSelectedImage(image);

      // Callback
      config.onImageSelected?.(image);

      // Upload automatique si configuré
      if (finalConfig.autoUpload && finalConfig.uploadTo) {
        await uploadImage(image);
      }

      return image;
    });
  }, [
    imageOperation,
    finalConfig,
    takePhoto,
    pickFromGallery,
    validateImage,
    config.onImageSelected,
  ]);

  const uploadImage = useCallback(
    async (image?: ImageResult): Promise<string | null> => {
      const imageToUpload = image || selectedImage;
      if (!imageToUpload) return null;

      if (finalConfig.confirmBeforeUpload) {
        return new Promise((resolve) => {
          Alert.alert('Confirmer', 'Voulez-vous utiliser cette image ?', [
            { text: 'Annuler', style: 'cancel', onPress: () => resolve(null) },
            {
              text: 'Confirmer',
              onPress: async () => {
                const url = await performUpload(imageToUpload);
                resolve(url);
              },
            },
          ]);
        });
      }

      return performUpload(imageToUpload);
    },
    [selectedImage, finalConfig.confirmBeforeUpload]
  );

  const performUpload = useCallback(
    async (image: ImageResult): Promise<string | null> => {
      return uploadOperation.execute(async () => {
        setUploadProgress(0);

        try {
          const url = await uploadToSupabase(image);

          setUploadProgress(100);
          setUploadedUrl(url);
          config.onUploadComplete?.(url);

          return url;
        } catch (error) {
          logger.error('Upload error:', error);
          config.onError?.(error as Error);
          throw error;
        }
      });
    },
    [uploadOperation, uploadToSupabase, config]
  );

  // ============================================
  // Interface publique
  // ============================================

  return {
    // États
    selectedImage,
    uploadedUrl,
    uploadProgress,
    loading: imageOperation.loading || uploadOperation.loading,
    selecting: imageOperation.loading,
    uploading: uploadOperation.loading,
    error: imageOperation.error || uploadOperation.error,

    // Actions principales
    selectImage,
    uploadImage,
    selectAndUpload: async () => {
      const image = await selectImage();
      if (image) {
        return uploadImage(image);
      }
      return null;
    },

    // Actions directes (usage avancé)
    takePhoto,
    pickFromGallery,
    validateImage,
    requestPermissions,

    // Reset
    reset: () => {
      setSelectedImage(null);
      setUploadedUrl(null);
      setUploadProgress(0);
      imageOperation.reset();
      uploadOperation.reset();
    },
  };
}

// ============================================
// Wrappers de compatibilité
// ============================================

// Remplace useSimpleImagePicker
export const useSimpleImagePicker = () =>
  useImageUpload({
    source: 'both',
    uploadTo: null,
    title: 'Changer la photo de profil',
  });

// Remplace useImagePicker
export const useImagePicker = () =>
  useImageUpload({
    source: 'both',
    uploadTo: null,
    quality: 0.8,
  });

// Remplace useExpoImagePicker
export const useExpoImagePicker = () =>
  useImageUpload({
    source: 'both',
    uploadTo: null,
    quality: 0.9,
    allowsEditing: false,
  });

// Remplace useHybridImagePicker
export const useHybridImagePicker = () =>
  useImageUpload({
    source: 'both',
    uploadTo: null,
    confirmBeforeUpload: false,
  });

// Remplace useProfileUpload
export const useProfileUpload = () =>
  useImageUpload({
    source: 'both',
    uploadTo: 'profile',
    autoUpload: false,
    confirmBeforeUpload: true,
    title: 'Photo de profil',
  });

// Remplace useSimpleProfileUpload
export const useSimpleProfileUpload = () => {
  const [tempImageUri, setTempImageUri] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [hasSelectedImage, setHasSelectedImage] = useState(false);

  const handleImageSelection = useCallback(async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission requise', "L'accès à la galerie est nécessaire.");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets?.[0]) {
        const asset = result.assets[0];
        setTempImageUri(asset.uri);
        setHasSelectedImage(true);
      }
    } catch (error) {
      logger.error('Erreur sélection image:', error);
      Alert.alert('Erreur', "Impossible de sélectionner l'image");
    }
  }, []);

  const uploadProfileImage = useCallback(
    async (userId: string) => {
      if (!tempImageUri || !hasSelectedImage) return null;

      setUploading(true);
      try {
        const fileName = `${userId}-${Date.now()}.jpg`;

        logger.dev('Uploading image from URI:', tempImageUri);

        // Utiliser FormData pour React Native (méthode simple et fiable)
        const formData = new FormData();
        const photo = {
          uri: tempImageUri,
          type: 'image/jpeg',
          name: fileName,
        } as any;

        formData.append('file', photo);

        logger.dev('FormData created with photo:', photo.name);

        // Upload via ProfileService
        const { data: avatarUrl, error } = await profileService.uploadAvatarWithFormData(
          userId,
          formData,
          fileName
        );

        if (error) {
          logger.error('Upload error:', error);
          throw error;
        }

        logger.dev('Upload successful, URL:', avatarUrl);
        setHasSelectedImage(false);
        return avatarUrl;
      } catch (error) {
        logger.error('Erreur upload:', error);
        throw error;
      } finally {
        setUploading(false);
      }
    },
    [tempImageUri, hasSelectedImage]
  );

  return {
    tempImageUri,
    uploading,
    hasSelectedImage,
    handleImageSelection,
    uploadProfileImage,
  };
};

// Remplace useUnifiedImagePicker (alias pour migration en douceur)
export const useUnifiedImagePicker = useImageUpload;
