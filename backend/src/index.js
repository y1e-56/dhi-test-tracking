import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import http from 'http';
import { initDb } from './config/database.js';
import pgPool from './config/database.js';
import routes from './routes/index.js';
import { errorHandler } from './middleware/errorHandler.js';
import { initializeSocket } from './socket.js';
import { setupEventSubscribers } from './services/eventSubscribers.js';
import { initMailTransport } from './services/emailService.js';
import bcrypt from 'bcryptjs';

dotenv.config();

const app = express();
const httpServer = http.createServer(app);
const PORT = process.env.PORT || 5000;

// Initialiser Socket.IO
const io = initializeSocket(httpServer);
app.locals.io = io;

// Initialiser les subscribers event bus (passe io pour les émissions socket)
setupEventSubscribers(io);

// Initialiser le transport SMTP pour les emails
initMailTransport();

app.use(helmet());
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  ...(process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(',') : []),
];

app.use(cors({
  origin: process.env.CORS_ORIGIN === 'dev' || process.env.CORS_ORIGIN === '*'
    ? true
    : (origin, callback) => {
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin)) return callback(null, true);
        if (/^https?:\/\/(192\.168\.|10\.|172\.(1[6-9]|2\d|3[01])\.)/.test(origin)) return callback(null, true);
        callback(new Error(`Origin ${origin} non autorisée par CORS`));
      },
  credentials: true,
}));
app.use(express.json());

app.use('/api', routes);

app.use(errorHandler);

