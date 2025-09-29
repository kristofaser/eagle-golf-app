/**
 * ToastInitializer - Initialise le Toast Context pour l'API globale
 *
 * Ce composant doit être placé dans le layout principal pour permettre
 * à l'API UniversalToast de fonctionner correctement
 */

import { useEffect, useLayoutEffect } from 'react';
import { Platform } from 'react-native';
import { useToast, setGlobalToast } from '@/contexts/ToastContext';

export const ToastInitializer: React.FC = () => {
  const toast = useToast();

  // Sur web, utiliser useLayoutEffect pour initialiser de manière synchrone
  // Sur mobile, utiliser useEffect normal
  const useEffectHook = Platform.OS === 'web' ? useLayoutEffect : useEffect;

  useEffectHook(() => {
    // Enregistrer l'instance globale au montage
    setGlobalToast(toast);
    console.log('[ToastInitializer] Toast context initialized on platform:', Platform.OS);

    // Nettoyer au démontage
    return () => {
      console.log('[ToastInitializer] Toast context cleaned up on platform:', Platform.OS);
      setGlobalToast(null as any);
    };
  }, [toast]);

  return null; // Ce composant ne rend rien
};