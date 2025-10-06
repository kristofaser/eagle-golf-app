'use client';

import { useState } from 'react';
import { User } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { NotificationBadge } from '@/components/atoms/NotificationBadge';
import { NotificationPanel } from '@/components/organisms/NotificationPanel';
import { useNotificationBadge } from '@/hooks/useNotificationBadge';
import { useAdminAuth } from '@/hooks/useAdminAuth';

// Configuration des titres par page
const PAGE_TITLES: Record<string, { title: string; description: string }> = {
  '/dashboard': {
    title: 'Dashboard',
    description: 'Vue d\'ensemble des statistiques et activités'
  },
  '/users': {
    title: 'Utilisateurs',
    description: 'Gérez les utilisateurs de l\'application mobile Eagle Golf'
  },
  '/courses': {
    title: 'Parcours de golf',
    description: 'Gérez les parcours de golf partenaires de la plateforme'
  },
  '/bookings': {
    title: 'Réservations',
    description: 'Gérez les réservations de cours entre amateurs et professionnels'
  },
  '/payments': {
    title: 'Paiements',
    description: 'Gérez les transactions et les commissions de la plateforme'
  },
  '/analytics': {
    title: 'Statistiques',
    description: 'Visualisez les performances et les statistiques de la plateforme'
  },
  '/support': {
    title: 'Support',
    description: 'Gérez les demandes de support et les tickets clients'
  },
  '/settings': {
    title: 'Paramètres',
    description: 'Configurez les paramètres de la plateforme Eagle Golf'
  },
  '/voyages': {
    title: 'Voyages',
    description: 'Créez et gérez les voyages de golf, consultez les utilisateurs avec alertes'
  },
  '/pro-requests': {
    title: 'Demandes professionnelles',
    description: 'Validez les demandes de conversion en compte professionnel'
  },
  '/premium': {
    title: 'Abonnements Premium',
    description: 'Gérez les abonnements premium et le contenu exclusif (vidéos, reportages, actualités)'
  },
  '/admin/users': {
    title: 'Administration système',
    description: 'Gérez les utilisateurs administrateurs du backoffice Eagle Golf'
  }
};

export default function Header() {
  const [isNotificationPanelOpen, setIsNotificationPanelOpen] = useState(false);
  const { adminUser } = useAdminAuth();
  const pathname = usePathname();
  const {
    isConnected,
    unreadCount,
    notifications,
    markAsRead,
    markAllAsRead
  } = useNotificationBadge();

  // Extraire le titre de la page actuelle
  const currentPage = PAGE_TITLES[pathname] || { title: '', description: '' };

  return (
    <>
      <header className="border-b bg-white px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            {currentPage.title && (
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{currentPage.title}</h1>
                <p className="mt-1 text-sm text-gray-500">{currentPage.description}</p>
              </div>
            )}
          </div>
          <div className="flex items-center space-x-4">
            <NotificationBadge
              count={unreadCount}
              isConnected={isConnected}
              onClick={() => setIsNotificationPanelOpen(true)}
            />
            <div className="flex items-center space-x-2 rounded-lg px-3 py-2 bg-green-100 text-green-800 border border-green-200">
              <User className="h-4 w-4" />
              <span className="text-sm font-medium">
                {adminUser?.email || 'admin@eagle.com'}
              </span>
            </div>
          </div>
        </div>
      </header>

      <NotificationPanel
        isOpen={isNotificationPanelOpen}
        onClose={() => setIsNotificationPanelOpen(false)}
        notifications={notifications}
        unreadCount={unreadCount}
        onMarkAsRead={markAsRead}
        onMarkAllAsRead={markAllAsRead}
        isConnected={isConnected}
      />
    </>
  );
}