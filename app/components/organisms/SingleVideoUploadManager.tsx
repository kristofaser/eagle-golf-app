import React, { useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Alert,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { VideoView, useVideoPlayer } from 'expo-video';
import { Colors, Spacing, BorderRadius } from '@/constants/theme';
import { Text, Button } from '@/components/atoms';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { Video02Icon, CloudUploadIcon, Delete02Icon, Image02Icon } from '@hugeicons/core-free-icons';
import { useAuth } from '@/hooks/useAuth';
import { s3, getPublicUrl, generateVideoKey, BUCKET_NAME } from '@/utils/scaleway';
import { logger } from '@/utils/logger';

interface SingleVideoUploadManagerProps {
  skillKey: string;
  skillLabel: string;
  currentVideoUrl?: string;
  onVideoUploaded?: (skillKey: string, videoUrl: string) => void;
  onVideoDeleted?: (skillKey: string) => void;
}

interface UploadProgress {
  progress: number;
  isUploading: boolean;
}

export const SingleVideoUploadManager: React.FC<SingleVideoUploadManagerProps> = ({
  skillKey,
  skillLabel,
  currentVideoUrl,
  onVideoUploaded,
  onVideoDeleted,
}) => {
  const { user } = useAuth();
  const [uploadProgress, setUploadProgress] = useState<UploadProgress>({ progress: 0, isUploading: false });
  const [selectedVideo, setSelectedVideo] = useState<string>('');

  const updateUploadProgress = useCallback((progress: number, isUploading: boolean) => {
    setUploadProgress({ progress, isUploading });
  }, []);

  const selectVideo = useCallback(async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'video/*',
        copyToCacheDirectory: true,
        multiple: false,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];

        // Vérifier la taille du fichier (limite à 50MB)
        logger.dev('📁 Fichier sélectionné (DocumentPicker):', {
          name: asset.name,
          size: asset.size,
          sizeInMB: asset.size ? (asset.size / (1024 * 1024)).toFixed(2) : 'Inconnue',
          uri: asset.uri,
          mimeType: asset.mimeType
        });

        if (asset.size && asset.size > 50 * 1024 * 1024) {
          Alert.alert('Erreur', 'La vidéo ne peut pas dépasser 50MB');
          return;
        }

        if (asset.size === 0) {
          Alert.alert('Erreur', 'Le fichier sélectionné est vide');
          return;
        }

        setSelectedVideo(asset.uri);
      }
    } catch (error) {
      logger.error('Erreur lors de la sélection', error);
      Alert.alert('Erreur', 'Impossible de sélectionner la vidéo');
    }
  }, []);

  const selectFromGallery = useCallback(async () => {
    try {
      // Demander les permissions d'accès à la galerie
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (status !== 'granted') {
        Alert.alert('Permission requise', 'L\'accès à la galerie est nécessaire pour sélectionner une vidéo');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        allowsEditing: true,
        quality: 1,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];

        logger.dev('📸 Fichier sélectionné (ImagePicker):', {
          fileName: asset.fileName,
          fileSize: asset.fileSize,
          sizeInMB: asset.fileSize ? (asset.fileSize / (1024 * 1024)).toFixed(2) : 'Inconnue',
          uri: asset.uri,
          type: asset.type,
          width: asset.width,
          height: asset.height,
          duration: asset.duration
        });

        // Vérifier la taille du fichier (limite à 50MB)
        if (asset.fileSize && asset.fileSize > 50 * 1024 * 1024) {
          Alert.alert('Erreur', 'La vidéo ne peut pas dépasser 50MB');
          return;
        }

        if (asset.fileSize === 0) {
          Alert.alert('Erreur', 'Le fichier sélectionné est vide');
          return;
        }

        setSelectedVideo(asset.uri);
      }
    } catch (error) {
      logger.error('Erreur lors de la sélection depuis la galerie', error);
      Alert.alert('Erreur', 'Impossible de sélectionner la vidéo depuis la galerie');
    }
  }, []);

  const uploadVideo = useCallback(async () => {
    if (!user || !selectedVideo) return;

    try {
      logger.dev('🎬 DÉBUT UPLOAD VIDÉO SCALEWAY');
      logger.dev('📁 URI sélectionnée:', selectedVideo);
      logger.dev('👤 User ID:', user.id);
      logger.dev('🎯 Skill:', skillKey);

      updateUploadProgress(0, true);

      // Lire le fichier
      logger.dev('📖 Début lecture du fichier local...');
      const response = await fetch(selectedVideo);
      logger.dev('📡 Réponse fetch:', {
        ok: response.ok,
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries())
      });

      if (!response.ok) {
        throw new Error(`Échec du fetch: ${response.status} ${response.statusText}`);
      }

      const blob = await response.blob();
      logger.dev('📦 Blob créé:', {
        size: blob.size,
        type: blob.type,
        sizeInMB: (blob.size / (1024 * 1024)).toFixed(2)
      });

      if (blob.size === 0) {
        throw new Error('Le fichier vidéo est vide (0 bytes)');
      }

      // Générer la clé d'objet
      const objectKey = generateVideoKey(user.id, skillKey);
      logger.dev('Clé d\'objet générée:', objectKey);

      // Upload vers Scaleway Object Storage
      logger.dev('Début upload vers Scaleway Object Storage...');

      const uploadParams = {
        Bucket: BUCKET_NAME,
        Key: objectKey,
        Body: blob,
        ContentType: 'video/mp4',
        ACL: 'public-read', // Bucket public configuré
      };

      const result = await s3.upload(uploadParams, {
        partSize: 10 * 1024 * 1024, // 10MB chunks
        queueSize: 1,
      }).on('httpUploadProgress', (progress) => {
        const percentage = Math.round((progress.loaded / progress.total) * 100);
        updateUploadProgress(percentage, true);
        logger.dev(`Progress: ${percentage}% (${(progress.loaded / (1024 * 1024)).toFixed(2)}MB / ${(progress.total / (1024 * 1024)).toFixed(2)}MB)`);
      }).promise();

      logger.dev('Résultat upload Scaleway:', result);

      // Générer l'URL publique
      const publicUrl = getPublicUrl(objectKey);
      logger.dev('URL publique générée:', publicUrl);

      updateUploadProgress(100, false);

      // Nettoyer la sélection
      setSelectedVideo('');

      onVideoUploaded?.(skillKey, publicUrl);
      logger.dev('UPLOAD TERMINÉ AVEC SUCCÈS !');
      Alert.alert('Succès', 'Vidéo uploadée avec succès !');

    } catch (error) {
      logger.error('ERREUR UPLOAD SCALEWAY', error);
      logger.error('Stack trace:', error instanceof Error ? error.stack : 'Pas de stack trace');
      updateUploadProgress(0, false);
      Alert.alert('Erreur', `Impossible d'uploader la vidéo: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  }, [user, selectedVideo, skillKey, updateUploadProgress, onVideoUploaded]);

  const deleteVideo = useCallback(async () => {
    if (!user) return;

    Alert.alert(
      'Supprimer la vidéo',
      'Êtes-vous sûr de vouloir supprimer cette vidéo ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              const objectKey = generateVideoKey(user.id, skillKey);

              const deleteParams = {
                Bucket: BUCKET_NAME,
                Key: objectKey,
              };

              await s3.deleteObject(deleteParams).promise();

              onVideoDeleted?.(skillKey);
              Alert.alert('Succès', 'Vidéo supprimée');
            } catch (error) {
              logger.error('Erreur suppression Scaleway', error);
              Alert.alert('Erreur', 'Impossible de supprimer la vidéo');
            }
          },
        },
      ]
    );
  }, [user, skillKey, onVideoDeleted]);

  const hasCurrentVideo = !!currentVideoUrl;
  const hasSelectedVideo = !!selectedVideo;

  // Create video player for preview
  const previewVideoUrl = selectedVideo || currentVideoUrl;
  const player = useVideoPlayer(previewVideoUrl || '', player => {
    if (previewVideoUrl) {
      player.play();
      player.loop = false;
    }
  });

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.skillHeader}>
        <HugeiconsIcon
          icon={Video02Icon}
          size={24}
          color={Colors.primary.accent}
          strokeWidth={1.5}
        />
        <Text variant="h4" color="charcoal" weight="semiBold" style={styles.skillTitle}>
          {skillLabel}
        </Text>
      </View>

      {/* Vidéo actuelle ou sélectionnée */}
      {(hasCurrentVideo || hasSelectedVideo) && (
        <View style={styles.videoPreview}>
          <VideoView
            player={player}
            style={styles.videoThumbnail}
            nativeControls={true}
            contentFit="contain"
            onError={(error) => {
              logger.error('Erreur lecture vidéo', error);
            }}
          />
        </View>
      )}

      {/* Barre de progression */}
      {uploadProgress.isUploading && (
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${uploadProgress.progress}%` }]} />
          </View>
          <Text variant="caption" color="course">
            {Math.round(uploadProgress.progress)}%
          </Text>
        </View>
      )}

      {/* Actions */}
      <View style={styles.actionButtons}>
        {!hasSelectedVideo && !uploadProgress.isUploading && (
          <View style={styles.selectionButtons}>
            <TouchableOpacity
              style={styles.selectButton}
              onPress={selectFromGallery}
            >
              <HugeiconsIcon
                icon={Image02Icon}
                size={16}
                color={Colors.primary.accent}
                strokeWidth={1.5}
              />
              <Text variant="body" color="accent" weight="medium">
                Galerie
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.selectButton}
              onPress={selectVideo}
            >
              <HugeiconsIcon
                icon={CloudUploadIcon}
                size={16}
                color={Colors.primary.accent}
                strokeWidth={1.5}
              />
              <Text variant="body" color="accent" weight="medium">
                Fichiers
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {hasSelectedVideo && !uploadProgress.isUploading && (
          <Button
            variant="primary"
            size="small"
            onPress={uploadVideo}
          >
            Uploader
          </Button>
        )}

        {uploadProgress.isUploading && (
          <View style={styles.uploadingContainer}>
            <ActivityIndicator size="small" color={Colors.primary.accent} />
            <Text variant="body" color="accent" weight="medium">
              Upload en cours...
            </Text>
          </View>
        )}

        {hasCurrentVideo && !uploadProgress.isUploading && (
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={deleteVideo}
          >
            <HugeiconsIcon
              icon={Delete02Icon}
              size={16}
              color={Colors.semantic.error}
              strokeWidth={1.5}
            />
            <Text variant="body" color="error" weight="medium" style={styles.deleteText}>
              Supprimer
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Information */}
      <Text variant="caption" color="course" style={styles.infoText}>
        Formats supportés: MP4, MOV • Taille max: 50MB
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: Spacing.l,
  },
  skillHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.l,
  },
  skillTitle: {
    marginLeft: Spacing.s,
  },
  videoPreview: {
    position: 'relative',
    marginBottom: Spacing.m,
  },
  videoThumbnail: {
    width: '100%',
    height: 200,
    borderRadius: BorderRadius.medium,
    backgroundColor: Colors.neutral.mist,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.m,
    gap: Spacing.s,
  },
  progressBar: {
    flex: 1,
    height: 4,
    backgroundColor: Colors.neutral.mist,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.primary.accent,
    borderRadius: 2,
  },
  actionButtons: {
    gap: Spacing.s,
    marginBottom: Spacing.l,
  },
  selectionButtons: {
    flexDirection: 'row',
    gap: Spacing.s,
  },
  selectButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.m,
    paddingHorizontal: Spacing.m,
    borderRadius: BorderRadius.medium,
    borderWidth: 2,
    borderColor: Colors.primary.accent,
    borderStyle: 'dashed',
  },
  uploadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.s,
    paddingVertical: Spacing.m,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.s,
    paddingVertical: Spacing.s,
    paddingHorizontal: Spacing.m,
    borderRadius: BorderRadius.small,
  },
  deleteText: {
    marginLeft: Spacing.xs,
  },
  infoText: {
    textAlign: 'center',
    fontStyle: 'italic',
  },
});