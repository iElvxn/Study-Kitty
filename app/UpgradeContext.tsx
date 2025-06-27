import React, { createContext, ReactNode, useCallback, useContext, useState } from 'react';

interface UpgradeContextType {
  refreshTrigger: number;
  triggerRefresh: () => void;
}

const UpgradeContext = createContext<UpgradeContextType>({
  refreshTrigger: 0,
  triggerRefresh: () => {},
});

export function UpgradeProvider({ children }: { children: ReactNode }) {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const triggerRefresh = useCallback(() => {
    setRefreshTrigger(prev => prev + 1);
  }, []);

  return (
    <UpgradeContext.Provider value={{ refreshTrigger, triggerRefresh }}>
      {children}
    </UpgradeContext.Provider>
  );
}

export const useUpgrade = () => useContext(UpgradeContext); 