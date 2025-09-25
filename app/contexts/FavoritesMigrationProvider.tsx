/**
 * Provider pour la migration automatique des favoris
 * S'intègre dans le système de providers de l'app
 */
import React from 'react';
import { useFavoritesMigration } from '@/hooks/useFavoritesMigration';

interface FavoritesMigrationProviderProps {
  children: React.ReactNode;
}

export function FavoritesMigrationProvider({ children }: FavoritesMigrationProviderProps) {
  // Le hook s'exécute automatiquement et gère la migration
  useFavoritesMigration();

  return <>{children}</>;
}
