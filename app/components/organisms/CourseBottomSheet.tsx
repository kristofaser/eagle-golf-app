import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  forwardRef,
  useImperativeHandle,
} from 'react';
import {
  StyleSheet,
  View,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Image,
} from 'react-native';
import {
  BottomSheetModal,
  BottomSheetModalProvider,
  BottomSheetView,
  BottomSheetBackdrop,
} from '@gorhom/bottom-sheet';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Colors, Spacing, BorderRadius } from '@/constants/theme';
import { Text, Icon } from '@/components/atoms';
import { GolfParcours } from '@/services/golf-parcours.service';
import { profileService, ProProfileWithDetails } from '@/services/profile.service';
import { JoueurData } from '@/components/molecules/ContentCard';

interface CourseBottomSheetProps {
  course: GolfParcours | null;
  onClose: () => void;
}

interface CourseBottomSheetRef extends BottomSheetModal {
  setCourse: (course: GolfParcours) => void;
}

export const CourseBottomSheet = forwardRef<BottomSheetModal, CourseBottomSheetProps>(
  ({ course: propCourse, onClose }, ref) => {
    const bottomSheetRef = useRef<BottomSheetModal>(null);
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const TAB_BAR_HEIGHT = 60; // Hauteur de la tab bar
    const [allPros, setAllPros] = useState<ProProfileWithDetails[]>([]);
    const [isLoadingPros, setIsLoadingPros] = useState(false);
    const [course, setCourse] = useState<GolfParcours | null>(propCourse);

    // Exposer la ref pour permettre l'ouverture depuis le parent
    useImperativeHandle(ref, () => ({
      ...bottomSheetRef.current!,
      setCourse: (newCourse: GolfParcours) => {
        setCourse(newCourse);
      },
    }));

    // Points d'arrêt pour le bottomsheet
    const snapPoints = useMemo(() => ['35%', '65%', '85%'], []);

    // Charger les pros quand le course change
    useEffect(() => {
      if (course) {
        loadAllPros();
      }
    }, [course]);

    const loadAllPros = async () => {
      setIsLoadingPros(true);
      try {
        console.log('Chargement de tous les pros...');
        const { data, error } = await profileService.listProProfiles(
          {}, // Pas de filtres pour l'instant
          { page: 1, pageSize: 50 }
        );

        if (data && !error) {
          setAllPros(data);
        }
      } catch (error) {
        // Erreur silencieuse pour l'instant
      } finally {
        setIsLoadingPros(false);
      }
    };

    const handleSheetChanges = useCallback(
      (index: number) => {
        if (index === -1) {
          onClose();
        }
      },
      [onClose]
    );

    const handleProPress = (data: JoueurData) => {
      router.push(`/profile/${data.id}`);
    };

    // Convertir les pros au format JoueurData
    const convertedPros = allPros.map(
      (pro): JoueurData => ({
        id: pro.id,
        title: `${pro.first_name} ${pro.last_name}`,
        imageUrl: pro.avatar_url || 'https://via.placeholder.com/300x400',
        region: pro.city || 'France',
        isAvailable: false, // Pour l'instant
        distance: undefined,
        rating: undefined,
        division: undefined,
      })
    );

    // Toujours rendre le composant, même sans course

    return (
      <BottomSheetModal
        ref={bottomSheetRef}
        index={1}
        snapPoints={snapPoints}
        onChange={handleSheetChanges}
        backdropComponent={null}
        bottomInset={TAB_BAR_HEIGHT + insets.bottom}
        style={styles.bottomSheet}
        handleIndicatorStyle={styles.handleIndicator}
        enablePanDownToClose={true}
        detached={false}
      >
        <BottomSheetView style={styles.contentContainer}>
          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Nom du golf centré */}
            {course && (
              <View style={styles.golfNameSection}>
                <Text variant="h3" color="charcoal" style={styles.centeredTitle}>
                  {course.name}
                </Text>
              </View>
            )}

            {/* Cards des pros */}
            <View style={styles.prosSection}>
              {isLoadingPros ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="small" color={Colors.primary.accent} />
                </View>
              ) : convertedPros.length > 0 ? (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.prosScrollContainer}
                  style={styles.prosScrollView}
                >
                  {convertedPros.map((pro) => (
                    <TouchableOpacity
                      key={pro.id}
                      style={styles.smallProCard}
                      onPress={() => handleProPress(pro)}
                      activeOpacity={0.8}
                    >
                      <View style={styles.proImageContainer}>
                        <View
                          style={[
                            styles.proImage,
                            !pro.imageUrl || pro.imageUrl.includes('placeholder')
                              ? styles.placeholderImage
                              : null,
                          ]}
                        >
                          {pro.imageUrl && !pro.imageUrl.includes('placeholder') ? (
                            <Image
                              source={{ uri: pro.imageUrl }}
                              style={styles.proImage}
                              resizeMode="cover"
                            />
                          ) : (
                            <Icon
                              name="person"
                              size={40}
                              color={Colors.neutral.course}
                              family="MaterialIcons"
                            />
                          )}
                        </View>
                      </View>
                      <Text
                        variant="caption"
                        color="charcoal"
                        weight="semiBold"
                        numberOfLines={2}
                        style={styles.proName}
                      >
                        {pro.title}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              ) : (
                <View style={styles.emptyState}>
                  <Text variant="body" color="course">
                    Aucun pro trouvé
                  </Text>
                </View>
              )}
            </View>
          </ScrollView>
        </BottomSheetView>
      </BottomSheetModal>
    );
  }
);

const styles = StyleSheet.create({
  bottomSheet: {
    shadowColor: Colors.shadows.dark,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 5,
  },
  handleIndicator: {
    backgroundColor: Colors.neutral.mist,
    width: 40,
    height: 4,
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: Spacing.m,
  },
  prosSection: {
    paddingVertical: Spacing.m,
  },
  loadingContainer: {
    paddingVertical: Spacing.l,
    alignItems: 'center',
  },
  emptyState: {
    paddingVertical: Spacing.l,
    alignItems: 'center',
  },
  centeredTitle: {
    textAlign: 'center',
    flex: 1,
  },
  golfNameSection: {
    paddingVertical: Spacing.l,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral.mist,
  },
  prosScrollView: {
    marginHorizontal: -Spacing.m, // Compenser le padding du container
  },
  prosScrollContainer: {
    paddingHorizontal: Spacing.m,
    gap: Spacing.s,
  },
  smallProCard: {
    width: 100, // Cards plus petites
    alignItems: 'center',
    marginRight: Spacing.s,
  },
  proImageContainer: {
    marginBottom: Spacing.xs,
  },
  proImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.neutral.mist,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  placeholderImage: {
    backgroundColor: Colors.neutral.mist,
  },
  proName: {
    textAlign: 'center',
    lineHeight: 16,
  },
});
