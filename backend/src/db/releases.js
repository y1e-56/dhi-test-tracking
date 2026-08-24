import pool from '../config/database.js';

export async function listByProduct(productId, client = null) {
  const c = client || pool;
  const result = await c.query(
    'SELECT * FROM releases WHERE product_id = $1 ORDER BY created_at DESC',
    [productId]
  );
  return result.rows;
}

export async function findById(id, client = null) {
  const c = client || pool;
  const result = await c.query('SELECT * FROM releases WHERE id = $1', [id]);
  return result.rows[0] || null;
}

export async function findByVersion(productId, version, excludeId = null, client = null) {
  const c = client || pool;
  const result = await c.query(
    `SELECT id FROM releases
     WHERE product_id = $1 AND LOWER(version) = LOWER($2) AND ($3::int IS NULL OR id <> $3)
     LIMIT 1`,
    [productId, version, excludeId]
  );
  return result.rows[0] || null;
}

export async function create(data, client = null) {
  const c = client || pool;
  const result = await c.query(
    `INSERT INTO releases (product_id, version, description, status, planned_date, released_at, created_by)
     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
    [
      data.product_id,
      data.version,
      data.description || null,
      data.status || 'planned',
      data.planned_date || null,
      data.released_at || null,
      data.created_by || null,
    ]
  );
  return result.rows[0];
}

export async function update(id, data, client = null) {
  const c = client || pool;
  const allowedFields = ['version', 'description', 'status', 'planned_date', 'released_at'];
  const sets = ['updated_at = NOW()'];
  const values = [];
  let idx = 1;
  for (const field of allowedFields) {
    if (data[field] !== undefined) {
      sets.push(`${field} = $${idx++}`);
      values.push(data[field]);
    }
  }
  if (values.length === 0) {
    return findById(id, c);
  }
  values.push(id);
  const result = await c.query(
    `UPDATE releases SET ${sets.join(', ')} WHERE id = $${idx} RETURNING *`,
    values
  );
  return result.rows[0] || null;
}

export async function remove(id, client = null) {
  const c = client || pool;
  const result = await c.query('DELETE FROM releases WHERE id = $1 RETURNING id', [id]);
  return result.rows[0] || null;
}

export async function countCampaigns(releaseId, client = null) {
  const c = client || pool;
  const result = await c.query('SELECT COUNT(*)::int AS count FROM campaigns WHERE release_id = $1', [releaseId]);
  return result.rows[0].count;
}
