import { User, Projet, Campagne, Fonctionnalite, Anomalie, Notification, HistoriqueAction } from '../types';

export const users: User[] = [
  {
    id: '1',
    nom: 'Dupont',
    prenom: 'Jean',
    email: 'admin@test.fr',
    role: 'admin',
    password: 'admin123',
    tentativesEchouees: 0
  },
  {
    id: '2',
    nom: 'Martin',
    prenom: 'Sophie',
    email: 'chef@test.fr',
    role: 'chef_testeur',
    password: 'chef123',
    tentativesEchouees: 0
  },
  {
    id: '3',
    nom: 'Bernard',
    prenom: 'Luc',
    email: 'testeur@test.fr',
    role: 'testeur',
    password: 'testeur123',
    tentativesEchouees: 0
  },
  {
    id: '4',
    nom: 'Rousseau',
    prenom: 'Marie',
    email: 'testeur2@test.fr',
    role: 'testeur',
    password: 'testeur123',
    tentativesEchouees: 0
  },
  {
    id: '5',
    nom: 'Moreau',
    prenom: 'Paul',
    email: 'dev@test.fr',
    role: 'developpeur',
    password: 'dev123',
    tentativesEchouees: 0
  },
  {
    id: '6',
    nom: 'Simon',
    prenom: 'Julie',
    email: 'dev2@test.fr',
    role: 'developpeur',
    password: 'dev123',
    tentativesEchouees: 0
  }
];

export const projets: Projet[] = [
  {
    id: 'p1',
    nom: 'Application E-Commerce',
    description: 'Plateforme de vente en ligne avec gestion des commandes et paiements',
    dateDebut: '2026-01-15',
    dateFin: '2026-06-30',
    statut: 'actif',
    creePar: '1',
    dateCreation: '2026-01-10'
  },
  {
    id: 'p2',
    nom: 'Gestion RH',
    description: 'Système de gestion des ressources humaines et paie',
    dateDebut: '2026-03-01',
    dateFin: '2026-08-31',
    statut: 'actif',
    creePar: '1',
    dateCreation: '2026-02-20'
  },
  {
    id: 'p3',
    nom: 'CRM Client',
    description: 'Gestion de la relation client et suivi commercial',
    dateDebut: '2025-10-01',
    dateFin: '2026-02-28',
    statut: 'archive',
    creePar: '1',
    dateCreation: '2025-09-15'
  }
];

export const campagnes: Campagne[] = [
  {
    id: 'c1',
    nom: 'Sprint 1 - Authentification',
    projetId: 'p1',
    description: 'Tests du module d\'authentification et gestion des utilisateurs',
    dateDebut: '2026-05-01',
    dateFin: '2026-05-31',
    equipeTesteurs: ['3', '4'],
    equipeDeveloppeurs: ['5', '6'],
    chefTesteurIds: ['2'],
    statut: 'en_cours',
    dateCreation: '2026-04-25'
  },
  {
    id: 'c2',
    nom: 'Sprint 2 - Catalogue produits',
    projetId: 'p1',
    description: 'Tests du catalogue, recherche et filtres',
    dateDebut: '2026-06-01',
    dateFin: '2026-06-30',
    equipeTesteurs: ['3', '4'],
    equipeDeveloppeurs: ['5', '6'],
    chefTesteurIds: ['2'],
    statut: 'en_preparation',
    dateCreation: '2026-05-15'
  },
  {
    id: 'c3',
    nom: 'Campagne RH - Paie',
    projetId: 'p2',
    description: 'Tests du module de paie et bulletins',
    dateDebut: '2026-05-10',
    dateFin: '2026-06-10',
    equipeTesteurs: ['4'],
    equipeDeveloppeurs: ['6'],
    chefTesteurIds: ['2'],
    statut: 'en_cours',
    dateCreation: '2026-05-05'
  }
];

