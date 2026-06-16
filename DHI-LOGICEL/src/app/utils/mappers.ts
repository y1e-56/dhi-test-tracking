/**
 * Mappers FR ↔ EN entre Frontend et Backend
 * Le backend utilise l'anglais (admin, test_lead, tester, developer, etc.)
 * Le frontend utilise le français (admin, chef_testeur, testeur, developpeur, etc.)
 */

import {
  User,
  UserRole,
  Projet,
  Campagne,
  Fonctionnalite,
  Anomalie,
  StatutFonctionnalite,
  StatutAnomalie,
  Priorite,
  Notification,
  HistoriqueAction,
} from '../types';

// =====================
// RÔLES
// =====================
const ROLE_FR_TO_EN: Record<UserRole, string> = {
  admin: 'admin',
  chef_testeur: 'test_lead',
  testeur: 'tester',
  developpeur: 'developer',
};

const ROLE_EN_TO_FR: Record<string, UserRole> = {
  admin: 'admin',
  test_lead: 'chef_testeur',
  tester: 'testeur',
  developer: 'developpeur',
};

export const mapRoleToBackend = (role: UserRole): string => ROLE_FR_TO_EN[role] || role;
export const mapRoleToFrontend = (role: string): UserRole => ROLE_EN_TO_FR[role] || (role as UserRole);

// =====================
// STATUTS ANOMALIE
// =====================
const ANOMALY_STATUS_FR_TO_EN: Record<StatutAnomalie, string> = {
  nouvelle: 'new',
  en_cours: 'in_progress',
  resolution_signalee: 'resolution_signaled',
  validee: 'validated',
  cloturee: 'validated', // 'cloturee' frontend = 'validated' backend (anomalie clôturée = validée)
};

const ANOMALY_STATUS_EN_TO_FR: Record<string, StatutAnomalie> = {
  new: 'nouvelle',
  in_progress: 'en_cours',
  resolution_signaled: 'resolution_signalee',
  validated: 'validee',
  rejected: 'nouvelle', // une anomalie rejetée retourne en 'nouvelle' côté frontend
};

export const mapAnomalyStatusToBackend = (s: StatutAnomalie): string =>
  ANOMALY_STATUS_FR_TO_EN[s] || s;
export const mapAnomalyStatusToFrontend = (s: string): StatutAnomalie =>
  ANOMALY_STATUS_EN_TO_FR[s] || (s as StatutAnomalie);

// =====================
// STATUTS FONCTIONNALITÉ
// =====================
const FEATURE_STATUS_FR_TO_EN: Record<StatutFonctionnalite, string> = {
  non_testee: 'pending',
  conforme: 'conforme',
  anomalie: 'anomaly_detected',
};

const FEATURE_STATUS_EN_TO_FR: Record<string, StatutFonctionnalite> = {
  pending: 'non_testee',
  conforme: 'conforme',
  anomaly_detected: 'anomalie',
};

export const mapFeatureStatusToBackend = (s: StatutFonctionnalite): string =>
  FEATURE_STATUS_FR_TO_EN[s] || s;
export const mapFeatureStatusToFrontend = (s: string): StatutFonctionnalite =>
  FEATURE_STATUS_EN_TO_FR[s] || (s as StatutFonctionnalite);

// =====================
// PRIORITÉ
// =====================
const PRIORITY_FR_TO_EN: Record<Priorite, string> = {
  basse: 'low',
  moyenne: 'medium',
  haute: 'high',
  critique: 'critical',
};

const PRIORITY_EN_TO_FR: Record<string, Priorite> = {
  low: 'basse',
  medium: 'moyenne',
  high: 'haute',
  critical: 'critique',
};

export const mapPriorityToBackend = (p: Priorite): string => PRIORITY_FR_TO_EN[p] || p;
export const mapPriorityToFrontend = (p: string): Priorite => PRIORITY_EN_TO_FR[p] || (p as Priorite);

