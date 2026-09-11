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

function currentRole(): AppRole | null {
  const session = loadSession();
  if (!session) return null;
  return session.role as AppRole;
}

/**
 * Upload document produit. Pour tout type sans matrice dédiée (ex. types libres,
 * "Règles métier produit"), seuls admin + manager qualité peuvent téléverser.
 */
export function canUploadProductDoc(type: ProductDocumentType): boolean {
  const role = currentRole();
  if (!role) return false;
  const allowed = PRODUCT_DOC_UPLOAD_ROLES[type];
  if (allowed) return allowed.includes(role);
  return role === ADMIN || role === QUALITY;
}

/** L'utilisateur peut-il téléverser au moins un type de document produit ? */
export function canUploadAnyProductDoc(): boolean {
  const role = currentRole();
  if (!role) return false;
  return (
    role === ADMIN ||
    role === QUALITY ||
    role === PO ||
    PRODUCT_DOC_UPLOAD_ROLES["cdc"]?.includes(role) === true ||
    PRODUCT_DOC_UPLOAD_ROLES["notes_techniques"]?.includes(role) === true ||
    PRODUCT_DOC_UPLOAD_ROLES["architecture"]?.includes(role) === true
  );
}

/** L'utilisateur peut-il téléverser au moins un type de document projet ? */
export function canUploadAnyProjectDoc(): boolean {
  const role = currentRole();
  if (!role) return false;
  return (
    PROJECT_DOC_UPLOAD_ROLES["cdc_sprint"]?.includes(role) === true ||
    PROJECT_DOC_UPLOAD_ROLES["spec_features"]?.includes(role) === true ||
    PROJECT_DOC_UPLOAD_ROLES["cas_de_test"]?.includes(role) === true
  );
}

/**
 * Upload document projet. Le rapport de campagne n'est jamais téléversé par un
 * humain (généré par le système).
 */
export function canUploadProjectDoc(type: ProjectDocumentType): boolean {
  const role = currentRole();
  if (!role) return false;
  const allowed = PROJECT_DOC_UPLOAD_ROLES[type];
  if (!allowed) return false;
  return allowed.includes(role);
}

/**
 * Suppression document produit. Pour tout type sans matrice dédiée, seul admin
 * peut supprimer.
 */
export function canDeleteProductDoc(type: ProductDocumentType): boolean {
  const role = currentRole();
  if (!role) return false;
  const allowed = PRODUCT_DOC_DELETE_ROLES[type];
  if (allowed) return allowed.includes(role);
  return role === ADMIN;
}

/**
 * Suppression document projet. Le rapport de campagne est immuable (jamais
 * supprimable, archivé seulement).
 */
export function canDeleteProjectDoc(type: ProjectDocumentType): boolean {
  const role = currentRole();
  if (!role) return false;
  const allowed = PROJECT_DOC_DELETE_ROLES[type];
  if (!allowed) return false;
  return allowed.includes(role);
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
  const role = currentRole();
  if (!role) return false;
  const allowed = CAMPAIGN_DOC_UPLOAD_ROLES[type];
  if (allowed) return allowed.includes(role);
  return role === ADMIN || role === QUALITY;
}

/** L'utilisateur peut-il téléverser au moins un type de document campagne ? */
export function canUploadAnyCampaignDoc(): boolean {
  const role = currentRole();
  if (!role) return false;
  return (
    !!CAMPAIGN_DOC_UPLOAD_ROLES["scenario_test"]?.includes(role) ||
    !!CAMPAIGN_DOC_UPLOAD_ROLES["rapport_execution"]?.includes(role) ||
    !!CAMPAIGN_DOC_UPLOAD_ROLES["preuve_test"]?.includes(role)
  );
}

/** Suppression document campagne : tout type sans matrice dédiée → admin seul. */
export function canDeleteCampaignDoc(type: CampaignDocumentType): boolean {
  const role = currentRole();
  if (!role) return false;
  const allowed = CAMPAIGN_DOC_DELETE_ROLES[type];
  if (allowed) return allowed.includes(role);
  return role === ADMIN;
}

/** Upload document fonctionnalité : tout type sans matrice dédiée → admin + qualité. */
export function canUploadFeatureDoc(type: FeatureDocumentType): boolean {
  const role = currentRole();
  if (!role) return false;
  const allowed = FEATURE_DOC_UPLOAD_ROLES[type];
  if (allowed) return allowed.includes(role);
  return role === ADMIN || role === QUALITY;
}

/** L'utilisateur peut-il téléverser au moins un type de document fonctionnalité ? */
export function canUploadAnyFeatureDoc(): boolean {
  const role = currentRole();
  if (!role) return false;
  return (
    !!FEATURE_DOC_UPLOAD_ROLES["specification"]?.includes(role) ||
    !!FEATURE_DOC_UPLOAD_ROLES["plan_test"]?.includes(role) ||
    !!FEATURE_DOC_UPLOAD_ROLES["preuve_recette"]?.includes(role) ||
    !!FEATURE_DOC_UPLOAD_ROLES["autre"]?.includes(role)
  );
}

/** Suppression document fonctionnalité : tout type sans matrice dédiée → admin seul. */
export function canDeleteFeatureDoc(type: FeatureDocumentType): boolean {
  const role = currentRole();
  if (!role) return false;
  const allowed = FEATURE_DOC_DELETE_ROLES[type];
  if (allowed) return allowed.includes(role);
  return role === ADMIN;
}

/** Lecture document campagne : tous les rôles connectés. */
export function canReadCampaignDoc(): boolean {
  return getUser() !== null;
}

/** Lecture document fonctionnalité : tous les rôles connectés. */
export function canReadFeatureDoc(): boolean {
  return getUser() !== null;
}
