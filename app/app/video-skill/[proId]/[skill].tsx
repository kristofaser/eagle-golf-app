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
import { Video, ResizeMode } from 'expo-av';
import { Colors, Spacing } from '@/constants/theme';
import { Text } from '@/components/atoms';
import { s3, getPublicUrl, generateVideoKey, BUCKET_NAME } from '@/utils/scaleway';

const { width, height } = Dimensions.get('window');

export default function VideoSkillScreen() {
  const { proId, skill } = useLocalSearchParams();
  const router = useRouter();
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const skillName = Array.isArray(skill) ? skill[0] : skill;
  const proIdString = Array.isArray(proId) ? proId[0] : proId;

  // Charger la vidéo depuis Supabase Storage
  useEffect(() => {
    loadVideo();
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

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar barStyle="light-content" backgroundColor="black" />

      <View style={styles.container}>
        {/* Header avec bouton fermer */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <Ionicons name="close" size={28} color="white" />
          </TouchableOpacity>

          <View style={styles.headerInfo}>
            <Text variant="body" color="ball" weight="semiBold">
              {getSkillDisplayName(skillName)}
            </Text>
            <Text variant="caption" color="ball">
              Démonstration technique
            </Text>
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
            <Video
              source={{ uri: videoUrl }}
              rate={1.0}
              volume={1.0}
              isMuted={false}
              resizeMode={ResizeMode.CONTAIN}
              shouldPlay={false}
              isLooping
              useNativeControls
              style={styles.video}
              onError={(error) => {
                console.error('Video playback error:', error);
                setError('Erreur de lecture vidéo');
              }}
            />
          )}
        </View>

        {/* Informations supplémentaires (optionnel) */}
        <View style={styles.infoOverlay}>
          <Text variant="caption" color="ball" style={styles.infoText}>
            Pro ID: {proIdString}
          </Text>
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
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  closeButton: {
    padding: Spacing.s,
    marginRight: Spacing.m,
  },
  headerInfo: {
    flex: 1,
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