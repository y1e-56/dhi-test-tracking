import { Router } from 'express';
import { z } from 'zod';
import multer from 'multer';
import * as evidenceService from '../services/evidenceService.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = Router();

const requireEvidenceUploader = requireRole('chef_testeur', 'quality_manager', 'qa_lead', 'chef_projet', 'tester', 'developer');
const requireEvidenceManager = requireRole('chef_testeur', 'quality_manager', 'qa_lead', 'chef_projet');

const upload = multer({ dest: 'uploads/evidence/' });

const createSchema = z.object({
  entity_type: z.enum(['test_execution','anomaly','requirement','feature','campaign','product','project']),
  entity_id: z.number().int().positive(),
  file_path: z.string().optional(),
  file_name: z.string().optional(),
  file_type: z.string().optional(),
  file_size: z.string().optional(),
  description: z.string().optional(),
});

/**
 * @swagger
 * /evidence:
 *   get:
 *     tags: [Evidence]
 *     summary: Lister les preuves (paginé)
 *     parameters:
 *       - $ref: '#/components/parameters/PageParam'
 *       - $ref: '#/components/parameters/LimitParam'
 *       - name: entity_type
 *         in: query
 *         schema: { type: string }
 *       - name: entity_id
 *         in: query
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Liste paginée des preuves }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 */
router.get('/', authenticate, async (req, res, next) => {
  try {
    const result = await evidenceService.listEvidencePaginated({
      entity_type: req.query.entity_type,
      entity_id: req.query.entity_id ? parseInt(req.query.entity_id) : undefined,
      uploaded_by: req.query.uploaded_by ? parseInt(req.query.uploaded_by) : undefined,
      recherche: req.query.recherche,
      page: req.query.page ? parseInt(req.query.page) : undefined,
      limit: req.query.limit ? parseInt(req.query.limit) : undefined,
    });
    res.json(result);
  } catch (err) { next(err); }
});

/**
 * @swagger
 * /evidence/by-entity/{entityType}/{entityId}:
 *   get:
 *     tags: [Evidence]
 *     summary: Preuves d'une entité
 *     parameters:
 *       - name: entityType
 *         in: path
 *         required: true
 *         schema: { type: string }
 *       - name: entityId
 *         in: path
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Liste des preuves }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 */
router.get('/by-entity/:entityType/:entityId', authenticate, async (req, res, next) => {
  try {
    const evidence = await evidenceService.listByEntity(req.params.entityType, parseInt(req.params.entityId));
    res.json(evidence);
  } catch (err) { next(err); }
});

/**
 * @swagger
 * /evidence/{id}:
 *   get:
 *     tags: [Evidence]
 *     summary: Détail d'une preuve
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Preuve }
 *       404: { description: Non trouvée }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 */
router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const ev = await evidenceService.getEvidence(parseInt(req.params.id));
    res.json(ev);
  } catch (err) { next(err); }
});

/**
 * @swagger
 * /evidence:
 *   post:
 *     tags: [Evidence]
 *     summary: Ajouter une preuve (avec upload fichier optionnel)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [entity_type, entity_id]
 *             properties:
 *               entity_type: { type: string }
 *               entity_id: { type: integer }
 *               description: { type: string }
 *               file: { type: string, format: binary }
 *     responses:
 *       201: { description: Preuve créée }
 *       400: { description: Données invalides }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 */
router.post('/', authenticate, requireEvidenceUploader, upload.single('file'), async (req, res, next) => {
  try {
    const parsed = createSchema.parse({
      ...req.body,
      entity_id: parseInt(req.body.entity_id),
    });
    const ev = await evidenceService.createEvidence({
      ...parsed,
      uploaded_by: req.user.id,
    }, req.file);
    res.status(201).json(ev);
  } catch (err) { next(err); }
});

/**
 * @swagger
 * /evidence/{id}:
 *   delete:
 *     tags: [Evidence]
 *     summary: Supprimer une preuve
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
router.delete('/:id', authenticate, requireEvidenceManager, async (req, res, next) => {
  try {
    await evidenceService.deleteEvidence(parseInt(req.params.id));
    res.status(204).end();
  } catch (err) { next(err); }
});

export default router;
