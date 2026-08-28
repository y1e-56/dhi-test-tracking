export type Health = "sain" | "risque" | "critique";
export type Criticality = "critique" | "haute" | "moyenne" | "basse";
export type CampaignStatus = "planifiee" | "encours" | "terminee" | "avenir";
export type Verdict =
  | "PASS"
  | "PASS_WITH_RESERVATION"
  | "FAIL"
  | "BLOCKED"
  | "NOT_RUN"
  | "NOT_APPLICABLE";
export type TestType =
  | "fonctionnel"
  | "regression"
  | "integration"
  | "api"
  | "recette_metier"
  | "smoke"
  | "sanity"
  | "exploratoire"
  | "securite"
  | "penetration"
  | "performance"
  | "charge"
  | "endurance"
  | "volumetrie"
  | "robustesse"
  | "accessibilite"
  | "compatibilite"
  | "ux"
  | "localisation"
  | "installation"
  | "migration_donnees"
  | "reprise"
  | "conformite";
export type TestCategory = "fonctionnels" | "non_fonctionnels" | "speciaux";
export type DefectStatus =
  | "nouvelle"
  | "affectee"
  | "encorrection"
  | "avalider"
  | "fermee"
  | "reouverte";
export type Severity = "haute" | "moyenne" | "basse";

export const TEST_TYPES: { id: TestType; label: string; category: TestCategory }[] = [
  { id: "fonctionnel", label: "Fonctionnel", category: "fonctionnels" },
  { id: "regression", label: "Régression", category: "fonctionnels" },
  { id: "integration", label: "Intégration", category: "fonctionnels" },
  { id: "api", label: "API", category: "fonctionnels" },
  { id: "recette_metier", label: "Recette métier (UAT)", category: "fonctionnels" },
  { id: "smoke", label: "Smoke", category: "fonctionnels" },
  { id: "sanity", label: "Sanity", category: "fonctionnels" },
  { id: "exploratoire", label: "Exploratoire", category: "fonctionnels" },
  { id: "securite", label: "Sécurité", category: "non_fonctionnels" },
  { id: "penetration", label: "Test d'intrusion", category: "non_fonctionnels" },
  { id: "performance", label: "Performance", category: "non_fonctionnels" },
  { id: "charge", label: "Charge", category: "non_fonctionnels" },
  { id: "endurance", label: "Endurance", category: "non_fonctionnels" },
  { id: "volumetrie", label: "Volumétrie", category: "non_fonctionnels" },
  { id: "robustesse", label: "Robustesse", category: "non_fonctionnels" },
  { id: "accessibilite", label: "Accessibilité", category: "non_fonctionnels" },
  { id: "compatibilite", label: "Compatibilité", category: "non_fonctionnels" },
  { id: "ux", label: "UX / Ergonomie", category: "non_fonctionnels" },
  { id: "localisation", label: "Localisation", category: "speciaux" },
  { id: "installation", label: "Installation", category: "speciaux" },
  { id: "migration_donnees", label: "Migration de données", category: "speciaux" },
  { id: "reprise", label: "Reprise / Reprises après incident", category: "speciaux" },
  { id: "conformite", label: "Conformité réglementaire", category: "speciaux" },
];

export const TEST_CATEGORY_LABEL: Record<TestCategory, string> = {
  fonctionnels: "Tests fonctionnels",
  non_fonctionnels: "Tests non fonctionnels",
  speciaux: "Tests spéciaux",
};

export const VERDICT_LABEL: Record<Verdict, string> = {
  PASS: "PASS",
  PASS_WITH_RESERVATION: "PASS (réserve)",
  FAIL: "FAIL",
  BLOCKED: "BLOCKED",
  NOT_RUN: "NOT RUN",
  NOT_APPLICABLE: "N/A",
};

export interface ScoreBreakdown {
  results: number;
  coverage: number;
  critical: number;
  incidents: number;
  nonFunctional: number;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  owner: string;
  qaLead: string;
  qaTeam: string[];
  versions: string[];
  projects: number;
  score: number;
  breakdown: ScoreBreakdown;
  lastUpdate: string;
}

export interface Feature {
  id: string;
  productId: string;
  name: string;
  description: string;
  criticality: Criticality;
  coverage: Partial<Record<TestType, boolean>>;
}

export interface Campaign {
  id: string;
  productId: string;
  name: string;
  type: string;
  version: string;
  environment: string;
  owner: string;
  status: CampaignStatus;
  startDate: string;
  endDate: string;
  testers: string[];
}

