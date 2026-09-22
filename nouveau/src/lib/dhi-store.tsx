/* ==========================================================================
   DHI STORE — Contexte React global (zustand-like)
   Organisation :
     1. IMPORTS
     2. TYPES & INTERFACES (Store)
     3. HELPERS (date / localStorage persistence)
     4. PROVIDER :
        4.1 États (useState) — chargés depuis localStorage si présent
        4.2 Valeur dérivée (useMemo) — regroupe toutes les mutations
        4.3 Effet de persistance automatique
     5. HOOKS & SELECTEURS (useStore + helpers: campaignStats, etc.)
   ========================================================================== */

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { toast } from "sonner";

/* -------------------------------------------------------------------------- */
/*  1. IMPORTS MÉTIERS                                                         */
/* -------------------------------------------------------------------------- */

import {
  alerts as seedAlerts,
  auditTrail as seedAudit,
  campaigns as seedCampaigns,
  defects as seedDefects,
  features as seedFeatures,
  goLiveDecisions as seedGoLive,
  platformUsers as seedUsers,
  products as seedProducts,
  projects as seedProjects,
  productDocuments as seedProductDocuments,
  projectDocuments as seedProjectDocuments,
  campaignDocuments as seedCampaignDocuments,
  featureDocuments as seedFeatureDocuments,
  referentialRules as seedRules,
  releases as seedReleases,
  requirements as seedRequirements,
  testCases as seedTests,
  watchPoints as seedWatchPoints,
  healthOf,
  healthThresholds,
  SCORE_WEIGHTS,
  GOLIVE_CHECKLIST_TEMPLATE,
  type Alert,
  type AlertType,
  type AppNotification,
  type AuditEntry,
  type Campaign,
  type CampaignDocument,
  type Defect,
  type Feature,
  type FeatureDocument,
  type GoLiveChecklistItem,
  type GoLiveDecision,
  type GoLiveVerdict,
  type PlatformUser,
  type Product,
  type ProductDocument,
  type Project,
  type ProjectDocument,
  type ReferentialRule,
  type Release,
  type ReleaseStatus,
  type Requirement,
  type ScoreBreakdown,
  type Severity,
  type TestCase,
  type TestType,
  type Verdict,
  type WatchPoint,
  type AppRole,
} from "./dhi-data";
import {
  ApiError,
  api,
  backendIdOf,
  mapBackendAnomaly,
  mapBackendCampaign,
  mapBackendGoLiveDecision,
  mapBackendProduct,
  mapBackendProject,
  mapBackendRequirement,
  mapBackendTestCase,
  mapBackendUser,
  mapBackendWatchPoint,
  getGoLiveChecklist,
  getGoLiveDecisions,
  createGoLiveDecision,
  updateGoLiveChecklistItem,
  createProduct,
  updateProductById,
  deleteProductById,
  createProject,
  updateProjectById,
  deleteProjectById,
  createCampaign,
  updateCampaignById,
  deleteCampaignById,
  createFeature,
  updateFeatureById,
  deleteFeatureById,
  createTestCase,
  updateTestCaseById,
  deleteTestCaseById,
  createExecution,
  updateExecutionById,
  createAnomaly,
  updateAnomalyById,
  deleteAnomalyById,
  createRequirement,
  updateRequirementById,
  deleteRequirementById,
  createWatchPoint,
  updateWatchPointById,
  deleteWatchPointById,
  createRelease,
  updateReleaseById,
  toBackendCampaignStatus,
  toBackendPriority,
  toFrontendCriticality,
  toBackendDefectStatus,
  toBackendRequirementStatus,
  toBackendVerdict,
  toBackendReleaseStatus,
  toBackendWatchStatus,
  toBackendWatchCriticality,
  listReferentialRules,
  updateReferentialRule,
  deleteReferentialRule,
  ROLE_TO_BACKEND,
  type BackendUser,
  type BackendCampaign,
  type BackendAnomaly,
  type BackendGoLiveDecision,
  type BackendRequirement,
  type BackendWatchPoint,
  type BackendProduct,
  type BackendProject,
  type BackendFeature,
  type BackendTestCase,
  type BackendTestExecution,
  type BackendReferentialRule,
  type LoginResponse,
} from "./api";

/* -------------------------------------------------------------------------- */
/*  3. HELPERS : Persistance localStorage + Date                               */
/* -------------------------------------------------------------------------- */

const STORAGE_KEY = "dhi-store-v1";
const SESSION_KEY = "dhi-session-v1";

type PersistedSnapshot = {
  products: Product[];
  features: Feature[];
  campaigns: Campaign[];
  tests: TestCase[];
  defects: Defect[];
  projects: Project[];
  releases: Release[];
  requirements: Requirement[];
  watchPoints: WatchPoint[];
  goLiveDecisions: GoLiveDecision[];
  goLiveChecklist: Record<string, GoLiveChecklistItem[]>;
  alerts: Alert[];
  notifications: AppNotification[];
  audit: AuditEntry[];
  rules: ReferentialRule[];
  users: PlatformUser[];
  productDocuments: ProductDocument[];
  projectDocuments: ProjectDocument[];
  campaignDocuments: CampaignDocument[];
  featureDocuments: FeatureDocument[];
};

export type SessionUser = { id: string; name: string; email: string; role: AppRole };

const today = () => new Date().toISOString().slice(0, 10);
const now = () => new Date().toISOString().slice(0, 16).replace("T", " ");

const makeDefaultChecklist = (): Record<string, GoLiveChecklistItem[]> => {
  const initial: Record<string, GoLiveChecklistItem[]> = {};
  for (const r of seedReleases) {
    initial[r.id] = GOLIVE_CHECKLIST_TEMPLATE.map((item, i) => ({
      ...item,
      checked: r.id === "rel-411" ? true : r.id === "rel-412" ? i < 5 : false,
    }));
  }
  return initial;
};

export function loadSnapshot(): PersistedSnapshot | null {
  console.log("[DHI] loadSnapshot called, window=", typeof window);
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    console.log("[DHI] loadSnapshot localStorage raw=", raw ? raw.substring(0, 80) + "..." : "null");
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PersistedSnapshot;
    if (!parsed || typeof parsed !== "object") return null;
    console.log("[DHI] loadSnapshot OK, products=", parsed.products?.length);
    return parsed;
  } catch (e) {
    console.error("[DHI] loadSnapshot error:", e);
    return null;
  }
}

function saveSnapshot(snap: PersistedSnapshot) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(snap));
  } catch {
    /* quota exceeded : silent */
  }
}

export function loadSession(): SessionUser | null {
  console.log("[DHI] loadSession called, window=", typeof window);
  if (typeof window !== "undefined") {
    try {
      if (!window.localStorage.getItem("token")) {
        window.localStorage.removeItem(SESSION_KEY);
        return null;
      }
      const raw = window.localStorage.getItem(SESSION_KEY);
      console.log("[DHI] loadSession localStorage raw=", raw ? raw.substring(0, 80) + "..." : "null");
      if (raw) return JSON.parse(raw) as SessionUser;
    } catch {
      /* ignore */
    }
  }
  return null;
}

function saveSession(user: SessionUser | null) {
  if (typeof window === "undefined") return;
  if (user) window.localStorage.setItem(SESSION_KEY, JSON.stringify(user));
  else window.localStorage.removeItem(SESSION_KEY);
}

let currentUserSetter: ((user: SessionUser | null) => void) | null = null;

export function registerSessionSetter(setter: ((user: SessionUser | null) => void) | null) {
  currentUserSetter = setter;
}

export function reconcileSessionFromMe(me: BackendUser): void {
  const session = loadSession();
  if (!session) return;
  const freshUser = mapBackendUser(me) as SessionUser;
  if (
    session.role !== freshUser.role ||
    session.name !== freshUser.name ||
    session.email !== freshUser.email
  ) {
    saveSession(freshUser);
    currentUserSetter?.(freshUser);
  }
}

export async function validateSessionBackend(): Promise<boolean> {
  const session = loadSession();
  if (!session) return false;
  try {
    const me = await api<BackendUser>("/auth/me");
    reconcileSessionFromMe(me);
    return true;
  } catch (err) {
    if (err instanceof ApiError && err.status === 401) return false;
    return true;
  }
}

const defaultSnapshot = (): PersistedSnapshot => ({
  products: seedProducts,
  features: seedFeatures,
  campaigns: seedCampaigns,
  tests: seedTests,
  defects: seedDefects,
  projects: seedProjects,
  releases: seedReleases,
  requirements: seedRequirements,
  watchPoints: seedWatchPoints,
  goLiveDecisions: seedGoLive,
  goLiveChecklist: makeDefaultChecklist(),
  alerts: seedAlerts,
  notifications: [],
  audit: seedAudit,
  rules: seedRules,
  users: seedUsers,
  productDocuments: seedProductDocuments,
  projectDocuments: seedProjectDocuments,
  campaignDocuments: seedCampaignDocuments,
  featureDocuments: seedFeatureDocuments,
});

