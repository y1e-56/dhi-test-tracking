export type UserRole = 'admin' | 'chef_testeur' | 'testeur' | 'developpeur';

export type StatutFonctionnalite = 'non_testee' | 'conforme' | 'anomalie';

export type StatutAnomalie = 'nouvelle' | 'en_cours' | 'resolution_signalee' | 'validee' | 'cloturee';

export type Priorite = 'basse' | 'moyenne' | 'haute' | 'critique';

export interface User {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  role: UserRole;
  password: string;
  bloqueJusqua?: Date;
  tentativesEchouees: number;
  dateSuppression?: string;
}

export interface Projet {
  id: string;
  nom: string;
  description: string;
  dateDebut: string;
  dateFin: string;
  statut: 'actif' | 'archive';
  creePar: string;
  dateCreation: string;
  chefTesteurIds: string[];
}

export interface Campagne {
  id: string;
  nom: string;
  projetId: string;
  description: string;
  dateDebut: string;
  dateFin: string;
  equipeTesteurs: string[]; // IDs des testeurs
  equipeDeveloppeurs: string[]; // IDs des développeurs
  chefTesteurIds: string[];
  statut: 'en_preparation' | 'en_cours' | 'terminee' | 'archive';
  dateCreation: string;
}

export interface Fonctionnalite {
  id: string;
  campagneId: string;
  nom: string;
  description: string;
  module: string;
  testeurAssigneId?: string;
  developpeurAssigneId?: string;
  assignmentId?: string;
  statut: StatutFonctionnalite;
  priorite: Priorite;
  dateAssignation?: string;
  dateTest?: string;
}

export interface Anomalie {
  id: string;
  testCaseId?: string;
  fonctionnaliteId?: string;
  campagneId: string;
  titre: string;
  description: string;
  testeurId: string;
  developpeurId: string;
  statut: StatutAnomalie;
  priorite: Priorite;
  dateCreation: string;
  dateResolution?: string;
  dateValidation?: string;
  commentaireResolution?: string;
}

export interface HistoriqueAction {
  id: string;
  anomalieId: string;
  userId: string;
  action: string;
  commentaire?: string;
  date: string;
}

export interface Notification {
  id: string;
  userId: string;
  type: 'assignation' | 'anomalie' | 'resolution' | 'validation' | 'autre';
  titre: string;
  message: string;
  lue: boolean;
  dateCreation: string;
  lienUrl?: string;
}

export interface TestCase {
  id: string;
  featureId: string;
  nom: string;
  steps?: string;
  expectedResult?: string;
  status?: string;
  priority?: Priorite;
  dateCreation?: string;
}
