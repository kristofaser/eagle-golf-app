/**
 * VideoBackground - Composant vidéo de fond avec lazy loading et optimisation
 * Gère automatiquement la qualité selon le device et la connexion
 * Utilise expo-video (nouvelle API stable)
 * Intègre skeleton loader et transitions fade
 */
import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Image, Platform } from 'react-native';
import { VideoView, useVideoPlayer } from 'expo-video';
import { LinearGradient } from 'expo-linear-gradient';
import NetInfo from '@react-native-community/netinfo';
import { Asset } from 'expo-asset';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { AuthSkeleton } from '@/components/molecules';

interface VideoBackgroundProps {
  /** Afficher le gradient overlay */
  showGradient?: boolean;
  /** Opacité de l'overlay (0-1) */
  overlayOpacity?: number;
  /** Couleurs du gradient (si showGradient = true) */
  gradientColors?: string[];
  /** Image poster affichée pendant chargement */
  posterSource?: any;
  /** Callback quand vidéo est chargée */
  onVideoLoaded?: () => void;
  /** Afficher skeleton pendant chargement */
  showSkeleton?: boolean;
  /** Type de skeleton (login ou register) */
  skeletonType?: 'login' | 'register';
}

/**
 * Détermine la source vidéo optimale selon device et réseau
 * Multi-résolutions: UHD (WiFi), HD (4G/5G), SD (3G)
 */
const getOptimizedVideoSource = async () => {
  try {
    const state = await NetInfo.fetch();

    const connectionType = state.type;
    const cellularGen = state.details?.cellularGeneration;

    const isWifi = connectionType === 'wifi';
    const is4GOr5G = cellularGen === '4g' || cellularGen === '5g';
    const is3G = cellularGen === '3g';

    // Temporairement: utiliser l'ancienne vidéo UHD pour tous
    // TODO: Activer multi-résolutions quand Metro reconnaîtra les nouveaux fichiers
    return require('@/assets/videos/auth-background-uhd.mp4');
  } catch (error) {
    // Fallback en cas d'erreur: version HD (compromis)
    return require('@/assets/videos/auth-background-hd.mp4');
  }
};

export const VideoBackground: React.FC<VideoBackgroundProps> = ({
  showGradient = true,
  overlayOpacity = 0.5,
  gradientColors = [
    'rgba(0,0,0,0.3)', // Top - vidéo plus visible
    'rgba(0,0,0,0.5)', // Middle
    'rgba(0,0,0,0.6)', // Bottom - meilleur contraste texte
  ],
  posterSource,
  onVideoLoaded,
  showSkeleton = true,
  skeletonType = 'login',
}) => {
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [videoSource, setVideoSource] = useState<any>(null);
  const [showVideo, setShowVideo] = useState(true);

  // Valeurs pour transitions fade
  const skeletonOpacity = useSharedValue(1); // Skeleton commence visible
  const videoOpacity = useSharedValue(0); // Vidéo commence invisible

  // Charger source vidéo optimisée
  useEffect(() => {
    async function loadVideo() {
      try {
        const source = await getOptimizedVideoSource();
        setVideoSource(source);
      } catch (error) {
        console.error('[VideoBackground] Erreur chargement vidéo:', error);
        setShowVideo(false);
      }
    }
    loadVideo();
  }, []);

  // Précharger vidéo (optionnel, peut ralentir app)
  useEffect(() => {
    if (videoSource && Platform.OS !== 'web') {
      Asset.fromModule(videoSource).downloadAsync().catch((error) => {
        console.error('[VideoBackground] Erreur préchargement vidéo:', error);
      });
    }
  }, [videoSource]);

  // Initialiser le player expo-video
  const player = useVideoPlayer(videoSource || require('@/assets/videos/auth-background-uhd.mp4'));

  // Configurer le player quand la source est prête
  useEffect(() => {
    if (!player || !videoSource) return;

    player.loop = true;
    player.muted = true;
    player.play();
  }, [player, videoSource]);

  // Écouter les événements du player et gérer transitions
  useEffect(() => {
    if (!player) return;

    const subscription = player.addListener('statusChange', (statusEvent) => {
      // L'événement est un objet avec { status, oldStatus, error }
      const status = typeof statusEvent === 'string' ? statusEvent : statusEvent.status;

      if (status === 'readyToPlay' && !videoLoaded) {
        // Vidéo prête: lancer transitions fade
        // 1. Fade out skeleton
        skeletonOpacity.value = withTiming(0, {
          duration: 400,
          easing: Easing.out(Easing.ease),
        });

        // 2. Fade in vidéo
        videoOpacity.value = withTiming(1, {
          duration: 400,
          easing: Easing.out(Easing.ease),
        });

        setVideoLoaded(true);
        onVideoLoaded?.();
      } else if (status === 'error') {
        console.error('[VideoBackground] Erreur lecture vidéo');
        setShowVideo(false);
      }
    });

    return () => {
      subscription.remove();
    };
  }, [player, videoLoaded, onVideoLoaded, skeletonOpacity, videoOpacity]);

  // Styles animés
  const skeletonAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: skeletonOpacity.value,
    };
  });

  const videoAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: videoOpacity.value,
    };
  });

  return (
    <View style={StyleSheet.absoluteFillObject}>
      {/* Poster image (si pas de skeleton) */}
      {!videoLoaded && !showSkeleton && posterSource && (
        <Image source={posterSource} style={StyleSheet.absoluteFillObject} resizeMode="cover" />
      )}

      {/* Vidéo avec expo-video et fade transition */}
      {showVideo && videoSource && player && (
        <Animated.View style={[StyleSheet.absoluteFillObject, videoAnimatedStyle]}>
          <VideoView
            style={StyleSheet.absoluteFillObject}
            player={player}
            contentFit="cover"
            nativeControls={false}
          />
        </Animated.View>
      )}

      {/* Overlay gradient ou simple (sous le skeleton) */}
      {showGradient ? (
        <LinearGradient
          colors={gradientColors}
          style={StyleSheet.absoluteFillObject}
          pointerEvents="none"
        />
      ) : (
        <View
          style={[StyleSheet.absoluteFillObject, { backgroundColor: `rgba(0,0,0,${overlayOpacity})` }]}
          pointerEvents="none"
        />
      )}

      {/* Skeleton loader (au-dessus de tout pendant chargement) */}
      {!videoLoaded && showSkeleton && (
        <Animated.View style={[StyleSheet.absoluteFillObject, skeletonAnimatedStyle]}>
          <AuthSkeleton type={skeletonType} />
        </Animated.View>
      )}
    </View>
  );
};
