import React, { useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Alert,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { Video, ResizeMode } from 'expo-av';
import { Colors, Spacing, BorderRadius } from '@/constants/theme';
import { Text, Button } from '@/components/atoms';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { Video02Icon, CloudUploadIcon, Delete02Icon } from '@hugeicons/core-free-icons';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/utils/supabase/client';

interface VideoUploadManagerProps {
  skills: Array<{
    key: string;
    label: string;
    currentVideoUrl?: string;
  }>;
  onVideoUploaded?: (skillKey: string, videoUrl: string) => void;
  onVideoDeleted?: (skillKey: string) => void;
}

interface UploadProgress {
  skillKey: string;
  progress: number;
  isUploading: boolean;
}

export const VideoUploadManager: React.FC<VideoUploadManagerProps> = ({
  skills,
  onVideoUploaded,
  onVideoDeleted,
}) => {
  const { user } = useAuth();
  const [uploadProgresses, setUploadProgresses] = useState<Record<string, UploadProgress>>({});
  const [selectedVideos, setSelectedVideos] = useState<Record<string, string>>({});

  const updateUploadProgress = useCallback(
    (skillKey: string, progress: number, isUploading: boolean) => {
      setUploadProgresses((prev) => ({
        ...prev,
        [skillKey]: { skillKey, progress, isUploading },
      }));
    },
    []
  );

  const selectVideo = useCallback(async (skillKey: string) => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'video/*',
        copyToCacheDirectory: true,
        multiple: false,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];

        // Vérifier la taille du fichier (limite à 50MB)
        if (asset.size && asset.size > 50 * 1024 * 1024) {
          Alert.alert('Erreur', 'La vidéo ne peut pas dépasser 50MB');
          return;
        }

        setSelectedVideos((prev) => ({
          ...prev,
          [skillKey]: asset.uri,
        }));
      }
    } catch (error) {
      console.error('Erreur lors de la sélection:', error);
      Alert.alert('Erreur', 'Impossible de sélectionner la vidéo');
    }
  }, []);

  const uploadVideo = useCallback(
    async (skillKey: string) => {
      if (!user || !selectedVideos[skillKey]) return;

      try {
        updateUploadProgress(skillKey, 0, true);

        // Lire le fichier
        const response = await fetch(selectedVideos[skillKey]);
        const blob = await response.blob();

        // Nom du fichier: userId/skillKey.mp4
        const fileName = `${user.id}/${skillKey}.mp4`;

        // Upload vers Supabase Storage
        const { data, error } = await supabase.storage.from('video-skills').upload(fileName, blob, {
          contentType: 'video/mp4',
          upsert: true, // Remplacer si existe déjà
        });

        if (error) {
          throw error;
        }

        // Obtenir l'URL publique
        const {
          data: { publicUrl },
        } = supabase.storage.from('video-skills').getPublicUrl(fileName);

        updateUploadProgress(skillKey, 100, false);

        // Nettoyer la sélection
        setSelectedVideos((prev) => {
          const newState = { ...prev };
          delete newState[skillKey];
          return newState;
        });

        onVideoUploaded?.(skillKey, publicUrl);
        Alert.alert('Succès', 'Vidéo uploadée avec succès !');
      } catch (error) {
        console.error('Erreur upload:', error);
        updateUploadProgress(skillKey, 0, false);
        Alert.alert('Erreur', "Impossible d'uploader la vidéo");
      }
    },
    [user, selectedVideos, updateUploadProgress, onVideoUploaded]
  );

  const deleteVideo = useCallback(
    async (skillKey: string) => {
      if (!user) return;

      Alert.alert('Supprimer la vidéo', 'Êtes-vous sûr de vouloir supprimer cette vidéo ?', [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              const fileName = `${user.id}/${skillKey}.mp4`;

              const { error } = await supabase.storage.from('video-skills').remove([fileName]);

              if (error) throw error;

              onVideoDeleted?.(skillKey);
              Alert.alert('Succès', 'Vidéo supprimée');
            } catch (error) {
              console.error('Erreur suppression:', error);
              Alert.alert('Erreur', 'Impossible de supprimer la vidéo');
            }
          },
        },
      ]);
    },
    [user, onVideoDeleted]
  );

  const renderSkillVideo = (skill: { key: string; label: string; currentVideoUrl?: string }) => {
    const progress = uploadProgresses[skill.key];
    const selectedVideo = selectedVideos[skill.key];
    const hasCurrentVideo = !!skill.currentVideoUrl;
    const hasSelectedVideo = !!selectedVideo;

    return (
      <View key={skill.key} style={styles.skillContainer}>
        <View style={styles.skillHeader}>
          <HugeiconsIcon
            icon={Video02Icon}
            size={20}
            color={Colors.primary.accent}
            strokeWidth={1.5}
          />
          <Text variant="h4" color="charcoal" weight="semiBold" style={styles.skillTitle}>
            {skill.label}
          </Text>
        </View>

        {/* Vidéo actuelle ou sélectionnée */}
        {(hasCurrentVideo || hasSelectedVideo) && (
          <View style={styles.videoPreview}>
            <Video
              source={{ uri: selectedVideo || skill.currentVideoUrl }}
              style={styles.videoThumbnail}
              useNativeControls={false}
              resizeMode={ResizeMode.COVER}
              shouldPlay={false}
            />
            <View style={styles.videoOverlay}>
              <HugeiconsIcon icon={Video02Icon} size={32} color="white" strokeWidth={1.5} />
            </View>
          </View>
        )}

        {/* Barre de progression */}
        {progress?.isUploading && (
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${progress.progress}%` }]} />
            </View>
            <Text variant="caption" color="course">
              {Math.round(progress.progress)}%
            </Text>
          </View>
        )}

        {/* Actions */}
        <View style={styles.actionButtons}>
          {!hasSelectedVideo && !progress?.isUploading && (
            <TouchableOpacity style={styles.selectButton} onPress={() => selectVideo(skill.key)}>
              <HugeiconsIcon
                icon={CloudUploadIcon}
                size={16}
                color={Colors.primary.accent}
                strokeWidth={1.5}
              />
              <Text variant="body" color="accent" weight="medium">
                {hasCurrentVideo ? 'Remplacer' : 'Sélectionner'}
              </Text>
            </TouchableOpacity>
          )}

          {hasSelectedVideo && !progress?.isUploading && (
            <Button variant="primary" size="small" onPress={() => uploadVideo(skill.key)}>
              Uploader
            </Button>
          )}

          {progress?.isUploading && (
            <View style={styles.uploadingContainer}>
              <ActivityIndicator size="small" color={Colors.primary.accent} />
              <Text variant="body" color="accent" weight="medium">
                Upload en cours...
              </Text>
            </View>
          )}

          {hasCurrentVideo && !progress?.isUploading && (
            <TouchableOpacity style={styles.deleteButton} onPress={() => deleteVideo(skill.key)}>
              <HugeiconsIcon
                icon={Delete02Icon}
                size={16}
                color={Colors.semantic.error}
                strokeWidth={1.5}
              />
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text variant="h3" color="charcoal" weight="semiBold">
          Mes vidéos de compétences
        </Text>
        <Text variant="body" color="course" style={styles.subtitle}>
          Uploadez des vidéos pour chaque compétence (max 50MB)
        </Text>
      </View>

      {skills.map(renderSkillVideo)}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.neutral.ball,
  },
  header: {
    padding: Spacing.l,
    paddingBottom: Spacing.m,
  },
  subtitle: {
    marginTop: Spacing.xs,
  },
  skillContainer: {
    marginHorizontal: Spacing.l,
    marginBottom: Spacing.l,
    backgroundColor: Colors.neutral.ball,
    borderRadius: BorderRadius.medium,
    padding: Spacing.m,
    borderWidth: 1,
    borderColor: Colors.ui.inputBorder,
  },
  skillHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.m,
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
    height: 120,
    borderRadius: BorderRadius.small,
    backgroundColor: Colors.neutral.mist,
  },
  videoOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: BorderRadius.small,
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.s,
  },
  selectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.s,
    paddingHorizontal: Spacing.m,
    borderRadius: BorderRadius.small,
    borderWidth: 1,
    borderColor: Colors.primary.accent,
  },
  uploadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.s,
  },
  deleteButton: {
    padding: Spacing.s,
    borderRadius: BorderRadius.small,
  },
});
