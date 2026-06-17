import { AppError } from '../middleware/errorHandler.js';
import bus from '../lib/eventBus.js';
import * as db from '../db/index.js';

export async function listTestCases(featureId, campaignId) {
  return db.testCases.list(featureId, campaignId);
}

export async function getTestCase(id) {
  const testCase = await db.testCases.findById(id);
  if (!testCase) throw new AppError('Cas de test non trouvé', 404);
  return testCase;
}

export async function createTestCase(data) {
  const feature = await db.testCases.getCampaignIdByFeature(data.feature_id);
  if (!feature) throw new AppError('Fonctionnalité non trouvée', 404);
  const testCase = await db.testCases.create(data, feature.campaign_id);
  bus.emit('testCase:created', { testCase, feature_id: data.feature_id });
  return testCase;
}

export async function deleteTestCase(id) {
  const testCase = await db.testCases.findById(id);
  if (!testCase) throw new AppError('Cas de test non trouvé', 404);
  await db.testCases.remove(id);
  bus.emit('testCase:deleted', { test_case_id: id, feature_id: testCase.feature_id });
}
