import pool from '../config/database.js';
import { paginate } from './helpers/paginate.js';

export async function findByCampaign(campaignId, client = null) {
  const c = client || pool;
  const result = await c.query(
    `SELECT f.*,
            COALESCE(
              json_agg(
                json_build_object(
                  'id', a.id,
                  'assigned_to', a.assigned_to,
                  'assigned_at', a.assigned_at,
                  'status', a.status
                )
              ) FILTER (WHERE a.id IS NOT NULL),
              '[]'
            ) AS assignments
     FROM features f
     LEFT JOIN assignments a ON a.feature_id = f.id
     WHERE f.campaign_id = $1
     GROUP BY f.id
     ORDER BY f.created_at ASC`,
    [campaignId]
  );
  return result.rows;
}

export async function findByCampaignPaginated(filters = {}, client = null) {
  const c = client || pool;
  const conditions = [];
  const params = [];
  let idx = 1;

  if (filters.campaignId) {
    conditions.push(`f.campaign_id = $${idx++}`);
    params.push(filters.campaignId);
  }
  if (filters.recherche) {
    conditions.push(`(f.name ILIKE $${idx} OR f.description ILIKE $${idx})`);
    params.push(`%${filters.recherche}%`);
    idx++;
  }
  if (filters.statut) {
    conditions.push(`f.status = $${idx++}`);
    params.push(filters.statut);
  }
  if (filters.priorite) {
    conditions.push(`f.priority = $${idx++}`);
    params.push(filters.priorite);
  }
  if (filters.assigneeId) {
    conditions.push(`a.assigned_to = $${idx++}`);
    params.push(filters.assigneeId);
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const joins = `
    LEFT JOIN assignments a ON a.feature_id = f.id
    LEFT JOIN users assigned_user ON assigned_user.id = a.assigned_to
  `;

  const select = `f.*, a.assigned_to AS testeur_assigne_id, a.id AS assignment_id, a.assigned_at AS date_assignation,
    assigned_user.first_name AS assignee_first_name, assigned_user.last_name AS assignee_last_name`;

  const countQuery = `SELECT COUNT(DISTINCT f.id) FROM features f ${joins} ${where}`;
  const dataQuery = `SELECT ${select} FROM features f ${joins} ${where}`;

  const result = await paginate(c, countQuery, dataQuery, params, {
    page: filters.page,
    limit: filters.limit,
    orderBy: filters.orderBy || 'f.created_at ASC',
  });

  // Deduplicate features in case of multiple assignments
  const seen = new Set();
  result.data = result.data.filter(f => {
    if (seen.has(f.id)) return false;
    seen.add(f.id);
    return true;
  });

  return result;
}

export async function findById(id, client = null) {
  const c = client || pool;
  const result = await c.query(
    `SELECT f.*,
            COALESCE(
              json_agg(
                json_build_object(
                  'id', a.id,
                  'assigned_to', a.assigned_to,
                  'assigned_at', a.assigned_at,
                  'status', a.status
                )
              ) FILTER (WHERE a.id IS NOT NULL),
              '[]'
            ) AS assignments
     FROM features f
     LEFT JOIN assignments a ON a.feature_id = f.id
     WHERE f.id = $1
     GROUP BY f.id`,
    [id]
  );
  return result.rows[0] || null;
}

export async function create(data, client = null) {
  const c = client || pool;
  const result = await c.query(
    `INSERT INTO features (campaign_id, name, description, priority, status)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [data.campaign_id, data.name, data.description || null, data.priority || 'medium', data.status || 'pending']
  );
  return result.rows[0];
}

export async function update(id, data, client = null) {
  const c = client || pool;
  const allowedFields = ['name', 'description', 'priority', 'status'];
  const sets = [];
  const values = [];
  let idx = 1;
  for (const field of allowedFields) {
    if (data[field] !== undefined) {
      sets.push(`${field} = $${idx++}`);
      values.push(data[field]);
    }
  }
  if (sets.length === 0) throw new Error('Aucune donnée à mettre à jour');
  sets.push('updated_at = NOW()');
  values.push(id);
  const result = await c.query(
    `UPDATE features SET ${sets.join(', ')} WHERE id = $${idx} RETURNING *`,
    values
  );
  return result.rows[0] || null;
}

export async function updateStatus(id, status, client = null) {
  const c = client || pool;
  const result = await c.query(
    `UPDATE features SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
    [status, id]
  );
  return result.rows[0] || null;
}

export async function setStatusAnomalyDetected(featureId, client = null) {
  return updateStatus(featureId, 'anomaly_detected', client);
}

export async function remove(id, client = null) {
  const c = client || pool;
  const result = await c.query('DELETE FROM features WHERE id = $1 RETURNING id', [id]);
  return result.rows[0] || null;
}

export async function getAnomalies(featureId, client = null) {
  const c = client || pool;
  const result = await c.query(
    'SELECT * FROM anomalies WHERE feature_id = $1 ORDER BY created_at DESC',
    [featureId]
  );
  return result.rows;
}

export async function validateAnomaliesByFeature(featureId, client = null) {
  const c = client || pool;
  await c.query(
    `UPDATE anomalies SET status = 'validated', updated_at = NOW() WHERE feature_id = $1 AND status = 'resolution_signaled'`,
    [featureId]
  );
}
