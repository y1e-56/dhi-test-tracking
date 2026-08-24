import pool from '../config/database.js';

export async function listByProduct(productId, includeInactive = false, client = null) {
  const c = client || pool;
  let query = 'SELECT * FROM environments WHERE product_id = $1';
  if (!includeInactive) query += ' AND is_active = TRUE';
  query += ' ORDER BY created_at ASC';
  const result = await c.query(query, [productId]);
  return result.rows;
}

export async function findById(id, client = null) {
  const c = client || pool;
  const result = await c.query('SELECT * FROM environments WHERE id = $1', [id]);
  return result.rows[0] || null;
}

export async function findByName(productId, name, excludeId = null, client = null) {
  const c = client || pool;
  const result = await c.query(
    `SELECT id FROM environments
     WHERE product_id = $1 AND LOWER(name) = LOWER($2) AND ($3::int IS NULL OR id <> $3)
     LIMIT 1`,
    [productId, name, excludeId]
  );
  return result.rows[0] || null;
}

export async function create(data, client = null) {
  const c = client || pool;
  const result = await c.query(
    `INSERT INTO environments (product_id, name, type, description, is_active, created_by)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
    [
      data.product_id,
      data.name,
      data.type || 'integration',
      data.description || null,
      data.is_active !== undefined ? data.is_active : true,
      data.created_by || null,
    ]
  );
  return result.rows[0];
}

export async function update(id, data, client = null) {
  const c = client || pool;
  const allowedFields = ['name', 'type', 'description', 'is_active'];
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
    `UPDATE environments SET ${sets.join(', ')} WHERE id = $${idx} RETURNING *`,
    values
  );
  return result.rows[0] || null;
}

export async function remove(id, client = null) {
  const c = client || pool;
  const result = await c.query('DELETE FROM environments WHERE id = $1 RETURNING id', [id]);
  return result.rows[0] || null;
}
