import type { TranslationKey } from "@/lib/i18n";

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

/** Onglets horizontaux contextuels d'une campagne (Vue d'ensemble → Fonctionnalités → Cas de test → Importer). */
export function campaignTabs(campaignId: string): AppShellTab[] {
  return [
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
      to: "/campagnes/$campaignId/importer",
      label: "nav.campaign_import",
      params: { campaignId },
    },
    {
      to: "/campagnes/$campaignId/documents",
      label: "nav.campaign_documents",
      params: { campaignId },
    },
  ];
}

export const SEARCH_GROUPS: TranslationKey[] = [
  "nav.pilotage",
  "nav.qualite",
  "nav.execution",
  "nav.decision",
  "nav.systeme",
];

export const SEARCH_PAGES: { to: string; label: TranslationKey; group: TranslationKey }[] = [
  { to: "/", label: "nav.dashboard", group: "nav.pilotage" },
  { to: "/alertes", label: "nav.alertes", group: "nav.pilotage" },
  { to: "/notifications", label: "nav.notifications", group: "nav.pilotage" },
  { to: "/produits", label: "nav.produits", group: "nav.qualite" },
  { to: "/projets", label: "nav.projets", group: "nav.qualite" },
  { to: "/fonctionnalites", label: "nav.fonctionnalites", group: "nav.qualite" },
  { to: "/exigences", label: "nav.exigences", group: "nav.qualite" },
  { to: "/couverture", label: "nav.couverture", group: "nav.qualite" },
  { to: "/campagnes", label: "nav.campagnes", group: "nav.execution" },
  { to: "/go-live", label: "nav.go_live", group: "nav.decision" },
  { to: "/points-a-surveiller", label: "nav.points_surveiller", group: "nav.decision" },
  { to: "/anomalies", label: "nav.anomalies", group: "nav.systeme" },
  { to: "/referentiels", label: "nav.referentiels", group: "nav.systeme" },
  { to: "/administration", label: "nav.administration", group: "nav.systeme" },
  { to: "/audit", label: "nav.audit", group: "nav.systeme" },
];
