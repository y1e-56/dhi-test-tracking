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

### 🕓 Reste à faire

1. **Règle de séparation des responsabilités** (impossible de valider son propre travail).
2. **Pilotage de la testabilité** (page dédiée).
3. **Campagnes** : conserver l'historique des versions d'un test (versionnage quand un test réutilisé est modifié).
4. **Preuves** : compléter leurs métadonnées (auteur, date, version, environnement).

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

---

## Choix techniques (rappel)

- Framework **TanStack Start + TanStack Router**, **React 19**, **Tailwind CSS 4**.
- Composants **shadcn/ui**.
- Les données sont pour l'instant **en mémoire + localStorage** (pas encore de base de données / API).
- Le score qualité est **recalculé automatiquement** à chaque changement.

---

## Prochaine étape

Terminer les 4 points restants : séparation des responsabilités, pilotage de la testabilité, versionnage des tests, métadonnées des preuves.
