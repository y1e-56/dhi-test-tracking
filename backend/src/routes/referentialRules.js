import { Router } from 'express';
import * as referentialRuleService from '../services/referentialRuleService.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = Router();

const requireQualityAdmin = requireRole('quality_manager', 'qa_lead');

/**
 * @swagger
 * /referential-rules:
 *   get:
 *     tags: [Référentiels]
 *     summary: Lister les règles de qualité
 *     responses:
 *       200: { description: Liste des règles }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 */
router.get('/', authenticate, async (req, res, next) => {
  try {
    res.json(await referentialRuleService.listRules());
  } catch (err) { next(err); }
});

/**
 * @swagger
 * /referential-rules:
 *   post:
 *     tags: [Référentiels]
 *     summary: Créer une règle de qualité
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [id, domain, label]
 *             properties:
 *               id: { type: string }
 *               domain: { type: string }
 *               label: { type: string }
 *               threshold: { type: string }
 *               active: { type: boolean }
 *     responses:
 *       201: { description: Règle créée }
 *       400: { description: Données invalides }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 */
router.post('/', authenticate, requireQualityAdmin, async (req, res, next) => {
  try {
    res.status(201).json(await referentialRuleService.createRule(req.body));
  } catch (err) { next(err); }
});

/**
 * @swagger
 * /referential-rules/{id}:
 *   put:
 *     tags: [Référentiels]
 *     summary: Mettre à jour une règle de qualité
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Règle mise à jour }
 *       404: { description: Non trouvée }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 */
router.put('/:id', authenticate, requireQualityAdmin, async (req, res, next) => {
  try {
    res.json(await referentialRuleService.updateRule(req.params.id, req.body));
  } catch (err) { next(err); }
});

/**
 * @swagger
 * /referential-rules/{id}:
 *   delete:
 *     tags: [Référentiels]
 *     summary: Supprimer une règle de qualité
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       204: { description: Supprimée }
 *       404: { description: Non trouvée }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 */
router.delete('/:id', authenticate, requireQualityAdmin, async (req, res, next) => {
  try {
    await referentialRuleService.deleteRule(req.params.id);
    res.status(204).end();
  } catch (err) { next(err); }
});

export default router;