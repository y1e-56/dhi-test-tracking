# Guide d'utilisation — DHI Quality Platform

Manuel de prise en main de l'application de pilotage qualité : ce que chaque rôle peut faire, et comment se déroulent les parcours principaux.

> **Vérifié sur le code au 30/09/2026.** Ce document décrit le comportement réellement implémenté, y compris ses limites. La section [§8 À savoir](#8-à-savoir) liste les points où l'application se comporte autrement de ce que l'interface laisse croire.

---

## Table des matières

1. [Se connecter](#1-se-connecter)
2. [Les rôles](#2-les-rôles)
3. [La navigation](#3-la-navigation)
4. [Parcours par rôle](#4-parcours-par-rôle)
5. [Parcours fonctionnels détaillés](#5-parcours-fonctionnels-détaillés)
6. [Référentiels et points à surveiller](#6-référentiels-et-points-à-surveiller)
7. [Administration](#7-administration)
8. [À savoir](#8-à-savoir)
9. [Lexique](#9-lexique)

---

## 1. Se connecter

### Comptes de démonstration

Cinq comptes sont créés automatiquement au premier démarrage du serveur (si la table des utilisateurs est vide). La page de connexion les propose en un clic : un clic sur le compte renseigne tout seul l'identifiant et le mot de passe, sans qu'ils soient affichés.

| Compte | Identifiant | Rôle |
|---|---|---|
| Admin Principal | `admin@test.fr` | Administrateur |
| Chef Projet | `chef@test.fr` | Chef testeur |
| Second Chef | `chef2@test.fr` | Chef testeur |
| Testeur Principal | `testeur@test.fr` | Testeur |
| Développeur Senior | `dev@test.fr` | Développeur |

> Les cinq comptes sont en rôle « simple ». Ils ne couvrent donc pas les rôles *Responsable qualité*, *Lead QA*, *Product Owner*, *Approbateur* ni *Lecteur*. Pour les essayer, créez-les via **Administration → Ajouter un utilisateur** avec un compte Administrateur.

### Comment fonctionne la session

- La connexion appelle l'API, qui renvoie un jeton JWT. Le jeton est stocké dans le navigateur (`localStorage`, clé `token`).
- Vos informations (nom, e-mail, rôles) sont stockées séparément (`dhi-session-v1`).
- Votre session est **revérifiée au démarrage** contre l'API : si un administrateur a modifié vos rôles entre-temps, ils sont mis à jour automatiquement.
- Sur une erreur `401`, l'application efface le jeton et vous renvoie vers la page de connexion.

### Langue et thème

Commutables en bas de la barre latérale. Trois langues disponibles : français, anglais, arabe. Une clé de traduction manquante en arabe retombe automatiquement sur le français.

---

## 2. Les rôles

L'application compte **10 rôles**. Un utilisateur peut en cumuler plusieurs — dans ce cas, il hérite de l'union de leurs droits, et l'application affiche le tableau de bord correspondant à l'un d'eux.

### Rôle principal et périmètre

| Rôle | Rôle métier | Périmètre |
|---|---|---|
| `admin` | Administrateur plateforme | Tout, sans exception |
| `quality_manager` | Responsable qualité | Référentiel, produits, arbitrage anomalies |
| `qa_lead` | Lead QA | Idem Responsable qualité |
| `chef_projet` | Chef de projet | Projets, campagnes, anomalies, Go Live |
| `chef_testeur` | Chef testeur | Campagnes de test, exécution, anomalies, Go Live |
| `product_owner` | Product Owner | Lecture produits, projets, exigences |
| `testeur` | Testeur | Exécution des tests, anomalies |
| `developpeur` | Développeur | Correction des anomalies |
| `approver` | Approbateur | Décision Go Live uniquement |
| `lecteur` | Lecteur | Consultation seule |

### Ce que chaque rôle peut écrire

La lecture est large pour tout le monde connecté. Ce qui est **écrit** est restreint, et c'est là que les rôles se distinguent.

| Action | Rôles autorisés |
|---|---|
| Créer / modifier un **produit**, une **release**, un **environnement** | Responsable qualité, Lead QA |
| Créer / modifier / archiver un **projet** | Admin, Chef de projet, Responsable qualité, Lead QA, Product Owner |
| Créer une **campagne** | Chef testeur, Chef de projet, Responsable qualité, Lead QA |
| Modifier / supprimer une campagne | Le propriétaire ou un chef de la campagne |
| Gérer une **fonctionnalité** (CRD, statuts) | Chef testeur, Chef de projet, Responsable qualité, Lead QA, Product Owner |
| Changer le statut d'une fonctionnalité | Les mêmes + Testeur |
| Gérer une **exigence** | Chef testeur, Chef de projet, Responsable qualité, Lead QA, Product Owner |
| Gérer un **cas de test** | Les mêmes + Testeur |
| Supprimer un cas de test | Chef testeur, Chef de projet, Responsable qualité, Lead QA, Product Owner |
| **Exécuter** un test | Les mêmes + Testeur |
| Supprimer une exécution | Chef testeur, Chef de projet, Responsable qualité, Lead QA |
| **Signaler** une anomalie | Chef testeur, Chef de projet, Responsable qualité, Lead QA, Testeur |
| Modifier une anomalie / **signaler la résolution** | Les mêmes + Développeur |
| **Valider ou rejeter** une anomalie | Chef testeur, Chef de projet, Responsable qualité, Lead QA |
| Gérer les **équipes** et affectations | Chef testeur, Chef de projet, Responsable qualité, Lead QA |
| Gérer un **point à surveiller** | Chef testeur, Chef de projet, Responsable qualité, Lead QA + Testeur pour la création |
| Gérer une **version** / un **incident** | Chef testeur, Chef de projet, Responsable qualité, Lead QA |
| **Décider Go Live** et cocher la checklist | Chef testeur, Responsable qualité, Lead QA, Approbateur |
| Modifier les **règles du référentiel** | Responsable qualité, Lead QA |
| **Joindre une preuve** (document, capture) | Chef testeur, Chef de projet, Responsable qualité, Lead QA, Testeur, Développeur |
| Supprimer une preuve | Chef testeur, Chef de projet, Responsable qualité, Lead QA |
| Gérer les **utilisateurs** et les rôles | Administrateur uniquement |

### Règle d'or : l'administrateur passe partout

Le rôle `admin` contourne toutes les règles ci-dessus, sans exception.

---

## 3. La navigation

Le menu latéral est filtré selon vos rôles : **vous ne voyez que les pages auxquelles vous avez accès**. Cinq sections :

### Pilotage
- **Accueil** (`/`) — tableau de bord, adapté à votre rôle
- **Alertes** (`/alertes`) — alertes qualité automatiques

### Qualité
- **Produits** (`/produits`) — le portefeuille
- **Projets** (`/projets`) — les projets rattachés aux produits
- **Fonctionnalités** (`/fonctionnalites`) — les unités testables
- **Exigences** (`/exigences`) — le référentiel des besoins
- **Couverture** (`/couverture`) — le taux de couverture exigence ↔ fonctionnalité ↔ test

### Exécution
- **Campagnes** (`/campagnes`) — les campagnes de test, cœur de l'application

### Décision
- **Go Live** (`/go-live`) — la décision de mise en production
- **Points à surveiller** (`/points-a-surveiller`) — les risques en cours de suivi

### Système
- **Anomalies** (`/anomalies`) — les défauts et leur cycle de correction
- **Référentiels** (`/referentiels`) — les règles et seuils de la qualité
- **Administration** (`/administration`) — utilisateurs et paramètres
- **Audit** (`/audit`) — l'historique des actions

> Les **Notifications** (`/notifications`) ne figurent pas dans ce menu : elles sont accessibles depuis l'icône de cloche en haut de l'écran.

---

## 4. Parcours par rôle

### Administrateur — `/dashboard-admin`
Supervise la plateforme : utilisateurs actifs, répartition des campagnes, règles actives, alertes. Seul rôle à accéder à l'Administration et à l'Audit complet.

### Responsable qualité / Lead QA — `/`
Arbitre la qualité : valide ou rejette les anomalies, fixe les seuils du référentiel, gère les produits et les releases, prend les décisions Go Live. Le poste le plus transversal après l'administrateur.

### Chef de projet — `/dashboard-chef`
Pilote ses projets et campagnes : création, affectation des testeurs, suivi d'avancement, arbitrage des anomalies de son périmètre, décision Go Live.

### Chef testeur — `/dashboard-testeur`
Construit et supervise les campagnes : import des jeux de tests, affectation des testeurs, exécution, remontée des anomalies, décision Go Live.

### Testeur — `/dashboard-testeur`
Exécute les tests qui lui sont affectés, joint ses preuves, signale les anomalies rencontrées. Voit uniquement les campagnes où il est rattaché.

### Développeur — `/dashboard-developpeur`
Traite les anomalies qui lui sont assignées : correction, puis signalement de résolution au testeur pour re-test. Voit les anomalies, pas les campagnes dans le détail.

### Product Owner — `/`
Consulte produits, projets, fonctionnalités et exigences, ainsi que l'audit. Lecture seule sur ces éléments.

### Approbateur — `/`
Voit uniquement Go Live, points à surveiller et notifications. Son rôle est de **décider**, pas de préparer : il n'a pas accès aux campagnes ni aux tests.

### Lecteur — `/`
Navigation en lecture seule sur l'ensemble du référentiel et des campagnes. Aucune action d'écriture.

---

## 5. Parcours fonctionnels détaillés

### 5.1 Créer et peupler une campagne

C'est le parcours central de l'application.

**Étape 1 — Créer la campagne** (`/campagnes/ajouter`)
Nom, produit, projet, dates, objectifs, responsables. Rôle : Chef testeur, Chef de projet, Responsable qualité ou Lead QA.

**Étape 2 — Importer les fonctionnalités** (onglet *Fonctionnalités* → *Importer*)
Fichier CSV, séparateur `;`, colonnes attendues :

```
code;nom;description;priorite
```

> La colonne **`code` est la clé de jointure** : c'est elle qui rattache automatiquement les exigences et les tests importés ensuite aux bonnes fonctionnalités. Une erreur de code casse le lien sans message d'erreur.

**Étape 3 — Importer le référentiel des tests** (onglet *Import*)
CSV ou fichier NOR, avec le même séparateur `;`. L'en-tête est tolérant aux variantes de nom de colonne. Deux modèles sont téléchargeables depuis la page. Le nom du testeur dans le CSV est résolu en compte utilisateur ; un nom inconnu est ignoré et signalé.

**Étape 4 — Affecter les testeurs**
Depuis l'onglet *Cas de test*, la colonne d'affectation propose la liste des testeurs de la campagne. Une affectation peut être retirée pour revenir à « non affecté ».

**Étape 5 — Exécuter** (voir 5.2)

---

### 5.2 Exécuter un test

Onglet *Exécution* d'une campagne, ou depuis la page d'un cas de test.

1. **Ouvrir le test** — la page d'exécution affiche la description, les étapes et le testeur affecté.
2. **Renseigner le verdict** :

   | Verdict | Signification |
   |---|---|
   | `PASS` | Réussi |
   | `PASS_WITH_RESERVATION` | Réussi avec réserve |
   | `FAIL` | Échoué |
   | `BLOCKED` | Bloqué |
   | `NOT_RUN` | Non exécuté |
   | `NOT_APPLICABLE` | Non applicable |

3. **Documenter** — résultat observé, commentaire, valeur mesurée si le test est chiffré.
4. **Joindre les preuves** — captures d'écran, journaux, fichiers. Le champ *Testeur affecté* est en lecture seule et affiche la personne assignée, pas l'utilisateur connecté.
5. **Si échec → créer une anomalie** (voir 5.3)

---

### 5.3 Le cycle de vie d'une anomalie

Cinq statuts, et des transitions contrôlées :

```
nouvelle ──> encorrection ──> a_retester ──> fermee
                  ↑                              │
                  └───────── reouverte <────────┘
```

| Depuis | Vers |
|---|---|
| Nouvelle | En correction |
| En correction | À re-tester, Réouverte |
| À re-tester | Fermée, Réouverte |
| Fermée | Réouverte |
| Réouverte | En correction |

**Rôles sur chaque étape :**

1. **Signaler** — Testeur, Chef testeur, Chef de projet, Responsable qualité, Lead QA. On choisit l'entité concernée (campagne, fonctionnalité, test), la gravité, la criticité, et le développeur responsable.
   > Une anomalie ne peut pas être ouverte sur une fonctionnalité déjà marquée *conforme*, et la date de correction demandée doit précéder l'échéance de la fonctionnalité.

2. **Corriger** — le développeur assigné travaille, puis **signale la résolution** avec un commentaire.

3. **Re-tester** — le testeur vérifie la correction et passe à *À re-tester*.

4. **Valider ou rejeter** — Chef testeur, Chef de projet, Responsable qualité ou Lead QA.

> **Séparation des responsabilités** : celui qui signale une résolution ne peut pas valider la même anomalie. C'est contrôlé côté serveur, pas seulement dans l'interface.

---

### 5.4 Décider Go Live

La page Go Live est le point de décision finale. Elle est par construction ouverte à une audience restreinte : **Approbateur, Chef testeur, Responsable qualité, Lead QA** (plus l'administrateur).

**1. Choisir la release** à valider.

**2. Compléter la checklist** — 9 critères pondérés, total 100 :

| # | Critère | Poids |
|---|---|---|
| 1 | Taux d'exécution des campagnes = 95 % | 15 |
| 2 | Taux de succès global = 90 % | 15 |
| 3 | Aucun test critique en échec | 20 |
| 4 | Aucune anomalie de gravité haute ouverte | 15 |
| 5 | Couverture fonctionnelle = 90 % | 10 |
| 6 | Tests de sécurité exécutés et validés | 10 |
| 7 | Tests de performance conformes aux seuils | 5 |
| 8 | Plan de rollback documenté | 5 |
| 9 | Points à surveiller critiques tous clos | 5 |

L'application calcule la **complétude pondérée** en pourcentage.

**3. Vérifier les garde-fous automatiques** — trois blocages calculés en direct sur la release sélectionnée :

- aucun test critique en échec
- aucune anomalie de gravité haute ouverte
- taux d'exécution des campagnes du projet ≥ 95 %

> Tant qu'un garde-fou est rouge, le bouton de décision est refusé.

**4. Rédiger la justification** — champ obligatoire. C'est le champ destiné à expliquer la décision et ses réserves.

**5. Joindre les captures d'écran** — jusqu'à **5 images**, 10 Mo maximum par image. Les images sont enregistrées côté serveur, rattachées à la décision, et restent consultables dans l'historique.
> Les captures exigent d'être connecté : sans session serveur, elles ne seraient pas conservées.

**6. Décider** :

| Verdict | Signification |
|---|---|
| `GO` | Mise en production |
| `GO_CONDITIONNEL` | GO sous réserve |
| `NO_GO` | Refus |
| `AJOURNE` | Décision repoussée |

L'historique en bas de page conserve chaque décision : verdict, justification, date, décideur, pourcentage de checklist, et les vignettes des captures jointes (cliquables pour télécharger le fichier).

---

## 6. Référentiels et points à surveiller

### Le Référentiel (`/referentiels`)

Centralise les **10 règles** de qualité de la plateforme, réparties en 5 domaines (Santé, Campagne, Couverture, Anomalies, Go Live). Chaque règle a un seuil et un interrupteur d'activation.

- **Seuils de santé** (RG-1 à RG-3) : modifiables par Responsable qualité et Lead QA. Ils déterminent la couleur d'un produit sur toute l'application : sain / à surveiller / à risque / critique.
- **Interrupteurs** : activables sur les 10 règles.
- **Pondération du score** : rappelée sur la page, en lecture seule (résultats, couverture, criticité, incidents, non-fonctionnels, testabilité, qualité de contrôle).

### Les Points à surveiller (`/points-a-surveiller`)

Trois niveaux de criticité (information, vigilance, critique) et trois statuts (ouvert, suivi, clos). Ce sont des risques identifiés hors du cycle de test formel. **Le critère Go Live n° 9 exige que tous les points critiques soient clos.**

---

## 7. Administration

Réservé à l'administrateur (`/administration`).

- **Lister les utilisateurs** avec leur rôle, leur statut et leur dernière activité.
- **Ajouter un utilisateur** : nom, e-mail, mot de passe, rôle (un ou plusieurs).
- **Gérer un compte** : changer le rôle, réinitialiser le mot de passe, bloquer / débloquer, archiver / restaurer un compte.

> Un compte archivé ne peut plus se connecter, mais ses données restent intactes.

---

## 8. À savoir

Cette section décrit les écarts entre ce que l'interface suggère et le comportement réel. Ils sont documentés ici pour que le manuel reste honnête.

### Les règles du référentiel sont en grande partie décoratives

Sur les 10 règles, **3 seulement sont réellement utilisées** : les seuils de santé RG-1, RG-2 et RG-3, qui déterminent la couleur des produits. Les seuils des 7 autres règles (RG-4 à RG-10) sont enregistrés et affichés mais **ne pilotent aucun calcul** : les règles RG-4 et RG-9, par exemple, correspondent à des garde-fous Go Live qui sont écrits en dur dans le code, pas lus depuis le référentiel.

**Conséquence la plus importante : RG-10** annonce « Complétude checklist minimale pour GO ≥ 85 % », mais cette exigence **n'est appliquée nulle part**. Une décision GO peut être enregistrée avec une checklist vide.

### Modifier un seuil peut ne rien changer

Le champ de seuil est du texte libre. Le système en extrait le premier nombre trouvé. Une saisie non numérique (`abc`), ou dépassant 100 (`999`), est acceptée sans avertissement, mais **ignorée** par le calcul. Le message de confirmation s'affiche malgré tout.

### Deux rôles voient des pages et se voient pourtant refusés

- **Lecteur** et **Approbateur** accèdent en lecture aux onglets *Documents*, mais le téléchargement du fichier est refusé par le serveur. L'onglet s'affiche, le clic échoue.
- **Product Owner** dispose d'une navigation complète côté interface, mais le serveur lui refuse l'écriture sur les campagnes, anomalies, équipes, dépendances, versions, points à surveiller et Go Live.

À l'inverse, le **Chef testeur** peut écrire sur les fonctionnalités et les exigences via l'API, alors que l'interface ne lui montre pas ces pages.

### Un rôle fantôme dans le code

Le code serveur mentionne un rôle `test_lead` dans les contrôles de création de campagne. Ce rôle n'existe ni dans la base, ni dans l'interface : il n'est donc jamais attribué à personne.

**Conséquence** : le créateur d'une campagne n'est désigné automatiquement chef de campagne que s'il est **Chef testeur**. Une campagne créée par un Chef de projet ou un Responsable qualité ne se voit attribuer aucun chef de campagne automatiquement — il faut le designate manuellement.

### Le stockage des preuves est temporaire en ligne

Les fichiers joints sont écrits sur le disque du serveur. Sur un hébergement éphémère, ils sont perdus à chaque redémarrage. À vérifier avant de fonder une décision Go Live sur une capture stockée en ligne.

---

## 9. Lexique

| Terme | Définition |
|---|---|
| **Produit** | Entité du portefeuille, par exemple une application |
| **Release** | Version d'un produit soumise à décision Go Live |
| **Projet** | Contexte de travail rattaché à un produit |
| **Campagne** | Cycle de test, cœur de l'application |
| **Exigence** | Besoin métier à couvrir |
| **Fonctionnalité** | Unité testable, point de rattachement des exigences et des tests |
| **Couverture** | Proportion des exigences rattachées à une fonctionnalité testée |
| **Cas de test** | Scénario de vérification, affecté à un testeur |
| **Anomalie** | Défaut constaté, à corriger puis re-testé |
| **Point à surveiller** | Risque identifié hors du cycle de test formel |
| **Preuve** | Pièce jointe (capture, fichier) attachée à une exécution, une anomalie ou une décision |
| **Checklist Go Live** | Liste pondérée de 9 critères de validation d'une release |
| **Garde-fou** | Blocage automatique qui interdit la décision Go Live |

---

## Annexe — Rôles côté serveur

Les noms de rôle diffèrent légèrement entre l'interface et le serveur. C'est utile à connaître en cas d'erreur d'autorisation.

| Rôle affiché | Rôle serveur |
|---|---|
| `developpeur` | `developer` |
| `testeur` | `tester` |
| `chef_testeur` | `chef_testeur` |
| `quality_manager` | `quality_manager` |
| `qa_lead` | `qa_lead` |
| `product_owner` | `product_owner` |
| `chef_projet` | `chef_projet` |
| `approver` | `approver` |
| `lecteur` | `lecteur` |
| `admin` | `admin` |
