import { AppError } from '../middleware/errorHandler.js';
import { assertCanRecordVerdict } from './separationGuard.js';
import bus from '../lib/eventBus.js';
import * as db from '../db/index.js';

export async function listExecutionsPaginated(filters = {}) {
  if (!filters.campaignId) throw new AppError('campaignId requis', 400);
  return db.testExecutions.findByCampaign(filters.campaignId, filters);
}

export async function listByTestCase(testCaseId) {
  return db.testExecutions.findByTestCase(testCaseId);
}

export async function getExecution(id) {
  const exec = await db.testExecutions.findById(id);
  if (!exec) throw new AppError('Exécution non trouvée', 404);
  return exec;
}

export async function createExecution(data) {
  if (!data.test_case_id) throw new AppError('test_case_id requis', 400);
  if (!data.campaign_id) throw new AppError('campaign_id requis', 400);

  const testCase = await db.testCases.findById(data.test_case_id);
  if (!testCase) throw new AppError('Cas de test non trouvé', 404);

  const campaign = await db.campaigns.findById(data.campaign_id);
  if (!campaign) throw new AppError('Campagne non trouvée', 404);

  const exec = await db.testExecutions.create(data);
  bus.emit('test_execution:created', exec);
  return exec;
}

export async function updateExecution(id, data, userId = null) {
  const existing = await db.testExecutions.findById(id);
  if (!existing) throw new AppError('Exécution non trouvée', 404);

  // Séparation des responsabilités : le verdict d'une exécution déjà
  // renseignée ne peut être modifié ou confirmé que par un autre membre que
  // celui qui l'a exécutée (un revolver de verdict doit se prononcer).
  assertCanRecordVerdict({
    executedBy: existing.executed_by,
    actorId: userId,
    currentResult: existing.result,
  });

  const updated = await db.testExecutions.update(id, data);
  if (!updated) throw new AppError('Exécution non trouvée', 404);
  bus.emit('test_execution:updated', updated);
  return updated;
}

export async function deleteExecution(id) {
  const deleted = await db.testExecutions.remove(id);
  if (!deleted) throw new AppError('Exécution non trouvée', 404);
  return deleted;
}

export async function getExecutionStats(campaignId) {
  return db.testExecutions.stats(campaignId);
}