export interface TestCase {
  id: string;
  campaignId: string;
  featureId: string;
  name: string;
  criticality: Criticality;
  type: TestType;
  preconditions: string[];
  steps: string[];
  expected: string[];
  verdict: Verdict;
  observed: string;
  comment: string;
  expectedValue?: string | undefined;
  measuredValue?: string | undefined;
  tester?: string | undefined;
  executedAt?: string | undefined;
  duration?: string | undefined;
  evidence: { id: string; name: string; size: string; kind: "image" | "log" | "video" }[];
}

export interface Defect {
  id: string;
  productId: string;
  title: string;
  description: string;
  severity: Severity;
  priority: Severity;
  status: DefectStatus;
  featureId: string;
  version: string;
  testId?: string | undefined;
  reporter: string;
  assignee: string;
  createdAt: string;
  targetDate: string;
}

export const PEOPLE = [
  "Marie Martin",
  "Pierre Durand",
  "Sophie Lemaire",
  "Jean Dupont",
  "Ahmed Bakari",
];

export const healthOf = (score: number): Health =>
  score >= 85 ? "sain" : score >= 70 ? "risque" : "critique";

export const HEALTH_LABEL: Record<Health, string> = {
  sain: "Sain",
  risque: "À risque",
  critique: "Critique",
};

export const CRITICALITY_LABEL: Record<Criticality, string> = {
  critique: "Critique",
  haute: "Haute",
  moyenne: "Moyenne",
  basse: "Basse",
};

export const CAMPAIGN_STATUS_LABEL: Record<CampaignStatus, string> = {
  planifiee: "Planifiée",
  encours: "En cours",
  terminee: "Terminée",
  avenir: "À venir",
};

export const DEFECT_STATUS_LABEL: Record<DefectStatus, string> = {
  nouvelle: "Nouvelle",
  affectee: "Affectée",
  encorrection: "En correction",
  avalider: "À valider",
  fermee: "Fermée",
  reouverte: "Rouverte",
};

/** Transitions autorisées du workflow de cycle de vie d'une anomalie. */
export const DEFECT_TRANSITIONS: Record<DefectStatus, DefectStatus[]> = {
  nouvelle: ["affectee", "fermee"],
  affectee: ["encorrection", "nouvelle"],
  encorrection: ["avalider", "affectee"],
  avalider: ["fermee", "reouverte"],
  fermee: ["reouverte"],
  reouverte: ["affectee", "encorrection"],
};

export const SEVERITY_LABEL: Record<Severity, string> = {
  haute: "Haute",
  moyenne: "Moyenne",
  basse: "Basse",
};

export const products: Product[] = [
  {
    id: "p-paiement",
    name: "Paiement Online",
    description: "Plateforme de paiement multi-canal (carte, mobile money, virement).",
    owner: "Jean Dupont",
    qaLead: "Marie Martin",
    qaTeam: ["Marie Martin", "Pierre Durand", "Sophie Lemaire"],
    versions: ["4.10", "4.11", "4.12", "4.13 (dev)"],
    projects: 5,
    score: 91,
    breakdown: { results: 92, coverage: 95, critical: 100, incidents: 85, nonFunctional: 87 },
    lastUpdate: "2024-08-22",
  },
  {
    id: "p-crm",
    name: "CRM Clients",
    description: "Gestion du portefeuille client et du cycle de vente.",
    owner: "Sophie Lemaire",
    qaLead: "Pierre Durand",
    qaTeam: ["Pierre Durand", "Ahmed Bakari"],
    versions: ["2.4", "2.5"],
    projects: 3,
    score: 74,
    breakdown: { results: 78, coverage: 72, critical: 80, incidents: 62, nonFunctional: 70 },
    lastUpdate: "2024-08-18",
  },
  {
    id: "p-portail",
    name: "Portail Agence",
    description: "Portail interne des agences : opérations et reporting.",
    owner: "Ahmed Bakari",
    qaLead: "Marie Martin",
    qaTeam: ["Marie Martin"],
    versions: ["1.8"],
    projects: 2,
    score: 58,
    breakdown: { results: 61, coverage: 52, critical: 60, incidents: 55, nonFunctional: 62 },
    lastUpdate: "2024-08-14",
  },
  {
    id: "p-mobile",
    name: "App Mobile",
    description: "Application mobile grand public iOS / Android.",
    owner: "Marie Martin",
    qaLead: "Sophie Lemaire",
    qaTeam: ["Sophie Lemaire", "Ahmed Bakari"],
    versions: ["3.1", "3.2"],
    projects: 4,
    score: 88,
    breakdown: { results: 90, coverage: 86, critical: 95, incidents: 82, nonFunctional: 84 },
    lastUpdate: "2024-08-22",
  },
];

