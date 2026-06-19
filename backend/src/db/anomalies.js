import pool from '../config/database.js';
import { paginate } from './helpers/paginate.js';

export async function list(filters = {}, client = null) {
  const c = client || pool;
  const conditions = [];
  const params = [];
  let idx = 1;

  if (filters.campagneId) {
    conditions.push(`a.campaign_id = $${idx++}`);
    params.push(filters.campagneId);
  }
  if (filters.fonctionnaliteId) {
    conditions.push(`a.feature_id = $${idx++}`);
    params.push(filters.fonctionnaliteId);
  }
  if (filters.testeurId) {
    conditions.push(`a.reported_by = $${idx++}`);
    params.push(filters.testeurId);
  }
  if (filters.developpeurId) {
    conditions.push(`a.assigned_to = $${idx++}`);
    params.push(filters.developpeurId);
  }
  if (filters.testCaseId) {
    conditions.push(`a.test_case_id = $${idx++}`);
    params.push(filters.testCaseId);
  }
  if (filters.statut) {
    conditions.push(`a.status = $${idx++}`);
    params.push(filters.statut);
  }
  if (filters.projetId) {
    conditions.push(`camp.project_id = $${idx++}`);
    params.push(filters.projetId);
  }
  if (filters.recherche) {
    conditions.push(`(a.description ILIKE $${idx} OR a.description ILIKE $${idx})`);
    params.push(`%${filters.recherche}%`);
    idx++;
  }
  if (filters.dateDebut) {
    conditions.push(`a.created_at >= $${idx++}`);
    params.push(filters.dateDebut);
  }
  if (filters.dateFin) {
    conditions.push(`a.created_at <= $${idx++}`);
    params.push(filters.dateFin);
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const joins = `
    LEFT JOIN features feat ON feat.id = a.feature_id
    LEFT JOIN campaigns camp ON camp.id = a.campaign_id
    LEFT JOIN projects proj ON proj.id = camp.project_id
    LEFT JOIN users reporter ON reporter.id = a.reported_by
    LEFT JOIN users assignee ON assignee.id = a.assigned_to
  `;

  const select = `
    a.*,
    feat.name AS feature_name,
    camp.name AS campaign_name,
    camp.project_id,
    proj.name AS project_name,
    reporter.first_name AS reporter_first_name,
    reporter.last_name AS reporter_last_name,
    assignee.first_name AS assignee_first_name,
    assignee.last_name AS assignee_last_name
  `;

  const countQuery = `SELECT COUNT(*) FROM anomalies a ${joins} ${where}`;
  const dataQuery = `SELECT ${select} FROM anomalies a ${joins} ${where}`;

  return paginate(c, countQuery, dataQuery, params, {
    page: filters.page,
    limit: filters.limit,
    orderBy: filters.orderBy || 'a.created_at DESC',
  });
}

export async function findById(id, client = null) {
  const c = client || pool;
  const result = await c.query(
    `SELECT a.*,
            feat.name AS feature_name,
            camp.name AS campaign_name,
            camp.project_id,
            proj.name AS project_name,
            reporter.first_name AS reporter_first_name,
            reporter.last_name AS reporter_last_name,
            assignee.first_name AS assignee_first_name,
            assignee.last_name AS assignee_last_name
     FROM anomalies a
     LEFT JOIN features feat ON feat.id = a.feature_id
     LEFT JOIN campaigns camp ON camp.id = a.campaign_id
     LEFT JOIN projects proj ON proj.id = camp.project_id
     LEFT JOIN users reporter ON reporter.id = a.reported_by
     LEFT JOIN users assignee ON assignee.id = a.assigned_to
     WHERE a.id = $1`,
    [id]
  );
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
