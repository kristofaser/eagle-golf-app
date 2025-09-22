import { StyleSheet } from 'react-native';
import { Colors, Spacing } from '@/constants/theme';

/**
 * Styles communs réutilisables dans toute l'application
 * Permet d'éviter la duplication de code et d'assurer la cohérence visuelle
 */
export const commonStyles = StyleSheet.create({
  // Containers
  container: {
    flex: 1,
    backgroundColor: Colors.neutral.cloud,
  },
  containerWhite: {
    flex: 1,
    backgroundColor: Colors.neutral.white,
  },
  safeContainer: {
    flex: 1,
    backgroundColor: Colors.neutral.cloud,
  },

  // Centering
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerHorizontal: {
    alignItems: 'center',
  },
  centerVertical: {
    justifyContent: 'center',
  },

  // Loading & Error states
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.neutral.cloud,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    backgroundColor: Colors.neutral.cloud,
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
  },

  // Text styles
  errorText: {
    textAlign: 'center',
    color: Colors.semantic.error.default,
    marginBottom: Spacing.m,
  },
  loadingText: {
    marginTop: Spacing.m,
    color: Colors.neutral.charcoal,
  },

  // Buttons
  retryButton: {
    marginTop: Spacing.m,
    paddingVertical: Spacing.s,
    paddingHorizontal: Spacing.l,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.primary.accent,
  },

  // Layout helpers
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rowCenter: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Spacing
  marginTopSmall: {
    marginTop: Spacing.s,
  },
  marginTopMedium: {
    marginTop: Spacing.m,
  },
  marginTopLarge: {
    marginTop: Spacing.l,
  },
  marginBottomSmall: {
    marginBottom: Spacing.s,
  },
  marginBottomMedium: {
    marginBottom: Spacing.m,
  },
  marginBottomLarge: {
    marginBottom: Spacing.l,
  },
  paddingHorizontal: {
    paddingHorizontal: Spacing.m,
  },
  paddingVertical: {
    paddingVertical: Spacing.m,
  },

  // Common patterns
  sectionContainer: {
    marginTop: Spacing.l,
  },
  sectionTitle: {
    marginBottom: Spacing.m,
    paddingHorizontal: Spacing.m,
  },

  // List helpers
  listContainer: {
    paddingBottom: Spacing.xl,
  },
  listSeparator: {
    height: 1,
    backgroundColor: Colors.neutral.mist,
    marginVertical: Spacing.s,
  },

  // Form helpers
  formContainer: {
    padding: Spacing.m,
  },
  inputContainer: {
    marginBottom: Spacing.m,
  },

  // Absolute positioning
  absoluteFull: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  absoluteCenter: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -50 }, { translateY: -50 }],
  },
});

// Helper function pour combiner les styles
export const combineStyles = (...styles: any[]) => {
  return styles.filter(Boolean).flat();
};
