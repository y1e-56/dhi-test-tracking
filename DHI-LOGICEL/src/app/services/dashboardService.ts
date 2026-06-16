import api from './api';
import { mapHistoriqueFromBackend } from '../utils/mappers';
import { HistoriqueAction } from '../types';

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
    return response.data.map(mapHistoriqueFromBackend);
  },
};
