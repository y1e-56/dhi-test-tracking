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
  motDePasseOublieDemandeLe?: string;
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
  produitId?: string | null;
}

export interface Produit {
  id: string;
  nom: string;
  description: string;
  estArchive: boolean;
  ownerId?: string | null;
  qualityManagerId?: string | null;
  creePar?: string | null;
  dateCreation: string;
  dateModification: string;
  nbProjets: number;
  nbVersions: number;
  nbEnvironnements: number;
}

export interface ReleaseProduit {
  id: string;
  produitId: string;
  version: string;
  description: string;
  statut: 'planned' | 'in_progress' | 'released' | 'cancelled';
  datePrevue?: string | null;
  livreeLe?: string | null;
  dateCreation: string;
}

export interface EnvironnementProduit {
  id: string;
  produitId: string;
  nom: string;
  type: 'development' | 'integration' | 'staging' | 'production';
  description: string;
  actif: boolean;
  dateCreation: string;
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
  versionId?: string | null;
  environnementId?: string | null;
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
  dateEcheance?: string;
  dureeJours?: number;
  dateTest?: string;
  attachment?: { name: string; type: string; size: number } | null;
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
  dateLimiteCorrection?: string;
  commentaireResolution?: string;
}

export interface HistoriqueAction {
  id: string;
  anomalieId: string;
  userId: string;
  action: string;
  commentaire?: string;
  date: string;
  entityType: string;
  entityId: string;
  userName: string;
}

export interface Notification {
  id: string;
  userId: string;
  type: 'assignation' | 'anomalie' | 'resolution' | 'validation' | 'information' | 'autre';
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

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationMeta;
}

export interface AnomalieFilters {
  page?: number;
  limit?: number;
  campagneId?: string;
  fonctionnaliteId?: string;
  statut?: StatutAnomalie;
  projetId?: string;
  testeurId?: string;
  developpeurId?: string;
  recherche?: string;
  dateDebut?: string;
  dateFin?: string;
}

export interface UserFilters {
  page?: number;
  limit?: number;
  recherche?: string;
  role?: UserRole;
  bloque?: string;
  includeSupprimes?: string;
}

export interface FeatureFilters {
  page?: number;
  limit?: number;
  campaignId?: string;
  recherche?: string;
  statut?: StatutFonctionnalite;
  priorite?: Priorite;
  assigneeId?: string;
}

export interface HistoryFilters {
  page?: number;
  limit?: number;
  typeAction?: string;
  typeEntite?: string;
  recherche?: string;
  dateDebut?: string;
  dateFin?: string;
}

export type SanteQualite = 'sain' | 'a_surveiller' | 'a_risque' | 'critique';

export interface CritereQualite {
  id: string;
  produitId: string;
  nom: string;
  description: string;
  poids: number;
  estBloquant: boolean;
  dateCreation: string;
}

export interface ScoreQualite {
  id: string;
  produitId: string;
  score: number;
  sante: SanteQualite;
  detail: {
    resultatsTests: number;
    couverture: number;
    couvertureCritiques: number;
    incidents: number;
    nonFonctionnel: number;
    testabilite: number;
    controlesQualite: number;
  };
  dateCalcul: string;
}

export interface PointCritique {
  id: string;
  produitId: string;
  description: string;
  contexte: string;
  criticite: 'faible' | 'moyenne' | 'haute' | 'critique';
  consequence: string;
  responsableId: string | null;
  responsableNom: string;
  criteresValidation: string;
  recommandations: string;
  statut: 'a_verifier' | 'en_cours' | 'valide' | 'non_valide';
  dateCreation: string;
}

export interface HistoriqueQualite {
  id: string;
  produitId: string;
  score: number;
  sante: SanteQualite;
  date: string;
}

export type TypeExigence = 'fonctionnelle' | 'securite' | 'performance' | 'disponibilite' | 'ergonomie' | 'accessibilite' | 'maintenabilite' | 'compatibilite' | 'resilience' | 'observabilite' | 'documentation' | 'testabilite' | 'personnalisee';

export interface Exigence {
  id: string;
  fonctionnaliteId: string;
  campagneId: string;
  titre: string;
  description: string;
  type: TypeExigence;
  criticite: Priorite;
  statut: 'a_verifier' | 'validee' | 'non_validee';
  dateCreation: string;
}

export type TypeTest = 'fonctionnel' | 'integration' | 'end_to_end' | 'regression' | 'unitaire' | 'api' | 'interface' | 'securite' | 'performance' | 'charge' | 'stress' | 'endurance' | 'resilience' | 'compatibilite' | 'accessibilite' | 'ergonomie' | 'disponibilite' | 'recuperation' | 'installation' | 'migration' | 'documentation' | 'testabilite' | 'personnalise';

export interface Scenario {
  id: string;
  fonctionnaliteId: string;
  campagneId: string;
  nom: string;
  description: string;
  priorite: Priorite;
  dateCreation: string;
}

export interface Dependence {
  id: string;
  casTestIdSource: string;
  casTestIdCible: string;
  type: 'avant' | 'apres' | 'requiert_reussite' | 'bloque' | 'depend_fonctionnellement';
  dateCreation: string;
}

export type Verdict = 'pass' | 'fail' | 'blocked' | 'na' | 'non_execute';

export interface TestExecution {
  id: string;
  campagneId: string;
  casTestId: string;
  featureId: string;
  testeurId: string;
  verdict: Verdict;
  notes: string;
  dateExecution: string;
}

export type TypePreuve = 'capture' | 'log' | 'document' | 'video' | 'email' | 'autre';

export interface Preuve {
  id: string;
  executionId: string;
  casTestId: string;
  campagneId: string;
  nom: string;
  type: TypePreuve;
  description: string;
  contenu: string;
  dateAjout: string;
  tags: string[];
}

export interface CampagneEnrichie {
  id: string;
  projetId: string;
  nom: string;
  description: string;
  dateDebut: string;
  dateFin: string;
  statut: string;
  versionId: string | null;
  environnementId: string | null;
  testLeadIds: string[];
  dateCreation: string;
  version: number;
  campagneParentId: string | null;
}
