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
};
