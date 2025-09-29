import React, { useState, memo, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing } from '@/constants/theme';
import { Slider } from '@miblanchard/react-native-slider';
import { skillsService, ProSkills } from '@/services/skills.service';
import { useAuth } from '@/hooks/useAuth';
import { getPublicUrl } from '@/utils/scaleway';
import { logger } from '@/utils/logger';
import { UniversalAlert } from '@/utils/alert';

interface SkillData {
  name: string;
  value: number;
  key: keyof ProSkills;
  hasVideo?: boolean;
}

// Composant séparé pour chaque slider - optimisé pour éviter les re-renders
interface SkillSliderProps {
  skill: SkillData;
  onValueUpdate: (value: number) => void;
  onSlidingComplete: (value: number) => void;
}

const SkillSlider = memo(({ skill, onValueUpdate, onSlidingComplete }: SkillSliderProps) => {
  const router = useRouter();

  const handleValueChange = (values: number[]) => {
    // Mise à jour directe dans le parent à chaque changement
    const value = values[0];
    onValueUpdate(value);
  };

  const handleSlidingComplete = (values: number[]) => {
    // Sauvegarde automatique quand on relâche le slider
    const value = values[0];
    onSlidingComplete(value);
  };

  const handleVideoPress = () => {
    // Navigation vers l'écran d'upload/visionnage vidéo
    router.push(`/video-skill/upload/${skill.key}`);
  };

  return (
    <View style={styles.skillContainer}>
      <View style={styles.skillHeader}>
        <View style={styles.skillNameContainer}>
          <Text style={styles.skillName}>{skill.name}</Text>
          {skill.key !== 'skill_mental' && (
            <TouchableOpacity
              onPress={handleVideoPress}
              style={styles.videoButton}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons
                name={skill.hasVideo ? "videocam" : "videocam-outline"}
                size={20}
                color={Colors.primary.accent}
              />
            </TouchableOpacity>
          )}
        </View>
        <Text style={styles.skillValue}>{Math.round(skill.value)}%</Text>
      </View>
      <Slider
        containerStyle={styles.slider}
        minimumValue={0}
        maximumValue={100}
        value={skill.value} // Utilise directement la valeur du parent
        onValueChange={handleValueChange}
        onSlidingComplete={handleSlidingComplete}
        minimumTrackTintColor={Colors.primary.accent}
        maximumTrackTintColor={Colors.neutral.lightGray}
        thumbStyle={styles.thumb}
        trackStyle={styles.track}
      />
    </View>
  );
});

