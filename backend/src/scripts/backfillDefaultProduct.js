import pgPool from '../config/database.js';

const DEFAULT_PRODUCT_NAME = 'Produit par défaut';

export async function backfillDefaultProduct(client) {
  const c = client || pgPool;

  const existing = await c.query(
    'SELECT id FROM products WHERE LOWER(name) = LOWER($1) LIMIT 1',
    [DEFAULT_PRODUCT_NAME]
  );

  let productId;
  if (existing.rows[0]) {
    productId = existing.rows[0].id;
    console.log(`[backfill] Produit par défaut déjà présent (#${productId})`);
  } else {
    const admin = await c.query("SELECT id FROM users WHERE role = 'admin' ORDER BY id LIMIT 1");
    const created = await c.query(
      'INSERT INTO products (name, description, created_by) VALUES ($1, $2, $3) RETURNING id',
      [
        DEFAULT_PRODUCT_NAME,
        'Produit créé automatiquement pour regrouper les projets existants avant l\'introduction du portefeuille produits.',
        admin.rows[0]?.id || null,
      ]
    );
    productId = created.rows[0].id;
    console.log(`[backfill] Produit par défaut créé (#${productId})`);
  }

  const orphans = await c.query('SELECT COUNT(*)::int AS count FROM projects WHERE product_id IS NULL');
  if (orphans.rows[0].count > 0) {
    await c.query('UPDATE projects SET product_id = $1 WHERE product_id IS NULL', [productId]);
    console.log(`[backfill] ${orphans.rows[0].count} projet(s) rattaché(s) au produit par défaut`);
  } else {
    console.log('[backfill] Aucun projet orphelin — rien à faire');
  }

  return productId;
}

const isDirectRun = process.argv[1] && process.argv[1].endsWith('backfillDefaultProduct.js');
if (isDirectRun) {
  backfillDefaultProduct()
    .then(() => {
      console.log('[backfill] Terminé');
      return pgPool.end();
    })
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('[backfill] Échec :', err);
      return pgPool.end().finally(() => process.exit(1));
    });
}
