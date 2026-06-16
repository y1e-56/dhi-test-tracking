import { withTransaction } from '../config/database.js';
import { AppError } from '../middleware/errorHandler.js';
import bus from '../lib/eventBus.js';
import * as db from '../db/index.js';

export async function listFeatures(campaignId) {
  return db.features.findByCampaign(campaignId);
}

export async function getFeature(id) {
  const feature = await db.features.findById(id);
  if (!feature) throw new AppError('Fonctionnalité non trouvée', 404);
  return feature;
}

export async function createFeature(data) {
  const feature = await db.features.create(data);
  bus.emit('feature:created', { feature });
  return feature;
}

export async function updateFeature(id, data) {
  try {
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
  const result = await db.features.remove(id);
  if (!result) throw new AppError('Fonctionnalité non trouvée', 404);
  bus.emit('feature:deleted', { feature_id: id });
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
