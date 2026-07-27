import { Router } from 'express';
import { AppError } from '../middleware/errorHandler.js';
import { authenticate } from '../middleware/auth.js';
import * as testCaseService from '../services/testCaseService.js';

const router = Router();

/**
 * @swagger
 * /test-cases:
 *   get:
 *     tags: [TestCases]
 *     summary: Lister les cas de test (filtrables par fonctionnalité ou campagne)
 *     parameters:
 *       - name: featureId
 *         in: query
 *         schema: { type: integer }
 *       - name: campaignId
 *         in: query
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Liste des cas de test
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items: { $ref: '#/components/schemas/TestCase' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 */
router.get('/', authenticate, async (req, res) => {
  const featureId = req.query.featureId ? Number(req.query.featureId) : undefined;
  const campaignId = req.query.campaignId ? Number(req.query.campaignId) : undefined;
  const testCases = await testCaseService.listTestCases(featureId, campaignId);
  res.json(testCases);
});

/**
 * @swagger
 * /test-cases/{id}:
 *   get:
 *     tags: [TestCases]
 *     summary: Récupérer un cas de test par son id
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Cas de test trouvé
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/TestCase' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       404: { $ref: '#/components/responses/NotFound' }
 */
router.get('/:id', authenticate, async (req, res) => {
  const testCase = await testCaseService.getTestCase(Number(req.params.id));
  res.json(testCase);
});

/**
 * @swagger
 * /test-cases:
 *   post:
 *     tags: [TestCases]
 *     summary: Créer un cas de test
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               feature_id: { type: integer }
 *               campaign_id: { type: integer }
 *               name: { type: string }
 *               description: { type: string }
 *               expected_result: { type: string }
 *     responses:
 *       201:
 *         description: Cas de test créé
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/TestCase' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 */
router.post('/', authenticate, async (req, res) => {
  const testCase = await testCaseService.createTestCase(req.body);
  res.status(201).json(testCase);
});

/**
 * @swagger
 * /test-cases/{id}:
 *   delete:
 *     tags: [TestCases]
 *     summary: Supprimer un cas de test
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       204:
 *         description: Cas de test supprimé
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       404: { $ref: '#/components/responses/NotFound' }
 */
router.delete('/:id', authenticate, async (req, res) => {
  await testCaseService.deleteTestCase(Number(req.params.id));
  res.status(204).end();
});

export default router;