/* -------------------------------------------------------------------------- */
/*  2. INTERFACE DU STORE                                                      */
/* -------------------------------------------------------------------------- */

interface Store {
  /*  2.1  États ----------------------------------------------------------  */
  products: Product[];
  features: Feature[];
  campaigns: Campaign[];
  tests: TestCase[];
  defects: Defect[];
  projects: Project[];
  releases: Release[];
  requirements: Requirement[];
  watchPoints: WatchPoint[];
  goLiveDecisions: GoLiveDecision[];
  goLiveChecklist: Record<string, GoLiveChecklistItem[]>;
  alerts: Alert[];
  notifications: AppNotification[];
  audit: AuditEntry[];
  rules: ReferentialRule[];
  users: PlatformUser[];
  currentUser: SessionUser | null;
  productDocuments: ProductDocument[];
  projectDocuments: ProjectDocument[];
  campaignDocuments: CampaignDocument[];
  featureDocuments: FeatureDocument[];

  /*  2.2  Session / Auth -----------------------------------------------  */
  login: (email: string, password: string) => Promise<{ ok: boolean; error?: string; user?: SessionUser }>;
  logout: () => void;
  backendStatus: "checking" | "online" | "offline";
  reloadFromBackend: () => void;

  /*  2.3  Mutations : Produits / Projets / Features --------------------  */
  addProduct: (p: Omit<Product, "id" | "breakdown" | "lastUpdate">) => string;
  replaceProducts: (products: Product[]) => void;
  updateProduct: (id: string, patch: Partial<Omit<Product, "id" | "breakdown">>) => void;
  deleteProduct: (id: string) => void;
  addProject: (p: Omit<Project, "id">) => string;
  replaceProjects: (projects: Project[]) => void;
  updateProject: (id: string, patch: Partial<Project>) => void;
  deleteProject: (id: string) => void;
  addFeature: (f: Omit<Feature, "id"> & { campaignId?: string | undefined }) => string;
  updateFeature: (id: string, patch: Partial<Feature>) => void;
  deleteFeature: (id: string) => void;

  /*  2.4  Mutations : Releases -----------------------------------------  */
  addRelease: (r: Omit<Release, "id">) => string;
  updateRelease: (id: string, patch: Partial<Release>) => void;
  setReleaseStatus: (id: string, status: ReleaseStatus) => void;

  /*  2.5  Mutations : Campagnes & Tests --------------------------------  */
  addCampaign: (c: Omit<Campaign, "id">, cloneFrom?: string) => string;
  replaceCampaigns: (campaigns: Campaign[]) => void;
  updateCampaign: (id: string, patch: Partial<Campaign>) => void;
  deleteCampaign: (id: string) => void;
  addTestCase: (
      t: Omit<TestCase, "id" | "verdict" | "observed" | "comment" | "evidence"> & {
        verdict?: Verdict;
        observed?: string;
        comment?: string;
      },
    ) => string;
  updateTest: (id: string, patch: Partial<TestCase>) => void;
  deleteTest: (id: string) => void;

  /*  2.6  Mutations : Anomalies & Watch points -------------------------  */
  addDefect: (d: Omit<Defect, "id">) => string;
  updateDefect: (id: string, patch: Partial<Defect>, auditDetail?: string) => void;
  deleteDefect: (id: string) => void;
  addWatchPoint: (w: Omit<WatchPoint, "id" | "createdAt">) => void;
  replaceWatchPoints: (watchPoints: WatchPoint[]) => void;
  updateWatchPoint: (id: string, patch: Partial<WatchPoint>) => void;
  deleteWatchPoint: (id: string) => void;

  /*  2.7  Mutations : Exigences & Go Live ------------------------------  */
  addRequirement: (r: Omit<Requirement, "id">) => void;
  replaceRequirements: (requirements: Requirement[]) => void;
  updateRequirement: (id: string, patch: Partial<Requirement>) => void;
  deleteRequirement: (id: string) => void;
  toggleChecklistItem: (releaseId: string, itemId: string) => void;
  addGoLiveDecision: (
    releaseId: string,
    verdict: GoLiveVerdict,
    decider: string,
    justification: string,
  ) => void;

  /*  2.8  Mutations : Alertes / Admin / Référentiel --------------------  */
  markAlertRead: (id: string) => void;
  markAllAlertsRead: () => void;
  pushAlert: (a: Omit<Alert, "id" | "createdAt" | "read">) => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  addUser: (u: Omit<PlatformUser, "id">) => Promise<string>;
  updateUserRole: (id: string, role: PlatformUser["role"]) => Promise<void>;
  toggleUserActive: (id: string) => Promise<void>;
  removeUser: (id: string) => Promise<void>;
  updateRule: (id: string, patch: Partial<ReferentialRule>) => void;
  deleteRule: (id: string) => void;

  /*  2.9  Mutations : Documents ---------------------------------------  */
  addProductDocument: (d: Omit<ProductDocument, "id">) => string;
  replaceProductDocuments: (documents: ProductDocument[]) => void;
  deleteProductDocument: (id: string) => void;
  addProjectDocument: (d: Omit<ProjectDocument, "id">) => string;
  replaceProjectDocuments: (documents: ProjectDocument[]) => void;
  deleteProjectDocument: (id: string) => void;
  addCampaignDocument: (d: Omit<CampaignDocument, "id">) => string;
  replaceCampaignDocuments: (documents: CampaignDocument[]) => void;
  deleteCampaignDocument: (id: string) => void;
  addFeatureDocument: (d: Omit<FeatureDocument, "id">) => string;
  replaceFeatureDocuments: (documents: FeatureDocument[]) => void;
  deleteFeatureDocument: (id: string) => void;

  /*  2.10  Audit & Reset ------------------------------------------------  */
  logAudit: (actor: string, action: string, entity: string, detail: string) => void;
  resetAllData: () => void;
}

const StoreContext = createContext<Store | null>(null);

/* -------------------------------------------------------------------------- */
/*  4. PROVIDER                                                                */
/* -------------------------------------------------------------------------- */

