'use client';

import { useState, useRef, useEffect } from 'react';
import { Search, Filter, Check } from 'lucide-react';

interface UserActionsProps {
  onSearchChange?: (query: string) => void;
  onFilterChange?: (filters: FilterState) => void;
}

interface FilterState {
  type: 'all' | 'amateur' | 'pro';
  role: 'all' | 'admin' | 'user';
}

export default function UserActions({ onSearchChange, onFilterChange }: UserActionsProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterOpen, setFilterOpen] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    type: 'all',
    role: 'all'
  });
  const filterRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
        setFilterOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    onSearchChange?.(value);
  };

  const handleFilterChange = (key: keyof FilterState, value: string) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFilterChange?.(newFilters);
  };

  const activeFiltersCount = [
    filters.type !== 'all',
    filters.role !== 'all'
  ].filter(Boolean).length;

  return (
    <div className="mb-6">
      <div className="flex gap-4">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <input
            type="text"
            placeholder="Rechercher un utilisateur..."
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
          />
        </div>
        
        {/* Filter */}
        <div className="relative" ref={filterRef}>
          <button 
            onClick={() => setFilterOpen(!filterOpen)}
            className={`flex items-center gap-2 px-4 py-2 border rounded-lg transition-colors ${
              activeFiltersCount > 0 
                ? 'border-primary bg-primary/5 text-primary hover:bg-primary/10' 
                : 'border-gray-300 hover:bg-gray-50'
            }`}
          >
            <Filter className="h-5 w-5" />
            <span>Filtrer</span>
            {activeFiltersCount > 0 && (
              <span className="ml-1 px-1.5 py-0.5 text-xs bg-primary text-white rounded-full">
                {activeFiltersCount}
              </span>
            )}
          </button>

          {/* Dropdown */}
          {filterOpen && (
            <div className="absolute top-full mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
              <div className="p-4">
                {/* Type de compte */}
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Type de compte</h4>
                  <div className="space-y-1">
                    <label className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded">
                      <input
                        type="radio"
                        name="type"
                        checked={filters.type === 'all'}
                        onChange={() => handleFilterChange('type', 'all')}
                        className="text-primary focus:ring-primary"
                      />
                      <span className="text-sm">Tous</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded">
                      <input
                        type="radio"
                        name="type"
                        checked={filters.type === 'amateur'}
                        onChange={() => handleFilterChange('type', 'amateur')}
                        className="text-primary focus:ring-primary"
                      />
                      <span className="text-sm">Amateurs</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded">
                      <input
                        type="radio"
                        name="type"
                        checked={filters.type === 'pro'}
                        onChange={() => handleFilterChange('type', 'pro')}
                        className="text-primary focus:ring-primary"
                      />
                      <span className="text-sm">Professionnels</span>
                    </label>
                  </div>
                </div>

                {/* Rôle */}
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Rôle</h4>
                  <div className="space-y-1">
                    <label className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded">
                      <input
                        type="radio"
                        name="role"
                        checked={filters.role === 'all'}
                        onChange={() => handleFilterChange('role', 'all')}
                        className="text-primary focus:ring-primary"
                      />
                      <span className="text-sm">Tous</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded">
                      <input
                        type="radio"
                        name="role"
                        checked={filters.role === 'admin'}
                        onChange={() => handleFilterChange('role', 'admin')}
                        className="text-primary focus:ring-primary"
                      />
                      <span className="text-sm">Administrateurs</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded">
                      <input
                        type="radio"
                        name="role"
                        checked={filters.role === 'user'}
                        onChange={() => handleFilterChange('role', 'user')}
                        className="text-primary focus:ring-primary"
                      />
                      <span className="text-sm">Utilisateurs</span>
                    </label>
                  </div>
                </div>

                {/* Bouton de réinitialisation */}
                {activeFiltersCount > 0 && (
                  <button
                    onClick={() => {
                      setFilters({ type: 'all', role: 'all' });
                      onFilterChange?.({ type: 'all', role: 'all' });
                    }}
                    className="mt-4 w-full text-sm text-gray-600 hover:text-gray-900"
                  >
                    Réinitialiser les filtres
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}