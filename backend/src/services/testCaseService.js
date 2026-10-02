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

/**
 * `assigned_to` est une référence users(id). Sans cette vérification, une clé
 * étrangère invalide remonte une erreur PostgreSQL brute en 500 ; on la traduit
 * en 400/404 pour que le message soit actionnable côté interface.
 * `null` est accepté : c'est le retrait explicite de l'affectation.
 */
async function assertTesterExists(assignedTo) {
  if (assignedTo === undefined || assignedTo === null) return;
  if (!Number.isInteger(assignedTo) || assignedTo <= 0) {
    throw new AppError('Identifiant de testeur invalide', 400);
  }
  const user = await db.users.findById(assignedTo);
  if (!user) throw new AppError('Testeur introuvable', 404);
  // La désactivation d'un compte est un soft delete via `date_suppression`.
  if (user.date_suppression) {
    throw new AppError('Ce compte est désactivé et ne peut pas être affecté', 400);
  }
}

export async function createTestCase(data) {
  const feature = await db.testCases.getCampaignIdByFeature(data.feature_id);
  if (!feature) throw new AppError('Fonctionnalité non trouvée', 404);

  const existing = await db.testCases.findByName(data.feature_id, data.name);
  if (existing) throw new AppError('Un cas de test avec ce nom existe déjà pour cette fonctionnalité', 409);

  await assertTesterExists(data.assigned_to);

  const testCase = await db.testCases.create(data, feature.campaign_id);
  bus.emit('testCase:created', { testCase, feature_id: data.feature_id });
  if (testCase?.assigned_to) {
    bus.emit('testCase:assigned', {
      test_case_id: testCase.id,
      test_name: testCase.name,
      campaign_id: testCase.campaign_id ?? feature.campaign_id,
      assigned_to: testCase.assigned_to,
      reassigned: false,
    });
  }
  return testCase;
}

export async function deleteTestCase(id) {
  const testCase = await db.testCases.findById(id);
  if (!testCase) throw new AppError('Cas de test non trouvé', 404);
  await db.testCases.remove(id);
  bus.emit('testCase:deleted', { test_case_id: id, feature_id: testCase.feature_id });
  return testCase;
}

export async function updateTestCase(id, data) {
  const testCase = await db.testCases.findById(id);
  if (!testCase) throw new AppError('Cas de test non trouvé', 404);

  if (data.name !== undefined) {
    const existing = await db.testCases.findByName(testCase.feature_id, data.name, id);
    if (existing) throw new AppError('Un cas de test avec ce nom existe déjà pour cette fonctionnalité', 409);
  }

  const featureId = data.feature_id ?? testCase.feature_id;
  if (data.feature_id !== undefined && data.feature_id !== testCase.feature_id) {
    const feature = await db.testCases.getCampaignIdByFeature(data.feature_id);
    if (!feature) throw new AppError('Fonctionnalité non trouvée', 404);
  }

  await assertTesterExists(data.assigned_to);

  const updated = await db.testCases.update(id, { ...data, feature_id: featureId });
  if (!updated) throw new AppError('Cas de test non trouvé', 404);
  bus.emit('testCase:updated', { testCase: updated, feature_id: featureId });

  // Seul un changement réel de testeur déclenche une notification : ré-enregistrer
  // le formulaire sans toucher `assigned_to` ne doit pas renvoyer de mail.
  const previousTester = testCase.assigned_to ?? null;
  const nextTester = updated.assigned_to ?? null;
  if (nextTester && nextTester !== previousTester) {
    bus.emit('testCase:assigned', {
      test_case_id: updated.id,
      test_name: updated.name,
      campaign_id: updated.campaign_id ?? null,
      assigned_to: nextTester,
      reassigned: previousTester !== null,
    });
  }
  return updated;
}
