import type {
  AppRole,
  Product,
  ProductDocumentType,
  Project,
  ProjectDocumentType,
  CampaignDocumentType,
  FeatureDocumentType,
} from "./dhi-data";
import { getUser, projectVisibleTo } from "./access";
import { loadSession } from "./dhi-store";

/**
 * Permissions documents – matrices upload / lecture / suppression par rôle.
 */
const ADMIN = "admin";
const QUALITY = "quality_manager";
const PO = "product_owner";
const CHEF_PRJ = "chef_projet";
const CHEF_TST = "chef_testeur";

/** Rapport de campagne : généré automatiquement (aucun rôle humain), immuable. */
export const CAMPAIGN_REPORT_TYPE: ProjectDocumentType = "rapport_campagne";

/** Rôles autorisés à téléverser chaque type de document produit. */
export const PRODUCT_DOC_UPLOAD_ROLES: Record<string, AppRole[]> = {
  cdc: [ADMIN, QUALITY, PO],
  notes_techniques: [ADMIN, QUALITY],
  architecture: [ADMIN, QUALITY],
};

/** Rôles autorisés à supprimer chaque type de document produit. */
export const PRODUCT_DOC_DELETE_ROLES: Record<string, AppRole[]> = {
  cdc: [ADMIN],
  notes_techniques: [ADMIN],
  architecture: [ADMIN],
};

/** Rôles autorisés à téléverser chaque type de document projet. */
export const PROJECT_DOC_UPLOAD_ROLES: Record<string, AppRole[]> = {
  cdc_sprint: [CHEF_PRJ, QUALITY, PO],
  spec_features: [CHEF_PRJ, PO, QUALITY],
  cas_de_test: [CHEF_TST, QUALITY],
  rapport_campagne: [],
};

/** Rôles autorisés à supprimer chaque type de document projet. */
export const PROJECT_DOC_DELETE_ROLES: Record<string, AppRole[]> = {
  cdc_sprint: [CHEF_PRJ, ADMIN],
  spec_features: [CHEF_PRJ, PO],
  cas_de_test: [CHEF_TST],
  rapport_campagne: [],
};

/** Rôles autorisés à téléverser chaque type de document campagne. */
export const CAMPAIGN_DOC_UPLOAD_ROLES: Record<string, AppRole[]> = {
  scenario_test: [CHEF_TST, QUALITY],
  rapport_execution: [CHEF_TST, QUALITY],
  preuve_test: [CHEF_TST, QUALITY],
  autre: [CHEF_TST, QUALITY],
};

/** Rôles autorisés à supprimer chaque type de document campagne. */
export const CAMPAIGN_DOC_DELETE_ROLES: Record<string, AppRole[]> = {
  scenario_test: [CHEF_TST, ADMIN],
  rapport_execution: [CHEF_TST, ADMIN],
  preuve_test: [CHEF_TST, ADMIN],
  autre: [CHEF_TST, ADMIN],
};

/** Rôles autorisés à téléverser chaque type de document fonctionnalité. */
export const FEATURE_DOC_UPLOAD_ROLES: Record<string, AppRole[]> = {
  specification: [CHEF_PRJ, QUALITY],
  plan_test: [CHEF_TST, QUALITY],
  preuve_recette: [CHEF_TST, QUALITY],
  autre: [CHEF_PRJ, CHEF_TST, QUALITY],
};

/** Rôles autorisés à supprimer chaque type de document fonctionnalité. */
export const FEATURE_DOC_DELETE_ROLES: Record<string, AppRole[]> = {
  specification: [CHEF_PRJ, ADMIN],
  plan_test: [CHEF_TST, ADMIN],
  preuve_recette: [CHEF_TST, ADMIN],
  autre: [CHEF_PRJ, CHEF_TST, ADMIN],
};

function currentRoles(): AppRole[] {
  const session = loadSession();
  if (!session) return [];
  return Array.isArray(session.roles) && session.roles.length > 0
    ? session.roles
    : [session.role as AppRole];
}

/** L'un des rôles attribués correspond à la matrice autorisée (union). */
function matches(roles: AppRole[], allowed: AppRole[] | undefined): boolean {
  if (!allowed) return false;
  return roles.some((r) => allowed.includes(r));
}

/** L'un des rôles attribués est admin (union). */
function isAdmin(roles: AppRole[]): boolean {
  return roles.includes(ADMIN);
}

/** L'un des rôles attribués est admin ou quality_manager (union). */
function isAdminOrQuality(roles: AppRole[]): boolean {
  return roles.some((r) => r === ADMIN || r === QUALITY);
}

/**
 * Upload document produit. Pour tout type sans matrice dédiée (ex. types libres,
 * "Règles métier produit"), seuls admin + manager qualité peuvent téléverser.
 */
export function canUploadProductDoc(type: ProductDocumentType): boolean {
  const roles = currentRoles();
  if (roles.length === 0) return false;
  const allowed = PRODUCT_DOC_UPLOAD_ROLES[type];
  if (allowed) return matches(roles, allowed);
  return isAdminOrQuality(roles);
}

/** L'utilisateur peut-il téléverser au moins un type de document produit ? */
export function canUploadAnyProductDoc(): boolean {
  const roles = currentRoles();
  if (roles.length === 0) return false;
  return (
    roles.some((r) => r === ADMIN || r === QUALITY || r === PO) ||
    matches(roles, PRODUCT_DOC_UPLOAD_ROLES["cdc"]) ||
    matches(roles, PRODUCT_DOC_UPLOAD_ROLES["notes_techniques"]) ||
    matches(roles, PRODUCT_DOC_UPLOAD_ROLES["architecture"])
  );
}

