import { createContext, useContext, useState, ReactNode, useCallback, Dispatch, SetStateAction } from 'react';
import { toast } from 'sonner';
import { Projet } from '../types';
import { projectService } from '../services/projectService';
import { getErrorMessage } from '../services/api';

interface ProjetContextType {
  projets: Projet[];
  setProjets: Dispatch<SetStateAction<Projet[]>>;
  refreshProjets: () => Promise<void>;
  ajouterProjet: (projet: Projet) => Promise<void>;
  modifierProjet: (id: string, projet: Partial<Projet>) => Promise<void>;
  archiverProjet: (id: string) => Promise<void>;
  supprimerProjet: (id: string) => Promise<void>;
}

const ProjetContext = createContext<ProjetContextType | undefined>(undefined);

export function ProjetProvider({ children }: { children: ReactNode }) {
  const [projets, setProjets] = useState<Projet[]>([]);

  const refreshProjets = useCallback(async () => {
    try {
      const data = await projectService.getAll();
      setProjets(data);
    } catch (e) {
      toast.error('Erreur refreshProjets : ' + getErrorMessage(e as any));
    }
  }, []);

  const ajouterProjet = async (projet: Projet) => {
    try {
      await projectService.create(projet);
      await refreshProjets();
      toast.success('Projet créé avec succès');
    } catch (e) {
      toast.error(getErrorMessage(e as any));
    }
  };

  const modifierProjet = async (id: string, projetPartiel: Partial<Projet>) => {
    try {
      await projectService.update(id, projetPartiel);
      await refreshProjets();
      toast.success('Projet modifié avec succès');
    } catch (e) {
      toast.error(getErrorMessage(e as any));
    }
  };

  const archiverProjet = async (id: string) => {
    try {
      await projectService.archive(id);
      await refreshProjets();
      toast.success('Projet archivé avec succès');
    } catch (e) {
      toast.error(getErrorMessage(e as any));
    }
  };

  const supprimerProjet = async (id: string) => {
    try {
      await projectService.delete(id);
      await refreshProjets();
      toast.success('Projet supprimé avec succès');
    } catch (e) {
      toast.error(getErrorMessage(e as any));
    }
  };

  return (
    <ProjetContext.Provider value={{ projets, setProjets, refreshProjets, ajouterProjet, modifierProjet, archiverProjet, supprimerProjet }}>
      {children}
    </ProjetContext.Provider>
  );
}

export function useProjets() {
  const context = useContext(ProjetContext);
  if (!context) throw new Error('useProjets must be used within a ProjetProvider');
  return context;
}
