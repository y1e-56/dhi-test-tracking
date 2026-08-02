import { Router } from 'express';
import { z } from 'zod';
import { AppError } from '../middleware/errorHandler.js';
import { authenticate } from '../middleware/auth.js';
import * as testCaseService from '../services/testCaseService.js';
import * as featureService from '../services/featureService.js';
import { generateFeatureDocument } from '../services/featureDocumentService.js';

const router = Router();

/**
 * @swagger
 * /test-cases/generate:
 *   post:
 *     tags: [TestCases]
 *     summary: Générer automatiquement les cas de test d'une fonctionnalité à partir de ses scénarios types
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [feature_id]
 *             properties:
 *               feature_id: { type: integer }
 *     responses:
 *       201:
 *         description: Cas de test générés
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 count: { type: integer }
 *                 testCases:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/TestCase' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       404: { $ref: '#/components/responses/NotFound' }
 */
router.post('/generate', authenticate, async (req, res) => {
  const { feature_id } = z.object({ feature_id: z.number() }).parse(req.body);
  const feature = await featureService.getFeature(feature_id);

  const existing = await testCaseService.listTestCases(feature_id, undefined);
  const existingNames = new Set(existing.map((tc) => tc.name));
  const candidates = testCaseService.generateTestCasesForFeature({
    name: feature.name,
    description: feature.description,
    module: feature.module,
  });

  const toCreate = candidates.filter((tc) => !existingNames.has(tc.name));
  if (toCreate.length === 0) {
    return res.status(200).json({ count: 0, testCases: existing });
  }

  const campaignId = feature.campaign_id;
  const created = [];
  for (const tc of toCreate) {
    created.push(await testCaseService.createTestCase({ ...tc, feature_id }));
  }
  try {
    await generateFeatureDocument(feature_id);
  } catch (e) {
    console.error('Erreur régénération document cas de test:', e);
  }
  res.status(201).json({ count: created.length, testCases: created });
});

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
