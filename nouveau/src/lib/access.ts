import { loadSession, type SessionUser } from "@/lib/dhi-store";
import type {
  AppRole,
  Campaign,
  Defect,
  PlatformUser,
  Product,
  Project,
  WatchPoint,
} from "@/lib/dhi-data";

const FULL_ACCESS_ROLES: AppRole[] = ["admin", "quality_manager", "product_owner", "qa_lead"];

/** Tous les rôles attribués à un utilisateur (union). */
export function userRoles(user: SessionUser | null | undefined): AppRole[] {
  if (!user) return [];
  return Array.isArray(user.roles) && user.roles.length > 0 ? user.roles : [user.role];
}

/** L'utilisateur a-t-il l'un des rôles donné (union sur ses rôles attribués) ? */
export function hasAnyRole(user: SessionUser | null | undefined, ...roles: AppRole[]): boolean {
  return userRoles(user).some((r) => roles.includes(r));
}

/** Vérification multi-rôles pour un utilisateur de la plateforme (union). */
export function userHasAnyRole(
  user: PlatformUser | null | undefined,
  ...roles: AppRole[]
): boolean {
  if (!user) return false;
  const assigned = Array.isArray(user.roles) && user.roles.length > 0 ? user.roles : [user.role];
  return assigned.some((r) => roles.includes(r));
}

export function canAccessAll(role?: string): boolean {
  if (!role) return false;
  return (FULL_ACCESS_ROLES as string[]).includes(role);
}

/** L'utilisateur peut-il tout voir (union : dès qu'un de ses rôles a le plein accès) ? */
export function userCanAccessAll(user: SessionUser | null | undefined): boolean {
  return userRoles(user).some((r) => canAccessAll(r));
}

export function getUser(): SessionUser | null {
  return loadSession();
}

export function productVisibleTo(product: Product, user: SessionUser | null): boolean {
  if (!user) return false;
  if (userCanAccessAll(user)) return true;
  const name = user.name;
  return (
    product.owner === name ||
    product.qaLead === name ||
    (Array.isArray(product.qaTeam) && product.qaTeam.includes(name))
  );
}

export function projectVisibleTo(
  project: Project,
  products: Product[],
  user: SessionUser | null,
): boolean {
  if (!user) return false;
  if (userCanAccessAll(user)) return true;
  const product = products.find((p) => p.id === project.productId);
  if (product && productVisibleTo(product, user)) return true;
  const name = user.name;
  return project.manager === name || project.qaLead === name;
}

/**
 * Roles transverses : ils n'exercent pas de role operationnel sur une campagne
 * mais ont une vue d'ensemble (le lecteur est en lecture seule partout). Sans
 * cette exception, ils ne verraient aucune campagne du tout, puisque l'acces
 * campagne passe par l'affectation.
 */
const TRANSVERSE_ROLES: AppRole[] = ["lecteur"];

/**
 * Acces a une campagne : les roles qualite (vue complete) voient tout, les roles
 * transverses voient les campagnes de leurs produits, sinon l'utilisateur doit
 * etre membre de la campagne — chef testeur, testeur ou developpeur. Etre owner
 * ou QA d'un produit ne suffit pas pour un role operationnel : sinon un chef
 * testeur voyait toutes les campagnes du produit.
 */
export function campaignVisibleTo(
  campaign: Campaign,
  products: Product[],
  user: SessionUser | null,
): boolean {
  if (!user) return false;
  if (userCanAccessAll(user)) return true;
  const name = user.name;
  if (!name) return false;
  if (
    hasAnyRole(user, ...TRANSVERSE_ROLES) &&
    products.some((p) => p.id === campaign.productId && productVisibleTo(p, user))
  ) {
    return true;
  }
  return (
    campaign.owner === name ||
    (Array.isArray(campaign.testLeads) && campaign.testLeads.includes(name)) ||
    (Array.isArray(campaign.testers) && campaign.testers.includes(name)) ||
    (Array.isArray(campaign.developers) && campaign.developers.includes(name))
  );
}

export function visibleProducts(products: Product[], user: SessionUser | null): Product[] {
  if (!user || userCanAccessAll(user)) return products;
  return products.filter((p) => productVisibleTo(p, user));
}

/**
 * Produits sur lesquels l'utilisateur travaille : ceux qu'il voit par son role
 * produit (owner, QA…) et ceux ou il est membre d'au moins une campagne. Un
 * chef testeur ou un testeur n'est rattache qu'aux campagnes : sans ce second
 * critere, il ne voyait aucun produit (points a surveiller vides, formulaires
 * sans produit).
 */
export function workProducts(
  products: Product[],
  campaigns: Campaign[],
  user: SessionUser | null,
): Product[] {
  if (!user || userCanAccessAll(user)) return products;
  return products.filter(
    (p) =>
      productVisibleTo(p, user) ||
      campaigns.some((c) => c.productId === p.id && campaignVisibleTo(c, products, user)),
  );
}