export function DhiStoreProvider({ children }: { children: ReactNode }) {
  /*  4.1  États -----------------------------------------------------------  */

  const initialSnap = useMemo<PersistedSnapshot>(() => loadSnapshot() ?? defaultSnapshot(), []);
  const initialSession = useMemo<SessionUser | null>(() => loadSession(), []);

  const [products, setProducts] = useState<Product[]>(initialSnap.products);
  const [features, setFeatures] = useState<Feature[]>(initialSnap.features);
  const [campaigns, setCampaigns] = useState<Campaign[]>(initialSnap.campaigns);
  const [tests, setTests] = useState<TestCase[]>(initialSnap.tests);
  const [defects, setDefects] = useState<Defect[]>(initialSnap.defects);
  const [projects, setProjects] = useState<Project[]>(initialSnap.projects);
  const [releases, setReleases] = useState<Release[]>(initialSnap.releases);
  const [requirements, setRequirements] = useState<Requirement[]>(initialSnap.requirements);
  const [watchPoints, setWatchPoints] = useState<WatchPoint[]>(initialSnap.watchPoints);
  const [goLiveDecisions, setGoLiveDecisions] = useState<GoLiveDecision[]>(
    initialSnap.goLiveDecisions,
  );
  const [goLiveChecklist, setGoLiveChecklist] = useState<Record<string, GoLiveChecklistItem[]>>(
    () => initialSnap.goLiveChecklist ?? makeDefaultChecklist(),
  );
  const [alerts, setAlerts] = useState<Alert[]>(initialSnap.alerts);
  const [notifications, setNotifications] = useState<AppNotification[]>(
    initialSnap.notifications ?? [],
  );
  const [audit, setAudit] = useState<AuditEntry[]>(initialSnap.audit);
  const [rules, setRules] = useState<ReferentialRule[]>(initialSnap.rules);
  const [users, setUsers] = useState<PlatformUser[]>(() => {
    const loaded = initialSnap.users;
    const byId = new Map<string, PlatformUser>(loaded.map((u) => [u.id, u]));
    for (const s of seedUsers) if (!byId.has(s.id)) byId.set(s.id, s);
    return Array.from(byId.values());
  });
  const [currentUser, setCurrentUser] = useState<SessionUser | null>(initialSession);
  const [backendStatus, setBackendStatus] = useState<"checking" | "online" | "offline">("online");
  const [productDocuments, setProductDocuments] = useState<ProductDocument[]>(
    initialSnap.productDocuments ?? seedProductDocuments,
  );
  const [projectDocuments, setProjectDocuments] = useState<ProjectDocument[]>(
    initialSnap.projectDocuments ?? seedProjectDocuments,
  );
  const [campaignDocuments, setCampaignDocuments] = useState<CampaignDocument[]>(
    initialSnap.campaignDocuments ?? seedCampaignDocuments,
  );
  const [featureDocuments, setFeatureDocuments] = useState<FeatureDocument[]>(
    initialSnap.featureDocuments ?? seedFeatureDocuments,
  );

  /*  4.2  Effet : persister à chaque changement --------------------------  */

  const firstRender = useRef(true);
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    const snap: PersistedSnapshot = {
      products,
      features,
      campaigns,
      tests,
      defects,
      projects,
      releases,
      requirements,
      watchPoints,
      goLiveDecisions,
      goLiveChecklist,
      alerts,
      notifications,
      audit,
      rules,
      users,
      productDocuments,
      projectDocuments,
      campaignDocuments,
      featureDocuments,
    };
    saveSnapshot(snap);
  }, [
    products,
    features,
    campaigns,
    tests,
    defects,
    projects,
    releases,
    requirements,
    watchPoints,
    goLiveDecisions,
    goLiveChecklist,
    alerts,
    notifications,
    audit,
    rules,
    users,
    productDocuments,
    projectDocuments,
    campaignDocuments,
    featureDocuments,
  ]);

  useEffect(() => {
    registerSessionSetter(setCurrentUser);
    return () => registerSessionSetter(null);
  }, []);

  useEffect(() => {
    saveSession(currentUser);
  }, [currentUser]);

  const loadGoLiveFromBackend = async (releaseList: Release[]) => {
    try {
      const [decisionPage, ...checklistPages] = await Promise.all([
        getGoLiveDecisions(),
        ...releaseList.map((r) =>
          getGoLiveChecklist(r.id).then((items) => ({ releaseId: r.id, items })),
        ),
      ]);
      if (decisionPage.data.length) {
        setGoLiveDecisions(decisionPage.data.map(mapBackendGoLiveDecision));
      }
      const overlayByRelease = new Map(checklistPages.map((entry) => [entry.releaseId, entry.items]));
      if (overlayByRelease.size) {
        setGoLiveChecklist((prev) => {
          const next = { ...prev };
          for (const [releaseId, backendItems] of overlayByRelease) {
            if (backendItems.length) {
              const checkedByKey = new Map(backendItems.map((i) => [i.id, i.checked]));
              const base = next[releaseId] ?? GOLIVE_CHECKLIST_TEMPLATE.map((t) => ({ ...t, checked: false }));
              next[releaseId] = base.map((item) => ({
                ...item,
                checked: checkedByKey.get(item.id) ?? item.checked,
              }));
            }
          }
          return next;
        });
      }
    } catch (error) {
      console.error("[DHI] Impossible de charger le domaine Go Live backend", error);
    }
  };

  /*  4.2.1  Helpers de synchronisation backend ---------------------------  */

  const syncEnabled = () => !!currentUser && !!localStorage.getItem("token");

  const attemptBackend = (label: string, fn: () => Promise<unknown>) => {
    if (!syncEnabled()) return Promise.resolve();
    return Promise.resolve()
      .then(fn)
      .then(() => setBackendStatus("online"))
      .catch((error) => {
        if (error instanceof TypeError) {
          setBackendStatus("offline");
        } else if (error instanceof ApiError) {
          toast.error(label, { description: error.message });
        } else {
          console.error(`[DHI][sync] ${label}`, error);
        }
      });
  };

  const refreshFromBackend = async () => {
    if (!syncEnabled()) return;
    setBackendStatus("checking");
    try {
      const [backendProducts, backendProjects, backendCampaigns] = await Promise.all([
        api<BackendProduct[]>("/products"),
        api<BackendProject[]>("/projects"),
        api<BackendCampaign[]>("/campaigns"),
      ]);
      let backendUsers: PlatformUser[] | null = null;
      try {
        const roster = await api<BackendUser[]>("/auth/members");
        backendUsers = roster.map(mapBackendUser);
      } catch (error) {
        console.warn("[DHI] Effectif non chargé", error);
      }
      const projectById = new Map(backendProjects.map((project) => [project.id, project]));

      const featurePages = await Promise.all(
        backendCampaigns.map((campaign) =>
          api<BackendFeature[]>(`/features?campaignId=${campaign.id}`).then((items) => ({
            campaignId: campaign.id,
            items,
          })),
        ),
      );
      const testPages = await Promise.all(
        backendCampaigns.map((campaign) =>
          api<BackendTestCase[]>(`/test-cases?campaignId=${campaign.id}`).then((items) => ({
            campaignId: campaign.id,
            items,
          })),
        ),
      );
      const executionPages = await Promise.all(
        backendCampaigns.map((campaign) =>
          api<{ data: BackendTestExecution[] }>(`/test-executions?campaignId=${campaign.id}&limit=200`).then(
            (page) => page.data,
          ),
        ),
      );

      const execByTest = new Map<string, BackendTestExecution[]>();
      for (const list of executionPages) {
        for (const exec of list) {
          const key = String(exec.test_case_id);
          const already = execByTest.get(key) ?? [];
          already.push(exec);
          execByTest.set(key, already);
        }
      }

      const [anomalyPage, requirementPage] = await Promise.all([
        api<{ data: BackendAnomaly[] }>("/anomalies?limit=200"),
        api<{ data: BackendRequirement[] }>("/requirements?limit=200"),
      ]);
      const watchProjectPages = await Promise.all(
        backendProjects
          .filter((project) => !project.is_archived)
          .map((project) =>
            api<{ data: BackendWatchPoint[] }>(`/watch-points?projetId=${project.id}&limit=200`),
          ),
      );
      const productByProject = new Map(backendProjects.map((project) => [project.id, project.product_id]));

      setProducts(backendProducts.map(mapBackendProduct));
      setProjects(backendProjects.map(mapBackendProject));
      setCampaigns(
        backendCampaigns.map((campaign) => mapBackendCampaign(campaign, projectById.get(campaign.project_id))),
      );

      // Fonctionnalités : union des fonctions par campagne, rattachées au produit du projet de la campagne.
const featureById = new Map<string, Feature>();
      for (const page of featurePages) {
        const campaign = backendCampaigns.find((c) => c.id === page.campaignId);
        const project = campaign ? projectById.get(campaign.project_id) : undefined;
        const productId = project && project.product_id != null ? String(project.product_id) : "";
        for (const feature of page.items) {
          featureById.set(String(feature.id), {
            id: String(feature.id),
            productId,
            name: feature.name,
            description: feature.description ?? "",
            criticality: toFrontendCriticality(feature.priority),
            coverage: (feature.coverage ?? {}) as Partial<Record<TestType, boolean>>,
          });
        }
      }
      setFeatures(Array.from(featureById.values()));

      const nextTests: TestCase[] = [];
      for (const page of testPages) {
        for (const test of page.items) {
          const execs = execByTest.get(String(test.id));
          nextTests.push(mapBackendTestCase(test, execs?.[execs.length - 1]));
        }
      }
      setTests(nextTests);

      setDefects(anomalyPage.data.map(mapBackendAnomaly));
      setRequirements(requirementPage.data.map(mapBackendRequirement));
      setWatchPoints(
        watchProjectPages.flatMap((page) =>
          page.data.map((point) => mapBackendWatchPoint(point, String(productByProject.get(point.project_id) ?? ""))),
        ),
      );
      if (backendUsers) setUsers(backendUsers);

      try {
        const me = await api<BackendUser>("/auth/me");
        reconcileSessionFromMe(me);
      } catch (error) {
        console.warn("[DHI] Session non rafraîchie", error);
      }

      try {
        const rules = await listReferentialRules();
        setRules(
          rules.map((rule: BackendReferentialRule) => ({
            id: rule.id,
            domain: rule.domain,
            label: rule.label,
            threshold: rule.threshold,
            active: rule.active,
          })),
        );
      } catch (error) {
        console.warn("[DHI] Référentiels non chargés", error);
      }

      await loadGoLiveFromBackend(releases);
      setBackendStatus("online");
    } catch (error) {
      console.error("[DHI] Impossible de charger les données backend", error);
      setBackendStatus("offline");
    }
  };

  useEffect(() => {
    if (currentUser && loadSession() === null) {
      setCurrentUser(null);
    }
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser || !localStorage.getItem("token")) return;
    setBackendStatus("checking");
    void refreshFromBackend();
  }, [currentUser]);

  /*  4.2b  Effet : Scoring CDC dynamique (recalcule à chaque changement)  */

  const firstScoring = useRef(true);
  useEffect(() => {
    if (firstScoring.current) {
      firstScoring.current = false;
      return;
    }
    if (!products.length) return;

    const todayStr = today();
    const next = products.map((prod) => {
      const prodFeatures = features.filter((f) => f.productId === prod.id);
      const prodTests = tests.filter((t) =>
        prodFeatures.some((f) => f.id === t.featureId),
      );
      const prodDefects = defects.filter((d) => d.productId === prod.id);

      // --- 1. RESULTS : succès sur tests exécutés applicables ---
      const executed = prodTests.filter(
        (t) => t.verdict !== "NOT_RUN" && t.verdict !== "NOT_APPLICABLE",
      );
      const passedCnt = executed.filter(
        (t) => t.verdict === "PASS" || t.verdict === "PASS_WITH_RESERVATION",
      ).length;
      const results = executed.length
        ? Math.round((passedCnt / executed.length) * 100)
        : prod.breakdown.results;

      // --- 2. COVERAGE : couverture feature × type de test ---
      if (typeof window !== "undefined") {
        // noop to keep import side-effects happy
      }
      let totalCells = 0;
      let coveredCells = 0;
      for (const f of prodFeatures) {
        const coverageEntries = Object.entries(f.coverage ?? {});
        totalCells += coverageEntries.length || 1;
        coveredCells += coverageEntries.filter(([, v]) => v).length;
      }
      const coverage = totalCells
        ? Math.round((coveredCells / totalCells) * 100)
        : prod.breakdown.coverage;

      // --- 3. CRITICAL : taux de succès des tests critiques ---
      const critTests = prodTests.filter((t) => t.criticality === "critique");
      const critExecuted = critTests.filter(
        (t) => t.verdict !== "NOT_RUN" && t.verdict !== "NOT_APPLICABLE",
      );
      const critPassed = critExecuted.filter(
        (t) => t.verdict === "PASS" || t.verdict === "PASS_WITH_RESERVATION",
      ).length;
      const critical = critExecuted.length
        ? Math.round((critPassed / critExecuted.length) * 100)
        : 100;

      // --- 4. INCIDENTS : pénalité par anomalie ouverte ---
      const openHigh = prodDefects.filter((d) => d.status !== "fermee" && d.severity === "haute").length;
      const openMed = prodDefects.filter((d) => d.status !== "fermee" && d.severity === "moyenne").length;
      const openLow = prodDefects.filter((d) => d.status !== "fermee" && d.severity === "basse").length;
      const penalty = openHigh * 15 + openMed * 6 + openLow * 2;
      const incidents = Math.max(0, 100 - penalty);

      // --- 5. NON-FUNCTIONAL : succès sur tests NF / speciaux ---
      const nfTypes: TestType[] = [
        "securite",
        "penetration",
        "performance",
        "charge",
        "endurance",
        "volumetrie",
        "robustesse",
        "accessibilite",
        "compatibilite",
        "localisation",
        "conformite",
      ];
      const nfTests = prodTests.filter((t) => nfTypes.includes(t.type));
      const nfExec = nfTests.filter(
        (t) => t.verdict !== "NOT_RUN" && t.verdict !== "NOT_APPLICABLE",
      );
      const nfPassed = nfExec.filter(
        (t) => t.verdict === "PASS" || t.verdict === "PASS_WITH_RESERVATION",
      ).length;
      const nonFunctional = nfExec.length
        ? Math.round((nfPassed / nfExec.length) * 100)
        : prod.breakdown.nonFunctional;

      // --- 6. TESTABILITY : % tests avec préconditions renseignées ---
      const testable = prodTests.filter(
        (t) => t.preconditions && t.preconditions.length > 0,
      ).length;
      const testability = prodTests.length
        ? Math.round((testable / prodTests.length) * 100)
        : prod.breakdown.testability;

      // --- 7. QUALITY CONTROL : défauts clos / total ---
      const closed = prodDefects.filter((d) => d.status === "fermee").length;
      const qualityControl = prodDefects.length
        ? Math.round((closed / prodDefects.length) * 100)
        : prod.breakdown.qualityControl;

      const breakdown: ScoreBreakdown = {
        results,
        coverage,
        critical,
        incidents,
        nonFunctional,
        testability,
        qualityControl,
      };
      const score = Math.round(
        breakdown.results * SCORE_WEIGHTS.results +
          breakdown.coverage * SCORE_WEIGHTS.coverage +
          breakdown.critical * SCORE_WEIGHTS.critical +
          breakdown.incidents * SCORE_WEIGHTS.incidents +
          breakdown.nonFunctional * SCORE_WEIGHTS.nonFunctional +
          breakdown.testability * SCORE_WEIGHTS.testability +
          breakdown.qualityControl * SCORE_WEIGHTS.qualityControl,
      );
      return { ...prod, breakdown, score, lastUpdate: todayStr };    });

    const hasChanges = next.some((p, i) => {
      const old = products[i];
      if (!old) return true;
      return (
        p.score !== old.score ||
        Object.keys(p.breakdown).some(
          (k) => p.breakdown[k as keyof ScoreBreakdown] !== old.breakdown[k as keyof ScoreBreakdown],
        )
      );
    });
    if (hasChanges) setProducts(next);
  }, [tests, defects, features, campaigns]);

  /*  4.2c  Effet : Moteur d'alertes dynamiques ---------------------------  */

  const alertFingerprints = useRef<Set<string>>(new Set());
  useEffect(() => {
    const fires: { type: AlertType; severity: Severity | "info"; title: string; message: string; entityId: string }[] = [];
    const fp = (k: string, id: string) => `${k}:${id}`;

    // Règle 1 : anomalie haute gravité créée et ouverte
    for (const d of defects) {
      if (d.severity === "haute" && d.status !== "fermee") {
        const k = fp("DEFECT-HIGH", d.id);
        if (!alertFingerprints.current.has(k)) {
          alertFingerprints.current.add(k);
          fires.push({
            type: "anomalie",
            severity: "haute",
            title: `Anomalie critique détectée : ${d.title}`,
            message: `Gravité haute, statut ${d.status} — assignée à ${d.assignee}`,
            entityId: d.id,
          });
        }
      }
    }

    // Règle 2 : test critique en échec
    for (const t of tests) {
      if (t.criticality === "critique" && t.verdict === "FAIL") {
        const k = fp("TEST-CRIT-FAIL", t.id);
        if (!alertFingerprints.current.has(k)) {
          alertFingerprints.current.add(k);
          fires.push({
            type: "couverture",
            severity: "haute",
            title: `Test critique en échec : ${t.name}`,
            message: `Campagne ${t.campaignId} — corriger avant décision Go/No-Go`,
            entityId: t.id,
          });
        }
      }
    }

    // Règle 3 : campagne avec taux de succès < 80%
    for (const c of campaigns) {
      const stats = campaignStats(tests, c.id);
      if (stats.executed >= 5 && stats.successRate < 80 && c.status !== "terminee") {
        const k = fp("CAMP-SUCCESS", c.id);
        if (!alertFingerprints.current.has(k)) {
          alertFingerprints.current.add(k);
          fires.push({
            type: "campagne",
            severity: "moyenne",
            title: `Taux de succès faible sur ${c.name}`,
            message: `${stats.successRate}% de succès après ${stats.executed} tests exécutés`,
            entityId: c.id,
          });
        }
      }
    }

    // Règle 4 : campagne en retard (endDate dépassée)
    const todayISO = today();
    for (const c of campaigns) {
      if (c.endDate && c.endDate < todayISO && c.status !== "terminee") {
        const k = fp("CAMP-LATE", c.id);
        if (!alertFingerprints.current.has(k)) {
          alertFingerprints.current.add(k);
          fires.push({
            type: "campagne",
            severity: "haute",
            title: `Campagne en retard : ${c.name}`,
            message: `Échéance du ${c.endDate} dépassée — statut : ${c.status}`,
            entityId: c.id,
          });
        }
      }
    }

    // Règle 5 : produit santé "critique"
    for (const p of products) {
      const s = productScore(p);
      if (s < 60) {
        const k = fp("PROD-CRIT", p.id);
        if (!alertFingerprints.current.has(k)) {
          alertFingerprints.current.add(k);
          fires.push({
            type: "systeme",
            severity: "haute",
            title: `Produit en santé critique : ${p.name}`,
            message: `Score CDC = ${s}/100 — plan d'action requis`,
            entityId: p.id,
          });
        }
      }
    }

    // Règle 6 : Go Live checklist avec item critique non validé + décision GO
    for (const g of goLiveDecisions) {
      if (g.verdict === "GO" && g.checklistCompletion < 80) {
        const k = fp("GOLIVE-RISK", g.id);
        if (!alertFingerprints.current.has(k)) {
          alertFingerprints.current.add(k);
          fires.push({
            type: "golive",
            severity: "moyenne",
            title: `Go Live à risque — checklist ${g.checklistCompletion}%`,
            message: `Décision ${g.verdict} malgré checklist incomplète (décideur : ${g.decider})`,
            entityId: g.id,
          });
        }
      }
    }

    // Injection des alertes détectées
    if (fires.length) {
      setAlerts((prev) => {
        const next = [...prev];
        for (const f of fires) {
          const dup = next.some(
            (a) => a.entityId === f.entityId && a.title === f.title,
          );
          if (dup) continue;
          next.unshift({
            id: `AL-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            type: f.type,
            severity: f.severity === "info" ? "basse" : (f.severity as Severity),
            title: f.title,
            message: f.message,
            entityId: f.entityId,
            read: false,
            createdAt: now(),
          });
        }
        return next;
      });
    }
  }, [tests, defects, campaigns, products, goLiveDecisions]);

  /*  4.2d  Effet : Notifications utilisateur ciblées (par affectation) ---  */

  const notifFingerprints = useRef<Set<string>>(new Set());
  useEffect(() => {
    if (!users.length) return;
    const userIdOf = (name?: string): string | null => {
      if (!name) return null;
      const u = users.find((x) => x.name === name);
      return u ? u.id : null;
    };
    const nfp = (k: string) => notifFingerprints.current.has(k);
    const mark = (k: string) => notifFingerprints.current.add(k);
    const push = (
      userId: string | null,
      type: AppNotification["type"],
      title: string,
      message: string,
      key: string,
      link?: string,
    ) => {
      if (!userId || nfp(key)) return;
      mark(key);
      const notif: AppNotification = {
        id: `NT-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        userId,
        type,
        title,
        message,
        read: false,
        createdAt: now(),
      };
      if (link) notif.link = link;
      setNotifications((prev) => [notif, ...prev]);
    };

    for (const d of defects) {
      // Assignation d'une anomalie haute gravité
      const asId = userIdOf(d.assignee);
      push(
        asId,
        "defect_assign",
        `Anomalie assignée : ${d.title}`,
        `Vous avez été désigné (${d.severity}). Statut : ${d.status}`,
        `/anomalies/${d.id}`,
        `defect-assign:${d.id}:${d.assignee}:${d.status}`,
      );
      // Un développeur est affecté à l'anomalie
      const devId = userIdOf(d.developer);
      push(
        devId,
        "defect_assign",
        `Anomalie pour développement : ${d.title}`,
        `Vous êtes le développeur référent (${d.severity}).`,
        `/anomalies/${d.id}`,
        `defect-dev:${d.id}:${d.developer ?? ""}`,
      );
      // Changement de statut de l'anomalie -> notifier l'assigné & le développeur
      if (d.status === "fermee" || d.status === "reouverte" || d.status === "a_retester") {
        push(
          asId,
          "defect_status",
          `Anomalie ${d.status} : ${d.title}`,
          `L'anomalie que vous suivez est passée à « ${d.status} ».`,
          `/anomalies/${d.id}`,
          `defect-status:${d.id}:${d.status}:${asId ?? ""}`,
        );
      }
    }

    for (const t of tests) {
      const teId = userIdOf(t.tester);
      if (t.verdict === "FAIL" || t.verdict === "BLOCKED") {
        push(
          teId,
          "test_assign",
          `Test ${t.verdict} : ${t.name}`,
          `Résultat à traiter sur la campagne ${t.campaignId}.`,
          `/execution/${t.id}`,
          `test-state:${t.id}:${t.verdict}:${teId ?? ""}`,
        );
      }
    }

    for (const c of campaigns) {
      const stats = campaignStats(tests, c.id);
      if (stats.executed >= 1 && stats.successRate < 80 && c.status !== "terminee") {
        const ownerId = userIdOf(c.owner);
        push(
          ownerId,
          "campaign",
          `Taux de succès faible : ${c.name}`,
          `${stats.successRate}% de succès (${stats.executed} exécutés).`,
          `/campagnes/${c.id}`,
          `camp-rate:${c.id}:${Math.round(stats.successRate)}`,
        );
        for (const te of c.testers) {
          push(
            userIdOf(te),
            "campaign",
            `Campagne à surveiller : ${c.name}`,
            `${stats.successRate}% de succès (${stats.executed} exécutés).`,
            `/campagnes/${c.id}`,
            `camp-rate-${te}:${c.id}:${Math.round(stats.successRate)}`,
          );
        }
      }
      if (c.endDate && c.endDate < today() && c.status !== "terminee") {
        const ownerId = userIdOf(c.owner);
        push(
          ownerId,
          "campaign",
          `Campagne en retard : ${c.name}`,
          `Échéance du ${c.endDate} dépassée.`,
          `/campagnes/${c.id}`,
          `camp-late:${c.id}:${c.endDate}`,
        );
      }
    }

    for (const p of products) {
      const s = productScore(p);
      if (s < 60) {
        const targets = [userIdOf(p.owner), userIdOf(p.qaLead), ...p.qaTeam.map(userIdOf)];
        const tgt = [...new Set(targets.filter((x): x is string => !!x))];
        for (const uid of tgt) {
          push(
            uid,
            "product",
            `Santé critique : ${p.name}`,
            `Score CDC = ${s}/100. Plan d'action requis.`,
            `/produits/${p.id}`,
            `prod-crit:${p.id}:${uid}:${s}`,
          );
        }
      }
    }

    for (const g of goLiveDecisions) {
      if (g.verdict === "GO" && g.checklistCompletion < 80) {
        const deciderId = userIdOf(g.decider);
        push(
          deciderId,
          "golive",
          `Go Live à risque — checklist ${g.checklistCompletion}%`,
          `Décision ${g.verdict} malgré checklist incomplète.`,
          `/go-live`,
          `golive:${g.id}:${g.checklistCompletion}`,
        );
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tests, defects, campaigns, products, goLiveDecisions, users]);



  const value = useMemo<Store>(() => {
    const pushAudit = (actor: string, action: string, entity: string, detail: string) =>
      setAudit((prev) => [
        { id: `AU-${Date.now()}`, actor, action, entity, detail, at: now() },
        ...prev,
      ]);

    const asActor = (fallback: string) => currentUser?.name ?? fallback;

    return {
      /* États -----------------------------------------------------------  */
      products,
      features,
      campaigns,
      tests,
      defects,
      projects,
      releases,
      requirements,
      watchPoints,
      goLiveDecisions,
      goLiveChecklist,
      alerts,
      notifications,
      audit,
      rules,
      users,
      currentUser,
      backendStatus,
      reloadFromBackend: () => void refreshFromBackend(),
      productDocuments,
      projectDocuments,
      campaignDocuments,
      featureDocuments,

      /* Session / Auth -----------------------------------------------  */
      login: async (email, password) => {
        try {
          const result = await api<LoginResponse>("/auth/login", {
            method: "POST",
            body: JSON.stringify({ email, password }),
          });
          localStorage.setItem("token", result.token);
          const user = mapBackendUser(result.user) as SessionUser;
          localStorage.removeItem(STORAGE_KEY);
          setCurrentUser(user);
          saveSession(user);
          return { ok: true, user };
        } catch (error) {
          return {
            ok: false,
            error: error instanceof Error ? error.message : "Identifiants invalides.",
          };
        }
      },
      logout: () => {
        setCurrentUser(null);
        saveSession(null);
        localStorage.removeItem("token");
        setBackendStatus("online");
      },

      /* Produits / Projets / Features --------------------------------  */
      addProduct: (p) => {
        const id = `p-${Date.now()}`;
        setProducts((prev) => [
          ...prev,
          {
            ...p,
            id,
            lastUpdate: today(),
            breakdown: {
              results: p.score,
              coverage: p.score,
              critical: p.score,
              incidents: p.score,
              nonFunctional: p.score,
              testability: p.score,
              qualityControl: p.score,
            },
          },
        ]);
        attemptBackend("Création produit", () =>
          createProduct({ name: p.name, description: p.description }),
        );
        return id;
      },
      replaceProducts: (nextProducts) => setProducts(nextProducts),
      updateProduct: (id, patch) => {
        setProducts((prev) =>
          prev.map((p) => (p.id === id ? { ...p, ...patch, lastUpdate: today() } : p)),
        );
        const idBackend = backendIdOf(id);
        if (idBackend) {
          attemptBackend("Mise à jour produit", () =>
            updateProductById(idBackend, {
              name: patch.name,
              description: patch.description,
            }),
          );
        }
      },
      deleteProduct: (id) => {
        setProducts((prev) => prev.filter((p) => p.id !== id));
        setFeatures((prev) => prev.filter((f) => f.productId !== id));
        setProjects((prev) => prev.filter((p) => p.productId !== id));
        setCampaigns((prev) => prev.filter((c) => c.productId !== id));
        setDefects((prev) => prev.filter((d) => d.productId !== id));
        setRequirements((prev) => prev.filter((r) => r.productId !== id));
        const idBackend = backendIdOf(id);
        if (idBackend) attemptBackend("Suppression produit", () => deleteProductById(idBackend));
        pushAudit(asActor("Système"), "Produit supprimé", id, "—");
      },
      addProject: (p) => {
        const id = `pr-${Date.now()}`;
        setProjects((prev) => [...prev, { ...p, id }]);
        const productBackend = backendIdOf(p.productId);
        attemptBackend("Création projet", () =>
          createProject({
            name: p.name,
            description: p.objective,
            product_id: productBackend ?? null,
          }),
        );
        return id;
      },
      replaceProjects: (nextProjects) => setProjects(nextProjects),
      updateProject: (id, patch) => {
        setProjects((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)));
        const idBackend = backendIdOf(id);
        if (idBackend) {
          attemptBackend("Mise à jour projet", () =>
            updateProjectById(idBackend, {
              name: patch.name,
              description: patch.objective,
              product_id: backendIdOf(patch.productId) ?? null,
            }),
          );
        }
      },
      deleteProject: (id) => {
        setProjects((prev) => prev.filter((p) => p.id !== id));
        setCampaigns((prev) => prev.filter((c) => c.projectId !== id));
        setReleases((prev) => prev.filter((r) => r.projectId !== id));
        const idBackend = backendIdOf(id);
        if (idBackend) attemptBackend("Suppression projet", () => deleteProjectById(idBackend));
        pushAudit(asActor("Système"), "Projet supprimé", id, "—");
      },
      addFeature: (f) => {
        const id = `f-${Date.now()}`;
        setFeatures((prev) => [...prev, { ...f, id }]);
        const campaign = f.campaignId
          ? campaigns.find((c) => c.id === f.campaignId)
          : campaigns.find((c) => c.productId === f.productId);
        const campaignBackend = backendIdOf(campaign?.id);
        if (campaignBackend) {
          attemptBackend("Création fonctionnalité", () =>
            createFeature({
              campaign_id: campaignBackend,
              name: f.name,
              description: f.description,
              priority: toBackendPriority(f.criticality),
            }),
          );
        } else if (!f.campaignId) {
          toast.warning(
            "Fonctionnalité enregistrée localement : aucune campagne de ce produit n'est synchronisée au back-office. Créez d'abord une campagne.",
          );
        }
        return id;
      },
      updateFeature: (id, patch) => {
        setFeatures((prev) => prev.map((f) => (f.id === id ? { ...f, ...patch } : f)));
        const idBackend = backendIdOf(id);
        if (idBackend) {
          attemptBackend("Mise à jour fonctionnalité", () =>
            updateFeatureById(idBackend, {
              name: patch.name,
              description: patch.description,
              priority: toBackendPriority(patch.criticality),
              module: undefined,
            }),
          );
        }
      },
      deleteFeature: (id) => {
        setFeatures((prev) => prev.filter((f) => f.id !== id));
        setTests((prev) => prev.filter((t) => t.featureId !== id));
        setDefects((prev) => prev.filter((d) => d.featureId !== id));
        const idBackend = backendIdOf(id);
        if (idBackend) attemptBackend("Suppression fonctionnalité", () => deleteFeatureById(idBackend));
      },

      /* Releases -----------------------------------------------------  */
      addRelease: (r) => {
        const id = `rel-${Date.now()}`;
        setReleases((prev) => [...prev, { ...r, id }]);
        const project = projects.find((p) => p.id === r.projectId);
        const productBackend = backendIdOf(project?.productId);
        if (productBackend) {
          attemptBackend("Création release", () =>
            createRelease(productBackend, {
              version: r.version,
              status: toBackendReleaseStatus(r.status),
              planned_date: r.plannedDate,
            }),
          );
        }
        return id;
      },
      updateRelease: (id, patch) => {
        setReleases((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
        const idBackend = backendIdOf(id);
        const release = releases.find((r) => r.id === id);
        const project = projects.find((p) => p.id === release?.projectId);
        const productBackend = backendIdOf(project?.productId);
        if (idBackend && productBackend) {
          attemptBackend("Mise à jour release", () =>
            updateReleaseById(productBackend, idBackend, {
              version: patch.version,
              description: undefined,
              status: toBackendReleaseStatus(patch.status),
              planned_date: patch.plannedDate,
            }),
          );
        }
      },
      setReleaseStatus: (id, status) => {
        setReleases((prev) =>
          prev.map((r) => (r.id === id ? { ...r, status } : r)),
        );
        const idBackend = backendIdOf(id);
        const release = releases.find((r) => r.id === id);
        const project = projects.find((p) => p.id === release?.projectId);
        const productBackend = backendIdOf(project?.productId);
        if (idBackend && productBackend) {
          attemptBackend("Statut release", () =>
            updateReleaseById(productBackend, idBackend, {
              version: undefined,
              description: undefined,
              status: toBackendReleaseStatus(status),
              planned_date: undefined,
            }),
          );
        }
        pushAudit(asActor("Système"), "Statut Release", id, `→ ${status}`);
      },

      /* Campagnes & Tests --------------------------------------------  */
      addCampaign: (c, cloneFrom) => {
        const id = `c-${Date.now()}`;
        setCampaigns((prev) => [...prev, { ...c, id }]);
        const projectBackend = backendIdOf(c.projectId);
        if (projectBackend) {
          attemptBackend("Création campagne", () =>
            createCampaign({
              project_id: projectBackend,
              name: c.name,
              status: toBackendCampaignStatus(c.status),
              start_date: c.startDate,
              end_date: c.endDate,
            }),
          );
        }
        if (cloneFrom) {
          setTests((prev) => {
            const source = prev.filter((t) => t.campaignId === cloneFrom);
            const clones = source.map((t, i) => ({
              ...t,
              id: `${t.id}-R${i + 1}`,
              campaignId: id,
              verdict: "NOT_RUN" as Verdict,
              observed: "",
              comment: "",
              evidence: [],
              tester: undefined,
              executedAt: undefined,
              duration: undefined,
            }));
            return [...prev, ...clones];
          });
        }
        pushAudit(
          asActor(c.owner),
          "Campagne créée",
          id,
          cloneFrom ? `Tests clonés depuis ${cloneFrom}` : c.name,
        );
        return id;
      },
      replaceCampaigns: (nextCampaigns) => setCampaigns(nextCampaigns),
      updateCampaign: (id, patch) => {
        setCampaigns((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)));
        const idBackend = backendIdOf(id);
        if (idBackend) {
          attemptBackend("Mise à jour campagne", () =>
            updateCampaignById(idBackend, {
              name: patch.name,
              status: toBackendCampaignStatus(patch.status),
              start_date: patch.startDate,
              end_date: patch.endDate,
            }),
          );
        }
      },
      deleteCampaign: (id) => {
        setCampaigns((prev) => prev.filter((c) => c.id !== id));
        setTests((prev) => prev.filter((t) => t.campaignId !== id));
        const idBackend = backendIdOf(id);
        if (idBackend) attemptBackend("Suppression campagne", () => deleteCampaignById(idBackend));
        pushAudit(asActor("Système"), "Campagne supprimée", id, "—");
      },
      addTestCase: (t) => {
        const id = `T-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        setTests((prev) => [
          ...prev,
          {
            ...t,
            id,
            verdict: t.verdict ?? ("NOT_RUN" as Verdict),
            observed: t.observed ?? "",
            comment: t.comment ?? "",
            evidence: [],
          },
        ]);
        const campaignBackend = backendIdOf(t.campaignId);
        const featureBackend = backendIdOf(t.featureId);
        if (campaignBackend && featureBackend) {
          attemptBackend("Création cas de test", () =>
            createTestCase({
              campaign_id: campaignBackend,
              feature_id: featureBackend,
              name: t.name,
              description: t.preconditions.join(", "),
              steps: t.steps,
              expected_result: t.expected.join(" · "),
              priority: toBackendPriority(t.criticality),
              type: t.type,
            }),
          );
        }
        pushAudit(asActor(t.tester ?? "Système"), "Cas de test créé", id, t.name);
        return id;
      },
      updateTest: (id, patch) => {
        setTests((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)));
        const test = tests.find((t) => t.id === id);
        if (patch.verdict && test) {
          const testBackend = backendIdOf(test.id);
          const campaignBackend = backendIdOf(test.campaignId);
          if (testBackend && campaignBackend) {
            const payload = {
              result: toBackendVerdict(patch.verdict),
              notes: patch.comment,
              actual_behavior: patch.observed,
            };
            const execBackend = backendIdOf(test.executionId);
            if (execBackend) {
              attemptBackend("Verdict enregistré", () => updateExecutionById(execBackend, payload));
            } else {
              attemptBackend("Verdict enregistré", () =>
                createExecution({
                  test_case_id: testBackend,
                  campaign_id: campaignBackend,
                  result: payload.result,
                  notes: payload.notes,
                  actual_behavior: payload.actual_behavior,
                }).then((exec) =>
                  setTests((prev) =>
                    prev.map((t) =>
                      t.id === id ? { ...t, executionId: String(exec.id) } : t,
                    ),
                  ),
                ),
              );
            }
          }
          pushAudit(asActor(patch.tester ?? "Système"), "Verdict enregistré", id, patch.verdict);
        } else if (test) {
          const testBackend = backendIdOf(test.id);
          if (testBackend) {
            const patchData = {
              ...(patch.name !== undefined && { name: patch.name }),
              ...(patch.preconditions !== undefined && { description: patch.preconditions.join(", ") }),
              ...(patch.expected !== undefined && { expected_result: patch.expected.join(" · ") }),
              ...(patch.steps !== undefined && { steps: patch.steps }),
              ...(patch.criticality !== undefined && { priority: toBackendPriority(patch.criticality) }),
              ...(patch.type !== undefined && { type: patch.type }),
            };
            if (Object.keys(patchData).length > 0) {
              attemptBackend("Mise à jour cas de test", () => updateTestCaseById(testBackend, patchData));
            }
          }
        }
      },
      deleteTest: (id) => {
        setTests((prev) => prev.filter((t) => t.id !== id));
        const idBackend = backendIdOf(id);
        if (idBackend) attemptBackend("Suppression cas de test", () => deleteTestCaseById(idBackend));
        pushAudit(asActor("Système"), "Cas de test supprimé", id, "—");
      },

      /* Anomalies & Watch points -------------------------------------  */
      addDefect: (d) => {
        const id = `ANO-${2852 + defects.length}`;
        setDefects((prev) => [...prev, { ...d, id }]);
        const featureBackend = backendIdOf(d.featureId);
        const campaign = d.campaignId
          ? campaigns.find((c) => c.id === d.campaignId)
          : campaigns.find((c) => c.productId === d.productId);
        const campaignBackend = backendIdOf(campaign?.id);
        if (featureBackend && campaignBackend) {
          const reporter = users.find((u) => u.name === d.reporter);
          const assignee = users.find((u) => u.name === (d.assignee ?? d.developer));
          const reporterBackendId = backendIdOf(reporter?.id);
          const assigneeBackendId = backendIdOf(assignee?.id);
          const testBackendId = backendIdOf(d.testId);
          attemptBackend("Création anomalie", () =>
            createAnomaly({
              feature_id: featureBackend,
              campaign_id: campaignBackend,
              description: d.description ? `${d.title}\n\n${d.description}` : d.title,
              correction_due_date: d.targetDate,
              ...(reporterBackendId !== undefined ? { reported_by: reporterBackendId } : {}),
              ...(assigneeBackendId !== undefined ? { assigned_to: assigneeBackendId } : {}),
              ...(testBackendId !== undefined ? { test_case_id: testBackendId } : {}),
            }),
          );
        }
        pushAudit(asActor(d.reporter), "Anomalie créée", id, d.title);
        return id;
      },
      updateDefect: (id, patch, auditDetail) => {
        setDefects((prev) => {
          const before = prev.find((x) => x.id === id);
          if (before && patch.status && patch.status !== before.status) {
            pushAudit(
              asActor(patch.assignee ?? before.assignee),
              "Statut anomalie",
              id,
              auditDetail ?? `${before.status} → ${patch.status}`,
            );
          }
          return prev.map((x) => (x.id === id ? { ...x, ...patch } : x));
        });
        const idBackend = backendIdOf(id);
        if (idBackend) {
          attemptBackend("Mise à jour anomalie", () =>
            updateAnomalyById(idBackend, {
              description: patch.description,
              status: patch.status ? toBackendDefectStatus(patch.status) : undefined,
              correction_due_date: patch.targetDate,
            }),
          );
        }
      },
      addWatchPoint: (w) => {
        const id = `WP-${String(watchPoints.length + 1).padStart(2, "0")}-${Date.now() % 1000}`;
        setWatchPoints((prev) => [{ ...w, id, createdAt: today() }, ...prev]);
        const project = projects.find((p) => p.productId === w.productId);
        const projectBackend = backendIdOf(project?.id);
        if (projectBackend) {
          attemptBackend("Création point à surveiller", () =>
            createWatchPoint({
              project_id: projectBackend,
              feature_id: backendIdOf(w.featureId),
              title: w.title,
              description: w.description,
              criticality: toBackendWatchCriticality(w.level),
              status: toBackendWatchStatus(w.status),
            }),
          );
        }
        pushAudit(asActor(w.owner), "Point à surveiller créé", id, w.title);
      },
      replaceWatchPoints: (nextWatchPoints) => setWatchPoints(nextWatchPoints),
      updateWatchPoint: (id, patch) => {
        setWatchPoints((prev) => prev.map((w) => (w.id === id ? { ...w, ...patch } : w)));
        const idBackend = backendIdOf(id);
        if (idBackend) {
          attemptBackend("Mise à jour point à surveiller", () =>
            updateWatchPointById(idBackend, {
              title: patch.title,
              description: patch.description,
              criticality: toBackendWatchCriticality(patch.level),
              status: toBackendWatchStatus(patch.status),
            }),
          );
        }
      },
      deleteDefect: (id) => {
        setDefects((prev) => prev.filter((d) => d.id !== id));
        const idBackend = backendIdOf(id);
        if (idBackend) attemptBackend("Suppression anomalie", () => deleteAnomalyById(idBackend));
        pushAudit(asActor("Système"), "Anomalie supprimée", id, "—");
      },
      deleteWatchPoint: (id) => {
        setWatchPoints((prev) => prev.filter((w) => w.id !== id));
        const idBackend = backendIdOf(id);
        if (idBackend) attemptBackend("Suppression point à surveiller", () => deleteWatchPointById(idBackend));
        pushAudit(asActor("Système"), "Point à surveiller supprimé", id, "—");
      },

      /* Exigences & Go Live ------------------------------------------  */
      addRequirement: (r) => {
        const id = `REQ-${100 + requirements.length + 1}`;
        setRequirements((prev) => [...prev, { ...r, id }]);
        const featureBackend = backendIdOf(r.featureIds[0]);
        if (featureBackend) {
          attemptBackend("Création exigence", () =>
            createRequirement({
              feature_id: featureBackend,
              title: r.title,
              description: r.description,
              status: toBackendRequirementStatus(r.status),
            }),
          );
        }
        return id;
      },
      replaceRequirements: (nextRequirements) => setRequirements(nextRequirements),
      updateRequirement: (id, patch) => {
        setRequirements((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
        const idBackend = backendIdOf(id);
        if (idBackend) {
          attemptBackend("Mise à jour exigence", () =>
            updateRequirementById(idBackend, {
              title: patch.title,
              description: patch.description,
              status: toBackendRequirementStatus(patch.status),
            }),
          );
        }
      },
      deleteRequirement: (id) => {
        setRequirements((prev) => prev.filter((r) => r.id !== id));
        const idBackend = backendIdOf(id);
        if (idBackend) attemptBackend("Suppression exigence", () => deleteRequirementById(idBackend));
        pushAudit(asActor("Système"), "Exigence supprimée", id, "—");
      },
      toggleChecklistItem: (releaseId, itemId) => {
        const current = (goLiveChecklist[releaseId] ?? []).find((item) => item.id === itemId);
        const nextChecked = !(current?.checked ?? false);
        setGoLiveChecklist((prev) => ({
          ...prev,
          [releaseId]: (prev[releaseId] ?? []).map((item) =>
            item.id === itemId ? { ...item, checked: !item.checked } : item,
          ),
        }));
        if (localStorage.getItem("token")) {
          updateGoLiveChecklistItem(releaseId, itemId, nextChecked).catch((error) =>
            console.error("[DHI] Erreur sync checklist Go Live", error),
          );
        }
      },
      addGoLiveDecision: (releaseId, verdict, decider, justification) => {
        const checklist = goLiveChecklist[releaseId] ?? [];
        const totalWeight = checklist.reduce((s, i) => s + i.weight, 0);
        const doneWeight = checklist.filter((i) => i.checked).reduce((s, i) => s + i.weight, 0);
        const completion = totalWeight ? Math.round((doneWeight / totalWeight) * 100) : 0;
        const release = releases.find((r) => r.id === releaseId);
        setGoLiveDecisions((prev) => [
          {
            id: `GL-${Date.now()}`,
            releaseId,
            verdict,
            date: today(),
            decider,
            justification,
            checklistCompletion: completion,
          },
          ...prev,
        ]);
        if (localStorage.getItem("token")) {
          createGoLiveDecision({
            release_ref: releaseId,
            verdict,
            decider,
            justification,
            checklist_completion: completion,
          }).catch((error) =>
            console.error("[DHI] Erreur enregistrement décision Go Live", error),
          );
        }
        pushAudit(
          decider,
          "Décision Go Live",
          release ? `Release ${release.version}` : releaseId,
          `${verdict} — checklist ${completion} %`,
        );
      },

      /* Alertes / Admin / Référentiel --------------------------------  */
      markAlertRead: (id) =>
        setAlerts((prev) => prev.map((a) => (a.id === id ? { ...a, read: true } : a))),
      markAllAlertsRead: () => setAlerts((prev) => prev.map((a) => ({ ...a, read: true }))),
      pushAlert: (a) =>
        setAlerts((prev) => [
          { id: `AL-${Date.now()}`, ...a, read: false, createdAt: now() },
          ...prev,
        ]),
      markNotificationRead: (id) =>
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
        ),
      markAllNotificationsRead: () =>
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true }))),
      updateUserRole: async (id, role) => {
        const isBackendUser = /^\d+$/.test(id);
        if (isBackendUser) {
          await api<{ user: { id: number | string } }>(
            `/auth/users/${id}/role`,
            {
              method: "PATCH",
              body: JSON.stringify({ role: ROLE_TO_BACKEND[role] }),
            },
          );
        }
        setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, role } : u)));
        pushAudit(asActor("Administrateur"), "Rôle modifié", id, role);
      },
      toggleUserActive: async (id) => {
        const target = users.find((u) => u.id === id);
        if (!target) return;
        const isBackendUser = /^\d+$/.test(id);
        if (isBackendUser) {
          await api<{ id: number | string }>(
            target.active
              ? `/auth/users/${id}/soft-delete`
              : `/auth/users/${id}/restore`,
            { method: "PATCH" },
          );
        }
        setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, active: !u.active } : u)));
        pushAudit(
          asActor("Administrateur"),
          target.active ? "Compte désactivé" : "Compte réactivé",
          id,
          target.name,
        );
      },
      removeUser: async (id) => {
        const target = users.find((u) => u.id === id);
        if (!target) return;
        const isBackendUser = /^\d+$/.test(id);
        if (isBackendUser) {
          await api<{ id: number | string }>(`/auth/users/${id}/soft-delete`, {
            method: "PATCH",
          });
        }
        setUsers((prev) => prev.filter((u) => u.id !== id));
        pushAudit(asActor("Administrateur"), "Utilisateur supprimé", id, target.name);
      },
      addUser: async (u) => {
        const [first_name, ...rest] = u.name.trim().split(/\s+/);
        const created = await api<{ user: { id: number | string } }>("/auth/register", {
          method: "POST",
          body: JSON.stringify({
            email: u.email,
            password: u.password ?? "",
            first_name: first_name ?? "",
            last_name: rest.join(" "),
            role: ROLE_TO_BACKEND[u.role],
          }),
        });
        const id = String(created.user.id);
        setUsers((prev) => [...prev, { id, ...u }]);
        pushAudit(asActor("Administrateur"), "Utilisateur créé", id, u.name);
        return id;
      },
      updateRule: (id, patch) => {
        setRules((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
        if (localStorage.getItem("token")) {
          const rulePatch = {
            ...(patch.domain !== undefined && { domain: patch.domain }),
            ...(patch.label !== undefined && { label: patch.label }),
            ...(patch.threshold !== undefined && { threshold: patch.threshold }),
            ...(patch.active !== undefined && { active: patch.active }),
          };
          void updateReferentialRule(id, rulePatch)
            .catch((error) => console.warn("[DHI] Règle non synchronisée", error));
        }
      },
      deleteRule: (id) => {
        setRules((prev) => prev.filter((r) => r.id !== id));
        pushAudit(asActor("Système"), "Règle supprimée", id, "—");
        if (localStorage.getItem("token")) {
          void deleteReferentialRule(id).catch((error) => console.warn("[DHI] Suppression règle non synchronisée", error));
        }
      },

      /* Documents ------------------------------------------------------  */
      addProductDocument: (d) => {
        const id = `PD-${Date.now()}`;
        setProductDocuments((prev) => [...prev, { ...d, id }]);
        pushAudit(asActor(d.uploadedBy), "Document produit ajouté", id, d.name);
        return id;
      },
      replaceProductDocuments: (nextDocuments) => setProductDocuments(nextDocuments),
      deleteProductDocument: (id) => {
        setProductDocuments((prev) => prev.filter((d) => d.id !== id));
        pushAudit(asActor("Système"), "Document produit supprimé", id, "—");
      },
      addProjectDocument: (d) => {
        const id = `PRD-${Date.now()}`;
        setProjectDocuments((prev) => [...prev, { ...d, id }]);
        pushAudit(asActor(d.uploadedBy), "Document projet ajouté", id, d.name);
        return id;
      },
      replaceProjectDocuments: (nextDocuments) => setProjectDocuments(nextDocuments),
      deleteProjectDocument: (id) => {
        setProjectDocuments((prev) => prev.filter((d) => d.id !== id));
        pushAudit(asActor("Système"), "Document projet supprimé", id, "—");
      },
      addCampaignDocument: (d) => {
        const id = `CD-${Date.now()}`;
        setCampaignDocuments((prev) => [...prev, { ...d, id }]);
        pushAudit(asActor(d.uploadedBy), "Document campagne ajouté", id, d.name);
        return id;
      },
      replaceCampaignDocuments: (nextDocuments) => setCampaignDocuments(nextDocuments),
      deleteCampaignDocument: (id) => {
        setCampaignDocuments((prev) => prev.filter((d) => d.id !== id));
        pushAudit(asActor("Système"), "Document campagne supprimé", id, "—");
      },
      addFeatureDocument: (d) => {
        const id = `FD-${Date.now()}`;
        setFeatureDocuments((prev) => [...prev, { ...d, id }]);
        pushAudit(asActor(d.uploadedBy), "Document fonctionnalité ajouté", id, d.name);
        return id;
      },
      replaceFeatureDocuments: (nextDocuments) => setFeatureDocuments(nextDocuments),
      deleteFeatureDocument: (id) => {
        setFeatureDocuments((prev) => prev.filter((d) => d.id !== id));
        pushAudit(asActor("Système"), "Document fonctionnalité supprimé", id, "—");
      },

      /* Audit & Reset ------------------------------------------------  */
      logAudit: pushAudit,
      resetAllData: () => {
        const fresh = defaultSnapshot();
        setProducts(fresh.products);
        setFeatures(fresh.features);
        setCampaigns(fresh.campaigns);
        setTests(fresh.tests);
        setDefects(fresh.defects);
        setProjects(fresh.projects);
        setReleases(fresh.releases);
        setRequirements(fresh.requirements);
        setWatchPoints(fresh.watchPoints);
        setGoLiveDecisions(fresh.goLiveDecisions);
        setGoLiveChecklist(fresh.goLiveChecklist);
        setAlerts(fresh.alerts);
        setNotifications(fresh.notifications ?? []);
        setAudit(fresh.audit);
        setRules(fresh.rules);
        setUsers(fresh.users);
        setProductDocuments(fresh.productDocuments);
        setProjectDocuments(fresh.projectDocuments);
        setCampaignDocuments(fresh.campaignDocuments);
        setFeatureDocuments(fresh.featureDocuments);
        saveSnapshot(fresh);
        pushAudit(asActor("Administrateur"), "Reset global", "—", "Données démo réinitialisées");
      },
    };
  }, [
    products,
    features,
    campaigns,
    tests,
    defects,
    projects,
    releases,
    requirements,
    watchPoints,
    goLiveDecisions,
    goLiveChecklist,
    alerts,
    notifications,
    audit,
    rules,
    users,
    currentUser,
    backendStatus,
    productDocuments,
    projectDocuments,
    campaignDocuments,
    featureDocuments,
  ]);

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

/* -------------------------------------------------------------------------- */
/*  5. HOOKS & SÉLECTEURS DÉRIVÉS                                              */
/* -------------------------------------------------------------------------- */

/** Hook principal pour accéder au store. */
export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used inside DhiStoreProvider");
  return ctx;
}

/** Agrège les stats d'une campagne depuis ses cas de test. */
export function campaignStats(tests: TestCase[], campaignId: string) {
  const list = tests.filter((t) => t.campaignId === campaignId);
  const total = list.length;
  const notRun = list.filter((t) => t.verdict === "NOT_RUN").length;
  const notApplicable = list.filter((t) => t.verdict === "NOT_APPLICABLE").length;
  const failed = list.filter((t) => t.verdict === "FAIL").length;
  const blocked = list.filter((t) => t.verdict === "BLOCKED").length;
  const passedWithReservation = list.filter((t) => t.verdict === "PASS_WITH_RESERVATION").length;
  const passed = list.filter((t) => t.verdict === "PASS").length;
  const applicable = total - notApplicable;
  const executed = applicable - notRun;
  return {
    list,
    total,
    applicable,
    executed,
    passed,
    passedWithReservation,
    failed,
    blocked,
    notRun,
    notApplicable,
    executionRate: applicable ? Math.round((executed / applicable) * 100) : 0,
    successRate: executed ? Math.round(((passed + passedWithReservation) / executed) * 100) : 0,
  };
}

/** Calcule le score pondéré CDC Q = f(R,C,K,I,NF,T,CQ). */
export function productScore(p: Product) {
  const b = p.breakdown;
  return Math.round(
    b.results * SCORE_WEIGHTS.results +
      b.coverage * SCORE_WEIGHTS.coverage +
      b.critical * SCORE_WEIGHTS.critical +
      b.incidents * SCORE_WEIGHTS.incidents +
      b.nonFunctional * SCORE_WEIGHTS.nonFunctional +
      b.testability * SCORE_WEIGHTS.testability +
      b.qualityControl * SCORE_WEIGHTS.qualityControl,
  );
}

/** Retourne les campagnes rattachées à un projet. */
export function projectCampaigns(campaigns: Campaign[], projectId: string) {
  return campaigns.filter((c) => c.projectId === projectId);
}

/** Synthèse santé produit. */
export function productHealth(p: Product) {
  return healthOf(productScore(p));
}

/** Hook : renvoie une fonction healthOf(score) pilotée par les règles RG-1/2/3 (seuils modifiables). */
export function useHealthOf() {
  const rules = useStore().rules;
  const thr = healthThresholds(rules);
  return (score: number) => healthOf(score, thr);
}