export const fonctionnalites: Fonctionnalite[] = [
  {
    id: 'f1',
    campagneId: 'c1',
    nom: 'Connexion utilisateur',
    description: 'Vérifier la connexion avec email et mot de passe',
    module: 'Authentification',
    testeurAssigneId: '3',
    statut: 'conforme',
    priorite: 'critique',
    dateAssignation: '2026-05-01',
    dateTest: '2026-05-03'
  },
  {
    id: 'f2',
    campagneId: 'c1',
    nom: 'Déconnexion',
    description: 'Vérifier la déconnexion et la suppression de session',
    module: 'Authentification',
    testeurAssigneId: '3',
    statut: 'conforme',
    priorite: 'haute',
    dateAssignation: '2026-05-01',
    dateTest: '2026-05-03'
  },
  {
    id: 'f3',
    campagneId: 'c1',
    nom: 'Réinitialisation mot de passe',
    description: 'Tester l\'envoi d\'email et le changement de mot de passe',
    module: 'Authentification',
    testeurAssigneId: '4',
    statut: 'anomalie',
    priorite: 'haute',
    dateAssignation: '2026-05-02',
    dateTest: '2026-05-05'
  },
  {
    id: 'f4',
    campagneId: 'c1',
    nom: 'Gestion des rôles',
    description: 'Vérifier les permissions selon les rôles utilisateur',
    module: 'Authentification',
    testeurAssigneId: '3',
    statut: 'anomalie',
    priorite: 'critique',
    dateAssignation: '2026-05-03',
    dateTest: '2026-05-06'
  },
  {
    id: 'f5',
    campagneId: 'c1',
    nom: 'Blocage après 5 tentatives',
    description: 'Vérifier le blocage du compte après 5 échecs de connexion',
    module: 'Sécurité',
    testeurAssigneId: '4',
    statut: 'non_testee',
    priorite: 'haute',
    dateAssignation: '2026-05-07'
  },
  {
    id: 'f6',
    campagneId: 'c1',
    nom: 'Validation format email',
    description: 'Tester la validation du format email lors de l\'inscription',
    module: 'Authentification',
    testeurAssigneId: '3',
    statut: 'non_testee',
    priorite: 'moyenne',
    dateAssignation: '2026-05-08'
  },
  {
    id: 'f7',
    campagneId: 'c3',
    nom: 'Calcul des heures supplémentaires',
    description: 'Vérifier le calcul automatique des heures sup',
    module: 'Paie',
    testeurAssigneId: '4',
    statut: 'anomalie',
    priorite: 'critique',
    dateAssignation: '2026-05-10',
    dateTest: '2026-05-12'
  }
];

export const anomalies: Anomalie[] = [
  {
    id: 'a1',
    fonctionnaliteId: 'f3',
    campagneId: 'c1',
    titre: 'Email de réinitialisation non reçu',
    description: 'L\'email de réinitialisation de mot de passe n\'est pas envoyé. Testé avec plusieurs adresses email (Gmail, Outlook). Aucun message d\'erreur affiché.',
    testeurId: '4',
    developpeurId: '5',
    statut: 'resolution_signalee',
    priorite: 'haute',
    dateCreation: '2026-05-05T10:30:00',
    dateResolution: '2026-05-18T14:20:00',
    commentaireResolution: 'Configuration SMTP corrigée. Les emails sont maintenant envoyés correctement.'
  },
  {
    id: 'a2',
    fonctionnaliteId: 'f4',
    campagneId: 'c1',
    titre: 'Permissions admin non respectées',
    description: 'Un utilisateur avec le rôle "Testeur" peut accéder à la page d\'administration et créer des projets, ce qui ne devrait être autorisé que pour les admins.',
    testeurId: '3',
    developpeurId: '6',
    statut: 'en_cours',
    priorite: 'critique',
    dateCreation: '2026-05-06T09:15:00'
  },
  {
    id: 'a3',
    fonctionnaliteId: 'f7',
    campagneId: 'c3',
    titre: 'Erreur calcul heures supplémentaires',
    description: 'Le calcul des heures supplémentaires ne prend pas en compte le coefficient majorateur pour les heures au-delà de 43h. Exemple : 45h travaillées = devrait être 43h normales + 2h à 125%, mais le système calcule 45h normales.',
    testeurId: '4',
    developpeurId: '6',
    statut: 'nouvelle',
    priorite: 'critique',
    dateCreation: '2026-05-12T16:45:00'
  }
];

