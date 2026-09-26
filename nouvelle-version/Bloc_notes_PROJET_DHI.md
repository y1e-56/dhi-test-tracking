# Bloc-notes — Projet Plateforme DHI (Qualité logicielle)

Document de travail pour le collaborateur. Récapitule, en mots simples, ce que nous avons vérifié et ce que nous allons corriger / ajouter sur la plateforme.

---

## Ce que la plateforme fait déjà (par rapport au cahier des charges)

- Suivi des **produits**, **projets**, **versions / releases**.
- **Registre des fonctionnalités** avec niveau de criticité (faible → critique) et taux de couverture.
- **Exigences** et traçabilité vers les fonctionnalités.
- **Points à surveiller** (risques).
- **Campagnes de tests** : création, duplication (clonage), suivi d'avancement (exécutés, réussis, échoués, bloqués, non exécutés).
- **Cas de tests** avec type, étapes, préconditions, résultat attendu, verdict.
- **Exécution des tests** : enregistrement du verdict, preuves (captures, logs…), mesures, création d'anomalie.
- **Couverture** (matrice fonctionnalité × type de test).
- **Anomalies / incidents** : gravité, priorité, statut, cycle de vie.
- **Go / No-Go Go-Live** avec checklist de critères et historique des décisions.
- **Score qualité (sur 100)** calculé automatiquement selon la formule prévue : résultas, couverture, éléments critiques, incidents, non-fonctionnel, testabilité, contrôles qualité.
- **Indicateur de santé** : Sain / À surveiller / À risque / Critique.
- **Alertes qualité** automatiques (6 règles).
- **Journal d'audit** (traçabilité des actions).
- **Rôles et droits d'accès** (8 profils) + gestion des utilisateurs.
- Application disponible en **français / anglais** (l'arabe n'est pas dans le périmètre).

---

## Écarts relevés par rapport au cahier des charges

### ✅ Déjà corrigés / ajoutés