async function autoSeedIfEmpty() {
  const client = await pgPool.connect();
  try {
    const { rows } = await client.query('SELECT COUNT(*)::int AS count FROM users');
    if (rows[0].count === 0) {
      console.log('[seed] No users found — running auto-seed...');
      const hash = (pwd) => bcrypt.hashSync(pwd, 10);

      const users = await client.query(`
        INSERT INTO users (email, password_hash, first_name, last_name, role) VALUES
          ('admin@test.fr', $1, 'Admin', 'Principal', 'admin'),
          ('chef@test.fr', $2, 'Chef', 'Projet', 'chef_testeur'),
          ('chef2@test.fr', $3, 'Second', 'Chef', 'chef_testeur'),
          ('testeur@test.fr', $4, 'Testeur', 'Principal', 'tester'),
          ('dev@test.fr', $5, 'Developpeur', 'Senior', 'developer')
        RETURNING id, email, role
      `, [hash('admin123'), hash('chef123'), hash('chef123'), hash('testeur123'), hash('dev123')]);

      const adminId = users.rows[0].id;
      const chefId = users.rows[1].id;
      const chef2Id = users.rows[2].id;
      const testeurId = users.rows[3].id;
      const devId = users.rows[4].id;

      const projects = await client.query(`
        INSERT INTO projects (name, description, start_date, end_date, created_by) VALUES
          ('DHI Logiciel', 'Projet principal de test du logiciel DHI', '2025-01-01', '2025-12-31', $1),
          ('Mobile App', 'Tests de l''application mobile', '2025-03-01', '2025-09-30', $1)
        RETURNING id
      `, [adminId]);

      const project1Id = projects.rows[0].id;
      const project2Id = projects.rows[1].id;

      await client.query(`
        INSERT INTO project_test_leads (project_id, user_id) VALUES ($1, $2), ($1, $3), ($4, $2)
      `, [project1Id, chefId, chef2Id, project2Id]);

      const campaigns = await client.query(`
        INSERT INTO campaigns (project_id, name, objective, organization_mode, start_date, end_date, status) VALUES
          ($1, 'Campagne Exploratoire V1', 'Tester les fonctionnalités principales en exploration libre', 'exploratory', '2025-01-15', '2025-02-28', 'completed'),
          ($1, 'Campagne Scénarios Métier', 'Valider les parcours utilisateur critiques', 'scenario', '2025-03-01', '2025-04-15', 'in_progress'),
          ($2, 'Campagne Mobile PUSH', 'Tester les notifications push et la synchronisation', 'combination', '2025-04-01', '2025-05-30', 'planning')
        RETURNING id
      `, [project1Id, project1Id, project2Id]);

      const camp1Id = campaigns.rows[0].id;
      const camp2Id = campaigns.rows[1].id;

      await client.query(`
        INSERT INTO campaign_test_leads (campaign_id, user_id) VALUES ($1, $2), ($3, $2)
      `, [camp1Id, chefId, camp2Id]);

      await client.query(`
        INSERT INTO campaign_members (campaign_id, user_id, team_type) VALUES
          ($1, $2, 'tester'), ($1, $3, 'developer'),
          ($4, $2, 'tester'), ($4, $3, 'developer')
      `, [camp1Id, testeurId, devId, camp2Id]);

      const features = await client.query(`
        INSERT INTO features (campaign_id, name, description, priority, status) VALUES
          ($1, 'Authentification', 'Connexion et gestion des sessions utilisateur', 'high', 'conforme'),
          ($1, 'Gestion des projets', 'CRUD des projets de test', 'high', 'anomaly_detected'),
          ($2, 'Tableau de bord', 'Affichage des statistiques globales', 'critical', 'pending'),
          ($2, 'Export PDF', 'Génération de rapports PDF', 'medium', 'pending')
        RETURNING id
      `, [camp1Id, camp2Id]);

      const feat1Id = features.rows[0].id;
      const feat2Id = features.rows[1].id;

      const testCases = await client.query(`
        INSERT INTO test_cases (feature_id, campaign_id, name, description, expected_result) VALUES
          ($1, $2, 'TC-LOGIN-001', 'Vérifier le succès de connexion', 'L''utilisateur est connecté'),
          ($1, $2, 'TC-LOGIN-002', 'Erreur mot de passe invalide', 'Un message d''erreur apparaît'),
          ($3, $2, 'TC-PROJECTS-001', 'Rafraîchissement liste projets', 'La liste se met à jour après création')
        RETURNING id
      `, [feat1Id, camp1Id, feat2Id]);

      const tcLogin1 = testCases.rows[0].id;
      const tcLogin2 = testCases.rows[1].id;
      const tcProjects = testCases.rows[2].id;

      await client.query(`
        INSERT INTO assignments (feature_id, assigned_to, status) VALUES ($1, $2, 'completed'), ($3, $2, 'in_progress')
      `, [feat1Id, testeurId, feat2Id]);

      await client.query(`
        INSERT INTO anomalies (feature_id, campaign_id, test_case_id, description, reported_by, assigned_to, status) VALUES
          ($1, $2, $3, 'Le bouton de connexion ne répond pas sur Safari', $4, $5, 'new'),
          ($1, $2, $6, 'Le message d''erreur "Session expirée" ne s''affiche pas en français', $4, $5, 'in_progress'),
          ($7, $2, $8, 'La liste des projets ne se rafraîchit pas après création', $9, $5, 'resolution_signaled'),
          ($7, $2, $8, 'Le filtre par statut des projets est inactif', $9, NULL, 'new')
      `, [feat1Id, camp1Id, tcLogin1, testeurId, devId, tcLogin2, feat2Id, tcProjects, testeurId]);

      console.log('[seed] Auto-seed completed');
      console.log('[seed] Accounts: admin@test.fr/admin123, chef@test.fr/chef123, testeur@test.fr/testeur123, dev@test.fr/dev123');
    } else {
      console.log(`[seed] ${rows[0].count} users already exist — skipping seed`);
    }
  } catch (err) {
    console.error('[seed] Auto-seed failed:', err);
  } finally {
    client.release();
  }
}

async function start() {
  try {
    await initDb();
    await autoSeedIfEmpty();
    httpServer.listen(PORT, '0.0.0.0', () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`Socket.IO listening on port ${PORT}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

start();
