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
    testeur: "/dashboard-testeur",
    approver: "/",
    lecteur: "/",
  };
  return roleDashboards[role] || "/";
}
