import api from './api';
import { mapFonctionnaliteFromBackend, mapFonctionnaliteToBackend } from '../utils/mappers';
import { Fonctionnalite } from '../types';

export const taskService = {
  // ===== Fonctionnalités =====
  async createFeature(fonctionnalite: Partial<Fonctionnalite>): Promise<Fonctionnalite> {
    try {
      const payload = mapFonctionnaliteToBackend(fonctionnalite);
      const response = await api.post('/tasks/features', payload);
      return mapFonctionnaliteFromBackend(response.data.feature);
    } catch (e) {
      console.error('[taskService] Erreur createFeature:', e);
      throw e;
    }
  },

  async getCampaignFeatures(campaignId: string): Promise<Fonctionnalite[]> {
    try {
      const response = await api.get(`/tasks/campaigns/${campaignId}/features`);
      return response.data.map(mapFonctionnaliteFromBackend);
    } catch (e) {
      console.error('[taskService] Erreur getCampaignFeatures:', e);
      throw e;
    }
  },

  // ===== Assignations =====
  async assignTask(featureId: string, userId: string): Promise<any> {
    try {
      const response = await api.post('/tasks/assignments', {
        feature_id: parseInt(featureId),
        assigned_to: parseInt(userId),
      });
      return response.data;
    } catch (e) {
      console.error('[taskService] Erreur assignTask:', e);
      throw e;
    }
  },

  async reassignTask(assignmentId: string, newUserId: string): Promise<any> {
    try {
      const response = await api.patch(`/tasks/assignments/${assignmentId}/reassign`, {
        new_assigned_to: parseInt(newUserId),
      });
      return response.data;
    } catch (e) {
      console.error('[taskService] Erreur reassignTask:', e);
      throw e;
    }
  },

  async updateTaskStatus(assignmentId: string, status: 'pending' | 'in_progress' | 'completed'): Promise<any> {
    try {
      const response = await api.patch(`/tasks/assignments/${assignmentId}/status`, { status });
      return response.data;
    } catch (e) {
      console.error('[taskService] Erreur updateTaskStatus:', e);
      throw e;
    }
  },

  async getMyTasks(): Promise<any[]> {
    try {
      const response = await api.get('/tasks/my-tasks');
      return response.data;
    } catch (e) {
      console.error('[taskService] Erreur getMyTasks:', e);
      throw e;
    }
  },

  async getCampaignTasks(campaignId: string): Promise<any[]> {
    try {
      const response = await api.get(`/tasks/campaigns/${campaignId}/tasks`);
      return response.data;
    } catch (e) {
      console.error('[taskService] Erreur getCampaignTasks:', e);
      throw e;
    }
  },

  async deleteAssignment(assignmentId: string): Promise<void> {
    try {
      await api.delete(`/tasks/assignments/${assignmentId}`);
    } catch (e) {
      console.error('[taskService] Erreur deleteAssignment:', e);
      throw e;
    }
  },

  // ===== Statut fonctionnalité (RG-01) =====
  async updateFeatureStatus(featureId: string, status: 'conforme' | 'anomaly_detected'): Promise<Fonctionnalite> {
    try {
      const response = await api.patch(`/features/${featureId}/status`, { status });
      return mapFonctionnaliteFromBackend(response.data.feature);
    } catch (e) {
      console.error('[taskService] Erreur updateFeatureStatus:', e);
      throw e;
    }
  },
};
