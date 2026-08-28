import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
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
  GOLIVE_CHECKLIST_TEMPLATE,
  type Alert,
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
  type Requirement,
  type TestCase,
  type Verdict,
  type WatchPoint,
} from "./dhi-data";

interface Store {
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
  audit: AuditEntry[];
  rules: ReferentialRule[];
  users: PlatformUser[];
  addProduct: (p: Omit<Product, "id" | "breakdown" | "lastUpdate">) => void;
  addFeature: (f: Omit<Feature, "id">) => void;
  updateFeature: (id: string, patch: Partial<Feature>) => void;
  addCampaign: (c: Omit<Campaign, "id">, cloneFrom?: string) => string;
  updateCampaign: (id: string, patch: Partial<Campaign>) => void;
  updateTest: (id: string, patch: Partial<TestCase>) => void;
  addDefect: (d: Omit<Defect, "id">) => string;
  updateDefect: (id: string, patch: Partial<Defect>, auditDetail?: string) => void;
  addWatchPoint: (w: Omit<WatchPoint, "id" | "createdAt">) => void;
  updateWatchPoint: (id: string, patch: Partial<WatchPoint>) => void;
  addRequirement: (r: Omit<Requirement, "id">) => void;
  updateRequirement: (id: string, patch: Partial<Requirement>) => void;
  toggleChecklistItem: (releaseId: string, itemId: string) => void;
  addGoLiveDecision: (
    releaseId: string,
    verdict: GoLiveVerdict,
    decider: string,
    justification: string,
  ) => void;
  markAlertRead: (id: string) => void;
  markAllAlertsRead: () => void;
  updateUserRole: (id: string, role: PlatformUser["role"]) => void;
  toggleUserActive: (id: string) => void;
  updateRule: (id: string, patch: Partial<ReferentialRule>) => void;
  logAudit: (actor: string, action: string, entity: string, detail: string) => void;
}

const StoreContext = createContext<Store | null>(null);

const today = () => new Date().toISOString().slice(0, 10);
const now = () => new Date().toISOString().slice(0, 16).replace("T", " ");

