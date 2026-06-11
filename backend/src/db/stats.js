import pool from '../config/database.js';

export async function getGlobalStats(client = null) {
  const c = client || pool;
  const [projects, campaigns, features, anomalies, users] = await Promise.all([
    c.query('SELECT COUNT(*)::int as count FROM projects WHERE is_archived = FALSE'),
    c.query('SELECT COUNT(*)::int as count FROM campaigns'),
    c.query('SELECT COUNT(*)::int as count FROM features'),
    c.query('SELECT COUNT(*)::int as count FROM anomalies'),
    c.query('SELECT COUNT(*)::int as count FROM users'),
  ]);

  const anomaliesByStatus = await c.query(
    'SELECT status, COUNT(*)::int as count FROM anomalies GROUP BY status'
  );

  const recentActivity = await c.query(
    `SELECT h.*, u.first_name, u.last_name
     FROM history_actions h LEFT JOIN users u ON u.id = h.user_id
     ORDER BY h.created_at DESC LIMIT 20`
  );

  return {
    projects: projects.rows[0].count,
    campaigns: campaigns.rows[0].count,
    features: features.rows[0].count,
    anomalies: anomalies.rows[0].count,
    users: users.rows[0].count,
    anomaliesByStatus: anomaliesByStatus.rows,
    recentActivity: recentActivity.rows,
  };
}

export async function getProjectDashboard(projectId, client = null) {
  const c = client || pool;
  const project = await c.query('SELECT * FROM projects WHERE id = $1', [projectId]);
  if (project.rows.length === 0) return null;

  const campaigns = await c.query(
    'SELECT * FROM campaigns WHERE project_id = $1 ORDER BY created_at DESC',
    [projectId]
  );
  const campaignIds = campaigns.rows.map(row => row.id);
  let featuresData = { rows: [] };
  let anomaliesData = { rows: [] };

  if (campaignIds.length > 0) {
    const placeholders = campaignIds.map((_, i) => `$${i + 1}`).join(',');
    [featuresData, anomaliesData] = await Promise.all([
      c.query(`SELECT * FROM features WHERE campaign_id IN (${placeholders})`, campaignIds),
      c.query(`SELECT * FROM anomalies WHERE campaign_id IN (${placeholders})`, campaignIds),
    ]);
  }

  return { project: project.rows[0], campaigns: campaigns.rows, features: featuresData.rows, anomalies: anomaliesData.rows };
}

export async function getTeamMembers(projectId, client = null) {
  const c = client || pool;
  if (projectId) {
    const result = await c.query(
      `SELECT DISTINCT u.id, u.email, u.first_name, u.last_name, u.role
       FROM users u JOIN campaigns c ON c.test_lead_id = u.id WHERE c.project_id = $1
       UNION
       SELECT DISTINCT u.id, u.email, u.first_name, u.last_name, u.role
       FROM users u JOIN campaign_test_leads ctl ON ctl.user_id = u.id
       JOIN campaigns c ON c.id = ctl.campaign_id WHERE c.project_id = $1
       UNION
       SELECT DISTINCT u.id, u.email, u.first_name, u.last_name, u.role
       FROM users u JOIN anomalies a ON a.assigned_to = u.id OR a.reported_by = u.id
       JOIN campaigns c ON c.id = a.campaign_id WHERE c.project_id = $1
       ORDER BY id`,
      [projectId]
    );
    return result.rows;
  }
  const result = await c.query('SELECT id, email, first_name, last_name, role FROM users ORDER BY id');
  return result.rows;
}

export async function getProjectTeamStats(projectId, client = null) {
  const c = client || pool;
  const result = await c.query(
    `SELECT u.id as "userId",
       COUNT(DISTINCT a_assigned.id) FILTER (WHERE a_assigned.id IS NOT NULL) as "anomaliesAssigned",
       COUNT(DISTINCT a_reported.id) FILTER (WHERE a_reported.id IS NOT NULL) as "anomaliesReported"
     FROM users u
     LEFT JOIN anomalies a_assigned ON a_assigned.assigned_to = u.id
       AND a_assigned.campaign_id IN (SELECT id FROM campaigns WHERE project_id = $1)
     LEFT JOIN anomalies a_reported ON a_reported.reported_by = u.id
       AND a_reported.campaign_id IN (SELECT id FROM campaigns WHERE project_id = $1)
     GROUP BY u.id ORDER BY u.id`,
    [projectId]
  );
  return result.rows;
}
