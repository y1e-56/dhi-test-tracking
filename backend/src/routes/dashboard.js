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
  const userId = req.query.user_id ? Number(req.query.user_id) : undefined;
  const campaignId = req.query.campaign_id ? Number(req.query.campaign_id) : undefined;
  const history = await dashboardService.getHistory(userId, campaignId);
  res.json(history);
});

export default router;
