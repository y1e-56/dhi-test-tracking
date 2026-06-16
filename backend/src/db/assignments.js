import pool from '../config/database.js';

export async function findById(id, client = null) {
  const c = client || pool;
  const result = await c.query('SELECT * FROM assignments WHERE id = $1', [id]);
  return result.rows[0] || null;
}

export async function create(featureId, assignedTo, client = null) {
  const c = client || pool;
  const result = await c.query(
    `INSERT INTO assignments (feature_id, assigned_to) VALUES ($1, $2)
     ON CONFLICT (feature_id, assigned_to) DO UPDATE SET assigned_at = NOW() RETURNING *`,
    [featureId, assignedTo]
  );
  return result.rows[0];
}

export async function update(id, data, client = null) {
  const c = client || pool;
  const allowedFields = ['assigned_to', 'status'];
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
  values.push(id);
  const result = await c.query(
    `UPDATE assignments SET ${sets.join(', ')} WHERE id = $${idx} RETURNING *`,
    values
  );
  return result.rows[0] || null;
}

export async function remove(id, client = null) {
  const c = client || pool;
  const result = await c.query('DELETE FROM assignments WHERE id = $1 RETURNING id', [id]);
  return result.rows[0] || null;
}

export async function findByUser(userId, client = null) {
  const c = client || pool;
  const result = await c.query('SELECT * FROM assignments WHERE assigned_to = $1 ORDER BY assigned_at DESC', [userId]);
  return result.rows;
}

export async function findByCampaign(campaignId, client = null) {
  const c = client || pool;
  const result = await c.query(
    `SELECT a.*, f.name as feature_name FROM assignments a
     JOIN features f ON f.id = a.feature_id
     WHERE f.campaign_id = $1 ORDER BY a.assigned_at DESC`,
    [campaignId]
  );
  return result.rows;
}

export async function findByFeature(featureId, client = null) {
  const c = client || pool;
  const result = await c.query(
    `SELECT a.*, u.id as user_id, u.email, u.first_name, u.last_name, u.role
     FROM assignments a JOIN users u ON u.id = a.assigned_to
     WHERE a.feature_id = $1 ORDER BY a.assigned_at DESC`,
    [featureId]
  );
  return result.rows;
}
