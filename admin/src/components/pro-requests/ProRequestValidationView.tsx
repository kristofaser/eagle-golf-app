'use client';

import { useState, useEffect } from 'react';
import { X, User, CheckCircle, XCircle, Clock, AlertCircle, ZoomIn, ZoomOut } from 'lucide-react';
import type { ProValidationRequestWithDetails } from '@/types';

interface ProRequestValidationViewProps {
  request: ProValidationRequestWithDetails | null;
  isOpen: boolean;
  onClose: () => void;
  onApprove: (requestId: string, notes: string) => Promise<{ success: boolean; message: string }>;
  onReject: (requestId: string, notes: string) => Promise<{ success: boolean; message: string }>;
  canValidate?: boolean;
}


interface DocumentViewerProps {
  url: string;
  title: string;
  alt: string;
}

function DocumentViewer({ url, title, alt }: DocumentViewerProps) {
  const [zoom, setZoom] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const handleImageLoad = () => {
    setIsLoading(false);
    setHasError(false);
  };

  const handleImageError = () => {
    setIsLoading(false);
    setHasError(true);
  };

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.25, 2));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.25, 0.5));
  const resetZoom = () => setZoom(1);

  if (!url) {
    return (
      <div className="bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 h-64 flex flex-col items-center justify-center">
        <AlertCircle className="w-12 h-12 text-gray-400 mb-2" />
        <p className="text-gray-500 text-sm">{title} non disponible</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h4 className="font-medium text-gray-900">{title}</h4>
        <div className="flex items-center gap-2">
          <button
            onClick={handleZoomOut}
            disabled={zoom <= 0.5}
            className="p-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <span className="text-xs text-gray-600 min-w-[3rem] text-center">
            {Math.round(zoom * 100)}%
          </span>
          <button
            onClick={handleZoomIn}
            disabled={zoom >= 2}
            className="p-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
        </div>
      </div>
      
      <div className="relative bg-gray-50 rounded-lg border border-gray-200 overflow-hidden">
        {isLoading && (
          <div className="absolute inset-0 bg-gray-100 animate-pulse flex items-center justify-center">
            <div className="text-sm text-gray-500">Chargement...</div>
          </div>
        )}
        
        {hasError && (
          <div className="h-64 bg-gray-100 flex flex-col items-center justify-center">
            <AlertCircle className="w-12 h-12 text-red-400 mb-2" />
            <p className="text-red-600 text-sm">Erreur de chargement</p>
            <p className="text-gray-500 text-xs">Document inaccessible</p>
          </div>
        )}
        
        {!hasError && (
          <div className="relative overflow-auto" style={{ maxHeight: '300px' }}>
            <img
              src={url}
              alt={alt}
              onLoad={handleImageLoad}
              onError={handleImageError}
              className="w-full transition-all duration-300 cursor-pointer"
              style={{ 
                transform: `scale(${zoom})`,
                transformOrigin: 'top left'
              }}
              onClick={resetZoom}
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default function ProRequestValidationView({
  request,
  isOpen,
  onClose,
  onApprove,
  onReject,
  canValidate = false
}: ProRequestValidationViewProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState<'approve' | 'reject' | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [notesError, setNotesError] = useState('');
  const [validationError, setValidationError] = useState('');
  const [refreshedUrls, setRefreshedUrls] = useState<{
    frontUrl: string | null;
    backUrl: string | null;
  }>({ frontUrl: null, backUrl: null });
  const [isRefreshingUrls, setIsRefreshingUrls] = useState(false);

  // Fonction pour rafraîchir les URLs des documents
  const refreshDocumentUrls = async () => {
    if (!request?.id_card_front_url && !request?.id_card_back_url) return;
    
    setIsRefreshingUrls(true);
    try {
      const response = await fetch('/api/documents/refresh-urls', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          frontUrl: request?.id_card_front_url,
          backUrl: request?.id_card_back_url
        })
      });
      
      const result = await response.json();
      if (result.success) {
        setRefreshedUrls(result.data);
      }
    } catch (error) {
      console.error('Erreur rafraîchissement URLs:', error);
    } finally {
      setIsRefreshingUrls(false);
    }
  };

  useEffect(() => {
    if (request) {
      // Rafraîchir automatiquement les URLs des documents
      refreshDocumentUrls();
    }
  }, [request]);


  // Gérer l'approbation/rejet
  const handleSubmitValidation = async (action: 'approve' | 'reject') => {
    if (!request) return;

    // Validation des notes (obligatoires uniquement pour le rejet)
    if (action === 'reject' && !adminNotes.trim()) {
      setNotesError('Le motif du rejet est obligatoire');
      return;
    }

    setIsSubmitting(true);
    setValidationError('');
    
    try {
      const result = action === 'approve' 
        ? await onApprove(request.id, '') // Pas de notes pour l'approbation
        : await onReject(request.id, adminNotes.trim());

      if (result.success) {
        // Réinitialiser les états
        setShowConfirmModal(null);
        setAdminNotes('');
        setNotesError('');
        setValidationError('');
        onClose();
      } else {
        // Afficher l'erreur sans fermer la modal
        setValidationError(result.message || 'Erreur lors de la validation');
      }
    } catch (error) {
      console.error('Erreur validation:', error);
      setValidationError(error instanceof Error ? error.message : 'Erreur lors de la validation');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Réinitialiser les erreurs quand on change d'action
  const handleOpenModal = (action: 'approve' | 'reject') => {
    setShowConfirmModal(action);
    setAdminNotes('');
    setNotesError('');
    setValidationError('');
  };

  // Gérer le changement de notes
  const handleNotesChange = (value: string) => {
    setAdminNotes(value);
    if (value.trim() && notesError) {
      setNotesError('');
    }
  };

  if (!request) return null;

  const userName = `${request.user_profile.first_name || ''} ${request.user_profile.last_name || ''}`.trim();
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'pending': return { color: 'text-orange-700', bg: 'bg-orange-100', icon: Clock, label: 'En attente' };
      case 'approved': return { color: 'text-green-700', bg: 'bg-green-100', icon: CheckCircle, label: 'Approuvée' };
      case 'rejected': return { color: 'text-red-700', bg: 'bg-red-100', icon: XCircle, label: 'Rejetée' };
      default: return { color: 'text-gray-700', bg: 'bg-gray-100', icon: Clock, label: 'Inconnu' };
    }
  };

  const statusConfig = getStatusConfig(request.status);
  const StatusIcon = statusConfig.icon;

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity"
          onClick={onClose}
        />
      )}
      
      {/* Main View */}
      <div className={`fixed inset-0 z-50 transform transition-transform duration-300 ease-in-out ${
        isOpen ? 'translate-x-0' : 'translate-x-full'
      }`}>
        <div className="h-full bg-white shadow-2xl flex flex-col">
          
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center overflow-hidden">
                {request.user_profile.avatar_url ? (
                  <img
                    src={request.user_profile.avatar_url}
                    alt={userName}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <User className="h-6 w-6 text-blue-600" />
                )}
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Validation de demande pro</h1>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${statusConfig.bg} ${statusConfig.color}`}>
                    <StatusIcon className="w-4 h-4" />
                    {statusConfig.label}
                  </span>
                  <span className="text-sm text-gray-500">
                    • Demande du {new Date(request.created_at!).toLocaleDateString('fr-FR')}
                  </span>
                </div>
              </div>
            </div>
            
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-200 rounded-full transition-colors"
              aria-label="Fermer"
            >
              <X className="w-6 h-6 text-gray-500" />
            </button>
          </div>

          {/* Main Content */}
          <div className="flex-1 overflow-hidden">
            <div className="h-full flex flex-col">
              
              {/* Content Area */}
              <div className="flex-1 overflow-y-auto">
                <div className="p-6 space-y-8">
                  
                  {/* Documents Preview */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                      <h2 className="text-lg font-semibold text-gray-900">Pièces d'identité</h2>
                    </div>
                    
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <DocumentViewer
                        url={refreshedUrls.frontUrl || request.id_card_front_url || ''}
                        title="Recto"
                        alt={`Pièce d'identité recto - ${userName}`}
                      />
                      
                      <DocumentViewer
                        url={refreshedUrls.backUrl || request.id_card_back_url || ''}
                        title="Verso"
                        alt={`Pièce d'identité verso - ${userName}`}
                      />
                    </div>
                    
                    {isRefreshingUrls && (
                      <div className="text-sm text-blue-600 flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                        Actualisation des documents...
                      </div>
                    )}
                  </div>

                  {/* Informations candidat */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900">{userName}</h3>
                    
                    <div className="bg-gray-50 rounded-lg p-4 space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                        <div>
                          <span className="font-medium text-gray-700">Email:</span>
                          <span className="ml-2 text-gray-900">{request.user_profile?.email || 'Non renseigné'}</span>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">SIRET:</span>
                          <span className="ml-2 font-mono text-gray-900">{request.siret || 'Non renseigné'}</span>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">Date de naissance:</span>
                          <span className="ml-2 text-gray-900">
                            {request.date_of_birth ? new Date(request.date_of_birth).toLocaleDateString('fr-FR') : 'Non renseigné'}
                          </span>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">Entreprise:</span>
                          <span className="ml-2 text-gray-900">{request.company_status || 'Non renseigné'}</span>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">Téléphone:</span>
                          <span className="ml-2 text-gray-900">{request.phone_number || 'Non renseigné'}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Tarifs professionnels */}
                  {(request.price_9_holes_1_player || request.price_18_holes_1_player) && (
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <h3 className="text-lg font-semibold text-gray-900">Tarifs proposés</h3>
                      </div>
                      
                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {/* Tarifs 9 trous */}
                          {(request.price_9_holes_1_player || request.price_9_holes_2_players || request.price_9_holes_3_players) && (
                            <div>
                              <h4 className="font-medium text-gray-900 mb-3">9 trous</h4>
                              <div className="space-y-2 text-sm">
                                {request.price_9_holes_1_player && (
                                  <div className="flex justify-between">
                                    <span className="text-gray-600">1 joueur:</span>
                                    <span className="font-medium text-gray-900">{(request.price_9_holes_1_player / 100).toFixed(2)} €</span>
                                  </div>
                                )}
                                {request.price_9_holes_2_players && (
                                  <div className="flex justify-between">
                                    <span className="text-gray-600">2 joueurs:</span>
                                    <span className="font-medium text-gray-900">{(request.price_9_holes_2_players / 100).toFixed(2)} € / pers</span>
                                  </div>
                                )}
                                {request.price_9_holes_3_players && (
                                  <div className="flex justify-between">
                                    <span className="text-gray-600">3 joueurs:</span>
                                    <span className="font-medium text-gray-900">{(request.price_9_holes_3_players / 100).toFixed(2)} € / pers</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Tarifs 18 trous */}
                          {(request.price_18_holes_1_player || request.price_18_holes_2_players || request.price_18_holes_3_players) && (
                            <div>
                              <h4 className="font-medium text-gray-900 mb-3">18 trous</h4>
                              <div className="space-y-2 text-sm">
                                {request.price_18_holes_1_player && (
                                  <div className="flex justify-between">
                                    <span className="text-gray-600">1 joueur:</span>
                                    <span className="font-medium text-gray-900">{(request.price_18_holes_1_player / 100).toFixed(2)} €</span>
                                  </div>
                                )}
                                {request.price_18_holes_2_players && (
                                  <div className="flex justify-between">
                                    <span className="text-gray-600">2 joueurs:</span>
                                    <span className="font-medium text-gray-900">{(request.price_18_holes_2_players / 100).toFixed(2)} € / pers</span>
                                  </div>
                                )}
                                {request.price_18_holes_3_players && (
                                  <div className="flex justify-between">
                                    <span className="text-gray-600">3 joueurs:</span>
                                    <span className="font-medium text-gray-900">{(request.price_18_holes_3_players / 100).toFixed(2)} € / pers</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Fixed Actions Footer */}
              {canValidate && request.status === 'pending' && (
                <div className="border-t border-gray-200 bg-white p-6">
                  <div className="max-w-2xl mx-auto">
                    <div className="flex gap-4">
                      <button
                        onClick={() => handleOpenModal('approve')}
                        disabled={isSubmitting}
                        className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors duration-200"
                      >
                        <CheckCircle className="w-5 h-5" />
                        Approuver la demande
                      </button>
                      
                      <button
                        onClick={() => handleOpenModal('reject')}
                        disabled={isSubmitting}
                        className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-red-600 hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors duration-200"
                      >
                        <XCircle className="w-5 h-5" />
                        Rejeter la demande
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-60 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                {showConfirmModal === 'approve' ? 'Approuver la demande' : 'Rejeter la demande'}
              </h3>
              
              <p className="text-gray-600 mb-4">
                {showConfirmModal === 'approve'
                  ? `Approuver la demande de ${userName} ? L'utilisateur deviendra professionnel et pourra créer des disponibilités.`
                  : `Rejeter la demande de ${userName} ? L'utilisateur restera amateur et devra refaire une demande.`
                }
              </p>

              {/* Champ de notes obligatoire pour le rejet uniquement */}
              {showConfirmModal === 'reject' && (
                <div className="mb-4">
                  <label htmlFor="admin-notes" className="block text-sm font-medium text-gray-700 mb-2">
                    Motif du rejet *
                  </label>
                  <textarea
                    id="admin-notes"
                    value={adminNotes}
                    onChange={(e) => handleNotesChange(e.target.value)}
                    placeholder="Expliquez pourquoi la demande est rejetée (documents manquants, informations incorrectes, etc.)..."
                    rows={4}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none ${
                      notesError ? 'border-red-300 bg-red-50' : 'border-gray-300'
                    }`}
                    disabled={isSubmitting}
                    required
                  />
                  {notesError && (
                    <p className="mt-1 text-sm text-red-600">{notesError}</p>
                  )}
                  <p className="mt-1 text-xs text-gray-500">
                    Ces informations pourront aider l'utilisateur à corriger sa demande.
                  </p>
                </div>
              )}

              {/* Affichage des erreurs de validation */}
              {validationError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-sm text-red-600">{validationError}</p>
                </div>
              )}
              
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowConfirmModal(null);
                    setAdminNotes('');
                    setNotesError('');
                    setValidationError('');
                  }}
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  Annuler
                </button>
                
                <button
                  onClick={() => handleSubmitValidation(showConfirmModal)}
                  disabled={isSubmitting || (showConfirmModal === 'reject' && !adminNotes.trim())}
                  className={`flex-1 px-4 py-2 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                    showConfirmModal === 'approve'
                      ? 'bg-green-600 hover:bg-green-700 disabled:bg-gray-400'
                      : 'bg-red-600 hover:bg-red-700 disabled:bg-gray-400'
                  }`}
                >
                  {isSubmitting ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Traitement...
                    </div>
                  ) : (
                    showConfirmModal === 'approve' ? 'Approuver' : 'Rejeter'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}