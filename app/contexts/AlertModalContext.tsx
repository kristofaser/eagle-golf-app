import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { AlertModal, AlertModalButton } from '@/components/atoms/AlertModal';

export interface AlertOptions {
  cancelable?: boolean;
  onDismiss?: () => void;
  type?: 'info' | 'success' | 'error' | 'warning';
}

interface AlertModalContextType {
  show: (
    title: string,
    message?: string,
    buttons?: AlertModalButton[],
    options?: AlertOptions
  ) => Promise<void>;
  hide: () => void;
}

const AlertModalContext = createContext<AlertModalContextType | undefined>(undefined);

export const AlertModalProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [visible, setVisible] = useState(false);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState<string | undefined>();
  const [buttons, setButtons] = useState<AlertModalButton[]>([]);
  const [options, setOptions] = useState<AlertOptions>({});
  const resolveRef = useRef<(() => void) | null>(null);

  const show = useCallback(
    (
      newTitle: string,
      newMessage?: string,
      newButtons?: AlertModalButton[],
      newOptions?: AlertOptions
    ): Promise<void> => {
      return new Promise((resolve) => {
        // Store the resolve function to call it when modal is dismissed
        resolveRef.current = resolve;

        // Wrap button callbacks to resolve the promise
        const wrappedButtons = (newButtons || [{ text: 'OK', style: 'default' }]).map((button) => ({
          ...button,
          onPress: async () => {
            // Call original onPress if it exists
            if (button.onPress) {
              await button.onPress();
            }
            // Hide modal and resolve promise
            hide();
            resolve();
          },
        }));

        setTitle(newTitle);
        setMessage(newMessage);
        setButtons(wrappedButtons);
        setOptions(newOptions || {});
        setVisible(true);
      });
    },
    []
  );

  const hide = useCallback(() => {
    setVisible(false);
    // Resolve the promise if it exists
    if (resolveRef.current) {
      resolveRef.current();
      resolveRef.current = null;
    }
  }, []);

  const handleDismiss = useCallback(() => {
    hide();
    if (options.onDismiss) {
      options.onDismiss();
    }
  }, [hide, options]);

  return (
    <AlertModalContext.Provider value={{ show, hide }}>
      {children}
      <AlertModal
        visible={visible}
        title={title}
        message={message}
        buttons={buttons}
        onDismiss={handleDismiss}
        cancelable={options.cancelable}
        type={options.type}
      />
    </AlertModalContext.Provider>
  );
};

export const useAlertModal = () => {
  const context = useContext(AlertModalContext);
  if (context === undefined) {
    throw new Error('useAlertModal must be used within an AlertModalProvider');
  }
  return context;
};

// Instance globale pour être utilisée par UniversalAlert
let globalAlertModal: AlertModalContextType | null = null;

export const setGlobalAlertModal = (alertModal: AlertModalContextType) => {
  globalAlertModal = alertModal;
};

export const getGlobalAlertModal = () => globalAlertModal;