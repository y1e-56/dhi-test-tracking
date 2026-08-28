import { createContext, useContext, useState, ReactNode, useCallback, Dispatch, SetStateAction } from 'react';
import { toast } from 'sonner';
import { Anomalie, StatutAnomalie } from '../types';
import { anomalyService } from '../services/anomalyService';
import { campaignService } from '../services/campaignService';
import { projectService } from '../services/projectService';
import api, { getErrorMessage } from '../services/api';
import { mapAnomalyStatusToBackend, mapAnomalieFromBackend } from '../utils/mappers';
import { useAuth } from './AuthContext';
import { demoDataService } from '../services/demoDataService';

interface AnomalieContextType {
  anomalies: Anomalie[];
  setAnomalies: Dispatch<SetStateAction<Anomalie[]>>;
  refreshAnomalies: () => Promise<void>;
  ajouterAnomalie: (anomalie: Anomalie) => Promise<void>;
  changerStatutAnomalie: (id: string, statut: StatutAnomalie, userId: string, commentaire?: string) => Promise<void>;
  signalerResolution: (id: string, developpeurId: string, commentaire: string) => Promise<void>;
  validerCloture: (id: string, testeurId: string) => Promise<void>;
}

const AnomalieContext = createContext<AnomalieContextType | undefined>(undefined);

export function AnomalieProvider({ children }: { children: ReactNode }) {
  const { currentUser } = useAuth();
  const [anomalies, setAnomalies] = useState<Anomalie[]>([]);

  const refreshAnomalies = useCallback(async () => {
    if (!currentUser) return;
    try {
      let data: Anomalie[] = [];
      if (currentUser.role === 'developpeur') {
        data = await anomalyService.getMyAnomalies();
      } else if (currentUser.role === 'testeur') {
        data = await anomalyService.getReported();
      } else if (currentUser.role === 'chef_testeur') {
        const [allCampagnes, allProjets] = await Promise.all([
          campaignService.getAll(),
          projectService.getAll()
        ]);
        const mesProjetsIds = allProjets
          .filter(p => p.chefTesteurIds.includes(currentUser.id))
          .map(p => p.id);
        const mesCampagnes = allCampagnes.filter(c =>
          c.chefTesteurIds.includes(currentUser.id) ||
          mesProjetsIds.includes(c.projetId)
        );
        const results = await Promise.all(
          mesCampagnes.map(c => anomalyService.getByCampaign(c.id).catch(() => []))
        );
        data = results.flat();
      } else {
        const allCampagnes = await campaignService.getAll();
        const results = await Promise.all(
          allCampagnes.map(c => anomalyService.getByCampaign(c.id).catch(() => []))
        );
        data = results.flat();
      }
      setAnomalies(data);
    } catch (e) {
      const demo = demoDataService.getAnomalies();
      if (demo.length > 0) {
        setAnomalies(demo);
      } else {
        toast.error('Erreur refreshAnomalies : ' + getErrorMessage(e as any));
      }
    }
  }, [currentUser]);

  const ajouterAnomalie = async (anomalie: Anomalie) => {
    try {
      const created = await anomalyService.create(anomalie);
      setAnomalies(prev => [...prev, created]);
      toast.success('Anomalie signalée avec succès');
    } catch (e) {
      const demo = demoDataService.getAnomalies();
      demo.push({ ...anomalie, id: anomalie.id || `id_demo_${Date.now()}` });
      demoDataService.setAnomalies(demo);
      setAnomalies(demo);
      toast.success('Anomalie signalée (mode démo)');
    }
  };

  const changerStatutAnomalie = async (id: string, statut: StatutAnomalie, userId: string, commentaire?: string) => {
    try {
      const backendStatus = mapAnomalyStatusToBackend(statut);
      const payload: Record<string, unknown> = { status: backendStatus };
      if (backendStatus === 'resolution_signaled' && commentaire) {
        payload.resolution_description = commentaire;
      }
      const response = await api.put(`/anomalies/${id}`, payload);
      const updated = mapAnomalieFromBackend(response.data.anomaly);
      setAnomalies(prev => prev.map(a => a.id === id ? updated : a));
    } catch (e) {
      const demo = demoDataService.getAnomalies().map(a => {
        if (a.id !== id) return a;
        const patch: Partial<Anomalie> = { statut };
        if (commentaire) patch.commentaireResolution = commentaire;
        return { ...a, ...patch };
      });
      demoDataService.setAnomalies(demo);
      setAnomalies(demo);
    }
  };

  const signalerResolution = async (id: string, developpeurId: string, commentaire: string) => {
    try {
      const updated = await anomalyService.signalResolution(id, commentaire);
      setAnomalies(prev => prev.map(a => a.id === id ? { ...a, ...updated } : a));
      toast.success('Résolution signalée avec succès');
    } catch (e) {
      const demo = demoDataService.getAnomalies().map(a => a.id === id ? { ...a, statut: 'resolution_signalee' as StatutAnomalie, commentaireResolution: commentaire, dateResolution: new Date().toISOString() } : a);
      demoDataService.setAnomalies(demo);
      setAnomalies(demo);
    }
  };

  const validerCloture = async (id: string, testeurId: string) => {
    try {
      const updated = await anomalyService.validate(id);
      setAnomalies(prev => prev.map(a => a.id === id ? { ...a, ...updated } : a));
      toast.success('Anomalie clôturée avec succès');
    } catch (e) {
      const demo = demoDataService.getAnomalies().map(a => a.id === id ? { ...a, statut: 'validee' as StatutAnomalie, dateValidation: new Date().toISOString() } : a);
      demoDataService.setAnomalies(demo);
      setAnomalies(demo);
    }
  };

  return (
    <AnomalieContext.Provider value={{ anomalies, setAnomalies, refreshAnomalies, ajouterAnomalie, changerStatutAnomalie, signalerResolution, validerCloture }}>
      {children}
    </AnomalieContext.Provider>
  );
}

export function useAnomalies() {
  const context = useContext(AnomalieContext);
  if (!context) throw new Error('useAnomalies must be used within an AnomalieProvider');
  return context;
}
