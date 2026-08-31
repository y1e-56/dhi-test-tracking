import type { TranslationKey } from "@/lib/i18n";

export interface AppShellTab {
  to: string;
  label: TranslationKey;
  exact?: boolean;
}

export const PILOTAGE_TABS: AppShellTab[] = [
  { to: "/", label: "nav.dashboard", exact: true },
  { to: "/alertes", label: "nav.alertes" },
];

/** Onglets horizontaux — périmètre Qualité (Produit → Projet → Features / exigences / couverture). */
export const QUALITY_TABS: AppShellTab[] = [
  { to: "/produits", label: "nav.produits" },
  { to: "/projets", label: "nav.projets" },
  { to: "/fonctionnalites", label: "nav.fonctionnalites" },
  { to: "/exigences", label: "nav.exigences" },
  { to: "/couverture", label: "nav.couverture" },
];

export const EXECUTION_TABS: AppShellTab[] = [{ to: "/campagnes", label: "nav.campagnes" }];

export const DECISION_TABS: AppShellTab[] = [
  { to: "/go-live", label: "nav.go_live" },
  { to: "/points-a-surveiller", label: "nav.points_surveiller" },
];

export const SYSTEM_TABS: AppShellTab[] = [
  { to: "/anomalies", label: "nav.anomalies" },
  { to: "/referentiels", label: "nav.referentiels" },
  { to: "/administration", label: "nav.administration" },
  { to: "/audit", label: "nav.audit" },
];

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
