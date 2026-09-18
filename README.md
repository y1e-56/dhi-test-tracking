# DHI Test Tracking

Plateforme web de suivi des tests et de la qualité logicielle, développée pour **DHI (Digital House International)** dans le cadre d'un stage académique à l'UCAC-ICAM.

---

## Présentation

L'application centralise la gestion des campagnes de tests logiciels, la traçabilité des anomalies et la communication entre les équipes testeurs et développeurs. Elle remplace les pratiques informelles (Excel, e-mail, messagerie) par un outil structuré, sécurisé et doté de notifications en temps réel.

**Dix profils :** Administrateur · Chef testeur · QA Lead · Quality manager · Product owner · Chef de projet · Testeur · Développeur · Approbateur · Lecteur

> Les **4 derniers points du cahier des charges** sont implémentés dans le front « nouvelle génération » (`NEW VERSION/`) : **séparation des responsabilités**, **pilotage de la testabilité**, **versionnage des cas de test**, **métadonnées des preuves** (voir `README.md` dans `NEW VERSION`).

---

## Fonctionnalités principales

- Gestion des projets et campagnes de test (cycle de vie complet)
- Assignation des fonctionnalités aux testeurs
- Suivi des anomalies avec cycle formalisé : `nouvelle → en cours → résolution signalée → validée / rejetée`
- Notifications temps réel (in-app + e-mail) à chaque événement métier
- Tableau de bord adapté au rôle, statistiques et journal d'audit
- Export des rapports de campagne en PDF et Excel
- Assistance IA : suggestion de priorité, suggestion de développeur, chat contextuel (Ollama)
- Interface bilingue français / anglais (i18n)

---

## Stack technique

| Couche | Technologie |
|---|---|
| Frontend | React 18, Vite, Tailwind CSS, Radix UI, Socket.IO client |
| Backend | Node.js, Express, Socket.IO |
| Base de données | PostgreSQL (migrations versionnées) |
| Auth & Sécurité | JWT, bcrypt, express-rate-limit, Helmet |
| Emails | Nodemailer / Resend |
| IA | Ollama (qwen2.5:7b) + algorithmes locaux (similarité Jaccard) |
| Déploiement | Render (render.yaml) |

---

## Structure du projet

```
dhi-test-tracking/
├── backend/          # API REST Node.js/Express
│   └── src/
│       ├── routes/   # fichiers de routes
│       ├── services/ # Logique métier + event bus
│       └── db/       # Accès SQL + migrations versionnées
├── NEW VERSION/      # Front « nouvelle génération » (TanStack) — version présentée
│   └── src/          # routes/ + lib/ (dhi-data, dhi-store, separation-of-duties…)
├── nouveau/          # Refonte frontend associée à la branche ryan-back-end
├── DHI-LOGICEL/      # Frontend historique React/Vite
│   └── src/
│       ├── app/
│       │   ├── pages/      # pages (une par rôle/domaine)
│       │   ├── components/ # Composants réutilisables
│       │   ├── contexts/   # État global (auth, data, socket...)
│       │   └── services/   # Appels API
│       └── locales/        # Traductions fr / en
├── docs/             # Rapport de stage, diagrammes UML, documentation
└── render.yaml       # Configuration déploiement Render (3 services)
```

---

## Lancer le projet en local

### Prérequis

- Node.js 18+
- PostgreSQL 14+
- Ollama (optionnel — pour les fonctionnalités IA)

### Backend

```bash
cd backend
cp .env.example .env      # Renseigner les variables ci-dessous
npm install
npm run dev               # Démarre sur http://localhost:5000
```

### Frontend

```bash
cd DHI-LOGICEL
npm install
npm run dev               # Démarre sur http://localhost:5173
```

### Variables d'environnement backend (`.env`)

```env
DATABASE_URL=postgresql://user:password@localhost:5432/dhi_test_tracking
JWT_SECRET=votre_secret_jwt
PORT=5000
CORS_ORIGIN=http://localhost:5173
```

---

## Déploiement (Render)

Le fichier `render.yaml` à la racine configure automatiquement trois services :

| Service | Type | Description |
|---|---|---|
| `dhi-test-tracking-app` | Static | Frontend React (build Vite, CDN Frankfurt) |
| `dhi-test-tracking-api` | Web | API Node.js (port 10000) |
| `dhi-test-tracking-db` | PostgreSQL | Base de données managée |

---

## Sécurité

- Authentification **JWT** vérifiée sur chaque endpoint API et lors du handshake WebSocket
- Mots de passe hachés avec **bcrypt**
- **Verrouillage progressif** : compte bloqué après 5 tentatives échouées, durée doublée à chaque verrouillage (15 min → 30 min → 1h → ... → 24h max)
- **Rate limiting** par adresse IP sur les routes `/auth/login` et `/auth/register`
- En-têtes HTTP sécurisés via **Helmet**

---

## Réalisé par

**NGOUNOU MOMI Pharel & JIPNANG Ryan**
Étudiants ingénieurs en 2e année — UCAC-ICAM
Stage chez DHI (Digital House International)
Encadreur entreprise : Ing. TSAMENE Steve Jordan
