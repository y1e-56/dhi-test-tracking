import { beforeEach, describe, expect, it, vi } from "vitest";
import { api, uploadEvidence } from "@/lib/api";
import { SEVERITY_LABEL } from "@/lib/dhi-data";
import { defectForm, type DefectFormValues } from "./defect-form";
import type { FormMode, FormRunContext, Store } from "./types";

vi.mock("@/lib/api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/api")>();
  return {
    ...actual,
    api: vi.fn(),
    uploadEvidence: vi.fn(),
    mapBackendAnomaly: (anomaly: { id: number }) => ({
      id: String(anomaly.id),
      productId: "",
      title: "Anomalie remontee",
    }),
  };
});

const t = (key: string) => key;

function fakeStore(overrides: Record<string, unknown> = {}) {
  return {
    rules: [],
    products: [
      { id: "42", name: "Ancien" },
      { id: "77", name: "Nouveau" },
    ],
    features: [
      { id: "f1", productId: "42", name: "Connexion" },
      { id: "55", productId: "77", name: "Export" },
    ],
    users: [
      { id: "7", name: "Alice", active: true, role: "qa" },
      { id: "5", name: "Dan", active: true, role: "developpeur", roles: ["developpeur"] },
      { id: "9", name: "Bob", active: false, role: "developpeur" },
    ],
    campaigns: [
      { id: "88", name: "Campagne terminee", status: "terminee", productId: "42" },
      {
        id: "77",
        name: "Campagne en cours",
        status: "encours",
        productId: "77",
        developers: ["Dan", "Bob"],
      },
    ],
    tests: [
      { id: "301", campaignId: "77", featureId: "55", name: "Export paysage", verdict: "FAIL" },
      { id: "302", campaignId: "77", featureId: "55", name: "Export portrait", verdict: "PASS" },
      { id: "303", campaignId: "77", featureId: "f1", name: "Connexion SSO", verdict: "BLOCKED" },
      { id: "304", campaignId: "88", featureId: "f1", name: "Ancien cas", verdict: "FAIL" },
    ],
    currentUser: { name: "Alice", role: "qa" },
    defects: [{ id: "w1" }],
    addDefect: vi.fn((_d: Record<string, unknown>) => "ANO-77"),
    ...overrides,
  };
}

const values: DefectFormValues = {
  title: "  Export crash  ",
  description: "Paysage",
  severity: "haute",
  priority: "moyenne",
  productId: "42",
  campaignId: "77",
  featureId: "55",
  testId: "301",
  developer: "Dan",
  proofFiles: [],
};

const ctx = (
  mode: FormMode = "create",
  store = fakeStore(),
  formValues: DefectFormValues = values,
): FormRunContext<DefectFormValues, undefined> => ({
  mode,
  t,
  store: store as unknown as Store,
  values: formValues,
});

const initCtx = (store = fakeStore()) => ({
  mode: "create" as FormMode,
  t,
  store: store as unknown as Store,
});

beforeEach(() => {
  vi.clearAllMocks();
});

describe("defectForm.validation", () => {
  it("rejette le titre vide avec la cle du domaine", () => {
    const result = defectForm.validation(ctx()).safeParse({ ...values, title: "   " });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]).toMatchObject({
        path: ["title"],
        message: "pages.anomalies.title_required",
      });
    }
  });

  it("exige un cas de test", () => {
    const result = defectForm.validation(ctx()).safeParse({ ...values, testId: "" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]).toMatchObject({
        path: ["testId"],
        message: "pages.anomalies.test_required",
      });
    }
  });

  it("accepte un formulaire valide et rogne le titre", () => {
    const result = defectForm.validation(ctx()).safeParse(values);
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.title).toBe("Export crash");
  });
});

