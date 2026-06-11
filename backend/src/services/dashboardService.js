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
  return db.history.list(userId, campaignId);
}

export async function addHistoryAction(data) {
  await db.history.addAction(data);
}
