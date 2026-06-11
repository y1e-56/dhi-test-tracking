import { Router } from 'express';
import { AppError } from '../middleware/errorHandler.js';
import { authenticate } from '../middleware/auth.js';
import * as testCaseService from '../services/testCaseService.js';

const router = Router();

router.get('/', authenticate, async (req, res) => {
  const featureId = req.query.featureId ? Number(req.query.featureId) : undefined;
  const campaignId = req.query.campaignId ? Number(req.query.campaignId) : undefined;
  const testCases = await testCaseService.listTestCases(featureId, campaignId);
  res.json(testCases);
});

router.get('/:id', authenticate, async (req, res) => {
  const testCase = await testCaseService.getTestCase(Number(req.params.id));
  res.json(testCase);
});

router.post('/', authenticate, async (req, res) => {
  const testCase = await testCaseService.createTestCase(req.body);
  res.status(201).json(testCase);
});

router.delete('/:id', authenticate, async (req, res) => {
  await testCaseService.deleteTestCase(Number(req.params.id));
  res.status(204).end();
});

export default router;
