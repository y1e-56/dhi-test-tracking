import { Router } from 'express';
import { AppError } from '../middleware/errorHandler.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import * as testCaseService from '../services/testCaseService.js';
import * as featureService from '../services/featureService.js';
import { generateFeatureDocument } from '../services/featureDocumentService.js';

const router = Router();

const requireTestCaseManager = requireRole('chef_testeur', 'quality_manager', 'qa_lead', 'chef_projet', 'product_owner');
const requireTestCaseEditor = requireRole('chef_testeur', 'quality_manager', 'qa_lead', 'chef_projet', 'product_owner', 'tester');

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
router.post('/', authenticate, requireTestCaseEditor, async (req, res) => {
  const testCase = await testCaseService.createTestCase(req.body);
  if (req.body.feature_id) {
    try {
      await generateFeatureDocument(req.body.feature_id);
    } catch (e) {
      console.error('Erreur régénération document cas de test:', e);
    }
  }
  res.status(201).json(testCase);
});

/**
 * @swagger
 * /test-cases/{id}:
 *   put:
 *     tags: [TestCases]
 *     summary: Mettre à jour un cas de test
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
 *             properties:
 *               feature_id: { type: integer }
 *               name: { type: string }
 *               description: { type: string }
 *               expected_result: { type: string }
 *               steps: { type: string }
 *               priority: { $ref: '#/components/schemas/PriorityLevel' }
 *               type: { $ref: '#/components/schemas/TestCaseType' }
 *     responses:
 *       200:
 *         description: Cas de test mis à jour
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/TestCase' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       404: { $ref: '#/components/responses/NotFound' }
 *       409:
 *         description: Cas de test dupliqué
 */
router.put('/:id', authenticate, requireTestCaseEditor, async (req, res) => {
  const testCase = await testCaseService.updateTestCase(Number(req.params.id), req.body);
  if (testCase.feature_id) {
    try {
      await generateFeatureDocument(testCase.feature_id);
    } catch (e) {
      console.error('Erreur régénération document cas de test:', e);
    }
  }
  res.json(testCase);
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
router.delete('/:id', authenticate, requireTestCaseManager, async (req, res) => {
  const deleted = await testCaseService.deleteTestCase(Number(req.params.id));
  if (deleted?.feature_id) {
    try {
      const regenerated = await generateFeatureDocument(deleted.feature_id);
      if (!regenerated) {
        await featureService.clearFeatureAttachment(deleted.feature_id);
      }
    } catch (e) {
      console.error('Erreur régénération document cas de test:', e);
    }
  }
  res.status(204).end();
});

export default router;
