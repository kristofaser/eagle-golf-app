'use client';

import { Shield, Search, UserPlus, Mail } from 'lucide-react';
import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AddAdminModal, { AdminFormData } from '@/components/admin/AddAdminModal';
import EditAdminModal, { EditAdminFormData } from '@/components/admin/EditAdminModal';
import AdminUserSidebar from '@/components/features/admin/AdminUserSidebar';
import ConfirmationModal from '@/components/admin/ConfirmationModal';
import CommissionSettings from '@/components/features/CommissionSettings';
import InviteAdminModal from '@/components/admin/InviteAdminModal';
import {
  createAdminUser,
  updateAdminUser,
  deleteAdminUser,
  toggleAdminUserStatus,
  resetAdminPassword
} from './actions';

interface AdminUsersClientProps {
  initialUsers: any[];
  currentUserId: string;
  currentUserRole: string;
  currentUserPermissions: string[];
}

interface FilterState {
  role: 'all' | 'admin' | 'super_admin' | 'marketing' | 'community_manager' | 'reservation';
}

interface ModalState {
  add: boolean;
  edit: boolean;
  delete: boolean;
  toggleStatus: boolean;
  resetPassword: boolean;
  invite: boolean;
}

interface SidebarState {
  isOpen: boolean;
  selectedUser: any | null;
}