export const features: Feature[] = [
  {
    id: "f-auth",
    productId: "p-paiement",
    name: "Authentification",
    description: "Connexion, MFA et gestion de session.",
    criticality: "critique",
    coverage: {
      fonctionnel: true,
      securite: true,
      performance: true,
      regression: true,
      charge: true,
    },
  },
  {
    id: "f-paiement",
    productId: "p-paiement",
    name: "Paiement",
    description: "Paiement carte, mobile money et validation 3DS.",
    criticality: "critique",
    coverage: {
      fonctionnel: true,
      securite: true,
      performance: false,
      regression: true,
      charge: true,
    },
  },
  {
    id: "f-export",
    productId: "p-paiement",
    name: "Export PDF",
    description: "Génération des reçus et relevés PDF.",
    criticality: "haute",
    coverage: {
      fonctionnel: true,
      securite: false,
      performance: false,
      regression: true,
      charge: false,
    },
  },
  {
    id: "f-webhook",
    productId: "p-paiement",
    name: "Webhook",
    description: "Notifications sortantes vers les systèmes marchands.",
    criticality: "haute",
    coverage: {
      fonctionnel: false,
      securite: true,
      performance: true,
      regression: true,
      charge: false,
    },
  },
  {
    id: "f-notif",
    productId: "p-paiement",
    name: "Notifications",
    description: "SMS / e-mail de confirmation de transaction.",
    criticality: "moyenne",
    coverage: {
      fonctionnel: true,
      securite: false,
      performance: false,
      regression: true,
      charge: false,
    },
  },
  {
    id: "f-admin",
    productId: "p-paiement",
    name: "Administration",
    description: "Back-office, rôles et paramétrage.",
    criticality: "basse",
    coverage: {
      fonctionnel: true,
      securite: true,
      performance: false,
      regression: true,
      charge: false,
    },
  },
  {
    id: "f-crm-pipeline",
    productId: "p-crm",
    name: "Pipeline commercial",
    description: "Suivi des opportunités.",
    criticality: "haute",
    coverage: { fonctionnel: true, regression: true },
  },
  {
    id: "f-portail-report",
    productId: "p-portail",
    name: "Reporting agence",
    description: "Tableaux de bord agence.",
    criticality: "moyenne",
    coverage: { fonctionnel: true },
  },
];

export const campaigns: Campaign[] = [
  {
    id: "c-recette-412",
    productId: "p-paiement",
    name: "Recette v4.12",
    type: "Recette",
    version: "4.12",
    environment: "RECETTE",
    owner: "Marie Martin",
    status: "terminee",
    startDate: "2024-08-12",
    endDate: "2024-08-20",
    testers: ["Marie Martin", "Pierre Durand"],
  },
  {
    id: "c-regression-411",
    productId: "p-paiement",
    name: "Régression v4.11",
    type: "Régression",
    version: "4.11",
    environment: "RECETTE",
    owner: "Pierre Durand",
    status: "terminee",
    startDate: "2024-08-01",
    endDate: "2024-08-08",
    testers: ["Pierre Durand"],
  },
  {
    id: "c-securite-412",
    productId: "p-paiement",
    name: "Sécurité v4.12",
    type: "Sécurité",
    version: "4.12",
    environment: "PREPROD",
    owner: "Sophie Lemaire",
    status: "encours",
    startDate: "2024-08-19",
    endDate: "2024-08-27",
    testers: ["Sophie Lemaire", "Marie Martin"],
  },
  {
    id: "c-perf-412",
    productId: "p-paiement",
    name: "Performance v4.12",
    type: "Performance",
    version: "4.12",
    environment: "PREPROD",
    owner: "Ahmed Bakari",
    status: "planifiee",
    startDate: "2024-08-26",
    endDate: "2024-08-30",
    testers: ["Ahmed Bakari"],
  },
  {
    id: "c-explo-413",
    productId: "p-paiement",
    name: "Exploratory v4.13",
    type: "Exploratoire",
    version: "4.13",
    environment: "DEV",
    owner: "Marie Martin",
    status: "avenir",
    startDate: "2024-09-02",
    endDate: "2024-09-06",
    testers: [],
  },
];

