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
  const [dropdownPosition, setDropdownPosition] = useState<'right' | 'left'>('right');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

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
      // Calculer la position optimale du dropdown
      const rect = buttonRef.current.getBoundingClientRect();
      const spaceOnRight = window.innerWidth - rect.right;
      const dropdownWidth = 192; // 48 * 4px (w-48)
      
      setDropdownPosition(spaceOnRight < dropdownWidth ? 'left' : 'right');
    }
    setIsOpen(!isOpen);
  };

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        ref={buttonRef}
        onClick={handleToggleDropdown}
        className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-colors"
      >
        <MoreVertical className="h-5 w-5" />
      </button>

      {isOpen && (
        <div className={`absolute z-50 mt-2 w-48 rounded-md shadow-xl bg-white border border-gray-200 focus:outline-none ${
          dropdownPosition === 'right' ? 'right-0' : 'left-0'
        }`} style={{ 
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)' 
        }}>
          <div className="py-1">
            {/* Modifier */}
            <button
              onClick={() => {
                onEdit(user);
                setIsOpen(false);
              }}
              className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
            >
              <Edit className="mr-3 h-4 w-4" />
              Modifier
            </button>

            {/* Réinitialiser le mot de passe */}
            <button
              onClick={() => {
                onResetPassword(user);
                setIsOpen(false);
              }}
              className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
            >
              <Key className="mr-3 h-4 w-4" />
              Réinitialiser MDP
            </button>

            {/* Activer/Désactiver (sauf pour soi-même) */}
            {!isCurrentUser && (
              <button
                onClick={() => {
                  onToggleStatus(user);
                  setIsOpen(false);
                }}
                className={`flex items-center px-4 py-2 text-sm hover:bg-gray-100 w-full text-left ${
                  isActive ? 'text-orange-700' : 'text-green-700'
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
                <div className="border-t border-gray-100 my-1"></div>
                <button
                  onClick={() => {
                    onDelete(user);
                    setIsOpen(false);
                  }}
                  className="flex items-center px-4 py-2 text-sm text-red-700 hover:bg-red-50 w-full text-left"
                >
                  <Trash2 className="mr-3 h-4 w-4" />
                  Supprimer
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}