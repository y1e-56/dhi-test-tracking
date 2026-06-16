import { createContext, useContext, useState, ReactNode } from 'react';
import { HistoriqueAction } from '../types';

interface HistoriqueContextType {
  historiqueActions: HistoriqueAction[];
  ajouterHistorique: (action: HistoriqueAction) => void;
}

const HistoriqueContext = createContext<HistoriqueContextType | undefined>(undefined);

export function HistoriqueProvider({ children }: { children: ReactNode }) {
  const [historiqueActions, setHistoriqueActions] = useState<HistoriqueAction[]>([]);

  const ajouterHistorique = (action: HistoriqueAction) => {
    setHistoriqueActions(prev => [action, ...prev]);
  };

  return (
    <HistoriqueContext.Provider value={{ historiqueActions, ajouterHistorique }}>
      {children}
    </HistoriqueContext.Provider>
  );
}

export function useHistorique() {
  const context = useContext(HistoriqueContext);
  if (!context) throw new Error('useHistorique must be used within a HistoriqueProvider');
  return context;
}
