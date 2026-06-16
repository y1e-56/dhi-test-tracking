import { withTransaction } from '../config/database.js';
import { AppError } from '../middleware/errorHandler.js';
import bus from '../lib/eventBus.js';
import * as db from '../db/index.js';

export async function getCampaignMemberIds(campaignId) {
  return db.campaignMembers.getMemberIds(campaignId);
}

export async function getCampaignMembersWithDetails(campaignId) {
  return db.campaignMembers.getMembersWithDetails(campaignId);
}

export async function addMember(campaignId, userId, teamType) {
  await db.campaignMembers.addMember(campaignId, userId, teamType);
  bus.emit('campaignMember:added', { campaign_id: campaignId, user_id: userId, team_type: teamType });
}

export async function removeMember(campaignId, userId) {
  const result = await db.campaignMembers.removeMember(campaignId, userId);
  if (!result) throw new AppError('Membre non trouvé dans cette campagne', 404);
  bus.emit('campaignMember:removed', { campaign_id: campaignId, user_id: userId });
}

export async function setTesters(campaignId, userIds) {
  return withTransaction(async (client) => {
    await db.campaignMembers.setTesters(campaignId, userIds, client);
  });
}

export async function setDevelopers(campaignId, userIds) {
  return withTransaction(async (client) => {
    await db.campaignMembers.setDevelopers(campaignId, userIds, client);
  });
}

export async function deleteAllMembers(campaignId, client = null) {
  await db.campaignMembers.deleteAll(campaignId, client);
}

export async function getUserCampaigns(userId) {
  return db.campaignMembers.getUserCampaigns(userId);
}

// Exporter les fonctions internes pour utilisation dans les transactions
async function _setTestersWithClient(campaignId, userIds, client) {
  await db.campaignMembers.setTesters(campaignId, userIds, client);
}
async function _setDevelopersWithClient(campaignId, userIds, client) {
  await db.campaignMembers.setDevelopers(campaignId, userIds, client);
}
export { _setTestersWithClient, _setDevelopersWithClient };
