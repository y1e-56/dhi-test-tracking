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
  release_id: z.number().int().nullable().optional(),
  environment_id: z.number().int().nullable().optional(),
});

/**
 * @swagger
 * /campaigns:
 *   get:
 *     tags: [Campaigns]
 *     summary: Lister les campagnes (avec filtres et pagination optionnels)
 *     parameters:
 *       - $ref: '#/components/parameters/PageParam'
 *       - $ref: '#/components/parameters/LimitParam'
 *       - name: recherche
 *         in: query
 *         schema: { type: string }
 *       - name: statut
 *         in: query
 *         schema: { type: string }
 *       - name: chefTesteurId
 *         in: query
 *         schema: { type: integer }
 *       - name: project_id
 *         in: query
 *         schema: { type: integer }
 *       - name: projectId
 *         in: query
 *         schema: { type: integer }
 *       - name: dateDebut
 *         in: query
 *         schema: { type: string, format: date }
 *       - name: dateFin
 *         in: query
 *         schema: { type: string, format: date }
 *     responses:
 *       200:
 *         description: Liste des campagnes (paginée si un filtre/page/limit est fourni, sinon tableau complet)
 *         content:
 *           application/json:
 *             schema:
 *               oneOf:
 *                 - type: array
 *                   items: { $ref: '#/components/schemas/Campaign' }
 *                 - $ref: '#/components/schemas/PaginatedResult'
 *       401: { $ref: '#/components/responses/Unauthorized' }
 */
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

/**
 * @swagger
 * /campaigns/{id}:
 *   get:
 *     tags: [Campaigns]
 *     summary: Récupérer une campagne par son id
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Campagne trouvée
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Campaign' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       404: { $ref: '#/components/responses/NotFound' }
 */
router.get('/:id', authenticate, async (req, res) => {
  const campaign = await campaignService.getCampaign(Number(req.params.id));
  res.json(campaign);
});

/**
 * @swagger
 * /campaigns:
 *   post:
 *     tags: [Campaigns]
 *     summary: Créer une campagne
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [project_id, name]
 *             properties:
 *               project_id: { type: integer }
 *               name: { type: string }
 *               objective: { type: string }
 *               organization_mode: { type: string, enum: [exploratory, scenario, combination] }
 *               start_date: { type: string, format: date }
 *               end_date: { type: string, format: date }
 *               test_lead_ids: { type: array, items: { type: integer } }
 *               testers: { type: array, items: { type: integer } }
 *               developers: { type: array, items: { type: integer } }
 *     responses:
 *       201:
 *         description: Campagne créée
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 campaign: { $ref: '#/components/schemas/Campaign' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 */
router.post('/', authenticate, async (req, res) => {
  const data = createSchema.parse(req.body);

  // Le chef testeur qui crée la campagne est automatiquement chef de cette campagne
  const chefTesteurRoles = ['chef_testeur', 'test_lead'];
  let test_lead_ids = data.test_lead_ids || [];
  if (chefTesteurRoles.includes(req.user.role)) {
    test_lead_ids = [...new Set([...test_lead_ids, req.user.id])];
  }

  const enrichedData = { ...data, test_lead_ids, created_by: req.user.id };
  console.log('[campaigns] POST / avec data:', enrichedData);
  const campaign = await campaignService.createCampaign(enrichedData);
  console.log('[campaigns] Campagne créée:', campaign);

  res.status(201).json({ campaign });
});

/**
 * @swagger
 * /campaigns/{id}:
 *   put:
 *     tags: [Campaigns]
 *     summary: Mettre à jour une campagne
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Campagne mise à jour
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 campaign: { $ref: '#/components/schemas/Campaign' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       404: { $ref: '#/components/responses/NotFound' }
 */
router.put('/:id', authenticate, async (req, res) => {
  console.log('[campaigns] PUT /:id avec data:', req.body);
  const campaign = await campaignService.updateCampaign(Number(req.params.id), req.body);
  console.log('[campaigns] Campagne modifiée:', campaign);

  res.json({ campaign });
});

/**
 * @swagger
 * /campaigns/{id}:
 *   delete:
 *     tags: [Campaigns]
 *     summary: Supprimer une campagne (admin ou chef testeur de la campagne)
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       204:
 *         description: Campagne supprimée
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       404: { $ref: '#/components/responses/NotFound' }
 */
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

/**
 * @swagger
 * /campaigns/{id}/stats:
 *   get:
 *     tags: [Campaigns]
 *     summary: Statistiques d'une campagne
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Statistiques de la campagne
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       404: { $ref: '#/components/responses/NotFound' }
 */
router.get('/:id/stats', authenticate, async (req, res) => {
  const stats = await campaignService.getCampaignStats(Number(req.params.id));
  res.json(stats);
});

/**
 * @swagger
 * /campaigns/{id}/statistics:
 *   get:
 *     tags: [Campaigns]
 *     summary: Statistiques d'une campagne (alias de /stats)
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Statistiques de la campagne
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       404: { $ref: '#/components/responses/NotFound' }
 */
router.get('/:id/statistics', authenticate, async (req, res) => {
  const stats = await campaignService.getCampaignStats(Number(req.params.id));
  res.json(stats);
});

export default router;
