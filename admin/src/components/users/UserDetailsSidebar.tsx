'use client';

import { X, User, Mail, Phone, MapPin, Calendar, Shield, Briefcase, Trophy, Clock, CreditCard, Star, UserCheck, Trash2, Ban } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface UserDetailsSidebarProps {
  user: any;
  isOpen: boolean;
  onClose: () => void;
  onSuspendUser?: (user: any) => void;
  onDeleteUser?: (user: any) => void;
  canManageUsers?: boolean;
}

export default function UserDetailsSidebar({ 
  user, 
  isOpen, 
  onClose, 
  onSuspendUser, 
  onDeleteUser, 
  canManageUsers = false 
}: UserDetailsSidebarProps) {
  if (!user) return null;

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/30 z-40 transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed right-0 top-0 h-full w-[500px] bg-white shadow-xl z-50 transform transition-transform duration-300 ${
        isOpen ? 'translate-x-0' : 'translate-x-full'
      }`}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
              {user.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={user.name}
                  className="h-full w-full object-cover"
                />
              ) : user.isAdmin ? (
                <Shield className="h-6 w-6 text-primary" />
              ) : user.type === 'pro' ? (
                <Briefcase className="h-6 w-6 text-primary" />
              ) : (
                <User className="h-6 w-6 text-primary" />
              )}
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">{user.name}</h2>
              <div className="flex items-center gap-2">
                <span className={`px-2 py-0.5 text-xs rounded-full ${
                  user.type === 'pro' 
                    ? 'bg-blue-100 text-blue-800' 
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {user.type === 'pro' ? 'Professionnel' : 'Amateur'}
                </span>
                {user.isAdmin && (
                  <span className="px-2 py-0.5 text-xs bg-primary/10 text-primary rounded-full">
                    Admin
                  </span>
                )}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto h-[calc(100%-88px)]">
          {/* Informations de base */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">
              Informations générales
            </h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-gray-400" />
                <span className="text-sm text-gray-900">{user.email}</span>
              </div>
              {user.phone && (
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-900">{user.phone}</span>
                </div>
              )}
              {user.city && (
                <div className="flex items-center gap-3">
                  <MapPin className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-900">{user.city}</span>
                </div>
              )}
              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4 text-gray-400" />
                <span className="text-sm text-gray-900">
                  Inscrit le {format(new Date(user.createdAt), 'dd MMMM yyyy', { locale: fr })}
                </span>
              </div>
            </div>
          </div>

          {/* Statut du compte */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">
              Statut du compte
            </h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className={`h-3 w-3 rounded-full ${user.suspended ? 'bg-red-500' : 'bg-green-500'}`} />
                <span className={`text-sm font-medium ${user.suspended ? 'text-red-700' : 'text-green-700'}`}>
                  {user.suspended ? 'Compte suspendu' : 'Compte actif'}
                </span>
              </div>
              
              {user.suspended && (
                <>
                  {user.suspendedAt && (
                    <div className="flex items-center gap-3">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-600">
                        Suspendu le {format(new Date(user.suspendedAt), 'dd MMMM yyyy à HH:mm', { locale: fr })}
                      </span>
                    </div>
                  )}
                  
                  {user.suspendedBy && (
                    <div className="flex items-center gap-3">
                      <Shield className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-600">
                        Suspendu par {user.suspendedBy}
                      </span>
                    </div>
                  )}
                  
                  {user.suspensionReason && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-sm text-red-700">
                        <strong>Raison :</strong> {user.suspensionReason}
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Contenu spécifique selon le type */}
          {user.type === 'pro' ? (
            <ProfessionalContent user={user} />
          ) : (
            <AmateurContent user={user} />
          )}

          {/* Actions administrateur */}
          {canManageUsers && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-4">
                Actions administrateur
              </h3>
              <div className="space-y-3">
                {/* Suspendre/Réactiver */}
                <button
                  onClick={() => onSuspendUser?.(user)}
                  className="w-full flex items-center space-x-3 px-4 py-3 text-left text-sm text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  {user.suspended ? (
                    <>
                      <UserCheck className="h-4 w-4" />
                      <span>Réactiver le compte</span>
                    </>
                  ) : (
                    <>
                      <Ban className="h-4 w-4" />
                      <span>Suspendre le compte</span>
                    </>
                  )}
                </button>

                {/* Supprimer utilisateur */}
                <button
                  onClick={() => onDeleteUser?.(user)}
                  className="w-full flex items-center space-x-3 px-4 py-3 text-left text-sm text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                  <span>Supprimer définitivement</span>
                </button>
              </div>

              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-xs text-yellow-700">
                  ⚠️ Ces actions affectent directement l'accès de l'utilisateur à l'application mobile Eagle Golf.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function ProfessionalContent({ user }: { user: any }) {
  return (
    <>
      {/* Informations professionnelles */}
      <div className="mb-6">
        <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">
          Informations professionnelles
        </h3>
        <div className="space-y-3">
          <div className="p-3 bg-blue-50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Certification</span>
              <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded">Vérifié</span>
            </div>
            <p className="text-xs text-gray-600">PGA Professional depuis 2015</p>
          </div>
          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Spécialités</span>
            </div>
            <div className="flex flex-wrap gap-1 mt-2">
              <span className="px-2 py-1 text-xs bg-white rounded">Swing</span>
              <span className="px-2 py-1 text-xs bg-white rounded">Putting</span>
              <span className="px-2 py-1 text-xs bg-white rounded">Approche</span>
              <span className="px-2 py-1 text-xs bg-white rounded">Mental</span>
            </div>
          </div>
        </div>
      </div>

      {/* Statistiques pro */}
      <div className="mb-6">
        <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">
          Statistiques d'activité
        </h3>
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <Star className="h-4 w-4 text-yellow-500" />
              <span className="text-xs text-gray-500">Note moyenne</span>
            </div>
            <p className="text-lg font-semibold text-gray-900">4.8/5</p>
          </div>
          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <CreditCard className="h-4 w-4 text-green-500" />
              <span className="text-xs text-gray-500">Revenus générés</span>
            </div>
            <p className="text-lg font-semibold text-gray-900">12,700€</p>
          </div>
        </div>
      </div>

      {/* Disponibilités */}
      <div className="mb-6">
        <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">
          Créneaux hebdomadaires
        </h3>
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Lundi - Vendredi</span>
            <span className="text-gray-900">09:00 - 18:00</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Samedi</span>
            <span className="text-gray-900">08:00 - 16:00</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Dimanche</span>
            <span className="text-gray-400">Fermé</span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="space-y-2">
        <button className="w-full px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90">
          Voir le profil complet
        </button>
        <button className="w-full px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
          Voir les réservations
        </button>
      </div>
    </>
  );
}

function AmateurContent({ user }: { user: any }) {
  return (
    <>
      {/* Informations de jeu */}
      <div className="mb-6">
        <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">
          Profil golfique
        </h3>
        <div className="space-y-3">
          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Handicap</span>
              <span className="text-sm font-semibold text-gray-900">18.5</span>
            </div>
          </div>
          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Niveau</span>
              <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">Intermédiaire</span>
            </div>
          </div>
        </div>
      </div>

      {/* Statistiques amateur */}
      <div className="mb-6">
        <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">
          Activité sur la plateforme
        </h3>
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <CreditCard className="h-4 w-4 text-purple-500" />
              <span className="text-xs text-gray-500">Dépensé</span>
            </div>
            <p className="text-lg font-semibold text-gray-900">2,300€</p>
          </div>
          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <Star className="h-4 w-4 text-yellow-500" />
              <span className="text-xs text-gray-500">Note donnée</span>
            </div>
            <p className="text-lg font-semibold text-gray-900">4.9/5</p>
          </div>
        </div>
      </div>

      {/* Dernières réservations */}
      <div className="mb-6">
        <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">
          Dernières réservations
        </h3>
        <div className="space-y-2">
          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">Leçon de putting</p>
                <p className="text-xs text-gray-500">Avec Jean Martin - 15 Jan 2024</p>
              </div>
              <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded">Terminé</span>
            </div>
          </div>
          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">Analyse du swing</p>
                <p className="text-xs text-gray-500">Avec Marie Dubois - 22 Jan 2024</p>
              </div>
              <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">À venir</span>
            </div>
          </div>
        </div>
      </div>

    </>
  );
}