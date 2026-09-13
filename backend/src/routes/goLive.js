import { Router } from 'express';
import { z } from 'zod';
import * as goLiveService from '../services/goLiveService.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = Router();

const requireGoLiveApprover = requireRole('chef_testeur', 'quality_manager', 'qa_lead', 'approver');

const decideSchema = z.object({
  release_ref: z.string().min(1, 'Release requise'),
  verdict: z.enum(['GO', 'GO_CONDITIONNEL', 'NO_GO', 'AJOURNE']),
  decider: z.string().min(1, 'Décideur requis'),
  justification: z.string().optional(),
  checklist_completion: z.number().int().min(0).max(100).optional(),
});

/**
 * @swagger
 * /go-live/checklist-template:
 *   get:
 *     tags: [Go Live]
 *     summary: Template de checklist de validation Go Live
 *     responses:
 *       200: { description: Template de checklist }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 */
router.get('/checklist-template', authenticate, (req, res) => {
  res.json(goLiveService.GO_LIVE_CHECKLIST_TEMPLATE);
});

/**
 * @swagger
 * /go-live/checklist/{releaseRef}:
 *   get:
 *     tags: [Go Live]
 *     summary: Checklist Go Live d'une release (release_ref = id release front ou back)
 *     parameters:
 *       - name: releaseRef
 *         in: path
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Items de la checklist }
 *       400: { description: release_ref requis }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 */
router.get('/checklist/:releaseRef', authenticate, async (req, res, next) => {
  try {
    const items = await goLiveService.getChecklist(req.params.releaseRef);
    res.json(items);
  } catch (err) { next(err); }
});

/**
 * @swagger
 * /go-live/checklist/{releaseRef}/items/{itemId}:
 *   put:
 *     tags: [Go Live]
 *     summary: Cocher / décocher un item de la checklist Go Live
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: releaseRef
 *         in: path
 *         required: true
 *         schema: { type: string }
 *       - name: itemId
 *         in: path
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [checked]
 *             properties:
 *               checked: { type: boolean }
 *     responses:
 *       200: { description: Item mis à jour }
 *       400: { description: Données invalides }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 */
router.put('/checklist/:releaseRef/items/:itemId', authenticate, requireGoLiveApprover, async (req, res, next) => {
  try {
    const item = await goLiveService.updateChecklistItem(
      req.params.releaseRef,
      req.params.itemId,
      req.body.checked === true
    );
    res.json(item);
  } catch (err) { next(err); }
});

/**
 * @swagger
 * /go-live/decisions:
 *   get:
 *     tags: [Go Live]
 *     summary: Lister les décisions Go Live (filtrable par release)
 *     parameters:
 *       - name: releaseRef
 *         in: query
 *         schema: { type: string }
 *     responses:
 *       200: { description: Décisions Go Live }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 */
router.get('/decisions', authenticate, async (req, res, next) => {
  try {
    const decisions = await goLiveService.listDecisions(req.query.releaseRef);
    res.json({ data: decisions });
  } catch (err) { next(err); }
});

/**
 * @swagger
 * /go-live/decisions:
 *   post:
 *     tags: [Go Live]
 *     summary: Enregistrer une décision Go / No-Go
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [release_ref, verdict, decider]
 *             properties:
 *               release_ref: { type: string }
 *               verdict: { type: string }
 *               decider: { type: string }
 *               justification: { type: string }
 *               checklist_completion: { type: integer }
 *     responses:
 *       201: { description: Décision enregistrée }
 *       400: { description: Données invalides }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { description: Rôle insuffisant }
 */
router.post('/decisions', authenticate, requireGoLiveApprover, async (req, res, next) => {
  try {
    const parsed = decideSchema.parse({ ...req.body, created_by: req.user.id });
    const decision = await goLiveService.createDecision(parsed);
    res.status(201).json(decision);
  } catch (err) { next(err); }
});

export default router;