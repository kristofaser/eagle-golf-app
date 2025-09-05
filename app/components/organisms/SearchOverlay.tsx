import React, { useEffect, memo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  ActivityIndicator,
  TouchableOpacity,
  ScrollView,
  Image,
  Modal,
  SafeAreaView,
} from 'react-native';
import { FontAwesome, Ionicons } from '@expo/vector-icons';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { searchService } from '@/services/search.service';
import { useRouter } from 'expo-router';
import { Colors, Elevation, Spacing, BorderRadius } from '@/constants/theme';

interface SearchOverlayProps {
  visible: boolean;
  onClose: () => void;
}

// Types pour les résultats de recherche
type SearchResult = {
  id: string;
  title: string;
  subtitle: string;
  type: 'course' | 'pro';
  available?: boolean;
  distance?: number;
  price?: number;
  image?: string;
  rating?: number;
};

const SearchOverlayComponent = ({ visible, onClose }: SearchOverlayProps) => {
  const router = useRouter();
  const [searchText, setSearchText] = useState('');
  const [searchMode, setSearchMode] = useState<'all' | 'courses' | 'pros'>('all');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [activeFilters, setActiveFilters] = useState<string[]>([]);

  // Recherche avec debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      performSearch();
    }, 300);

    return () => clearTimeout(timer);
  }, [searchText, searchMode]);

  // Fonction de recherche
  const performSearch = async () => {
    if (searchText.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error: searchError } = await searchService.searchDual({
        query: searchText,
        mode: searchMode === 'all' ? 'all' : searchMode === 'courses' ? 'by-course' : 'by-pro',
        limit: 10,
      });

      if (searchError) {
        setError('Erreur lors de la recherche');
        return;
      }

      // Transformer les résultats pour l'affichage
      const results: SearchResult[] = (data || []).map((item) => {
        if (searchMode === 'courses' || (searchMode === 'all' && item.name)) {
          return {
            id: item.id,
            title: item.name,
            subtitle: `${item.city} • ${item.hole_count || 18} trous`,
            type: 'course' as const,
            price: item.green_fee_weekday,
            distance: Math.random() * 20, // TODO: calculer vraie distance
            image:
              'https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=100&h=100&fit=crop',
          };
        } else {
          return {
            id: item.id,
            title: `${item.first_name} ${item.last_name}`,
            subtitle: `${item.city || 'France'} • ${item.pro_profiles?.handicap ? `Handicap +${item.pro_profiles.handicap}` : 'Professionnel'}`,
            type: 'pro' as const,
            available: item.has_availabilities,
            distance: Math.random() * 15, // TODO: calculer vraie distance
            image: `https://ui-avatars.com/api/?name=${item.first_name}+${item.last_name}&background=0066CC&color=fff`,
          };
        }
      });

      setSearchResults(results);
    } catch (err) {
      console.error('Erreur recherche:', err);
      setError('Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  // Gestion de la sélection d'un résultat
  const handleResultPress = (result: SearchResult) => {
    onClose();
    // Naviguer vers la page appropriée
    if (result.type === 'course') {
      router.push(`/parcours/${result.id}`);
    } else {
      router.push(`/profile/${result.id}`);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />
        
        <View style={styles.modalContainer}>
          {/* Header simple */}
          <Text style={styles.modalTitle}>Recherche</Text>
          
          {/* Contenu */}
          <KeyboardAwareScrollView
            style={styles.keyboardAwareContainer}
            contentContainerStyle={styles.keyboardAwareContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            enableOnAndroid={true}
            extraScrollHeight={20}
            bounces={false}
          >
            <View style={styles.searchContainer}>
              {/* Tabs moderne style Instagram */}
              <View style={styles.tabsContainer}>
                <TouchableOpacity
                  style={[styles.tab, searchMode === 'all' && styles.tabActive]}
                  onPress={() => setSearchMode('all')}
                >
                  <Text style={[styles.tabText, searchMode === 'all' && styles.tabTextActive]}>
                    Tout
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.tab, searchMode === 'courses' && styles.tabActive]}
                  onPress={() => setSearchMode('courses')}
                >
                  <Text style={[styles.tabText, searchMode === 'courses' && styles.tabTextActive]}>
                    Parcours
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.tab, searchMode === 'pros' && styles.tabActive]}
                  onPress={() => setSearchMode('pros')}
                >
                  <Text style={[styles.tabText, searchMode === 'pros' && styles.tabTextActive]}>
                    Pros
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.inputContainer}>
                <FontAwesome
                  name="search"
                  size={20}
                  color={Colors.neutral.charcoal}
                  style={styles.searchIcon}
                />
                <TextInput
                  placeholder={
                    searchMode === 'courses'
                      ? 'Rechercher un parcours de golf'
                      : searchMode === 'pros'
                        ? 'Rechercher un professionnel'
                        : 'Rechercher parcours ou pros'
                  }
                  style={styles.input}
                  value={searchText}
                  onChangeText={setSearchText}
                  autoFocus={true}
                />
                {searchText !== '' && (
                  <TouchableOpacity onPress={() => setSearchText('')} style={styles.clearButton}>
                    <Ionicons name="close-circle" size={20} color={Colors.neutral.gray} />
                  </TouchableOpacity>
                )}
              </View>

              {/* Filtres rapides */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.filtersContainer}
                contentContainerStyle={styles.filtersContent}
              >
                <TouchableOpacity style={styles.filterChip}>
                  <Ionicons name="location" size={16} color={Colors.primary.accent} />
                  <Text style={styles.filterText}>Près de moi</Text>
                </TouchableOpacity>
                {searchMode !== 'pros' && (
                  <TouchableOpacity style={styles.filterChip}>
                    <Text style={styles.filterText}>Ouvert maintenant</Text>
                  </TouchableOpacity>
                )}
                {searchMode !== 'courses' && (
                  <TouchableOpacity
                    style={[
                      styles.filterChip,
                      activeFilters.includes('available') && styles.filterChipActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.filterText,
                        activeFilters.includes('available') && styles.filterTextActive,
                      ]}
                    >
                      Disponible
                    </Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity style={styles.filterChip}>
                  <Text style={styles.filterText}>{'< 10 km'}</Text>
                </TouchableOpacity>
              </ScrollView>
            </View>

            <View style={styles.resultsContainer}>
              {loading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color={Colors.primary.accent} />
                  <Text style={styles.loadingText}>Recherche en cours...</Text>
                </View>
              ) : error ? (
                <View style={styles.errorContainer}>
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              ) : searchResults.length > 0 ? (
                <>
                  <Text style={styles.resultsTitle}>
                    {searchResults.length} résultat{searchResults.length > 1 ? 's' : ''}
                  </Text>
                  {searchResults.map((item) => (
                    <Pressable
                      key={item.id}
                      style={styles.resultCard}
                      onPress={() => handleResultPress(item)}
                    >
                      {item.image && (
                        <Image source={{ uri: item.image }} style={styles.resultImage} />
                      )}
                      <View style={styles.resultContent}>
                        <View style={styles.resultHeader}>
                          <Text style={styles.resultTitle} numberOfLines={1}>
                            {item.title}
                          </Text>
                          {item.available && (
                            <View style={styles.availableBadge}>
                              <Text style={styles.availableBadgeText}>Dispo</Text>
                            </View>
                          )}
                        </View>
                        <Text style={styles.resultSubtitle} numberOfLines={1}>
                          {item.subtitle}
                        </Text>
                        <View style={styles.resultMeta}>
                          {item.distance && (
                            <View style={styles.metaItem}>
                              <Ionicons
                                name="location-outline"
                                size={14}
                                color={Colors.ui.secondaryText}
                              />
                              <Text style={styles.metaText}>{item.distance.toFixed(1)} km</Text>
                            </View>
                          )}
                          {item.price && (
                            <View style={styles.metaItem}>
                              <Text style={styles.priceText}>{item.price / 100}€</Text>
                            </View>
                          )}
                        </View>
                      </View>
                    </Pressable>
                  ))}
                </>
              ) : searchText.length >= 2 ? (
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>Aucun résultat trouvé</Text>
                  <Text style={styles.emptySubtext}>Essayez avec d'autres termes de recherche</Text>
                </View>
              ) : (
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>
                    {searchMode === 'by-course'
                      ? 'Recherchez un parcours'
                      : 'Recherchez un professionnel'}
                  </Text>
                  <Text style={styles.emptySubtext}>Entrez au moins 2 caractères</Text>
                </View>
              )}
            </View>
          </KeyboardAwareScrollView>
        </View>
      </View>
    </Modal>
  );
};