const featureIds = ["f-auth", "f-paiement", "f-export", "f-webhook", "f-notif", "f-admin"];

function makeTests(
  campaignId: string,
  count: number,
  type: TestType,
  startIndex: number,
  failIndexes: number[],
  notRunIndexes: number[] = [],
): TestCase[] {
  return Array.from({ length: count }, (_, i) => {
    const n = startIndex + i;
    const featureId = featureIds[i % featureIds.length]!;
    const crit: Criticality =
      featureId === "f-auth" || featureId === "f-paiement"
        ? "critique"
        : featureId === "f-admin"
          ? "basse"
          : "haute";
    const verdict: Verdict = failIndexes.includes(i)
      ? "FAIL"
      : notRunIndexes.includes(i)
        ? "NOT_RUN"
        : "PASS";
    return {
      id: `TC-${1200 + n}`,
      campaignId,
      featureId,
      name: `${type === "securite" ? "Contrôle sécurité" : type === "performance" ? "Mesure perf." : "Vérification"} — ${featureId.replace("f-", "")} #${i + 1}`,
      criticality: crit,
      type,
      preconditions: ["Utilisateur authentifié", "Jeu de données de recette chargé"],
      steps: [
        "Ouvrir le module concerné",
        "Réaliser l'action métier attendue",
        "Contrôler le résultat affiché",
      ],
      expected: ["Action réalisée sans erreur", "Traçabilité enregistrée"],
      verdict,
      observed: verdict === "PASS" ? "Comportement conforme au résultat attendu." : "",
      comment: "",
      evidence: [],
      tester: verdict === "NOT_RUN" ? undefined : "Marie Martin",
      executedAt: verdict === "NOT_RUN" ? undefined : "22/08/2024 11:05",
      duration: verdict === "NOT_RUN" ? undefined : "3 min 12 sec",
    } satisfies TestCase;
  });
}

export const testCases: TestCase[] = [
  {
    id: "TC-1245",
    campaignId: "c-recette-412",
    featureId: "f-paiement",
    name: "Paiement par carte bancaire",
    criticality: "critique",
    type: "fonctionnel",
    preconditions: ["Utilisateur authentifié", "Produit dans le panier", "Montant : 99,99 EUR"],
    steps: [
      'Cliquer sur "Payer"',
      'Sélectionner "Carte bancaire"',
      "Saisir numéro : 4532 0151 1283 0366",
      "Saisir CCV : 123",
      "Confirmer le paiement",
    ],
    expected: [
      "Paiement accepté",
      "Confirmation affichée",
      "Commande créée",
      "Temps de réponse < 800 ms",
    ],
    verdict: "FAIL",
    observed:
      "Paiement accepté, confirmation affichée, commande créée. Temps de réponse : 942 ms (> 800 ms attendus).",
    comment: "Délai de paiement supérieur au seuil. À investiguer avec l'équipe infra.",
    expectedValue: "≤ 800 ms",
    measuredValue: "942 ms",
    tester: "Marie Martin",
    executedAt: "22/08/2024 14:32",
    duration: "5 min 23 sec",
    evidence: [
      { id: "e1", name: "screenshot_payment.png", size: "2.3 MB", kind: "image" },
      { id: "e2", name: "payment_log.txt", size: "156 KB", kind: "log" },
      { id: "e3", name: "video_payment_flow.mp4", size: "45 MB", kind: "video" },
    ],
  },
  ...makeTests("c-recette-412", 19, "fonctionnel", 1, [3, 11], [17, 18]),
  ...makeTests("c-regression-411", 20, "regression", 40, []),
  ...makeTests("c-securite-412", 18, "securite", 70, [5], [12, 13, 14, 15, 16, 17]),
  ...makeTests("c-perf-412", 12, "performance", 95, [], [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]),
];

