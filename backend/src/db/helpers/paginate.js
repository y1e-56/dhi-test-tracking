import pool from '../../config/database.js';

/**
 * Wraps a query with pagination (COUNT + LIMIT/OFFSET).
 *
 * @param {object} client - PostgreSQL client (pool or transaction client)
 * @param {string} countQuery - SQL COUNT query (same WHERE as dataQuery)
 * @param {string} dataQuery  - SQL SELECT query (without ORDER BY / LIMIT / OFFSET)
 * @param {Array}  params     - Parameterized values for both queries
 * @param {object} options
 * @param {number} [options.page=1]
 * @param {number} [options.limit=20]
 * @param {string} [options.orderBy='created_at DESC']
 * @returns {{ data: object[], pagination: { page: number, limit: number, total: number, totalPages: number } }}
 */
export async function paginate(client, countQuery, dataQuery, params = [], options = {}) {
  const c = client || pool;
  const { page = 1, limit = 20, orderBy = 'created_at DESC' } = options;
  const safePage = Math.max(1, Math.floor(page));
  const safeLimit = Math.max(1, Math.min(200, Math.floor(limit)));

  // 1. COUNT
  const countResult = await c.query(countQuery, params);
  const total = parseInt(countResult.rows[0]?.count ?? '0', 10);

  // 2. DATA with LIMIT / OFFSET
  const offset = (safePage - 1) * safeLimit;
  const nextIdx = params.length + 1;
  const paginatedSql = `${dataQuery} ORDER BY ${orderBy} LIMIT $${nextIdx} OFFSET $${nextIdx + 1}`;
  const dataResult = await c.query(paginatedSql, [...params, safeLimit, offset]);

  return {
    data: dataResult.rows,
    pagination: {
      page: safePage,
      limit: safeLimit,
      total,
      totalPages: Math.ceil(total / safeLimit) || 1,
    },
  };
}
