/**
 * Environnement de démonstration (soutenance) — préchargé avant le serveur :
 *   node --import ./src/scripts/demo-env.js src/index.js
 *
 * - base séparée `dhi_demo` (même serveur PostgreSQL que DATABASE_URL) : la
 *   base de travail n'est jamais touchée ;
 * - e-mails désactivés : la démo n'envoie rien à personne ;
 * - limite de connexions relevée : on change souvent de rôle pendant la démo ;
 * - Sentry désactivé.
 *
 * dotenv ne remplace jamais une variable déjà définie, même vide : les valeurs
 * posées ici l'emportent donc sur le fichier .env.
 */
import fs from 'node:fs';

const envFile = fs.readFileSync(new URL('../../.env', import.meta.url), 'utf8');
const line = envFile
  .split(/\r?\n/)
  .map((l) => l.replace(/^﻿/, ''))
  .find((l) => l.startsWith('DATABASE_URL='));
if (!line) throw new Error('DATABASE_URL introuvable dans backend/.env');

export const DEMO_DATABASE = 'dhi_demo';
const url = line.slice('DATABASE_URL='.length).trim();
process.env.DATABASE_URL = url.replace(/\/[^/?]+(\?|$)/, `/${DEMO_DATABASE}$1`);
process.env.PORT = process.env.DEMO_PORT || '5000';
process.env.SMTP_HOST = '';
process.env.RESEND_API_KEY = '';
process.env.SENTRY_DSN = '';
process.env.AUTH_RATE_LIMIT_MAX = '500';
