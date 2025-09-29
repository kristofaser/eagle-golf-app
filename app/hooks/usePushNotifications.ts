/**
 * Hook usePushNotifications - Gestion des notifications push natives
 *
 * Hook pour gérer l'enregistrement, les permissions et la réception
 * des push notifications via Expo Notifications.
 *
 * ✅ SÉCURISÉ : Token storage avec AsyncStorage + Supabase
 * ✅ PERFORMANT : Cache intelligent et sync automatique
 * ✅ COMPATIBLE : iOS + Android avec fallback gracieux
 * ✅ INTÉGRÉ : Se synchronise avec le système de notifications existant
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/utils/supabase/client';
import { logger } from '@/utils/logger';

const STORAGE_KEY = 'expo_push_token';

export interface PushNotificationState {
  token: string | null;
  permission: Notifications.PermissionStatus;
  isLoading: boolean;
  error: string | null;
  isRegistered: boolean;
  deviceInfo: DeviceInfo | null;
}

export interface DeviceInfo {
  deviceName: string | null;
  platform: 'ios' | 'android' | 'web';
  osVersion: string | null;
  appVersion: string;
  isDevice: boolean;
}

export interface PushNotificationOptions {
  /**
   * Enregistrer automatiquement le token au montage
   * @default true
   */
  autoRegister?: boolean;

  /**
   * Synchroniser automatiquement avec Supabase
   * @default true
   */
  syncWithBackend?: boolean;

  /**
   * Gérer automatiquement les notifications reçues
   * @default true
   */
  handleIncoming?: boolean;

  /**
   * Debug mode
   * @default false
   */
  debug?: boolean;
}

/**
 * Configuration par défaut des notifications
 */
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

/**
 * Hook principal pour les push notifications
 */
