import api from './api';
import { mapProjetFromBackend, mapProjetToBackend } from '../utils/mappers';
import { Projet } from '../types';

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
      console.log('[projectService] GET /projects');
      const response = await api.get('/projects?includeArchived=true');
      console.log('[projectService] Projets chargés:', response.data);
      return response.data.map(mapProjetFromBackend);
    } catch (e) {
      console.error('[projectService] Erreur getAll:', e);
      throw e;
    }
  },

  async getById(id: string): Promise<Projet> {
    try {
      console.log('[projectService] GET /projects/' + id);
      const response = await api.get(`/projects/${id}`);
      console.log('[projectService] Projet chargé:', response.data);
      return mapProjetFromBackend(response.data);
    } catch (e) {
      console.error('[projectService] Erreur getById:', e);
      throw e;
    }
  },

  async create(projet: Partial<Projet>): Promise<Projet> {
    try {
      const payload = mapProjetToBackend(projet);
      console.log('[projectService] POST /projects avec payload:', payload);
      const response = await api.post('/projects', payload);
      console.log('[projectService] Projet créé:', response.data);
      return mapProjetFromBackend(response.data.project);
    } catch (e) {
      console.error('[projectService] Erreur create:', e);
      throw e;
    }
  },

  async update(id: string, projet: Partial<Projet>): Promise<Projet> {
    try {
      const payload = mapProjetToBackend(projet);
      console.log('[projectService] PUT /projects/' + id + ' avec payload:', payload);
      const response = await api.put(`/projects/${id}`, payload);
      console.log('[projectService] Projet modifié:', response.data);
      return mapProjetFromBackend(response.data.project);
    } catch (e) {
      console.error('[projectService] Erreur update:', e);
      throw e;
    }
  },

  async archive(id: string): Promise<Projet> {
    try {
      console.log('[projectService] PATCH /projects/' + id + '/archive');
      const response = await api.patch(`/projects/${id}/archive`);
      console.log('[projectService] Projet archivé:', response.data);
      return mapProjetFromBackend(response.data.project);
    } catch (e) {
      console.error('[projectService] Erreur archive:', e);
      throw e;
    }
  },

  async delete(id: string): Promise<void> {
    try {
      console.log('[projectService] DELETE /projects/' + id);
      await api.delete(`/projects/${id}`);
      console.log('[projectService] Projet supprimé');
    } catch (e) {
      console.error('[projectService] Erreur delete:', e);
      throw e;
    }
  },
};
