'use client';

import { useState } from 'react';
import { CheckCircle, XCircle, MessageCircle } from 'lucide-react';
import ConfirmationModal from '@/components/admin/ConfirmationModal';
import type { ProValidationRequestWithDetails } from '@/types';

interface ValidationActionsProps {
  request: ProValidationRequestWithDetails;
  onApprove: (requestId: string, notes: string) => Promise<{ success: boolean; message: string }>;
  onReject: (requestId: string, notes: string) => Promise<{ success: boolean; message: string }>;
  disabled?: boolean;
  className?: string;
}

interface ValidationModalState {
  type: 'approve' | 'reject' | null;
  isOpen: boolean;
  notes: string;
  isSubmitting: boolean;
}

export default function ValidationActions({ 
  request, 
  onApprove, 
  onReject, 
  disabled = false,
  className = ''
}: ValidationActionsProps) {
  const [modal, setModal] = useState<ValidationModalState>({
    type: null,
    isOpen: false,
    notes: '',
    isSubmitting: false
  });
  
  const userName = `${request.user_profile.first_name || ''} ${request.user_profile.last_name || ''}`.trim();
  
  // Ouvrir modal de validation
  const openModal = (type: 'approve' | 'reject') => {
    setModal({
      type,
      isOpen: true,
      notes: '',
      isSubmitting: false
    });
  };
  
  // Fermer modal
  const closeModal = () => {
    if (modal.isSubmitting) return; // Empêcher de fermer pendant soumission
    
    setModal({
      type: null,
      isOpen: false,
      notes: '',
      isSubmitting: false
    });
  };
  
  // Soumettre validation
  const handleSubmit = async () => {
    if (!modal.type || modal.isSubmitting) return;
    
    setModal(prev => ({ ...prev, isSubmitting: true }));
    
    try {
      const result = modal.type === 'approve' 
        ? await onApprove(request.id, modal.notes)
        : await onReject(request.id, modal.notes);
      
      if (result.success) {
        closeModal();
      } else {
        // Laisser la modal ouverte en cas d'erreur pour que l'utilisateur puisse réessayer
        setModal(prev => ({ ...prev, isSubmitting: false }));
      }
    } catch (error) {
      console.error('Erreur validation:', error);
      setModal(prev => ({ ...prev, isSubmitting: false }));
    }
  };
  
  // Ne pas afficher les actions si la demande n'est pas en attente
  if (request.status !== 'pending') {
    return null;
  }

  return (
    <>
      <div className={`space-y-3 ${className}`}>
        <h3 className="text-sm font-medium text-gray-900 flex items-center gap-2">
          <MessageCircle className="w-4 h-4" />
          Actions de validation
        </h3>
        
        <div className="flex gap-3">
          {/* Bouton Approuver */}
          <button
            onClick={() => openModal('approve')}
            disabled={disabled}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors duration-200"
          >
            <CheckCircle className="w-5 h-5" />
            Approuver
          </button>
          
          {/* Bouton Rejeter */}
          <button
            onClick={() => openModal('reject')}
            disabled={disabled}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-red-600 hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors duration-200"
          >
            <XCircle className="w-5 h-5" />
            Rejeter
          </button>
        </div>
      </div>

      {/* Modal de confirmation */}
      <ConfirmationModal
        isOpen={modal.isOpen}
        onClose={closeModal}
        onConfirm={handleSubmit}
        title={modal.type === 'approve' ? 'Approuver la demande' : 'Rejeter la demande'}
        message={
          modal.type === 'approve'
            ? `Êtes-vous sûr de vouloir approuver la demande de ${userName} ? L'utilisateur deviendra professionnel et pourra créer des disponibilités.`
            : `Êtes-vous sûr de vouloir rejeter la demande de ${userName} ? L'utilisateur restera amateur et devra refaire une demande.`
        }
        confirmText={modal.type === 'approve' ? 'Approuver' : 'Rejeter'}
        type={modal.type === 'approve' ? 'success' : 'danger'}
        isLoading={modal.isSubmitting}
      >
        {/* Champ de notes obligatoire */}
        <div className="mt-4">
          <label htmlFor="validation-notes" className="block text-sm font-medium text-gray-700 mb-2">
            {modal.type === 'approve' ? 'Notes d\'approbation' : 'Motif du rejet'} *
          </label>
          <textarea
            id="validation-notes"
            value={modal.notes}
            onChange={(e) => setModal(prev => ({ ...prev, notes: e.target.value }))}
            placeholder={
              modal.type === 'approve' 
                ? 'Précisez les vérifications effectuées...' 
                : 'Expliquez pourquoi la demande est rejetée...'
            }
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            disabled={modal.isSubmitting}
            required
          />
          <p className="mt-1 text-xs text-gray-500">
            {modal.type === 'approve' 
              ? 'Ces notes seront conservées dans l\'historique de validation.'
              : 'Ces informations pourront aider l\'utilisateur à corriger sa demande.'
            }
          </p>
        </div>
      </ConfirmationModal>
    </>
  );
}