import pool from '../config/database.js';

/**
 * Colonnes communes aux lectures : le nom du testeur affecte est resolu par
 * jointure, afin que le front n'ait pas a refaire le lien lui-meme.
 */
const SELECT_WITH_TESTER = `
  SELECT tc.*,
         assignee.first_name AS assigned_to_first_name,
         assignee.last_name  AS assigned_to_last_name
  FROM test_cases tc
  LEFT JOIN users assignee ON assignee.id = tc.assigned_to`;

export async function list(featureId, campaignId, client = null) {
  const c = client || pool;
  const conditions = [];
  const params = [];
  let idx = 1;
  if (featureId) { conditions.push(`tc.feature_id = $${idx++}`); params.push(featureId); }
  if (campaignId) { conditions.push(`tc.campaign_id = $${idx++}`); params.push(campaignId); }
  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const result = await c.query(`${SELECT_WITH_TESTER} ${where} ORDER BY tc.created_at ASC`, params);
  return result.rows;
}

export async function findById(id, client = null) {
  const c = client || pool;
  const result = await c.query(`${SELECT_WITH_TESTER} WHERE tc.id = $1`, [id]);
  return result.rows[0] || null;
}

export async function findByName(featureId, name, excludeId = null, client = null) {
  const c = client || pool;
  const result = await c.query(
    `SELECT id FROM test_cases
     WHERE feature_id = $1 AND LOWER(name) = LOWER($2) AND ($3::int IS NULL OR id <> $3)
     LIMIT 1`,
    [featureId, name, excludeId]
  );
  return result.rows[0] || null;
}

export async function create(data, campaignId, client = null) {
  const c = client || pool;
  const result = await c.query(
    `INSERT INTO test_cases (feature_id, campaign_id, name, description, steps, expected_result, priority, type, assigned_to)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id`,
    [data.feature_id, campaignId, data.name, data.description || null, data.steps || null, data.expected_result || null, data.priority || 'medium', data.type || 'fonctionnel', data.assigned_to ?? null]
  );
  // On relit pour renvoyer le nom du testeur affecte, comme les autres lectures.
  if (!result.rows[0]) return null;
  return findById(result.rows[0].id, c);
}

export async function remove(id, client = null) {
  const c = client || pool;
  const result = await c.query('DELETE FROM test_cases WHERE id = $1 RETURNING id', [id]);
  return result.rows[0] || null;
}

export async function update(id, data, client = null) {
  const c = client || pool;
  const fields = [];
  const params = [];
  let idx = 1;
  if (data.name !== undefined) { fields.push(`name = $${idx++}`); params.push(data.name); }
  if (data.description !== undefined) { fields.push(`description = $${idx++}`); params.push(data.description); }
  if (data.expected_result !== undefined) { fields.push(`expected_result = $${idx++}`); params.push(data.expected_result); }
  if (data.steps !== undefined) { fields.push(`steps = $${idx++}`); params.push(data.steps); }
  if (data.priority !== undefined) { fields.push(`priority = $${idx++}`); params.push(data.priority); }
  if (data.type !== undefined) { fields.push(`type = $${idx++}`); params.push(data.type); }
  if (data.feature_id !== undefined) { fields.push(`feature_id = $${idx++}`); params.push(data.feature_id); }
  // `null` retire l'affectation, `undefined` la laisse inchangee : envoyer la
  // colonne absente ne doit pas effacer un choix deja fait.
  if (data.assigned_to !== undefined) { fields.push(`assigned_to = $${idx++}`); params.push(data.assigned_to); }
  if (fields.length === 0) return findById(id, c);
  fields.push('updated_at = NOW()');
  params.push(id);
  const result = await c.query(
    `UPDATE test_cases SET ${fields.join(', ')} WHERE id = $${idx} RETURNING id`,
    params
  );
  // RETURNING * ne rejoint pas le nom du testeur : on relit pour repondre avec
  // la meme forme que les autres lectures (assigned_to_first_name, ...).
  if (!result.rows[0]) return null;
  return findById(id, c);
}

export async function getCampaignIdByFeature(featureId, client = null) {
  const c = client || pool;
  const result = await c.query('SELECT campaign_id FROM features WHERE id = $1', [featureId]);
  return result.rows[0] || null;
}