export function usePushNotifications(
  userId: string | null | undefined,
  options: PushNotificationOptions = {}
) {
  const {
    autoRegister = true,
    syncWithBackend = true,
    handleIncoming = true,
    debug = false,
  } = options;

  // État du hook
  const [state, setState] = useState<PushNotificationState>({
    token: null,
    permission: 'undetermined' as Notifications.PermissionStatus,
    isLoading: true,
    error: null,
    isRegistered: false,
    deviceInfo: null,
  });

  // Références pour les listeners
  const notificationListener = useRef<Notifications.Subscription>();
  const responseListener = useRef<Notifications.Subscription>();

  /**
   * Récupère les informations de l'appareil
   */
  const getDeviceInfo = useCallback((): DeviceInfo => {
    return {
      deviceName: Device.deviceName,
      platform: Platform.OS as 'ios' | 'android',
      osVersion: Device.osVersion,
      appVersion: Constants.expoConfig?.version || '1.0.0',
      isDevice: Device.isDevice,
    };
  }, []);

  /**
   * Demande les permissions de notifications
   */
  const requestPermission = useCallback(async (): Promise<boolean> => {
    try {

      if (debug) {
        logger.dev('📱 usePushNotifications: Demande permissions...');
      }

      // Sur web, vérifier si VAPID est configuré
      if (Platform.OS === 'web') {
        const vapidKey = Constants.expoConfig?.notification?.vapidPublicKey;
        if (!vapidKey) {
          if (debug) {
            logger.dev('ℹ️ usePushNotifications: Skip permissions web - VAPID non configuré');
          }
          setState((prev) => ({
            ...prev,
            permission: 'undetermined' as Notifications.PermissionStatus,
          }));
          return false;
        }
      }

      // Vérifier si on est sur un appareil physique (mobile seulement)
      if (Platform.OS !== 'web' && !Device.isDevice) {
        setState((prev) => ({
          ...prev,
          error: 'Les push notifications ne fonctionnent que sur un appareil physique',
        }));
        return false;
      }

      // Demander les permissions
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      setState((prev) => ({
        ...prev,
        permission: finalStatus,
      }));

      if (finalStatus !== 'granted') {
        setState((prev) => ({
          ...prev,
          error: 'Permission de notifications refusée',
        }));
        return false;
      }

      if (debug) {
        logger.dev('✅ usePushNotifications: Permissions accordées');
      }

      return true;
    } catch (err) {
      logger.error('❌ Erreur demande permissions push:', err);
      setState((prev) => ({
        ...prev,
        error: err instanceof Error ? err.message : 'Erreur permissions',
      }));
      return false;
    }
  }, [debug]);

  /**
   * Obtient le token Expo Push
   */
  const getExpoPushToken = useCallback(async (): Promise<string | null> => {
    try {
      if (debug) {
        logger.dev('🔑 usePushNotifications: Récupération token...');
      }

      // Sur web, les notifications push nécessitent VAPID
      if (Platform.OS === 'web') {
        const vapidKey = Constants.expoConfig?.notification?.vapidPublicKey;
        if (!vapidKey) {
          if (debug) {
            logger.dev('ℹ️ usePushNotifications: Push notifications non configurées pour web (VAPID requis)');
          }
          // Ne pas considérer comme une erreur, juste non supporté
          return null;
        }

        // Pour le web, nous devons gérer les subscriptions différemment
        // Expo génère toujours un token même sur web, mais nous devrons
        // aussi stocker la subscription Web Push native plus tard
      }

      // Configuration du projet (nécessaire pour EAS)
      const projectId = Constants.expoConfig?.extra?.eas?.projectId;

      if (!projectId) {
        throw new Error('Project ID Expo manquant dans la configuration');
      }

      const tokenData = await Notifications.getExpoPushTokenAsync({
        projectId,
      });

      if (debug) {
        logger.dev('✅ usePushNotifications: Token obtenu:', tokenData.data);
      }

      return tokenData.data;
    } catch (err) {
      // Sur web, ne pas logger comme erreur si c'est lié à VAPID
      if (Platform.OS === 'web' && err instanceof Error && err.message.includes('vapidPublicKey')) {
        if (debug) {
          logger.dev('ℹ️ usePushNotifications: Push web non disponible (VAPID non configuré)');
        }
        return null;
      }

      logger.error('❌ Erreur récupération token push:', err);
      setState((prev) => ({
        ...prev,
        error: err instanceof Error ? err.message : 'Erreur token',
      }));
      return null;
    }
  }, [debug]);

  /**
   * Enregistre le token en local et en base
   */
  const registerToken = useCallback(
    async (token: string): Promise<boolean> => {
      try {
        if (!userId || !syncWithBackend) {
          // Stocker seulement en local si pas d'userId
          await AsyncStorage.setItem(`${STORAGE_KEY}_${userId || 'anonymous'}`, token);
          return true;
        }

        const deviceInfo = getDeviceInfo();

        if (debug) {
          logger.dev('💾 usePushNotifications: Sauvegarde token en base...', {
            userId,
            platform: deviceInfo.platform,
            isDevice: deviceInfo.isDevice,
          });
        }

        // Sauvegarder en base Supabase
        const { error } = await supabase.from('device_tokens').upsert(
          {
            user_id: userId,
            expo_push_token: token,
            platform: deviceInfo.platform,
            device_info: {
              deviceName: deviceInfo.deviceName,
              osVersion: deviceInfo.osVersion,
              appVersion: deviceInfo.appVersion,
              isDevice: deviceInfo.isDevice,
            },
            is_active: true,
            updated_at: new Date().toISOString(),
          },
          {
            onConflict: 'user_id,expo_push_token',
          }
        );

        if (error) {
          throw error;
        }

        // Sauvegarder aussi en local (cache)
        await AsyncStorage.setItem(`${STORAGE_KEY}_${userId}`, token);

        if (debug) {
          logger.dev('✅ usePushNotifications: Token sauvegardé avec succès');
        }

        return true;
      } catch (err) {
        logger.error('❌ Erreur sauvegarde token push:', err);
        setState((prev) => ({
          ...prev,
          error: err instanceof Error ? err.message : 'Erreur sauvegarde token',
        }));
        return false;
      }
    },
    [userId, syncWithBackend, getDeviceInfo, debug]
  );

  /**
   * Processus complet d'enregistrement pour les push notifications
   */
  const registerForPushNotifications = useCallback(async (): Promise<boolean> => {
    try {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));


      if (debug) {
        logger.dev('🚀 usePushNotifications: Début enregistrement...');
      }

      // 1. Vérifier les permissions
      const hasPermission = await requestPermission();
      if (!hasPermission) {
        return false;
      }

      // 2. Obtenir le token
      const token = await getExpoPushToken();
      if (!token) {
        return false;
      }

      // 3. Enregistrer le token
      const registered = await registerToken(token);
      if (!registered) {
        return false;
      }

      // 4. Mettre à jour l'état
      setState((prev) => ({
        ...prev,
        token,
        isRegistered: true,
        isLoading: false,
        deviceInfo: getDeviceInfo(),
      }));

      if (debug) {
        logger.dev('🎉 usePushNotifications: Enregistrement terminé avec succès');
      }

      return true;
    } catch (err) {
      logger.error('❌ Erreur enregistrement push notifications:', err);
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: err instanceof Error ? err.message : 'Erreur enregistrement',
      }));
      return false;
    }
  }, [requestPermission, getExpoPushToken, registerToken, getDeviceInfo, debug]);

  /**
   * Supprime l'enregistrement des push notifications
   */
  const unregisterPushNotifications = useCallback(async (): Promise<boolean> => {
    try {
      if (debug) {
        logger.dev('🗑️ usePushNotifications: Suppression enregistrement...');
      }

      // Supprimer de la base si user connecté
      if (userId && syncWithBackend) {
        const { error } = await supabase
          .from('device_tokens')
          .update({ is_active: false })
          .eq('user_id', userId);

        if (error) {
          logger.warn('Erreur suppression token en base:', error);
          // Continuer malgré l'erreur
        }
      }

      // Supprimer du cache local
      if (userId) {
        await AsyncStorage.removeItem(`${STORAGE_KEY}_${userId}`);
      }

      setState((prev) => ({
        ...prev,
        token: null,
        isRegistered: false,
      }));

      if (debug) {
        logger.dev('✅ usePushNotifications: Suppression terminée');
      }

      return true;
    } catch (err) {
      logger.error('❌ Erreur suppression push notifications:', err);
      setState((prev) => ({
        ...prev,
        error: err instanceof Error ? err.message : 'Erreur suppression',
      }));
      return false;
    }
  }, [userId, syncWithBackend, debug]);

  /**
   * Gestionnaire pour les notifications reçues
   */
  const handleNotificationReceived = useCallback(
    (notification: Notifications.Notification) => {
      if (debug) {
        logger.dev('📨 usePushNotifications: Notification reçue:', notification);
      }

      // Ici on peut ajouter une logique personnalisée
      // Par exemple, mettre à jour un store global ou naviguer
    },
    [debug]
  );

  /**
   * Gestionnaire pour les interactions avec les notifications
   */
  const handleNotificationResponse = useCallback(
    (response: Notifications.NotificationResponse) => {
      if (debug) {
        logger.dev('👆 usePushNotifications: Interaction notification:', response);
      }

      // Ici on peut gérer la navigation ou les actions
      const { notification } = response;
      const data = notification.request.content.data;

      // Exemple de navigation basée sur les données
      if (data?.screen) {
        // router.push(data.screen);
      }
    },
    [debug]
  );

  /**
   * Charge le token depuis le cache local
   */
  const loadCachedToken = useCallback(async () => {
    try {
      if (!userId) return;

      const cachedToken = await AsyncStorage.getItem(`${STORAGE_KEY}_${userId}`);
      if (cachedToken) {
        setState((prev) => ({
          ...prev,
          token: cachedToken,
          isRegistered: true,
          deviceInfo: getDeviceInfo(),
        }));

        if (debug) {
          logger.dev('📱 usePushNotifications: Token chargé depuis le cache');
        }
      }
    } catch (err) {
      logger.warn('Erreur chargement token cache:', err);
    }
  }, [userId, getDeviceInfo, debug]);

  // Setup des listeners de notifications
  useEffect(() => {
    if (!handleIncoming) return;

    if (debug) {
      logger.dev('🔗 usePushNotifications: Setup listeners...');
    }

    // Listener pour les notifications reçues
    notificationListener.current = Notifications.addNotificationReceivedListener(
      handleNotificationReceived
    );

    // Listener pour les interactions utilisateur
    responseListener.current = Notifications.addNotificationResponseReceivedListener(
      handleNotificationResponse
    );

    return () => {
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(notificationListener.current);
      }
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }

      if (debug) {
        logger.dev('🔌 usePushNotifications: Listeners supprimés');
      }
    };
  }, [handleIncoming, handleNotificationReceived, handleNotificationResponse, debug]);

  // Enregistrement automatique avec gestion du timing userId
  useEffect(() => {
    const initializeNotifications = async () => {
      // Charger le token en cache d'abord
      await loadCachedToken();

      // Enregistrer automatiquement si demandé ET userId disponible
      if (autoRegister && userId) {
        if (debug) {
          logger.dev('🔄 usePushNotifications: Auto-registration avec userId');
        }
        await registerForPushNotifications();
      } else {
        setState((prev) => ({ ...prev, isLoading: false }));

        if (debug) {
          logger.dev('⏭️ usePushNotifications: Skip auto-registration', {
            autoRegister,
            hasUserId: !!userId,
            reason: !autoRegister ? 'auto-register disabled' : 'no userId'
          });
        }
      }
    };

    initializeNotifications();
  }, [userId, autoRegister, loadCachedToken, registerForPushNotifications, debug]);

  // Effect séparé pour re-trigger quand userId devient disponible
  useEffect(() => {
    // Si userId vient d'être défini ET qu'on n'est pas déjà enregistré
    if (autoRegister && userId && !state.isRegistered && !state.isLoading) {
      if (debug) {
        logger.dev('🚀 usePushNotifications: Re-trigger registration pour nouveau userId');
      }
      registerForPushNotifications();
    }
  }, [userId, autoRegister, state.isRegistered, state.isLoading, registerForPushNotifications, debug]);

  // Interface de retour
  return {
    // État
    ...state,

    // Actions
    registerForPushNotifications,
    unregisterPushNotifications,
    requestPermission,

    // Helpers
    isSupported: Platform.OS === 'web' ? !!Constants.expoConfig?.notification?.vapidPublicKey : Device.isDevice,
    canRegister: Platform.OS === 'web'
      ? !!userId && !!Constants.expoConfig?.notification?.vapidPublicKey
      : !!userId && Device.isDevice,
  };
}

/**
 * Version simplifiée pour usage basique
 */
export function usePushNotificationsSimple(userId: string | null | undefined) {
  return usePushNotifications(userId, {
    autoRegister: true,
    syncWithBackend: true,
    handleIncoming: true,
    debug: __DEV__,
  });
}
