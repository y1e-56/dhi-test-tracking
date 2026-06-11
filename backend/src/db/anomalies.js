import pool from '../config/database.js';

export async function list(filters = {}, client = null) {
  const c = client || pool;
  const conditions = [];
  const params = [];
  let idx = 1;
  if (filters.campaignId) { conditions.push(`campaign_id = $${idx++}`); params.push(filters.campaignId); }
  if (filters.featureId) { conditions.push(`feature_id = $${idx++}`); params.push(filters.featureId); }
  if (filters.assignedTo) { conditions.push(`assigned_to = $${idx++}`); params.push(filters.assignedTo); }
  if (filters.reportedBy) { conditions.push(`reported_by = $${idx++}`); params.push(filters.reportedBy); }
  if (filters.testCaseId) { conditions.push(`test_case_id = $${idx++}`); params.push(filters.testCaseId); }
  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const result = await c.query(`SELECT * FROM anomalies ${where} ORDER BY created_at DESC`, params);
  return result.rows;
}

export async function findById(id, client = null) {
  const c = client || pool;
  const result = await c.query('SELECT * FROM anomalies WHERE id = $1', [id]);
  return result.rows[0] || null;
}

export async function create(data, client = null) {
  const c = client || pool;
  const result = await c.query(
    `INSERT INTO anomalies (feature_id, campaign_id, test_case_id, description, reported_by, assigned_to)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
    [data.feature_id, data.campaign_id, data.test_case_id || null, data.description, data.reported_by || null, data.assigned_to || null]
  );
  return result.rows[0];
}

export async function update(id, data, client = null) {
  const c = client || pool;
  const allowedFields = ['description', 'assigned_to', 'status', 'resolution_description', 'test_case_id'];
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
    `UPDATE anomalies SET ${sets.join(', ')} WHERE id = $${idx} RETURNING *`,
    values
  );
  return result.rows[0] || null;
}

export async function remove(id, client = null) {
  const c = client || pool;
  const result = await c.query('DELETE FROM anomalies WHERE id = $1 RETURNING id', [id]);
  return result.rows[0] || null;
}