export const historiqueActions: HistoriqueAction[] = [
  {
    id: 'h1',
    anomalieId: 'a1',
    userId: '4',
    action: 'Anomalie créée',
    commentaire: 'Anomalie détectée lors des tests de réinitialisation',
    date: '2026-05-05T10:30:00'
  },
  {
    id: 'h2',
    anomalieId: 'a1',
    userId: '5',
    action: 'Prise en charge',
    commentaire: 'Je regarde le problème de configuration SMTP',
    date: '2026-05-05T11:00:00'
  },
  {
    id: 'h3',
    anomalieId: 'a1',
    userId: '5',
    action: 'Statut changé : En cours',
    date: '2026-05-05T11:00:00'
  },
  {
    id: 'h4',
    anomalieId: 'a1',
    userId: '5',
    action: 'Résolution signalée',
    commentaire: 'Configuration SMTP corrigée. Les emails sont maintenant envoyés correctement.',
    date: '2026-05-18T14:20:00'
  },
  {
    id: 'h5',
    anomalieId: 'a2',
    userId: '3',
    action: 'Anomalie créée',
    commentaire: 'Faille de sécurité détectée',
    date: '2026-05-06T09:15:00'
  },
  {
    id: 'h6',
    anomalieId: 'a2',
    userId: '6',
    action: 'Statut changé : En cours',
    date: '2026-05-06T10:30:00'
  },
  {
    id: 'h7',
    anomalieId: 'a3',
    userId: '4',
    action: 'Anomalie créée',
    commentaire: 'Erreur critique dans le calcul de paie',
    date: '2026-05-12T16:45:00'
  }
];

export const notifications: Notification[] = [
  {
    id: 'n1',
    userId: '3',
    type: 'assignation',
    titre: 'Nouvelle tâche assignée',
    message: 'La fonctionnalité "Connexion utilisateur" vous a été assignée',
    lue: true,
    dateCreation: '2026-05-01T09:00:00',
    lienUrl: '/testeur/taches'
  },
  {
    id: 'n2',
    userId: '5',
    type: 'anomalie',
    titre: 'Nouvelle anomalie',
    message: 'Une anomalie "Email de réinitialisation non reçu" vous a été notifiée',
    lue: true,
    dateCreation: '2026-05-05T10:30:00',
    lienUrl: '/developpeur/anomalies/a1'
  },
  {
    id: 'n3',
    userId: '4',
    type: 'resolution',
    titre: 'Résolution signalée',
    message: 'Paul Moreau a signalé une résolution pour "Email de réinitialisation non reçu"',
    lue: false,
    dateCreation: '2026-05-18T14:20:00',
    lienUrl: '/anomalies/a1'
  },
  {
    id: 'n4',
    userId: '6',
    type: 'anomalie',
    titre: 'Nouvelle anomalie critique',
    message: 'Une anomalie "Permissions admin non respectées" vous a été notifiée',
    lue: false,
    dateCreation: '2026-05-06T09:15:00',
    lienUrl: '/developpeur/anomalies/a2'
  },
  {
    id: 'n5',
    userId: '6',
    type: 'anomalie',
    titre: 'Nouvelle anomalie critique',
    message: 'Une anomalie "Erreur calcul heures supplémentaires" vous a été notifiée',
    lue: false,
    dateCreation: '2026-05-12T16:45:00',
    lienUrl: '/developpeur/anomalies/a3'
  }
];
