import { createContext, useContext, useState, ReactNode, useCallback, Dispatch, SetStateAction } from 'react';
import { toast } from 'sonner';
import { Campagne } from '../types';
import { campaignService } from '../services/campaignService';
import { getErrorMessage } from '../services/api';
import { demoDataService } from '../services/demoDataService';

interface CampagneContextType {
  campagnes: Campagne[];
  setCampagnes: Dispatch<SetStateAction<Campagne[]>>;
  refreshCampagnes: () => Promise<void>;
  ajouterCampagne: (campagne: Campagne) => Promise<void>;
  modifierCampagne: (id: string, campagne: Partial<Campagne>) => Promise<void>;
}

const CampagneContext = createContext<CampagneContextType | undefined>(undefined);

export function CampagneProvider({ children }: { children: ReactNode }) {
  const [campagnes, setCampagnes] = useState<Campagne[]>([]);

  const refreshCampagnes = useCallback(async () => {
    try {
      const data = await campaignService.getAll();
      if (data && data.length > 0) {
        setCampagnes(data);
        demoDataService.setCampagnes(data);
      } else {
        const demo = demoDataService.getCampagnes();
        if (demo.length > 0) setCampagnes(demo);
      }
    } catch (e) {
      const demo = demoDataService.getCampagnes();
      if (demo.length > 0) {
        setCampagnes(demo);
      } else {
        toast.error('Erreur refreshCampagnes : ' + getErrorMessage(e as any));
      }
    }
  }, []);

  const ajouterCampagne = async (campagne: Campagne) => {
    try {
      await campaignService.create(campagne);
      await refreshCampagnes();
      toast.success('Campagne créée avec succès');
    } catch (e) {
      if ((e as any)?.response?.status === 409) throw e;
      const demo = demoDataService.getCampagnes();
      demo.push(campagne);
      demoDataService.setCampagnes(demo);
      setCampagnes(demo);
      toast.success('Campagne créée (mode démo)');
    }
  };

  const modifierCampagne = async (id: string, campagnePartielle: Partial<Campagne>) => {
    try {
      await campaignService.update(id, campagnePartielle);
      await refreshCampagnes();
      toast.success('Campagne modifiée avec succès');
    } catch (e) {
      if ((e as any)?.response?.status === 409) throw e;
      const demo = demoDataService.getCampagnes().map(c => c.id === id ? { ...c, ...campagnePartielle } : c);
      demoDataService.setCampagnes(demo);
      setCampagnes(demo);
      toast.success('Campagne modifiée (mode démo)');
    }
  };

  return (
    <CampagneContext.Provider value={{ campagnes, setCampagnes, refreshCampagnes, ajouterCampagne, modifierCampagne }}>
      {children}
    </CampagneContext.Provider>
  );
}

export function useCampagnes() {
  const context = useContext(CampagneContext);
  if (!context) throw new Error('useCampagnes must be used within a CampagneProvider');
  return context;
}