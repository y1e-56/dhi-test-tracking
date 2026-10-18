import { loadSession } from "./dhi-store";
import { ROLE_PAGES, type AppRole } from "./dhi-data";

/**
 * Vérifie si l'utilisateur connecté a accès à la page donnée
 * @param path - Le chemin de la page à vérifier
 * @returns true si l'utilisateur a accès, false sinon
 */
export function hasAccessToPage(path: string): boolean {
  const session = loadSession();
  if (!session) return false;

  const role = session.role as AppRole;
  const allowedPages = ROLE_PAGES[role] || [];

  // Vérifier si le chemin exact est autorisé
  if (allowedPages.includes(path)) return true;

  // Vérifier si un chemin parent est autorisé (pour les routes dynamiques)
  // Par exemple, si "/produits" est autorisé, alors "/produits/123" l'est aussi
  const pathParts = path.split('/').filter(Boolean);
  if (pathParts.length > 1) {
    const parentPath = '/' + pathParts[0];
    if (allowedPages.includes(parentPath)) return true;
    
    // Vérifier les chemins à deux niveaux comme "/campagnes/ajouter"
    const twoLevelPath = '/' + pathParts.slice(0, 2).join('/');
    if (allowedPages.includes(twoLevelPath)) return true;
  }

  return false;
}

/**
 * Redirige l'utilisateur vers une page autorisée si la page actuelle n'est pas accessible
 * @param currentPath - Le chemin actuel
 * @returns Le chemin de redirection ou null si aucune redirection n'est nécessaire
 */
export function getRedirectForUnauthorizedAccess(currentPath: string): string | null {
  const session = loadSession();
  if (!session) return '/login';

  return getDefaultDashboardForRole(session.role as AppRole);
}

/**
 * Obtient le dashboard par défaut pour un rôle donné
 * @param role - Le rôle de l'utilisateur
 * @returns Le chemin du dashboard par défaut
 */
export function getDefaultDashboardForRole(role: AppRole): string {
  const roleDashboards: Record<AppRole, string> = {
    admin: "/dashboard-admin",
    qa_lead: "/",
    quality_manager: "/",
    product_owner: "/",
    chef_projet: "/dashboard-chef",
    chef_testeur: "/dashboard-testeur",
    testeur: "/dashboard-testeur",
    developpeur: "/dashboard-developpeur",
    approver: "/",
    lecteur: "/",
  };
  return roleDashboards[role] || "/";
}

/**
 * Rôles autorisés à créer — aligné sur les matrices d'écriture du backend
 * (backend/src/routes : products.js, projects.js, campaigns.js, features.js, requirements.js).
 */
export const CREATE_PRODUCT_ROLES: AppRole[] = ["admin", "quality_manager", "qa_lead"];
export const CREATE_PROJECT_ROLES: AppRole[] = ["admin"];
export const CREATE_CAMPAIGN_ROLES: AppRole[] = [
  "admin",
  "chef_testeur",
  "quality_manager",
  "qa_lead",
  "chef_projet",
];
export const CREATE_FEATURE_ROLES: AppRole[] = [
  "admin",
  "quality_manager",
  "qa_lead",
  "chef_projet",
  "chef_testeur",
  "product_owner",
];
export const CREATE_REQUIREMENT_ROLES: AppRole[] = CREATE_FEATURE_ROLES;

function roleIs(...roles: AppRole[]): boolean {
  const session = loadSession();
  if (!session) return false;
  return roles.includes(session.role as AppRole);
}

/** L'utilisateur connecté peut-il créer un produit ? */
export function canCreateProduct(): boolean {
  return roleIs(...CREATE_PRODUCT_ROLES);
}

/** L'utilisateur connecté peut-il créer un projet ? */
export function canCreateProject(): boolean {
  return roleIs(...CREATE_PROJECT_ROLES);
}

/** L'utilisateur connecté peut-il créer une campagne de tests ? */
export function canCreateCampaign(): boolean {
  return roleIs(...CREATE_CAMPAIGN_ROLES);
}

/** L'utilisateur connecté peut-il créer une fonctionnalité ? */
export function canCreateFeature(): boolean {
  return roleIs(...CREATE_FEATURE_ROLES);
}

/** L'utilisateur connecté peut-il créer une exigence ? */
export function canCreateRequirement(): boolean {
  return roleIs(...CREATE_REQUIREMENT_ROLES);
}
