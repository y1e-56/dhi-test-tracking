import pool from '../config/database.js';

async function attachTestLeadIds(rows, client) {
  if (!rows || rows.length === 0) return rows;
  const ids = rows.map(r => r.id);
  const result = await client.query(
    'SELECT project_id, user_id FROM project_test_leads WHERE project_id = ANY($1) ORDER BY project_id, id',
    [ids]
  );
  const map = {};
  for (const row of result.rows) {
    if (!map[row.project_id]) map[row.project_id] = [];
    map[row.project_id].push(row.user_id);
  }
  for (const row of rows) {
    row.test_lead_ids = map[row.id] || [];
  }
  return rows;
}

export async function list(includeArchived = false, client = null) {
  const c = client || pool;
  let query = 'SELECT * FROM projects';
  if (!includeArchived) query += ' WHERE is_archived = FALSE';
  query += ' ORDER BY created_at DESC';
  const result = await c.query(query);
  return attachTestLeadIds(result.rows, c);
}

export async function findById(id, client = null) {
  const c = client || pool;
  const result = await c.query('SELECT * FROM projects WHERE id = $1', [id]);
  if (!result.rows[0]) return null;
  const rows = await attachTestLeadIds([result.rows[0]], c);
  return rows[0];
}

export async function create(data, client = null) {
  const c = client || pool;
  const result = await c.query(
    'INSERT INTO projects (name, description, start_date, end_date, created_by) VALUES ($1, $2, $3, $4, $5) RETURNING *',
    [data.name, data.description || null, data.start_date || null, data.end_date || null, data.created_by]
  );
  const project = result.rows[0];
  if (data.test_lead_ids && data.test_lead_ids.length > 0) {
    await setTestLeads(project.id, data.test_lead_ids, c);
  }
  project.test_lead_ids = data.test_lead_ids || [];
  return project;
}

export async function update(id, data, client = null) {
  const c = client || pool;
  const allowedFields = ['name', 'description', 'start_date', 'end_date', 'is_archived'];
  const sets = [];
  const values = [];
  let idx = 1;
  for (const field of allowedFields) {
    if (data[field] !== undefined) {
      sets.push(`${field} = $${idx++}`);
      values.push(data[field]);
    }
  }
  if (data.test_lead_ids !== undefined) {
    await setTestLeads(id, data.test_lead_ids, c);
  }
  if (sets.length === 0) {
    const project = await findById(id, c);
    return project;
  }
  values.push(id);
  const result = await c.query(
    `UPDATE projects SET ${sets.join(', ')} WHERE id = $${idx} RETURNING *`,
    values
  );
  if (!result.rows[0]) return null;
  const rows = await attachTestLeadIds([result.rows[0]], c);
  return rows[0];
}

export async function remove(id, client = null) {
  const c = client || pool;
  const result = await c.query('DELETE FROM projects WHERE id = $1 RETURNING id', [id]);
  return result.rows[0] || null;
}

export async function getCampaigns(projectId, client = null) {
  const c = client || pool;
  const result = await c.query('SELECT * FROM campaigns WHERE project_id = $1 ORDER BY created_at DESC', [projectId]);
  return result.rows;
}

export async function setTestLeads(projectId, userIds, client = null) {
  const c = client || pool;
  await c.query('DELETE FROM project_test_leads WHERE project_id = $1', [projectId]);
  for (const userId of userIds) {
    await c.query(
      'INSERT INTO project_test_leads (project_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [projectId, userId]
    );
  }
}

export async function getTestLeadIds(projectId, client = null) {
  const c = client || pool;
  const result = await c.query(
    'SELECT user_id FROM project_test_leads WHERE project_id = $1 ORDER BY id',
    [projectId]
  );
  return result.rows.map(r => r.user_id);
}

export async function listByTestLeadUserId(userId, includeArchived = false, client = null) {
  const c = client || pool;
  let query = `SELECT p.* FROM projects p
    INNER JOIN project_test_leads ptl ON ptl.project_id = p.id
    WHERE ptl.user_id = $1`;
  if (!includeArchived) query += ' AND p.is_archived = FALSE';
  query += ' ORDER BY p.created_at DESC';
  const result = await c.query(query, [userId]);
  return attachTestLeadIds(result.rows, c);
}
