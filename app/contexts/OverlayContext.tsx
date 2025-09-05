import React, { createContext, useContext, useState, ReactNode } from 'react';

interface OverlayContextType {
  isOverlayOpen: boolean;
  setIsOverlayOpen: (isOpen: boolean) => void;
}

const OverlayContext = createContext<OverlayContextType | undefined>(undefined);

export const OverlayProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isOverlayOpen, setIsOverlayOpen] = useState(false);

  return (
    <OverlayContext.Provider value={{ isOverlayOpen, setIsOverlayOpen }}>
      {children}
    </OverlayContext.Provider>
  );
};

export const useOverlay = () => {
  const context = useContext(OverlayContext);
  if (!context) {
    throw new Error('useOverlay must be used within an OverlayProvider');
  }
  return context;
};
