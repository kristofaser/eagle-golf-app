'use client';

import { useState, useRef, useEffect } from 'react';
import { MoreVertical, Edit, Trash2, UserX, UserCheck, Key } from 'lucide-react';

interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: string;
  isSuperAdmin: boolean;
  is_active?: boolean;
}

interface AdminUserActionsProps {
  user: AdminUser;
  currentUserId: string;
  onEdit: (user: AdminUser) => void;
  onDelete: (user: AdminUser) => void;
  onToggleStatus: (user: AdminUser) => void;
  onResetPassword: (user: AdminUser) => void;
}

export default function AdminUserActions({ 
  user, 
  currentUserId, 
  onEdit, 
  onDelete, 
  onToggleStatus, 
  onResetPassword 
}: AdminUserActionsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isCurrentUser = user.id === currentUserId;
  const isActive = user.is_active !== false;

  const handleToggleDropdown = () => {
    if (!isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const dropdownWidth = 200;
      const dropdownHeight = 160;
      
      // Calculer la position optimale
      let top = rect.bottom + 4;
      let left = rect.right - dropdownWidth;
      
      // Ajustements si le dropdown dépasse de la fenêtre
      if (left < 8) {
        left = rect.left;
      }
      
      if (top + dropdownHeight > window.innerHeight) {
        top = rect.top - dropdownHeight - 4;
      }
      
      setDropdownPosition({ top, left });
    }
    setIsOpen(!isOpen);
  };

  return (
    <>
      <button
        ref={buttonRef}
        onClick={handleToggleDropdown}
        className="inline-flex items-center p-2 text-sm font-medium text-gray-400 bg-white rounded-lg hover:text-gray-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
      >
        <MoreVertical className="h-4 w-4" />
      </button>

      {isOpen && (
        <>
          {/* Backdrop invisible pour fermer le dropdown */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown menu avec positionnement fixed */}
          <div 
            ref={dropdownRef}
            className="fixed z-50 w-56 bg-white rounded-lg shadow-xl border border-gray-200 focus:outline-none"
            style={{
              top: `${dropdownPosition.top}px`,
              left: `${dropdownPosition.left}px`,
              minWidth: '200px'
            }}
          >
            <div className="py-1">
              {/* Modifier */}
              <button
                onClick={() => {
                  onEdit(user);
                  setIsOpen(false);
                }}
                className="group flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900"
              >
                <Edit className="mr-3 h-4 w-4 text-gray-400 group-hover:text-gray-500" />
                Modifier
              </button>

              {/* Réinitialiser le mot de passe */}
              <button
                onClick={() => {
                  onResetPassword(user);
                  setIsOpen(false);
                }}
                className="group flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900"
              >
                <Key className="mr-3 h-4 w-4 text-gray-400 group-hover:text-gray-500" />
                Réinitialiser mot de passe
              </button>

              {/* Activer/Désactiver (sauf pour soi-même) */}
              {!isCurrentUser && (
                <button
                  onClick={() => {
                    onToggleStatus(user);
                    setIsOpen(false);
                  }}
                  className={`group flex w-full items-center px-4 py-2 text-sm hover:bg-gray-100 ${
                    isActive 
                      ? 'text-orange-600 hover:text-orange-700' 
                      : 'text-green-600 hover:text-green-700'
                  }`}
                >
                  {isActive ? (
                    <>
                      <UserX className="mr-3 h-4 w-4" />
                      Désactiver
                    </>
                  ) : (
                    <>
                      <UserCheck className="mr-3 h-4 w-4" />
                      Réactiver
                    </>
                  )}
                </button>
              )}

              {/* Supprimer (sauf pour soi-même) */}
              {!isCurrentUser && (
                <>
                  <div className="border-t border-gray-100 my-1" />
                  <button
                    onClick={() => {
                      onDelete(user);
                      setIsOpen(false);
                    }}
                    className="group flex w-full items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50 hover:text-red-700"
                  >
                    <Trash2 className="mr-3 h-4 w-4" />
                    Supprimer
                  </button>
                </>
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
}