// =====================
// USER
// =====================
export const mapUserFromBackend = (u: any): User => ({
  id: String(u.id),
  email: u.email,
  nom: u.last_name,
  prenom: u.first_name,
  role: mapRoleToFrontend(u.role),
  password: '', // jamais retourné par le backend
  tentativesEchouees: u.failed_login_attempts || 0,
  bloqueJusqua: u.locked_until ? new Date(u.locked_until) : undefined,
});

export const mapUserToBackend = (u: Partial<User> & { password?: string }) => ({
  email: u.email,
  password: u.password,
  first_name: u.prenom,
  last_name: u.nom,
  role: u.role ? mapRoleToBackend(u.role) : undefined,
});

// =====================
// PROJET
// =====================
export const mapProjetFromBackend = (p: any): Projet => ({
  id: String(p.id),
  nom: p.name,
  description: p.description || '',
  dateDebut: p.start_date,
  dateFin: p.end_date,
  statut: p.is_archived ? 'archive' : 'actif',
  creePar: String(p.created_by),
  dateCreation: p.created_at,
  chefTesteurIds: (p.test_lead_ids || []).map((id: any) => String(id)),
});

export const mapProjetToBackend = (p: Partial<Projet>) => ({
  name: p.nom,
  description: p.description,
  start_date: p.dateDebut,
  end_date: p.dateFin,
  test_lead_ids: p.chefTesteurIds?.map(id => parseInt(id)),
});

// =====================
// CAMPAGNE
// =====================
export const mapCampagneFromBackend = (c: any): Campagne => ({
  id: String(c.id),
  nom: c.name,
  projetId: String(c.project_id),
  description: c.objective || '',
  dateDebut: c.start_date,
  dateFin: c.end_date,
  equipeTesteurs: [...new Set((c.testers || []).map((id: any) => String(id)))],
  equipeDeveloppeurs: [...new Set((c.developers || []).map((id: any) => String(id)))],
  chefTesteurIds: [...new Set((c.test_leads || []).map((id: any) => String(id)))],
  statut: STATUT_CAMPAGNE_EN_TO_FR[c.status] || 'en_preparation',
  dateCreation: c.created_at,
});

const STATUT_CAMPAGNE_FR_TO_EN: Record<string, string> = {
  en_preparation: 'planned',
  planifiée: 'planned',
  en_cours: 'in_progress',
  terminee: 'completed',
  terminée: 'completed',
};

const STATUT_CAMPAGNE_EN_TO_FR: Record<string, Campagne['statut']> = {
  planned: 'en_preparation',
  in_progress: 'en_cours',
  completed: 'terminee',
  archived: 'archive',
};

export const mapCampagneToBackend = (c: Partial<Campagne>) => ({
  project_id: c.projetId ? parseInt(c.projetId) : undefined,
  name: c.nom,
  objective: c.description,
  organization_mode: 'exploratory' as const,
  start_date: c.dateDebut,
  end_date: c.dateFin,
  status: c.statut ? (STATUT_CAMPAGNE_FR_TO_EN[c.statut] || c.statut) : undefined,
  test_lead_ids: c.chefTesteurIds ? [...new Set(c.chefTesteurIds.map(id => parseInt(id)))] : undefined,
  testers: c.equipeTesteurs ? [...new Set(c.equipeTesteurs.map(id => parseInt(id)))] : undefined,
  developers: c.equipeDeveloppeurs ? [...new Set(c.equipeDeveloppeurs.map(id => parseInt(id)))] : undefined,
});

// =====================
// FONCTIONNALITÉ
// =====================
export const mapFonctionnaliteFromBackend = (f: any): Fonctionnalite => {
  const firstAssignment = f.assignments && f.assignments.length > 0 ? f.assignments[0] : null;
  return {
    id: String(f.id),
    campagneId: String(f.campaign_id),
    nom: f.name,
    description: f.description || '',
    module: f.name,
    testeurAssigneId: firstAssignment ? String(firstAssignment.assigned_to) : undefined,
    assignmentId: firstAssignment ? String(firstAssignment.id) : undefined,
    statut: mapFeatureStatusToFrontend(f.status || 'pending'),
    priorite: mapPriorityToFrontend(f.priority || 'medium'),
    dateAssignation: firstAssignment?.assigned_at,
    dateTest: f.updated_at,
  };
};

