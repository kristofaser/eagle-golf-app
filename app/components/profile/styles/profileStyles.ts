import { StyleSheet } from 'react-native';
import { Colors, Spacing, Elevation, Typography, BorderRadius } from '@/constants/theme';

// Constantes pour l'animation du header
export const HEADER_HEIGHT = 60;
export const IMAGE_HEIGHT = 300;

// Couleurs pour les sections (consolidées avec design system Eagle Golf)
export const sectionColors = {
  availability: {
    background: Colors.neutral.white,
    accent: Colors.primary.electric,
    icon: Colors.primary.electric,
  },
  level: {
    background: Colors.neutral.white,
    accent: Colors.semantic.success.default,
    icon: Colors.semantic.success.default,
  },
  experience: {
    background: Colors.neutral.white,
    accent: Colors.semantic.warning.default,
    icon: Colors.semantic.warning.default,
  },
};

export const profileStyles = StyleSheet.create({
  // Container styles
  container: {
    flex: 1,
    backgroundColor: Colors.neutral.white,
  },
  scrollView: {
    flex: 1,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Image styles
  imageContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    width: '100%',
    height: IMAGE_HEIGHT,
    overflow: 'hidden',
  },
  heroImage: {
    width: '100%',
    height: IMAGE_HEIGHT,
    backgroundColor: Colors.neutral.cloud,
  },

  // Content styles
  content: {
    padding: 16,
    backgroundColor: Colors.neutral.cloud,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    marginTop: -20,
    minHeight: 600,
    paddingBottom: 100,
  },

  // Header styles
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    height: HEADER_HEIGHT,
  },
  headerIcons: {
    position: 'absolute',
    left: 0,
    right: 0,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 16,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.neutral.charcoal,
  },
  headerAvailability: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },

  // Profile info styles
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.neutral.charcoal,
  },
  badgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 12,
  },
  rankingText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.neutral.course,
  },
  divisionText: {
    backgroundColor: Colors.neutral.charcoal,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 14,
    alignSelf: 'flex-start',
    fontSize: 14,
    fontWeight: '600',
    color: Colors.neutral.white,
  },

  // Availability indicator
  availabilityIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  availabilityDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.semantic.success.default,
    marginRight: 6,
  },
  availabilityDotSmall: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.semantic.success.default,
    marginRight: 4,
  },
  unavailableDot: {
    backgroundColor: Colors.neutral.course,
  },
  availabilityText: {
    fontSize: 12,
    color: Colors.semantic.success.default,
    fontWeight: '500',
  },
  availabilityTextSmall: {
    fontSize: 12,
    color: Colors.semantic.success.default,
  },
  unavailableText: {
    color: Colors.neutral.course,
  },

  // Card styles
  card: {
    marginBottom: 16,
    padding: 20,
    borderRadius: 16,
    backgroundColor: 'white',
    ...Elevation.small,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.neutral.charcoal,
    flex: 1,
  },
  accentLine: {
    height: 3,
    width: 40,
    borderRadius: 2,
    marginBottom: 16,
  },

  // Icon button
  iconButton: {
    padding: 8,
    minWidth: 44,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Skills styles
  skillsContainer: {
    marginTop: 12,
  },
  skillRow: {
    marginBottom: 16,
  },
  skillLabelContainer: {
    marginBottom: 8,
  },
  skillLabelWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  skillIconContainer: {
    width: 28,
    alignItems: 'flex-start',
  },
  skillLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.neutral.charcoal,
  },
  skillBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  skillBarBackground: {
    flex: 1,
    height: 8,
    backgroundColor: Colors.neutral.mist,
    borderRadius: 4,
    overflow: 'hidden',
  },
  skillBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  skillValue: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.neutral.iron,
    minWidth: 45,
    textAlign: 'right',
  },
  videoIconButton: {
    marginLeft: 4,
    padding: 13,
    minWidth: 44,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Experience styles
  experienceList: {
    marginTop: 4,
  },
  experienceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  experienceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: Colors.neutral.iron,
    marginRight: 12,
  },
  winnerBadge: {
    backgroundColor: Colors.secondary.gold, // Or Eagle Golf
  },
  top5Badge: {
    backgroundColor: Colors.semantic.error.default, // Rouge
  },
  top10Badge: {
    backgroundColor: Colors.semantic.info.default, // Bleu
  },
  top20Badge: {
    backgroundColor: Colors.semantic.success.default, // Vert
  },
  top30Badge: {
    backgroundColor: Colors.neutral.course, // Gris
  },
  experienceBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.neutral.white,
    marginLeft: 4,
  },
  experienceDescription: {
    flex: 1,
    fontSize: 15,
    color: Colors.neutral.iron,
    lineHeight: 20,
  },

  // Booking footer styles
  bookingButtonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: Colors.neutral.mist,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...Elevation.medium,
  },
  bookingPriceInfo: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  bookingPricePrefix: {
    fontSize: 12,
    color: Colors.neutral.iron,
    marginBottom: 2,
  },
  bookingPrice: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.neutral.charcoal,
  },
  bookingButton: {
    backgroundColor: Colors.primary.accent,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 8,
    minHeight: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bookingButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },

  // Players selector styles
  playersSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  playerButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.neutral.cloud,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.neutral.mist,
  },
  playerButtonDisabled: {
    opacity: 0.5,
  },
  playersDisplay: {
    alignItems: 'center',
    minWidth: 60,
  },
  playersNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.neutral.charcoal,
  },
  playersLabel: {
    fontSize: 11,
    color: Colors.neutral.iron,
  },

  // Error and back button styles
  errorText: {
    fontSize: 16,
    color: Colors.semantic.error,
    textAlign: 'center',
    marginBottom: 20,
  },
  backButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: Colors.primary.accent,
    borderRadius: 8,
  },
  backButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },

  // Not available styles
  notAvailableTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: Colors.neutral.charcoal,
    marginTop: 20,
    marginBottom: 10,
  },
  notAvailableText: {
    fontSize: 16,
    color: Colors.neutral.iron,
    textAlign: 'center',
    paddingHorizontal: 40,
    marginBottom: 30,
  },
});
