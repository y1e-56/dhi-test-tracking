import pool from '../config/database.js';
import { paginate } from './helpers/paginate.js';

export async function list(projectId, client = null) {
  const c = client || pool;
  const params = [];
  let query = 'SELECT * FROM campaigns';
  if (projectId) {
    query += ' WHERE project_id = $1';
    params.push(projectId);
  }
  query += ' ORDER BY created_at DESC';
  const result = await c.query(query, params);
  return attachTestLeadIds(result.rows, c);
}

export async function listPaginated(filters = {}, client = null) {
  const c = client || pool;
  const conditions = [];
  const params = [];
  let idx = 1;

  if (filters.projetId) {
    conditions.push(`c.project_id = $${idx++}`);
    params.push(filters.projetId);
  }
  if (filters.statut) {
    conditions.push(`c.status = $${idx++}`);
    params.push(filters.statut);
  } else {
    conditions.push(`c.status != 'archived'`);
  }
  if (filters.recherche) {
    conditions.push(`(c.name ILIKE $${idx} OR c.objective ILIKE $${idx})`);
    params.push(`%${filters.recherche}%`);
    idx++;
  }
  if (filters.chefTesteurId) {
    conditions.push(`ctl.user_id = $${idx++}`);
    params.push(filters.chefTesteurId);
  }
  if (filters.dateDebut) {
    conditions.push(`c.created_at >= $${idx++}`);
    params.push(filters.dateDebut);
  }
  if (filters.dateFin) {
    conditions.push(`c.created_at <= $${idx++}`);
    params.push(filters.dateFin);
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const joins = `LEFT JOIN campaign_test_leads ctl ON ctl.campaign_id = c.id`;

  const countQuery = `SELECT COUNT(DISTINCT c.id) FROM campaigns c ${joins} ${where}`;
  const dataQuery = `SELECT DISTINCT c.* FROM campaigns c ${joins} ${where}`;

  const result = await paginate(c, countQuery, dataQuery, params, {
    page: filters.page,
    limit: filters.limit,
    orderBy: filters.orderBy || 'c.created_at DESC',
  });

  result.data = await attachTestLeadIds(result.data, c);
  return result;
}

export async function findById(id, client = null) {
  const c = client || pool;
  const result = await c.query('SELECT * FROM campaigns WHERE id = $1', [id]);
  const rows = await attachTestLeadIds(result.rows, c);
  return rows[0] || null;
}

export async function create(data, client = null) {
  const c = client || pool;
  const result = await c.query(
    `INSERT INTO campaigns (project_id, name, objective, organization_mode, start_date, end_date)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
    [data.project_id, data.name, data.objective || null, data.organization_mode || 'exploratory',
     data.start_date || null, data.end_date || null]
  );
  const campaign = result.rows[0];
  if (data.test_lead_ids && data.test_lead_ids.length > 0) {
    await setTestLeads(campaign.id, data.test_lead_ids, c);
  }
  campaign.test_leads = data.test_lead_ids || [];
  return campaign;
}

export async function update(id, data, client = null) {
  const c = client || pool;
  const allowedFields = ['name', 'objective', 'organization_mode', 'start_date', 'end_date', 'status'];
  const sets = [];
  const values = [];
  let idx = 1;
  for (const field of allowedFields) {
    if (data[field] !== undefined) {
      sets.push(`${field} = $${idx++}`);
      values.push(data[field]);
    }
  }
  if (sets.length === 0 && data.test_lead_ids === undefined) throw new Error('Aucune donnée à mettre à jour');
  if (sets.length > 0) {
    values.push(id);
    await c.query(
      `UPDATE campaigns SET ${sets.join(', ')} WHERE id = $${idx} RETURNING *`,
      values
    );
  }
  if (data.test_lead_ids !== undefined) {
    await setTestLeads(id, data.test_lead_ids, c);
  }
  return findById(id, c);
}

export async function archiveByProject(projectId, client = null) {
  const c = client || pool;
  const result = await c.query(
    `UPDATE campaigns SET status = 'archived' WHERE project_id = $1 AND status != 'archived' RETURNING id`,
    [projectId]
  );
  return result.rows.map(r => r.id);
}

export async function remove(id, client = null) {
  const c = client || pool;
  const result = await c.query('DELETE FROM campaigns WHERE id = $1 RETURNING id', [id]);
  return result.rows[0] || null;
}

export async function getStats(campaignId, client = null) {
  const c = client || pool;
  const [features, anomalies] = await Promise.all([
    c.query('SELECT status, COUNT(*)::int as count FROM features WHERE campaign_id = $1 GROUP BY status', [campaignId]),
    c.query('SELECT status, COUNT(*)::int as count FROM anomalies WHERE campaign_id = $1 GROUP BY status', [campaignId]),
  ]);
  const totalFeatures = features.rows.reduce((acc, r) => acc + r.count, 0);
  const totalAnomalies = anomalies.rows.reduce((acc, r) => acc + r.count, 0);
  return { totalFeatures, totalAnomalies, featuresByStatus: features.rows, anomaliesByStatus: anomalies.rows };
}

export async function findCampaignNameAndLead(id, client = null) {
  const c = client || pool;
  const result = await c.query(
    'SELECT name as campaign_name, test_lead_id FROM campaigns WHERE id = $1',
    [id]
  );
  return result.rows[0] || null;
}

export async function getTestLeadIds(campaignId, client = null) {
  const c = client || pool;
  const result = await c.query(
    'SELECT user_id FROM campaign_test_leads WHERE campaign_id = $1 ORDER BY id',
    [campaignId]
  );
  return result.rows.map(r => r.user_id);
}

export async function setTestLeads(campaignId, userIds, client = null) {
  const c = client || pool;
  await c.query('DELETE FROM campaign_test_leads WHERE campaign_id = $1', [campaignId]);
  for (const userId of userIds) {
    await c.query(
      'INSERT INTO campaign_test_leads (campaign_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [campaignId, userId]
    );
  }
}

async function attachTestLeadIds(rows, client) {
  if (!rows || rows.length === 0) return rows;
  const ids = rows.map(r => r.id);
  const result = await client.query(
    'SELECT campaign_id, user_id FROM campaign_test_leads WHERE campaign_id = ANY($1) ORDER BY campaign_id, id',
    [ids]
  );
  const map = {};
  for (const row of result.rows) {
    if (!map[row.campaign_id]) map[row.campaign_id] = [];
    map[row.campaign_id].push(row.user_id);
  }
  for (const row of rows) {
    row.test_leads = map[row.id] || [];
  }
  return rows;
}