/** Un point a surveiller est visible sur un produit de travail, ou par son responsable. */
export function watchPointVisibleTo(
  point: WatchPoint,
  products: Product[],
  campaigns: Campaign[],
  user: SessionUser | null,
): boolean {
  if (!user) return false;
  if (point.owner && point.owner === user.name) return true;
  return workProducts(products, campaigns, user).some((p) => p.id === point.productId);
}

export function visibleProjects(
  projects: Project[],
  products: Product[],
  user: SessionUser | null,
): Project[] {
  if (!user || userCanAccessAll(user)) return projects;
  return projects.filter((p) => projectVisibleTo(p, products, user));
}

export function visibleCampaigns(
  campaigns: Campaign[],
  products: Product[],
  user: SessionUser | null,
): Campaign[] {
  if (!user || userCanAccessAll(user)) return campaigns;
  return campaigns.filter((c) => campaignVisibleTo(c, products, user));
}

/**
 * Acces a une anomalie : les roles qualite voient tout ; chacun voit celles
 * qu'il a declarees ou qui lui sont confiees. Le responsable ou un chef testeur
 * de la campagne voit toutes les anomalies de sa campagne (il les pilote), et un
 * role transverse celles des campagnes qui lui sont visibles (lecture seule).
 */
export function defectVisibleTo(
  defect: Defect,
  user: SessionUser | null,
  campaigns: Campaign[] = [],
  products: Product[] = [],
): boolean {
  if (!user) return false;
  if (userCanAccessAll(user)) return true;
  const name = user.name;
  if (defect.reporter === name || defect.assignee === name || defect.developer === name) {
    return true;
  }
  const campaign = campaigns.find((c) => c.id === defect.campaignId);
  if (!campaign || !name) return false;
  if (campaign.owner === name || (campaign.testLeads ?? []).includes(name)) return true;
  return hasAnyRole(user, ...TRANSVERSE_ROLES) && campaignVisibleTo(campaign, products, user);
}

/**
 * Développeurs affectables à une anomalie : uniquement les membres actifs de
 * l'équipe développeurs de sa campagne (le serveur applique la même règle).
 */
export function campaignDevelopers(
  campaign: Pick<Campaign, "developers"> | undefined,
  users: PlatformUser[],
): string[] {
  const team = new Set(campaign?.developers ?? []);
  return users.filter((u) => u.active && team.has(u.name)).map((u) => u.name);
}

export function visibleDefects(
  defects: Defect[],
  user: SessionUser | null,
  campaigns: Campaign[] = [],
  products: Product[] = [],
): Defect[] {
  if (!user || userCanAccessAll(user)) return defects;
  return defects.filter((d) => defectVisibleTo(d, user, campaigns, products));
}

/**
 * Seuls les comptes de rôle « testeur » sont proposés comme testeurs d'une
 * campagne. Un chef testeur se choisit dans le champ « Chef(s) de test » : le
 * proposer aussi parmi les testeurs melangeait deux rôles sur la même campagne.
 */
export function isTesterRole(roles: string[] | undefined, role?: string): boolean {
  const assigned = Array.isArray(roles) && roles.length > 0 ? roles : role ? [role] : [];
  return assigned.includes("testeur");
}

/**
 * Testeurs assignables à une campagne : uniquement les comptes actifs qui ont
 * été enregistrés lors de la création de la campagne (campaign.testers), pas
 * tous les testeurs de l'application.
 */
/**
 * Testeur de la campagne designe dans un fichier d'import, par e-mail (forme
 * recommandee, sans ambiguite) ou par nom (anciens fichiers).
 */
export function findTesterOption(
  options: { id: string; name: string }[],
  users: PlatformUser[],
  value: string,
): { id: string; name: string } | undefined {
  const wanted = value.trim().toLowerCase();
  if (!wanted) return undefined;
  const byEmail = users.find((u) => u.email?.toLowerCase() === wanted);
  return options.find((o) => o.name.toLowerCase() === wanted || (byEmail && o.id === byEmail.id));
}

/** E-mail du premier testeur de la campagne, pour illustrer les modeles d'import. */
export function sampleTesterEmail(
  options: { id: string; name: string }[],
  users: PlatformUser[],
): string {
  return users.find((u) => u.id === options[0]?.id)?.email ?? "";
}

export function campaignTesterOptions(
  users: PlatformUser[],
  campaignTesters: string[] | undefined,
): { id: string; name: string }[] {
  const names = new Set(campaignTesters ?? []);
  return users
    .filter((u) => {
      if (!u.active || !names.has(u.name)) return false;
      if (!isTesterRole(u.roles, u.role)) return false;
      const id = Number(u.id);
      return Number.isInteger(id) && id > 0;
    })
    .sort((a, b) => a.name.localeCompare(b.name, "fr"))
    .map((u) => ({ id: u.id, name: u.name }));
}
