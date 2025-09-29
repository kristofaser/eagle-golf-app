import { Alert, Platform } from 'react-native';
import { getGlobalAlertModal } from '@/contexts/AlertModalContext';

/**
 * Types pour l'utilitaire d'alerte cross-platform
 */
export interface AlertButton {
  text?: string;
  onPress?: () => void | Promise<void>;
  style?: 'default' | 'cancel' | 'destructive';
  isPreferred?: boolean;
}

export interface AlertOptions {
  cancelable?: boolean;
  onDismiss?: () => void;
  type?: 'info' | 'success' | 'error' | 'warning';
  forceNative?: boolean; // Force l'utilisation de window.confirm sur web (utile pour les modals imbriquées)
}

/**
 * Utilitaire d'alerte cross-platform
 * Sur mobile : utilise Alert.alert natif
 * Sur web : utilise notre belle modal React ou fallback sur window.confirm
 */
class CrossPlatformAlert {
  /**
   * Affiche une alerte avec un message simple
   */
  show(title: string, message?: string, buttons?: AlertButton[], options?: AlertOptions): void {
    if (Platform.OS === 'web') {
      this.showWebAlert(title, message, buttons, options);
    } else {
      // Sur mobile, utilise l'Alert natif
      Alert.alert(title, message, buttons, options);
    }
  }

  /**
   * Affiche une alerte de confirmation (raccourci pour Oui/Non)
   */
  async confirm(
    title: string,
    message?: string,
    confirmText: string = 'Confirmer',
    cancelText: string = 'Annuler'
  ): Promise<boolean> {
    return new Promise((resolve) => {
      this.show(
        title,
        message,
        [
          {
            text: cancelText,
            style: 'cancel',
            onPress: () => resolve(false),
          },
          {
            text: confirmText,
            style: 'destructive',
            onPress: () => resolve(true),
          },
        ],
        { cancelable: true }
      );
    });
  }

  /**
   * Affiche une alerte d'erreur
   */
  error(title: string = 'Erreur', message: string, buttonText: string = 'OK'): void {
    const options: AlertOptions = { type: 'error' };
    this.show(title, message, [{ text: buttonText, style: 'default' }], options);
  }

  /**
   * Affiche une alerte de succès
   */
  success(title: string = 'Succès', message: string, buttonText: string = 'OK'): void {
    const options: AlertOptions = { type: 'success' };
    this.show(title, message, [{ text: buttonText, style: 'default' }], options);
  }

  /**
   * Affiche une alerte d'information
   */
  info(title: string = 'Information', message: string, buttonText: string = 'OK'): void {
    const options: AlertOptions = { type: 'info' };
    this.show(title, message, [{ text: buttonText, style: 'default' }], options);
  }

  /**
   * Implémentation web de l'alerte
   */
  private async showWebAlert(
    title: string,
    message?: string,
    buttons?: AlertButton[],
    options?: AlertOptions
  ): Promise<void> {
    // Si forceNative est activé, utiliser directement window.confirm
    // Utile pour éviter les problèmes de modals imbriquées sur web
    if (options?.forceNative) {
      this.showWindowAlert(title, message, buttons, options);
      return;
    }

    // Essayer d'utiliser notre belle modal React si elle est disponible
    const alertModal = getGlobalAlertModal();

    if (alertModal) {
      // Utiliser notre modal React personnalisée
      try {
        await alertModal.show(title, message, buttons, options);
        return;
      } catch (error) {
        console.warn('Failed to use React modal, falling back to window methods:', error);
      }
    }

    // Fallback sur les méthodes window si la modal n'est pas disponible
    this.showWindowAlert(title, message, buttons, options);
  }

  /**
   * Fallback avec les méthodes window natives
   */
  private showWindowAlert(
    title: string,
    message?: string,
    buttons?: AlertButton[],
    options?: AlertOptions
  ): void {
    // Construction du message complet
    const fullMessage = message ? `${title}\n\n${message}` : title;

    // Si pas de boutons ou un seul bouton "OK", utilise window.alert
    if (!buttons || buttons.length === 0 || (buttons.length === 1 && buttons[0].text?.toLowerCase() === 'ok')) {
      window.alert(fullMessage);
      if (buttons?.[0]?.onPress) {
        buttons[0].onPress();
      }
      return;
    }

    // Si deux boutons avec un style "cancel" et un autre, utilise window.confirm
    if (buttons.length === 2) {
      const cancelButton = buttons.find((b) => b.style === 'cancel');
      const confirmButton = buttons.find((b) => b.style !== 'cancel');

      if (cancelButton && confirmButton) {
        // Utilise window.confirm pour une confirmation simple
        const confirmed = window.confirm(fullMessage);

        if (confirmed && confirmButton.onPress) {
          // Gère les promesses si nécessaire
          const result = confirmButton.onPress();
          if (result instanceof Promise) {
            result.catch(console.error);
          }
        } else if (!confirmed && cancelButton.onPress) {
          // Gère les promesses si nécessaire
          const result = cancelButton.onPress();
          if (result instanceof Promise) {
            result.catch(console.error);
          }
        }

        // Appelle onDismiss si l'utilisateur a annulé et que l'option est définie
        if (!confirmed && options?.onDismiss) {
          options.onDismiss();
        }
        return;
      }
    }

    // Pour des cas plus complexes avec plus de 2 boutons
    // Utilise une approche simplifiée avec window.confirm pour le moment

    // Crée une liste des options
    let optionsText = '\n\nOptions:\n';
    buttons.forEach((button, index) => {
      optionsText += `${index + 1}. ${button.text || 'Option ' + (index + 1)}\n`;
    });

    const fullMessageWithOptions = fullMessage + optionsText;

    // Pour le moment, utilise confirm pour tous les boutons multiples
    if (window.confirm(fullMessageWithOptions + '\nCliquez OK pour continuer ou Annuler pour fermer.')) {
      // Execute le premier bouton non-cancel par défaut
      const primaryButton = buttons.find(b => b.style !== 'cancel') || buttons[0];
      if (primaryButton?.onPress) {
        const result = primaryButton.onPress();
        if (result instanceof Promise) {
          result.catch(console.error);
        }
      }
    } else {
      // Execute le bouton cancel s'il existe
      const cancelButton = buttons.find(b => b.style === 'cancel');
      if (cancelButton?.onPress) {
        const result = cancelButton.onPress();
        if (result instanceof Promise) {
          result.catch(console.error);
        }
      }
      if (options?.onDismiss) {
        options.onDismiss();
      }
    }
  }
}

// Export une instance unique
export const UniversalAlert = new CrossPlatformAlert();

// Export par défaut pour faciliter l'import
export default UniversalAlert;