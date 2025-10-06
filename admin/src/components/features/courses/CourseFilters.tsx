'use client';

import { useState, useEffect, useRef } from 'react';
import { Search, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface CourseFiltersProps {
  search: string;
  onSearchChange: (search: string) => void;
  isLoading: boolean;
}

export default function CourseFilters({ search, onSearchChange, isLoading }: CourseFiltersProps) {
  const [localSearch, setLocalSearch] = useState(search);
  const inputRef = useRef<HTMLInputElement>(null);
  const wasLoadingRef = useRef(false);

  // Synchroniser avec la prop search externe
  useEffect(() => {
    setLocalSearch(search);
  }, [search]);

  // Maintenir le focus après le chargement
  useEffect(() => {
    if (wasLoadingRef.current && !isLoading && inputRef.current) {
      // Restaurer le focus après le chargement
      inputRef.current.focus();
      // Remettre le curseur à la fin
      const length = inputRef.current.value.length;
      inputRef.current.setSelectionRange(length, length);
    }
    wasLoadingRef.current = isLoading;
  }, [isLoading]);

  // Debouncing de la recherche en temps réel
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      onSearchChange(localSearch);
    }, 300); // 300ms de délai

    return () => clearTimeout(timeoutId);
  }, [localSearch, onSearchChange]);

  const handleReset = () => {
    setLocalSearch('');
    onSearchChange('');
    // Maintenir le focus après reset
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }, 0);
  };

  return (
    <div className="space-y-4">
      {/* Barre de recherche */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Rechercher un parcours (nom, ville, département)..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            disabled={isLoading}
          />
          {isLoading && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
            </div>
          )}
        </div>

        {search && (
          <Button
            type="button"
            variant="secondary"
            onClick={handleReset}
            disabled={isLoading}
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Réinitialiser
          </Button>
        )}
      </div>
    </div>
  );
}