export const defects: Defect[] = [
  {
    id: "ANO-2847",
    productId: "p-paiement",
    title: "Temps de réponse paiement > seuil (942 ms)",
    description:
      "Lors du paiement par carte, le temps de réponse dépasse 800 ms (942 ms observés) sur l'environnement de recette.",
    severity: "haute",
    priority: "moyenne",
    status: "nouvelle",
    featureId: "f-paiement",
    version: "4.12",
    testId: "TC-1245",
    reporter: "Marie Martin",
    assignee: "Pierre Durand",
    createdAt: "2024-08-22",
    targetDate: "2024-08-30",
  },
  {
    id: "ANO-2848",
    productId: "p-paiement",
    title: "Export PDF : crash en format paysage",
    description: "L'export d'un relevé en orientation paysage provoque une erreur 500.",
    severity: "haute",
    priority: "haute",
    status: "encorrection",
    featureId: "f-export",
    version: "4.12",
    testId: "TC-1203",
    reporter: "Pierre Durand",
    assignee: "Ahmed Bakari",
    createdAt: "2024-08-20",
    targetDate: "2024-08-28",
  },
  {
    id: "ANO-2849",
    productId: "p-paiement",
    title: "Webhook silencieux après timeout marchand",
    description: "Aucun rejeu du webhook lorsque le marchand ne répond pas dans les 5 s.",
    severity: "moyenne",
    priority: "moyenne",
    status: "affectee",
    featureId: "f-webhook",
    version: "4.11",
    reporter: "Sophie Lemaire",
    assignee: "Pierre Durand",
    createdAt: "2024-08-16",
    targetDate: "2024-09-02",
  },
  {
    id: "ANO-2850",
    productId: "p-paiement",
    title: "Notification envoyée en double",
    description: "Deux SMS de confirmation envoyés pour une même transaction.",
    severity: "basse",
    priority: "basse",
    status: "fermee",
    featureId: "f-notif",
    version: "4.10",
    reporter: "Marie Martin",
    assignee: "Sophie Lemaire",
    createdAt: "2024-08-05",
    targetDate: "2024-08-12",
  },
  {
    id: "ANO-2851",
    productId: "p-paiement",
    title: "Mauvais calcul de TVA sur remise",
    description: "La TVA est calculée avant application de la remise commerciale.",
    severity: "haute",
    priority: "haute",
    status: "nouvelle",
    featureId: "f-admin",
    version: "4.12",
    reporter: "Ahmed Bakari",
    assignee: "Marie Martin",
    createdAt: "2024-08-21",
    targetDate: "2024-08-29",
  },
];

// ============================================================================
// Modèles étendus : Projets, Releases, Exigences, Points à surveiller,
// Décisions Go Live, Alertes, Audit, Référentiels
// ============================================================================

export type ProjectStatus = "encours" | "termine" | "planifie";
export type ReleaseStatus = "preparee" | "encours" | "livree";
export type RequirementStatus = "brouillon" | "validee" | "couverte";
export type WatchLevel = "info" | "vigilance" | "critique";
export type WatchStatus = "ouvert" | "suivi" | "clos";
export type GoLiveVerdict = "GO" | "GO_CONDITIONNEL" | "NO_GO";
export type AlertType = "anomalie" | "campagne" | "couverture" | "golive" | "systeme";
export type AppRole = "admin" | "qa_lead" | "testeur" | "lecteur";

export interface Project {
  id: string;
  productId: string;
  name: string;
  targetVersion: string;
  status: ProjectStatus;
  startDate: string;
  endDate: string;
  manager: string;
  progress: number;
}

export interface Release {
  id: string;
  projectId: string;
  version: string;
  plannedDate: string;
  environment: string;
  status: ReleaseStatus;
}

export interface Requirement {
  id: string;
  productId: string;
  title: string;
  description: string;
  priority: Criticality;
  status: RequirementStatus;
  featureIds: string[];
}

export interface WatchPoint {
  id: string;
  productId: string;
  title: string;
  description: string;
  level: WatchLevel;
  status: WatchStatus;
  owner: string;
  createdAt: string;
}

export interface GoLiveChecklistItem {
  id: string;
  label: string;
  weight: number;
  checked: boolean;
}

export interface GoLiveDecision {
  id: string;
  releaseId: string;
  verdict: GoLiveVerdict;
  date: string;
  decider: string;
  justification: string;
  checklistCompletion: number;
}

export interface Alert {
  id: string;
  type: AlertType;
  severity: Severity;
  message: string;
  detail: string;
  target: string;
  read: boolean;
  createdAt: string;
}

export interface AuditEntry {
  id: string;
  actor: string;
  action: string;
  entity: string;
  detail: string;
  at: string;
}

