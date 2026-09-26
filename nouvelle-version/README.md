# DHI Test Tracking — Front nouvelle génération

Plateforme web de suivi des tests et du pilotage de la qualité logicielle, développée pour **DHI (Digital House International)** dans le cadre d'un stage académique à l'UCAC-ICAM.

Cette application (TanStack) est le **front « nouvelle génération »**, le plus complet en termes de cahier des charges : campagnes de tests, exécution, anomalies, Go/No-Go, score qualité, et les 4 derniers points du cahier des charges.

---

## Les 4 derniers points du cahier des charges (ajoutés ✅)

1. **Séparation des responsabilités** — impossible de valider son propre travail :
   - le responsable d'une campagne ne peut pas émettre **GO / GO sous réserve** sur sa propre release (page Go/No-Go, avec bandeau d'alerte) ;
   - le responsable d'une campagne ne peut pas enregistrer un verdict **PASS / PASS sous réserve** sur ses propres tests (page Exécution) ;
   - l'**auteur / le développeur** d'une anomalie ne peut pas la **clôturer** (page Anomalie).
   - Règle implémentée dans `src/lib/separation-of-duties.ts`, appliquée dans `go-live.tsx`, `execution.$testId.tsx` et `anomalies.$defectId.tsx`.

2. **Pilotage de la testabilité** — nouvelle page « Pilotage de la testabilité » (`/pilotage-testabilite`) : score par produit (documentation, préconditions, étapes, résultat attendu, exécution, automatisation), badges de santé par test (Prêt / Partiel / Insuffisant), liste détaillée avec lien vers l'exécution, impression (PDF).

3. **Versionnage des cas de test** — chaque cas de test conserve son historique de versions (création, clonage, modification). La page de modification affiche le panneau « Historique des versions » et permet de **restaurer** une version précédente — la restauration crée elle-même une nouvelle version tracée.

