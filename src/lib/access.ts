import { loadSession, type SessionUser } from "@/lib/dhi-store";
import type { AppRole, Campaign, Defect, Product, Project } from "@/lib/dhi-data";

const FULL_ACCESS_ROLES: AppRole[] = ["admin", "quality_manager", "product_owner", "qa_lead"];

export function canAccessAll(role?: string): boolean {
  if (!role) return false;
  return (FULL_ACCESS_ROLES as string[]).includes(role);
}

export function getUser(): SessionUser | null {
  return loadSession();
}

export function productVisibleTo(product: Product, user: SessionUser | null): boolean {
  if (!user) return false;
  if (canAccessAll(user.role)) return true;
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
  if (canAccessAll(user.role)) return true;
  const product = products.find((p) => p.id === project.productId);
  if (product && productVisibleTo(product, user)) return true;
  const name = user.name;
  return project.manager === name || project.qaLead === name;
}

export function campaignVisibleTo(
  campaign: Campaign,
  products: Product[],
  user: SessionUser | null,
): boolean {
  if (!user) return false;
  if (canAccessAll(user.role)) return true;
  const product = products.find((p) => p.id === campaign.productId);
  if (product && productVisibleTo(product, user)) return true;
  const name = user.name;
  return campaign.owner === name || (Array.isArray(campaign.testers) && campaign.testers.includes(name));
}

export function visibleProducts(products: Product[], user: SessionUser | null): Product[] {
  if (!user || canAccessAll(user.role)) return products;
  return products.filter((p) => productVisibleTo(p, user));
}

export function visibleProjects(
  projects: Project[],
  products: Product[],
  user: SessionUser | null,
): Project[] {
  if (!user || canAccessAll(user.role)) return projects;
  return projects.filter((p) => projectVisibleTo(p, products, user));
}

export function visibleCampaigns(
  campaigns: Campaign[],
  products: Product[],
  user: SessionUser | null,
): Campaign[] {
  if (!user || canAccessAll(user.role)) return campaigns;
  return campaigns.filter((c) => campaignVisibleTo(c, products, user));
}

export function defectVisibleTo(defect: Defect, user: SessionUser | null): boolean {
  if (!user) return false;
  if (canAccessAll(user.role)) return true;
  const name = user.name;
  return defect.reporter === name || defect.assignee === name || defect.developer === name;
}

export function visibleDefects(defects: Defect[], user: SessionUser | null): Defect[] {
  if (!user || canAccessAll(user.role)) return defects;
  return defects.filter((d) => defectVisibleTo(d, user));
}