export interface ReferentialRule {
  id: string;
  domain: string;
  label: string;
  threshold: string;
  active: boolean;
}

export interface PlatformUser {
  id: string;
  name: string;
  email: string;
  role: AppRole;
  active: boolean;
}

export const PROJECT_STATUS_LABEL: Record<ProjectStatus, string> = {
  encours: "En cours",
  termine: "Terminé",
  planifie: "Planifié",
};

export const RELEASE_STATUS_LABEL: Record<ReleaseStatus, string> = {
  preparee: "Préparée",
  encours: "En cours",
  livree: "Livrée",
};

export const REQUIREMENT_STATUS_LABEL: Record<RequirementStatus, string> = {
  brouillon: "Brouillon",
  validee: "Validée",
  couverte: "Couverte",
};

export const WATCH_LEVEL_LABEL: Record<WatchLevel, string> = {
  info: "Information",
  vigilance: "Vigilance",
  critique: "Critique",
};

export const WATCH_STATUS_LABEL: Record<WatchStatus, string> = {
  ouvert: "Ouvert",
  suivi: "Suivi",
  clos: "Clos",
};

export const GOLIVE_VERDICT_LABEL: Record<GoLiveVerdict, string> = {
  GO: "GO",
  GO_CONDITIONNEL: "GO conditionnel",
  NO_GO: "NO GO",
};

export const ROLE_LABEL: Record<AppRole, string> = {
  admin: "Administrateur",
  qa_lead: "QA Lead",
  testeur: "Testeur",
  lecteur: "Lecteur",
};

/** Modèle de checklist Go Live (poids sur 100). */
export const GOLIVE_CHECKLIST_TEMPLATE: Omit<GoLiveChecklistItem, "checked">[] = [
  { id: "gl-1", label: "Taux d'exécution des campagnes ≥ 95 %", weight: 15 },
  { id: "gl-2", label: "Taux de succès global ≥ 90 %", weight: 15 },
  { id: "gl-3", label: "Aucun test critique en échec", weight: 20 },
  { id: "gl-4", label: "Aucune anomalie de gravité haute ouverte", weight: 15 },
  { id: "gl-5", label: "Couverture fonctionnelle ≥ 90 %", weight: 10 },
  { id: "gl-6", label: "Tests de sécurité exécutés et validés", weight: 10 },
  { id: "gl-7", label: "Tests de performance conformes aux seuils", weight: 5 },
  { id: "gl-8", label: "Plan de rollback documenté", weight: 5 },
  { id: "gl-9", label: "Points à surveiller critiques tous clos", weight: 5 },
];

export const projects: Project[] = [
  {
    id: "pr-v412",
    productId: "p-paiement",
    name: "Release v4.12",
    targetVersion: "4.12",
    status: "encours",
    startDate: "2024-07-15",
    endDate: "2024-09-05",
    manager: "Jean Dupont",
    progress: 78,
  },
  {
    id: "pr-v413",
    productId: "p-paiement",
    name: "Release v4.13",
    targetVersion: "4.13",
    status: "planifie",
    startDate: "2024-09-02",
    endDate: "2024-10-15",
    manager: "Jean Dupont",
    progress: 12,
  },
  {
    id: "pr-crm-25",
    productId: "p-crm",
    name: "CRM v2.5",
    targetVersion: "2.5",
    status: "encours",
    startDate: "2024-08-01",
    endDate: "2024-09-20",
    manager: "Sophie Lemaire",
    progress: 45,
  },
  {
    id: "pr-portail-18",
    productId: "p-portail",
    name: "Portail v1.8",
    targetVersion: "1.8",
    status: "encours",
    startDate: "2024-07-01",
    endDate: "2024-09-30",
    manager: "Ahmed Bakari",
    progress: 60,
  },
];

export const releases: Release[] = [
  {
    id: "rel-412",
    projectId: "pr-v412",
    version: "4.12.0",
    plannedDate: "2024-09-05",
    environment: "PREPROD",
    status: "encours",
  },
  {
    id: "rel-411",
    projectId: "pr-v412",
    version: "4.11.0",
    plannedDate: "2024-08-10",
    environment: "PROD",
    status: "livree",
  },
  {
    id: "rel-413",
    projectId: "pr-v413",
    version: "4.13.0-rc1",
    plannedDate: "2024-10-15",
    environment: "DEV",
    status: "preparee",
  },
  {
    id: "rel-crm25",
    projectId: "pr-crm-25",
    version: "2.5.0",
    plannedDate: "2024-09-20",
    environment: "RECETTE",
    status: "encours",
  },
];

