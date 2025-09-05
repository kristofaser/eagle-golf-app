import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { Text } from './Text';
import { Colors, Spacing } from '@/constants/theme';
import { commonStyles } from '@/utils/commonStyles';

interface LoadingScreenProps {
  message?: string;
  fullScreen?: boolean;
  size?: 'small' | 'large';
  color?: string;
}

/**
 * Composant réutilisable pour les états de chargement
 * Évite la duplication du pattern ActivityIndicator dans toute l'app
 */
export const LoadingScreen: React.FC<LoadingScreenProps> = ({
  message,
  fullScreen = true,
  size = 'large',
  color = Colors.primary.accent,
}) => {
  const containerStyle = fullScreen
    ? commonStyles.loadingContainer
    : [commonStyles.centerContent, { padding: Spacing.xl }];

  return (
    <View style={containerStyle}>
      <ActivityIndicator size={size} color={color} />
      {message && (
        <Text variant="body" color="charcoal" style={commonStyles.loadingText}>
          {message}
        </Text>
      )}
    </View>
  );
};