1. **Référentiel des critères qualité pondérés** — page Référentiels : critères à pondérations (fonctionnel 30 %, sécurité 20 %, performance 15 %, fiabilité 15 %, maintenabilité 10 %, documentation 5 %, testabilité 5 %), critères spécifiques, critères bloquants + règles par type de test (point 5, BF-040).
2. **Scénarios de test** — nouvelle page "Scénarios de test" (un scénario regroupe plusieurs cas de tests).
3. **Dépendances entre tests + graphe / ordre d'exécution** — nouvelle page "Dépendances & graphe" (avant / après / nécessite la réussite de / bloque / dépend fonctionnellement).
4. **Pilotage dédié du non-fonctionnel** — nouvelle page (performance, charge, sécurité, résilience) avec seuil, opérateur, valeur mesurée et verdict calculé automatiquement.
5. **Tests mesurables** — métrique, unité, seuil, tolérance, opérateur, verdict **calculé automatiquement** à l'exécution (mesurable + verdict auto).
6. **Sélection intelligente des tests à rejouer en régression** — au clonage d'une campagne, la plateforme propose les tests prioritaires et le motif.
7. **Capitalisation des incidents** — depuis une anomalie : "Nouveau cas de test", "Nouvelle exigence", "Point à surveiller".
8. **Contrôles qualité / audits périodiques** — nouvelle page "Contrôles qualité & audits".
9. **Rapports exportables** — nouvelle page "Rapports & exports" : scores (CSV), campagnes (CSV), couverture (CSV), rapport complet (JSON).
10. **Explicabilité du score** — sur la page d'un produit : facteurs qui font monter / baisser le score (≥ 80 positifs, < 70 négatifs).
11. **Trous de tests** — détectés et signalés automatiquement (nouvelle règle d'alerte).
12. **Règle de séparation des responsabilités** — impossible de valider son propre travail : le responsable d'une campagne ne peut pas émettre GO / GO sous réserve sur sa propre release (page Go/No-Go, avec bandeau d'alerte), ne peut pas valider (PASS) les tests de sa propre campagne (page d'exécution), et l'auteur / le développeur d'une anomalie ne peut pas la clôturer (page anomalie).
13. **Pilotage de la testabilité** — nouvelle page « Pilotage de la testabilité » : score par produit (documentation, préconditions, étapes, résultat attendu, exécution, automatisation), badge de santé par test, liste détaillée avec lien vers l'exécution.
14. **Versionnage des cas de test** — chaque cas de test conserve son historique de versions (création, clonage, modification) ; la page de modification affiche l'historique et permet de restaurer une version précédente (ce qui crée une nouvelle version tracée).
15. **Métadonnées des preuves** — chaque preuve (document ou capture d'exécution) porte désormais : auteur, date, version testée et environnement ; les formulaires « Documents » (produit, projet, campagne, fonctionnalité) ont des champs « Version testée » et « Environnement », affichés dans les tableaux de documents.

### 🕓 Reste à faire

*(Aucun point de la liste initiale ne reste à faire — voir les 4 derniers points ci-dessus.)*

---

## Derniers ajustements demandés (faits ✅)

1. **Projet non obligatoire** à la création d'une campagne — le champ "Projet" est optionnel (choix « Aucun projet » possible), la validation obligatoire a été retirée.
2. **Formulaire de création de campagne agrandi** — format plus large (6 colonnes max) avec une grille à 3 colonnes pour mieux exploiter l'espace.
3. **Date de création différée** — on peut saisir n'importe quelle date ; si la date de début est **future**, la campagne est automatiquement en statut « À venir », sinon « Planifiée ». Une note l'explique sous le champ.
4. **Cas de test : résultat attendu / résultat obtenu / commentaires** —
   - Le formulaire d'ajout et de modification d'un cas de test comporte désormais : *Résultats attendus*, *Résultat obtenu* (saisissable), *Commentaires*.
   - Ces champs sont **affichés dans le tableau** des cas de test de la campagne (colonne « Résultat obtenu » + commentaire, avec info-bulle complète).
   - **Export CSV enrichi** : id, nom, criticité, type, verdict, testeur, préconditions, étapes, résultat attendu, résultat obtenu, commentaires, date.
   - **Import CSV enrichi** : le modèle téléchargeable contient `resultat_attendu`, `resultat_obtenu`, `commentaires` (compatibles aussi avec `expected` / `observed` / `comment`).
   - Le clonage d'une campagne copie aussi ces champs.

*(Point « anomalies à gauche / conformité à droite + icône œil » et « hubs de fonctionnalités » : laissés de côté / non cadrés.)*

---

## Où trouver chaque fonctionnalité

- **Critères qualité / règles par type** → Référentiels & règles
- **Scénarios de test** → onglet Exécution
- **Dépendances & graphe** → onglet Exécution
- **Non-fonctionnel** → onglet Qualité
- **Contrôles qualité & audits** → onglet Système
- **Rapports & exports** → onglet Pilotage
- **Sélection intelligente du rejeu** → lors de la création d'une campagne par clonage
- **Capitalisation des incidents** → page Anomalies (détail d'une anomalie)
- **Séparation des responsabilités** → pages Go/No-Go, Exécution d'un test, détail d'une anomalie
- **Pilotage de la testabilité** → onglet Décision (menu latéral)
- **Versionnage des tests** → page de modification d'un cas de test (panneau « Historique des versions »)
- **Métadonnées des preuves** → pages Documents (produit, projet, campagne, fonctionnalité) + preuves d'exécution

---

## Choix techniques (rappel)

- Framework **TanStack Start + TanStack Router**, **React 19**, **Tailwind CSS 4**.
- Composants **shadcn/ui**.
- Les données sont pour l'instant **en mémoire + localStorage** (pas encore de base de données / API).
- Le score qualité est **recalculé automatiquement** à chaque changement.

---

## Prochaine étape

À présent que les 4 derniers points du cahier des charges sont implémentés (séparation des responsabilités, pilotage de la testabilité, versionnage des tests, métadonnées des preuves), il reste une **vérification manuelle** dans le navigateur sur http://localhost:8080 (comportements selon les rôles, restauration de version, colonnes des documents), puis une relecture / démonstration pour la présentation finale.

---

## Ce qui a été récupéré sur git (dernier push du collaborateur)

On a récupéré **tout ce que le collaborateur avait poussé sur le repository**, sur les deux branches principales. Voici, en mots simples, ce qui a été ramené.

### Branch `nouvelle-version` (12 nouveaux commits)

C'est la branche qui ressemble le plus à ce qu'on a décrit dans ce bloc-notes (l'application TanStack).

1. **Documents attachés aux objets** — on peut maintenant joindre des fichiers (PDF, etc.) aux produits, projets, campagnes et fonctionnalités. Chaque objet a sa page « Documents ».
2. **Cas de test enrichis** — un cas de test a maintenant : résultat attendu, résultat obtenu, commentaires. Le tout s'exporte / s'importe en CSV, et le clonage d'une campagne conserve ces champs.
3. **Système de notifications** — nouvelles pages « Notifications » avec règles (tâche assignée, meme ajouté, anomalie corrigée, campagne terminée, mot de passe oublié, projet créé…).
4. **Rôles et espaces de travail** — chaque rôle voit seulement ses pages (espace de travail imposé par rôle). Seul l'admin peut administrer. Limitation à la création : un testeur ne crée que certaines choses, etc. Rôle spécial « chef testeur ». Décisions GO/No-Go réservées aux approbateurs.
5. **Gestion des membres par rôle** — pour ajouter des membres à une équipe/campagne selon leur rôle. Import de fonctionnalités en masse.
6. **Protection des pages** — un utilisateur qui n'a pas le droit d'ouvrir une page voit un écran « accès refusé » au lieu d'une erreur.

### Branch `ryan-back-end` (32 nouveaux commits)

C'est la branche la plus récente (celle pointée par défaut sur GitHub). Elle contient un **vrai backend** + un nouveau frontend complet.

1. **Vrai backend Node/Express** — des vraies tables et routes API pour : produits, releases, environnements, versions, projets, exigences, points à surveiller, scénarios de test, exécutions de tests + preuves, incidents, dépendances, go-live.
2. **Frontend « DHI-LOGICEL »** — l'application React (pages produits, projets, campagnes, anomalies, alertes, couverture, dette qualité, audit, rapports, go-no-go…), avec une refonte complète dans le dossier `nouveau/`.
3. **Statuts d'anomalies plus précis (5 calques)** — dans la base de données, une anomalie passe par plusieurs états (constatée → assignée → corrigée → en validation…). Une anomalie peut être créée automatiquement depuis une exécution de test ratée, et le « signalement de résolution » se fait depuis l'anomalie.
4. **Rattachement des campagnes aux fonctionnalités** — une campagne peut être liée à une fonctionnalité.
5. **Description et messages vocaux (IA)** — composants de reconnaissance vocale (description d'anomalie vocalement, enregistrement de messages vocaux), et rapport IA via Ollama.
6. **Templates de cas de test par domaine** — modèles prêts à l'emploi : paiement, authentification, fichiers, formulaires, notification, performance, API, research, rapport…
7. **Migrations SQL en plus** (17 → 27) — structure de base de données enrichie (commentaires d'anomalie, audio, scénarios, exécutions, preuves, go-live, rôles étendus…).
8. **Plateformes de tests Playwright** — scripts de vérification des parcours (admin, chef, testeur, développeur).

### ⚠️ À retenir

- Les deux branches sont **deux versions parallèles** de la plateforme. `nouvelle-version` = l'application TanStack décrite plus haut ; `ryan-back-end` = la version « nouvelle génération » avec backend.
- Tout ce qui était en local sur ton poste (dossier `DHI-LOGICEL` en double, anciennes versions) a été mis de côté proprement et est conservé (aucune perte), pour ne pas écraser le travail plus récent du collaborateur.
