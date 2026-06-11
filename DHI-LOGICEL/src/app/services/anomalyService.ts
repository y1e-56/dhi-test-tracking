import api from './api';
import { mapAnomalieFromBackend, mapAnomalieToBackend, mapNotificationFromBackend } from '../utils/mappers';
import { Anomalie, Notification } from '../types';

export const anomalyService = {
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
