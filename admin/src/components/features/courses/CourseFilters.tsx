'use client';

import { useState, useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search, Filter, X, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface CourseFiltersProps {
  departments: string[];
}

export default function CourseFilters({ departments }: CourseFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  
  const [showFilters, setShowFilters] = useState(false);
  const [localSearch, setLocalSearch] = useState(searchParams.get('search') || '');

  const currentDepartment = searchParams.get('department') || '';
  const currentMinHoles = searchParams.get('minHoles') || '';
  const currentMaxHoles = searchParams.get('maxHoles') || '';

  const updateURL = (key: string, value: string) => {
    startTransition(() => {
      const params = new URLSearchParams(searchParams);
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      // Reset à la page 1 lors d'un changement de filtre
      params.delete('page');
      
      router.push(`/courses?${params.toString()}`);
    });
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateURL('search', localSearch);
  };

  const handleReset = () => {
    setLocalSearch('');
    startTransition(() => {
      router.push('/courses');
    });
  };

  const hasActiveFilters = currentDepartment || currentMinHoles || currentMaxHoles || searchParams.get('search');

  return (
    <div className="space-y-4">
      {/* Barre de recherche et actions principales */}
      <div className="flex gap-4">
        <form onSubmit={handleSearchSubmit} className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <input
            type="text"
            placeholder="Rechercher un parcours (nom, ville)..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            disabled={isPending}
          />
        </form>
        
        <Button
          type="button"
          variant="secondary"
          onClick={() => setShowFilters(!showFilters)}
          className={showFilters ? 'bg-primary/10 text-primary' : ''}
        >
          <Filter className="h-4 w-4 mr-2" />
          Filtres
          {hasActiveFilters && (
            <span className="ml-1 bg-primary text-white text-xs rounded-full px-1.5 py-0.5">
              •
            </span>
          )}
        </Button>

        {hasActiveFilters && (
          <Button
            type="button"
            variant="secondary"
            onClick={handleReset}
            disabled={isPending}
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Réinitialiser
          </Button>
        )}
      </div>

      {/* Filtres avancés */}
      {showFilters && (
        <div className="bg-gray-50 p-4 rounded-lg space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-gray-900">Filtres avancés</h3>
            <button
              onClick={() => setShowFilters(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Filtre département */}
            <div>
              <label htmlFor="department" className="block text-sm font-medium text-gray-700 mb-2">
                Département
              </label>
              <select
                id="department"
                value={currentDepartment}
                onChange={(e) => updateURL('department', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                disabled={isPending}
              >
                <option value="">Tous les départements</option>
                {departments.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            </div>

            {/* Filtre nombre de trous minimum */}
            <div>
              <label htmlFor="minHoles" className="block text-sm font-medium text-gray-700 mb-2">
                Trous minimum
              </label>
              <select
                id="minHoles"
                value={currentMinHoles}
                onChange={(e) => updateURL('minHoles', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                disabled={isPending}
              >
                <option value="">Aucun minimum</option>
                <option value="9">9 trous</option>
                <option value="18">18 trous</option>
                <option value="27">27 trous</option>
              </select>
            </div>

            {/* Filtre nombre de trous maximum */}
            <div>
              <label htmlFor="maxHoles" className="block text-sm font-medium text-gray-700 mb-2">
                Trous maximum
              </label>
              <select
                id="maxHoles"
                value={currentMaxHoles}
                onChange={(e) => updateURL('maxHoles', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                disabled={isPending}
              >
                <option value="">Aucun maximum</option>
                <option value="9">9 trous</option>
                <option value="18">18 trous</option>
                <option value="27">27 trous</option>
                <option value="36">36 trous</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Indicateur de chargement */}
      {isPending && (
        <div className="text-center py-2">
          <div className="inline-flex items-center text-sm text-gray-500">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2"></div>
            Mise à jour des filtres...
          </div>
        </div>
      )}
    </div>
  );
}