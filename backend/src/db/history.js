import pool from '../config/database.js';

export async function addAction(data, client = null) {
  const c = client || pool;
  await c.query(
    `INSERT INTO history_actions (entity_type, entity_id, user_id, action_type, description)
     VALUES ($1, $2, $3, $4, $5)`,
    [data.entity_type, data.entity_id, data.user_id || null, data.action_type, data.description || null]
  );
}

export async function findByEntity(entityType, entityId, client = null) {
  const c = client || pool;
  const result = await c.query(
    'SELECT * FROM history_actions WHERE entity_type = $1 AND entity_id = $2 ORDER BY created_at DESC',
    [entityType, entityId]
  );
  return result.rows;
}

export async function list(userId, campaignId, client = null) {
  const c = client || pool;
  const conditions = [];
  const params = [];
  let idx = 1;

  if (userId) {
    conditions.push(`h.user_id = $${idx++}`);
    params.push(userId);
  }
  if (campaignId) {
    conditions.push(`(h.entity_type = 'campaign' AND h.entity_id = $${idx++})`);
    params.push(campaignId);
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const result = await c.query(
    `SELECT h.*, u.first_name, u.last_name FROM history_actions h LEFT JOIN users u ON u.id = h.user_id ${where} ORDER BY h.created_at DESC LIMIT 50`,
    params
  );
  return result.rows;
}

export async function deleteByProject(projectId, client) {
  await client.query(
    `DELETE FROM history_actions
     WHERE (entity_type = 'project' AND entity_id = $1)
        OR (entity_type = 'campaign' AND entity_id IN (SELECT id FROM campaigns WHERE project_id = $1))
        OR (entity_type = 'feature' AND entity_id IN (SELECT id FROM features WHERE campaign_id IN (SELECT id FROM campaigns WHERE project_id = $1)))
        OR (entity_type = 'anomaly' AND entity_id IN (SELECT id FROM anomalies WHERE feature_id IN (SELECT id FROM features WHERE campaign_id IN (SELECT id FROM campaigns WHERE project_id = $1))))`,
    [projectId]
  );
}

export async function listRecent(limit = 20, client = null) {
  const c = client || pool;
  const result = await c.query(
    `SELECT h.*, u.first_name, u.last_name FROM history_actions h LEFT JOIN users u ON u.id = h.user_id ORDER BY h.created_at DESC LIMIT $1`,
    [limit]
  );
  return result.rows;
}
