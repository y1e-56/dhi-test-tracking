import * as db from '../db/index.js';

export async function getGlobalStats() {
  return db.stats.getGlobalStats();
}

export async function getProjectDashboard(projectId) {
  const result = await db.stats.getProjectDashboard(projectId);
  if (!result) return { error: 'Projet non trouvé' };
  return result;
}

export async function getHistory(userId, campaignId) {
  const filters = {};
  if (userId) filters.userId = userId;
  if (campaignId) filters.campagneId = campaignId;
  const result = await db.history.list(filters);
  return result.data;
}

export async function getHistoryPaginated(filters = {}) {
  return db.history.list({
    userId: filters.userId,
    campagneId: filters.campagneId,
    typeAction: filters.typeAction,
    typeEntite: filters.typeEntite,
    entityId: filters.entityId,
    recherche: filters.recherche,
    dateDebut: filters.dateDebut,
    dateFin: filters.dateFin,
    page: filters.page,
    limit: filters.limit,
    orderBy: filters.orderBy,
  });
}

export async function addHistoryAction(data) {
  await db.history.addAction(data);
}
