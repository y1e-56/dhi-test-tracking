# DHI Test Tracking — Backend API

API REST du suivi des tests et de la qualité logicielle pour DHI. Ce projet contient **uniquement le backend** (Express + PostgreSQL). Le frontend vit dans `DHI-LOGICEL/`.

## Stack

- **Node.js ≥ 22** (ES Modules — `"type": "module"`)
- **Express 4** — serveur HTTP
- **PostgreSQL** — base de données (`pg`)
- **Socket.IO** — notifications temps réel
- **JWT + bcryptjs** — authentification
- **Zod** — validation des entrées
- **Swagger** (`swagger-jsdoc` + `swagger-ui-express`) — documentation auto de l'API
- **Nodemailer / Resend** — envoi d'emails
- **Multer** — upload de fichiers, **PdfKit** — génération de PDF

## Prérequis

- Node.js ≥ 22
- PostgreSQL démarré sur la machine
- (optionnel) Serveur **Ollama** pour le chat IA (`OLLAMA_URL`)
- (optionnel) Paramètres **SMTP** pour l'envoi réel d'emails

## Installation

```bash
npm install
```

1. Créer la base de données :

```bash
createdb dhi_test_tracking
```

2. Copier `.env.example` vers `.env` et renseigner les valeurs :

```bash
cp .env.example .env
```

Variables importantes : `DATABASE_URL` (connexion PostgreSQL), `JWT_SECRET` (clé de signature, à changer en production).

## Lancement

| Commande          | Effet                                                       |
| ----------------- | ----------------------------------------------------------- |
| `npm run dev`     | Démarre le serveur en mode watch (recharge au changement)   |
| `npm start`       | Démarre le serveur en production                            |
| `npm run seed`    | Applique le schéma initial et insère des données de démo    |
| `npm test`        | Lance les tests unitaires (node:test natif)                 |

Le serveur écoute sur `http://localhost:5000` par défaut (configurable via `PORT`).

La **documentation Swagger** est disponible sur `http://localhost:5000/api-docs` (toutes les routes API sont sous `/api`).

## Base de données

- Les **migrations SQL** incrémentales vivent dans `migrations/` (`001_init.sql`, …). Elles sont **rejouées automatiquement à chaque démarrage** par `initDb()` (`src/config/database.js`).
- Si la table `users` est vide au démarrage, un **auto-seed** insère les comptes de démo (`src/index.js`).
- `npm run seed` efface les données existantes et réinsère un jeu de démo complet (projets, campagnes, équipes, fonctionnalités, cas de test, anomalies).

### Comptes de démo

Les comptes ci-dessous sont proposés en un clic sur la page de connexion : le mot de passe est renseigné automatiquement et n'est pas affiché dans l'application.

| Rôle          | Email             |
| ------------- | ----------------- |
| Admin         | `admin@test.fr`   |
| Chef testeur  | `chef@test.fr`    |
| Chef testeur  | `chef2@test.fr`   |
| Testeur       | `testeur@test.fr` |
| Développeur   | `dev@test.fr`     |

## Structure du projet

```
backend/
├── migrations/            # Scripts SQL incrémentaux (appliqués au démarrage)
├── src/
│   ├── index.js           # Point d'entrée : serveur, socket.io, auto-seed, initDb
│   ├── seed.js            # Reset + seed complet de démo
│   ├── socket.js          # Initialisation Socket.IO
│   ├── config/            # database (pool pg + initDb), env, swagger, upload
│   ├── db/                # Requêtes SQL brutes (anomalies, users, projets, …)
│   │   └── helpers/       # paginate (pagination générique)
│   ├── lib/               # eventBus (bus d'événements interne)
│   ├── middleware/        # auth (JWT), errorHandler
│   ├── routes/            # Définition des endpoints Express
│   └── services/          # Logique métier (un service par domaine)
└── .env.example           # Modèle de configuration
```

**Architecture en couches** : `routes/` → `services/` (logique métier) → `db/` (SQL) → pool `pg`.

## Tests

```bash
npm test
```

Les tests utilisent le **runner natif `node:test`** (aucune dépendance à installer) et sont **colocalisés** avec le code testé (`*.test.js` à côté du fichier source).

Tests actuels :
- `src/db/helpers/paginate.test.js` — pagination (valeurs par défaut, clamps, `totalPages`).
- `src/services/emailTemplates.test.js` — templates d'emails (contenu, cas limites, échappement XSS).

> **Limite connue** : la plupart des services importent le singleton `pool` directement (pas d'injection de dépendances). Les tester unitairement sans base nécessite de mocker `src/config/database.js` (voir `--experimental-test-module-mocks` de Node 22) ou de pointer vers une base de test.