export const mapFonctionnaliteToBackend = (f: Partial<Fonctionnalite>) => ({
  campaign_id: f.campagneId ? parseInt(f.campagneId) : undefined,
  name: f.nom,
  description: f.description,
  priority: f.priorite ? mapPriorityToBackend(f.priorite) : 'medium',
  status: f.statut ? mapFeatureStatusToBackend(f.statut) : undefined,
});

// =====================
// ANOMALIE
// =====================
export const mapAnomalieFromBackend = (a: any): Anomalie => ({
  id: String(a.id),
  testCaseId: String(a.test_case_id),
  fonctionnaliteId: a.feature_id ? String(a.feature_id) : undefined,
  campagneId: String(a.campaign_id),
  titre: a.description ? a.description.substring(0, 80) : 'Anomalie',
  description: a.description || '',
  testeurId: String(a.reported_by),
  developpeurId: a.assigned_to ? String(a.assigned_to) : '',
  statut: mapAnomalyStatusToFrontend(a.status),
  priorite: 'moyenne',
  dateCreation: a.created_at,
  dateResolution: a.status === 'resolution_signaled' || a.status === 'validated' ? a.updated_at : undefined,
  dateValidation: a.status === 'validated' ? a.updated_at : undefined,
  commentaireResolution: a.resolution_description,
});

export const mapAnomalieToBackend = (a: Partial<Anomalie>) => ({
  test_case_id: a.testCaseId ? parseInt(a.testCaseId) : undefined,
  feature_id: a.fonctionnaliteId ? parseInt(a.fonctionnaliteId) : undefined,
  campaign_id: a.campagneId ? parseInt(a.campagneId) : undefined,
  reported_by: a.testeurId ? parseInt(a.testeurId) : undefined,
  assigned_to: a.developpeurId ? parseInt(a.developpeurId) : undefined,
  description: a.description,
});

// =====================
// NOTIFICATION
// =====================
const NOTIF_TYPE_EN_TO_FR: Record<string, Notification['type']> = {
  anomaly_reported: 'anomalie',
  resolution_signaled: 'resolution',
  reopened: 'anomalie',
  feature_conforme: 'validation',
  task_assigned: 'assignation',
  member_added: 'information',
};

export const mapNotificationFromBackend = (n: any): Notification => ({
  id: String(n.id),
  userId: String(n.notified_user_id),
  type: NOTIF_TYPE_EN_TO_FR[n.notification_type] || 'autre',
  titre: n.notification_type === 'anomaly_reported'
    ? 'Nouvelle anomalie'
    : n.notification_type === 'resolution_signaled'
    ? 'Résolution signalée'
    : n.notification_type === 'reopened'
    ? 'Anomalie réouverte'
    : n.notification_type === 'feature_conforme'
    ? 'Fonctionnalité conforme'
    : n.notification_type === 'task_assigned'
    ? 'Tâche assignée'
    : n.notification_type === 'member_added'
    ? 'Membre ajouté'
    : 'Notification',
  message: n.anomaly_description || n.description || '',
  lue: !!n.is_read,
  dateCreation: n.created_at,
  lienUrl: n.link_url,
});

// =====================
// HISTORIQUE
// =====================
export const mapHistoriqueFromBackend = (h: any): HistoriqueAction => ({
  id: String(h.id),
  anomalieId: h.entity_type === 'anomaly' ? String(h.entity_id) : '',
  userId: String(h.user_id),
  action: h.action_type,
  commentaire: h.description,
  date: h.created_at,
});
