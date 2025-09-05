import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { Text } from './Text';
import { Colors } from '@/constants/theme';
import { commonStyles } from '@/utils/commonStyles';

interface ErrorScreenProps {
  error: string;
  onRetry?: () => void;
  fullScreen?: boolean;
  retryText?: string;
}

/**
 * Composant réutilisable pour les états d'erreur
 * Évite la duplication du pattern d'affichage d'erreur
 */
export const ErrorScreen: React.FC<ErrorScreenProps> = ({
  error,
  onRetry,
  fullScreen = true,
  retryText = 'Réessayer',
}) => {
  const containerStyle = fullScreen ? commonStyles.errorContainer : commonStyles.centerContent;

  return (
    <View style={containerStyle}>
      <Text variant="body" style={[commonStyles.errorText, { color: Colors.semantic.error }]}>
        {error}
      </Text>
      {onRetry && (
        <TouchableOpacity onPress={onRetry} style={commonStyles.retryButton}>
          <Text variant="body" color="primary">
            {retryText}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
};
