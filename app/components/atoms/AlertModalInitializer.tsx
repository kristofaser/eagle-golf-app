import { useEffect } from 'react';
import { useAlertModal, setGlobalAlertModal } from '@/contexts/AlertModalContext';

/**
 * Composant qui initialise la référence globale de l'alert modal
 * Doit être placé à l'intérieur du AlertModalProvider
 */
export const AlertModalInitializer: React.FC = () => {
  const alertModal = useAlertModal();

  useEffect(() => {
    // Définir la référence globale pour UniversalAlert
    setGlobalAlertModal(alertModal);

    // Nettoyer lors du démontage
    return () => {
      setGlobalAlertModal(null);
    };
  }, [alertModal]);

  return null;
};