'use client';

import { useState, useMemo, useEffect } from 'react';
import { Search, Filter, Clock, CheckCircle, XCircle, Users } from 'lucide-react';
import ProRequestCard from '@/components/pro-requests/ProRequestCard';
import ProRequestDetailsSidebar from '@/components/pro-requests/ProRequestDetailsSidebar';
import { approveProRequest, rejectProRequest } from './actions';
import type { ProValidationRequestWithDetails, ProRequestFilters, ProRequestStatus } from '@/types';

interface ProRequestsClientProps {
  initialRequests: ProValidationRequestWithDetails[];
  canValidate?: boolean;
}

export default function ProRequestsClient({ 
  initialRequests, 
  canValidate = false 
}: ProRequestsClientProps) {
  const [requests, setRequests] = useState<ProValidationRequestWithDetails[]>(initialRequests);
  const [selectedRequest, setSelectedRequest] = useState<ProValidationRequestWithDetails | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<ProRequestFilters>({
    status: 'all'
  });
  
  // États UI
  const [uiState, setUiState] = useState({
    isLoading: false,
    successMessage: '',
    errorMessage: ''
  });

  // Filtrer les demandes
  const filteredRequests = useMemo(() => {
    let result = [...requests];

    // Filtre par recherche
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(request => {
        const userName = `${request.user_profile.first_name || ''} ${request.user_profile.last_name || ''}`.toLowerCase();
        const email = request.user_profile.email?.toLowerCase() || '';
        const siret = request.siret?.toLowerCase() || '';
        
        return userName.includes(query) || 
               email.includes(query) || 
               siret.includes(query);
      });
    }

    // Filtre par statut
    if (filters.status !== 'all') {
      result = result.filter(request => request.status === filters.status);
    }

    // Trier par date (plus récentes en premier)
    result.sort((a, b) => {
      const dateA = new Date(a.created_at || 0).getTime();
      const dateB = new Date(b.created_at || 0).getTime();
      return dateB - dateA;
    });

    return result;
  }, [requests, searchQuery, filters]);

  // Statistiques
  const stats = useMemo(() => {
    const pending = requests.filter(r => r.status === 'pending').length;
    const approved = requests.filter(r => r.status === 'approved').length;
    const rejected = requests.filter(r => r.status === 'rejected').length;
    
    return { pending, approved, rejected, total: requests.length };
  }, [requests]);

  // Gérer la sélection d'une demande
  const handleRequestClick = (request: ProValidationRequestWithDetails) => {
    setSelectedRequest(request);
    setSidebarOpen(true);
  };

  // Fermer la sidebar
  const handleCloseSidebar = () => {
    setSidebarOpen(false);
    setTimeout(() => setSelectedRequest(null), 300);
  };

  // Gérer l'approbation d'une demande
  const handleApproveRequest = async (requestId: string, notes: string) => {
    setUiState(prev => ({ ...prev, isLoading: true }));
    
    try {
      const result = await approveProRequest(requestId, notes);
      
      if (result.success) {
        // Mettre à jour la liste locale
        setRequests(prev => prev.map(request => 
          request.id === requestId 
            ? { ...request, status: 'approved', validated_at: new Date().toISOString(), admin_notes: notes }
            : request
        ));
        
        setUiState(prev => ({ 
          ...prev, 
          successMessage: result.message,
          errorMessage: ''
        }));
        
        // Fermer la sidebar
        handleCloseSidebar();
        
        return { success: true, message: result.message };
      } else {
        setUiState(prev => ({ 
          ...prev, 
          errorMessage: result.message,
          successMessage: ''
        }));
        
        return { success: false, message: result.message };
      }
    } catch (error) {
      const errorMessage = 'Erreur lors de l\'approbation de la demande';
      setUiState(prev => ({ 
        ...prev, 
        errorMessage,
        successMessage: ''
      }));
      
      return { success: false, message: errorMessage };
    } finally {
      setUiState(prev => ({ ...prev, isLoading: false }));
    }
  };

  // Gérer le rejet d'une demande
  const handleRejectRequest = async (requestId: string, notes: string) => {
    setUiState(prev => ({ ...prev, isLoading: true }));
    
    try {
      const result = await rejectProRequest(requestId, notes);
      
      if (result.success) {
        // Mettre à jour la liste locale
        setRequests(prev => prev.map(request => 
          request.id === requestId 
            ? { ...request, status: 'rejected', validated_at: new Date().toISOString(), admin_notes: notes }
            : request
        ));
        
        setUiState(prev => ({ 
          ...prev, 
          successMessage: result.message,
          errorMessage: ''
        }));
        
        // Fermer la sidebar
        handleCloseSidebar();
        
        return { success: true, message: result.message };
      } else {
        setUiState(prev => ({ 
          ...prev, 
          errorMessage: result.message,
          successMessage: ''
        }));
        
        return { success: false, message: result.message };
      }
    } catch (error) {
      const errorMessage = 'Erreur lors du rejet de la demande';
      setUiState(prev => ({ 
        ...prev, 
        errorMessage,
        successMessage: ''
      }));
      
      return { success: false, message: errorMessage };
    } finally {
      setUiState(prev => ({ ...prev, isLoading: false }));
    }
  };

  // Gestion des messages (auto-disparition)
  useEffect(() => {
    if (uiState.successMessage || uiState.errorMessage) {
      const timer = setTimeout(() => {
        setUiState(prev => ({ ...prev, successMessage: '', errorMessage: '' }));
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [uiState.successMessage, uiState.errorMessage]);

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

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Demandes professionnelles</h1>
        <p className="mt-1 text-sm text-gray-500">
          Validez les demandes de conversion en compte professionnel
        </p>
      </div>

      {/* Statistiques */}
      <div className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">En attente</p>
              <p className="text-2xl font-bold text-orange-600">{stats.pending}</p>
            </div>
            <Clock className="w-8 h-8 text-orange-500" />
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Approuvées</p>
              <p className="text-2xl font-bold text-green-600">{stats.approved}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Rejetées</p>
              <p className="text-2xl font-bold text-red-600">{stats.rejected}</p>
            </div>
            <XCircle className="w-8 h-8 text-red-500" />
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total</p>
              <p className="text-2xl font-bold text-gray-600">{stats.total}</p>
            </div>
            <Users className="w-8 h-8 text-gray-500" />
          </div>
        </div>
      </div>

      {/* Barre d'actions */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        {/* Recherche */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Rechercher par nom, email ou SIRET..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        
        {/* Filtres */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-400" />
            <select
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value as ProRequestStatus | 'all' }))}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Tous les statuts</option>
              <option value="pending">En attente</option>
              <option value="approved">Approuvées</option>
              <option value="rejected">Rejetées</option>
            </select>
          </div>
        </div>
      </div>

      {/* Liste des demandes */}
      <div className="space-y-4">
        {filteredRequests.length > 0 ? (
          <>
            <div className="text-sm text-gray-600 mb-4">
              {filteredRequests.length} demande{filteredRequests.length > 1 ? 's' : ''} trouvée{filteredRequests.length > 1 ? 's' : ''}
            </div>
            
            <div className="grid gap-4">
              {filteredRequests.map((request) => (
                <ProRequestCard
                  key={request.id}
                  request={request}
                  onClick={handleRequestClick}
                />
              ))}
            </div>
          </>
        ) : (
          <div className="text-center py-12">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune demande trouvée</h3>
            <p className="text-gray-500">
              {searchQuery || filters.status !== 'all'
                ? 'Aucune demande ne correspond aux critères de recherche'
                : 'Aucune demande professionnelle pour le moment'
              }
            </p>
          </div>
        )}
      </div>

      {/* Sidebar de détail */}
      <ProRequestDetailsSidebar
        request={selectedRequest}
        isOpen={sidebarOpen}
        onClose={handleCloseSidebar}
        onApprove={handleApproveRequest}
        onReject={handleRejectRequest}
        canValidate={canValidate}
      />
    </div>
  );
}