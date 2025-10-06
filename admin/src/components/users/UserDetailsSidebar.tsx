'use client';

import { X, User, Mail, Phone, MapPin, Calendar, Shield, Briefcase, UserCheck, Trash2, Ban, Building2, CreditCard } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import ProAvailabilitiesSection from './ProAvailabilitiesSection';

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
              {user.type === 'pro' && user.proProfile?.division && (
                <p className="text-sm text-gray-500 mb-1">{user.proProfile.division}</p>
              )}
              <div className="flex items-center gap-2 flex-wrap">
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
                <span className={`px-2 py-0.5 text-xs rounded-full ${
                  user.suspended
                    ? 'bg-red-100 text-red-800'
                    : 'bg-green-100 text-green-800'
                }`}>
                  {user.suspended ? 'Suspendu' : 'Actif'}
                </span>
                {user.type === 'pro' && user.proProfile?.validationStatus && (
                  <span className={`px-2 py-0.5 text-xs rounded-full ${
                    user.proProfile.validationStatus === 'approved'
                      ? 'bg-green-100 text-green-800'
                      : user.proProfile.validationStatus === 'pending'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {user.proProfile.validationStatus === 'approved' ? '✓ Validé' :
                     user.proProfile.validationStatus === 'pending' ? '⏳ En attente' :
                     user.proProfile.validationStatus === 'rejected' ? '✗ Rejeté' : user.proProfile.validationStatus}
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
          {/* Informations de suspension */}
          {user.suspended && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <h3 className="text-sm font-semibold text-red-800 mb-3">
                Compte suspendu
              </h3>
              <div className="space-y-2">
                {user.suspendedAt && (
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-red-600" />
                    <span className="text-sm text-red-700">
                      {format(new Date(user.suspendedAt), 'dd MMMM yyyy à HH:mm', { locale: fr })}
                    </span>
                  </div>
                )}

                {user.suspendedBy && (
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-red-600" />
                    <span className="text-sm text-red-700">
                      Par {user.suspendedBy}
                    </span>
                  </div>
                )}

                {user.suspensionReason && (
                  <p className="text-sm text-red-700 mt-2">
                    <strong>Raison :</strong> {user.suspensionReason}
                  </p>
                )}
              </div>
            </div>
          )}

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
  const proProfile = user.proProfile;
  const proPricing = user.proPricing || [];

  if (!proProfile) {
    return (
      <div className="mb-6 p-4 bg-gray-50 rounded-lg text-sm text-gray-600">
        Aucune information professionnelle disponible
      </div>
    );
  }

  // Organiser les tarifs par configuration
  const getPriceByConfig = (holes: number, players: number) => {
    const pricing = proPricing.find((p: any) => p.holes === holes && p.players_count === players);
    return pricing ? Number(pricing.price) / 100 : null;
  };

  return (
    <>
      {/* Informations */}
      <div className="mb-6">
        <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">
          Informations
        </h3>
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <Mail className="h-4 w-4 text-gray-400" />
            <span className="text-sm text-gray-900">{user.email}</span>
          </div>

          {(user.phone || proProfile.phoneNumber) && (
            <div className="flex items-center gap-3">
              <Phone className="h-4 w-4 text-gray-400" />
              <span className="text-sm text-gray-900">{proProfile.phoneNumber || user.phone}</span>
            </div>
          )}

          {proProfile.siret && (
            <div className="flex items-center gap-3">
              <Building2 className="h-4 w-4 text-gray-400" />
              <div>
                <span className="text-xs text-gray-500">SIRET</span>
                <p className="text-sm text-gray-900">{proProfile.siret}</p>
              </div>
            </div>
          )}

          <div className="flex items-center gap-3">
            <Calendar className="h-4 w-4 text-gray-400" />
            <div>
              <span className="text-xs text-gray-500">Inscription</span>
              <p className="text-sm text-gray-900">
                {format(new Date(user.createdAt), 'dd MMMM yyyy', { locale: fr })}
              </p>
            </div>
          </div>

          {proProfile.dateOfBirth && (
            <div className="flex items-center gap-3">
              <Calendar className="h-4 w-4 text-gray-400" />
              <div>
                <span className="text-xs text-gray-500">Date de naissance</span>
                <p className="text-sm text-gray-900">
                  {format(new Date(proProfile.dateOfBirth), 'dd MMMM yyyy', { locale: fr })}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Tarification */}
      {proPricing.length > 0 && (
        <div className="mb-6">
          <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">
            Tarification
          </h3>
          <div className="space-y-4">
            {/* 9 trous */}
            <div>
              <p className="text-xs font-medium text-gray-600 mb-2">9 trous</p>
              <div className="grid grid-cols-3 gap-2">
                {[1, 2, 3].map(players => {
                  const price = getPriceByConfig(9, players);
                  return price !== null && (
                    <div key={`9-${players}`} className="p-2 bg-gray-50 rounded-lg text-center">
                      <p className="text-xs text-gray-500">{players} {players === 1 ? 'joueur' : 'joueurs'}</p>
                      <p className="text-sm font-semibold text-gray-900">{price.toFixed(2)}€</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 18 trous */}
            <div>
              <p className="text-xs font-medium text-gray-600 mb-2">18 trous</p>
              <div className="grid grid-cols-3 gap-2">
                {[1, 2, 3].map(players => {
                  const price = getPriceByConfig(18, players);
                  return price !== null && (
                    <div key={`18-${players}`} className="p-2 bg-gray-50 rounded-lg text-center">
                      <p className="text-xs text-gray-500">{players} {players === 1 ? 'joueur' : 'joueurs'}</p>
                      <p className="text-sm font-semibold text-gray-900">{price.toFixed(2)}€</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Disponibilités réelles */}
      <ProAvailabilitiesSection proId={user.id} />
    </>
  );
}

function AmateurContent({ user }: { user: any }) {
  return null;
}