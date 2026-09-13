import pool from '../config/database.js';

const COLUMNS = 'id, domain, label, threshold, active, created_at, updated_at';

export async function listRules(client = null) {
  const c = client || pool;
  const result = await c.query(
    `SELECT ${COLUMNS} FROM referential_rules ORDER BY id ASC`
  );
  return result.rows;
}

export async function findRule(id, client = null) {
  const c = client || pool;
  const result = await c.query(
    `SELECT ${COLUMNS} FROM referential_rules WHERE id = $1 LIMIT 1`,
    [id]
  );
  return result.rows[0] || null;
}

export async function updateRule(id, patch, client = null) {
  const c = client || pool;
  const fields = [];
  const params = [];
  const columns = ['domain', 'label', 'threshold', 'active'];
  for (const col of columns) {
    if (patch[col] !== undefined) {
      params.push(patch[col]);
      fields.push(`${col} = $${params.length}`);
    }
  }
  if (fields.length === 0) return findRule(id, c);
  params.push(id);
  const result = await c.query(
    `UPDATE referential_rules SET ${fields.join(', ')}, updated_at = NOW()
     WHERE id = $${params.length} RETURNING ${COLUMNS}`,
    params
  );
  return result.rows[0] || null;
}

export async function createRule(data, client = null) {
  const c = client || pool;
  const result = await c.query(
    `INSERT INTO referential_rules (id, domain, label, threshold, active)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (id) DO UPDATE SET
       domain = EXCLUDED.domain, label = EXCLUDED.label,
       threshold = EXCLUDED.threshold, active = EXCLUDED.active, updated_at = NOW()
     RETURNING ${COLUMNS}`,
    [data.id, data.domain, data.label, data.threshold, data.active ?? true]
  );
  return result.rows[0];
}

export async function deleteRule(id, client = null) {
  const c = client || pool;
  const result = await c.query(
    'DELETE FROM referential_rules WHERE id = $1 RETURNING id',
    [id]
  );
  return result.rows[0] || null;
}