export const requirements: Requirement[] = [
  {
    id: "REQ-101",
    productId: "p-paiement",
    title: "Authentification multi-facteur obligatoire",
    description: "Tout utilisateur doit s'authentifier via MFA pour les opérations sensibles.",
    priority: "critique",
    status: "couverte",
    featureIds: ["f-auth"],
  },
  {
    id: "REQ-102",
    productId: "p-paiement",
    title: "Paiement en moins de 800 ms",
    description: "Le temps de réponse de bout en bout d'un paiement carte doit rester sous 800 ms.",
    priority: "critique",
    status: "validee",
    featureIds: ["f-paiement"],
  },
  {
    id: "REQ-103",
    productId: "p-paiement",
    title: "Reçus PDF conformes au format légal",
    description: "Les reçus exportés doivent respecter le modèle réglementaire en vigueur.",
    priority: "haute",
    status: "validee",
    featureIds: ["f-export"],
  },
  {
    id: "REQ-104",
    productId: "p-paiement",
    title: "Notification de transaction sous 30 s",
    description: "Le client reçoit une confirmation SMS ou e-mail dans les 30 secondes.",
    priority: "moyenne",
    status: "brouillon",
    featureIds: ["f-notif"],
  },
  {
    id: "REQ-105",
    productId: "p-paiement",
    title: "Rejeu automatique des webhooks",
    description: "Un webhook en échec est rejoué jusqu'à 5 fois avec backoff exponentiel.",
    priority: "haute",
    status: "validee",
    featureIds: ["f-webhook"],
  },
  {
    id: "REQ-201",
    productId: "p-crm",
    title: "Traçabilité complète du pipeline",
    description: "Chaque changement d'étape d'une opportunité est historisé.",
    priority: "haute",
    status: "validee",
    featureIds: ["f-crm-pipeline"],
  },
];

export const watchPoints: WatchPoint[] = [
  {
    id: "WP-01",
    productId: "p-paiement",
    title: "Latence paiement proche du seuil",
    description: "942 ms observés en recette, seuil à 800 ms. Suivi hebdomadaire avec l'infra.",
    level: "critique",
    status: "ouvert",
    owner: "Pierre Durand",
    createdAt: "2024-08-22",
  },
  {
    id: "WP-02",
    productId: "p-paiement",
    title: "Taux d'erreur webhooks marchands",
    description: "2,1 % de timeouts sur la semaine écoulée, en légère hausse.",
    level: "vigilance",
    status: "suivi",
    owner: "Sophie Lemaire",
    createdAt: "2024-08-19",
  },
  {
    id: "WP-03",
    productId: "p-portail",
    title: "Couverture insuffisante du reporting",
    description: "Seul le test fonctionnel est couvert ; aucune régression automatisée.",
    level: "vigilance",
    status: "ouvert",
    owner: "Marie Martin",
    createdAt: "2024-08-14",
  },
  {
    id: "WP-04",
    productId: "p-paiement",
    title: "Montée de version du SDK 3DS",
    description: "Migration du SDK 3DS prévue en v4.13, impact à évaluer sur la régression.",
    level: "info",
    status: "clos",
    owner: "Marie Martin",
    createdAt: "2024-08-05",
  },
];

export const goLiveDecisions: GoLiveDecision[] = [
  {
    id: "GL-1",
    releaseId: "rel-411",
    verdict: "GO_CONDITIONNEL",
    date: "2024-08-09",
    decider: "Jean Dupont",
    justification:
      "GO sous condition : anomalie ANO-2849 (webhooks) acceptée en production avec plan de contournement et correctif engagé pour la v4.12.",
    checklistCompletion: 90,
  },
];