/** L'utilisateur peut-il téléverser au moins un type de document projet ? */
export function canUploadAnyProjectDoc(): boolean {
  const roles = currentRoles();
  if (roles.length === 0) return false;
  return (
    matches(roles, PROJECT_DOC_UPLOAD_ROLES["cdc_sprint"]) ||
    matches(roles, PROJECT_DOC_UPLOAD_ROLES["spec_features"]) ||
    matches(roles, PROJECT_DOC_UPLOAD_ROLES["cas_de_test"])
  );
}

/**
 * Upload document projet. Le rapport de campagne n'est jamais téléversé par un
 * humain (généré par le système).
 */
export function canUploadProjectDoc(type: ProjectDocumentType): boolean {
  const roles = currentRoles();
  if (roles.length === 0) return false;
  const allowed = PROJECT_DOC_UPLOAD_ROLES[type];
  if (!allowed) return false;
  return matches(roles, allowed);
}

/**
 * Suppression document produit. Pour tout type sans matrice dédiée, seul admin
 * peut supprimer.
 */
export function canDeleteProductDoc(type: ProductDocumentType): boolean {
  const roles = currentRoles();
  if (roles.length === 0) return false;
  const allowed = PRODUCT_DOC_DELETE_ROLES[type];
  if (allowed) return matches(roles, allowed);
  return isAdmin(roles);
}

/**
 * Suppression document projet. Le rapport de campagne est immuable (jamais
 * supprimable, archivé seulement).
 */
export function canDeleteProjectDoc(type: ProjectDocumentType): boolean {
  const roles = currentRoles();
  if (roles.length === 0) return false;
  const allowed = PROJECT_DOC_DELETE_ROLES[type];
  if (!allowed) return false;
  return matches(roles, allowed);
}

/** Lecture document produit : tous les rôles connectés. */
export function canReadProductDoc(): boolean {
  return getUser() !== null;
}

/** Lecture document projet : les membres de l'équipe du projet (ou admin/full). */
export function canReadProjectDoc(project: Project | undefined, products: Product[]): boolean {
  if (!getUser()) return false;
  if (project) return projectVisibleTo(project, products, getUser());
  return true;
}

/** Upload document campagne : tout type sans matrice dédiée → admin + qualité. */
export function canUploadCampaignDoc(type: CampaignDocumentType): boolean {
  const roles = currentRoles();
  if (roles.length === 0) return false;
  const allowed = CAMPAIGN_DOC_UPLOAD_ROLES[type];
  if (allowed) return matches(roles, allowed);
  return isAdminOrQuality(roles);
}

/** L'utilisateur peut-il téléverser au moins un type de document campagne ? */
export function canUploadAnyCampaignDoc(): boolean {
  const roles = currentRoles();
  if (roles.length === 0) return false;
  return (
    matches(roles, CAMPAIGN_DOC_UPLOAD_ROLES["scenario_test"]) ||
    matches(roles, CAMPAIGN_DOC_UPLOAD_ROLES["rapport_execution"]) ||
    matches(roles, CAMPAIGN_DOC_UPLOAD_ROLES["preuve_test"])
  );
}

/** Suppression document campagne : tout type sans matrice dédiée → admin seul. */
export function canDeleteCampaignDoc(type: CampaignDocumentType): boolean {
  const roles = currentRoles();
  if (roles.length === 0) return false;
  const allowed = CAMPAIGN_DOC_DELETE_ROLES[type];
  if (allowed) return matches(roles, allowed);
  return isAdmin(roles);
}

/** Upload document fonctionnalité : tout type sans matrice dédiée → admin + qualité. */
export function canUploadFeatureDoc(type: FeatureDocumentType): boolean {
  const roles = currentRoles();
  if (roles.length === 0) return false;
  const allowed = FEATURE_DOC_UPLOAD_ROLES[type];
  if (allowed) return matches(roles, allowed);
  return isAdminOrQuality(roles);
}

/** L'utilisateur peut-il téléverser au moins un type de document fonctionnalité ? */
export function canUploadAnyFeatureDoc(): boolean {
  const roles = currentRoles();
  if (roles.length === 0) return false;
  return (
    matches(roles, FEATURE_DOC_UPLOAD_ROLES["specification"]) ||
    matches(roles, FEATURE_DOC_UPLOAD_ROLES["plan_test"]) ||
    matches(roles, FEATURE_DOC_UPLOAD_ROLES["preuve_recette"]) ||
    matches(roles, FEATURE_DOC_UPLOAD_ROLES["autre"])
  );
}

/** Suppression document fonctionnalité : tout type sans matrice dédiée → admin seul. */
export function canDeleteFeatureDoc(type: FeatureDocumentType): boolean {
  const roles = currentRoles();
  if (roles.length === 0) return false;
  const allowed = FEATURE_DOC_DELETE_ROLES[type];
  if (allowed) return matches(roles, allowed);
  return isAdmin(roles);
}

/** Lecture document campagne : tous les rôles connectés. */
export function canReadCampaignDoc(): boolean {
  return getUser() !== null;
}

/** Lecture document fonctionnalité : tous les rôles connectés. */
export function canReadFeatureDoc(): boolean {
  return getUser() !== null;
}
