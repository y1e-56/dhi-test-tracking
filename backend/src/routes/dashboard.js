import { Router } from 'express';
import * as dashboardService from '../services/dashboardService.js';
import * as campaignService from '../services/campaignService.js';
import * as anomalyService from '../services/anomalyService.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

/**
 * @swagger
 * /dashboard/stats:
 *   get:
 *     tags: [Dashboard]
 *     summary: Statistiques globales
 *     responses:
 *       200:
 *         description: Statistiques globales de la plateforme
 *       401: { $ref: '#/components/responses/Unauthorized' }
 */
router.get('/stats', authenticate, async (_req, res) => {
  const stats = await dashboardService.getGlobalStats();
  res.json(stats);
});

/**
 * @swagger
 * /dashboard/personal:
 *   get:
 *     tags: [Dashboard]
 *     summary: Statistiques personnelles de l'utilisateur connecté
 *     responses:
 *       200:
 *         description: Statistiques globales enrichies des compteurs personnels
 *       401: { $ref: '#/components/responses/Unauthorized' }
 */
router.get('/personal', authenticate, async (req, res) => {
  const stats = await dashboardService.getGlobalStats();
  const myAnomalies = await anomalyService.listAnomalies(undefined, undefined, req.user.id);
  const reportedAnomalies = await anomalyService.listAnomalies(undefined, undefined, undefined, req.user.id);
  res.json({ ...stats, myAnomalies: myAnomalies.length, reportedAnomalies: reportedAnomalies.length });
});

/**
 * @swagger
 * /dashboard/projects/{projectId}:
 *   get:
 *     tags: [Dashboard]
 *     summary: Tableau de bord d'un projet
 *     parameters:
 *       - name: projectId
 *         in: path
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Tableau de bord du projet
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       404: { $ref: '#/components/responses/NotFound' }
 */
router.get('/projects/:projectId', authenticate, async (req, res) => {
  const dashboard = await dashboardService.getProjectDashboard(Number(req.params.projectId));
  res.json(dashboard);
});

/**
 * @swagger
 * /dashboard/campaigns/{campaignId}:
 *   get:
 *     tags: [Dashboard]
 *     summary: Tableau de bord d'une campagne
 *     parameters:
 *       - name: campaignId
 *         in: path
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Campagne et ses statistiques
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       404: { $ref: '#/components/responses/NotFound' }
 */
router.get('/campaigns/:campaignId', authenticate, async (req, res) => {
  const campaign = await campaignService.getCampaign(Number(req.params.campaignId));
  const stats = await campaignService.getCampaignStats(Number(req.params.campaignId));
  res.json({ campaign, ...stats });
});

/**
 * @swagger
 * /dashboard/campaigns/{campaignId}/report:
 *   get:
 *     tags: [Dashboard]
 *     summary: Rapport détaillé d'une campagne
 *     parameters:
 *       - name: campaignId
 *         in: path
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Rapport de campagne avec date de génération
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       404: { $ref: '#/components/responses/NotFound' }
 */
router.get('/campaigns/:campaignId/report', authenticate, async (req, res) => {
  const campaign = await campaignService.getCampaign(Number(req.params.campaignId));
  const stats = await campaignService.getCampaignStats(Number(req.params.campaignId));
  res.json({ campaign, ...stats, generatedAt: new Date().toISOString() });
});

/**
 * @swagger
 * /dashboard/history:
 *   get:
 *     tags: [Dashboard]
 *     summary: Historique des actions (paginé et filtrable si un paramètre est fourni)
 *     parameters:
 *       - $ref: '#/components/parameters/PageParam'
 *       - $ref: '#/components/parameters/LimitParam'
 *       - name: user_id
 *         in: query
 *         schema: { type: integer }
 *       - name: campaign_id
 *         in: query
 *         schema: { type: integer }
 *       - name: typeAction
 *         in: query
 *         schema: { type: string, enum: [created, updated, archived, deleted, status_changed, assigned, commented] }
 *       - name: typeEntite
 *         in: query
 *         schema: { type: string, enum: [project, campaign, feature, anomaly, user] }
 *       - name: entityId
 *         in: query
 *         schema: { type: integer }
 *       - name: recherche
 *         in: query
 *         schema: { type: string }
 *       - name: dateDebut
 *         in: query
 *         schema: { type: string, format: date }
 *       - name: dateFin
 *         in: query
 *         schema: { type: string, format: date }
 *     responses:
 *       200:
 *         description: Historique (paginé si un filtre/page/limit est fourni, sinon tableau complet)
 *         content:
 *           application/json:
 *             schema:
 *               oneOf:
 *                 - type: array
 *                   items: { type: object }
 *                 - $ref: '#/components/schemas/PaginatedResult'
 *       401: { $ref: '#/components/responses/Unauthorized' }
 */
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
