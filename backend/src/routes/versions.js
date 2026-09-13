import { Router } from 'express';
import { z } from 'zod';
import * as versionService from '../services/versionService.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = Router();

const requireVersionManager = requireRole('chef_testeur', 'quality_manager', 'qa_lead', 'chef_projet');

const createSchema = z.object({
  version_number: z.string().min(1, 'Numéro de version requis'),
  name: z.string().optional(),
  description: z.string().optional(),
  campaign_id: z.number().int().positive().optional(),
  feature_id: z.number().int().positive().optional(),
  status: z.enum(['en_preparation','en_cours_de_test','release','archivee']).optional(),
  release_date: z.string().optional(),
});

const updateSchema = z.object({
  version_number: z.string().min(1).optional(),
  name: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  status: z.enum(['en_preparation','en_cours_de_test','release','archivee']).optional(),
  release_date: z.string().nullable().optional(),
});

/**
 * @swagger
 * /versions:
 *   get:
 *     tags: [Versions]
 *     summary: Lister les versions (paginé)
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
 *     responses:
 *       200: { description: Liste paginée des versions }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 */
router.get('/', authenticate, async (req, res, next) => {
  try {
    const result = await versionService.listVersionsPaginated({
      campaignId: req.query.campaignId ? parseInt(req.query.campaignId) : undefined,
      featureId: req.query.featureId ? parseInt(req.query.featureId) : undefined,
      statut: req.query.statut,
      recherche: req.query.recherche,
      page: req.query.page ? parseInt(req.query.page) : undefined,
      limit: req.query.limit ? parseInt(req.query.limit) : undefined,
    });
    res.json(result);
  } catch (err) { next(err); }
});

/**
 * @swagger
 * /versions/by-campaign/{campaignId}:
 *   get:
 *     tags: [Versions]
 *     summary: Versions d'une campagne
 *     parameters:
 *       - name: campaignId
 *         in: path
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Liste des versions }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 */
router.get('/by-campaign/:campaignId', authenticate, async (req, res, next) => {
  try {
    const versions = await versionService.listByCampaign(parseInt(req.params.campaignId));
    res.json(versions);
  } catch (err) { next(err); }
});

/**
 * @swagger
 * /versions/by-feature/{featureId}:
 *   get:
 *     tags: [Versions]
 *     summary: Versions d'une fonctionnalité
 *     parameters:
 *       - name: featureId
 *         in: path
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Liste des versions }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 */
router.get('/by-feature/:featureId', authenticate, async (req, res, next) => {
  try {
    const versions = await versionService.listByFeature(parseInt(req.params.featureId));
    res.json(versions);
  } catch (err) { next(err); }
});

/**
 * @swagger
 * /versions/{id}:
 *   get:
 *     tags: [Versions]
 *     summary: Détail d'une version
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Version }
 *       404: { description: Non trouvée }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 */
router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const v = await versionService.getVersion(parseInt(req.params.id));
    res.json(v);
  } catch (err) { next(err); }
});

/**
 * @swagger
 * /versions:
 *   post:
 *     tags: [Versions]
 *     summary: Créer une version
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [version_number]
 *             properties:
 *               version_number: { type: string }
 *               name: { type: string }
 *               description: { type: string }
 *               campaign_id: { type: integer }
 *               feature_id: { type: integer }
 *               status: { type: string }
 *               release_date: { type: string }
 *     responses:
 *       201: { description: Version créée }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 */
router.post('/', authenticate, requireVersionManager, async (req, res, next) => {
  try {
    const parsed = createSchema.parse({ ...req.body, created_by: req.user.id });
    const v = await versionService.createVersion(parsed);
    res.status(201).json(v);
  } catch (err) { next(err); }
});

/**
 * @swagger
 * /versions/{id}:
 *   put:
 *     tags: [Versions]
 *     summary: Modifier une version
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Version mise à jour }
 *       404: { description: Non trouvée }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 */
router.put('/:id', authenticate, requireVersionManager, async (req, res, next) => {
  try {
    const parsed = updateSchema.parse(req.body);
    const v = await versionService.updateVersion(parseInt(req.params.id), parsed);
    res.json(v);
  } catch (err) { next(err); }
});

/**
 * @swagger
 * /versions/{id}:
 *   delete:
 *     tags: [Versions]
 *     summary: Supprimer une version
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       204: { description: Supprimée }
 *       404: { description: Non trouvée }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 */
router.delete('/:id', authenticate, requireVersionManager, async (req, res, next) => {
  try {
    await versionService.deleteVersion(parseInt(req.params.id));
    res.status(204).end();
  } catch (err) { next(err); }
});

export default router;
