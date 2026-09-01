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
  type Defect,
  type Feature,
  type GoLiveChecklistItem,
  type GoLiveDecision,
  type GoLiveVerdict,
  type PlatformUser,
  type Product,
  type Project,
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

const DEFAULT_SESSION: SessionUser = {
  id: "u-8",
  name: "Karim Ndiaye",
  email: "karim.ndiaye@dhi.io",
  role: "admin",
};

export function loadSession(): SessionUser | null {
  console.log("[DHI] loadSession called, window=", typeof window);
  if (typeof window !== "undefined") {
    try {
      const raw = window.localStorage.getItem(SESSION_KEY);
      console.log("[DHI] loadSession localStorage raw=", raw ? raw.substring(0, 80) + "..." : "null");
      if (raw) return JSON.parse(raw) as SessionUser;
    } catch {
      /* ignore */
    }
  }
  console.log("[DHI] loadSession returning DEFAULT_SESSION (admin)");
  return DEFAULT_SESSION;
}

function saveSession(user: SessionUser | null) {
  if (typeof window === "undefined") return;
  if (user) window.localStorage.setItem(SESSION_KEY, JSON.stringify(user));
  else window.localStorage.removeItem(SESSION_KEY);
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

  /*  2.2  Session / Auth -----------------------------------------------  */
  login: (email: string, password: string) => { ok: boolean; error?: string; user?: SessionUser };
  logout: () => void;

  /*  2.3  Mutations : Produits / Projets / Features --------------------  */
  addProduct: (p: Omit<Product, "id" | "breakdown" | "lastUpdate">) => string;
  updateProduct: (id: string, patch: Partial<Omit<Product, "id" | "breakdown">>) => void;
  deleteProduct: (id: string) => void;
  addProject: (p: Omit<Project, "id">) => string;
  updateProject: (id: string, patch: Partial<Project>) => void;
  deleteProject: (id: string) => void;
  addFeature: (f: Omit<Feature, "id">) => string;
  updateFeature: (id: string, patch: Partial<Feature>) => void;
  deleteFeature: (id: string) => void;

  /*  2.4  Mutations : Releases -----------------------------------------  */
  addRelease: (r: Omit<Release, "id">) => string;
  updateRelease: (id: string, patch: Partial<Release>) => void;
  setReleaseStatus: (id: string, status: ReleaseStatus) => void;

  /*  2.5  Mutations : Campagnes & Tests --------------------------------  */
  addCampaign: (c: Omit<Campaign, "id">, cloneFrom?: string) => string;
  updateCampaign: (id: string, patch: Partial<Campaign>) => void;
  deleteCampaign: (id: string) => void;
  addTestCase: (t: Omit<TestCase, "id" | "verdict" | "observed" | "comment" | "evidence"> & { verdict?: Verdict }) => string;
  updateTest: (id: string, patch: Partial<TestCase>) => void;
  deleteTest: (id: string) => void;

  /*  2.6  Mutations : Anomalies & Watch points -------------------------  */
  addDefect: (d: Omit<Defect, "id">) => string;
  updateDefect: (id: string, patch: Partial<Defect>, auditDetail?: string) => void;
  deleteDefect: (id: string) => void;
  addWatchPoint: (w: Omit<WatchPoint, "id" | "createdAt">) => void;
  updateWatchPoint: (id: string, patch: Partial<WatchPoint>) => void;
  deleteWatchPoint: (id: string) => void;

  /*  2.7  Mutations : Exigences & Go Live ------------------------------  */
  addRequirement: (r: Omit<Requirement, "id">) => void;
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
  addUser: (u: Omit<PlatformUser, "id">) => string;
  updateUserRole: (id: string, role: PlatformUser["role"]) => void;
  toggleUserActive: (id: string) => void;
  updateRule: (id: string, patch: Partial<ReferentialRule>) => void;
  deleteRule: (id: string) => void;

  /*  2.9  Audit & Reset ------------------------------------------------  */
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
  ]);

  useEffect(() => {
    saveSession(currentUser);
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

      /* Session / Auth -----------------------------------------------  */
      login: (email, password) => {
        const match = users.find(
          (u) => u.email.toLowerCase() === email.trim().toLowerCase() && u.active,
        );
        if (!match) return { ok: false, error: "Aucun compte actif avec cet e-mail." };
        const expected = match.password ?? "demo";
        if (password !== expected) return { ok: false, error: "Mot de passe invalide." };
        const user = { id: match.id, name: match.name, email: match.email, role: match.role };
        setCurrentUser(user);
        saveSession(user);
        return { ok: true, user };
      },
      logout: () => {
        setCurrentUser(null);
        saveSession(null);
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
        return id;
      },
      updateProduct: (id, patch) =>
        setProducts((prev) =>
          prev.map((p) => (p.id === id ? { ...p, ...patch, lastUpdate: today() } : p)),
        ),
      deleteProduct: (id) => {
        setProducts((prev) => prev.filter((p) => p.id !== id));
        setFeatures((prev) => prev.filter((f) => f.productId !== id));
        setProjects((prev) => prev.filter((p) => p.productId !== id));
        setCampaigns((prev) => prev.filter((c) => c.productId !== id));
        setDefects((prev) => prev.filter((d) => d.productId !== id));
        setRequirements((prev) => prev.filter((r) => r.productId !== id));
        pushAudit(asActor("Système"), "Produit supprimé", id, "—");
      },
      addProject: (p) => {
        const id = `pr-${Date.now()}`;
        setProjects((prev) => [...prev, { ...p, id }]);
        return id;
      },
      updateProject: (id, patch) =>
        setProjects((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p))),
      deleteProject: (id) => {
        setProjects((prev) => prev.filter((p) => p.id !== id));
        setCampaigns((prev) => prev.filter((c) => c.projectId !== id));
        setReleases((prev) => prev.filter((r) => r.projectId !== id));
        pushAudit(asActor("Système"), "Projet supprimé", id, "—");
      },
      addFeature: (f) => {
        const id = `f-${Date.now()}`;
        setFeatures((prev) => [...prev, { ...f, id }]);
        return id;
      },
      updateFeature: (id, patch) =>
        setFeatures((prev) => prev.map((f) => (f.id === id ? { ...f, ...patch } : f))),
      deleteFeature: (id) => {
        setFeatures((prev) => prev.filter((f) => f.id !== id));
        setTests((prev) => prev.filter((t) => t.featureId !== id));
        setDefects((prev) => prev.filter((d) => d.featureId !== id));
      },

      /* Releases -----------------------------------------------------  */
      addRelease: (r) => {
        const id = `rel-${Date.now()}`;
        setReleases((prev) => [...prev, { ...r, id }]);
        return id;
      },
      updateRelease: (id, patch) =>
        setReleases((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r))),
      setReleaseStatus: (id, status) => {
        setReleases((prev) =>
          prev.map((r) => (r.id === id ? { ...r, status } : r)),
        );
        pushAudit(asActor("Système"), "Statut Release", id, `→ ${status}`);
      },

      /* Campagnes & Tests --------------------------------------------  */
      addCampaign: (c, cloneFrom) => {
        const id = `c-${Date.now()}`;
        setCampaigns((prev) => [...prev, { ...c, id }]);
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
      updateCampaign: (id, patch) =>
        setCampaigns((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c))),
      deleteCampaign: (id) => {
        setCampaigns((prev) => prev.filter((c) => c.id !== id));
        setTests((prev) => prev.filter((t) => t.campaignId !== id));
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
            observed: "",
            comment: "",
            evidence: [],
          },
        ]);
        pushAudit(asActor(t.tester ?? "Système"), "Cas de test créé", id, t.name);
        return id;
      },
      updateTest: (id, patch) => {
        setTests((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)));
        if (patch.verdict) {
          pushAudit(asActor(patch.tester ?? "Système"), "Verdict enregistré", id, patch.verdict);
        }
      },
      deleteTest: (id) => {
        setTests((prev) => prev.filter((t) => t.id !== id));
        pushAudit(asActor("Système"), "Cas de test supprimé", id, "—");
      },

      /* Anomalies & Watch points -------------------------------------  */
      addDefect: (d) => {
        const id = `ANO-${2852 + defects.length}`;
        setDefects((prev) => [...prev, { ...d, id }]);
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
      },
      addWatchPoint: (w) => {
        const id = `WP-${String(watchPoints.length + 1).padStart(2, "0")}-${Date.now() % 1000}`;
        setWatchPoints((prev) => [{ ...w, id, createdAt: today() }, ...prev]);
        pushAudit(asActor(w.owner), "Point à surveiller créé", id, w.title);
      },
      updateWatchPoint: (id, patch) =>
        setWatchPoints((prev) => prev.map((w) => (w.id === id ? { ...w, ...patch } : w))),
      deleteDefect: (id) => {
        setDefects((prev) => prev.filter((d) => d.id !== id));
        pushAudit(asActor("Système"), "Anomalie supprimée", id, "—");
      },
      deleteWatchPoint: (id) => {
        setWatchPoints((prev) => prev.filter((w) => w.id !== id));
        pushAudit(asActor("Système"), "Point à surveiller supprimé", id, "—");
      },

      /* Exigences & Go Live ------------------------------------------  */
      addRequirement: (r) =>
        setRequirements((prev) => [...prev, { ...r, id: `REQ-${100 + prev.length + 1}` }]),
      updateRequirement: (id, patch) =>
        setRequirements((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r))),
      deleteRequirement: (id) => {
        setRequirements((prev) => prev.filter((r) => r.id !== id));
        pushAudit(asActor("Système"), "Exigence supprimée", id, "—");
      },
      toggleChecklistItem: (releaseId, itemId) =>
        setGoLiveChecklist((prev) => ({
          ...prev,
          [releaseId]: (prev[releaseId] ?? []).map((item) =>
            item.id === itemId ? { ...item, checked: !item.checked } : item,
          ),
        })),
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
      updateUserRole: (id, role) => {
        setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, role } : u)));
        pushAudit(asActor("Administrateur"), "Rôle modifié", id, role);
      },
      addUser: (u) => {
        const id = `user-${Date.now()}`;
        setUsers((prev) => [...prev, { id, ...u }]);
        pushAudit(asActor("Administrateur"), "Utilisateur créé", id, u.name);
        return id;
      },
      toggleUserActive: (id) =>
        setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, active: !u.active } : u))),
      updateRule: (id, patch) =>
        setRules((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r))),
      deleteRule: (id) => {
        setRules((prev) => prev.filter((r) => r.id !== id));
        pushAudit(asActor("Système"), "Règle supprimée", id, "—");
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