export default function AdminUsersClient({ initialUsers, currentUserId, currentUserRole, currentUserPermissions }: AdminUsersClientProps) {
  const router = useRouter();
  const [allUsers, setAllUsers] = useState<any[]>(initialUsers);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<FilterState>({
    role: 'all'
  });
  
  // Modal states
  const [modals, setModals] = useState<ModalState>({
    add: false,
    edit: false,
    delete: false,
    toggleStatus: false,
    resetPassword: false,
    invite: false,
  });
  
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  
  // Sidebar state
  const [sidebar, setSidebar] = useState<SidebarState>({
    isOpen: false,
    selectedUser: null
  });

  // Vérifier si l'utilisateur actuel peut gérer les autres admins
  const canManageAdmins = currentUserPermissions.includes('manage_admin_users') || currentUserRole === 'super_admin';

  // Auto-hide messages after 5 seconds
  useEffect(() => {
    if (successMessage || errorMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage('');
        setErrorMessage('');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage, errorMessage]);

  // Filtrer les utilisateurs en fonction de la recherche et des filtres
  const filteredUsers = useMemo(() => {
    let result = [...allUsers];

    // Filtre par recherche
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(user => 
        user.name.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query) ||
        (user.city && user.city.toLowerCase().includes(query))
      );
    }

    // Filtre par rôle
    if (filters.role !== 'all') {
      result = result.filter(user => user.role === filters.role);
    }

    return result;
  }, [allUsers, searchQuery, filters]);

  // Modal management functions
  const openModal = (modalType: keyof ModalState, user?: any) => {
    setSelectedUser(user || null);
    setModals(prev => ({ ...prev, [modalType]: true }));
  };

  const closeModal = (modalType: keyof ModalState) => {
    setModals(prev => ({ ...prev, [modalType]: false }));
    setSelectedUser(null);
  };

  // Sidebar functions
  const openSidebar = (user: any) => {
    setSidebar({ isOpen: true, selectedUser: user });
  };

  const closeSidebar = () => {
    setSidebar({ isOpen: false, selectedUser: null });
  };

  // Actions from sidebar
  const handleSidebarEdit = (user: any) => {
    setSelectedUser(user);
    openModal('edit');
    closeSidebar();
  };

  const handleSidebarDelete = (user: any) => {
    if (!user) {
      console.error('❌ Aucun utilisateur fourni à handleSidebarDelete');
      return;
    }
    setSelectedUser(user);
    closeSidebar();
    // Petit délai pour s'assurer que le state est mis à jour
    setTimeout(() => {
      openModal('delete', user);
    }, 50);
  };

  const handleSidebarToggleStatus = (user: any) => {
    setSelectedUser(user);
    openModal('toggleStatus');
    closeSidebar();
  };

  const handleSidebarResetPassword = (user: any) => {
    setSelectedUser(user);
    openModal('resetPassword');
    closeSidebar();
  };

  const closeAllModals = () => {
    setModals({
      add: false,
      edit: false,
      delete: false,
      toggleStatus: false,
      resetPassword: false,
      invite: false,
    });
    setSelectedUser(null);
  };

  // Action handlers
  const handleAddAdmin = async (data: AdminFormData) => {
    setIsLoading(true);
    try {
      const result = await createAdminUser(data);
      if (result.success) {
        setSuccessMessage(result.message);
        router.refresh();
      } else {
        setErrorMessage(result.message);
      }
    } catch (error) {
      setErrorMessage('Erreur lors de la création');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditAdmin = async (userId: string, data: EditAdminFormData) => {
    console.log('🔄 HandleEditAdmin appelé avec:', { userId, data });
    setIsLoading(true);
    try {
      const result = await updateAdminUser(userId, data);
      console.log('📡 Résultat updateAdminUser:', result);
      
      if (result.success) {
        setSuccessMessage(result.message);
        console.log('✅ Rafraîchissement de la page...');
        router.refresh();
        // Force aussi un hard refresh si nécessaire
        window.location.reload();
      } else {
        setErrorMessage(result.message);
      }
    } catch (error) {
      console.error('❌ Erreur dans handleEditAdmin:', error);
      setErrorMessage('Erreur lors de la mise à jour');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAdmin = async () => {
    if (!selectedUser) {
      setErrorMessage('Aucun utilisateur sélectionné');
      return;
    }

    setIsLoading(true);
    try {
      const result = await deleteAdminUser(selectedUser.id);

      if (result.success) {
        // Mettre à jour l'état local pour retirer l'utilisateur supprimé
        setAllUsers(prevUsers => prevUsers.filter(user => user.id !== selectedUser.id));

        setSuccessMessage(result.message);
        closeAllModals();

        // Rafraîchir aussi depuis le serveur pour s'assurer de la synchronisation
        router.refresh();
      } else {
        setErrorMessage(result.message);
      }
    } catch (error) {
      console.error('❌ Erreur lors de la suppression:', error);
      setErrorMessage('Erreur lors de la suppression');
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleStatus = async () => {
    if (!selectedUser) return;
    
    setIsLoading(true);
    try {
      const newStatus = !selectedUser.is_active;
      const result = await toggleAdminUserStatus(selectedUser.id, newStatus);
      if (result.success) {
        setSuccessMessage(result.message);
        closeAllModals();
        router.refresh();
      } else {
        setErrorMessage(result.message);
      }
    } catch (error) {
      setErrorMessage('Erreur lors du changement de statut');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!selectedUser) return;
    
    setIsLoading(true);
    try {
      const result = await resetAdminPassword(selectedUser.id, selectedUser.email);
      if (result.success) {
        setSuccessMessage(`${result.message}${result.tempPassword ? ` - Nouveau mot de passe: ${result.tempPassword}` : ''}`);
        closeAllModals();
      } else {
        setErrorMessage(result.message);
      }
    } catch (error) {
      setErrorMessage('Erreur lors de la réinitialisation');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      {/* Messages d'alerte */}
      {successMessage && (
        <div className="mb-4 bg-green-50 border border-green-200 rounded-md p-4">
          <div className="text-sm text-green-800">{successMessage}</div>
        </div>
      )}
      
      {errorMessage && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-md p-4">
          <div className="text-sm text-red-800">{errorMessage}</div>
        </div>
      )}

      {/* Commission Settings */}
      <CommissionSettings canEdit={canManageAdmins} />

      {/* Actions Bar */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex flex-1 items-center gap-4">
          {/* Barre de recherche */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Rechercher un administrateur..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Filtre par rôle */}
          <select
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            value={filters.role}
            onChange={(e) => setFilters({ ...filters, role: e.target.value as any })}
          >
            <option value="all">Tous les rôles</option>
            <option value="admin">Administrateurs</option>
            <option value="super_admin">Super administrateurs</option>
            <option value="marketing">Marketing</option>
            <option value="community_manager">Community Manager</option>
            <option value="reservation">Réservation</option>
          </select>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {canManageAdmins && (
            <>
              <button
                onClick={() => openModal('invite')}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <Mail className="h-4 w-4 mr-2" />
                Inviter un admin
              </button>
              <button
                onClick={() => openModal('add')}
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Créer manuellement
              </button>
            </>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-x-auto">
        {filteredUsers.length > 0 ? (
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Administrateur
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rôle
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ville
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date création
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredUsers.map((user) => (
                <tr 
                  key={user.id} 
                  className="hover:bg-gray-50 cursor-pointer"
                  onClick={() => openSidebar(user)}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
                        {user.avatarUrl ? (
                          <img
                            src={user.avatarUrl}
                            alt={user.name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <Shield className="h-5 w-5 text-primary" />
                        )}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {user.name}
                        </div>
                        {user.phone && (
                          <div className="text-xs text-gray-500">{user.phone}</div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {user.email}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                      user.role === 'super_admin' || user.isSuperAdmin
                        ? 'bg-red-100 text-red-800'
                        : user.role === 'marketing'
                        ? 'bg-purple-100 text-purple-800'
                        : user.role === 'community_manager'
                        ? 'bg-green-100 text-green-800'
                        : user.role === 'reservation'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {user.role === 'super_admin' || user.isSuperAdmin ? 'Super Admin' 
                        : user.role === 'marketing' ? 'Marketing'
                        : user.role === 'community_manager' ? 'Community Manager'
                        : user.role === 'reservation' ? 'Réservation'
                        : 'Admin'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {user.city || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(user.createdAt).toLocaleDateString('fr-FR')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="text-center py-8 text-gray-500">
            {searchQuery || filters.role !== 'all'
              ? 'Aucun administrateur ne correspond aux critères de recherche'
              : 'Aucun administrateur trouvé'
            }
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="mt-6 grid grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <p className="text-sm text-gray-500">Total administrateurs</p>
          <p className="text-2xl font-bold text-gray-900">{filteredUsers.length}</p>
          <span className="text-xs text-gray-400">
            {filteredUsers.length !== allUsers.length && `(sur ${allUsers.length})`}
          </span>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <p className="text-sm text-gray-500">Super administrateurs</p>
          <p className="text-2xl font-bold text-red-600">
            {filteredUsers.filter(u => u.role === 'super_admin' || u.isSuperAdmin).length}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <p className="text-sm text-gray-500">Rôles spécialisés</p>
          <p className="text-2xl font-bold text-purple-600">
            {filteredUsers.filter(u => ['marketing', 'community_manager', 'reservation'].includes(u.role)).length}
          </p>
        </div>
      </div>

      {/* Sidebar */}
      <AdminUserSidebar
        user={sidebar.selectedUser}
        isOpen={sidebar.isOpen}
        onClose={closeSidebar}
        onEdit={handleSidebarEdit}
        onDelete={handleSidebarDelete}
        onToggleStatus={handleSidebarToggleStatus}
        onResetPassword={handleSidebarResetPassword}
        currentUserId={currentUserId}
        canManageAdmins={canManageAdmins}
      />

      {/* Modals */}
      {canManageAdmins && (
        <>
          <InviteAdminModal
            isOpen={modals.invite}
            onClose={() => closeModal('invite')}
            onSuccess={() => {
              setSuccessMessage('Invitation envoyée avec succès');
              router.refresh();
            }}
          />

          <AddAdminModal
            isOpen={modals.add}
            onClose={() => closeModal('add')}
            onAdd={handleAddAdmin}
          />

          <EditAdminModal
            isOpen={modals.edit}
            onClose={() => closeModal('edit')}
            onUpdate={handleEditAdmin}
            user={selectedUser}
          />
        </>
      )}

      <ConfirmationModal
        isOpen={modals.delete}
        onClose={() => closeModal('delete')}
        onConfirm={handleDeleteAdmin}
        title="Supprimer l'administrateur"
        message={`Êtes-vous sûr de vouloir supprimer définitivement l'administrateur "${selectedUser?.name}" ? Cette action est irréversible.`}
        confirmText="Supprimer"
        type="danger"
        isLoading={isLoading}
      />

      <ConfirmationModal
        isOpen={modals.toggleStatus}
        onClose={() => closeModal('toggleStatus')}
        onConfirm={handleToggleStatus}
        title={selectedUser?.is_active ? 'Désactiver l\'administrateur' : 'Réactiver l\'administrateur'}
        message={
          selectedUser?.is_active 
            ? `Voulez-vous désactiver l'administrateur "${selectedUser?.name}" ? Il ne pourra plus se connecter au backoffice.`
            : `Voulez-vous réactiver l'administrateur "${selectedUser?.name}" ? Il pourra de nouveau se connecter au backoffice.`
        }
        confirmText={selectedUser?.is_active ? 'Désactiver' : 'Réactiver'}
        type="warning"
        isLoading={isLoading}
      />

      <ConfirmationModal
        isOpen={modals.resetPassword}
        onClose={() => closeModal('resetPassword')}
        onConfirm={handleResetPassword}
        title="Réinitialiser le mot de passe"
        message={`Voulez-vous réinitialiser le mot de passe de "${selectedUser?.name}" ? Un nouveau mot de passe temporaire sera généré.`}
        confirmText="Réinitialiser"
        type="info"
        isLoading={isLoading}
      />
    </div>
  );
}