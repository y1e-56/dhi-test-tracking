import { Router } from 'express';
import { z } from 'zod';
import * as incidentService from '../services/incidentService.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = Router();

const requireIncidentManager = requireRole('chef_testeur', 'quality_manager', 'qa_lead', 'chef_projet');
const requireIncidentEditor = requireRole('chef_testeur', 'quality_manager', 'qa_lead', 'chef_projet', 'tester', 'developer');

const createSchema = z.object({
  title: z.string().min(1, 'Titre requis'),
  description: z.string().min(1, 'Description requise'),
  steps_to_reproduce: z.string().optional(),
  expected_behavior: z.string().optional(),
  actual_behavior: z.string().optional(),
  severity: z.enum(['mineur','majeur','critique','bloquant']).optional(),
  status: z.enum(['ouvert','en_cours','corrige','verifie','rejete','ferme']).optional(),
  feature_id: z.number().int().positive().optional(),
  campaign_id: z.number().int().positive().optional(),
  anomaly_id: z.number().int().positive().optional(),
  test_execution_id: z.number().int().positive().optional(),
  assigned_to: z.number().int().positive().optional(),
  environment: z.string().max(100).optional(),
  version_affected: z.string().max(50).optional(),
  fix_version: z.string().max(50).optional(),
  resolution_notes: z.string().optional(),
});

const updateSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  steps_to_reproduce: z.string().nullable().optional(),
  expected_behavior: z.string().nullable().optional(),
  actual_behavior: z.string().nullable().optional(),
  severity: z.enum(['mineur','majeur','critique','bloquant']).optional(),
  status: z.enum(['ouvert','en_cours','corrige','verifie','rejete','ferme']).optional(),
  assigned_to: z.number().int().positive().nullable().optional(),
  environment: z.string().max(100).nullable().optional(),
  version_affected: z.string().max(50).nullable().optional(),
  fix_version: z.string().max(50).nullable().optional(),
  resolution_notes: z.string().nullable().optional(),
});

/**
 * @swagger
 * /incidents:
 *   get:
 *     tags: [Incidents]
 *     summary: Lister les incidents (paginé)
 *     parameters:
 *       - $ref: '#/components/parameters/PageParam'
 *       - $ref: '#/components/parameters/LimitParam'
 *       - name: campaignId
 *         in: query
 *         schema: { type: integer }
 *       - name: featureId
 *         in: query
 *         schema: { type: integer }
 *       - name: statut
 *         in: query
 *         schema: { type: string }
 *       - name: severite
 *         in: query
 *         schema: { type: string }
 *       - name: assignedTo
 *         in: query
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Liste paginée des incidents }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 */
router.get('/', authenticate, async (req, res, next) => {
  try {
    const result = await incidentService.listIncidentsPaginated({
      campaignId: req.query.campaignId ? parseInt(req.query.campaignId) : undefined,
      featureId: req.query.featureId ? parseInt(req.query.featureId) : undefined,
      statut: req.query.statut,
      severite: req.query.severite,
      assignedTo: req.query.assignedTo ? parseInt(req.query.assignedTo) : undefined,
      recherche: req.query.recherche,
      page: req.query.page ? parseInt(req.query.page) : undefined,
      limit: req.query.limit ? parseInt(req.query.limit) : undefined,
    });
    res.json(result);
  } catch (err) { next(err); }
});

/**
 * @swagger
 * /incidents/stats/{campaignId}:
 *   get:
 *     tags: [Incidents]
 *     summary: Statistiques des incidents
 *     parameters:
 *       - name: campaignId
 *         in: path
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Stats par sévérité et statut }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 */
router.get('/stats/:campaignId', authenticate, async (req, res, next) => {
  try {
    const stats = await incidentService.getIncidentStats(parseInt(req.params.campaignId));
    res.json(stats);
  } catch (err) { next(err); }
});

/**
 * @swagger
 * /incidents/by-feature/{featureId}:
 *   get:
 *     tags: [Incidents]
 *     summary: Incidents d'une fonctionnalité
 *     parameters:
 *       - name: featureId
 *         in: path
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Liste des incidents }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 */
router.get('/by-feature/:featureId', authenticate, async (req, res, next) => {
  try {
    const incidents = await incidentService.listByFeature(parseInt(req.params.featureId));
    res.json(incidents);
  } catch (err) { next(err); }
});

/**
 * @swagger
 * /incidents/{id}:
 *   get:
 *     tags: [Incidents]
 *     summary: Détail d'un incident
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Incident }
 *       404: { description: Non trouvé }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 */
router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const inc = await incidentService.getIncident(parseInt(req.params.id));
    res.json(inc);
  } catch (err) { next(err); }
});

/**
 * @swagger
 * /incidents:
 *   post:
 *     tags: [Incidents]
 *     summary: Créer un incident
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title, description]
 *             properties:
 *               title: { type: string }
 *               description: { type: string }
 *               severity: { type: string }
 *               feature_id: { type: integer }
 *               campaign_id: { type: integer }
 *     responses:
 *       201: { description: Incident créé }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 */
router.post('/', authenticate, requireIncidentEditor, async (req, res, next) => {
  try {
    const parsed = createSchema.parse({ ...req.body, reported_by: req.user.id });
    const inc = await incidentService.createIncident(parsed);
    res.status(201).json(inc);
  } catch (err) { next(err); }
});

/**
 * @swagger
 * /incidents/{id}:
 *   put:
 *     tags: [Incidents]
 *     summary: Modifier un incident
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Incident mis à jour }
 *       404: { description: Non trouvé }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 */
router.put('/:id', authenticate, requireIncidentEditor, async (req, res, next) => {
  try {
    const parsed = updateSchema.parse(req.body);
    const inc = await incidentService.updateIncident(parseInt(req.params.id), parsed);
    res.json(inc);
  } catch (err) { next(err); }
});

/**
 * @swagger
 * /incidents/{id}:
 *   delete:
 *     tags: [Incidents]
 *     summary: Supprimer un incident
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       204: { description: Supprimé }
 *       404: { description: Non trouvé }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 */
router.delete('/:id', authenticate, requireIncidentManager, async (req, res, next) => {
  try {
    await incidentService.deleteIncident(parseInt(req.params.id));
    res.status(204).end();
  } catch (err) { next(err); }
});

export default router;
