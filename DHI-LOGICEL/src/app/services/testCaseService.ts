import api from './api';
import { TestCase } from '../types';
import { mapPriorityToBackend, mapPriorityToFrontend } from '../utils/mappers';

export const testCaseService = {
  async list(params?: { featureId?: string; campaignId?: string }): Promise<TestCase[]> {
    const query = new URLSearchParams();
    if (params?.featureId) query.set('featureId', params.featureId);
    if (params?.campaignId) query.set('campaignId', params.campaignId);
    const suffix = query.toString() ? `?${query.toString()}` : '';
    const res = await api.get(`/test-cases${suffix}`);
    return res.data.map((tc: any) => mapTestCaseFromBackend(tc));
  },

  async getById(id: string): Promise<TestCase> {
    const res = await api.get(`/test-cases/${id}`);
    return mapTestCaseFromBackend(res.data);
  },

  async create(testCase: Partial<TestCase>): Promise<TestCase> {
    const res = await api.post('/test-cases', {
      feature_id: testCase.featureId,
      name: testCase.nom,
      steps: testCase.steps,
      expected_result: testCase.expectedResult,
      priority: testCase.priority ? mapPriorityToBackend(testCase.priority) : 'medium',
    });
    return mapTestCaseFromBackend(res.data);
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/test-cases/${id}`);
  },
};

const mapTestCaseFromBackend = (tc: any): TestCase => ({
  id: String(tc.id),
  featureId: String(tc.feature_id),
  nom: tc.name,
  steps: tc.steps || '',
  expectedResult: tc.expected_result || '',
  status: tc.status,
  priority: mapPriorityToFrontend(tc.priority),
  dateCreation: tc.created_at,
});
