'use client';

import { Users, Search, Filter, UserPlus, Shield } from 'lucide-react';
import { useState, useMemo, useEffect } from 'react';
import UserActions from './UserActions';
import UserDetailsSidebar from '@/components/users/UserDetailsSidebar';
import ConfirmationModal from '@/components/admin/ConfirmationModal';
import { suspendUser, unsuspendUser, deleteUser } from './actions';

interface UsersClientProps {
  initialUsers: any[];
  currentUserRole?: string;
  currentUserPermissions?: string[];
}

interface FilterState {
  type: 'all' | 'amateur' | 'pro';
}

interface ModalState {
  suspend: boolean;
  delete: boolean;
}

interface UIState {
  isLoading: boolean;
  selectedUser: any | null;
  successMessage: string;
  errorMessage: string;
}

export default function UsersClient({ initialUsers, currentUserRole = 'admin', currentUserPermissions = [] }: UsersClientProps) {
  const [allUsers, setAllUsers] = useState<any[]>(initialUsers);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<FilterState>({
    type: 'all'
  });
  
  // États UI
  const [uiState, setUiState] = useState<UIState>({
    isLoading: false,
    selectedUser: null,
    successMessage: '',
    errorMessage: ''
  });
  
  // États modals
  const [modals, setModals] = useState<ModalState>({
    suspend: false,
    delete: false
  });

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

    // Filtre par type
    if (filters.type !== 'all') {
      result = result.filter(user => user.type === filters.type);
    }

    return result;
  }, [allUsers, searchQuery, filters]);

  const handleUserClick = (user: any) => {
    setUiState(prev => ({ ...prev, selectedUser: user }));
    setSidebarOpen(true);
  };

  const handleCloseSidebar = () => {
    setSidebarOpen(false);
    setTimeout(() => setUiState(prev => ({ ...prev, selectedUser: null })), 300);
  };

  // Vérifier si l'utilisateur peut gérer les utilisateurs
  const canManageUsers = currentUserPermissions.includes('manage_users') || 
                        currentUserPermissions.includes('manage_admin_users') || 
                        currentUserRole === 'super_admin';

  // Gestion des messages
  useEffect(() => {
    if (uiState.successMessage || uiState.errorMessage) {
      const timer = setTimeout(() => {
        setUiState(prev => ({ ...prev, successMessage: '', errorMessage: '' }));
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [uiState.successMessage, uiState.errorMessage]);

  // Fonctions utilitaires
  const openModal = (type: keyof ModalState, user: any) => {
    setUiState(prev => ({ ...prev, selectedUser: user }));
    setModals(prev => ({ ...prev, [type]: true }));
    // Fermer la sidebar quand une modal s'ouvre
    setSidebarOpen(false);
  };

  const closeModal = (type: keyof ModalState) => {
    setModals(prev => ({ ...prev, [type]: false }));
    setUiState(prev => ({ ...prev, selectedUser: null }));
  };

  const setMessage = (type: 'success' | 'error', message: string) => {
    setUiState(prev => ({
      ...prev,
      successMessage: type === 'success' ? message : '',
      errorMessage: type === 'error' ? message : ''
    }));
  };

  // Actions utilisateur
  const handleSuspendUser = (user: any) => {
    if (user.suspended) {
      // Réactiver
      openModal('suspend', user);
    } else {
      // Suspendre
      openModal('suspend', user);
    }
  };

  const handleDeleteUser = (user: any) => {
    openModal('delete', user);
  };

  // Confirmation suspension/réactivation
  const confirmSuspendAction = async () => {
    if (!uiState.selectedUser) return;
    
    setUiState(prev => ({ ...prev, isLoading: true }));
    
    try {
      const user = uiState.selectedUser;
      let result;
      
      if (user.suspended) {
        result = await unsuspendUser(user.id);
      } else {
        result = await suspendUser(user.id, 'Suspendu par administrateur');
      }
      
      if (result.success) {
        setMessage('success', result.message);
        // Mettre à jour la liste locale
        setAllUsers(prev => prev.map(u => 
          u.id === user.id 
            ? { ...u, suspended: !user.suspended }
            : u
        ));
        // Rafraîchir la page pour obtenir les données à jour
        window.location.reload();
      } else {
        setMessage('error', result.message);
      }
    } catch (error) {
      setMessage('error', 'Erreur inattendue');
    } finally {
      setUiState(prev => ({ ...prev, isLoading: false }));
      closeModal('suspend');
    }
  };

  // Confirmation suppression
  const confirmDeleteAction = async () => {
    if (!uiState.selectedUser) return;
    
    setUiState(prev => ({ ...prev, isLoading: true }));
    
    try {
      const result = await deleteUser(uiState.selectedUser.id);
      
      if (result.success) {
        setMessage('success', result.message);
        // Retirer l'utilisateur de la liste locale
        setAllUsers(prev => prev.filter(u => u.id !== uiState.selectedUser?.id));
      } else {
        setMessage('error', result.message);
      }
    } catch (error) {
      setMessage('error', 'Erreur inattendue');
    } finally {
      setUiState(prev => ({ ...prev, isLoading: false }));
      closeModal('delete');
    }
  };

  return (
    <div>
      {/* Messages de feedback */}
      {uiState.successMessage && (
        <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg">
          {uiState.successMessage}
        </div>
      )}
      
      {uiState.errorMessage && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
          {uiState.errorMessage}
        </div>
      )}

      {/* Actions Bar */}
      <UserActions 
        onSearchChange={setSearchQuery}
        onFilterChange={setFilters}
      />

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {filteredUsers.length > 0 ? (
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nom
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ville
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date d'inscription
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredUsers.map((user) => (
                <tr 
                  key={user.id} 
                  className="hover:bg-gray-50 cursor-pointer"
                  onClick={() => handleUserClick(user)}
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
                          <Users className="h-5 w-5 text-primary" />
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
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        user.type === 'pro' 
                          ? 'bg-blue-100 text-blue-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {user.type === 'pro' ? 'Professionnel' : 'Amateur'}
                      </span>
                      {user.suspended && (
                        <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800">
                          Suspendu
                        </span>
                      )}
                    </div>
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
            {searchQuery || filters.type !== 'all'
              ? 'Aucun utilisateur ne correspond aux critères de recherche'
              : 'Aucun utilisateur trouvé'
            }
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="mt-6 grid grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <p className="text-sm text-gray-500">Total utilisateurs</p>
          <p className="text-2xl font-bold text-gray-900">{filteredUsers.length}</p>
          <span className="text-xs text-gray-400">
            {filteredUsers.length !== allUsers.length && `(sur ${allUsers.length})`}
          </span>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <p className="text-sm text-gray-500">Professionnels</p>
          <p className="text-2xl font-bold text-blue-600">
            {filteredUsers.filter(u => u.type === 'pro').length}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <p className="text-sm text-gray-500">Amateurs</p>
          <p className="text-2xl font-bold text-gray-600">
            {filteredUsers.filter(u => u.type === 'amateur').length}
          </p>
        </div>
      </div>

      {/* Sidebar des détails utilisateur */}
      <UserDetailsSidebar 
        user={uiState.selectedUser}
        isOpen={sidebarOpen}
        onClose={handleCloseSidebar}
        onSuspendUser={handleSuspendUser}
        onDeleteUser={handleDeleteUser}
        canManageUsers={canManageUsers}
      />

      {/* Modal de confirmation suspension */}
      <ConfirmationModal
        isOpen={modals.suspend}
        onClose={() => closeModal('suspend')}
        onConfirm={confirmSuspendAction}
        title={uiState.selectedUser?.suspended ? 'Réactiver l\'utilisateur' : 'Suspendre l\'utilisateur'}
        message={
          uiState.selectedUser?.suspended
            ? `Êtes-vous sûr de vouloir réactiver le compte de ${uiState.selectedUser?.name} ? L'utilisateur pourra de nouveau accéder à l'application.`
            : `Êtes-vous sûr de vouloir suspendre le compte de ${uiState.selectedUser?.name} ? L'utilisateur ne pourra plus accéder à l'application.`
        }
        confirmText={uiState.selectedUser?.suspended ? 'Réactiver' : 'Suspendre'}
        type={uiState.selectedUser?.suspended ? 'info' : 'warning'}
        isLoading={uiState.isLoading}
      />

      {/* Modal de confirmation suppression */}
      <ConfirmationModal
        isOpen={modals.delete}
        onClose={() => closeModal('delete')}
        onConfirm={confirmDeleteAction}
        title="Supprimer définitivement l'utilisateur"
        message={`Êtes-vous sûr de vouloir supprimer définitivement le compte de ${uiState.selectedUser?.name} ? Cette action est irréversible et supprimera toutes les données associées.`}
        confirmText="Supprimer définitivement"
        type="danger"
        isLoading={uiState.isLoading}
      />
    </div>
  );
}