import pool from '../config/database.js';

export async function findByUser(userId, client = null) {
  const c = client || pool;
  const result = await c.query(
    `SELECT n.*, a.description as anomaly_description
     FROM notifications n
     LEFT JOIN anomalies a ON a.id = n.anomaly_id
     WHERE n.notified_user_id = $1
     ORDER BY n.created_at DESC`,
    [userId]
  );
  return result.rows;
}

export async function create(data, client = null) {
  const c = client || pool;
  const result = await c.query(
    `INSERT INTO notifications (notified_user_id, anomaly_id, notification_type, description, link_url)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [data.notified_user_id, data.anomaly_id || null, data.notification_type, data.description || null, data.link_url || null]
  );
  return result.rows[0];
}

export async function markAsRead(id, userId, client = null) {
  const c = client || pool;
  const result = await c.query(
    'UPDATE notifications SET is_read = TRUE WHERE id = $1 AND notified_user_id = $2 RETURNING id',
    [id, userId]
  );
  return result.rows[0] || null;
}

export async function markAllAsRead(userId, client = null) {
  const c = client || pool;
  await c.query(
    'UPDATE notifications SET is_read = TRUE WHERE notified_user_id = $1',
    [userId]
  );
}
