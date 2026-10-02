import type { TranslationKey } from "@/lib/i18n";
import { canManageCampaign } from "@/lib/role-protection";

export interface AppShellTab {
  to: string;
  label: TranslationKey;
  exact?: boolean;
  params?: Record<string, string>;
}

/** Onglets horizontaux contextuels d'un produit (Aperçu → Projets → Fonctionnalités → Campagnes → Documents). */
export function productTabs(productId: string): AppShellTab[] {
  return [
    {
      to: "/produits/$productId",
      label: "nav.product_overview",
      exact: true,
      params: { productId },
    },
    {
      to: "/produits/$productId/projets",
      label: "nav.product_projects",
      params: { productId },
    },
    {
      to: "/produits/$productId/fonctionnalites",
      label: "nav.product_features",
      params: { productId },
    },
    { to: "/produits/$productId/campagnes", label: "nav.product_campaigns", params: { productId } },
    { to: "/produits/$productId/documents", label: "nav.product_documents", params: { productId } },
  ];
}

/** Onglets horizontaux contextuels d'un projet (Vue d'ensemble → Fonctionnalités → Campagnes → Cas de test → Documents). */
export function projectTabs(projectId: string): AppShellTab[] {
  return [
    {
      to: "/projets/$projectId",
      label: "nav.project_overview",
      exact: true,
      params: { projectId },
    },
    {
      to: "/projets/$projectId/fonctionnalites",
      label: "nav.project_features",
      params: { projectId },
    },
    {
      to: "/projets/$projectId/campagnes",
      label: "nav.project_campaigns",
      params: { projectId },
    },
    { to: "/projets/$projectId/tests", label: "nav.project_tests", params: { projectId } },
    { to: "/projets/$projectId/documents", label: "nav.project_documents", params: { projectId } },
  ];
}

/** Onglets horizontaux contextuels d'une campagne (Vue d'ensemble → Fonctionnalités → Cas de test → Importer). Seuls les rôles qui pilotent la campagne voient l'onglet Importer. */
export function campaignTabs(campaignId: string): AppShellTab[] {
  const tabs: AppShellTab[] = [
    {
      to: "/campagnes/$campaignId",
      label: "nav.campaign_overview",
      exact: true,
      params: { campaignId },
    },
    {
      to: "/campagnes/$campaignId/fonctionnalites",
      label: "nav.campaign_features",
      params: { campaignId },
    },
    {
      to: "/campagnes/$campaignId/tests",
      label: "nav.campaign_tests",
      params: { campaignId },
    },
    {
      to: "/campagnes/$campaignId/documents",
      label: "nav.campaign_documents",
      params: { campaignId },
    },
  ];
  if (canManageCampaign()) {
    tabs.splice(3, 0, {
      to: "/campagnes/$campaignId/importer",
      label: "nav.campaign_import",
      params: { campaignId },
    });
  }
  return tabs;
}
