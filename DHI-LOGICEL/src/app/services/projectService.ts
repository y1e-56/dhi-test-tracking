import api from './api';
import { mapProjetFromBackend, mapProjetToBackend } from '../utils/mappers';
import { Projet, Campagne, Fonctionnalite } from '../types';

export const projectService = {
  async listPaginated(filters: { page?: number; limit?: number; recherche?: string; statut?: string; chefTesteurId?: string } = {}): Promise<{ data: Projet[]; pagination: { page: number; limit: number; total: number; totalPages: number } }> {
    const params = new URLSearchParams();
    if (filters.page) params.append('page', String(filters.page));
    if (filters.limit) params.append('limit', String(filters.limit));
    if (filters.recherche) params.append('recherche', filters.recherche);
    if (filters.statut) params.append('statut', filters.statut);
    if (filters.chefTesteurId) params.append('chefTesteurId', filters.chefTesteurId);
    const qs = params.toString();
    const response = await api.get(`/projects${qs ? `?${qs}` : ''}`);
    const result = response.data;
    if (result.data) {
      return { data: result.data.map(mapProjetFromBackend), pagination: result.pagination };
    }
    return { data: result.map(mapProjetFromBackend), pagination: { page: 1, limit: result.length, total: result.length, totalPages: 1 } };
  },

  async getAll(): Promise<Projet[]> {
    try {
      const response = await api.get('/projects?includeArchived=true');
      return response.data.map(mapProjetFromBackend);
    } catch (e) {
      console.error('[projectService] Erreur getAll:', e);
      throw e;
    }
  },

  async getById(id: string): Promise<Projet> {
    try {
      const response = await api.get(`/projects/${id}`);
      return mapProjetFromBackend(response.data);
    } catch (e) {
      console.error('[projectService] Erreur getById:', e);
      throw e;
    }
  },

  async create(projet: Partial<Projet>): Promise<Projet> {
    try {
      const payload = mapProjetToBackend(projet);
      const response = await api.post('/projects', payload);
      return mapProjetFromBackend(response.data.project);
    } catch (e) {
      console.error('[projectService] Erreur create:', e);
      throw e;
    }
  },

  async update(id: string, projet: Partial<Projet>): Promise<Projet> {
    try {
      const payload = mapProjetToBackend(projet);
      const response = await api.put(`/projects/${id}`, payload);
      return mapProjetFromBackend(response.data.project);
    } catch (e) {
      console.error('[projectService] Erreur update:', e);
      throw e;
    }
  },

  async archive(id: string): Promise<Projet> {
    try {
      const response = await api.patch(`/projects/${id}/archive`);
      return mapProjetFromBackend(response.data.project);
    } catch (e) {
      console.error('[projectService] Erreur archive:', e);
      throw e;
    }
  },

  async unarchive(id: string): Promise<Projet> {
    try {
      const response = await api.patch(`/projects/${id}/unarchive`);
      return mapProjetFromBackend(response.data.project);
    } catch (e) {
      console.error('[projectService] Erreur unarchive:', e);
      throw e;
    }
  },

  async delete(id: string): Promise<void> {
    try {
      await api.delete(`/projects/${id}`);
    } catch (e) {
      console.error('[projectService] Erreur delete:', e);
      throw e;
    }
  },

  async getCampaigns(projetId: string): Promise<any[]> {
    try {
      const response = await api.get(`/projects/${projetId}/campaigns`);
      return response.data.map((c: any) => ({
        id: String(c.id),
        nom: c.name,
        projetId: String(c.project_id),
        description: c.objective || '',
        dateDebut: c.start_date || '',
        dateFin: c.end_date || '',
        statut: c.status === 'planning' ? 'en_preparation' : c.status === 'in_progress' ? 'en_cours' : c.status === 'completed' ? 'terminee' : 'archive',
        dateCreation: c.created_at,
        testLeadIds: c.test_leads?.map((l: any) => String(l.id)) ?? [],
        versionId: c.release_id ? String(c.release_id) : null,
        environnementId: c.environment_id ? String(c.environment_id) : null,
      }));
    } catch (e) {
      console.error('[projectService] Erreur getCampaigns:', e);
      throw e;
    }
  },

  async getCampaignStats(campagneId: string): Promise<{ totalFeatures: number; totalAnomalies: number; featuresByStatus: Record<string, number>; anomaliesByStatus: Record<string, number> }> {
    try {
      const response = await api.get(`/campaigns/${campagneId}/stats`);
      return response.data;
    } catch (e) {
      return { totalFeatures: 0, totalAnomalies: 0, featuresByStatus: {}, anomaliesByStatus: {} };
    }
  },

  async getFeaturesByCampaign(campagneId: string): Promise<Fonctionnalite[]> {
    try {
      const response = await api.get(`/tasks/campaigns/${campagneId}/features`);
      return response.data.map((f: any) => ({
        id: String(f.id),
        campagneId: String(f.campaign_id),
        nom: f.name,
        description: f.description || '',
        module: f.module || '',
        statut: f.status === 'conforme' ? 'conforme' : f.status === 'anomaly_detected' ? 'anomalie' : 'non_testee',
        priorite: f.priority === 'critical' ? 'critique' : f.priority === 'high' ? 'haute' : f.priority === 'low' ? 'basse' : 'moyenne',
        dateCreation: f.created_at,
      }));
    } catch (e) {
      return [];
    }
  },

  async getTeamMembers(campagneId: string): Promise<{ testeurs: any[]; developpeurs: any[] }> {
    try {
      const response = await api.get(`/teams/campaigns/${campagneId}/members`);
      return { testeurs: response.data.testeurs || [], developpeurs: response.data.developpeurs || [] };
    } catch (e) {
      return { testeurs: [], developpeurs: [] };
    }
  },
};
