/**
 * NotificationItem - Élément individuel de notification
 *
 * Composant molecule pour afficher une notification dans la liste.
 * Gère l'affichage, les interactions et le formatage des données.
 */
import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { NotificationUIItem } from '@/stores/useUIStore';

export interface NotificationItemProps {
  /**
   * Données de la notification
   */
  notification: NotificationUIItem;

  /**
   * Callback lors du tap sur la notification
   */
  onPress?: (notification: NotificationUIItem) => void;

  /**
   * Callback pour marquer comme lue
   */
  onMarkAsRead?: (id: string) => void;

  /**
   * Callback pour supprimer
   */
  onDelete?: (id: string) => void;

  /**
   * Affichage compact (pour overlay)
   * @default false
   */
  compact?: boolean;

  /**
   * Style personnalisé
   */
  style?: any;
}

export const NotificationItem: React.FC<NotificationItemProps> = ({
  notification,
  onPress,
  onMarkAsRead,
  onDelete,
  compact = false,
  style,
}) => {
  const handlePress = () => {
    // Marquer comme lue automatiquement au tap
    if (!notification.read && onMarkAsRead) {
      onMarkAsRead(notification.id);
    }

    // Callback personnalisé
    onPress?.(notification);
  };

  // Couleur selon le type
  const typeColor = getTypeColor(notification.type);

  // Temps relatif
  const timeAgo = formatDistanceToNow(notification.timestamp, {
    addSuffix: true,
    locale: fr,
  });

  return (
    <TouchableOpacity
      style={[
        styles.container,
        compact && styles.compactContainer,
        !notification.read && styles.unreadContainer,
        style
      ]}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      {/* Indicateur visuel du type */}
      <View style={[styles.typeIndicator, { backgroundColor: typeColor }]} />

      {/* Contenu principal */}
      <View style={styles.content}>
        <View style={styles.header}>
          <Text
            style={[
              styles.title,
              !notification.read && styles.unreadTitle
            ]}
            numberOfLines={1}
          >
            {notification.title}
          </Text>

          <Text style={styles.time}>
            {timeAgo}
          </Text>
        </View>

        <Text
          style={[
            styles.message,
            compact && styles.compactMessage
          ]}
          numberOfLines={compact ? 2 : 3}
        >
          {notification.message}
        </Text>

        {/* Badge type pour les notifications importantes */}
        {(notification.type === 'error' || notification.type === 'warning') && (
          <View style={[styles.typeBadge, { backgroundColor: typeColor }]}>
            <Text style={styles.typeBadgeText}>
              {getTypeLabel(notification.type)}
            </Text>
          </View>
        )}
      </View>

      {/* Indicateur non lu */}
      {!notification.read && (
        <View style={styles.unreadDot} />
      )}
    </TouchableOpacity>
  );
};

// Helpers
function getTypeColor(type: NotificationUIItem['type']): string {
  switch (type) {
    case 'success':
      return '#10b981'; // Vert
    case 'error':
      return '#ef4444'; // Rouge
    case 'warning':
      return '#f59e0b'; // Orange
    case 'info':
    default:
      return '#3b82f6'; // Bleu
  }
}

function getTypeLabel(type: NotificationUIItem['type']): string {
  switch (type) {
    case 'success':
      return 'Succès';
    case 'error':
      return 'Erreur';
    case 'warning':
      return 'Attention';
    case 'info':
    default:
      return 'Info';
  }
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 6,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  compactContainer: {
    padding: 12,
    marginVertical: 4,
  },
  unreadContainer: {
    backgroundColor: '#fefefe',
    borderColor: '#e2e8f0',
    shadowOpacity: 0.08,
  },
  typeIndicator: {
    width: 4,
    borderRadius: 2,
    marginRight: 12,
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    flex: 1,
    marginRight: 8,
  },
  unreadTitle: {
    color: '#0f172a',
    fontWeight: '700',
  },
  time: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
  },
  message: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 20,
    marginBottom: 8,
  },
  compactMessage: {
    fontSize: 13,
    lineHeight: 18,
  },
  typeBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 4,
  },
  typeBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#ffffff',
    textTransform: 'uppercase',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#3b82f6',
    marginLeft: 8,
    marginTop: 4,
  },
});