4. **Métadonnées des preuves** — chaque preuve (document rattaché ou capture d'exécution) porte : **auteur, date, version testée et environnement**. Les formulaires « Documents » (produit, projet, campagne, fonctionnalité) proposent les champs *Version testée* et *Environnement* (pré-remplis depuis la campagne), affichés ensuite dans les tableaux de documents.

---

## Fonctionnalités principales

- **Portefeuille produits** : produits, versions, environnements, projets liés, score qualité, critères pondérés, points critiques, historique qualité.
- **Campagnes de tests** : cycle de vie complet, clonage (avec sélection intelligente des tests à rejouer en régression), date de création différée (statut « À venir » automatique), rattachement produit → projet → version → environnement.
- **Cas de tests** : type, criticité, préconditions, étapes, résultat attendu / obtenu, commentaires, tests mesurables (verdict calculé automatiquement), scénarios de test, dépendances avec graphe d'exécution.
- **Exécution des tests** : verdict par étape, preuves (captures, logs…), mesures, création d'anomalie depuis l'exécution, capitalisation des incidents.
- **Pilotage du non-fonctionnel** : seuil, opérateur, valeur mesurée, verdict automatique (performance, charge, sécurité, résilience).
- **Couverture** : matrice fonctionnalité × type de test, trous de tests détectés automatiquement.
- **Anomalies & incidents** : gravité, priorité, cycle de vie, commentaires, fermeture soumise à la séparation des responsabilités.
- **Go / No-Go Center** : sessions de validation par produit / projet / release, checklist de critères, décisions GO sous réserve, historique.
- **Score qualité** (sur 100) recalculé automatiquement : résultats, couverture, éléments critiques, incidents, non-fonctionnel, testabilité, contrôles qualité. Explicabilité du score (facteurs qui font monter / baisser).
- **Alertes qualité** automatiques (6 règles + trous de tests), **notifications**, **journal d'audit** complet.
- **Référentiels & règles** : critères qualité pondérés, règles par type de test.
- **Contrôles qualité & audits périodiques**, **rapports exportables** (CSV / JSON).
- **Rôles et espaces de travail** : 10 profils, protection des pages (écran « Accès refusé »).

## Rôles utilisateurs

`admin` · `qa_lead` · `quality_manager` · `product_owner` · `chef_projet` · `chef_testeur` · `testeur` · `developpeur` · `approver` · `lecteur`

Chaque rôle voit uniquement les pages de son périmètre. Les décisions GO/No-Go sont réservées aux profils décisionnels (admin, chef testeur, quality manager, QA lead, approbateur), toujours sous réserve de la règle de séparation.

---

## Architecture / données

- Les **données métier** (produits, projets, campagnes, cas de tests…) sont en mémoire + `localStorage` (seed de démonstration dans `src/lib/dhi-data.ts`) via le store `dhi-store.tsx`.
- **Authentification** : le login se fait auprès du backend (`POST /api/auth/login`, JWT). → **le backend doit tourner** pour se connecter.
- **Preuves** : le téléversement des documents/vidéos passe par l'API backend (`POST /api/evidence`) ; les métadonnées (version, environnement) sont stockées avec la pièce.
- Front configuré pour dialoguer avec le backend sur `http://localhost:5000` (origines autorisées : 5173, 3000, 8080).

## Stack technique

| Couche | Technologie |
|---|---|
| Framework | TanStack Start + TanStack Router |
| UI | React 19, Tailwind CSS 4, composants shadcn/ui (Radix UI), lucide-react |
| Données | Store en mémoire + localStorage ; API backend pour l'auth et les preuves |
| Internationalisation | fr / en (clés types) |
| Backend (associé) | Node.js, Express dans `../backend` (port 5000) |

---

## Lancer le projet en local

> L'application ne fonctionne qu'avec le **backend** démarré (login obligatoire).

### 1. Backend (port 5000)

```bash
cd backend
npm install
npm run dev            # http://localhost:5000  (– vérif : /api-docs)
```

### 2. Front (port 8080 par défaut)

```bash
cd "NEW VERSION"
npm install
npm run dev            # http://localhost:8080
```

Si le port est déjà pris, forcer un port autorisé par le CORS :

```bash
npm run dev -- --port 3000 --strictPort
npm run dev -- --port 8080 --strictPort
```

### Comptes de test (seed backend)

| Rôle | Email | Mot de passe |
|---|---|---|
| Admin | `admin@test.fr` | `Admin@DHI2026` |
| Chef testeur | `chef@test.fr` / `chef2@test.fr` | `Chef@DHI2026` |
| Testeur | `testeur@test.fr` | `Testeur@DHI2026` |
| Développeur | `dev@test.fr` | `Dev@DHI2026` |

> Pour tester la **séparation des responsabilités**, créer via Administration un utilisateur dont le **prénom + nom** est identique au responsable d'une campagne de démo (par ex. « Sophie Lemaire », responsable de la campagne « Sécurité v4.12 »). Guide complet : `Guide test 4 points CDC.txt`.

### Commandes utiles

```bash
npm run build   # build de production (Vite + Nitro)
npm run lint    # ESLint
```

---

## Structure

```
NEW VERSION/
├── src/
│   ├── routes/           # Pages (file-based routing TanStack Router)
│   │   ├── pilotage-testabilite.tsx      # Pilotage de la testabilité
│   │   ├── go-live.tsx                   # Go / No-Go Center
│   │   ├── execution.$testId.tsx         # Exécution d'un cas de test
│   │   ├── anomalies.$defectId.tsx       # Détail d'une anomalie (clôture gardée)
│   │   └── *.documents.(ajouter.)tsx     # Documents par entité
│   ├── lib/
│   │   ├── dhi-data.ts                   # Modèles + données de démonstration
│   │   ├── dhi-store.tsx                 # Store (état global, versionnage, persistance)
│   │   ├── separation-of-duties.ts       # Règles de séparation des responsabilités
│   │   ├── api.ts                        # Client API backend (auth, evidence)
│   │   └── i18n/                         # Traductions fr / en
│   └── components/dhi/                   # Composants UI (AppShell, panneaux, KPI…)
└── Bloc_notes_PROJET_DHI.md              # Document de suivi du cahier des charges
```