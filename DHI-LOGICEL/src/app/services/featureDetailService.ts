import api from './api';
import { Exigence, Scenario, Dependence } from '../types';

const EXIGENCES_KEY = 'dhi_exigences';
const SCENARIOS_KEY = 'dhi_scenarios';
const DEPENDANCES_KEY = 'dhi_dependances';

function load<T>(key: string): T[] {
  try { return JSON.parse(localStorage.getItem(key) || '[]'); } catch { return []; }
}
function save<T>(key: string, data: T[]): void { localStorage.setItem(key, JSON.stringify(data)); }
function uid(): string { return `id_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`; }

export interface FeatureDetail {
  id: string;
  campaign_id: number;
  name: string;
  description: string;
  module: string;
  status: string;
  priority: string;
  created_at: string;
}

export interface TestCaseItem {
  id: string;
  name: string;
  description: string;
  type: string;
  expected_result: string;
  priority: string;
  status: string;
  assigned_to: number | null;
}

export interface AnomalyItem {
  id: string;
  ticket_id: string;
  title: string;
  description: string;
  severity: string;
  status: string;
  feature_id: string | null;
  campaign_id: string | null;
}

export const featureDetailService = {
  // ─── API BACKEND ───
  async getFeature(campaignId: string, featureId: string): Promise<FeatureDetail> {
    const res = await api.get(`/tasks/campaigns/${campaignId}/features/${featureId}`);
    return res.data;
  },

  async getTestCases(campaignId: string, featureId: string): Promise<TestCaseItem[]> {
    const res = await api.get(`/tasks/campaigns/${campaignId}/features/${featureId}/test-cases`);
    return res.data;
  },

  async getAnomalies(featureId: string): Promise<AnomalyItem[]> {
    const res = await api.get('/tasks/anomalies', { params: { featureId } });
    return res.data;
  },

  async createTestCase(campaignId: string, featureId: string, data: Record<string, any>): Promise<any> {
    const res = await api.post(`/tasks/campaigns/${campaignId}/features/${featureId}/test-cases`, data);
    return res.data;
  },

  async deleteTestCase(campaignId: string, featureId: string, tcId: string): Promise<void> {
    await api.delete(`/tasks/campaigns/${campaignId}/features/${featureId}/test-cases/${tcId}`);
  },

  async deleteFeature(campaignId: string, featureId: string): Promise<void> {
    await api.delete(`/tasks/campaigns/${campaignId}/features/${featureId}`);
  },

  // ─── EXIGENCES (localStorage) ───
  listExigences(fonctionnaliteId: string): Exigence[] {
    return load<Exigence>(EXIGENCES_KEY).filter((e) => e.fonctionnaliteId === fonctionnaliteId);
  },
  createExigence(data: Omit<Exigence, 'id' | 'dateCreation'>): Exigence {
    const all = load<Exigence>(EXIGENCES_KEY);
    const ex: Exigence = { ...data, id: uid(), dateCreation: new Date().toISOString() };
    all.push(ex); save(EXIGENCES_KEY, all); return ex;
  },
  updateExigence(id: string, data: Partial<Exigence>): void {
    const all = load<Exigence>(EXIGENCES_KEY);
    const idx = all.findIndex((e) => e.id === id);
    if (idx !== -1) { all[idx] = { ...all[idx], ...data }; save(EXIGENCES_KEY, all); }
  },
  deleteExigence(id: string): void {
    save(EXIGENCES_KEY, load<Exigence>(EXIGENCES_KEY).filter((e) => e.id !== id));
  },

  // ─── SCÉNARIOS (localStorage) ───
  listScenarios(fonctionnaliteId: string): Scenario[] {
    return load<Scenario>(SCENARIOS_KEY).filter((s) => s.fonctionnaliteId === fonctionnaliteId);
  },
  createScenario(data: Omit<Scenario, 'id' | 'dateCreation'>): Scenario {
    const all = load<Scenario>(SCENARIOS_KEY);
    const sc: Scenario = { ...data, id: uid(), dateCreation: new Date().toISOString() };
    all.push(sc); save(SCENARIOS_KEY, all); return sc;
  },
  updateScenario(id: string, data: Partial<Scenario>): void {
    const all = load<Scenario>(SCENARIOS_KEY);
    const idx = all.findIndex((s) => s.id === id);
    if (idx !== -1) { all[idx] = { ...all[idx], ...data }; save(SCENARIOS_KEY, all); }
  },
  deleteScenario(id: string): void {
    save(SCENARIOS_KEY, load<Scenario>(SCENARIOS_KEY).filter((s) => s.id !== id));
  },

  // ─── DÉPENDANCES (localStorage) ───
  listDependances(fonctionnaliteId: string): Dependence[] {
    return load<Dependence>(DEPENDANCES_KEY).filter(() => true);
  },
  createDependence(data: Omit<Dependence, 'id' | 'dateCreation'>): Dependence {
    const all = load<Dependence>(DEPENDANCES_KEY);
    const dep: Dependence = { ...data, id: uid(), dateCreation: new Date().toISOString() };
    all.push(dep); save(DEPENDANCES_KEY, all); return dep;
  },
  deleteDependence(id: string): void {
    save(DEPENDANCES_KEY, load<Dependence>(DEPENDANCES_KEY).filter((d) => d.id !== id));
  },
};
