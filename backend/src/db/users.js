import pool from '../config/database.js';

export async function findByEmail(email, client = null) {
  const c = client || pool;
  const result = await c.query('SELECT * FROM users WHERE email = $1', [email]);
  return result.rows[0] || null;
}

export async function findById(id, client = null) {
  const c = client || pool;
  const result = await c.query('SELECT * FROM users WHERE id = $1', [id]);
  return result.rows[0] || null;
}

export async function create(data, client = null) {
  const c = client || pool;
  const result = await c.query(
    'INSERT INTO users (email, password_hash, first_name, last_name, role) VALUES ($1, $2, $3, $4, $5) RETURNING *',
    [data.email, data.password_hash, data.firstName, data.lastName, data.role]
  );
  return result.rows[0];
}

export async function update(id, data, client = null) {
  const c = client || pool;
  const allowedFields = ['first_name', 'last_name', 'email'];
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
    `UPDATE users SET ${sets.join(', ')} WHERE id = $${idx} RETURNING *`,
    values
  );
  return result.rows[0] || null;
}

export async function list(client = null) {
  const c = client || pool;
  const result = await c.query("SELECT id, email, first_name, last_name, role, created_at, locked_until, failed_login_attempts, date_suppression FROM users WHERE date_suppression IS NULL ORDER BY id");
  return result.rows;
}

export async function listByRole(role, client = null) {
  const c = client || pool;
  const result = await c.query(
    'SELECT id, email, first_name, last_name, role FROM users WHERE role = $1 ORDER BY id',
    [role]
  );
  return result.rows;
}

export async function incrementFailedAttempts(id, attempts, client = null) {
  const c = client || pool;
  await c.query('UPDATE users SET failed_login_attempts = $1 WHERE id = $2', [attempts, id]);
}

export async function lockUntil(id, lockedUntil, attempts, client = null) {
  const c = client || pool;
  await c.query('UPDATE users SET failed_login_attempts = $1, locked_until = $2 WHERE id = $3', [attempts, lockedUntil, id]);
}

export async function resetFailedAttempts(id, client = null) {
  const c = client || pool;
  await c.query("UPDATE users SET failed_login_attempts = 0, locked_until = NULL WHERE id = $1", [id]);
}

export async function updatePassword(id, passwordHash, client = null) {
  const c = client || pool;
  await c.query('UPDATE users SET password_hash = $1 WHERE id = $2', [passwordHash, id]);
}

export async function block(id, lockedUntil, client = null) {
  const c = client || pool;
  const result = await c.query('UPDATE users SET locked_until = $1 WHERE id = $2 RETURNING id', [lockedUntil, id]);
  return result.rows[0] || null;
}

export async function unblock(id, client = null) {
  const c = client || pool;
  const result = await c.query("UPDATE users SET failed_login_attempts = 0, locked_until = NULL WHERE id = $1 RETURNING id", [id]);
  return result.rows[0] || null;
}

export async function softDelete(id, client = null) {
  const c = client || pool;
  const result = await c.query('UPDATE users SET date_suppression = NOW() WHERE id = $1 RETURNING id', [id]);
  return result.rows[0] || null;
}

export async function restore(id, client = null) {
  const c = client || pool;
  const result = await c.query('UPDATE users SET date_suppression = NULL WHERE id = $1 RETURNING id', [id]);
  return result.rows[0] || null;
}
