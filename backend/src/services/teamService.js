import * as db from '../db/index.js';

export async function getTeamMembers(projectId) {
  return db.stats.getTeamMembers(projectId);
}

export async function getProjectTeamStats(projectId) {
  return db.stats.getProjectTeamStats(projectId);
}
