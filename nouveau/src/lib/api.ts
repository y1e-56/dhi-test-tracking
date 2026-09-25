const API_BASE_URL = import.meta.env["VITE_API_URL"] ?? "http://localhost:5000/api";

import type {
  AppRole,
  Criticality,
  Defect,
  DefectStatus,
  GoLiveChecklistItem,
  GoLiveDecision,
  GoLiveVerdict,
  PlatformUser,
  Requirement,
  RequirementStatus,
  TestCase,
  TestType,
  WatchLevel,
  WatchStatus,
} from "./dhi-data";

export const ROLE_TO_BACKEND: Record<AppRole, string> = {
  admin: "admin",
  qa_lead: "qa_lead",
  quality_manager: "quality_manager",
  product_owner: "product_owner",
  chef_projet: "chef_projet",
  chef_testeur: "chef_testeur",
  testeur: "tester",
  developpeur: "developer",
  approver: "approver",
  lecteur: "lecteur",
};

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem("token");
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    if (response.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("dhi-session-v1");
    }
    throw new ApiError(body?.message ?? "Erreur lors de l'appel API", response.status);
  }

  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export type BackendUser = {
  id: number | string;
  email: string;
  first_name?: string;
  last_name?: string;
  role: string;
  roles?: string[];
  date_suppression?: string | null;
  locked_until?: string | null;
};

export type LoginResponse = {
  token: string;
  user: BackendUser;
};

export type BackendTestCase = {
  id: number;
  campaign_id: number;
  feature_id: number;
  name: string;
  description?: string | null;
  steps?: string | string[] | null;
  expected_result?: string | null;
  priority?: string | null;
  test_type?: string | null;
};

export type BackendTestExecution = {
  id: number;
  test_case_id: number;
  result: "passed" | "failed" | "blocked" | "not_run" | "skipped";
  execution_date: string;
  duration_seconds?: number | null;
  notes?: string | null;
  actual_behavior?: string | null;
  executed_by_name?: string | null;
};

export type BackendCampaign = {
  id: number;
  project_id: number;
  name: string;
  objective?: string | null;
  organization_mode?: string | null;
  status?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  testers?: Array<number | string>;
  developers?: Array<number | string>;
};

export type BackendProject = {
  id: number;
  product_id?: number | null;
  name: string;
  description?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  is_archived?: boolean;
};

export type BackendProduct = {
  id: number;
  name: string;
  description?: string | null;
};

export type BackendAnomaly = {
  id: number;
  feature_id: number;
  campaign_id: number;
  test_case_id?: number | null;
  description: string;
  status: string;
  created_at: string;
  correction_due_date?: string | null;
  product_id?: number | null;
  feature_name?: string | null;
  campaign_name?: string | null;
  reporter_first_name?: string | null;
  reporter_last_name?: string | null;
  assignee_first_name?: string | null;
  assignee_last_name?: string | null;
  reported_by?: number | null;
  assigned_to?: number | null;
};

export type BackendRequirement = {
  id: number;
  feature_id: number;
  title: string;
  description?: string | null;
  category?: string | null;
  status?: string | null;
  feature_name?: string | null;
};

export type BackendWatchPoint = {
  id: number;
  project_id: number;
  campaign_id?: number | null;
  feature_id?: number | null;
  title: string;
  description: string;
  criticality?: string | null;
  status?: string | null;
  owner_name?: string | null;
  created_at: string;
};

export type BackendEvidence = {
  id: number;
  entity_type: "product" | "project" | string;
  entity_id: number;
  file_name?: string | null;
  file_type?: string | null;
  file_size?: string | null;
  description?: string | null;
  created_at: string;
  uploaded_by_name?: string | null;
};

export async function uploadEvidence(
  entityType: "product" | "project" | "campaign" | "feature",
  entityId: string,
  file: File,
  description: string,
) {
  const token = localStorage.getItem("token");
  const body = new FormData();
  body.append("entity_type", entityType);
  body.append("entity_id", entityId);
  body.append("description", description);
  body.append("file", file);
  const response = await fetch(`${API_BASE_URL}/evidence`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body,
  });
  if (!response.ok) {
    const error = await response.json().catch(() => null);
    throw new ApiError(error?.message ?? "Impossible d'envoyer le document", response.status);
  }
  return response.json() as Promise<BackendEvidence>;
}

