import { withTransaction } from '../config/database.js';
import { AppError } from '../middleware/errorHandler.js';
import { assertCanJudgeAnomaly } from './separationGuard.js';
import {
  applyCorrectionDelay,
  assertAnomalyLevel,
  assertAssigneeIsCampaignDeveloper,
  assertCanReportAnomaly,
} from './anomalyGuard.js';
import { loadRules } from './rulesEngine.js';
import { assertCampaignInProgress } from './workflowGuard.js';
import bus from '../lib/eventBus.js';
import * as db from '../db/index.js';

export async function listAnomalies(campaignId, featureId, assignedTo, reportedBy, testCaseId) {
  const result = await db.anomalies.list({
    campagneId: campaignId,
    fonctionnaliteId: featureId,
    developpeurId: assignedTo,
    testeurId: reportedBy,
    testCaseId,
  });
  return result.data;
}

export async function listAnomaliesPaginated(filters = {}) {
  return db.anomalies.list({
    campagneId: filters.campagneId,
    fonctionnaliteId: filters.fonctionnaliteId,
    testeurId: filters.testeurId,
    developpeurId: filters.developpeurId,
    testCaseId: filters.testCaseId,
    statut: filters.statut,
    projetId: filters.projetId,
    recherche: filters.recherche,
    dateDebut: filters.dateDebut,
    dateFin: filters.dateFin,
    page: filters.page,
    limit: filters.limit,
    orderBy: filters.orderBy,
  });
}

export async function getAnomalyStats(projectId = null) {
  return db.stats.getAnomalyStats(projectId);
}

export async function getAnomaly(id) {
  const anomaly = await db.anomalies.findById(id);
  if (!anomaly) throw new AppError('Anomalie non trouvée', 404);
  return anomaly;
}

async function getFeatureDueDate(featureId) {
  const feature = await db.features.findById(featureId);
  if (!feature) return null;
  if (feature.due_date) return feature.due_date;
  const assignments = await db.assignments.findByFeature(featureId);
  return assignments[0]?.due_date || null;
}

function validateCorrectionDueDate(correctionDueDate, featureDueDate) {
  if (!correctionDueDate) return;
  if (featureDueDate && new Date(correctionDueDate).getTime() > new Date(featureDueDate).getTime()) {
    throw new AppError('Le délai de correction ne peut pas dépasser l\'échéance de la tâche', 400);
  }
}

export async function createAnomaly(data) {
  const feature = await db.features.findById(data.feature_id);
  if (!feature) throw new AppError('Fonctionnalité non trouvée', 404);
  if (feature.status === 'conforme') {
    throw new AppError('Impossible de créer une anomalie sur une fonctionnalité déjà marquée conforme', 400);
  }

  // Une anomalie se déclare pendant l'exécution : campagne en cours uniquement.
  assertCampaignInProgress(await db.campaigns.findById(data.campaign_id));
  // Seul un developpeur de l'equipe de la campagne peut recevoir l'anomalie.
  if (data.assigned_to != null) {
    const { developers } = await db.campaignMembers.getMemberIds(data.campaign_id);
    assertAssigneeIsCampaignDeveloper(data.assigned_to, developers);
  }

  // Une anomalie suit un cas de test non validé : la dernière exécution du cas
  // dans la campagne doit être en échec ou bloquée.
  const testCase = data.test_case_id ? await db.testCases.findById(data.test_case_id) : null;
  const executions = testCase ? await db.testExecutions.findByTestCase(testCase.id) : [];
  const latest = executions.find((e) => Number(e.campaign_id) === Number(data.campaign_id));
  assertCanReportAnomaly({
    testCase,
    featureId: data.feature_id,
    campaignId: data.campaign_id,
    latestResult: latest?.result ?? null,
  });

  // RG-8 : echeance de correction d'une anomalie de gravite haute (fixee a
  // creation + delai si absente, refusee au-dela si la regle est bloquante).
  const rules = await loadRules();
  const { dueDate } = applyCorrectionDelay({
    severity: data.severity ?? 'medium',
    dueDate: data.correction_due_date ?? null,
    from: new Date(),
    rule: rules.get('RG-8'),
  });
  if (dueDate) data = { ...data, correction_due_date: dueDate };

  const featureDueDate = await getFeatureDueDate(data.feature_id);
  validateCorrectionDueDate(data.correction_due_date, featureDueDate);

  const anomaly = await withTransaction(async (client) => {
    const anomaly = await db.anomalies.create(data, client);
    await db.features.setStatusAnomalyDetected(data.feature_id, client);
    return anomaly;
  });

  bus.emit('anomaly:created', { anomaly, assigned_to: data.assigned_to, user_id: data.reported_by });

  return anomaly;
}

