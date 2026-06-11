import { createContext, useContext, useState, ReactNode, useCallback, Dispatch, SetStateAction } from 'react';
import { toast } from 'sonner';
import { Fonctionnalite, StatutFonctionnalite } from '../types';
import { taskService } from '../services/taskService';
import { campaignService } from '../services/campaignService';
import api, { getErrorMessage } from '../services/api';
import { mapFonctionnaliteToBackend } from '../utils/mappers';

interface FonctionnaliteContextType {
  fonctionnalites: Fonctionnalite[];
  setFonctionnalites: Dispatch<SetStateAction<Fonctionnalite[]>>;
  refreshFonctionnalites: () => Promise<void>;
  ajouterFonctionnalite: (fonctionnalite: Fonctionnalite) => Promise<void>;
  modifierFonctionnalite: (id: string, fonctionnalite: Partial<Fonctionnalite>) => Promise<void>;
  changerStatutFonctionnalite: (id: string, statut: StatutFonctionnalite, testeurId: string) => Promise<void>;
}

const FonctionnaliteContext = createContext<FonctionnaliteContextType | undefined>(undefined);

export function FonctionnaliteProvider({ children }: { children: ReactNode }) {
  const [fonctionnalites, setFonctionnalites] = useState<Fonctionnalite[]>([]);

  const refreshFonctionnalites = useCallback(async () => {
    try {
      const allCampagnes = await campaignService.getAll();
      const results = await Promise.all(
        allCampagnes.map(c => taskService.getCampaignFeatures(c.id).catch(() => []))
      );
      setFonctionnalites(results.flat());
    } catch (e) {
      toast.error('Erreur refreshFonctionnalites : ' + getErrorMessage(e as any));
    }
  }, []);

  const ajouterFonctionnalite = async (fonctionnalite: Fonctionnalite) => {
    try {
      const created = await taskService.createFeature(fonctionnalite);
      let createdWithAssign = created;

      if (fonctionnalite.testeurAssigneId) {
        const assignment = await taskService.assignTask(created.id, fonctionnalite.testeurAssigneId);
        const assignmentId = assignment?.id || assignment?.assignment?.id;
        createdWithAssign = { ...created, testeurAssigneId: fonctionnalite.testeurAssigneId, assignmentId };
      }

      if (fonctionnalite.developpeurAssigneId) {
        createdWithAssign = { ...createdWithAssign, developpeurAssigneId: fonctionnalite.developpeurAssigneId };
      }

      setFonctionnalites(prev => [...prev, createdWithAssign]);
      toast.success('Fonctionnalité ajoutée avec succès');
    } catch (e) {
      toast.error(getErrorMessage(e as any));
    }
  };

  const modifierFonctionnalite = async (id: string, fonctionnalitePartielle: Partial<Fonctionnalite>) => {
    try {
      const existing = fonctionnalites.find(f => f.id === id);

      if (existing?.statut === 'conforme' && (fonctionnalitePartielle.testeurAssigneId !== undefined || fonctionnalitePartielle.developpeurAssigneId !== undefined)) {
        toast.error('Impossible de modifier l\'assignation d\'une fonctionnalité déjà marquée conforme');
        return;
      }

      if (fonctionnalitePartielle.testeurAssigneId !== undefined) {
        const userId = fonctionnalitePartielle.testeurAssigneId;
        if (userId) {
          if (existing?.assignmentId) {
            await taskService.reassignTask(existing.assignmentId, userId);
          } else {
            await taskService.assignTask(id, userId);
          }
        } else if (existing?.assignmentId) {
          await taskService.deleteAssignment(existing.assignmentId);
        }
      }

      const featurePayload = mapFonctionnaliteToBackend(fonctionnalitePartielle);
      const allowedKeys = ['name', 'description', 'priority', 'status'];
      const filtered: Record<string, unknown> = {};
      for (const key of allowedKeys) {
        if (featurePayload[key as keyof typeof featurePayload] !== undefined) {
          filtered[key] = featurePayload[key as keyof typeof featurePayload];
        }
      }

      if (Object.keys(filtered).length > 0) {
        const response = await api.put(`/features/${id}`, filtered);
        const updatedFeature = (response.data as any).feature || response.data;
        setFonctionnalites(prev => prev.map(f => {
          if (f.id !== id) return f;
          const merged = { ...f, ...updatedFeature } as Fonctionnalite;
          if (!merged.testeurAssigneId && f.testeurAssigneId) merged.testeurAssigneId = f.testeurAssigneId;
          if (!merged.assignmentId && f.assignmentId) merged.assignmentId = f.assignmentId;
          return merged;
        }));
      }
      toast.success('Fonctionnalité modifiée avec succès');
    } catch (e) {
      toast.error(getErrorMessage(e as any));
    }
  };

  const changerStatutFonctionnalite = async (id: string, statut: StatutFonctionnalite, testeurId: string) => {
    try {
      const backendStatut = statut === 'conforme' ? 'conforme' : statut === 'anomalie' ? 'anomaly_detected' : 'pending';
      const updated = await taskService.updateFeatureStatus(id, backendStatut as 'conforme' | 'anomaly_detected');
      setFonctionnalites(prev => prev.map(f => {
        if (f.id !== id) return f;
        const merged = { ...f, ...updated } as Fonctionnalite;
        if (!merged.testeurAssigneId && f.testeurAssigneId) merged.testeurAssigneId = f.testeurAssigneId;
        return merged;
      }));
    } catch (e) {
      toast.error(getErrorMessage(e as any));
    }
  };

  return (
    <FonctionnaliteContext.Provider value={{ fonctionnalites, setFonctionnalites, refreshFonctionnalites, ajouterFonctionnalite, modifierFonctionnalite, changerStatutFonctionnalite }}>
      {children}
    </FonctionnaliteContext.Provider>
  );
}

export function useFonctionnalites() {
  const context = useContext(FonctionnaliteContext);
  if (!context) throw new Error('useFonctionnalites must be used within a FonctionnaliteProvider');
  return context;
}
