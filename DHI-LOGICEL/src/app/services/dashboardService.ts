import api from './api';
import { mapHistoriqueFromBackend } from '../utils/mappers';
import { HistoriqueAction, HistoryFilters } from '../types';

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
};