export const SearchOverlay = memo(SearchOverlayComponent);

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  modalContainer: {
    width: '90%',
    maxWidth: 400,
    maxHeight: '90%',
    backgroundColor: Colors.neutral.white,
    borderRadius: 16,
    overflow: 'hidden',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.neutral.charcoal,
    textAlign: 'center',
    paddingVertical: Spacing.l,
    backgroundColor: Colors.neutral.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.ui.inputBorder,
  },
  keyboardAwareContainer: {
    flex: 1,
  },
  keyboardAwareContent: {
    flexGrow: 1,
  },
  searchContainer: {
    paddingHorizontal: Spacing.m,
    paddingBottom: Spacing.m,
    backgroundColor: Colors.neutral.white,
  },
  tabsContainer: {
    flexDirection: 'row',
    marginBottom: Spacing.m,
    borderBottomWidth: 1,
    borderBottomColor: Colors.ui.inputBorder,
  },
  tab: {
    flex: 1,
    paddingVertical: Spacing.s,
    alignItems: 'center',
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: Colors.primary.accent,
  },
  tabText: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.ui.secondaryText,
  },
  tabTextActive: {
    color: Colors.primary.accent,
    fontWeight: '600',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.ui.inputBackground,
    borderRadius: BorderRadius.medium,
    paddingHorizontal: Spacing.m,
    paddingVertical: Spacing.s,
    borderWidth: 1,
    borderColor: Colors.ui.inputBorder,
  },
  searchIcon: {
    marginRight: Spacing.s,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: Colors.neutral.charcoal,
  },
  resultsContainer: {
    flex: 1,
    backgroundColor: Colors.neutral.white,
    paddingHorizontal: Spacing.m,
    paddingBottom: Spacing.m,
  },
  resultsTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: Spacing.m,
    color: Colors.neutral.charcoal,
  },
  resultCard: {
    flexDirection: 'row',
    backgroundColor: Colors.neutral.white,
    borderRadius: BorderRadius.medium,
    marginBottom: Spacing.s,
    padding: Spacing.s,
    borderWidth: 1,
    borderColor: Colors.ui.inputBorder,
  },
  resultImage: {
    width: 60,
    height: 60,
    borderRadius: BorderRadius.small,
    backgroundColor: Colors.ui.inputBackground,
    marginRight: Spacing.s,
  },
  resultContent: {
    flex: 1,
    justifyContent: 'space-between',
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.neutral.dark,
    flex: 1,
    marginRight: 8,
  },
  resultSubtitle: {
    fontSize: 14,
    color: Colors.ui.secondaryText,
    marginBottom: 6,
  },
  resultMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    color: Colors.ui.secondaryText,
  },
  priceText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary.accent,
  },
  availableBadge: {
    backgroundColor: Colors.primary.accent,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  availableBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  modeToggle: {
    flexDirection: 'row',
    marginBottom: 15,
    backgroundColor: Colors.ui.inputBackground,
    borderRadius: 8,
    padding: 4,
  },
  modeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  modeButtonActive: {
    backgroundColor: Colors.primary.accent,
  },
  modeButtonText: {
    marginLeft: 6,
    fontSize: 14,
    color: Colors.ui.secondaryText,
    fontWeight: '500',
  },
  modeButtonTextActive: {
    color: 'white',
  },
  clearButton: {
    padding: 4,
  },
  filtersContainer: {
    marginTop: Spacing.m,
  },
  filtersContent: {
    paddingHorizontal: Spacing.m,
    gap: Spacing.xs,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: Colors.ui.inputBackground,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.ui.inputBorder,
    marginRight: 8,
    gap: 4,
  },
  filterChipActive: {
    backgroundColor: Colors.secondary.bunker + '20',
    borderColor: Colors.primary.accent,
  },
  filterText: {
    fontSize: 14,
    color: Colors.neutral.charcoal,
  },
  filterTextActive: {
    color: Colors.primary.accent,
    fontWeight: '600',
  },
  loadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
    color: Colors.ui.secondaryText,
  },
  errorContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  errorText: {
    fontSize: 14,
    color: Colors.error,
  },
  emptyContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: Colors.neutral.charcoal,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: Colors.ui.secondaryText,
  },
  resultIconAvailable: {
    backgroundColor: Colors.secondary.bunker + '20',
  },
  availableText: {
    fontSize: 12,
    color: Colors.primary.accent,
    marginTop: 2,
  },
  resultsGroups: {
    flex: 1,
  },
  resultsGroupTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.ui.secondaryText,
    marginTop: 15,
    marginBottom: 10,
    paddingHorizontal: 10,
    textTransform: 'uppercase',
  },
});
