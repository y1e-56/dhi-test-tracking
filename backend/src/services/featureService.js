import { withTransaction } from '../config/database.js';
import { AppError } from '../middleware/errorHandler.js';
import bus from '../lib/eventBus.js';
import * as db from '../db/index.js';
import * as testCaseService from './testCaseService.js';
import { deleteAttachmentFile } from '../config/upload.js';
import { generateFeatureDocument } from './featureDocumentService.js';

export async function listFeatures(campaignId) {
  return db.features.findByCampaign(campaignId);
}

export async function listFeaturesPaginated(filters = {}) {
  return db.features.findByCampaignPaginated({
    campaignId: filters.campaignId,
    recherche: filters.recherche,
    statut: filters.statut,
    priorite: filters.priorite,
    assigneeId: filters.assigneeId,
    page: filters.page,
    limit: filters.limit,
    orderBy: filters.orderBy,
  });
}

export async function getFeature(id) {
  const feature = await db.features.findById(id);
  if (!feature) throw new AppError('Fonctionnalité non trouvée', 404);
  return feature;
}

export async function createFeature(data) {
  const existing = await db.features.findByName(data.campaign_id, data.name);
  if (existing) throw new AppError('Une fonctionnalité avec ce nom existe déjà dans cette campagne', 409);

  const result = await withTransaction(async (client) => {
    const feature = await db.features.create(data, client);
    const generatedTestCases = await testCaseService.generateForFeature(feature, client);
    bus.emit('feature:created', { feature, generatedTestCases });
    return { feature, generatedTestCases };
  });

  // Génère automatiquement le document PDF des cas de test au moment de l'assignation
  try {
    await generateFeatureDocument(result.feature.id);
  } catch (e) {
    console.error('Erreur génération document cas de test:', e);
  }

  return result;
}

export async function updateFeature(id, data) {
  try {
    if (data.name !== undefined) {
      const current = await db.features.findById(id);
      if (!current) throw new AppError('Fonctionnalité non trouvée', 404);
      const existing = await db.features.findByName(current.campaign_id, data.name, id);
      if (existing) throw new AppError('Une fonctionnalité avec ce nom existe déjà dans cette campagne', 409);
    }
    const feature = await db.features.update(id, data);
    if (!feature) throw new AppError('Fonctionnalité non trouvée', 404);
    bus.emit('feature:updated', { feature });
    return feature;
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError(error.message, 400);
  }
}

export async function deleteFeature(id) {
  const feature = await db.features.findById(id);
  if (!feature) throw new AppError('Fonctionnalité non trouvée', 404);
  const result = await db.features.remove(id);
  if (!result) throw new AppError('Fonctionnalité non trouvée', 404);
  if (feature.attachment_path) deleteAttachmentFile(feature.attachment_path);
  bus.emit('feature:deleted', { feature_id: id });
}

export async function setFeatureAttachment(id, data) {
  const feature = await db.features.findById(id);
  if (!feature) throw new AppError('Fonctionnalité non trouvée', 404);
  if (feature.attachment_path) deleteAttachmentFile(feature.attachment_path);
  const updated = await db.features.setAttachment(id, data);
  bus.emit('feature:updated', { feature: updated });
  return updated;
}

export async function clearFeatureAttachment(id) {
  const feature = await db.features.findById(id);
  if (!feature) throw new AppError('Fonctionnalité non trouvée', 404);
  if (feature.attachment_path) deleteAttachmentFile(feature.attachment_path);
  const updated = await db.features.clearAttachment(id);
  bus.emit('feature:updated', { feature: updated });
  return updated;
}

export async function getFeatureAnomalies(featureId) {
  return db.features.getAnomalies(featureId);
}

export async function updateFeatureStatus(id, status) {
  return withTransaction(async (client) => {
    const feature = await db.features.updateStatus(id, status, client);
    if (!feature) throw new AppError('Fonctionnalité non trouvée', 404);

    if (status === 'conforme') {
      await db.features.validateAnomaliesByFeature(id, client);
    }

    return feature;
  }).then(async (feature) => {
    if (status === 'conforme') {
      try {
        const campaign = await db.campaigns.findById(feature.campaign_id);
        if (campaign && campaign.test_leads && campaign.test_leads.length > 0) {
          for (const leadId of campaign.test_leads) {
            bus.emit('feature:conforme', { feature, campaign_name: campaign.name, test_lead_id: leadId });
          }
        }
      } catch (e) {
        console.error('Erreur notification feature:conforme', e);
      }
    }

    bus.emit('feature:status_changed', { feature, user_id: null, new_status: status });

    return feature;
  });
}
