import { withTransaction } from '../config/database.js';
import { AppError } from '../middleware/errorHandler.js';
import bus from '../lib/eventBus.js';
import * as db from '../db/index.js';

export async function listAnomalies(campaignId, featureId, assignedTo, reportedBy, testCaseId) {
  return db.anomalies.list({ campaignId, featureId, assignedTo, reportedBy, testCaseId });
}

export async function getAnomaly(id) {
  const anomaly = await db.anomalies.findById(id);
  if (!anomaly) throw new AppError('Anomalie non trouvée', 404);
  return anomaly;
}

export async function createAnomaly(data) {
  const feature = await db.features.findById(data.feature_id);
  if (!feature) throw new AppError('Fonctionnalité non trouvée', 404);
  if (feature.status === 'conforme') {
    throw new AppError('Impossible de créer une anomalie sur une fonctionnalité déjà marquée conforme', 400);
  }

  const anomaly = await withTransaction(async (client) => {
    const anomaly = await db.anomalies.create(data, client);
    await db.features.setStatusAnomalyDetected(data.feature_id, client);
    return anomaly;
  });

  // Notification + history via event bus
  bus.emit('anomaly:created', { anomaly, assigned_to: data.assigned_to, user_id: data.reported_by });

  return anomaly;
}

export async function updateAnomaly(id, data, userId = null) {
  try {
    const updated = await db.anomalies.update(id, data);
    if (!updated) throw new AppError('Anomalie non trouvée', 404);

    if (data.status === 'resolution_signaled' && updated.reported_by) {
      bus.emit('anomaly:resolution_signaled', { anomaly: updated, reported_by: updated.reported_by, user_id: userId });
    }

    if (data.status === 'rejected') {
      bus.emit('anomaly:rejected', { anomaly: updated, reported_by: updated.reported_by, user_id: userId });
    }

    if (data.status) {
      bus.emit('anomaly:status_changed', { anomaly: updated, user_id: userId, new_status: data.status });
    }

    bus.emit('anomaly:updated', { anomaly: updated, anomaly_id: id });

    return updated;
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError(error.message, 400);
  }
}

export async function deleteAnomaly(id, userId = null) {
  const result = await db.anomalies.remove(id);
  if (!result) throw new AppError('Anomalie non trouvée', 404);
  bus.emit('anomaly:deleted', { anomaly_id: id, user_id: userId });
}

export async function getAnomalyHistory(anomalyId) {
  return db.history.findByEntity('anomaly', anomalyId);
}

export async function signalResolution(id, resolutionDescription, userId = null) {
  return updateAnomaly(id, { status: 'resolution_signaled', resolution_description: resolutionDescription }, userId);
}

export async function validateAnomaly(id, userId = null) {
  return updateAnomaly(id, { status: 'validated' }, userId);
}

export async function rejectAnomaly(id, userId = null) {
  return updateAnomaly(id, { status: 'rejected' }, userId);
}
