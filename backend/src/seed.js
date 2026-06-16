import bcrypt from 'bcryptjs';
import pool from './config/database.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function seed() {
  const client = await pool.connect();
  try {
    const migrationPath = path.join(__dirname, '../migrations/001_init.sql');
    const sql = fs.readFileSync(migrationPath, 'utf-8');
    await client.query(sql);
    console.log('Database schema ensured');

    await client.query('DELETE FROM campaign_test_leads');
    await client.query('DELETE FROM project_test_leads');
    await client.query('DELETE FROM history_actions');
    await client.query('DELETE FROM notifications');
    await client.query('DELETE FROM assignments');
    await client.query('DELETE FROM campaign_members');
    await client.query('DELETE FROM anomalies');
    await client.query('DELETE FROM test_cases');
    await client.query('DELETE FROM features');
    await client.query('DELETE FROM campaigns');
    await client.query('DELETE FROM projects');
    await client.query('DELETE FROM users');
    await client.query("ALTER SEQUENCE campaign_test_leads_id_seq RESTART WITH 1");
    await client.query("ALTER SEQUENCE project_test_leads_id_seq RESTART WITH 1");
    await client.query("ALTER SEQUENCE users_id_seq RESTART WITH 1");
    await client.query("ALTER SEQUENCE projects_id_seq RESTART WITH 1");
    await client.query("ALTER SEQUENCE campaigns_id_seq RESTART WITH 1");
    await client.query("ALTER SEQUENCE features_id_seq RESTART WITH 1");
    await client.query("ALTER SEQUENCE anomalies_id_seq RESTART WITH 1");
    await client.query("ALTER SEQUENCE test_cases_id_seq RESTART WITH 1");
    await client.query("ALTER SEQUENCE assignments_id_seq RESTART WITH 1");
    await client.query("ALTER SEQUENCE campaign_members_id_seq RESTART WITH 1");
    await client.query("ALTER SEQUENCE notifications_id_seq RESTART WITH 1");
    await client.query("ALTER SEQUENCE history_actions_id_seq RESTART WITH 1");

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
      INSERT INTO project_test_leads (project_id, user_id) VALUES
        ($1, $2), ($1, $3), ($4, $2)
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
    const camp3Id = campaigns.rows[2].id;

    await client.query(`
      INSERT INTO campaign_test_leads (campaign_id, user_id) VALUES
        ($1, $2), ($3, $2), ($4, $5)
    `, [camp1Id, chefId, camp2Id, camp3Id, chef2Id]);

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
        ($2, 'Export PDF', 'Génération de rapports PDF', 'medium', 'pending'),
        ($3, 'Notifications Push', 'Envoi et réception de notifications push', 'high', 'pending'),
        ($3, 'Synchronisation', 'Sync des données hors-ligne', 'medium', 'pending')
      RETURNING id
    `, [camp1Id, camp2Id, camp3Id]);

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
      INSERT INTO assignments (feature_id, assigned_to, status) VALUES
        ($1, $2, 'completed'), ($3, $2, 'in_progress')
    `, [feat1Id, testeurId, feat2Id]);

    await client.query(`
      INSERT INTO anomalies (feature_id, campaign_id, test_case_id, description, reported_by, assigned_to, status) VALUES
        ($1, $2, $3, 'Le bouton de connexion ne répond pas sur Safari', $4, $5, 'new'),
        ($1, $2, $6, 'Le message d''erreur "Session expirée" ne s''affiche pas en français', $4, $5, 'in_progress'),
        ($7, $2, $8, 'La liste des projets ne se rafraîchit pas après création', $9, $5, 'resolution_signaled'),
        ($7, $2, $8, 'Le filtre par statut des projets est inactif', $9, NULL, 'new')
      RETURNING id
    `, [feat1Id, camp1Id, tcLogin1, testeurId, devId, tcLogin2, feat2Id, tcProjects, testeurId]);

    console.log('Seed completed successfully');
    console.log('Demo accounts:');
    console.log('  admin@test.fr / admin123');
    console.log('  chef@test.fr / chef123');
    console.log('  testeur@test.fr / testeur123');
    console.log('  dev@test.fr / dev123');

  } catch (err) {
    console.error('Seed failed:', err);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

seed();