export function DhiStoreProvider({ children }: { children: ReactNode }) {
  const [products, setProducts] = useState<Product[]>(seedProducts);
  const [features, setFeatures] = useState<Feature[]>(seedFeatures);
  const [campaigns, setCampaigns] = useState<Campaign[]>(seedCampaigns);
  const [tests, setTests] = useState<TestCase[]>(seedTests);
  const [defects, setDefects] = useState<Defect[]>(seedDefects);
  const [projects] = useState<Project[]>(seedProjects);
  const [releases] = useState<Release[]>(seedReleases);
  const [requirements, setRequirements] = useState<Requirement[]>(seedRequirements);
  const [watchPoints, setWatchPoints] = useState<WatchPoint[]>(seedWatchPoints);
  const [goLiveDecisions, setGoLiveDecisions] = useState<GoLiveDecision[]>(seedGoLive);
  const [goLiveChecklist, setGoLiveChecklist] = useState<Record<string, GoLiveChecklistItem[]>>(
    () => {
      const initial: Record<string, GoLiveChecklistItem[]> = {};
      for (const r of seedReleases) {
        initial[r.id] = GOLIVE_CHECKLIST_TEMPLATE.map((item, i) => ({
          ...item,
          // Pré-remplissage réaliste : release 4.12 en cours, 4.11 complétée
          checked: r.id === "rel-411" ? true : r.id === "rel-412" ? i < 5 : false,
        }));
      }
      return initial;
    },
  );
  const [alerts, setAlerts] = useState<Alert[]>(seedAlerts);
  const [audit, setAudit] = useState<AuditEntry[]>(seedAudit);
  const [rules, setRules] = useState<ReferentialRule[]>(seedRules);
  const [users, setUsers] = useState<PlatformUser[]>(seedUsers);

  const value = useMemo<Store>(() => {
    const pushAudit = (actor: string, action: string, entity: string, detail: string) =>
      setAudit((prev) => [
        { id: `AU-${Date.now()}`, actor, action, entity, detail, at: now() },
        ...prev,
      ]);

    return {
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
      audit,
      rules,
      users,
      addProduct: (p) =>
        setProducts((prev) => [
          ...prev,
          {
            ...p,
            id: `p-${Date.now()}`,
            lastUpdate: today(),
            breakdown: {
              results: p.score,
              coverage: p.score,
              critical: p.score,
              incidents: p.score,
              nonFunctional: p.score,
            },
          },
        ]),
      addFeature: (f) => setFeatures((prev) => [...prev, { ...f, id: `f-${Date.now()}` }]),
      updateFeature: (id, patch) =>
        setFeatures((prev) => prev.map((f) => (f.id === id ? { ...f, ...patch } : f))),
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
        pushAudit(c.owner, "Campagne créée", id, cloneFrom ? `Tests clonés depuis ${cloneFrom}` : c.name);
        return id;
      },
      updateCampaign: (id, patch) =>
        setCampaigns((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c))),
      updateTest: (id, patch) => {
        setTests((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)));
        if (patch.verdict) {
          pushAudit(patch.tester ?? "Système", "Verdict enregistré", id, patch.verdict);
        }
      },
      addDefect: (d) => {
        const id = `ANO-${2852 + defects.length}`;
        setDefects((prev) => [...prev, { ...d, id }]);
        pushAudit(d.reporter, "Anomalie créée", id, d.title);
        return id;
      },
      updateDefect: (id, patch, auditDetail) => {
        setDefects((prev) => {
          const before = prev.find((x) => x.id === id);
          if (before && patch.status && patch.status !== before.status) {
            pushAudit(
              patch.assignee ?? before.assignee,
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
        pushAudit(w.owner, "Point à surveiller créé", id, w.title);
      },
      updateWatchPoint: (id, patch) =>
        setWatchPoints((prev) => prev.map((w) => (w.id === id ? { ...w, ...patch } : w))),
      addRequirement: (r) =>
        setRequirements((prev) => [
          ...prev,
          { ...r, id: `REQ-${100 + prev.length + 1}` },
        ]),
      updateRequirement: (id, patch) =>
        setRequirements((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r))),
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
      markAlertRead: (id) =>
        setAlerts((prev) => prev.map((a) => (a.id === id ? { ...a, read: true } : a))),
      markAllAlertsRead: () => setAlerts((prev) => prev.map((a) => ({ ...a, read: true }))),
      updateUserRole: (id, role) => {
        setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, role } : u)));
        pushAudit("Administrateur", "Rôle modifié", id, role);
      },
      toggleUserActive: (id) =>
        setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, active: !u.active } : u))),
      updateRule: (id, patch) =>
        setRules((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r))),
      logAudit: pushAudit,
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
    audit,
    rules,
    users,
  ]);

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used inside DhiStoreProvider");
  return ctx;
}

/** Statistiques d'une campagne dérivées de ses tests. */
export function campaignStats(tests: TestCase[], campaignId: string) {
  const list = tests.filter((t) => t.campaignId === campaignId);
  const total = list.length;
  const notRun = list.filter((t) => t.verdict === "NOT_RUN").length;
  const notApplicable = list.filter((t) => t.verdict === "NOT_APPLICABLE").length;
  const failed = list.filter((t) => t.verdict === "FAIL").length;
  const blocked = list.filter((t) => t.verdict === "BLOCKED").length;
  const passedWithReservation = list.filter(
    (t) => t.verdict === "PASS_WITH_RESERVATION",
  ).length;
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

export function productScore(p: Product) {
  const b = p.breakdown;
  return Math.round(
    b.results * 0.3 + b.coverage * 0.25 + b.critical * 0.2 + b.incidents * 0.15 + b.nonFunctional * 0.1,
  );
}

export function productHealth(p: Product) {
  return healthOf(productScore(p));
}