export async function updateAnomaly(id, data, userId = null) {
  try {
    const existing = await db.anomalies.findById(id);
    if (!existing) throw new AppError('Anomalie non trouvée', 404);

    assertAnomalyLevel(data.severity, 'Gravité');
    assertAnomalyLevel(data.priority, 'Priorité');
    // Reaffectation : uniquement vers un developpeur de la campagne de l'anomalie.
    if (data.assigned_to != null && Number(data.assigned_to) !== Number(existing.assigned_to)) {
      const { developers } = await db.campaignMembers.getMemberIds(existing.campaign_id);
      assertAssigneeIsCampaignDeveloper(data.assigned_to, developers);
    }
    // RG-8 : rejoue le delai quand la gravite ou l'echeance changent, a partir
    // de la date de creation de l'anomalie.
    if (data.severity !== undefined || data.correction_due_date !== undefined) {
      const rules = await loadRules();
      const { dueDate } = applyCorrectionDelay({
        severity: data.severity ?? existing.severity,
        dueDate: data.correction_due_date !== undefined ? data.correction_due_date : existing.correction_due_date,
        from: existing.created_at,
        rule: rules.get('RG-8'),
      });
      if (dueDate && !existing.correction_due_date && data.correction_due_date === undefined) {
        data = { ...data, correction_due_date: dueDate };
      }
    }
    if (data.correction_due_date !== undefined) {
      const featureDueDate = await getFeatureDueDate(existing.feature_id);
      validateCorrectionDueDate(data.correction_due_date, featureDueDate);
    }

    // Séparation des responsabilités : une résolution ne peut être validée ou
    // rejetée que par un autre membre que celui qui l'a signalée.
    if (data.status === 'validated' || data.status === 'rejected') {
      assertCanJudgeAnomaly({
        resolvedBy: existing.resolved_by,
        actorId: userId,
        status: data.status,
      });
      if (existing.status !== 'resolution_signaled') {
        throw new AppError(`Impossible de ${data.status === 'validated' ? 'valider' : 'rejeter'} une anomalie sans résolution signalée`, 400);
      }
    }

    // Une résolution peut être signalée directement (prise en charge implicite)
    if (data.status === 'resolution_signaled') {
      if (existing.status !== 'in_progress' && existing.status !== 'new') {
        throw new AppError('Impossible de signaler la résolution dans le statut actuel', 400);
      }
    }

    // Horodatage et traçabilité de la séparation des responsabilités
    if (data.status === 'resolution_signaled') data.resolved_by = userId;
    if (data.status === 'validated') data.validated_by = userId;
    if (data.status === 'rejected') data.validated_by = null;

    const updated = await db.anomalies.update(id, data);
    if (!updated) throw new AppError('Anomalie non trouvée', 404);

    // Réaffectation à un nouveau développeur : notifié in-app + par email.
    const previousDev = existing.assigned_to ?? null;
    if (updated.assigned_to && updated.assigned_to !== previousDev) {
      bus.emit('anomaly:assigned', { anomaly: updated, assigned_to: updated.assigned_to, user_id: userId });
    }

    if (data.status === 'resolution_signaled' && updated.reported_by) {
      bus.emit('anomaly:resolution_signaled', { anomaly: updated, reported_by: updated.reported_by, user_id: userId });
    }

    if (data.status === 'rejected') {
      bus.emit('anomaly:rejected', { anomaly: updated, reported_by: updated.reported_by, user_id: userId });
    }

    if (data.status === 'validated') {
      try {
        const feature = await db.features.findById(updated.feature_id);
        const campaign = feature ? await db.campaigns.findById(feature.campaign_id) : null;
        if (campaign && campaign.test_leads && campaign.test_leads.length > 0) {
          for (const leadId of campaign.test_leads) {
            bus.emit('anomaly:validated', { anomaly: updated, campaign_name: campaign.name, test_lead_id: leadId });
          }
        }
      } catch (e) {
        console.error('Erreur notification anomaly:validated', e);
      }
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
