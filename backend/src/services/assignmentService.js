import { AppError } from '../middleware/errorHandler.js';
import bus from '../lib/eventBus.js';
import * as db from '../db/index.js';

async function checkFeatureNotConforme(featureId) {
  const feature = await db.features.findById(featureId);
  if (!feature) throw new AppError('Fonctionnalité non trouvée', 404);
  if (feature.status === 'conforme') {
    throw new AppError('Impossible d\'assigner une fonctionnalité déjà marquée conforme', 400);
  }
}

export async function createAssignment(featureId, assignedTo, userId = null) {
  await checkFeatureNotConforme(featureId);

  const assignment = await db.assignments.create(featureId, assignedTo);

  const feature = await db.features.findById(featureId);
  const featureName = feature?.name || 'une fonctionnalité';
  let campaignName = '';
  if (feature?.campaign_id) {
    const campaign = await db.campaigns.findById(feature.campaign_id).catch(() => null);
    if (campaign) campaignName = campaign.name;
  }

  bus.emit('assignment:created', { assigned_to: assignedTo, feature_name: featureName, feature_id: featureId, campaign_name: campaignName, user_id: userId });

  return assignment;
}

export async function getAssignment(id) {
  const assignment = await db.assignments.findById(id);
  if (!assignment) throw new AppError('Assignation non trouvée', 404);
  return assignment;
}

export async function updateAssignment(id, data, userId = null) {
  const assignment = await getAssignment(id);
  if (data.assigned_to !== undefined) {
    await checkFeatureNotConforme(assignment.feature_id);
  }

  try {
    const updated = await db.assignments.update(id, data);
    if (!updated) throw new AppError('Assignation non trouvée', 404);

    if (data.assigned_to !== undefined) {
      const feature = await db.features.findById(assignment.feature_id);
      const featureName = feature?.name || 'une fonctionnalité';
      let campaignName = '';
      if (feature?.campaign_id) {
        const campaign = await db.campaigns.findById(feature.campaign_id).catch(() => null);
        if (campaign) campaignName = campaign.name;
      }

      bus.emit('assignment:reassigned', { assigned_to: data.assigned_to, feature_name: featureName, feature_id: assignment.feature_id, campaign_name: campaignName, user_id: userId });
    }

    return updated;
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError(error.message, 400);
  }
}

export async function deleteAssignment(id, userId = null) {
  const assignment = await getAssignment(id);
  await checkFeatureNotConforme(assignment.feature_id);

  const result = await db.assignments.remove(id);
  if (!result) throw new AppError('Assignation non trouvée', 404);
  bus.emit('assignment:deleted', { assignment, assignment_id: id, feature_id: assignment.feature_id, user_id: userId });
}

export async function getUserAssignments(userId) {
  return db.assignments.findByUser(userId);
}

export async function getCampaignAssignments(campaignId) {
  return db.assignments.findByCampaign(campaignId);
}

export async function getFeatureAssignments(featureId) {
  const rows = await db.assignments.findByFeature(featureId);
  return rows.map((r) => ({
    id: r.id,
    feature_id: r.feature_id,
    assigned_to: r.assigned_to,
    assigned_at: r.assigned_at,
    status: r.status,
    user: {
      id: r.user_id,
      email: r.email,
      first_name: r.first_name,
      last_name: r.last_name,
      role: r.role,
      created_at: r.created_at,
    },
  }));
}
