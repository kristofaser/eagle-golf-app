'use client';

import { useState } from 'react';
import { 
  X, 
  User, 
  Mail, 
  Phone, 
  Calendar, 
  Shield, 
  Edit3, 
  Key, 
  UserX, 
  UserCheck, 
  Trash2,
  Clock
} from 'lucide-react';

interface AdminUser {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
  permissions: string[];
  isSuperAdmin: boolean;
  createdAt: string;
  lastLogin?: string;
}

interface AdminUserSidebarProps {
  user: AdminUser | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (user: AdminUser) => void;
  onDelete: (user: AdminUser) => void;
  onToggleStatus: (user: AdminUser) => void;
  onResetPassword: (user: AdminUser) => void;
  currentUserId: string;
  canManageAdmins: boolean;
}

export default function AdminUserSidebar({
  user,
  isOpen,
  onClose,
  onEdit,
  onDelete,
  onToggleStatus,
  onResetPassword,
  currentUserId,
  canManageAdmins
}: AdminUserSidebarProps) {
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen || !user) return null;

  const isCurrentUser = user.id === currentUserId;
  const canPerformAction = canManageAdmins || isCurrentUser;

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'super_admin': return 'Super Admin';
      case 'marketing': return 'Marketing';
      case 'community_manager': return 'Community Manager';
      case 'reservation': return 'Réservation';
      default: return 'Admin';
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'super_admin': return 'bg-red-100 text-red-800';
      case 'marketing': return 'bg-purple-100 text-purple-800';
      case 'community_manager': return 'bg-green-100 text-green-800';
      case 'reservation': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-blue-100 text-blue-800';
    }
  };

  const handleAction = async (action: () => void) => {
    setIsLoading(true);
    try {
      await action();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-25 z-40"
        onClick={onClose}
      />

      {/* Sidebar */}
      <div className="fixed right-0 top-0 h-full w-96 bg-white shadow-2xl z-50 overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            Détails utilisateur
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* User Info */}
        <div className="p-6 space-y-6">
          {/* Profile Section */}
          <div className="flex items-center space-x-4">
            <div className="h-16 w-16 bg-gray-200 rounded-full flex items-center justify-center">
              <User className="h-8 w-8 text-gray-500" />
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-900">
                {user.name}
              </h3>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleBadgeColor(user.role)}`}>
                {getRoleLabel(user.role)}
              </span>
            </div>
          </div>

          {/* Contact Info */}
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <Mail className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">Email</p>
                <p className="text-sm font-medium text-gray-900">{user.email}</p>
              </div>
            </div>

            {user.phone && (
              <div className="flex items-center space-x-3">
                <Phone className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Téléphone</p>
                  <p className="text-sm font-medium text-gray-900">{user.phone}</p>
                </div>
              </div>
            )}

            <div className="flex items-center space-x-3">
              <Calendar className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">Créé le</p>
                <p className="text-sm font-medium text-gray-900">
                  {new Date(user.createdAt).toLocaleDateString('fr-FR', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                  })}
                </p>
              </div>
            </div>

            {user.lastLogin && (
              <div className="flex items-center space-x-3">
                <Clock className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Dernière connexion</p>
                  <p className="text-sm font-medium text-gray-900">
                    {new Date(user.lastLogin).toLocaleDateString('fr-FR', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Permissions */}
          <div>
            <div className="flex items-center space-x-2 mb-3">
              <Shield className="h-5 w-5 text-gray-400" />
              <h4 className="text-sm font-medium text-gray-900">Permissions</h4>
            </div>
            <div className="space-y-2">
              {user.permissions && user.permissions.length > 0 ? (
                user.permissions.map((permission, index) => (
                  <span
                    key={index}
                    className="inline-block bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded mr-2 mb-1"
                  >
                    {permission}
                  </span>
                ))
              ) : (
                <p className="text-sm text-gray-500">Aucune permission spécifique</p>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="border-t border-gray-200 p-6">
          <h4 className="text-sm font-medium text-gray-900 mb-4">Actions</h4>
          <div className="space-y-3">
            {/* Edit Profile */}
            {(canManageAdmins || isCurrentUser) && (
              <button
                onClick={() => handleAction(() => onEdit(user))}
                disabled={isLoading}
                className="w-full flex items-center space-x-3 px-4 py-3 text-left text-sm text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
              >
                <Edit3 className="h-4 w-4" />
                <span>Modifier le profil</span>
              </button>
            )}

            {/* Reset Password */}
            {(canManageAdmins || isCurrentUser) && (
              <button
                onClick={() => handleAction(() => onResetPassword(user))}
                disabled={isLoading}
                className="w-full flex items-center space-x-3 px-4 py-3 text-left text-sm text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
              >
                <Key className="h-4 w-4" />
                <span>Réinitialiser le mot de passe</span>
              </button>
            )}

            {/* Toggle Status - Only for other users */}
            {canManageAdmins && !isCurrentUser && (
              <button
                onClick={() => handleAction(() => onToggleStatus(user))}
                disabled={isLoading}
                className="w-full flex items-center space-x-3 px-4 py-3 text-left text-sm text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
              >
                {user.isSuperAdmin ? (
                  <>
                    <UserX className="h-4 w-4" />
                    <span>Désactiver le compte</span>
                  </>
                ) : (
                  <>
                    <UserCheck className="h-4 w-4" />
                    <span>Activer le compte</span>
                  </>
                )}
              </button>
            )}

            {/* Delete User - Only for other users */}
            {canManageAdmins && !isCurrentUser && (
              <button
                onClick={() => handleAction(() => onDelete(user))}
                disabled={isLoading}
                className="w-full flex items-center space-x-3 px-4 py-3 text-left text-sm text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors disabled:opacity-50"
              >
                <Trash2 className="h-4 w-4" />
                <span>Supprimer l'utilisateur</span>
              </button>
            )}
          </div>

          {!canPerformAction && (
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-700">
                Vous n'avez pas les permissions nécessaires pour modifier cet utilisateur.
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}