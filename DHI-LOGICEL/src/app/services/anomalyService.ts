import api from './api';
import { mapAnomalieFromBackend, mapAnomalieToBackend, mapNotificationFromBackend } from '../utils/mappers';
import { Anomalie, Notification, AnomalieFilters } from '../types';

export const anomalyService = {
  async list(filters: AnomalieFilters = {}): Promise<{ data: Anomalie[]; pagination: { page: number; limit: number; total: number; totalPages: number } }> {
    const params = new URLSearchParams();
    if (filters.page) params.append('page', String(filters.page));
    if (filters.limit) params.append('limit', String(filters.limit));
    if (filters.campagneId) params.append('campagneId', filters.campagneId);
    if (filters.fonctionnaliteId) params.append('fonctionnaliteId', filters.fonctionnaliteId);
    if (filters.statut) params.append('statut', filters.statut);
    if (filters.projetId) params.append('projetId', filters.projetId);
    if (filters.testeurId) params.append('testeurId', filters.testeurId);
    if (filters.developpeurId) params.append('developpeurId', filters.developpeurId);
    if (filters.recherche) params.append('recherche', filters.recherche);
    if (filters.dateDebut) params.append('dateDebut', filters.dateDebut);
    if (filters.dateFin) params.append('dateFin', filters.dateFin);
    const qs = params.toString();
    const response = await api.get(`/anomalies${qs ? `?${qs}` : ''}`);
    return { data: response.data.data.map(mapAnomalieFromBackend), pagination: response.data.pagination };
  },

  async getStats(): Promise<{ total: number; byStatus: Record<string, number> }> {
    const response = await api.get('/anomalies/stats');
    return response.data;
  },

  async create(anomalie: Partial<Anomalie>): Promise<Anomalie> {
    const payload = mapAnomalieToBackend(anomalie);
    const response = await api.post('/anomalies', payload);
    return mapAnomalieFromBackend(response.data.anomaly);
  },

  async getById(id: string): Promise<Anomalie> {
    const response = await api.get(`/anomalies/${id}`);
    return mapAnomalieFromBackend(response.data);
  },

  async getByCampaign(campaignId: string): Promise<Anomalie[]> {
    const response = await api.get(`/anomalies/campaigns/${campaignId}`);
    return response.data.map(mapAnomalieFromBackend);
  },

  async getByTestCase(testCaseId: string): Promise<Anomalie[]> {
    const response = await api.get(`/test-cases/${testCaseId}/anomalies`);
    return response.data.map(mapAnomalieFromBackend);
  },

  async getMyAnomalies(): Promise<Anomalie[]> {
    const response = await api.get('/anomalies/my-anomalies');
    return response.data.map(mapAnomalieFromBackend);
  },

  async getReported(): Promise<Anomalie[]> {
    const response = await api.get('/anomalies/reported');
    return response.data.map(mapAnomalieFromBackend);
  },

  async signalResolution(id: string, resolution_description: string): Promise<Anomalie> {
    const response = await api.patch(`/anomalies/${id}/signal-resolution`, {
      resolution_description,
    });
    return mapAnomalieFromBackend(response.data.anomaly);
  },

  async validate(id: string): Promise<Anomalie> {
    const response = await api.patch(`/anomalies/${id}/validate`);
    return mapAnomalieFromBackend(response.data.anomaly);
  },

  async reject(id: string, reason?: string): Promise<Anomalie> {
    const response = await api.patch(`/anomalies/${id}/reject`, { reason });
    return mapAnomalieFromBackend(response.data.anomaly);
  },

  // ===== Notifications =====
  async getNotifications(): Promise<Notification[]> {
    const response = await api.get('/anomalies/notifications/my');
    return response.data.map(mapNotificationFromBackend);
  },

  async markNotificationRead(id: string): Promise<void> {
    await api.patch(`/anomalies/notifications/${id}/read`);
  },

  async markAllNotificationsRead(): Promise<void> {
    await api.patch('/anomalies/notifications/mark-all-read');
  },
};
