const API_BASE_URL = import.meta.env["VITE_API_URL"] ?? "http://localhost:5000/api";

import type {
  AppRole,
  Criticality,
  DefectStatus,
  GoLiveChecklistItem,
  GoLiveDecision,
  GoLiveVerdict,
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
  feature_name?: string | null;
  campaign_name?: string | null;
  reporter_first_name?: string | null;
  reporter_last_name?: string | null;
  assignee_first_name?: string | null;
  assignee_last_name?: string | null;
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
  };
}

export function mapBackendUser(user: BackendUser) {
  const role = user.role === "tester"
    ? "testeur"
    : user.role === "developer"
      ? "developpeur"
      : user.role;
  return {
    id: String(user.id),
    name: [user.first_name, user.last_name].filter(Boolean).join(" ") || user.email,
    email: user.email,
    role,
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

export function mapBackendAnomaly(anomaly: BackendAnomaly) {
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
    productId: "",
    title: anomaly.description.slice(0, 80),
    description: anomaly.description,
    severity: "moyenne",
    priority: "moyenne",
    status,
    featureId: String(anomaly.feature_id),
    version: "",
    testId: anomaly.test_case_id ? String(anomaly.test_case_id) : undefined,
    reporter: fullName(anomaly.reporter_first_name, anomaly.reporter_last_name),
    assignee: fullName(anomaly.assignee_first_name, anomaly.assignee_last_name),
    createdAt: anomaly.created_at,
    targetDate: anomaly.correction_due_date ?? "",
  } as const;
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