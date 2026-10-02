import pool, { withTransaction } from '../config/database.js';
import { paginate } from './helpers/paginate.js';

/**
 * Agrège les fonctionnalités liées dans un tableau d'ids.
 * Repli sur requirements.feature_id tant que la ligne n'a pas été migrée
 * (ou qu'elle a été créée hors de la table de jointure).
 */
const FEATURE_IDS_AGG = `COALESCE(
  (SELECT array_agg(rf.feature_id ORDER BY rf.feature_id)
     FROM requirement_features rf WHERE rf.requirement_id = r.id),
  CASE WHEN r.feature_id IS NOT NULL THEN ARRAY[r.feature_id] ELSE NULL END
) AS feature_ids`;

/** Une exigence est rattachée à la fonctionnalité via la jointure OU l'ancienne colonne directe. */
const featureMatch = (placeholder) => `(
  r.feature_id = ${placeholder}
  OR EXISTS (SELECT 1 FROM requirement_features rf WHERE rf.requirement_id = r.id AND rf.feature_id = ${placeholder})
)`;

export async function findById(id, client = null) {
  const c = client || pool;
  const result = await c.query(
    `SELECT r.*, f.name AS feature_name, ${FEATURE_IDS_AGG}
     FROM requirements r
     LEFT JOIN features f ON f.id = r.feature_id
     WHERE r.id = $1`,
    [id]
  );
  return result.rows[0] || null;
}

export async function findByFeature(featureId, client = null) {
  const c = client || pool;
  const result = await c.query(
    `SELECT r.*, f.name AS feature_name, ${FEATURE_IDS_AGG}
     FROM requirements r
     LEFT JOIN features f ON f.id = r.feature_id
     WHERE ${featureMatch('$1')}
     ORDER BY r.created_at DESC`,
    [featureId]
  );
  return result.rows;
}

