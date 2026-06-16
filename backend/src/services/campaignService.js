import { withTransaction } from '../config/database.js';
import { AppError } from '../middleware/errorHandler.js';
import bus from '../lib/eventBus.js';
import * as db from '../db/index.js';
import { _setTestersWithClient, _setDevelopersWithClient } from './campaignMemberService.js';

export async function listCampaigns(projectId) {
  const campaigns = await db.campaigns.list(projectId);
  
  const enriched = await Promise.all(
    campaigns.map(async (campaign) => {
      const { testers, developers } = await db.campaignMembers.getMemberIds(campaign.id);
      return { ...campaign, testers, developers };
    })
  );
  
  return enriched;
}

export async function listCampaignsByProject(projectId) {
  return listCampaigns(projectId);
}

export async function getCampaign(id) {
  const campaign = await db.campaigns.findById(id);
  if (!campaign) throw new AppError('Campagne non trouvée', 404);
  return getCampaignWithMembers(id);
}

export async function getCampaignBasic(id) {
  const campaign = await db.campaigns.findById(id);
  if (!campaign) throw new AppError('Campagne non trouvée', 404);
  return campaign;
}

export async function getCampaignWithMembers(id, client = null) {
  const campaign = await db.campaigns.findById(id, client);
  if (!campaign) throw new AppError('Campagne non trouvée', 404);
  
  const { testers, developers } = await db.campaignMembers.getMemberIds(id, client);
  
  return { ...campaign, testers, developers };
}

export async function createCampaign(data) {
  console.log('[campaignService] createCampaign avec data:', data);
  
  return withTransaction(async (client) => {
    const campaign = await db.campaigns.create(data, client);
    console.log('[campaignService] Campagne créée:', campaign);
    
    if (data.testers && data.testers.length > 0) {
      console.log('[campaignService] Ajout de testeurs:', data.testers);
      await _setTestersWithClient(campaign.id, data.testers, client);
    }
    
    if (data.developers && data.developers.length > 0) {
      console.log('[campaignService] Ajout de développeurs:', data.developers);
      await _setDevelopersWithClient(campaign.id, data.developers, client);
    }
    
    const campaignWithMembers = await getCampaignWithMembers(campaign.id, client);
    console.log('[campaignService] Campagne retournée avec membres:', campaignWithMembers);

    let project_name = '';
    try {
      const proj = await db.projects.findById(campaign.project_id).catch(() => null);
      if (proj) project_name = proj.name;
    } catch {}
    bus.emit('campaign:created', { campaign: campaignWithMembers, user_id: data.created_by, project_name });

    return campaignWithMembers;
  });
}

export async function updateCampaign(id, data) {
  console.log('[campaignService] updateCampaign id=' + id + ' avec data:', data);
  const scalarFields = ['name', 'objective', 'organization_mode', 'start_date', 'end_date', 'status'];
  const hasScalarFields = scalarFields.some(field => data[field] !== undefined);
  const hasTestLeadIds = data.test_lead_ids !== undefined;

  if (!hasScalarFields && !hasTestLeadIds && !data.testers && !data.developers) {
    throw new AppError('Aucune donnée à mettre à jour', 400);
  }

  return withTransaction(async (client) => {
    if (hasScalarFields || hasTestLeadIds) {
      try {
        const updated = await db.campaigns.update(id, data, client);
        if (!updated) throw new AppError('Campagne non trouvée', 404);
        console.log('[campaignService] Champs campagne mis à jour');
      } catch (error) {
        if (error instanceof AppError) throw error;
        throw new AppError(error.message, 400);
      }
    }
    
    if (data.testers !== undefined) {
      console.log('[campaignService] Mise à jour testeurs:', data.testers);
      await _setTestersWithClient(id, data.testers, client);
      console.log('[campaignService] Testeurs mis à jour');
    }
    
    if (data.developers !== undefined) {
      console.log('[campaignService] Mise à jour développeurs:', data.developers);
      await _setDevelopersWithClient(id, data.developers, client);
      console.log('[campaignService] Développeurs mis à jour');
    }
    
    const campaignWithMembers = await getCampaignWithMembers(id, client);
    console.log('[campaignService] Campagne retournée avec membres:', campaignWithMembers);

    bus.emit('campaign:updated', { campaign: campaignWithMembers, campaign_id: id, user_id: null });

    return campaignWithMembers;
  });
}

export async function deleteCampaign(id) {
  console.log('[campaignService] deleteCampaign id=' + id);
  
  return withTransaction(async (client) => {
    await db.campaignMembers.deleteAll(id, client);
    await db.campaigns.setTestLeads(id, [], client);
    console.log('[campaignService] Membres et chefs testeurs de la campagne supprimés');
    
    const result = await db.campaigns.remove(id, client);
    if (!result) throw new AppError('Campagne non trouvée', 404);
    console.log('[campaignService] Campagne supprimée');

    bus.emit('campaign:deleted', { campaign_id: id, user_id: null });
  });
}

export async function getCampaignStats(campaignId) {
  return db.campaigns.getStats(campaignId);
}
