import React, { createContext, useContext, useState, ReactNode } from 'react';

type TabType = 'parties' | 'services';

interface ProProfileContextType {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
}

const ProProfileContext = createContext<ProProfileContextType | undefined>(undefined);

export function ProProfileProvider({ children }: { children: ReactNode }) {
  const [activeTab, setActiveTab] = useState<TabType>('parties');

  return (
    <ProProfileContext.Provider value={{ activeTab, setActiveTab }}>
      {children}
    </ProProfileContext.Provider>
  );
}

export function useProProfileTab() {
  const context = useContext(ProProfileContext);
  if (!context) {
    throw new Error('useProProfileTab must be used within ProProfileProvider');
  }
  return context;
}