function ProSettingsScreen() {
  const router = useRouter();
  const { user } = useAuth();

  // États
  const [skills, setSkills] = useState<SkillData[]>([
    { name: 'Driving', value: 50, key: 'skill_driving', hasVideo: false },
    { name: 'Fers', value: 50, key: 'skill_irons', hasVideo: false },
    { name: 'Wedging', value: 50, key: 'skill_wedging', hasVideo: false },
    { name: 'Chipping', value: 50, key: 'skill_chipping', hasVideo: false },
    { name: 'Putting', value: 50, key: 'skill_putting', hasVideo: false },
    { name: 'Mental', value: 50, key: 'skill_mental', hasVideo: false },
  ]);
  const [loading, setLoading] = useState(true);
  const [showSaved, setShowSaved] = useState(false);

  // Timer pour cacher le message "Sauvegardé"
  const [saveTimer, setSaveTimer] = useState<NodeJS.Timeout | null>(null);

  // Vérifier l'existence des vidéos sur S3
  const checkVideosExistence = async (userId: string) => {
    const videoChecks = [
      'skill_driving',
      'skill_irons',
      'skill_wedging',
      'skill_chipping',
      'skill_putting',
      'skill_mental',
    ];

    const videoStatuses: Record<string, boolean> = {};

    // Vérifier chaque vidéo en parallèle
    await Promise.all(
      videoChecks.map(async (skillKey) => {
        try {
          const videoKey = `videos/${userId}/${skillKey}.mp4`;
          const videoUrl = getPublicUrl(videoKey);

          // Faire une requête HEAD pour vérifier l'existence sans télécharger
          const response = await fetch(videoUrl, { method: 'HEAD' });
          videoStatuses[skillKey] = response.ok;

          if (response.ok) {
            logger.dev(`✅ Vidéo trouvée pour ${skillKey}`);
          }
        } catch (error) {
          videoStatuses[skillKey] = false;
        }
      })
    );

    return videoStatuses;
  };

  // Charger les compétences depuis la BDD au montage
  useEffect(() => {
    const loadSkills = async () => {
      if (!user?.id) return;

      setLoading(true);

      // Charger les compétences depuis la DB
      const dbSkills = await skillsService.getSkills(user.id);

      // Vérifier l'existence des vidéos
      const videoStatuses = await checkVideosExistence(user.id);

      if (dbSkills) {
        setSkills([
          { name: 'Driving', value: dbSkills.skill_driving || 50, key: 'skill_driving', hasVideo: videoStatuses['skill_driving'] || false },
          { name: 'Fers', value: dbSkills.skill_irons || 50, key: 'skill_irons', hasVideo: videoStatuses['skill_irons'] || false },
          { name: 'Wedging', value: dbSkills.skill_wedging || 50, key: 'skill_wedging', hasVideo: videoStatuses['skill_wedging'] || false },
          { name: 'Chipping', value: dbSkills.skill_chipping || 50, key: 'skill_chipping', hasVideo: videoStatuses['skill_chipping'] || false },
          { name: 'Putting', value: dbSkills.skill_putting || 50, key: 'skill_putting', hasVideo: videoStatuses['skill_putting'] || false },
          { name: 'Mental', value: dbSkills.skill_mental || 50, key: 'skill_mental', hasVideo: videoStatuses['skill_mental'] || false },
        ]);
      }
      setLoading(false);
    };

    loadSkills();
  }, [user?.id]);

  // Nettoyer le timer au démontage
  useEffect(() => {
    return () => {
      if (saveTimer) clearTimeout(saveTimer);
    };
  }, [saveTimer]);

  const updateSkill = (index: number, value: number) => {
    const newSkills = [...skills];
    newSkills[index].value = value;
    setSkills(newSkills);
  };

  // Sauvegarder une compétence spécifique en temps réel
  const handleSkillSave = async (index: number, value: number) => {
    if (!user?.id) return;

    const skill = skills[index];
    const partialUpdate: Partial<ProSkills> = {
      [skill.key]: Math.round(value),
    };

    // Sauvegarde optimiste - pas de loader
    const success = await skillsService.updateSkills(user.id, partialUpdate as ProSkills);

    if (success) {
      // Afficher le message "Sauvegardé"
      setShowSaved(true);

      // Clear le timer précédent s'il existe
      if (saveTimer) clearTimeout(saveTimer);

      // Cacher le message après 2 secondes
      const timer = setTimeout(() => {
        setShowSaved(false);
      }, 2000);
      setSaveTimer(timer);
    } else {
      // Afficher une erreur seulement si ça échoue
      UniversalAlert.error('Erreur', 'Impossible d\'enregistrer cette compétence');
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary.accent} />
          <Text style={styles.loadingText}>Chargement des compétences...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      {/* Indicateur flottant de sauvegarde */}
      {showSaved && (
        <View style={styles.savedIndicator}>
          <Ionicons name="checkmark-circle" size={16} color={Colors.semantic.success} />
          <Text style={styles.savedText}>Sauvegardé</Text>
        </View>
      )}

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
          {skills.map((skill, index) => (
            <SkillSlider
              key={skill.name}
              skill={skill}
              onValueUpdate={(value) => updateSkill(index, value)}
              onSlidingComplete={(value) => handleSkillSave(index, value)}
            />
          ))}
        </ScrollView>
    </SafeAreaView>
  );
}

export default ProSettingsScreen;

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
  skillContainer: {
    marginBottom: Spacing.s,
    paddingHorizontal: Spacing.m,
    paddingVertical: Spacing.xs,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
    borderRadius: 12,
  },
  skillHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.m,
  },
  skillNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  videoButton: {
    marginLeft: Spacing.s,
    padding: 4,
  },
  skillName: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.neutral.charcoal,
  },
  skillValue: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.primary.accent,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  thumb: {
    backgroundColor: Colors.primary.accent,
    width: 24,
    height: 24,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 4,
  },
  track: {
    height: 6,
    borderRadius: 3,
  },
  savedIndicator: {
    position: 'absolute',
    top: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.s,
    paddingHorizontal: Spacing.m,
    backgroundColor: Colors.neutral.charcoal,
    borderRadius: 20,
    zIndex: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  savedText: {
    marginLeft: 4,
    fontSize: 14,
    color: Colors.neutral.white,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: Spacing.m,
    fontSize: 16,
    color: Colors.neutral.gray,
  },
});