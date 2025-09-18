/**
 * NotificationTester - Composant de test pour le système de notifications Phase 1
 *
 * Interface de développement pour tester les notifications en local.
 * À supprimer avant la production.
 */
import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
} from 'react-native';
import { useAuth } from '@/hooks/useAuth';
import { useNotificationRealtimeSimple } from '@/hooks/useNotificationRealtime';
import { useNotificationBadgeSimple } from '@/hooks/useNotificationBadge';
import { useNotificationList } from '@/hooks/useNotificationList';
import { useNotificationActions, useUnreadCount, useNotificationItems } from '@/stores/useUIStore';
import { NotificationBadge } from '@/components/atoms/NotificationBadge';
import { NotificationPanel } from '@/components/organisms/NotificationPanel';

export const NotificationTester: React.FC = () => {
  const { user } = useAuth();
  const [showPanel, setShowPanel] = useState(false);

  // Hooks du système de notifications
  const notificationRealtime = useNotificationRealtimeSimple(user?.id);
  const notificationBadge = useNotificationBadgeSimple(user?.id);
  const notificationList = useNotificationList(user?.id);

  // Store UI
  const notificationActions = useNotificationActions();
  const unreadCount = useUnreadCount();
  const notificationItems = useNotificationItems();

  const handleTestLocalNotification = () => {
    const testNotification = {
      id: `test-${Date.now()}`,
      type: 'info' as const,
      title: 'Test Local',
      message: 'Notification de test créée localement dans le store UI.',
      read: false,
    };

    notificationActions.addNotification(testNotification);
    Alert.alert('Test', 'Notification locale ajoutée au store UI');
  };

  const handleTestDatabaseNotification = async () => {
    if (!user?.id) {
      Alert.alert('Erreur', 'Utilisateur non connecté');
      return;
    }

    try {
      // Simuler une création de notification directement en base
      const { data, error } = await import('@/utils/supabase/client').then(
        module => module.supabase.rpc('create_notification', {
          p_user_id: user.id,
          p_type: 'custom',
          p_title: 'Test Database',
          p_message: 'Notification créée directement en base de données via RPC.',
          p_data: { test: true, timestamp: new Date().toISOString() }
        })
      );

      if (error) {
        throw error;
      }

      Alert.alert('Succès', 'Notification créée en base. Elle devrait apparaître via Realtime.');
    } catch (err) {
      console.error('Erreur test DB:', err);
      Alert.alert('Erreur', 'Impossible de créer la notification en base');
    }
  };

  const handleTestTravelNotification = async () => {
    try {
      const { data, error } = await import('@/utils/supabase/client').then(
        module => module.supabase.rpc('create_travel_notification', {
          p_title: 'Test Voyage',
          p_message: 'Nouvelle destination disponible : Parcours de rêve à Deauville !',
          p_data: { location: 'Deauville', type: 'new_course', test: true },
          p_target_users: user?.id ? [user.id] : null
        })
      );

      if (error) {
        throw error;
      }

      Alert.alert('Succès', `${data || 0} notification(s) voyage envoyée(s)`);
    } catch (err) {
      console.error('Erreur test voyage:', err);
      Alert.alert('Erreur', 'Impossible de créer la notification voyage');
    }
  };

  const handleClearAll = () => {
    notificationActions.clearNotifications();
    Alert.alert('Info', 'Toutes les notifications locales supprimées');
  };

  if (!user) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Utilisateur non connecté</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>🧪 Testeur Notifications Phase 1</Text>

      {/* État du système */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>État du système</Text>
        <View style={styles.statusGrid}>
          <View style={styles.statusItem}>
            <Text style={styles.statusLabel}>Realtime</Text>
            <Text style={[styles.statusValue, { color: notificationRealtime.isActive ? '#10b981' : '#ef4444' }]}>
              {notificationRealtime.isActive ? 'Actif' : 'Inactif'}
            </Text>
          </View>
          <View style={styles.statusItem}>
            <Text style={styles.statusLabel}>Badge</Text>
            <View style={styles.badgeContainer}>
              <NotificationBadge count={notificationBadge.count} />
              <Text style={styles.statusValue}>{notificationBadge.count}</Text>
            </View>
          </View>
          <View style={styles.statusItem}>
            <Text style={styles.statusLabel}>Store UI</Text>
            <Text style={styles.statusValue}>{unreadCount} non lues</Text>
          </View>
          <View style={styles.statusItem}>
            <Text style={styles.statusLabel}>Items Store</Text>
            <Text style={styles.statusValue}>{notificationItems.length} items</Text>
          </View>
        </View>
      </View>

      {/* Actions de test */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Actions de test</Text>

        <TouchableOpacity style={styles.button} onPress={handleTestLocalNotification}>
          <Text style={styles.buttonText}>📱 Test Notification Locale</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={handleTestDatabaseNotification}>
          <Text style={styles.buttonText}>🗄️ Test Notification Base</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={handleTestTravelNotification}>
          <Text style={styles.buttonText}>✈️ Test Notification Voyage</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.button, styles.buttonSecondary]} onPress={() => setShowPanel(true)}>
          <Text style={styles.buttonTextSecondary}>📋 Ouvrir Panneau Notifications</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.button, styles.buttonDanger]} onPress={handleClearAll}>
          <Text style={styles.buttonTextDanger}>🗑️ Vider Store Local</Text>
        </TouchableOpacity>
      </View>

      {/* État de la liste */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>État de la liste</Text>
        <View style={styles.listStatus}>
          <Text style={styles.statusText}>
            Loading: {notificationList.isLoading ? 'Oui' : 'Non'}
          </Text>
          <Text style={styles.statusText}>
            Erreur: {notificationList.error || 'Aucune'}
          </Text>
          <Text style={styles.statusText}>
            Total DB: {notificationList.notifications.length}
          </Text>
          <Text style={styles.statusText}>
            Non lues DB: {notificationList.totalUnread}
          </Text>
          <Text style={styles.statusText}>
            Has More: {notificationList.hasMore ? 'Oui' : 'Non'}
          </Text>
        </View>
      </View>

      {/* Actions rapides */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Actions rapides</Text>

        <TouchableOpacity style={styles.buttonSmall} onPress={notificationList.refresh}>
          <Text style={styles.buttonTextSmall}>🔄 Refresh Liste</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.buttonSmall} onPress={notificationBadge.refresh}>
          <Text style={styles.buttonTextSmall}>🔢 Refresh Badge</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.buttonSmall} onPress={notificationRealtime.reconnect}>
          <Text style={styles.buttonTextSmall}>🔗 Reconnect Realtime</Text>
        </TouchableOpacity>
      </View>

      {/* Panneau de notifications */}
      {showPanel && (
        <View style={styles.panelContainer}>
          <NotificationPanel
            onClose={() => setShowPanel(false)}
            onNotificationPress={(notif) => {
              Alert.alert('Notification tapée', notif.title);
            }}
            fullScreen={false}
          />
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
    padding: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 24,
    color: '#1e293b',
  },
  section: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    color: '#374151',
  },
  statusGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statusItem: {
    width: '48%',
    marginBottom: 8,
  },
  statusLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 2,
  },
  statusValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
  },
  badgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  button: {
    backgroundColor: '#3b82f6',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  buttonSecondary: {
    backgroundColor: '#e5e7eb',
  },
  buttonTextSecondary: {
    color: '#374151',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  buttonDanger: {
    backgroundColor: '#ef4444',
  },
  buttonTextDanger: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  buttonSmall: {
    backgroundColor: '#f3f4f6',
    borderRadius: 6,
    padding: 8,
    marginBottom: 4,
  },
  buttonTextSmall: {
    color: '#374151',
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
  listStatus: {
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    padding: 8,
  },
  statusText: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 2,
  },
  panelContainer: {
    height: 400,
    marginTop: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  errorText: {
    fontSize: 16,
    color: '#ef4444',
    textAlign: 'center',
    marginTop: 32,
  },
});