export const alerts: Alert[] = [
  {
    id: "AL-1",
    type: "anomalie",
    severity: "haute",
    message: "Test critique en échec — TC-1245",
    detail: "Paiement par carte bancaire : temps de réponse 942 ms (> 800 ms attendus).",
    target: "/execution/TC-1245",
    read: false,
    createdAt: "2024-08-22 14:32",
  },
  {
    id: "AL-2",
    type: "couverture",
    severity: "moyenne",
    message: "Couverture < 80 % — Portail Agence",
    detail: "52 % de couverture fonctionnelle mesurée sur le reporting agence.",
    target: "/couverture",
    read: false,
    createdAt: "2024-08-21 09:10",
  },
  {
    id: "AL-3",
    type: "campagne",
    severity: "moyenne",
    message: "Campagne bloquée — Sécurité v4.12",
    detail: "6 tests non exécutés, fin de campagne prévue le 27/08.",
    target: "/campagnes/c-securite-412",
    read: false,
    createdAt: "2024-08-24 16:45",
  },
  {
    id: "AL-4",
    type: "golive",
    severity: "haute",
    message: "Décision Go Live en attente — Release 4.12.0",
    detail: "La checklist est complétée à 55 %, livraison prévue le 05/09.",
    target: "/go-live",
    read: true,
    createdAt: "2024-08-25 08:00",
  },
  {
    id: "AL-5",
    type: "anomalie",
    severity: "haute",
    message: "Anomalie critique non affectée — ANO-2851",
    detail: "Mauvais calcul de TVA sur remise, en attente d'affectation.",
    target: "/anomalies",
    read: false,
    createdAt: "2024-08-21 11:20",
  },
];

export const auditTrail: AuditEntry[] = [
  {
    id: "AU-1",
    actor: "Marie Martin",
    action: "Verdict enregistré",
    entity: "TC-1245",
    detail: "FAIL — Paiement par carte bancaire (942 ms > 800 ms)",
    at: "2024-08-22 14:32",
  },
  {
    id: "AU-2",
    actor: "Marie Martin",
    action: "Anomalie créée",
    entity: "ANO-2847",
    detail: "Temps de réponse paiement > seuil",
    at: "2024-08-22 14:40",
  },
  {
    id: "AU-3",
    actor: "Jean Dupont",
    action: "Décision Go Live",
    entity: "Release 4.11.0",
    detail: "GO conditionnel — checklist 90 %",
    at: "2024-08-09 17:15",
  },
  {
    id: "AU-4",
    actor: "Pierre Durand",
    action: "Statut anomalie",
    entity: "ANO-2848",
    detail: "affectee → encorrection",
    at: "2024-08-21 10:05",
  },
  {
    id: "AU-5",
    actor: "Sophie Lemaire",
    action: "Campagne créée",
    entity: "c-securite-412",
    detail: "Sécurité v4.12 — 18 tests clonés",
    at: "2024-08-19 09:30",
  },
];

export const referentialRules: ReferentialRule[] = [
  { id: "RG-1", domain: "Santé produit", label: "Seuil produit sain", threshold: "≥ 85/100", active: true },
  { id: "RG-2", domain: "Santé produit", label: "Seuil produit à risque", threshold: "≥ 70/100", active: true },
  { id: "RG-3", domain: "Campagne", label: "Taux d'exécution minimal avant clôture", threshold: "≥ 95 %", active: true },
  { id: "RG-4", domain: "Campagne", label: "Taux de succès minimal", threshold: "≥ 90 %", active: true },
  { id: "RG-5", domain: "Couverture", label: "Couverture fonctionnelle cible", threshold: "≥ 90 %", active: true },
  { id: "RG-6", domain: "Couverture", label: "Couverture fonctionnalité critique", threshold: "100 %, tous types requis", active: true },
  { id: "RG-7", domain: "Anomalies", label: "Délai de correction gravité haute", threshold: "≤ 7 jours", active: true },
  { id: "RG-8", domain: "Go Live", label: "Anomalies hautes ouvertes tolérées", threshold: "0", active: true },
  { id: "RG-9", domain: "Go Live", label: "Complétude checklist minimale pour GO", threshold: "≥ 85 %", active: false },
];

export const platformUsers: PlatformUser[] = [
  { id: "u-1", name: "Jean Dupont", email: "jean.dupont@dhi.io", role: "admin", active: true },
  { id: "u-2", name: "Marie Martin", email: "marie.martin@dhi.io", role: "qa_lead", active: true },
  { id: "u-3", name: "Pierre Durand", email: "pierre.durand@dhi.io", role: "testeur", active: true },
  { id: "u-4", name: "Sophie Lemaire", email: "sophie.lemaire@dhi.io", role: "qa_lead", active: true },
  { id: "u-5", name: "Ahmed Bakari", email: "ahmed.bakari@dhi.io", role: "testeur", active: true },
  { id: "u-6", name: "Claire Robert", email: "claire.robert@dhi.io", role: "lecteur", active: false },
];