export function mapBackendEvidence(evidence: BackendEvidence) {
  let metadata: { name?: string; type?: string } = {};
  try {
    metadata = JSON.parse(evidence.description ?? "{}");
  } catch {}
  return {
    id: String(evidence.id),
    type: metadata.type ?? "document",
    name: metadata.name ?? evidence.file_name ?? "Document",
    fileName: evidence.file_name ?? "",
    content: "",
    uploadedBy: evidence.uploaded_by_name ?? "—",
    uploadedAt: evidence.created_at.slice(0, 10),
  };
}

export function mapBackendTestCase(test: BackendTestCase, execution?: BackendTestExecution): TestCase {
  const verdict = execution
    ? ({ passed: "PASS", failed: "FAIL", blocked: "BLOCKED", not_run: "NOT_RUN", skipped: "NOT_APPLICABLE" } as const)[execution.result]
    : "NOT_RUN";
  const steps = Array.isArray(test.steps)
    ? test.steps
    : test.steps
      ? test.steps.split("\n").filter(Boolean)
      : [];
  const criticality = test.priority === "critical"
    ? "critique"
    : test.priority === "high"
      ? "haute"
      : test.priority === "low"
        ? "basse"
        : "moyenne";
  return {
    id: String(test.id),
    campaignId: String(test.campaign_id),
    featureId: String(test.feature_id),
    name: test.name,
    criticality: criticality as Criticality,
    type: (test.test_type ?? "fonctionnel") as TestType,
    preconditions: [],
    steps,
    expected: test.expected_result ? [test.expected_result] : [],
    verdict,
    observed: execution?.actual_behavior ?? "",
    comment: execution?.notes ?? test.description ?? "",
    tester: execution?.executed_by_name ?? undefined,
    executedAt: execution?.execution_date,
    duration: execution?.duration_seconds ? `${execution.duration_seconds} s` : undefined,
    evidence: [],
    ...(execution ? { executionId: String(execution.id) } : {}),
  };
}

const FRONT_ROLE_FROM_BACKEND: Record<string, AppRole> = {
  admin: "admin",
  qa_lead: "qa_lead",
  quality_manager: "quality_manager",
  product_owner: "product_owner",
  chef_projet: "chef_projet",
  chef_testeur: "chef_testeur",
  tester: "testeur",
  developer: "developpeur",
  approver: "approver",
  lecteur: "lecteur",
};

export function toFrontRole(backendRole: string): AppRole {
  return FRONT_ROLE_FROM_BACKEND[backendRole] ?? (backendRole as AppRole);
}

export function mapBackendUser(user: BackendUser): PlatformUser {
  const role = toFrontRole(user.role);
  const locked = user.locked_until ? new Date(user.locked_until).getTime() : 0;
  return {
    id: String(user.id),
    name: [user.first_name, user.last_name].filter(Boolean).join(" ") || user.email,
    email: user.email,
    role,
    roles:
      Array.isArray(user.roles) && user.roles.length > 0
        ? [...new Set(user.roles.map(toFrontRole))]
        : [role],
    active: user.date_suppression == null && locked <= Date.now(),
  };
}

export function mapBackendCampaign(campaign: BackendCampaign, project?: BackendProject) {
  return {
    id: String(campaign.id),
    productId: project?.product_id ? String(project.product_id) : "",
    projectId: String(campaign.project_id),
    name: campaign.name,
    type: campaign.organization_mode ?? "exploratoire",
    version: "",
    environment: "",
    owner: "",
    status: campaign.status === "in_progress"
      ? "encours"
      : campaign.status === "completed"
        ? "terminee"
        : campaign.status === "planning"
          ? "planifiee"
          : "avenir",
    startDate: campaign.start_date ?? "",
    endDate: campaign.end_date ?? "",
    testers: (campaign.testers ?? []).map(String),
    developers: (campaign.developers ?? []).map(String),
  } as const;
}