describe("defectForm adaptation au contexte", () => {
  it("propose toutes les fonctionnalites (parite : la page ne filtrait pas)", () => {
    const store = fakeStore();
    const field = defectForm.fields(ctx("create", store)).find((f) => f.name === "featureId");
    expect(field?.options?.(ctx("create", store))).toEqual([
      { value: "f1", label: "Connexion" },
      { value: "55", label: "Export" },
    ]);
  });

  it("deduit le produit de la campagne, sans saisie", () => {
    const store = fakeStore();
    const field = defectForm.fields(ctx("create", store)).find((f) => f.name === "productId");
    expect(field?.disabled?.(ctx("create", store))).toBe(true);
    expect(field?.options?.(ctx("create", store))).toEqual([{ value: "77", label: "Nouveau" }]);
  });

  it("changer de campagne recale le produit et vide le cas de test", () => {
    const store = fakeStore();
    const field = defectForm.fields(ctx("create", store)).find((f) => f.name === "campaignId");
    const setValue = vi.fn();
    field?.onChange?.({
      value: "88",
      ctx: ctx("create", store),
      setValue,
      getValues: () => values,
    });
    expect(setValue).toHaveBeenCalledWith("productId", "42");
    expect(setValue).toHaveBeenCalledWith("testId", "");
  });

  it("ne propose que les campagnes en cours", () => {
    const store = fakeStore();
    const field = defectForm.fields(ctx("create", store)).find((f) => f.name === "campaignId");
    expect(field?.options?.(ctx("create", store))).toEqual([
      { value: "77", label: "Campagne en cours" },
    ]);
  });

  it("ne propose que les cas en echec ou bloques de la campagne choisie", () => {
    const store = fakeStore();
    const field = defectForm.fields(ctx("create", store)).find((f) => f.name === "testId");
    expect(field?.options?.(ctx("create", store))).toEqual([
      { value: "301", label: "301 — Export paysage" },
      { value: "303", label: "303 — Connexion SSO" },
    ]);
    expect(field?.helpText?.(ctx("create", store))).toBeUndefined();
  });

  it("signale l'absence de cas en echec ou bloque", () => {
    const store = fakeStore({ tests: [] });
    const field = defectForm.fields(ctx("create", store)).find((f) => f.name === "testId");
    expect(field?.options?.(ctx("create", store))).toEqual([]);
    expect(field?.helpText?.(ctx("create", store))).toBe("pages.anomalies.no_failed_test");
  });

  it("deduit la fonctionnalite du cas de test choisi", () => {
    const store = fakeStore();
    const field = defectForm.fields(ctx("create", store)).find((f) => f.name === "testId");
    const setValue = vi.fn();
    field?.onChange?.({
      value: "303",
      ctx: ctx("create", store),
      setValue,
      getValues: () => values,
    });
    expect(setValue).toHaveBeenCalledWith("featureId", "f1");
  });

  it("propose les gravites et seulement les developpeurs actifs de la campagne", () => {
    const store = fakeStore();
    const fields = defectForm.fields(ctx("create", store));
    const severity = fields.find((f) => f.name === "severity");
    expect(severity?.options?.(ctx("create", store))).toEqual([
      { value: "haute", label: SEVERITY_LABEL.haute },
      { value: "moyenne", label: SEVERITY_LABEL.moyenne },
      { value: "basse", label: SEVERITY_LABEL.basse },
    ]);
    expect(fields.some((f) => (f.name as string) === "assignee")).toBe(false);
    const developer = fields.find((f) => f.name === "developer");
    expect(developer?.options?.(ctx("create", store))).toEqual([{ value: "Dan", label: "Dan" }]);
  });

  it("publie les libelles des captures", () => {
    const store = fakeStore();
    const field = defectForm.fields(ctx("create", store)).find((f) => f.name === "proofFiles");
    expect(field?.type).toBe("files");
    expect(field?.fileLabels?.(ctx("create", store))).toMatchObject({
      add: "pages.anomalies.add_capture",
      count: "pages.anomalies.captures_count",
    });
  });

  it("part du premier cas en echec ou bloque d'une campagne en cours", () => {
    const store = fakeStore();
    expect(defectForm.defaults({ ctx: initCtx(store) })).toEqual({
      title: "",
      description: "",
      severity: "moyenne",
      priority: "moyenne",
      productId: "77",
      campaignId: "77",
      featureId: "55",
      testId: "301",
      developer: "Dan",
      proofFiles: [],
    });
  });

  it("separage le developpeur courant quand il est developpeur", () => {
    const store = fakeStore({ currentUser: { name: "Dan", role: "developpeur" } });
    expect(defectForm.defaults({ ctx: initCtx(store) }).developer).toBe("Dan");
  });

  it("publie les cles de la page", () => {
    const store = fakeStore();
    expect(defectForm.title(ctx("create", store))).toBe("pages.anomalies.new_anomaly_page");
    expect(defectForm.submitLabel(ctx("create", store))).toBe("pages.anomalies.create_anomaly");
    const notice = defectForm.successMessage(ctx("create", store), "ANO-9");
    expect(notice).toBe("pages.anomalies.created_msg".replace("{id}", "ANO-9"));
  });
});

