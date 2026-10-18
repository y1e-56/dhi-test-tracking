# Scénario simple — DHI Pay 2.0

Mot de passe de tout le monde : `Demo@DHI2026`
Avant de commencer (dossier `backend`) : `npm run demo:setup` puis `npm run demo`.
Fichiers à joindre : dans `docs/demo/`.

Suis les tours **dans l'ordre**. À chaque tour : connecte-toi avec la personne indiquée, fais les saisies, vérifie le résultat.

---

### Tour 1 — Sophie Bernard (responsable qualité)
`sophie.bernard@demo.example.com`

Dans **Référentiels & règles** :
- RG-8 → mettre **5** jours → Enregistrer

✅ Tu dois voir : RG-7 et RG-9 en **Bloquant**, les autres en **Avertissement**.

---

### Tour 2 — Sophie Bernard
Dans **Produits → Nouveau produit** :
- Nom : `DHI Pay`
- Description : `Plateforme de paiement en ligne`
- Propriétaire : `Laura Petit`
- Responsable QA : `Sophie Bernard`
- Enregistrer **sans version** → ❌ refusé
- Version : `2.0` → Enregistrer

✅ Tu dois voir : le produit DHI Pay version 2.0.

---

### Tour 3 — Laura Petit (product owner)
`laura.petit@demo.example.com`

Dans **Produits → DHI Pay → Documents → Ajouter** :
- Type : `Cahier des charges`
- Fichier : `cahier-des-charges-dhi-pay-2.0.pdf`

✅ Tu dois voir : le document dans l'onglet Documents.

---

### Tour 4 — Karim Haddad (chef de projet)
`karim.haddad@demo.example.com`

Dans **Projets → Nouveau projet** :
- Nom : `Refonte du paiement`
- Objectif : `Refondre le tunnel de paiement`
- Produit : `DHI Pay`
- Version cible : `2.0`
- Responsable test : `Thomas Morel`

✅ Tu dois voir : le projet rattaché à DHI Pay.

---

### Tour 5 — Thomas Morel (chef testeur)
`thomas.morel@demo.example.com`

Dans **Campagnes → Nouvelle campagne** :
- Nom : `Recette DHI Pay 2.0`
- Projet : `Refonte du paiement`
- Version : `2.0`
- Testeurs : `Inès Garcia`, `Hugo Lambert`
- Développeurs : `Dina Rousseau`, `Marc Fontaine`

Puis dans la campagne → **Fonctionnalités → Nouvelle fonctionnalité** :
- `Paiement par carte` · criticité **Critique** · types requis : **Fonctionnel** + **Sécurité**
- `Remboursement` · criticité **Haute** · types requis : **Fonctionnel** + **Régression**

✅ Tu dois voir : 2 fonctionnalités dans la campagne.

---

### Tour 6 — Laura Petit
Dans **Exigences → Nouvelle exigence** :
- `SEC-03 — Challenge 3-D Secure avant validation` · Sécurité · Critique · liée à **Paiement par carte**
- `FON-07 — Remboursement crédité sous 48 h` · Fonctionnelle · Haute · liée à **Remboursement**
- `PERF-02 — Validation de paiement < 2 s` · Performance · Moyenne · **aucune fonctionnalité**

✅ Tu dois voir : dans l'analyse des lacunes, PERF-02 sans fonctionnalité (trou de test).

---

### Tour 7 — Thomas Morel
Dans la campagne → **Cas de test → Ajouter** (remplir aussi les préconditions) :

| Nom | Fonctionnalité | Type | Testeur |
|---|---|---|---|
| `Carte valide` | Paiement par carte | Fonctionnel | Inès |
| `Refus 3-D Secure` | Paiement par carte | Sécurité | Inès |
| `Remboursement total` | Remboursement | Fonctionnel | Hugo |
| `Non-régression remboursement` | Remboursement | Régression | Inès |

Puis :
- Réassigner `Non-régression remboursement` à **Hugo**
- Passer la campagne **En cours**

✅ Tu dois voir : 4 cas « non exécuté », la couverture à 0 %.

---

### Tour 8 — Inès Garcia (testeuse)
`ines.garcia@demo.example.com`

