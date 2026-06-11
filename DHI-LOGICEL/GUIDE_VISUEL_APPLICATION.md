# Guide Visuel - QualityTrack
## Application de Suivi des Tests et de la Qualité Logiciel

---

## 📋 Table des matières

1. [Écran de connexion](#1-écran-de-connexion)
2. [Tableaux de bord par profil](#2-tableaux-de-bord-par-profil)
3. [Gestion des projets](#3-gestion-des-projets)
4. [Gestion des campagnes](#4-gestion-des-campagnes)
5. [Détail d'une campagne](#5-détail-dune-campagne)
6. [Espace testeur](#6-espace-testeur)
7. [Espace développeur](#7-espace-développeur)
8. [Fiche anomalie détaillée](#8-fiche-anomalie-détaillée)
9. [Écran de reporting](#9-écran-de-reporting)
10. [Système de navigation](#10-système-de-navigation)

---

## 1. Écran de connexion

**URL:** `/`

**Objectif:** Authentifier les utilisateurs et gérer la sécurité

### Éléments visuels
- Logo de l'application avec icône TestTube en bleu
- Titre "QualityTrack"
- Sous-titre "Suivi des tests et de la qualité logiciel"
- Formulaire de connexion :
  - Champ "Identifiant (Email)"
  - Champ "Mot de passe"
  - Bouton "Se connecter"
- Bloc d'aide avec les comptes de démonstration
- Messages d'erreur en rouge avec icône d'alerte

### Règles métier affichées
- Message après 5 échecs : "Compte bloqué temporairement"
- Validation des champs obligatoires

### Comptes de test disponibles
```
• Admin : admin@test.fr / admin123
• Chef testeur : chef@test.fr / chef123
• Testeur : testeur@test.fr / testeur123
• Développeur : dev@test.fr / dev123
```

---

## 2. Tableaux de bord par profil

**URL:** `/dashboard`

**Objectif:** Vue d'ensemble adaptée au rôle de l'utilisateur

### 2.1 Dashboard Administrateur & Chef Testeur

#### Indicateurs clés (4 cartes)
1. **Projets actifs**
   - Nombre de projets actifs
   - Nombre de projets archivés (sous-texte)
   - Icône: FolderKanban

2. **Campagnes en cours**
   - Nombre de campagnes actives
   - Nombre en préparation (sous-texte)
   - Icône: TestTube

3. **Anomalies ouvertes**
   - Nombre total (orange)
   - Nombre critiques (sous-texte)
   - Icône: AlertTriangle

4. **Fonctionnalités testées**
   - Nombre testées vs total
   - Icône: CheckCircle2 (vert)

#### Sections détaillées

**Campagnes actives** (gauche)
- Liste des 3 dernières campagnes en cours
- Pour chaque campagne :
  - Nom de la campagne
  - Nom du projet
  - Nombre de fonctionnalités
  - Nombre d'anomalies
  - Bouton "Voir"

**Anomalies récentes** (droite)
- Liste des 3 dernières anomalies
- Pour chaque anomalie :
  - Titre
  - Badge de priorité coloré (critique, haute, moyenne, basse)
  - Date de création
  - Bouton "Détails"

#### Actions rapides (3 boutons)
- **Gérer les projets** (icône FolderKanban)
- **Gérer les campagnes** (icône TestTube) - Chef testeur uniquement
- **Rapports** (icône FileText) - Chef testeur uniquement

---

### 2.2 Dashboard Testeur

#### Indicateurs clés (4 cartes)
1. **Tâches assignées** - Total
2. **À tester** - Non testées (orange)
3. **Anomalies créées** - Total
4. **À valider** - Résolutions signalées (vert)

#### Action principale
- Bouton "Voir toutes mes tâches" → `/testeur/taches`

---

### 2.3 Dashboard Développeur

#### Indicateurs clés (4 cartes)
1. **Total assignées** - Toutes les anomalies
2. **Nouvelles** - Status nouvelle (rouge)
3. **En cours** - Status en cours (orange)
4. **Résolues** - Signalées + clôturées (vert)

#### Action principale
- Bouton "Voir toutes mes anomalies" → `/developpeur/anomalies`

---

## 3. Gestion des projets

**URL:** `/projets`

**Profils autorisés:** Administrateur, Chef testeur

### Éléments visuels
- Titre "Gestion des projets"
- Bouton "+ Nouveau projet" (bleu)
- Onglets de filtrage :
  - Tous
  - Actifs
  - Archivés

### Liste des projets
Chaque carte de projet affiche :
- Nom du projet
- Description
- Badge de statut (Actif/Archivé)
- Dates : début et fin
- Boutons d'action :
  - "Modifier" (outline)
  - "Archiver" ou "Activer" (outline)

### Dialog de création/modification
Formulaire modal avec :
- Champ "Nom du projet" (requis)
- Champ "Description" (textarea)
- Date de début (date picker)
- Date de fin (date picker)
- Boutons "Annuler" et "Enregistrer"

---

## 4. Gestion des campagnes

**URL:** `/campagnes`

**Profils autorisés:** Chef testeur

### Éléments visuels
- Titre "Gestion des campagnes de tests"
- Bouton "+ Nouvelle campagne"
- Onglets de filtrage :
  - Toutes
  - En préparation
  - En cours
  - Terminées

### Liste des campagnes
Chaque carte affiche :
- Nom de la campagne
- Nom du projet (sous-texte)
- Badge de statut (En préparation/En cours/Terminée)
- Dates : début et fin
- Statistiques :
  - X fonctionnalités
  - X anomalies ouvertes
- Bouton "Voir le détail"

### Dialog de création de campagne
- Nom de la campagne
- Sélecteur de projet (dropdown)
- Description
- Date de début
- Date de fin
- Statut initial (dropdown)

---

## 5. Détail d'une campagne

**URL:** `/campagnes/:campagneId`

**Profils autorisés:** Chef testeur, Testeur (lecture), Développeur (lecture)

### En-tête
- Nom de la campagne
- Nom du projet (sous-texte)
- Badge de statut
- Dates de la campagne

### Statistiques (4 cartes)
1. Total fonctionnalités
2. Non testées (orange)
3. Conformes (vert)
4. Anomalies (rouge)

### Sections à onglets

#### Onglet "Fonctionnalités"
Liste de toutes les fonctionnalités avec :
- Nom
- Module
- Badge de statut (Non testée/Conforme/Anomalie)
- Badge de priorité
- Testeur assigné (ou badge "Non assigné")
- Bouton "Assigner" (Chef testeur uniquement)

#### Onglet "Anomalies"
Liste des anomalies de la campagne avec :
- Titre
- Badge de priorité
- Badge de statut
- Testeur créateur
- Développeur assigné
- Date de création
- Bouton "Voir"

#### Onglet "Équipe"
Deux sections :
- **Testeurs** : Liste avec bouton "Retirer"
- **Développeurs** : Liste avec bouton "Retirer"
- Boutons "+ Ajouter un testeur" et "+ Ajouter un développeur"

### Dialog d'assignation (Chef testeur)
- Sélecteur de testeur (dropdown)
- Priorité (dropdown: critique, haute, moyenne, basse)
- Boutons "Annuler" et "Assigner"

---

## 6. Espace testeur

**URL:** `/testeur/taches`

**Profil autorisé:** Testeur uniquement

### Statistiques (4 cartes)
1. Total de tâches
2. Non testées (orange)
3. Conformes (vert)
4. Anomalies (rouge)

### Liste des tâches assignées
Chaque carte de fonctionnalité affiche :
- Icône de statut (CheckCircle/XCircle/Clock)
- Nom de la fonctionnalité
- Badges : Statut + Priorité
- Description
- Informations : Module, Campagne, Projet
- Date d'assignation
- **Actions** (2 boutons) :
  - "Conforme" (vert avec CheckCircle) - Désactivé si déjà conforme
  - "Anomalie" (rouge avec AlertTriangle)

### Dialog "Marquer comme conforme"
- Titre de confirmation
- Texte explicatif
- Boutons "Annuler" et "Confirmer"

### Dialog "Signaler une anomalie" ⭐ RÈGLE MÉTIER
Formulaire complet obligatoire :
1. **Titre de l'anomalie** (requis)
2. **Priorité** (requis) : Critique/Haute/Moyenne/Basse
3. **Description détaillée** (textarea, requis)
4. **Notifier le développeur** (dropdown, requis)

**→ Après validation :**
- Création de l'anomalie
- Notification automatique envoyée au développeur
- Changement du statut de la fonctionnalité à "Anomalie"

---

## 7. Espace développeur

**URL:** `/developpeur/anomalies`

**Profil autorisé:** Développeur uniquement

### Statistiques (4 cartes)
1. Total assignées
2. Nouvelles (rouge)
3. En cours (orange)
4. Résolues (vert)

### Filtres
Onglets de filtrage :
- Toutes
- Nouvelles
- En cours
- Résolution signalée

### Liste des anomalies
Chaque carte affiche :
- Titre de l'anomalie
- Badges : Priorité + Statut
- Description
- Fonctionnalité concernée
- Campagne et projet
- Testeur créateur
- Date de création
- **Actions** :
  - Bouton "Voir les détails"
  - Bouton "Prendre en charge" (si statut = nouvelle)
  - Bouton "Signaler résolution" (si statut = en cours) ⭐ RÈGLE MÉTIER

### Dialog "Signaler la résolution"
- Champ "Commentaire de résolution" (textarea)
- Texte explicatif : "Le testeur devra valider la clôture"
- Boutons "Annuler" et "Signaler la résolution"

**→ Important :** Le développeur ne peut PAS clôturer l'anomalie, seulement signaler sa résolution

---

## 8. Fiche anomalie détaillée

**URL:** `/anomalies/:anomalieId`

**Profils autorisés:** Tous (selon assignation)

### En-tête
- Titre de l'anomalie
- Badge de priorité
- Badge de statut
- Bouton "Retour"

### Informations principales (carte)
- **Fonctionnalité concernée** : Nom + module
- **Campagne** : Nom
- **Projet** : Nom
- **Description complète** : Texte intégral de l'anomalie

### Intervenants (carte)
- **Testeur créateur** : Nom + email
- **Développeur notifié** : Nom + email
- **Date de création** : Format français

### Historique des actions (carte)
Timeline chronologique avec :
- Date/heure
- Acteur (qui a fait l'action)
- Type d'action : Création / Prise en charge / Résolution signalée / Clôture
- Commentaire éventuel

### Actions selon le profil

**Pour le développeur assigné :**
- Bouton "Prendre en charge" (si nouvelle)
- Bouton "Signaler résolution" (si en cours)

**Pour le testeur créateur :**
- Bouton "Clôturer" (si résolution signalée) ⭐ RÈGLE MÉTIER
- Zone de commentaire de clôture

---

## 9. Écran de reporting

**URL:** `/reporting`

**Profils autorisés:** Chef testeur, Administrateur

### Filtres de sélection
Formulaire avec :
- **Projet** (dropdown)
- **Campagne** (dropdown - filtré par projet)
- **Période** :
  - Date de début
  - Date de fin

### Aperçu des données
Statistiques en temps réel :
- Nombre de fonctionnalités testées
- Nombre d'anomalies détectées
- Taux de conformité (%)
- Anomalies par priorité (répartition)

### Actions d'export
Deux boutons principaux :
- **Exporter en PDF** (icône FileDown + FileText)
- **Exporter en Excel** (icône FileDown + Table)

### Contenu du rapport exporté
- Résumé de la campagne
- Liste complète des fonctionnalités avec statuts
- Liste détaillée des anomalies
- Historique complet des actions
- Statistiques agrégées
- Membres de l'équipe

---

## 10. Système de navigation

### Menu principal (Sidebar/Header)

**Visible pour tous les profils :**
- Logo + Nom de l'application
- Compteur de notifications (badge rouge)
- Avatar utilisateur + nom

### Liens de navigation adaptés par profil

**Administrateur :**
- Tableau de bord
- Projets
- Campagnes
- Rapports

**Chef testeur :**
- Tableau de bord
- Projets
- Campagnes (avec gestion complète)
- Rapports

**Testeur :**
- Tableau de bord
- Mes tâches
- Notifications

**Développeur :**
- Tableau de bord
- Mes anomalies
- Notifications

### Menu utilisateur (dropdown)
- Profil : [Nom + Rôle]
- Notifications (avec compteur)
- Déconnexion

---

## 📊 Règles de navigation (≤ 3 clics)

### Exemples de parcours

**Testeur : Signaler une anomalie**
1. Dashboard → Mes tâches
2. Sélectionner fonctionnalité → Bouton "Anomalie"
3. Remplir formulaire → Confirmer
✅ **3 clics**

**Développeur : Voir une anomalie**
1. Dashboard → Mes anomalies
2. Cliquer sur anomalie
✅ **2 clics**

**Chef : Exporter un rapport**
1. Dashboard → Rapports
2. Sélectionner campagne
3. Exporter PDF
✅ **3 clics**

**Chef : Assigner une tâche**
1. Dashboard → Campagnes
2. Voir campagne
3. Assigner testeur
✅ **3 clics**

---

## 🎨 Charte graphique

### Palette de couleurs

**Couleurs principales :**
- Bleu primaire : `#2563eb` (boutons, liens)
- Bleu clair : Arrière-plans dégradés

**Couleurs de statut :**
- Vert (`#10b981`) : Conforme, Clôturé, Réussi
- Orange (`#f97316`) : En cours, À tester
- Rouge (`#ef4444`) : Anomalie, Critique
- Gris (`#6b7280`) : Non testé, Neutre

**Couleurs de priorité :**
- Critique : Rouge `#fee2e2` / `#991b1b`
- Haute : Orange `#fed7aa` / `#9a3412`
- Moyenne : Jaune `#fef3c7` / `#854d0e`
- Basse : Gris `#f3f4f6` / `#374151`

### Typographie
- Police principale : System font stack
- Tailles : Responsive selon écran

### Composants UI
- Cartes avec ombres légères
- Boutons arrondis (`rounded-lg`)
- Badges arrondis pleins (`rounded-full`)
- Inputs avec bordures (`border`)

---

## 📱 Responsive Design

### Desktop (≥ 1024px)
- Sidebar fixe à gauche
- Grille 4 colonnes pour les cartes stats
- 2 colonnes pour les sections détaillées

### Tablet (768px - 1023px)
- Menu hamburger
- Grille 2 colonnes pour les stats
- Cartes empilées

### Mobile (< 768px)
- Navigation bottom sheet ou hamburger
- 1 colonne pour toutes les cartes
- Boutons pleine largeur
- Formulaires adaptés au tactile

---

## 🔔 Système de notifications

### Types de notifications

1. **Nouvelle anomalie** (pour développeur)
   - "Une anomalie '[Titre]' vous a été notifiée"
   - Lien direct vers la fiche anomalie

2. **Résolution signalée** (pour testeur)
   - "Le développeur a signalé la résolution de '[Titre]'"
   - Lien vers la fiche pour validation

3. **Nouvelle assignation** (pour testeur)
   - "Une nouvelle tâche vous a été assignée"
   - Lien vers la fonctionnalité

### Affichage
- Compteur badge rouge sur l'icône cloche
- Panneau de notifications avec liste chronologique
- Notifications non lues en gras
- Bouton "Marquer tout comme lu"

---

## ✅ Checklist de conformité

### Règles métier implémentées

✅ **Seul un testeur peut modifier le statut d'une fonctionnalité**
- Boutons "Conforme" / "Anomalie" uniquement dans l'espace testeur
- Autres profils : lecture seule

✅ **Un développeur ne peut que signaler une résolution**
- Pas d'accès à la clôture finale
- Bouton "Signaler résolution" uniquement

✅ **Notification directe testeur → développeur**
- Sélection du développeur dans le formulaire d'anomalie
- Notification automatique envoyée

✅ **Chaque campagne est indépendante**
- Données isolées par campagne
- Pas de mélange entre campagnes

✅ **Blocage après 5 échecs de connexion**
- Compteur d'échecs
- Message "Compte bloqué temporairement"

### Écrans obligatoires
✅ 1. Connexion  
✅ 2. Dashboard adapté  
✅ 3. Gestion projets  
✅ 4. Gestion campagnes  
✅ 5. Assignation tâches  
✅ 6. Espace testeur  
✅ 7. Espace développeur  
✅ 8. Fiche anomalie  
✅ 9. Tableau de bord campagne  
✅ 10. Reporting avec export  

---

## 🎯 Points d'attention pour les screenshots

Pour capturer des screenshots représentatifs, naviguez avec les comptes suivants :

### Compte Admin
```
Email: admin@test.fr
Password: admin123
```
**Screenshots recommandés :**
- Dashboard admin avec statistiques
- Page gestion projets
- Liste des campagnes

### Compte Chef Testeur
```
Email: chef@test.fr
Password: chef123
```
**Screenshots recommandés :**
- Détail campagne avec équipe
- Formulaire d'assignation
- Page de reporting avec filtres

### Compte Testeur
```
Email: testeur@test.fr
Password: testeur123
```
**Screenshots recommandés :**
- Liste des tâches assignées
- Dialog de signalement d'anomalie
- Vue détaillée d'une fonctionnalité

### Compte Développeur
```
Email: dev@test.fr
Password: dev123
```
**Screenshots recommandés :**
- Liste des anomalies avec filtres
- Fiche anomalie détaillée avec historique
- Dialog de signalement de résolution

---

## 📝 Notes techniques

### Architecture
- **Frontend :** React 18 + TypeScript
- **Routing :** React Router v7
- **Styling :** Tailwind CSS v4
- **Composants UI :** Radix UI (via design system)
- **Icônes :** Lucide React
- **Notifications :** Sonner (toast)

### Contextes
- **AuthContext :** Gestion authentification et utilisateurs
- **DataContext :** Gestion des données (projets, campagnes, fonctionnalités, anomalies)

### Données mock
Toutes les données sont actuellement stockées en localStorage pour la démonstration.

---

**Document créé le :** 21 mai 2026  
**Version de l'application :** 1.0  
**Nom de l'application :** QualityTrack
