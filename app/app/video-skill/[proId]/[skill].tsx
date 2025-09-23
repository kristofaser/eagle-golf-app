import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  StatusBar,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { VideoView, useVideoPlayer } from 'expo-video';
import { Colors, Spacing } from '@/constants/theme';
import { Text } from '@/components/atoms';
import { s3, getPublicUrl, generateVideoKey, BUCKET_NAME } from '@/utils/scaleway';
import { supabase } from '@/utils/supabase/client';

const { width, height } = Dimensions.get('window');

export default function VideoSkillScreen() {
  const { proId, skill } = useLocalSearchParams();
  const router = useRouter();
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [proName, setProName] = useState<string>('');

  // Create video player
  const player = useVideoPlayer(videoUrl, (player) => {
    if (videoUrl) {
      player.play();
      player.loop = true;
    }
  });

  const skillName = Array.isArray(skill) ? skill[0] : skill;
  const proIdString = Array.isArray(proId) ? proId[0] : proId;

  // Charger la vidéo et les infos du pro
  useEffect(() => {
    loadVideo();
    loadProInfo();
  }, [proIdString, skillName]);

  const loadVideo = async () => {
    try {
      setIsLoading(true);
      setError(null);

      if (!proIdString || !skillName) {
        throw new Error('Paramètres manquants');
      }

      // Générer la clé d'objet
      const objectKey = generateVideoKey(proIdString, skillName);

      // Vérifier si le fichier existe sur Scaleway
      const headParams = {
        Bucket: BUCKET_NAME,
        Key: objectKey,
      };

      try {
        await s3.headObject(headParams).promise();

        // Le fichier existe, générer l'URL publique
        const publicUrl = getPublicUrl(objectKey);
        console.log('URL vidéo Scaleway:', publicUrl);

        setVideoUrl(publicUrl);
      } catch (headError: any) {
        if (headError.code === 'NotFound') {
          throw new Error('Vidéo non disponible');
        }
        throw headError;
      }
    } catch (err) {
      console.error('Erreur chargement vidéo Scaleway:', err);
      setError(err instanceof Error ? err.message : 'Erreur de chargement');
    } finally {
      setIsLoading(false);
    }
  };

  const loadProInfo = async () => {
    try {
      if (!proIdString) return;

      const { data: profile, error } = await supabase
        .from('profiles')
        .select('first_name, last_name')
        .eq('id', proIdString)
        .single();

      if (error) {
        console.error('Erreur chargement profil pro:', error);
        setProName('Pro');
        return;
      }

      const fullName = `${profile?.first_name || ''} ${profile?.last_name || ''}`.trim();
      setProName(fullName || 'Pro');
    } catch (err) {
      console.error('Erreur chargement profil pro:', err);
      setProName('Pro');
    }
  };

  const handleClose = () => {
    router.back();
  };

  const getSkillDisplayName = (skill: string) => {
    const skillNames: { [key: string]: string } = {
      driving: 'Driving',
      irons: 'Jeu de fer',
      wedging: 'Wedging',
      chipping: 'Chipping',
      putting: 'Putting',
      mental: 'Mental',
    };
    return skillNames[skill] || skill;
  };

  // Si la compétence est Mental, on bloque l'accès
  if (skillName === 'mental') {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <StatusBar barStyle="light-content" backgroundColor="black" />
        <View style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
              <Ionicons name="close" size={28} color="white" />
            </TouchableOpacity>
          </View>
          <View style={styles.errorContainer}>
            <Ionicons name="warning-outline" size={60} color="white" />
            <Text variant="h3" color="ball" style={styles.errorText}>
              Compétence non disponible
            </Text>
            <Text variant="body" color="ball" style={styles.errorSubText}>
              Les vidéos pour la compétence Mental ne sont plus disponibles
            </Text>
          </View>
        </View>
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar barStyle="light-content" backgroundColor="black" />

      <View style={styles.container}>
        {/* Header avec bouton fermer et badges */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <Ionicons name="close" size={28} color="white" />
          </TouchableOpacity>

          <View style={styles.badgesContainer}>
            <View style={styles.skillBadge}>
              <Text variant="body" color="ball" weight="semiBold">
                {getSkillDisplayName(skillName)}
              </Text>
            </View>

            <View style={styles.proBadge}>
              <Text variant="caption" color="ball" weight="medium">
                {proName}
              </Text>
            </View>
          </View>
        </View>

        {/* Contenu vidéo */}
        <View style={styles.videoContainer}>
          {isLoading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={Colors.primary.accent} />
              <Text variant="body" color="ball" style={styles.loadingText}>
                Chargement de la vidéo...
              </Text>
            </View>
          )}

          {error && (
            <View style={styles.errorContainer}>
              <Ionicons name="warning-outline" size={60} color="white" />
              <Text variant="h3" color="ball" style={styles.errorText}>
                {error}
              </Text>
              <Text variant="body" color="ball" style={styles.errorSubText}>
                Cette compétence n'a pas encore de vidéo
              </Text>
            </View>
          )}

          {videoUrl && !isLoading && !error && (
            <VideoView
              player={player}
              style={styles.video}
              nativeControls={true}
              contentFit="contain"
              onError={(error) => {
                console.error('Video playback error:', error);
                setError('Erreur de lecture vidéo');
              }}
            />
          )}
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    paddingTop: 50, // Safe area
    paddingHorizontal: Spacing.m,
    paddingBottom: Spacing.m,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  closeButton: {
    padding: Spacing.s,
    marginRight: Spacing.m,
  },
  badgesContainer: {
    flex: 1,
    flexDirection: 'row',
    gap: Spacing.s,
  },
  skillBadge: {
    backgroundColor: Colors.primary.accent,
    paddingHorizontal: Spacing.m,
    paddingVertical: Spacing.s,
    borderRadius: 20,
  },
  proBadge: {
    backgroundColor: Colors.neutral.charcoal,
    paddingHorizontal: Spacing.m,
    paddingVertical: Spacing.s,
    borderRadius: 20,
  },
  videoContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  loadingText: {
    marginTop: Spacing.m,
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    paddingHorizontal: Spacing.l,
  },
  errorText: {
    marginTop: Spacing.l,
    textAlign: 'center',
  },
  errorSubText: {
    marginTop: Spacing.s,
    textAlign: 'center',
    opacity: 0.7,
  },
  video: {
    width: width,
    height: height,
  },
  infoOverlay: {
    position: 'absolute',
    bottom: 50,
    left: Spacing.m,
    right: Spacing.m,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: Spacing.s,
    borderRadius: 8,
  },
  infoText: {
    textAlign: 'center',
  },
});