describe("defectForm.save", () => {
  it("refuse un cas de test qui n'est ni en echec ni bloque", async () => {
    const store = fakeStore();
    await expect(
      defectForm.save({
        values: { ...values, testId: "302" },
        mode: "create",
        online: false,
        store: store as unknown as Store,
        t,
      }),
    ).rejects.toThrow("pages.anomalies.test_not_failed");
    expect(store.addDefect).not.toHaveBeenCalled();
  });

  it("hors ligne : ecrit le defect local et retourne son id", async () => {
    const store = fakeStore();
    const result = await defectForm.save({
      values,
      mode: "create",
      online: false,
      store: store as unknown as Store,
      t,
    });
    expect(result).toBe("ANO-77");
    expect(store.addDefect).toHaveBeenCalledWith(
      expect.objectContaining({
        productId: "77",
        campaignId: "77",
        title: "Export crash",
        description: "Paysage",
        severity: "haute",
        priority: "moyenne",
        status: "nouvelle",
        featureId: "55",
        version: "4.12",
        reporter: "Alice",
        assignee: "Dan",
        developer: "Dan",
      }),
    );
    expect(api).not.toHaveBeenCalled();
  });

  it("date la cible a sept jours de la creation", async () => {
    const store = fakeStore();
    await defectForm.save({
      values,
      mode: "create",
      online: false,
      store: store as unknown as Store,
      t,
    });
    const base = vi.mocked(store.addDefect).mock.calls[0]?.[0] as {
      createdAt: string;
      targetDate: string;
    };
    const expectedTarget = new Date(Date.parse(base.createdAt) + 7 * 86400_000)
      .toISOString()
      .slice(0, 10);
    expect(base.targetDate).toBe(expectedTarget);
  });

  it("hors base : refuse de garder des captures", async () => {
    const store = fakeStore();
    await expect(
      defectForm.save({
        values: { ...values, proofFiles: [{ name: "shot.png" } as File] },
        mode: "create",
        online: false,
        store: store as unknown as Store,
        t,
      }),
    ).rejects.toThrow("pages.anomalies.login_required_for_captures");
    expect(store.addDefect).not.toHaveBeenCalled();
  });

  it("en ligne eligible sans capture : refuse le signalement", async () => {
    const store = fakeStore();
    await expect(
      defectForm.save({
        values,
        mode: "create",
        online: true,
        store: store as unknown as Store,
        t,
      }),
    ).rejects.toThrow("pages.anomalies.report_requires_captures");
    expect(api).not.toHaveBeenCalled();
    expect(store.addDefect).not.toHaveBeenCalled();
  });

  it("en ligne eligible : POST /anomalies puis upload des captures", async () => {
    vi.mocked(api).mockResolvedValue({ anomaly: { id: 42 } });
    const shot = { name: "shot.png" } as File;
    const store = fakeStore();
    const result = await defectForm.save({
      values: { ...values, proofFiles: [shot] },
      mode: "create",
      online: true,
      store: store as unknown as Store,
      t,
    });
    expect(result).toBe("ANO-42");
    expect(api).toHaveBeenCalledWith("/anomalies", expect.objectContaining({ method: "POST" }));
    const body = JSON.parse(String(vi.mocked(api).mock.calls[0]?.[1]?.body));
    expect(body).toMatchObject({
      feature_id: 55,
      campaign_id: 77,
      test_case_id: 301,
      description: "Export crash",
      reported_by: 7,
      assigned_to: 5, // Dan, développeur de la campagne
    });
    expect(body.correction_due_date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(uploadEvidence).toHaveBeenCalledWith(
      "anomaly",
      "42",
      shot,
      JSON.stringify({ name: "shot.png", type: "capture" }),
    );
    expect(store.addDefect).toHaveBeenCalledWith(
      expect.objectContaining({ id: "42", productId: "77" }),
    );
  });

  it("en ligne avec ids non numeriques : reste local", async () => {
    const store = fakeStore();
    await defectForm.save({
      values: { ...values, featureId: "f1" },
      mode: "create",
      online: true,
      store: store as unknown as Store,
      t,
    });
    expect(api).not.toHaveBeenCalled();
    expect(store.addDefect).toHaveBeenCalled();
  });
});
