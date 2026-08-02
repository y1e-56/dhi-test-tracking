import api from './api';
import { Fonctionnalite } from '../types';

export const featureService = {
  async listPaginated(filters: {
    page?: number;
    limit?: number;
    campagneId?: string;
    recherche?: string;
    statut?: string;
    assigneeId?: string;
  } = {}): Promise<{ data: Fonctionnalite[]; pagination: { page: number; limit: number; total: number; totalPages: number } }> {
    const params = new URLSearchParams();
    if (filters.page) params.append('page', String(filters.page));
    if (filters.limit) params.append('limit', String(filters.limit));
    if (filters.campagneId) params.append('campagneId', filters.campagneId);
    if (filters.recherche) params.append('recherche', filters.recherche);
    if (filters.statut) params.append('statut', filters.statut);
    if (filters.assigneeId) params.append('assigneeId', filters.assigneeId);
    const qs = params.toString();
    const response = await api.get(`/features${qs ? `?${qs}` : ''}`);
    const result = response.data;
    if (result.data) {
      return { data: result.data, pagination: result.pagination };
    }
    return { data: result, pagination: { page: 1, limit: result.length, total: result.length, totalPages: 1 } };
  },

  async uploadAttachment(featureId: string, file: File): Promise<void> {
    const formData = new FormData();
    formData.append('file', file);
    await api.post(`/features/${featureId}/attachment`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  async deleteAttachment(featureId: string): Promise<void> {
    await api.delete(`/features/${featureId}/attachment`);
  },

  async downloadAttachment(featureId: string): Promise<{ blob: Blob; name: string }> {
    const res = await api.get(`/features/${featureId}/attachment`, { responseType: 'blob' });
    const disposition = res.headers?.['content-disposition'] as string | undefined;
    let name = 'document';
    const match = disposition?.match(/filename\*?=(?:UTF-8'')?"?([^";]+)"?/i);
    if (match) name = decodeURIComponent(match[1]);
    return { blob: res.data as Blob, name };
  },
};
