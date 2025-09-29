import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { Toast, ToastType } from '@/components/atoms/Toast';

interface ToastConfig {
  message: string;
  type: ToastType;
  duration?: number;
}

interface ToastContextType {
  show: (message: string, type?: ToastType, duration?: number) => void;
  success: (message: string, duration?: number) => void;
  error: (message: string, duration?: number) => void;
  info: (message: string, duration?: number) => void;
  warning: (message: string, duration?: number) => void;
  hide: () => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [visible, setVisible] = useState(false);
  const [currentToast, setCurrentToast] = useState<ToastConfig | null>(null);
  const queueRef = useRef<ToastConfig[]>([]);
  const isShowingRef = useRef(false);

  const showNext = useCallback(() => {
    if (queueRef.current.length > 0 && !isShowingRef.current) {
      const nextToast = queueRef.current.shift();
      if (nextToast) {
        isShowingRef.current = true;
        setCurrentToast(nextToast);
        setVisible(true);
      }
    }
  }, []);

  const show = useCallback(
    (message: string, type: ToastType = 'info', duration: number = 3000) => {
      const toast: ToastConfig = { message, type, duration };

      if (isShowingRef.current) {
        // Ajouter à la queue si un toast est déjà affiché
        queueRef.current.push(toast);
      } else {
        // Afficher immédiatement
        isShowingRef.current = true;
        setCurrentToast(toast);
        setVisible(true);
      }
    },
    []
  );

  const success = useCallback(
    (message: string, duration?: number) => {
      show(message, 'success', duration);
    },
    [show]
  );

  const error = useCallback(
    (message: string, duration?: number) => {
      show(message, 'error', duration);
    },
    [show]
  );

  const info = useCallback(
    (message: string, duration?: number) => {
      show(message, 'info', duration);
    },
    [show]
  );

  const warning = useCallback(
    (message: string, duration?: number) => {
      show(message, 'warning', duration);
    },
    [show]
  );

  const hide = useCallback(() => {
    setVisible(false);
    isShowingRef.current = false;

    // Petit délai avant d'afficher le prochain pour éviter les chevauchements
    setTimeout(() => {
      showNext();
    }, 300);
  }, [showNext]);

  return (
    <ToastContext.Provider value={{ show, success, error, info, warning, hide }}>
      {children}
      {currentToast && (
        <Toast
          visible={visible}
          message={currentToast.message}
          type={currentToast.type}
          duration={currentToast.duration}
          onDismiss={hide}
        />
      )}
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

// Instance globale pour être utilisée par UniversalToast
let globalToast: ToastContextType | null = null;

export const setGlobalToast = (toast: ToastContextType) => {
  globalToast = toast;
};

export const getGlobalToast = () => globalToast;