export async function findByFeaturePaginated(filters = {}, client = null) {
  const c = client || pool;
  const conditions = [];
  const params = [];
  let idx = 1;

  if (filters.featureId) {
    conditions.push(featureMatch(`$${idx++}`));
    params.push(filters.featureId);
  }
  if (filters.productId) {
    conditions.push(`r.product_id = $${idx++}`);
    params.push(filters.productId);
  }
  if (filters.categorie) {
    conditions.push(`r.category = $${idx++}`);
    params.push(filters.categorie);
  }
  if (filters.statut) {
    conditions.push(`r.status = $${idx++}`);
    params.push(filters.statut);
  }
  if (filters.priorite) {
    conditions.push(`r.priority = $${idx++}`);
    params.push(filters.priorite);
  }
  if (filters.recherche) {
    conditions.push(`(r.title ILIKE $${idx} OR r.description ILIKE $${idx})`);
    params.push(`%${filters.recherche}%`);
    idx++;
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const countQuery = `SELECT COUNT(*) FROM requirements r ${where}`;
  const dataQuery = `SELECT r.*, f.name AS feature_name, ${FEATURE_IDS_AGG} FROM requirements r LEFT JOIN features f ON f.id = r.feature_id ${where}`;
  return paginate(c, countQuery, dataQuery, params, {
    page: filters.page,
    limit: filters.limit,
    orderBy: 'r.created_at DESC',
  });
}

/** Remplace l'ensemble des liaisons d'une exigence. */
async function replaceFeatureLinks(c, requirementId, featureIds) {
  await c.query('DELETE FROM requirement_features WHERE requirement_id = $1', [requirementId]);
  const unique = [...new Set(featureIds.filter((id) => Number.isInteger(id) && id > 0))];
  for (const fid of unique) {
    await c.query('INSERT INTO requirement_features (requirement_id, feature_id) VALUES ($1, $2) ON CONFLICT DO NOTHING', [
      requirementId,
      fid,
    ]);
  }
  return unique;
}

export async function create(data, client = null) {
  const featureIds = Array.isArray(data.feature_ids) ? data.feature_ids : [];
  // feature_id garde la première liaison pour la compatibilité avec les anciens lecteurs
  const primaryFeatureId = featureIds.length > 0 ? featureIds[0] : data.feature_id ?? null;

  const run = async (c) => {
    const result = await c.query(
      `INSERT INTO requirements (feature_id, product_id, title, description, category, status, priority, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [
        primaryFeatureId,
        data.product_id ?? null,
        data.title,
        data.description || null,
        data.category || 'fonctionnelle',
        data.status || 'proposed',
        data.priority || 'medium',
        data.created_by ?? null,
      ]
    );
    const created = result.rows[0];
    if (featureIds.length > 0) {
      await replaceFeatureLinks(c, created.id, featureIds);
    }
    return created;
  };

  const created = client ? await run(client) : await withTransaction(run);
  return findById(created.id);
}

export async function update(id, data, client = null) {
  const allowedFields = ['title', 'description', 'category', 'status', 'priority', 'product_id', 'feature_id'];
  const sets = [];
  const values = [];
  let idx = 1;
  for (const field of allowedFields) {
    if (data[field] !== undefined) {
      sets.push(`${field} = $${idx++}`);
      values.push(data[field]);
    }
  }
  const hasLinks = Array.isArray(data.feature_ids);
  if (sets.length === 0 && !hasLinks) return null;

  const run = async (c) => {
    let updated = null;
    if (sets.length > 0) {
      sets.push('updated_at = NOW()');
      values.push(id);
      const result = await c.query(`UPDATE requirements SET ${sets.join(', ')} WHERE id = $${idx} RETURNING *`, values);
      updated = result.rows[0] || null;
    } else {
      const existing = await c.query('SELECT * FROM requirements WHERE id = $1', [id]);
      updated = existing.rows[0] || null;
    }
    if (!updated) return null;
    if (hasLinks) {
      const unique = await replaceFeatureLinks(c, id, data.feature_ids);
      // garde feature_id aligné sur la première liaison
      await c.query('UPDATE requirements SET feature_id = $1 WHERE id = $2', [unique[0] ?? null, id]);
    }
    return updated;
  };

  const updated = client ? await run(client) : await withTransaction(run);
  return updated ? findById(id) : null;
}

/**
 * Insertion groupée : une seule transaction pour toutes les lignes.
 * Le lien est un INSERT multi-valeurs, les liaisons de fonctionnalités le sont aussi.
 */
export async function createMany(rows, client = null) {
  if (!Array.isArray(rows) || rows.length === 0) return [];

  const run = async (c) => {
    const values = [];
    const tuples = rows.map((data, i) => {
      const featureIds = Array.isArray(data.feature_ids) ? data.feature_ids : [];
      const primary = featureIds.length > 0 ? featureIds[0] : data.feature_id ?? null;
      const o = i * 8;
      values.push(
        primary,
        data.product_id ?? null,
        data.title,
        data.description || null,
        data.category || 'fonctionnelle',
        data.status || 'proposed',
        data.priority || 'medium',
        data.created_by ?? null,
      );
      return `($${o + 1}, $${o + 2}, $${o + 3}, $${o + 4}, $${o + 5}, $${o + 6}, $${o + 7}, $${o + 8})`;
    });

    const result = await c.query(
      `INSERT INTO requirements (feature_id, product_id, title, description, category, status, priority, created_by)
       VALUES ${tuples.join(', ')}
       RETURNING id`,
      values
    );
    const ids = result.rows.map((r) => r.id);

    const linkValues = [];
    const linkTuples = [];
    ids.forEach((rid, i) => {
      const unique = [...new Set(rows[i].feature_ids ?? [])];
      unique.forEach((fid) => {
        const o = linkValues.length;
        linkValues.push(rid, fid);
        linkTuples.push(`($${o + 1}, $${o + 2})`);
      });
    });
    if (linkTuples.length > 0) {
      await c.query(
        `INSERT INTO requirement_features (requirement_id, feature_id) VALUES ${linkTuples.join(', ')} ON CONFLICT DO NOTHING`,
        linkValues
      );
    }
    return ids;
  };

  const ids = client ? await run(client) : await withTransaction(run);
  if (ids.length === 0) return [];
  const result = await pool.query(
    `SELECT r.*, ${FEATURE_IDS_AGG} FROM requirements r WHERE r.id = ANY($1::int[]) ORDER BY r.id`,
    [ids]
  );
  return result.rows;
}

export async function remove(id, client = null) {
  const c = client || pool;
  const result = await c.query('DELETE FROM requirements WHERE id = $1 RETURNING id', [id]);
  return result.rows[0] || null;
}