export function mapBackendProduct(product: BackendProduct) {
  return {
    id: String(product.id),
    name: product.name,
    description: product.description ?? "",
    owner: "",
    qaLead: "",
    qaTeam: [],
    versions: [],
    score: 0,
    breakdown: {
      results: 0,
      coverage: 0,
      critical: 0,
      incidents: 0,
      nonFunctional: 0,
      testability: 0,
      qualityControl: 0,
    },
    lastUpdate: "",
  };
}

export function mapBackendProject(project: BackendProject) {
  return {
    id: String(project.id),
    productId: project.product_id ? String(project.product_id) : "",
    name: project.name,
    objective: project.description ?? "",
    targetVersion: "",
    status: project.is_archived ? "termine" : "encours",
    startDate: project.start_date ?? "",
    endDate: project.end_date ?? "",
    manager: "",
    qaLead: "",
    progress: 0,
  } as const;
}

export function mapBackendAnomaly(anomaly: BackendAnomaly): Defect {
  const statusMap = {
    new: "nouvelle",
    in_progress: "encorrection",
    resolution_signaled: "a_retester",
    validated: "fermee",
    rejected: "reouverte",
  } as const;
  const status: DefectStatus = statusMap[anomaly.status as keyof typeof statusMap] ?? "nouvelle";
  const fullName = (first?: string | null, last?: string | null) => [first, last].filter(Boolean).join(" ");
  return {
    id: String(anomaly.id),
    productId: anomaly.product_id ? String(anomaly.product_id) : "",
    campaignId: String(anomaly.campaign_id),
    title: anomaly.description.slice(0, 80),
    description: anomaly.description,
    severity: "moyenne",
    priority: "moyenne",
    status,
    featureId: String(anomaly.feature_id),
    version: "",
    testId: anomaly.test_case_id ? String(anomaly.test_case_id) : undefined,
    reporter: fullName(anomaly.reporter_first_name, anomaly.reporter_last_name) || "—",
    assignee: fullName(anomaly.assignee_first_name, anomaly.assignee_last_name) || "—",
    createdAt: anomaly.created_at,
    targetDate: anomaly.correction_due_date ?? "",
  };
}

export function mapBackendRequirement(requirement: BackendRequirement): Requirement {
  const statusMap = {
    proposed: "brouillon",
    validated: "validee",
    approved: "couverte",
    rejected: "brouillon",
  } as const;
  const status: RequirementStatus =
    statusMap[requirement.status as keyof typeof statusMap] ?? "brouillon";
  return {
    id: String(requirement.id),
    productId: "",
    title: requirement.title,
    description: requirement.description ?? "",
    priority: "moyenne",
    status,
    featureIds: [String(requirement.feature_id)],
  };
}

export function mapBackendWatchPoint(point: BackendWatchPoint, productId = "") {
  const levelMap = { critical: "critique", high: "vigilance", medium: "vigilance", low: "info" } as const;
  const statusMap = { open: "ouvert", validated: "suivi", passed: "clos", failed: "ouvert" } as const;
  const level: WatchLevel = levelMap[point.criticality as keyof typeof levelMap] ?? "vigilance";
  const status: WatchStatus = statusMap[point.status as keyof typeof statusMap] ?? "ouvert";
  const base = {
    id: String(point.id),
    productId,
    title: point.title,
    description: point.description,
    level,
    status,
    owner: point.owner_name ?? "",
    createdAt: point.created_at,
  };
  return point.feature_id ? { ...base, featureId: String(point.feature_id) } : base;
}

export type BackendGoLiveChecklistItem = {
  id: string;
  label: string;
  weight: number;
  checked: boolean;
};

export type BackendGoLiveDecision = {
  id: number;
  release_ref: string;
  verdict: GoLiveVerdict;
  decider: string;
  justification: string | null;
  checklist_completion: number;
  decided_at: string;
  created_at: string;
};

