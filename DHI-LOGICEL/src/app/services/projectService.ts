import api from './api';
import { mapProjetFromBackend, mapProjetToBackend } from '../utils/mappers';
import { Projet } from '../types';

export const projectService = {
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
