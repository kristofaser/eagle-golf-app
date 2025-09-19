'use client';

import { useState } from 'react';
import { Search, User } from 'lucide-react';
import { NotificationBadge } from '@/components/atoms/NotificationBadge';
import { NotificationPanel } from '@/components/organisms/NotificationPanel';
import { useNotificationBadge } from '@/hooks/useNotificationBadge';
import { useAdminAuth } from '@/hooks/useAdminAuth';

export default function Header() {
  const [isNotificationPanelOpen, setIsNotificationPanelOpen] = useState(false);
  const { adminUser } = useAdminAuth();
  const {
    isConnected,
    unreadCount,
    notifications,
    markAsRead,
    markAllAsRead
  } = useNotificationBadge();

  return (
    <>
      <header className="flex h-16 items-center justify-between border-b bg-white px-6">
        <div className="flex flex-1 items-center">
          <div className="relative w-96">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="search"
              placeholder="Rechercher..."
              className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
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