export function mapBackendGoLiveChecklistItem(item: BackendGoLiveChecklistItem): GoLiveChecklistItem {
  return {
    id: item.id,
    label: item.label,
    weight: item.weight,
    checked: item.checked,
  };
}

export function mapBackendGoLiveDecision(decision: BackendGoLiveDecision): GoLiveDecision {
  return {
    id: String(decision.id),
    releaseId: decision.release_ref,
    verdict: decision.verdict,
    date: String(decision.decided_at).slice(0, 10),
    decider: decision.decider,
    justification: decision.justification ?? "",
    checklistCompletion: decision.checklist_completion,
  };
}

export async function getGoLiveChecklist(releaseRef: string) {
  return api<BackendGoLiveChecklistItem[]>(`/go-live/checklist/${encodeURIComponent(releaseRef)}`);
}

export async function updateGoLiveChecklistItem(releaseRef: string, itemId: string, checked: boolean) {
  return api<BackendGoLiveChecklistItem>(`/go-live/checklist/${encodeURIComponent(releaseRef)}/items/${itemId}`, {
    method: "PUT",
    body: JSON.stringify({ checked }),
  });
}

export async function getGoLiveDecisions(releaseRef?: string) {
  const query = releaseRef ? `?releaseRef=${encodeURIComponent(releaseRef)}` : "";
  return api<{ data: BackendGoLiveDecision[] }>(`/go-live/decisions${query}`);
}

