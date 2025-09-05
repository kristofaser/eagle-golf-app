'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface EditAdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (userId: string, adminData: EditAdminFormData) => Promise<void>;
  user: AdminUser | null;
}

interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  isSuperAdmin: boolean;
  permissions?: string[];
}

export interface EditAdminFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  role: 'admin' | 'super_admin' | 'marketing' | 'community_manager' | 'reservation';
  permissions: string[];
}

const defaultPermissions = [
  'manage_bookings',
  'manage_users', 
  'manage_courses',
  'view_analytics'
];

const superAdminPermissions = [
  'manage_bookings',
  'manage_users',
  'manage_courses', 
  'view_analytics',
  'manage_settings',
  'manage_admin_users',
  'system_administration'
];

const marketingPermissions = [
  'view_analytics',
  'manage_campaigns',
  'manage_content',
  'view_users',
  'manage_voyages',
  'manage_premium',
  'export_data'
];

const communityManagerPermissions = [
  'manage_content',
  'moderate_reviews',
  'manage_support',
  'view_users',
  'manage_communications',
  'view_analytics'
];

const reservationPermissions = [
  'manage_bookings',
  'view_courses',
  'manage_reservations',
  'contact_golf_courses',
  'view_booking_analytics',
  'manage_availability'
];

export default function EditAdminModal({ isOpen, onClose, onUpdate, user }: EditAdminModalProps) {
  const [formData, setFormData] = useState<EditAdminFormData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    role: 'admin',
    permissions: defaultPermissions
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Partial<EditAdminFormData>>({});

  useEffect(() => {
    if (user && isOpen) {
      // Parser le nom complet ou utiliser les champs séparés
      const nameParts = user.name.split(' ');
      const firstName = user.first_name || nameParts[0] || '';
      const lastName = user.last_name || (nameParts.length > 1 ? nameParts.slice(1).join(' ') : '');
      
      // Déterminer le rôle basé sur les données disponibles
      let userRole: 'admin' | 'super_admin' | 'marketing' | 'community_manager' | 'reservation' = 'admin';
      if (user.role) {
        userRole = user.role as typeof userRole;
      } else if (user.isSuperAdmin) {
        userRole = 'super_admin';
      }
      
      // Permissions par défaut basées sur le rôle
      let defaultUserPermissions = defaultPermissions;
      switch (userRole) {
        case 'super_admin':
          defaultUserPermissions = superAdminPermissions;
          break;
        case 'marketing':
          defaultUserPermissions = marketingPermissions;
          break;
        case 'community_manager':
          defaultUserPermissions = communityManagerPermissions;
          break;
        case 'reservation':
          defaultUserPermissions = reservationPermissions;
          break;
      }
      
      setFormData({
        firstName,
        lastName,
        email: user.email,
        phone: user.phone || '',
        role: userRole,
        permissions: user.permissions || defaultUserPermissions
      });
    }
  }, [user, isOpen]);

  if (!isOpen || !user) return null;

  const handleRoleChange = (role: 'admin' | 'super_admin' | 'marketing' | 'community_manager' | 'reservation') => {
    let permissions: string[];
    
    switch (role) {
      case 'super_admin':
        permissions = superAdminPermissions;
        break;
      case 'marketing':
        permissions = marketingPermissions;
        break;
      case 'community_manager':
        permissions = communityManagerPermissions;
        break;
      case 'reservation':
        permissions = reservationPermissions;
        break;
      default:
        permissions = defaultPermissions;
        break;
    }
    
    setFormData({
      ...formData,
      role,
      permissions
    });
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<EditAdminFormData> = {};
    
    if (!formData.firstName.trim()) newErrors.firstName = 'Le prénom est requis';
    if (!formData.lastName.trim()) newErrors.lastName = 'Le nom est requis';
    if (!formData.email.trim()) newErrors.email = 'L\'email est requis';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Email invalide';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      await onUpdate(user.id, formData);
      onClose();
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:p-0">
        {/* Backdrop */}
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose} />
        
        {/* Modal */}
        <div className="relative inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <form onSubmit={handleSubmit}>
            {/* Header */}
            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Modifier l'administrateur
                </h3>
                <button
                  type="button"
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-4">
                {/* Prénom */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">Prénom *</label>
                  <input
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary ${
                      errors.firstName ? 'border-red-300' : 'border-gray-300'
                    }`}
                  />
                  {errors.firstName && <p className="mt-1 text-sm text-red-600">{errors.firstName}</p>}
                </div>

                {/* Nom */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">Nom *</label>
                  <input
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary ${
                      errors.lastName ? 'border-red-300' : 'border-gray-300'
                    }`}
                  />
                  {errors.lastName && <p className="mt-1 text-sm text-red-600">{errors.lastName}</p>}
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email *</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary ${
                      errors.email ? 'border-red-300' : 'border-gray-300'
                    }`}
                  />
                  {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
                </div>

                {/* Téléphone */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">Téléphone</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                    placeholder="Optionnel"
                  />
                </div>

                {/* Rôle */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">Rôle</label>
                  <select
                    value={formData.role}
                    onChange={(e) => handleRoleChange(e.target.value as 'admin' | 'super_admin' | 'marketing' | 'community_manager' | 'reservation')}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                  >
                    <option value="admin">Administrateur</option>
                    <option value="super_admin">Super Administrateur</option>
                    <option value="marketing">Marketing</option>
                    <option value="community_manager">Community Manager</option>
                    <option value="reservation">Réservation</option>
                  </select>
                </div>

                {/* Permissions */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Permissions</label>
                  <div className="space-y-2">
                    {formData.permissions.map((permission) => (
                      <span
                        key={permission}
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary mr-2 mb-1"
                      >
                        {permission.replace(/_/g, ' ')}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full justify-center sm:ml-3 sm:w-auto"
              >
                {isSubmitting ? 'Mise à jour...' : 'Mettre à jour'}
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={onClose}
                disabled={isSubmitting}
                className="mt-3 w-full justify-center sm:mt-0 sm:w-auto"
              >
                Annuler
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}