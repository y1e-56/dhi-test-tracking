/**
 * Prépare la base de démonstration de la soutenance (scénario « DHI Pay 2.0 »).
 *
 *   npm run demo:setup     (depuis /backend)
 *
 * Recrée la base `dhi_demo` de zéro, applique les migrations puis crée un
 * compte par rôle et règle le référentiel comme le scénario l'attend. Aucun
 * produit, projet ni campagne : ils sont créés en direct pendant la démo.
 * Relançable à volonté (par exemple le matin de la soutenance).
 */
import bcrypt from 'bcryptjs';
import pg from 'pg';
import { DEMO_DATABASE } from './demo-env.js';

export const DEMO_PASSWORD = 'Demo@DHI2026';

/** Un compte par rôle joué dans le scénario. */
export const DEMO_USERS = [
  { email: 'admin@demo.example.com', first: 'Admin', last: 'DHI', role: 'admin' },
  { email: 'sophie.bernard@demo.example.com', first: 'Sophie', last: 'Bernard', role: 'quality_manager' },
  { email: 'karim.haddad@demo.example.com', first: 'Karim', last: 'Haddad', role: 'chef_projet' },
  { email: 'laura.petit@demo.example.com', first: 'Laura', last: 'Petit', role: 'product_owner' },
  { email: 'thomas.morel@demo.example.com', first: 'Thomas', last: 'Morel', role: 'chef_testeur' },
  { email: 'ines.garcia@demo.example.com', first: 'Inès', last: 'Garcia', role: 'tester' },
  { email: 'hugo.lambert@demo.example.com', first: 'Hugo', last: 'Lambert', role: 'tester' },
  { email: 'dina.rousseau@demo.example.com', first: 'Dina', last: 'Rousseau', role: 'developer' },
  { email: 'marc.fontaine@demo.example.com', first: 'Marc', last: 'Fontaine', role: 'developer' },
  { email: 'alice.moreau@demo.example.com', first: 'Alice', last: 'Moreau', role: 'approver' },
  { email: 'louis.girard@demo.example.com', first: 'Louis', last: 'Girard', role: 'lecteur' },
];

/** Modes du référentiel attendus par le scénario (acte 1 passe ensuite RG-8 à 5 jours). */
const RULE_MODES = {
  'RG-1': 'warning', 'RG-2': 'warning', 'RG-3': 'warning',
  'RG-4': 'warning', 'RG-5': 'warning', 'RG-6': 'warning',
  'RG-7': 'blocking', 'RG-8': 'warning', 'RG-9': 'blocking', 'RG-10': 'warning',
};

async function recreateDatabase() {
  const admin = new pg.Client({
    connectionString: process.env.DATABASE_URL.replace(`/${DEMO_DATABASE}`, '/postgres'),
  });
  await admin.connect();
  try {
    await admin.query(`DROP DATABASE IF EXISTS ${DEMO_DATABASE} WITH (FORCE)`);
    await admin.query(`CREATE DATABASE ${DEMO_DATABASE}`);
  } finally {
    await admin.end();
  }
}

async function main() {
  if (!process.env.DATABASE_URL?.includes(`/${DEMO_DATABASE}`)) {
    throw new Error('Lancer via « npm run demo:setup » : la base de démo doit être préchargée.');
  }
  console.log(`[demo] Recréation de la base ${DEMO_DATABASE}…`);
  await recreateDatabase();

  // Import tardif : le pool se connecte à la base qui vient d'être créée.
  const { initDb, default: pool } = await import('../config/database.js');
  await initDb();

  const hash = bcrypt.hashSync(DEMO_PASSWORD, 10);
  for (const u of DEMO_USERS) {
    await pool.query(
      `INSERT INTO users (email, password_hash, first_name, last_name, role, roles)
       VALUES ($1, $2, $3, $4, $5, ARRAY[$6]::text[])`,
      [u.email, hash, u.first, u.last, u.role, u.role]
    );
  }
  for (const [id, mode] of Object.entries(RULE_MODES)) {
    await pool.query('UPDATE referential_rules SET mode = $2, active = TRUE WHERE id = $1', [id, mode]);
  }
  await pool.query("UPDATE referential_rules SET value = 7 WHERE id = 'RG-8'");

  console.log(`[demo] ${DEMO_USERS.length} comptes créés (mot de passe : ${DEMO_PASSWORD})`);
  for (const u of DEMO_USERS) console.log(`        ${u.role.padEnd(16)} ${u.email}`);
  console.log('[demo] Base prête. Démarrer le serveur de démo : npm run demo');
  await pool.end();
}

main().catch((err) => {
  console.error('[demo] Échec :', err.message);
  process.exit(1);
});
