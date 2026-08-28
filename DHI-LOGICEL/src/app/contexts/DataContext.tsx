import { createContext, useContext, ReactNode, useEffect, useCallback, useState } from 'react';
import { toast } from 'sonner';
import { Projet, Campagne, Fonctionnalite, Anomalie, Notification, HistoriqueAction, StatutFonctionnalite, StatutAnomalie, User, TestCase, Produit } from '../types';
import { useAuth } from './AuthContext';
import { useSocket } from './SocketProvider';
import { useProjets } from './ProjetContext';
import { useCampagnes } from './CampagneContext';
import { useFonctionnalites } from './FonctionnaliteContext';
import { useAnomalies } from './AnomalieContext';
import { useNotifications } from './NotificationContext';
import { useHistorique } from './HistoriqueContext';
import { mapCampagneFromBackend, mapNotificationFromBackend } from '../utils/mappers';
import { userService } from '../services/userService';
import { demoDataService } from '../services/demoDataService';
import { testCaseService } from '../services/testCaseService';
import { productService } from '../services/productService';

interface DataContextType {
  projets: Projet[];
  campagnes: Campagne[];
  fonctionnalites: Fonctionnalite[];
  anomalies: Anomalie[];
  notifications: Notification[];
  historiqueActions: HistoriqueAction[];
  users: User[];
  testCases: TestCase[];
  produits: Produit[];
  ajouterProjet: (projet: Projet) => Promise<void>;
  modifierProjet: (id: string, projet: Partial<Projet>) => Promise<void>;
  archiverProjet: (id: string) => Promise<void>;
  restaurerProjet: (id: string) => Promise<void>;
  supprimerProjet: (id: string) => Promise<void>;
  ajouterCampagne: (campagne: Campagne) => Promise<void>;
  modifierCampagne: (id: string, campagne: Partial<Campagne>) => Promise<void>;
  ajouterFonctionnalite: (fonctionnalite: Fonctionnalite) => Promise<void>;
  modifierFonctionnalite: (id: string, fonctionnalite: Partial<Fonctionnalite>) => Promise<void>;
  changerStatutFonctionnalite: (id: string, statut: StatutFonctionnalite, testeurId: string) => Promise<void>;
  ajouterAnomalie: (anomalie: Anomalie) => Promise<void>;
  changerStatutAnomalie: (id: string, statut: StatutAnomalie, userId: string, commentaire?: string) => Promise<void>;
  signalerResolution: (id: string, developpeurId: string, commentaire: string) => Promise<void>;
  validerCloture: (id: string, testeurId: string) => Promise<void>;
  ajouterNotification: (notification: Notification) => void;
  marquerNotificationLue: (id: string) => Promise<void>;
  getNotificationsNonLues: (userId: string) => number;
  ajouterHistorique: (action: HistoriqueAction) => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: ReactNode }) {
  const { currentUser } = useAuth();
  const { socket } = useSocket();
  const [dataLoaded, setDataLoaded] = useState(false);

  const {
    projets, setProjets, refreshProjets,
    ajouterProjet, modifierProjet, archiverProjet, restaurerProjet, supprimerProjet
  } = useProjets();

  const {
    campagnes, setCampagnes, refreshCampagnes,
    ajouterCampagne, modifierCampagne
  } = useCampagnes();

  const {
    fonctionnalites, setFonctionnalites, refreshFonctionnalites,
    ajouterFonctionnalite, modifierFonctionnalite, changerStatutFonctionnalite
  } = useFonctionnalites();

  const {
    anomalies, setAnomalies, refreshAnomalies,
    ajouterAnomalie, changerStatutAnomalie, signalerResolution, validerCloture
  } = useAnomalies();

  const {
    notifications, setNotifications, refreshNotifications,
    ajouterNotification, marquerNotificationLue, getNotificationsNonLues
  } = useNotifications();

  const { historiqueActions, ajouterHistorique } = useHistorique();

  const [users, setUsers] = useState<User[]>([]);
  const [testCases, setTestCases] = useState<TestCase[]>([]);
  const [produits, setProduits] = useState<Produit[]>([]);
  const refreshUsers = useCallback(async () => {
    try {
      setUsers(await userService.getAll());
    } catch {
      setUsers([]);
    }
  }, []);

  const refreshTestCases = useCallback(async () => {
    try {
      const data = await testCaseService.list();
      if (data && data.length > 0) {
        setTestCases(data);
      } else {
        setTestCases(demoDataService.getTestCases());
      }
    } catch {
      setTestCases(demoDataService.getTestCases());
    }
  }, []);

  const refreshProduits = useCallback(async () => {
    try {
      const { data } = await productService.listPaginated();
      if (data && data.length > 0) {
        setProduits(data);
      } else {
        setProduits(JSON.parse(localStorage.getItem('dhi_demo_produits') || '[]'));
      }
    } catch {
      setProduits(JSON.parse(localStorage.getItem('dhi_demo_produits') || '[]'));
    }
  }, []);

  const refreshAll = useCallback(async () => {
    await Promise.all([
      refreshProjets(),
      refreshCampagnes(),
      refreshFonctionnalites(),
      refreshAnomalies(),
      refreshNotifications(),
      refreshUsers(),
      refreshTestCases(),
      refreshProduits()
    ]);
  }, [refreshProjets, refreshCampagnes, refreshFonctionnalites, refreshAnomalies, refreshNotifications, refreshUsers, refreshTestCases, refreshProduits]);

  useEffect(() => {
    if (currentUser && !dataLoaded) {
      demoDataService.seedTout();
      refreshAll();
      setDataLoaded(true);
    }
  }, [currentUser, dataLoaded]);

  useEffect(() => {
    if (!socket || !currentUser) return;

    const handleCampaignCreated = (campaign: any) => {
      const mapped = mapCampagneFromBackend(campaign);
      setCampagnes(prev => {
        if (prev.some(c => c.id === mapped.id)) return prev;
        return [...prev, mapped];
      });
    };

    const handleCampaignUpdated = (campaign: any) => {
      const mapped = mapCampagneFromBackend(campaign);
      setCampagnes(prev => prev.map(c => c.id === mapped.id ? mapped : c));
    };

    const handleCampaignDeleted = (data: { id: string }) => {
      setCampagnes(prev => prev.filter(c => c.id !== data.id));
    };

    const handleNotification = (notification: any) => {
      const mapped = mapNotificationFromBackend(notification);
      setNotifications(prev => {
        if (prev.some(n => n.id === mapped.id)) return prev;
        return [mapped, ...prev];
      });
    };

    const handleDataChanged = (data: { entity: string }) => {
      switch (data.entity) {
        case 'projects': refreshProjets(); break;
        case 'campaigns': refreshCampagnes(); break;
        case 'notifications': refreshNotifications(); break;
        case 'features': refreshFonctionnalites(); refreshNotifications(); break;
        case 'anomalies': refreshAnomalies(); refreshNotifications(); break;
      }
    };

    const handleReconnect = () => {
      socket.off('campaign-created', handleCampaignCreated);
      socket.on('campaign-created', handleCampaignCreated);
      socket.off('campaign-updated', handleCampaignUpdated);
      socket.on('campaign-updated', handleCampaignUpdated);
      socket.off('campaign-deleted', handleCampaignDeleted);
      socket.on('campaign-deleted', handleCampaignDeleted);
      socket.off('notification', handleNotification);
      socket.on('notification', handleNotification);
      socket.off('data-changed', handleDataChanged);
      socket.on('data-changed', handleDataChanged);
      refreshAll();
    };

    socket.off('campaign-created', handleCampaignCreated);
    socket.on('campaign-created', handleCampaignCreated);
    socket.off('campaign-updated', handleCampaignUpdated);
    socket.on('campaign-updated', handleCampaignUpdated);
    socket.off('campaign-deleted', handleCampaignDeleted);
    socket.on('campaign-deleted', handleCampaignDeleted);
    socket.off('notification', handleNotification);
    socket.on('notification', handleNotification);
    socket.off('data-changed', handleDataChanged);
    socket.on('data-changed', handleDataChanged);
    socket.on('connect', handleReconnect);

    return () => {
      socket.off('campaign-created', handleCampaignCreated);
      socket.off('campaign-updated', handleCampaignUpdated);
      socket.off('campaign-deleted', handleCampaignDeleted);
      socket.off('notification', handleNotification);
      socket.off('data-changed', handleDataChanged);
      socket.off('connect', handleReconnect);
    };
  }, [socket, currentUser]);

  const value: DataContextType = {
    projets, campagnes, fonctionnalites, anomalies, notifications, historiqueActions,
    users, testCases, produits,
    ajouterProjet, modifierProjet, archiverProjet, restaurerProjet, supprimerProjet,
    ajouterCampagne, modifierCampagne,
    ajouterFonctionnalite, modifierFonctionnalite, changerStatutFonctionnalite,
    ajouterAnomalie, changerStatutAnomalie, signalerResolution, validerCloture,
    ajouterNotification, marquerNotificationLue, getNotificationsNonLues,
    ajouterHistorique
  };

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}