export async function createGoLiveDecision(payload: {
  release_ref: string;
  verdict: GoLiveVerdict;
  decider: string;
  justification?: string;
  checklist_completion: number;
}) {
  return api<BackendGoLiveDecision>("/go-live/decisions", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

/* ==========================================================================
   ÉCRITURES BACKEND (CRUD) — types, mappers et appels API
   ========================================================================== */

export type BackendFeature = {
  id: number;
  campaign_id: number;
  name: string;
  description?: string | null;
  priority?: string | null;
  module?: string | null;
  status?: string | null;
  coverage?: Record<string, boolean> | null;
};

export type BackendRelease = {
  id: number;
  product_id: number;
  version: string;
  description?: string | null;
  status?: string | null;
  planned_date?: string | null;
  released_at?: string | null;
};

/** Convertit un id local (string) en id backend numérique s'il en est un. */
export function backendIdOf(id?: string | number | null): number | undefined {
  if (id == null) return undefined;
  const str = String(id);
  return /^\d+$/.test(str) ? Number(str) : undefined;
}

/* ── Mappers frontend → backend ------------------------------------------------- */

export function toBackendCampaignStatus(status?: string | null): string {
  const map: Record<string, string> = {
    planifiee: "planning",
    encours: "in_progress",
    terminee: "completed",
    avenir: "planning",
    archived: "archived",
  };
  return map[status ?? ""] ?? "planning";
}

export function toBackendOrgMode(type?: string | null): string {
  const map: Record<string, string> = {
    exploratoire: "exploratory",
    scenario: "scenario",
    combinaison: "combination",
    combine: "combination",
  };
  return map[type ?? ""] ?? "exploratory";
}

export function toBackendPriority(criticality?: string | null): string {
  const map: Record<string, string> = {
    critique: "critical",
    haute: "high",
    moyenne: "medium",
    basse: "low",
  };
  return map[criticality ?? ""] ?? "medium";
}

export function toFrontendCriticality(priority?: string | null): Criticality {
  const map: Record<string, Criticality> = {
    critical: "critique",
    high: "haute",
    medium: "moyenne",
    low: "basse",
  };
  return map[priority ?? ""] ?? "moyenne";
}

export function toBackendDefectStatus(status?: string | null): string {
  const map: Record<string, string> = {
    nouvelle: "new",
    encorrection: "in_progress",
    a_retester: "resolution_signaled",
    fermee: "validated",
    reouverte: "rejected",
  };
  return map[status ?? ""] ?? "new";
}

export function toBackendRequirementStatus(status?: string | null): string {
  const map: Record<string, string> = {
    brouillon: "proposed",
    validee: "validated",
    couverte: "approved",
  };
  return map[status ?? ""] ?? "proposed";
}

export function toBackendRequirementCategory(category?: string | null): string | undefined {
  const allowed = [
    "fonctionnelle",
    "securite",
    "performance",
    "disponibilite",
    "ergonomie",
    "accessibilite",
    "maintenabilite",
    "compatibilite",
    "resilience",
    "observabilite",
    "documentation",
    "testabilite",
    "custom",
  ];
  return category && allowed.includes(category) ? category : undefined;
}

export function toBackendVerdict(verdict?: string | null): string {
  const map: Record<string, string> = {
    PASS: "passed",
    PASS_WITH_RESERVATION: "passed",
    FAIL: "failed",
    BLOCKED: "blocked",
    NOT_RUN: "not_run",
    NOT_APPLICABLE: "skipped",
  };
  return map[verdict ?? ""] ?? "not_run";
}

export function toBackendReleaseStatus(status?: string | null): string {
  const map: Record<string, string> = {
    planning: "planned",
    in_dev: "in_progress",
    in_test: "in_progress",
    ready: "planned",
    released: "released",
    archived: "cancelled",
  };
  return map[status ?? ""] ?? "planned";
}

export function toBackendWatchStatus(status?: string | null): string {
  const map: Record<string, string> = {
    ouvert: "open",
    suivi: "validated",
    clos: "passed",
  };
  return map[status ?? ""] ?? "open";
}

export function toBackendWatchCriticality(level?: string | null): string {
  const map: Record<string, string> = {
    critique: "critical",
    vigilance: "high",
    info: "low",
  };
  return map[level ?? ""] ?? "medium";
}

/* ── Produits ---------------------------------------------------------------- */

export async function createProduct(payload: { name: string | undefined; description: string | undefined; owner_id?: number | null; quality_manager_id?: number | null }) {
  return api<{ product: BackendProduct }>("/products", { method: "POST", body: JSON.stringify(payload) });
}

export async function updateProductById(id: number, patch: { name: string | undefined; description: string | undefined; owner_id?: number | null; quality_manager_id?: number | null }) {
  return api<{ product: BackendProduct }>(`/products/${id}`, { method: "PUT", body: JSON.stringify(patch) });
}

export async function deleteProductById(id: number) {
  return api<void>(`/products/${id}`, { method: "DELETE" });
}

/* ── Projets ----------------------------------------------------------------- */

export type BackendProjectPayload = {
  name: string | undefined;
  description: string | undefined;
  start_date?: string;
  end_date?: string;
  test_lead_ids?: number[];
  product_id?: number | null;
};

export async function createProject(payload: BackendProjectPayload) {
  return api<{ project: BackendProject }>("/projects", { method: "POST", body: JSON.stringify(payload) });
}

export async function updateProjectById(id: number, patch: BackendProjectPayload) {
  return api<{ project: BackendProject }>(`/projects/${id}`, { method: "PUT", body: JSON.stringify(patch) });
}

export async function archiveProjectById(id: number, archive: boolean) {
  return api<{ project: BackendProject }>(`/projects/${id}/${archive ? "archive" : "unarchive"}`, { method: "PATCH" });
}

export async function deleteProjectById(id: number) {
  return api<void>(`/projects/${id}`, { method: "DELETE" });
}

/* ── Campagnes --------------------------------------------------------------- */

export type BackendCampaignPayload = {
  project_id: number;
  name?: string;
  objective?: string;
  organization_mode?: string;
  status?: string;
  start_date?: string;
  end_date?: string;
  test_lead_ids?: number[];
  testers?: number[];
  developers?: number[];
  release_id?: number | null;
  environment_id?: number | null;
};

export async function createCampaign(payload: BackendCampaignPayload) {
  return api<{ campaign: BackendCampaign }>("/campaigns", { method: "POST", body: JSON.stringify(payload) });
}

export async function updateCampaignById(id: number, patch: { name: string | undefined; status: string | undefined; start_date: string | undefined; end_date: string | undefined }) {
  return api<{ campaign: BackendCampaign }>(`/campaigns/${id}`, { method: "PUT", body: JSON.stringify(patch) });
}

export async function deleteCampaignById(id: number) {
  return api<void>(`/campaigns/${id}`, { method: "DELETE" });
}

/* ── Fonctionnalités --------------------------------------------------------- */

export async function createFeature(payload: { campaign_id: number; name: string; description?: string; priority?: string; module?: string }) {
  return api<{ feature: BackendFeature }>("/features", { method: "POST", body: JSON.stringify(payload) });
}

export async function updateFeatureById(id: number, patch: { name: string | undefined; description: string | undefined; priority: string | undefined; module: string | undefined }) {
  return api<{ feature: BackendFeature }>(`/features/${id}`, { method: "PUT", body: JSON.stringify(patch) });
}

export async function deleteFeatureById(id: number) {
  return api<void>(`/features/${id}`, { method: "DELETE" });
}

/* ── Cas de test ------------------------------------------------------------- */

export async function createTestCase(payload: {
  campaign_id?: number;
  feature_id?: number;
  name: string;
  description?: string;
  expected_result?: string;
  steps?: string[];
  steps_text?: string;
  priority?: string;
  type?: string;
}) {
  const body: Record<string, unknown> = {
    campaign_id: payload.campaign_id,
    feature_id: payload.feature_id,
    name: payload.name,
    description: payload.description,
    expected_result: payload.expected_result,
    priority: payload.priority,
    test_type: payload.type,
  };
  if (payload.steps) body["steps"] = payload.steps.join("\n");
  else if (payload.steps_text) body["steps"] = payload.steps_text;
  return api<BackendTestCase>("/test-cases", { method: "POST", body: JSON.stringify(body) });
}

export async function updateTestCaseById(id: number, patch: { name?: string; description?: string; expected_result?: string; steps?: string[]; steps_text?: string; priority?: string; type?: string }) {
  const body: Record<string, unknown> = {
    name: patch.name,
    description: patch.description,
    expected_result: patch.expected_result,
    priority: patch.priority,
    type: patch.type,
  };
  if (patch.steps) body["steps"] = patch.steps.join("\n");
  else if (patch.steps_text) body["steps"] = patch.steps_text;
  return api<BackendTestCase>(`/test-cases/${id}`, { method: "PUT", body: JSON.stringify(body) });
}

export async function deleteTestCaseById(id: number) {
  return api<void>(`/test-cases/${id}`, { method: "DELETE" });
}

/* ── Exécutions de test ------------------------------------------------------ */

export async function createExecution(payload: {
  test_case_id: number;
  campaign_id: number;
  result: string;
  execution_date?: string;
  duration_seconds?: number;
  environment?: string;
  notes: string | undefined;
  actual_behavior: string | undefined;
}) {
  return api<BackendTestExecution>("/test-executions", { method: "POST", body: JSON.stringify(payload) });
}

export async function updateExecutionById(id: number, patch: { result: string | undefined; notes: string | undefined; actual_behavior: string | undefined; duration_seconds?: number | null }) {
  return api<BackendTestExecution>(`/test-executions/${id}`, { method: "PUT", body: JSON.stringify(patch) });
}

export async function deleteExecutionById(id: number) {
  return api<void>(`/test-executions/${id}`, { method: "DELETE" });
}

/* ── Anomalies --------------------------------------------------------------- */

export async function createAnomaly(payload: {
  feature_id: number;
  campaign_id: number;
  description: string;
  reported_by?: number;
  assigned_to?: number;
  test_case_id?: number;
  correction_due_date?: string;
}) {
  return api<{ anomaly: BackendAnomaly }>("/anomalies", { method: "POST", body: JSON.stringify(payload) });
}

export async function updateAnomalyById(id: number, patch: { description: string | undefined; status: string | undefined; correction_due_date: string | undefined }) {
  return api<{ anomaly: BackendAnomaly }>(`/anomalies/${id}`, { method: "PUT", body: JSON.stringify(patch) });
}

export async function deleteAnomalyById(id: number) {
  return api<void>(`/anomalies/${id}`, { method: "DELETE" });
}

/* ── Exigences --------------------------------------------------------------- */

export async function createRequirement(payload: { feature_id: number; title: string; description?: string; category?: string; status?: string }) {
  return api<BackendRequirement>("/requirements", { method: "POST", body: JSON.stringify(payload) });
}

export async function updateRequirementById(id: number, patch: { title: string | undefined; description: string | undefined; status: string | undefined }) {
  return api<BackendRequirement>(`/requirements/${id}`, { method: "PUT", body: JSON.stringify(patch) });
}

export async function deleteRequirementById(id: number) {
  return api<void>(`/requirements/${id}`, { method: "DELETE" });
}

/* ── Points à surveiller ----------------------------------------------------- */

export async function createWatchPoint(payload: {
  project_id: number;
  campaign_id?: number;
  feature_id: number | undefined;
  title: string;
  description: string;
  criticality?: string;
  status?: string;
  owner_id?: number;
}) {
  return api<BackendWatchPoint>("/watch-points", { method: "POST", body: JSON.stringify(payload) });
}

export async function updateWatchPointById(id: number, patch: { title: string | undefined; description: string | undefined; criticality: string | undefined; status: string | undefined }) {
  return api<BackendWatchPoint>(`/watch-points/${id}`, { method: "PUT", body: JSON.stringify(patch) });
}

export async function deleteWatchPointById(id: number) {
  return api<void>(`/watch-points/${id}`, { method: "DELETE" });
}

/* ── Releases (rattachées à un produit) -------------------------------------- */

export async function createRelease(productId: number, payload: { version: string | undefined; description?: string; status: string | undefined; planned_date: string | undefined }) {
  return api<{ release: BackendRelease }>(`/products/${productId}/releases`, { method: "POST", body: JSON.stringify(payload) });
}

export async function updateReleaseById(productId: number, releaseId: number, patch: { version: string | undefined; description: string | undefined; status: string | undefined; planned_date: string | undefined }) {
  return api<{ release: BackendRelease }>(`/products/${productId}/releases/${releaseId}`, { method: "PUT", body: JSON.stringify(patch) });
}

export async function deleteReleaseById(productId: number, releaseId: number) {
  return api<void>(`/products/${productId}/releases/${releaseId}`, { method: "DELETE" });
}

/* ── Tableau de bord --------------------------------------------------------- */

export type BackendDashboardStats = {
  projects: number;
  campaigns: number;
  campaignsActive: number;
  features: number;
  anomalies: number;
  anomaliesOpen: number;
  users: number;
  products: number;
  testCases: number;
  anomaliesByStatus?: { status: string; count: number }[];
  recentActivity?: unknown[];
};

export async function getDashboardStats() {
  return api<BackendDashboardStats>("/dashboard/stats");
}

/* ── Référentiels & règles de qualité ---------------------------------------- */

export type BackendReferentialRule = {
  id: string;
  domain: string;
  label: string;
  threshold: string;
  active: boolean;
  created_at?: string;
  updated_at?: string;
};

export async function listReferentialRules() {
  return api<BackendReferentialRule[]>("/referential-rules");
}

export async function updateReferentialRule(
  id: string,
  patch: Partial<Omit<BackendReferentialRule, "id" | "created_at" | "updated_at">>,
) {
  return api<BackendReferentialRule>(`/referential-rules/${encodeURIComponent(id)}`, {
    method: "PUT",
    body: JSON.stringify(patch),
  });
}

export async function createReferentialRule(data: Omit<BackendReferentialRule, "created_at" | "updated_at">) {
  return api<BackendReferentialRule>("/referential-rules", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function deleteReferentialRule(id: string) {
  return api<void>(`/referential-rules/${encodeURIComponent(id)}`, { method: "DELETE" });
}