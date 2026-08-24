import pool from '../config/database.js';
import { paginate } from './helpers/paginate.js';

const COUNTS_SQL = `
  SELECT
    (SELECT COUNT(*)::int FROM projects WHERE product_id = $1) AS projects_count,
    (SELECT COUNT(*)::int FROM releases WHERE product_id = $1) AS releases_count,
    (SELECT COUNT(*)::int FROM environments WHERE product_id = $1) AS environments_count
`;

async function attachCounts(rows, c) {
  if (!rows || rows.length === 0) return rows;
  for (const row of rows) {
    const counts = await c.query(COUNTS_SQL, [row.id]);
    row.projects_count = counts.rows[0].projects_count;
    row.releases_count = counts.rows[0].releases_count;
    row.environments_count = counts.rows[0].environments_count;
  }
  return rows;
}

export async function list(includeArchived = false, client = null) {
  const c = client || pool;
  let query = 'SELECT * FROM products';
  if (!includeArchived) query += ' WHERE is_archived = FALSE';
  query += ' ORDER BY created_at DESC';
  const result = await c.query(query);
  return attachCounts(result.rows, c);
}

export async function listPaginated(filters = {}, client = null) {
  const c = client || pool;
  const conditions = [];
  const params = [];
  let idx = 1;

  if (filters.recherche) {
    conditions.push(`(p.name ILIKE $${idx} OR p.description ILIKE $${idx})`);
    params.push(`%${filters.recherche}%`);
    idx++;
  }
  if (filters.statut === 'actif') {
    conditions.push('p.is_archived = FALSE');
  } else if (filters.statut === 'archive') {
    conditions.push('p.is_archived = TRUE');
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const countQuery = `SELECT COUNT(*) FROM products p ${where}`;
  const dataQuery = `SELECT p.* FROM products p ${where}`;

  return paginate(c, countQuery, dataQuery, params, {
    page: filters.page,
    limit: filters.limit,
    orderBy: filters.orderBy || 'p.created_at DESC',
  });
}

export async function findById(id, client = null) {
  const c = client || pool;
  const result = await c.query('SELECT * FROM products WHERE id = $1', [id]);
  return result.rows[0] || null;
}

export async function findByIdWithCounts(id, client = null) {
  const product = await findById(id, client);
  if (!product) return null;
  const [withCounts] = await attachCounts([product], client || pool);
  return withCounts;
}

export async function findByName(name, excludeId = null, client = null) {
  const c = client || pool;
  const result = await c.query(
    `SELECT id FROM products
     WHERE LOWER(name) = LOWER($1) AND ($2::int IS NULL OR id <> $2)
     LIMIT 1`,
    [name, excludeId]
  );
  return result.rows[0] || null;
}

export async function create(data, client = null) {
  const c = client || pool;
  const result = await c.query(
    `INSERT INTO products (name, description, owner_id, quality_manager_id, created_by)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [
      data.name,
      data.description || null,
      data.owner_id || null,
      data.quality_manager_id || null,
      data.created_by || null,
    ]
  );
  return result.rows[0];
}

export async function update(id, data, client = null) {
  const c = client || pool;
  const allowedFields = ['name', 'description', 'owner_id', 'quality_manager_id', 'is_archived'];
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
    `UPDATE products SET ${sets.join(', ')} WHERE id = $${idx} RETURNING *`,
    values
  );
  return result.rows[0] || null;
}

export async function remove(id, client = null) {
  const c = client || pool;
  const result = await c.query('DELETE FROM products WHERE id = $1 RETURNING id', [id]);
  return result.rows[0] || null;
}

export async function countProjects(productId, client = null) {
  const c = client || pool;
  const result = await c.query('SELECT COUNT(*)::int AS count FROM projects WHERE product_id = $1', [productId]);
  return result.rows[0].count;
}

export async function getProjects(productId, client = null) {
  const c = client || pool;
  const result = await c.query(
    'SELECT * FROM projects WHERE product_id = $1 ORDER BY created_at DESC',
    [productId]
  );
  return result.rows;
}
