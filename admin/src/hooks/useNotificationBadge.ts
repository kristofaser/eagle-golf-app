'use client';

import { useEffect, useCallback } from 'react';
import { useNotifications } from './useNotifications';
import { useAdminAuth } from './useAdminAuth';

/**
 * Hook pour gérer le badge de notification avec envoi automatique d'emails
 */
export function useNotificationBadge() {
  const { adminUser } = useAdminAuth();
  const {
    isConnected,
    unreadCount,
    notifications,
    markAsRead,
    markAllAsRead
  } = useNotifications({
    autoConnect: true,
    adminUserId: adminUser?.id
  });

  // Fonction pour envoyer l'email d'une demande pro
  const sendProRequestEmail = useCallback(async (notification: any) => {
    try {
      const { demandeur_data, request_id } = notification.data;

      if (!demandeur_data || !request_id) {
        console.warn('⚠️ Données manquantes pour l\'envoi d\'email:', notification.id);
        return;
      }

      // Récupérer tous les emails d'admins actifs
      const adminEmails = ['christophe.yargui@gmail.com']; // TODO: récupérer dynamiquement

      const response = await fetch('/api/send-pro-request-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          demandeur: demandeur_data,
          requestId: request_id,
          adminEmails: adminEmails
        })
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Email envoyé avec succès:', result.emailId);
      } else {
        const error = await response.json();
        console.error('❌ Erreur envoi email:', error);
      }
    } catch (error) {
      console.error('❌ Erreur lors de l\'envoi d\'email:', error);
    }
  }, []);

  // Traiter les nouvelles notifications pour l'envoi d'emails
  useEffect(() => {
    if (!notifications || notifications.length === 0) return;

    // Chercher les notifications récentes qui nécessitent un envoi d'email
    const recentNotifications = notifications.filter(notification => {
      // Vérifier si c'est une notification récente (moins de 30 secondes)
      const notificationTime = new Date(notification.created_at).getTime();
      const now = new Date().getTime();
      const isRecent = (now - notificationTime) < 30000; // 30 secondes

      // Vérifier si c'est une demande pro avec flag d'email
      const shouldSendEmail = notification.type === 'admin_new_pro_request' &&
                              notification.data?.send_email === true;

      return isRecent && shouldSendEmail && !notification.read_at;
    });

    // Envoyer les emails pour les nouvelles notifications
    recentNotifications.forEach(notification => {
      console.log('📧 Traitement email pour notification:', notification.id);
      sendProRequestEmail(notification);
    });

  }, [notifications, sendProRequestEmail]);

  return {
    isConnected,
    unreadCount,
    notifications,
    markAsRead,
    markAllAsRead
  };
}