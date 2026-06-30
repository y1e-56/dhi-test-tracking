import api from './api';
import { mapCampagneFromBackend, mapCampagneToBackend } from '../utils/mappers';
import { Campagne } from '../types';

export const campaignService = {
  async listPaginated(filters: { page?: number; limit?: number; projetId?: string; statut?: string; recherche?: string; chefTesteurId?: string } = {}): Promise<{ data: Campagne[]; pagination: { page: number; limit: number; total: number; totalPages: number } }> {
    const params = new URLSearchParams();
    if (filters.page) params.append('page', String(filters.page));
    if (filters.limit) params.append('limit', String(filters.limit));
    if (filters.projetId) params.append('project_id', filters.projetId);
    if (filters.statut) params.append('statut', filters.statut);
    if (filters.recherche) params.append('recherche', filters.recherche);
    if (filters.chefTesteurId) params.append('chefTesteurId', filters.chefTesteurId);
    const qs = params.toString();
    const response = await api.get(`/campaigns${qs ? `?${qs}` : ''}`);
    const result = response.data;
    if (result.data) {
      return { data: result.data.map(mapCampagneFromBackend), pagination: result.pagination };
    }
    return { data: result.map(mapCampagneFromBackend), pagination: { page: 1, limit: result.length, total: result.length, totalPages: 1 } };
  },

  async getAll(): Promise<Campagne[]> {
    try {
      const response = await api.get('/campaigns');
      return response.data.map(mapCampagneFromBackend);
    } catch (e) {
      console.error('[campaignService] Erreur getAll:', e);
      throw e;
    }
  },

  async getById(id: string): Promise<Campagne> {
    const response = await api.get(`/campaigns/${id}`);
    return mapCampagneFromBackend(response.data);
  },

  async getByProject(projectId: string): Promise<Campagne[]> {
    const response = await api.get(`/campaigns?project_id=${projectId}`);
    return response.data.map(mapCampagneFromBackend);
  },

  async getStatistics(id: string): Promise<any> {
    const response = await api.get(`/campaigns/${id}/statistics`);
    return response.data;
  },

  async create(campagne: Partial<Campagne>): Promise<Campagne> {
    try {
      const payload = mapCampagneToBackend(campagne);
      const response = await api.post('/campaigns', payload);
      return mapCampagneFromBackend(response.data.campaign);
    } catch (e) {
      console.error('[campaignService] Erreur create:', e);
      throw e;
    }
  },

  async update(id: string, campagne: Partial<Campagne>): Promise<Campagne> {
    try {
      const payload = mapCampagneToBackend(campagne);
      const response = await api.put(`/campaigns/${id}`, payload);
      return mapCampagneFromBackend(response.data.campaign);
    } catch (e) {
      console.error('[campaignService] Erreur update:', e);
      throw e;
    }
  },

  async delete(id: string): Promise<void> {
    try {
      await api.delete(`/campaigns/${id}`);
    } catch (e) {
      console.error('[campaignService] Erreur delete:', e);
      throw e;
    }
  },
};
