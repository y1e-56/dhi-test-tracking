import { Anomalie, Campagne, Projet, TestCase, HistoriqueAction, HistoryFilters } from '../types';
import api from './api';
import { mapHistoriqueFromBackend } from '../utils/mappers';

export interface DashboardKPI {
  label: string;
  valeur: number | string;
  unite?: string;
  tendance?: 'up' | 'down' | 'stable';
  color?: string;
  icon?: string;
}

export interface GraphiqueDonnee {
  label: string;
  valeur: number;
  couleur?: string;
}

export interface ActiviteRecente {
  id: string;
  type: string;
  titre: string;
  date: string;
  userId: string;
}

export const dashboardService = {
  async getPersonalDashboard(): Promise<any> {
    const response = await api.get('/dashboard/personal');
    return response.data;
  },

  async getProjectDashboard(projectId: string): Promise<any> {
    const response = await api.get(`/dashboard/projects/${projectId}`);
    return response.data;
  },

  async getCampaignDashboard(campaignId: string): Promise<any> {
    const response = await api.get(`/dashboard/campaigns/${campaignId}`);
    return response.data;
  },

  async getCampaignReport(campaignId: string): Promise<any> {
    const response = await api.get(`/dashboard/campaigns/${campaignId}/report`);
    return response.data;
  },

  async getHistory(filters?: { user_id?: string; campaign_id?: string }): Promise<HistoriqueAction[]> {
    const params = new URLSearchParams();
    if (filters?.user_id) params.append('user_id', filters.user_id);
    if (filters?.campaign_id) params.append('campaign_id', filters.campaign_id);
    const qs = params.toString() ? `?${params.toString()}` : '';
    const response = await api.get(`/dashboard/history${qs}`);
    const result = response.data;
    if (Array.isArray(result)) return result.map(mapHistoriqueFromBackend);
    return result.data.map(mapHistoriqueFromBackend);
  },

  async getHistoryPaginated(filters: HistoryFilters = {}): Promise<{ data: HistoriqueAction[]; pagination: { page: number; limit: number; total: number; totalPages: number } }> {
    const params = new URLSearchParams();
    if (filters.page) params.append('page', String(filters.page));
    if (filters.limit) params.append('limit', String(filters.limit));
    if (filters.typeAction) params.append('typeAction', filters.typeAction);
    if (filters.typeEntite) params.append('typeEntite', filters.typeEntite);
    if (filters.recherche) params.append('recherche', filters.recherche);
    if (filters.dateDebut) params.append('dateDebut', filters.dateDebut);
    if (filters.dateFin) params.append('dateFin', filters.dateFin);
    const qs = params.toString();
    const response = await api.get(`/dashboard/history${qs ? `?${qs}` : ''}`);
    return { data: response.data.data.map(mapHistoriqueFromBackend), pagination: response.data.pagination };
  },

  calculerKPIs(anomalies: Anomalie[], campagnes: Campagne[], projets: Projet[], testCases: TestCase[]): DashboardKPI[] {
    const totalAnomalies = anomalies.length;
    const anomaliesOuvertes = anomalies.filter((a) => !['cloturee', 'validee'].includes(a.statut)).length;
    const anomaliesCritiques = anomalies.filter((a) => a.priorite === 'critique' && !['cloturee', 'validee'].includes(a.statut)).length;
    const anomaliesResolues = anomalies.filter((a) => ['cloturee', 'validee'].includes(a.statut)).length;
    const tauxResolution = totalAnomalies > 0 ? Math.round((anomaliesResolues / totalAnomalies) * 100) : 100;
    const totalCampagnes = campagnes.length;
    const campagnesTerminees = campagnes.filter((c) => c.statut === 'terminee').length;
    const totalProjets = projets.length;
    const totalTC = testCases.length;

    return [
      { label: 'Projets actifs', valeur: totalProjets, color: 'text-blue-600', icon: 'folder' },
      { label: 'Campagnes', valeur: `${campagnesTerminees}/${totalCampagnes}`, color: 'text-indigo-600', icon: 'clipboard' },
      { label: 'Cas de test', valeur: totalTC, color: 'text-violet-600', icon: 'test' },
      { label: 'Anomalies ouvertes', valeur: anomaliesOuvertes, color: 'text-orange-600', icon: 'bug' },
      { label: 'Anomalies critiques', valeur: anomaliesCritiques, color: 'text-red-600', icon: 'alert' },
      { label: "Taux de résolution", valeur: `${tauxResolution}%`, color: 'text-emerald-600', icon: 'check', tendance: tauxResolution >= 80 ? 'up' : 'down' },
    ];
  },

  graphiqueStatutsAnomalies(anomalies: Anomalie[]): GraphiqueDonnee[] {
    const count = new Map<string, number>();
    anomalies.forEach((a) => count.set(a.statut, (count.get(a.statut) || 0) + 1));
    const colors: Record<string, string> = { nouvelle: '#ef4444', en_cours: '#6366f1', resolution_signalee: '#10b981', validee: '#059669', cloturee: '#6b7280' };
    return Array.from(count.entries()).map(([label, valeur]) => ({ label, valeur, couleur: colors[label] || '#94a3b8' }));
  },

  graphiquePriorites(anomalies: Anomalie[]): GraphiqueDonnee[] {
    const count = new Map<string, number>();
    anomalies.forEach((a) => count.set(a.priorite, (count.get(a.priorite) || 0) + 1));
    const colors: Record<string, string> = { critique: '#dc2626', haute: '#ea580c', moyenne: '#ca8a04', basse: '#6b7280' };
    return Array.from(count.entries()).map(([label, valeur]) => ({ label, valeur, couleur: colors[label] || '#94a3b8' }));
  },
};
