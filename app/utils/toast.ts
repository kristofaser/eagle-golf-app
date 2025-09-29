/**
 * UniversalToast - API publique pour afficher des toasts/snackbars
 *
 * Usage:
 *   import { toast } from '@/utils/toast';
 *   toast.success('Profil mis à jour !');
 *   toast.error('Une erreur est survenue');
 *   toast.info('Information importante');
 *   toast.warning('Attention !');
 */

import { getGlobalToast } from '@/contexts/ToastContext';
import { ToastType } from '@/components/atoms/Toast';

class UniversalToast {
  /**
   * Affiche un toast avec un type et une durée personnalisés
   */
  show(message: string, type: ToastType = 'info', duration: number = 3000): void {
    const toastContext = getGlobalToast();

    console.log('[Toast] show() called, context available:', !!toastContext, 'message:', message);

    if (toastContext) {
      console.log('[Toast] Using context to show toast');
      toastContext.show(message, type, duration);
    } else {
      // Fallback sur console si le context n'est pas initialisé
      console.warn('[Toast] Context not initialized, falling back to alert. Message:', message);

      // Sur web, utiliser une alerte simple en fallback
      if (typeof window !== 'undefined') {
        console.log('[Toast] Web platform detected, using window.alert');
        alert(message);
      }
    }
  }

  /**
   * Affiche un toast de succès (vert)
   */
  success(message: string, duration: number = 3000): void {
    this.show(message, 'success', duration);
  }

  /**
   * Affiche un toast d'erreur (rouge)
   */
  error(message: string, duration: number = 4000): void {
    this.show(message, 'error', duration);
  }

  /**
   * Affiche un toast d'information (bleu)
   */
  info(message: string, duration: number = 3000): void {
    this.show(message, 'info', duration);
  }

  /**
   * Affiche un toast d'avertissement (orange)
   */
  warning(message: string, duration: number = 3500): void {
    this.show(message, 'warning', duration);
  }

  /**
   * Cache le toast actuellement affiché
   */
  hide(): void {
    const toastContext = getGlobalToast();
    if (toastContext) {
      toastContext.hide();
    }
  }
}

// Export d'une instance singleton
export const toast = new UniversalToast();