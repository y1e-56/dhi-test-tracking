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

export async function findByName(featureId, name, excludeId = null, client = null) {
  const c = client || pool;
  const result = await c.query(
    `SELECT id FROM test_cases
     WHERE feature_id = $1 AND LOWER(name) = LOWER($2) AND ($3::int IS NULL OR id <> $3)
     LIMIT 1`,
    [featureId, name, excludeId]
  );
  return result.rows[0] || null;
}

export async function create(data, campaignId, client = null) {
  const c = client || pool;
  const result = await c.query(
    `INSERT INTO test_cases (feature_id, campaign_id, name, description, steps, expected_result, priority, type)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
    [data.feature_id, campaignId, data.name, data.description || null, data.steps || null, data.expected_result || null, data.priority || 'medium', data.type || 'fonctionnel']
  );
  return result.rows[0];
}

export async function remove(id, client = null) {
  const c = client || pool;
  const result = await c.query('DELETE FROM test_cases WHERE id = $1 RETURNING id', [id]);
  return result.rows[0] || null;
}

export async function update(id, data, client = null) {
  const c = client || pool;
  const fields = [];
  const params = [];
  let idx = 1;
  if (data.name !== undefined) { fields.push(`name = $${idx++}`); params.push(data.name); }
  if (data.description !== undefined) { fields.push(`description = $${idx++}`); params.push(data.description); }
  if (data.expected_result !== undefined) { fields.push(`expected_result = $${idx++}`); params.push(data.expected_result); }
  if (data.steps !== undefined) { fields.push(`steps = $${idx++}`); params.push(data.steps); }
  if (data.priority !== undefined) { fields.push(`priority = $${idx++}`); params.push(data.priority); }
  if (data.type !== undefined) { fields.push(`type = $${idx++}`); params.push(data.type); }
  if (data.feature_id !== undefined) { fields.push(`feature_id = $${idx++}`); params.push(data.feature_id); }
  if (fields.length === 0) return findById(id, c);
  fields.push('updated_at = NOW()');
  params.push(id);
  const result = await c.query(
    `UPDATE test_cases SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`,
    params
  );
  return result.rows[0] || null;
}

export async function getCampaignIdByFeature(featureId, client = null) {
  const c = client || pool;
  const result = await c.query('SELECT campaign_id FROM features WHERE id = $1', [featureId]);
  return result.rows[0] || null;
}
