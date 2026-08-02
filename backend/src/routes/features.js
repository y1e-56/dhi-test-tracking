import { Router } from 'express';
import { z } from 'zod';
import fs from 'fs';
import path from 'path';
import * as featureService from '../services/featureService.js';
import { authenticate } from '../middleware/auth.js';
import { uploadFeatureAttachment } from '../config/upload.js';
import { generateFeatureDocument } from '../services/featureDocumentService.js';
import bus from '../lib/eventBus.js';

const router = Router();

const createSchema = z.object({
  campaign_id: z.number(),
  name: z.string().min(1, 'Nom requis'),
  description: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  module: z.string().optional(),
});

/**
 * @swagger
 * /features:
 *   get:
 *     tags: [Features]
 *     summary: Lister les fonctionnalités (avec filtres et pagination optionnels)
 *     parameters:
 *       - $ref: '#/components/parameters/PageParam'
 *       - $ref: '#/components/parameters/LimitParam'
 *       - name: campaignId
 *         in: query
 *         schema: { type: integer }
 *       - name: recherche
 *         in: query
 *         schema: { type: string }
 *       - name: statut
 *         in: query
 *         schema: { type: string }
 *       - name: priorite
 *         in: query
 *         schema: { type: string }
 *       - name: assigneeId
 *         in: query
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Liste des fonctionnalités (paginée si un filtre/page/limit est fourni, sinon tableau complet)
 *         content:
 *           application/json:
 *             schema:
 *               oneOf:
 *                 - type: array
 *                   items: { $ref: '#/components/schemas/Feature' }
 *                 - $ref: '#/components/schemas/PaginatedResult'
 *       401: { $ref: '#/components/responses/Unauthorized' }
 */
router.get('/', authenticate, async (req, res) => {
  const { page, limit, ...filters } = req.query;
  if (page || limit || filters.recherche || filters.statut || filters.priorite || filters.assigneeId) {
    const result = await featureService.listFeaturesPaginated({
      page: page ? Math.max(1, parseInt(page)) : 1,
      limit: limit ? Math.max(1, Math.min(200, parseInt(limit))) : 20,
      campaignId: filters.campaignId ? Number(filters.campaignId) : undefined,
      recherche: filters.recherche || undefined,
      statut: filters.statut || undefined,
      priorite: filters.priorite || undefined,
      assigneeId: filters.assigneeId ? Number(filters.assigneeId) : undefined,
    });
    res.json(result);
  } else {
    const campaignId = filters.campaignId ? Number(filters.campaignId) : undefined;
    const features = await featureService.listFeatures(campaignId);
    res.json(features);
  }
});

/**
 * @swagger
 * /features/{id}:
 *   get:
 *     tags: [Features]
 *     summary: Récupérer une fonctionnalité par son id
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Fonctionnalité trouvée
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Feature' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       404: { $ref: '#/components/responses/NotFound' }
 */
router.get('/:id', authenticate, async (req, res) => {
  const feature = await featureService.getFeature(Number(req.params.id));
  res.json(feature);
});

/**
 * @swagger
 * /features:
 *   post:
 *     tags: [Features]
 *     summary: Créer une fonctionnalité
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [campaign_id, name]
 *             properties:
 *               campaign_id: { type: integer }
 *               name: { type: string }
 *               description: { type: string }
 *               priority: { type: string, enum: [low, medium, high, critical] }
 *     responses:
 *       201:
 *         description: Fonctionnalité créée
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 feature: { $ref: '#/components/schemas/Feature' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 */
router.post('/', authenticate, async (req, res) => {
  const data = createSchema.parse(req.body);
  const result = await featureService.createFeature(data);
  bus.emit('data:changed', { entity: 'features' });
  res.status(201).json(result);
});

/**
 * @swagger
 * /features/{id}:
 *   put:
 *     tags: [Features]
 *     summary: Mettre à jour une fonctionnalité
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
 *         description: Fonctionnalité mise à jour
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 feature: { $ref: '#/components/schemas/Feature' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       404: { $ref: '#/components/responses/NotFound' }
 */
router.put('/:id', authenticate, async (req, res) => {
  const feature = await featureService.updateFeature(Number(req.params.id), req.body);
  bus.emit('data:changed', { entity: 'features' });
  res.json({ feature });
});

/**
 * @swagger
 * /features/{id}/status:
 *   patch:
 *     tags: [Features]
 *     summary: Changer le statut d'une fonctionnalité
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
 *             required: [status]
 *             properties:
 *               status: { type: string, enum: [pending, conforme, anomaly_detected] }
 *     responses:
 *       200:
 *         description: Statut mis à jour
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 feature: { $ref: '#/components/schemas/Feature' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       404: { $ref: '#/components/responses/NotFound' }
 */
