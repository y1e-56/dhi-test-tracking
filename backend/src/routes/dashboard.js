import { Router } from 'express';
import * as dashboardService from '../services/dashboardService.js';
import * as campaignService from '../services/campaignService.js';
import * as anomalyService from '../services/anomalyService.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.get('/stats', authenticate, async (_req, res) => {
  const stats = await dashboardService.getGlobalStats();
  res.json(stats);
});

router.get('/personal', authenticate, async (req, res) => {
  const stats = await dashboardService.getGlobalStats();
  const myAnomalies = await anomalyService.listAnomalies(undefined, undefined, req.user.id);
  const reportedAnomalies = await anomalyService.listAnomalies(undefined, undefined, undefined, req.user.id);
  res.json({ ...stats, myAnomalies: myAnomalies.length, reportedAnomalies: reportedAnomalies.length });
});

router.get('/projects/:projectId', authenticate, async (req, res) => {
  const dashboard = await dashboardService.getProjectDashboard(Number(req.params.projectId));
  res.json(dashboard);
});

router.get('/campaigns/:campaignId', authenticate, async (req, res) => {
  const campaign = await campaignService.getCampaign(Number(req.params.campaignId));
  const stats = await campaignService.getCampaignStats(Number(req.params.campaignId));
  res.json({ campaign, ...stats });
});

router.get('/campaigns/:campaignId/report', authenticate, async (req, res) => {
  const campaign = await campaignService.getCampaign(Number(req.params.campaignId));
  const stats = await campaignService.getCampaignStats(Number(req.params.campaignId));
  res.json({ campaign, ...stats, generatedAt: new Date().toISOString() });
});

router.get('/history', authenticate, async (req, res) => {
  const { page, limit, ...filters } = req.query;
  if (page || limit || filters.typeAction || filters.typeEntite || filters.recherche || filters.dateDebut || filters.dateFin) {
    const result = await dashboardService.getHistoryPaginated({
      page: page ? Math.max(1, parseInt(page)) : 1,
      limit: limit ? Math.max(1, Math.min(200, parseInt(limit))) : 20,
      userId: filters.user_id ? Number(filters.user_id) : undefined,
      campagneId: filters.campaign_id ? Number(filters.campaign_id) : undefined,
      typeAction: filters.typeAction || undefined,
      typeEntite: filters.typeEntite || undefined,
      entityId: filters.entityId ? Number(filters.entityId) : undefined,
      recherche: filters.recherche || undefined,
      dateDebut: filters.dateDebut || undefined,
      dateFin: filters.dateFin || undefined,
    });
    res.json(result);
  } else {
    const userId = filters.user_id ? Number(filters.user_id) : undefined;
    const campaignId = filters.campaign_id ? Number(filters.campaign_id) : undefined;
    const history = await dashboardService.getHistory(userId, campaignId);
    res.json(history);
  }
});

export default router;
