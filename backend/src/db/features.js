import pool from '../config/database.js';

export async function findByCampaign(campaignId, client = null) {
  const c = client || pool;
  const params = [];
  let where = '';
  if (campaignId) {
    where = 'WHERE f.campaign_id = $1';
    params.push(campaignId);
  }
  const result = await c.query(
    `SELECT f.*, COALESCE(json_agg(a.*) FILTER (WHERE a.id IS NOT NULL), '[]'::json) AS assignments
     FROM features f LEFT JOIN assignments a ON a.feature_id = f.id ${where}
     GROUP BY f.id ORDER BY f.created_at ASC`,
    params
  );
  return result.rows;
}

export async function findById(id, client = null) {
  const c = client || pool;
  const result = await c.query(
    `SELECT f.*, COALESCE(json_agg(a.*) FILTER (WHERE a.id IS NOT NULL), '[]'::json) AS assignments
     FROM features f LEFT JOIN assignments a ON a.feature_id = f.id
     WHERE f.id = $1 GROUP BY f.id`,
    [id]
  );
  return result.rows[0] || null;
}

export async function create(data, client = null) {
  const c = client || pool;
  const result = await c.query(
    'INSERT INTO features (campaign_id, name, description, priority) VALUES ($1, $2, $3, $4) RETURNING *',
    [data.campaign_id, data.name, data.description || null, data.priority || 'medium']
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
  sets.push(`updated_at = $${idx++}`);
  values.push(new Date());
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
    "UPDATE features SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *",
    [status, id]
  );
  return result.rows[0] || null;
}

export async function setStatusAnomalyDetected(id, client = null) {
  const c = client || pool;
  await c.query(
    "UPDATE features SET status = 'anomaly_detected', updated_at = NOW() WHERE id = $1 AND status != 'conforme'",
    [id]
  );
}

export async function remove(id, client = null) {
  const c = client || pool;
  const result = await c.query('DELETE FROM features WHERE id = $1 RETURNING id', [id]);
  return result.rows[0] || null;
}

export async function getAnomalies(featureId, client = null) {
  const c = client || pool;
  const result = await c.query('SELECT * FROM anomalies WHERE feature_id = $1 ORDER BY created_at DESC', [featureId]);
  return result.rows;
}

export async function validateAnomaliesByFeature(id, client = null) {
  const c = client || pool;
  await c.query(
    `UPDATE anomalies SET status = 'validated', updated_at = NOW()
     WHERE feature_id = $1 AND status NOT IN ('validated', 'rejected')`,
    [id]
  );
}
