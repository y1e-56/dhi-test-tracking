import { Router } from 'express';
import { z } from 'zod';
import * as campaignService from '../services/campaignService.js';
import { authenticate } from '../middleware/auth.js';
import bus from '../lib/eventBus.js';

const router = Router();

const createSchema = z.object({
  project_id: z.number(),
  name: z.string().min(1, 'Nom requis'),
  objective: z.string().optional(),
  organization_mode: z.enum(['exploratory', 'scenario', 'combination']).optional(),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  test_lead_ids: z.array(z.number()).optional(),
  testers: z.array(z.number()).optional(),
  developers: z.array(z.number()).optional(),
});

router.get('/', authenticate, async (req, res) => {
  const { page, limit, ...filters } = req.query;
  if (page || limit || filters.recherche || filters.statut || filters.chefTesteurId || filters.project_id || filters.projectId) {
    const result = await campaignService.listCampaignsPaginated({
      page: page ? Math.max(1, parseInt(page)) : 1,
      limit: limit ? Math.max(1, Math.min(200, parseInt(limit))) : 20,
      projetId: filters.project_id ? Number(filters.project_id) : filters.projectId ? Number(filters.projectId) : undefined,
      statut: filters.statut || undefined,
      recherche: filters.recherche || undefined,
      chefTesteurId: filters.chefTesteurId ? Number(filters.chefTesteurId) : undefined,
      dateDebut: filters.dateDebut || undefined,
      dateFin: filters.dateFin || undefined,
    });
    res.json(result);
  } else {
    const projectId = filters.project_id ? Number(filters.project_id) : filters.projectId ? Number(filters.projectId) : undefined;
    const campaigns = await campaignService.listCampaigns(projectId);
    res.json(campaigns);
  }
});

router.get('/:id', authenticate, async (req, res) => {
  const campaign = await campaignService.getCampaign(Number(req.params.id));
  res.json(campaign);
});

router.post('/', authenticate, async (req, res) => {
  const data = createSchema.parse(req.body);
  const enrichedData = { ...data, created_by: req.user.id };
  console.log('[campaigns] POST / avec data:', enrichedData);
  const campaign = await campaignService.createCampaign(enrichedData);
  console.log('[campaigns] Campagne créée:', campaign);
  
  res.status(201).json({ campaign });
});

router.put('/:id', authenticate, async (req, res) => {
  console.log('[campaigns] PUT /:id avec data:', req.body);
  const campaign = await campaignService.updateCampaign(Number(req.params.id), req.body);
  console.log('[campaigns] Campagne modifiée:', campaign);
  
  res.json({ campaign });
});

router.delete('/:id', authenticate, async (req, res) => {
  const campaignId = Number(req.params.id);
  const userId = req.user.id;
  const userRole = req.user.role;
  
  console.log('[campaigns] DELETE /:id campaignId=' + campaignId + ' userId=' + userId + ' role=' + userRole);
  
  // Vérifier les permissions : admin ou chef testeur de la campagne
  if (userRole !== 'admin') {
    const campaign = await campaignService.getCampaign(campaignId);
    if (!campaign.test_leads || !campaign.test_leads.includes(userId)) {
      return res.status(403).json({ error: 'Vous n\'avez pas la permission de supprimer cette campagne' });
    }
  }
  
  await campaignService.deleteCampaign(campaignId);
  console.log('[campaigns] Campagne supprimée');
  
  res.status(204).send();
});

router.get('/:id/stats', authenticate, async (req, res) => {
  const stats = await campaignService.getCampaignStats(Number(req.params.id));
  res.json(stats);
});

router.get('/:id/statistics', authenticate, async (req, res) => {
  const stats = await campaignService.getCampaignStats(Number(req.params.id));
  res.json(stats);
});

export default router;
