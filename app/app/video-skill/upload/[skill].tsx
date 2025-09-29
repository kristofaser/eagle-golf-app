import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { View, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { useLocalSearchParams, useRouter, useNavigation } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius } from '@/constants/theme';
import { UniversalAlert } from '@/utils/alert';
import { Text, Button } from '@/components/atoms';
import { SingleVideoUploadManager } from '@/components/organisms/SingleVideoUploadManager';
import { useAuth } from '@/hooks/useAuth';
import { s3, getPublicUrl, generateVideoKey, BUCKET_NAME } from '@/utils/scaleway';
import { logger } from '@/utils/logger';
import { VideoView, useVideoPlayer } from 'expo-video';

const { width } = Dimensions.get('window');

interface SkillInfo {
  key: string;
  label: string;
}

const SKILLS_MAP: Record<string, SkillInfo> = {
  skill_driving: { key: 'skill_driving', label: 'Driving' },
  skill_irons: { key: 'skill_irons', label: 'Fers' },
  skill_wedging: { key: 'skill_wedging', label: 'Wedging' },
  skill_chipping: { key: 'skill_chipping', label: 'Chipping' },
  skill_putting: { key: 'skill_putting', label: 'Putting' },
  skill_mental: { key: 'skill_mental', label: 'Mental' },
};

export default function UploadSkillVideoScreen() {
  const { skill } = useLocalSearchParams();
  const router = useRouter();
  const navigation = useNavigation();
  const { user } = useAuth();
  const [isUploading, setIsUploading] = useState(false);

  const skillKey = Array.isArray(skill) ? skill[0] : skill;
  const skillInfo = SKILLS_MAP[skillKey as string] || { key: skillKey, label: skillKey };

  // Vérifier si une vidéo existe déjà
  const [currentVideoUrl, setCurrentVideoUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isVideoLoading, setIsVideoLoading] = useState(true);

  // Créer le player vidéo - useVideoPlayer est un hook, il doit être au niveau racine
  const player = useVideoPlayer(currentVideoUrl, (player) => {
    if (currentVideoUrl && player) {
      player.loop = true;
    }
  });

  // Configurer le titre de la navigation dynamiquement
  useEffect(() => {
    navigation.setOptions({
      title: `Vidéo ${skillInfo.label}`,
      headerLeft: () => (
        <TouchableOpacity
          onPress={() => router.back()}
          style={{ paddingHorizontal: 16, paddingVertical: 8 }}
        >
          <Ionicons name="close" size={24} color={Colors.neutral.charcoal} />
        </TouchableOpacity>
      ),
    });
  }, [skillInfo.label, navigation, router]);

  // Vérifier l'existence de la vidéo une seule fois au montage
  useEffect(() => {
    let mounted = true;

    const checkVideo = async () => {
      if (!user?.id || !skillKey) {
        setIsVideoLoading(false);
        return;
      }

      try {
        const videoKey = `videos/${user.id}/${skillKey}.mp4`;
        const videoUrl = getPublicUrl(videoKey);

        const response = await fetch(videoUrl, { method: 'HEAD' });
        if (response.ok && mounted) {
          setCurrentVideoUrl(videoUrl);
          logger.dev('📹 Vidéo existante trouvée:', videoUrl);
        }
      } catch (error) {
        logger.dev('Pas de vidéo existante pour cette compétence');
      } finally {
        if (mounted) {
          setIsVideoLoading(false);
        }
      }
    };

    checkVideo();

    return () => {
      mounted = false;
    };
  }, []); // Tableau vide - exécution unique au montage


  const handleVideoUploaded = useCallback((skillKey: string, videoUrl: string) => {
    logger.dev('✅ Vidéo uploadée:', { skillKey, videoUrl });
    setCurrentVideoUrl(videoUrl);
    UniversalAlert.success(
      'Succès',
      'Votre vidéo a été uploadée avec succès !'
    );
  }, []);

  const handleVideoDeleted = useCallback((skillKey: string) => {
    logger.dev('🗑️ Vidéo supprimée:', skillKey);
    setCurrentVideoUrl(null);
  }, []);

  const togglePlayPause = useCallback(() => {
    if (!player) return;

    if (isPlaying) {
      player.pause();
    } else {
      player.play();
    }
    setIsPlaying(!isPlaying);
  }, [player, isPlaying]);

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.uploadSection}>
            <SingleVideoUploadManager
              skillKey={skillKey}
              skillLabel={skillInfo.label}
              currentVideoUrl={currentVideoUrl}
              onVideoUploaded={handleVideoUploaded}
              onVideoDeleted={handleVideoDeleted}
            />
          </View>
        </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.neutral.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.l,
  },
  headerButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  infoContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.primary.light + '20',
    borderRadius: 12,
    padding: Spacing.m,
    marginBottom: Spacing.xl,
    alignItems: 'flex-start',
  },
  infoText: {
    flex: 1,
    marginLeft: Spacing.s,
    fontSize: 14,
    lineHeight: 20,
    color: Colors.neutral.darkGray,
  },
  videoSection: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.neutral.charcoal,
    marginBottom: Spacing.m,
  },
  videoContainer: {
    width: '100%',
    height: width * 0.56, // Ratio 16:9
    backgroundColor: Colors.neutral.black,
    borderRadius: BorderRadius.medium,
    overflow: 'hidden',
    position: 'relative',
  },
  video: {
    width: '100%',
    height: '100%',
  },
  playButton: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -30 }, { translateY: -30 }],
    opacity: 0.9,
  },
  videoHint: {
    fontSize: 13,
    color: Colors.neutral.gray,
    textAlign: 'center',
    marginTop: Spacing.s,
    fontStyle: 'italic',
  },
  uploadSection: {
    marginTop: Spacing.l,
  },
});