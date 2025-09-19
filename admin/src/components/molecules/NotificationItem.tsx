'use client';

import { Check, Clock, AlertTriangle, Info, X } from 'lucide-react';

interface NotificationData {
  id: string;
  type: string;
  title: string;
  message: string;
  read_at: string | null;
  created_at: string;
  data?: any;
}

interface NotificationItemProps {
  notification: NotificationData;
  onMarkAsRead: (id: string) => void;
  onDelete?: (id: string) => void;
}

export function NotificationItem({ notification, onMarkAsRead, onDelete }: NotificationItemProps) {
  const getIcon = () => {
    switch (notification.type) {
      case 'admin_new_pro_request':
        return <Info className="h-4 w-4 text-blue-500" />;
      case 'admin_booking_validation_required':
        return <AlertTriangle className="h-4 w-4 text-orange-500" />;
      case 'admin_system_alert':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default:
        return <Info className="h-4 w-4 text-gray-500" />;
    }
  };

  const getTypeLabel = () => {
    switch (notification.type) {
      case 'admin_new_pro_request':
        return 'Demande Pro';
      case 'admin_booking_validation_required':
        return 'Validation Réservation';
      case 'admin_system_alert':
        return 'Alerte Système';
      default:
        return 'Notification';
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMinutes < 1) return 'À l\'instant';
    if (diffMinutes < 60) return `${diffMinutes}min`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}j`;

    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit'
    });
  };

  return (
    <div className={`p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors ${
      !notification.read_at ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
    }`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1">
          {/* Icône */}
          <div className="flex-shrink-0 mt-1">
            {getIcon()}
          </div>

          {/* Contenu */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-medium text-gray-500 uppercase">
                {getTypeLabel()}
              </span>
              <span className="text-xs text-gray-400">
                {formatTime(notification.created_at)}
              </span>
            </div>

            <h4 className="text-sm font-medium text-gray-900 mb-1">
              {notification.title}
            </h4>

            {notification.message && (
              <p className="text-sm text-gray-600 line-clamp-2">
                {notification.message}
              </p>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 flex-shrink-0">
          {!notification.read_at && (
            <button
              onClick={() => onMarkAsRead(notification.id)}
              className="p-1 rounded text-gray-400 hover:text-blue-600 hover:bg-blue-100 transition-colors"
              title="Marquer comme lue"
            >
              <Check className="h-4 w-4" />
            </button>
          )}

          {onDelete && (
            <button
              onClick={() => onDelete(notification.id)}
              className="p-1 rounded text-gray-400 hover:text-red-600 hover:bg-red-100 transition-colors"
              title="Supprimer"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}