- `Carte valide` → observé : `Paiement validé` → **PASS**
- `Refus 3-D Secure` → observé : `Paiement validé sans 3-D Secure` → preuve `capture-paiement-sans-3ds.png` → **FAIL**

✅ Tu dois voir : `Carte valide` verrouillé, Inès ne peut plus le modifier.

---

### Tour 9 — Hugo Lambert (testeur)
`hugo.lambert@demo.example.com`

- `Remboursement total` → **PASS**
- `Non-régression remboursement` → **PASS**

---

### Tour 10 — Inès Garcia
Depuis `Refus 3-D Secure` (en échec) → **Déclarer une anomalie** :
- Titre : `Paiement validé sans challenge 3-D Secure`
- Gravité : **Haute**
- Développeur affecté : `Dina Rousseau`
- Capture : `capture-paiement-sans-3ds.png`

✅ Tu dois voir : l'échéance de correction à **aujourd'hui + 5 jours** (RG-8).

---

### Tour 11 — Thomas Morel
Dans **Anomalies → l'anomalie** :
- Développeur affecté → `Marc Fontaine` → **Affecter**

✅ Tu dois voir : seuls Dina et Marc sont proposés (développeurs de la campagne).

---

### Tour 12 — Marc Fontaine (développeur)
`marc.fontaine@demo.example.com`

- Cloche : la notification d'affectation
- Statut → **En correction**
- Statut → **À retester** (avec une capture en preuve)

⚠️ **Ne fais pas encore valider l'anomalie.**

---

### Tour 13 — Alice Moreau (approbatrice) ★ moment clé
`alice.moreau@demo.example.com`

Dans **Go Live Center** :
- Release : `2.0 — Refonte du paiement`
- Cocher les **5 premiers** points de la checklist
- Verdict : **GO** · Justification : `Demande de mise en production` → **Historiser**

❌ Tu dois voir : **« Décision refusée »** (RG-9 : une anomalie haute est encore ouverte).

Puis :
- Verdict : **Ajourné** · Justification : `Faille 3-D Secure à corriger` → **Historiser**

---

### Tour 14 — Thomas Morel
- Anomalie → statut **Fermée** (valider la correction)
- Campagne → `Refus 3-D Secure` → **Rouvrir** l'exécution

---

### Tour 15 — Inès Garcia
- `Refus 3-D Secure` → **PASS**

---

### Tour 16 — Karim Haddad
Dans **Points à surveiller → Nouveau point** :
- Titre : `Pic de charge au lancement`
- Criticité : **Critique**
- Description : `Trafic x5 attendu le jour de la mise en production`
- Responsable : `Karim Haddad`

✅ Tu dois voir : le point en tête de la colonne « Ouvert » (filtre **Critique**).

---

### Tour 17 — Thomas Morel
- **Couverture** → 100 %
- Fonctionnalité `Paiement par carte` → **Conforme**
- Campagne → **Clôturer**
- Campagne → **Exporter le rapport PDF**

✅ Tu dois voir : RG-4 à RG-7 respectées, la campagne terminée.

---

### Tour 18 — Sophie Bernard
- **Produits → DHI Pay** : montrer le score qualité

(Montrer le score avec Sophie ou l'admin, pas avec Alice : elle ne voit pas les campagnes, son score serait faux.)

---

### Tour 19 — Alice Moreau ★
Dans **Go Live Center**, release 2.0 :
- RG-9 est maintenant **verte**
- Verdict : **GO** · Justification : `Faille 3DS corrigée, performance à compléter` → **Historiser**

⚠️ Tu dois voir : **« Décision à confirmer »** (RG-10 : checklist à 75 %, il faut 85 %).

- **Confirmer la décision**

✅ Tu dois voir : l'historique **Ajourné** puis **GO**.

---

### Tour 20 — Louis Girard (lecteur)
`louis.girard@demo.example.com`

- **Go Live Center** : tout est visible, aucune décision possible

---

### Tour 21 — Admin DHI
`admin@demo.example.com`

- **Alertes**
- **Audit & historique** : toutes les actions de la démo, avec qui et quand

🏁 Fin.

---

En cas de problème : `npm run demo:setup` remet tout à zéro en 10 secondes.
Version détaillée avec les phrases à dire : `SCENARIO_SOUTENANCE.md`.
