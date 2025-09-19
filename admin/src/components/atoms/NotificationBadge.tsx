'use client';

import { Bell } from 'lucide-react';

interface NotificationBadgeProps {
  count: number;
  isConnected: boolean;
  onClick: () => void;
}

export function NotificationBadge({ count, isConnected, onClick }: NotificationBadgeProps) {
  return (
    <button
      onClick={onClick}
      className="relative rounded-lg p-2 text-gray-600 hover:bg-gray-100 transition-colors"
      title={`${count} notification(s) non lue(s)`}
    >
      <Bell className="h-5 w-5" />

      {/* Badge avec compteur */}
      {count > 0 && (
        <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-medium text-white">
          {count > 9 ? '9+' : count}
        </span>
      )}

      {/* Indicateur de connexion */}
      <span
        className={`absolute bottom-0 right-0 h-2 w-2 rounded-full ${
          isConnected ? 'bg-green-500' : 'bg-gray-400'
        }`}
        title={isConnected ? 'Connecté au temps réel' : 'Déconnecté du temps réel'}
      />
    </button>
  );
}