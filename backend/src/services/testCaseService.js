import { AppError } from '../middleware/errorHandler.js';
import bus from '../lib/eventBus.js';
import * as db from '../db/index.js';
import { generateTestCasesForFeature } from './testCaseTemplates.js';

export { generateTestCasesForFeature } from './testCaseTemplates.js';

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
  return testCase;
}

/**
 * Génère automatiquement des cas de test à partir des scénarios types
 * correspondant au module / au nom / à la description de la fonctionnalité.
 * @param {{ id: number, name: string, description?: string, module?: string, campaign_id?: number }} feature
 * @param {object} [client] - Client transactionnel optionnel
 * @returns {Promise<Array>} Les cas de test créés
 */
export async function generateForFeature(feature, client = null) {
  const cases = generateTestCasesForFeature({
    name: feature.name,
    description: feature.description,
    module: feature.module,
  });

  const campaignId = feature.campaign_id || (await db.testCases.getCampaignIdByFeature(feature.id, client))?.campaign_id;
  if (!campaignId) throw new AppError('Fonctionnalité non trouvée', 404);

  const created = [];
  for (const tc of cases) {
    const testCase = await db.testCases.create(
      { ...tc, feature_id: feature.id },
      campaignId,
      client
    );
    created.push(testCase);
  }

  if (created.length > 0) {
    bus.emit('testCase:generated', { feature_id: feature.id, count: created.length });
  }

  return created;
}
