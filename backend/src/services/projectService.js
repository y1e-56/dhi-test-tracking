import { AppError } from '../middleware/errorHandler.js';
import { withTransaction } from '../config/database.js';
import bus from '../lib/eventBus.js';
import * as db from '../db/index.js';

export async function listProjects(includeArchived = false) {
  return db.projects.list(includeArchived);
}

export async function getProject(id) {
  const project = await db.projects.findById(id);
  if (!project) throw new AppError('Projet non trouvé', 404);
  return project;
}

export async function createProject(data) {
  const project = await db.projects.create(data);
  bus.emit('project:created', { project, user_id: data.created_by || null });
  return project;
}

export async function setProjectTestLeads(projectId, testLeadIds) {
  await db.projects.setTestLeads(projectId, testLeadIds);
}

export async function updateProject(id, data) {
  try {
    const project = await db.projects.update(id, data);
    if (!project) throw new AppError('Projet non trouvé', 404);
    bus.emit('project:updated', { project, project_id: id, user_id: null });
    return project;
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError(error.message, 400);
  }
}

export async function archiveProject(id) {
  return withTransaction(async (client) => {
    const project = await db.projects.update(id, { is_archived: true }, client);
    if (!project) throw new AppError('Projet non trouvé', 404);

    const campaignIds = await db.campaigns.archiveByProject(id, client);

    bus.emit('project:archived', { project, project_id: id, campaign_ids: campaignIds });

    return project;
  });
}

export async function deleteProject(id) {
  return withTransaction(async (client) => {
    await db.history.deleteByProject(id, client);
    const result = await db.projects.remove(id, client);
    if (!result) throw new AppError('Projet non trouvé', 404);
    bus.emit('project:deleted', { project_id: id, user_id: null });
  });
}

export async function getProjectCampaigns(projectId) {
  return db.projects.getCampaigns(projectId);
}
