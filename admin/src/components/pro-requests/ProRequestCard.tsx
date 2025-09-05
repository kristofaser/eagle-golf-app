'use client';

import { Users, Clock, CheckCircle, XCircle, AlertCircle, Building, Phone } from 'lucide-react';
import type { ProValidationRequestWithDetails } from '@/types';

interface ProRequestCardProps {
  request: ProValidationRequestWithDetails;
  onClick: (request: ProValidationRequestWithDetails) => void;
  className?: string;
}

export default function ProRequestCard({ request, onClick, className = '' }: ProRequestCardProps) {
  const { user_profile, admin_profile, status, created_at, validated_at, siret, company_status, phone_number } = request;
  
  const userName = `${user_profile.first_name || ''} ${user_profile.last_name || ''}`.trim();
  
  // Fonction pour obtenir le style du statut
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'pending':
        return {
          color: 'text-orange-700',
          bg: 'bg-orange-100',
          icon: Clock,
          label: 'En attente'
        };
      case 'approved':
        return {
          color: 'text-green-700',
          bg: 'bg-green-100',
          icon: CheckCircle,
          label: 'Approuvée'
        };
      case 'rejected':
        return {
          color: 'text-red-700',
          bg: 'bg-red-100',
          icon: XCircle,
          label: 'Rejetée'
        };
      default:
        return {
          color: 'text-gray-700',
          bg: 'bg-gray-100',
          icon: AlertCircle,
          label: 'Inconnu'
        };
    }
  };
  
  const statusConfig = getStatusConfig(status);
  const StatusIcon = statusConfig.icon;
  
  // Formater la date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  // Calculer le temps écoulé
  const getTimeElapsed = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 24) {
      return `${diffInHours}h`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays}j`;
    }
  };

  return (
    <div 
      className={`bg-white rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all duration-200 cursor-pointer p-6 ${className}`}
      onClick={() => onClick(request)}
    >
      {/* Header avec utilisateur et statut */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center overflow-hidden">
            {user_profile.avatar_url ? (
              <img
                src={user_profile.avatar_url}
                alt={userName}
                className="h-full w-full object-cover"
              />
            ) : (
              <Users className="h-6 w-6 text-blue-600" />
            )}
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{userName || 'Sans nom'}</h3>
            <p className="text-sm text-gray-600">{user_profile.email}</p>
            {user_profile.city && (
              <p className="text-xs text-gray-500">{user_profile.city}</p>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${statusConfig.bg} ${statusConfig.color}`}>
            <StatusIcon className="w-3 h-3" />
            {statusConfig.label}
          </span>
          
          {status === 'pending' && (
            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
              {getTimeElapsed(created_at!)}
            </span>
          )}
        </div>
      </div>

      {/* Informations professionnelles */}
      <div className="space-y-3 mb-4">
        <div className="flex items-center gap-2 text-sm">
          <Building className="w-4 h-4 text-gray-400" />
          <span className="font-medium text-gray-700">SIRET:</span>
          <span className="text-gray-600 font-mono">{siret}</span>
        </div>
        
        <div className="flex items-center gap-2 text-sm">
          <span className="font-medium text-gray-700">Statut:</span>
          <span className="text-gray-600">{company_status}</span>
        </div>
        
        {phone_number && (
          <div className="flex items-center gap-2 text-sm">
            <Phone className="w-4 h-4 text-gray-400" />
            <span className="text-gray-600 font-mono">{phone_number}</span>
          </div>
        )}
      </div>

      {/* Footer avec dates */}
      <div className="border-t border-gray-100 pt-4 space-y-2">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>Demande créée le {formatDate(created_at!)}</span>
          {status !== 'pending' && validated_at && (
            <span>
              {status === 'approved' ? 'Approuvée' : 'Rejetée'} le {formatDate(validated_at)}
            </span>
          )}
        </div>
        
        {status !== 'pending' && admin_profile && (
          <div className="text-xs text-gray-500">
            Par {admin_profile.first_name} {admin_profile.last_name}
          </div>
        )}
      </div>
    </div>
  );
}