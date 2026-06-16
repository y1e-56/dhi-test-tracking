import api from './api';
import { mapFonctionnaliteFromBackend, mapFonctionnaliteToBackend } from '../utils/mappers';
import { Fonctionnalite } from '../types';

export const taskService = {
  // ===== Fonctionnalités =====
  async createFeature(fonctionnalite: Partial<Fonctionnalite>): Promise<Fonctionnalite> {
    try {
      const payload = mapFonctionnaliteToBackend(fonctionnalite);
      console.log('[taskService] POST /tasks/features avec payload:', payload);
      const response = await api.post('/tasks/features', payload);
      console.log('[taskService] Fonctionnalité créée:', response.data);
      return mapFonctionnaliteFromBackend(response.data.feature);
    } catch (e) {
      console.error('[taskService] Erreur createFeature:', e);
      throw e;
    }
  },

  async getCampaignFeatures(campaignId: string): Promise<Fonctionnalite[]> {
    try {
      console.log('[taskService] GET /tasks/campaigns/' + campaignId + '/features');
      const response = await api.get(`/tasks/campaigns/${campaignId}/features`);
      console.log('[taskService] Fonctionnalités chargées:', response.data);
      return response.data.map(mapFonctionnaliteFromBackend);
    } catch (e) {
      console.error('[taskService] Erreur getCampaignFeatures:', e);
      throw e;
    }
  },

  // ===== Assignations =====
  async assignTask(featureId: string, userId: string): Promise<any> {
    try {
      console.log('[taskService] POST /tasks/assignments', { feature_id: featureId, assigned_to: userId });
      const response = await api.post('/tasks/assignments', {
        feature_id: parseInt(featureId),
        assigned_to: parseInt(userId),
      });
      console.log('[taskService] Assignation créée:', response.data);
      return response.data;
    } catch (e) {
      console.error('[taskService] Erreur assignTask:', e);
      throw e;
    }
  },

  async reassignTask(assignmentId: string, newUserId: string): Promise<any> {
    try {
      console.log('[taskService] PATCH /tasks/assignments/' + assignmentId + '/reassign', { new_assigned_to: newUserId });
      const response = await api.patch(`/tasks/assignments/${assignmentId}/reassign`, {
        new_assigned_to: parseInt(newUserId),
      });
      console.log('[taskService] Assignation modifiée:', response.data);
      return response.data;
    } catch (e) {
      console.error('[taskService] Erreur reassignTask:', e);
      throw e;
    }
  },

  async updateTaskStatus(assignmentId: string, status: 'pending' | 'in_progress' | 'completed'): Promise<any> {
    try {
      console.log('[taskService] PATCH /tasks/assignments/' + assignmentId + '/status', { status });
      const response = await api.patch(`/tasks/assignments/${assignmentId}/status`, { status });
      console.log('[taskService] Statut mis à jour:', response.data);
      return response.data;
    } catch (e) {
      console.error('[taskService] Erreur updateTaskStatus:', e);
      throw e;
    }
  },

  async getMyTasks(): Promise<any[]> {
    try {
      console.log('[taskService] GET /tasks/my-tasks');
      const response = await api.get('/tasks/my-tasks');
      console.log('[taskService] Mes tâches chargées:', response.data);
      return response.data;
    } catch (e) {
      console.error('[taskService] Erreur getMyTasks:', e);
      throw e;
    }
  },

  async getCampaignTasks(campaignId: string): Promise<any[]> {
    try {
      console.log('[taskService] GET /tasks/campaigns/' + campaignId + '/tasks');
      const response = await api.get(`/tasks/campaigns/${campaignId}/tasks`);
      console.log('[taskService] Tâches campagne chargées:', response.data);
      return response.data;
    } catch (e) {
      console.error('[taskService] Erreur getCampaignTasks:', e);
      throw e;
    }
  },

  async deleteAssignment(assignmentId: string): Promise<void> {
    try {
      console.log('[taskService] DELETE /tasks/assignments/' + assignmentId);
      await api.delete(`/tasks/assignments/${assignmentId}`);
      console.log('[taskService] Assignation supprimée');
    } catch (e) {
      console.error('[taskService] Erreur deleteAssignment:', e);
      throw e;
    }
  },

  // ===== Statut fonctionnalité (RG-01) =====
  async updateFeatureStatus(featureId: string, status: 'conforme' | 'anomaly_detected'): Promise<Fonctionnalite> {
    try {
      console.log('[taskService] PATCH /features/' + featureId + '/status', { status });
      const response = await api.patch(`/features/${featureId}/status`, { status });
      console.log('[taskService] Statut fonctionnalité mis à jour:', response.data);
      return mapFonctionnaliteFromBackend(response.data.feature);
    } catch (e) {
      console.error('[taskService] Erreur updateFeatureStatus:', e);
      throw e;
    }
  },
};