router.patch('/:id/status', authenticate, async (req, res) => {
  const { status } = req.body;
  const feature = await featureService.updateFeatureStatus(Number(req.params.id), status);
  bus.emit('data:changed', { entity: 'features' });
  res.json({ feature });
});

/**
 * @swagger
 * /features/{id}:
 *   delete:
 *     tags: [Features]
 *     summary: Supprimer une fonctionnalité
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       204:
 *         description: Fonctionnalité supprimée
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       404: { $ref: '#/components/responses/NotFound' }
 */
router.delete('/:id', authenticate, async (req, res) => {
  await featureService.deleteFeature(Number(req.params.id));
  bus.emit('data:changed', { entity: 'features' });
  res.status(204).send();
});

/**
 * @swagger
 * /features/{id}/attachment:
 *   post:
 *     tags: [Features]
 *     summary: Attacher un document référentiel de test (PDF ou Word) à une fonctionnalité
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [file]
 *             properties:
 *               file: { type: string, format: binary }
 *     responses:
 *       200:
 *         description: Document attaché
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 feature: { $ref: '#/components/schemas/Feature' }
 *       400: { description: Format non autorisé (PDF, .doc, .docx) ou fichier > 10 Mo }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       404: { $ref: '#/components/responses/NotFound' }
 */
router.post('/:id/attachment', authenticate, uploadFeatureAttachment.single('file'), async (req, res) => {
  const featureId = Number(req.params.id);
  if (!req.file) {
    return res.status(400).json({ message: 'Aucun fichier reçu' });
  }
  const feature = await featureService.setFeatureAttachment(featureId, {
    path: req.file.path,
    name: req.file.originalname,
    type: req.file.mimetype,
    size: req.file.size,
  });
  bus.emit('data:changed', { entity: 'features' });
  res.json({ feature });
});

/**
 * @swagger
 * /features/{id}/attachment/generate:
 *   post:
 *     tags: [Features]
 *     summary: Générer automatiquement le document PDF des cas de test d'une fonctionnalité
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Document régénéré
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 feature: { $ref: '#/components/schemas/Feature' }
 *       404: { description: Fonctionnalité ou cas de test introuvable }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 */
router.post('/:id/attachment/generate', authenticate, async (req, res) => {
  const featureId = Number(req.params.id);
  const feature = await generateFeatureDocument(featureId);
  if (!feature) {
    return res.status(404).json({ message: 'Aucun cas de test pour générer le document' });
  }
  bus.emit('data:changed', { entity: 'features' });
  res.json({ feature });
});

/**
 * @swagger
 * /features/{id}/attachment:
 *   get:
 *     tags: [Features]
 *     summary: Télécharger le document référentiel de test d'une fonctionnalité
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Fichier téléchargé
 *         content:
 *           application/octet-stream:
 *             schema: { type: string, format: binary }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       404: { $ref: '#/components/responses/NotFound' }
 */
router.get('/:id/attachment', authenticate, async (req, res) => {
  const feature = await featureService.getFeature(Number(req.params.id));
  if (!feature?.attachment_path || !fs.existsSync(feature.attachment_path)) {
    return res.status(404).json({ message: 'Aucun document attaché à cette fonctionnalité' });
  }
  const ext = path.extname(feature.attachment_name || feature.attachment_path).toLowerCase();
  const mime = ext === '.pdf' ? 'application/pdf'
    : ext === '.doc' ? 'application/msword'
    : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
  res.setHeader('Content-Type', mime);
  res.download(feature.attachment_path, feature.attachment_name || 'document' + ext);
});

/**
 * @swagger
 * /features/{id}/attachment:
 *   delete:
 *     tags: [Features]
 *     summary: Supprimer le document référentiel de test d'une fonctionnalité
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Document supprimé
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 feature: { $ref: '#/components/schemas/Feature' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       404: { $ref: '#/components/responses/NotFound' }
 */
router.delete('/:id/attachment', authenticate, async (req, res) => {
  const feature = await featureService.clearFeatureAttachment(Number(req.params.id));
  bus.emit('data:changed', { entity: 'features' });
  res.json({ feature });
});

/**
 * @swagger
 * /features/{id}/anomalies:
 *   get:
 *     tags: [Features]
 *     summary: Lister les anomalies d'une fonctionnalité
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Liste des anomalies
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items: { $ref: '#/components/schemas/Anomaly' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       404: { $ref: '#/components/responses/NotFound' }
 */
router.get('/:id/anomalies', authenticate, async (req, res) => {
  const anomalies = await featureService.getFeatureAnomalies(Number(req.params.id));
  res.json(anomalies);
});

export default router;
