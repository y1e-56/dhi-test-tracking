import { Router } from 'express';
import authRouter from './auth.js';
import projectsRouter from './projects.js';
import campaignsRouter from './campaigns.js';
import featuresRouter from './features.js';
import anomaliesRouter from './anomalies.js';
import tasksRouter from './tasks.js';
import teamsRouter from './teams.js';
import dashboardRouter from './dashboard.js';
import testCasesRouter from './test-cases.js';
import chatRouter from './chat.js';

const router = Router();

router.use('/auth', authRouter);
router.use('/projects', projectsRouter);
router.use('/campaigns', campaignsRouter);
router.use('/features', featuresRouter);
router.use('/anomalies', anomaliesRouter);
router.use('/tasks', tasksRouter);
router.use('/teams', teamsRouter);
router.use('/dashboard', dashboardRouter);
router.use('/test-cases', testCasesRouter);
router.use('/chat', chatRouter);

export default router;
