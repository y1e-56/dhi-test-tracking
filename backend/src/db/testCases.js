import pool from '../config/database.js';

export async function list(featureId, campaignId, client = null) {
  const c = client || pool;
  const conditions = [];
  const params = [];
  let idx = 1;
  if (featureId) { conditions.push(`feature_id = $${idx++}`); params.push(featureId); }
  if (campaignId) { conditions.push(`campaign_id = $${idx++}`); params.push(campaignId); }
  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const result = await c.query(`SELECT * FROM test_cases ${where} ORDER BY created_at ASC`, params);
  return result.rows;
}

export async function findById(id, client = null) {
  const c = client || pool;
  const result = await c.query('SELECT * FROM test_cases WHERE id = $1', [id]);
  return result.rows[0] || null;
}

export async function create(data, campaignId, client = null) {
  const c = client || pool;
  const result = await c.query(
    `INSERT INTO test_cases (feature_id, campaign_id, name, steps, expected_result, priority)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
    [data.feature_id, campaignId, data.name, data.steps || null, data.expected_result || null, data.priority || 'medium']
  );
  return result.rows[0];
}

export async function remove(id, client = null) {
  const c = client || pool;
  const result = await c.query('DELETE FROM test_cases WHERE id = $1 RETURNING id', [id]);
  return result.rows[0] || null;
}

export async function getCampaignIdByFeature(featureId, client = null) {
  const c = client || pool;
  const result = await c.query('SELECT campaign_id FROM features WHERE id = $1', [featureId]);
  return result.rows[0] || null;
}
