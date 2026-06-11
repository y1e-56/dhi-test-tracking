import api from './api';
import { mapCampagneFromBackend, mapCampagneToBackend } from '../utils/mappers';
import { Campagne } from '../types';

export const campaignService = {
  async getAll(): Promise<Campagne[]> {
    try {
      console.log('[campaignService] GET /campaigns');
      const response = await api.get('/campaigns');
      console.log('[campaignService] Réponse campagnes:', response.data);
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
      console.log('[campaignService] POST /campaigns avec payload:', payload);
      const response = await api.post('/campaigns', payload);
      console.log('[campaignService] Réponse création:', response.data);
      return mapCampagneFromBackend(response.data.campaign);
    } catch (e) {
      console.error('[campaignService] Erreur create:', e);
      throw e;
    }
  },

  async update(id: string, campagne: Partial<Campagne>): Promise<Campagne> {
    try {
      const payload = mapCampagneToBackend(campagne);
      console.log('[campaignService] PUT /campaigns/' + id + ' avec payload:', payload);
      const response = await api.put(`/campaigns/${id}`, payload);
      console.log('[campaignService] Réponse modification:', response.data);
      return mapCampagneFromBackend(response.data.campaign);
    } catch (e) {
      console.error('[campaignService] Erreur update:', e);
      throw e;
    }
  },

  async delete(id: string): Promise<void> {
    try {
      console.log('[campaignService] DELETE /campaigns/' + id);
      await api.delete(`/campaigns/${id}`);
      console.log('[campaignService] Campagne supprimée');
    } catch (e) {
      console.error('[campaignService] Erreur delete:', e);
      throw e;
    }
  },
};
