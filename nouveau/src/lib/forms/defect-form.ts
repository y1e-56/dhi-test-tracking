import { z } from "zod";
import {
  api,
  backendIdOf,
  mapBackendAnomaly,
  toBackendSeverity,
  uploadEvidence,
  type BackendAnomaly,
} from "@/lib/api";
import { SEVERITY_LABEL, canReportDefect, type Severity } from "@/lib/dhi-data";
import type { EntityFormSchema, FormRunContext } from "./types";
import { campaignDevelopers } from "@/lib/access";
import { defaultCorrectionDate } from "@/lib/rules";

export type DefectFormValues = {
  title: string;
  description: string;
  severity: Severity;
  priority: Severity;
  productId: string;
  campaignId: string;
  featureId: string;
  testId: string;
  /** Développeur affecté : un membre de l'équipe développeurs de la campagne. */
  developer: string;
  proofFiles: File[];
};

/**
 * Produit d'une campagne : une anomalie appartient au produit de sa campagne,
 * il n'est donc jamais saisi a part (sinon liste vide pour un testeur, qui
 * n'est membre que de la campagne, et risque d'incoherence produit/campagne).
 */
const productIdOf = (store: FormRunContext<DefectFormValues>["store"], campaignId: string) =>
  store.campaigns.find((c) => c.id === campaignId)?.productId ?? "";

/**
 * Cas de test d'une campagne sur lesquels une anomalie peut etre declaree :
 * seulement ceux dont le verdict est en echec ou bloque.
 */
const reportableTestsOf = (store: FormRunContext<DefectFormValues>["store"], campaignId: string) =>
  store.tests.filter((tc) => tc.campaignId === campaignId && canReportDefect(tc.verdict));

/** Développeurs de l'équipe de la campagne, seuls affectables. */
const devsOf = (store: FormRunContext<DefectFormValues>["store"], campaignId: string) =>
  campaignDevelopers(
    store.campaigns.find((c) => c.id === campaignId),
    store.users,
  );

/**
 * Formulaire d'anomalie (creation seule) : le signalement exige une
 * justification (captures) des qu'il part en base — sans elle, l'anomalie ne
 * serait pas rattachee a la preuve qui guide le developpeur. Hors base, les
 * captures ne peuvent pas etre persistees : on refuse d'en garder.
 */
export const defectForm: EntityFormSchema<DefectFormValues> = {
  title: (ctx) => ctx.t("pages.anomalies.new_anomaly_page"),
  subtitle: (ctx) => ctx.t("pages.anomalies.subtitle"),
  submitLabel: (ctx) => ctx.t("pages.anomalies.create_anomaly"),
  successMessage: (ctx, saved) => ctx.t("pages.anomalies.created_msg").replace("{id}", saved ?? ""),

  fields: (ctx) => [
    {
      name: "title",
      type: "text",
      label: (c) => c.t("pages.anomalies.defect_title"),
      placeholder: (c) => c.t("pages.anomalies.title_placeholder"),
    },
    {
      name: "description",
      type: "textarea",
      rows: 3,
      label: (c) => c.t("common.description"),
    },
    {
      name: "productId",
      type: "select",
      width: "half",
      label: (c) => c.t("common.produit"),
      // Deduit de la campagne choisie : affiche pour information seulement.
      options: (c) =>
        c.store.products
          .filter((p) => p.id === productIdOf(c.store, c.values.campaignId))
          .map((p) => ({ value: p.id, label: p.name })),
      disabled: () => true,
    },
    {
      name: "featureId",
      type: "select",
      width: "half",
      label: (c) => c.t("common.fonctionnalite"),
      options: (c) => c.store.features.map((f) => ({ value: f.id, label: f.name })),
      // Deduite du cas de test choisi : la modifier creerait une incoherence.
      disabled: (c) => c.values.testId !== "",
    },
    {
      name: "campaignId",
      type: "select",
      width: "half",
      label: (c) => c.t("common.campagne"),
      options: (c) =>
        c.store.campaigns
          .filter((campaign) => campaign.status === "encours")
          .map((campaign) => ({ value: campaign.id, label: campaign.name })),
      onChange: ({ value, ctx: run, setValue }) => {
        setValue("productId", productIdOf(run.store, String(value)));
        setValue("testId", "");
        // Le développeur doit appartenir à la nouvelle campagne.
        setValue("developer", devsOf(run.store, String(value))[0] ?? "");
      },
    },
    {
      // Une anomalie nait d'un cas de test non valide : le choix est
      // obligatoire et limite aux cas en echec ou bloques de la campagne.
      name: "testId",
      type: "select",
      label: (c) => c.t("pages.anomalies.test_case"),
      options: (c) =>
        reportableTestsOf(c.store, c.values.campaignId).map((tc) => ({
          value: tc.id,
          label: `${tc.id} — ${tc.name}`,
        })),
      helpText: (c) =>
        reportableTestsOf(c.store, c.values.campaignId).length === 0
          ? c.t("pages.anomalies.no_failed_test")
          : undefined,
      onChange: ({ value, ctx: run, setValue }) => {
        const picked = run.store.tests.find((tc) => tc.id === value);
        if (picked) setValue("featureId", picked.featureId);
      },
    },
    {
      name: "severity",
      type: "select",
      width: "half",
      label: (c) => c.t("pages.anomalies.severity"),
      options: () =>
        (Object.keys(SEVERITY_LABEL) as Severity[]).map((s) => ({
          value: s,
          label: SEVERITY_LABEL[s],
        })),
    },
    {
      name: "priority",
      type: "select",
      width: "half",
      label: (c) => c.t("pages.anomalies.priority"),
      options: () =>
        (Object.keys(SEVERITY_LABEL) as Severity[]).map((s) => ({
          value: s,
          label: SEVERITY_LABEL[s],
        })),
    },
    {
      name: "developer",
      type: "select",
      label: (c) => c.t("pages.anomalies.developer"),
      options: (c) =>
        devsOf(c.store, c.values.campaignId).map((name) => ({ value: name, label: name })),
      helpText: (c) =>
        devsOf(c.store, c.values.campaignId).length === 0
          ? c.t("pages.anomalies.no_campaign_dev")
          : undefined,
    },
    {
      name: "proofFiles",
      type: "files",
      label: (c) => c.t("pages.anomalies.evidence_section"),
      helpText: (c) => c.t("pages.anomalies.captures_hint"),
      fileLabels: (c) => ({
        add: c.t("pages.anomalies.add_capture"),
        count: c.t("pages.anomalies.captures_count"),
        remove: c.t("pages.anomalies.remove_capture"),
        imageOnly: c.t("pages.anomalies.images_only"),
        nonImageIgnored: c.t("pages.anomalies.non_image_ignored"),
        tooBig: c.t("pages.anomalies.capture_too_big"),
        maxReached: c.t("pages.anomalies.max_captures"),
      }),
    },
  ],

  validation: () =>
    z.object({
      title: z.string().trim().min(1, "pages.anomalies.title_required"),
      description: z.string(),
      severity: z.enum(["haute", "moyenne", "basse"]),
      priority: z.enum(["haute", "moyenne", "basse"]),
      productId: z.string(),
      campaignId: z.string(),
      featureId: z.string(),
      testId: z.string().min(1, "pages.anomalies.test_required"),
      developer: z.string(),
      proofFiles: z.custom<File[]>((v) => Array.isArray(v)),
    }),

  defaults: ({ ctx }) => {
    const { store } = ctx;
    const currentUser = store.currentUser;
    // Part du premier cas en echec ou bloque d'une campagne en cours : la
    // campagne et la fonctionnalite en decoulent.
    const firstReportable = store.tests.find(
      (tc) =>
        canReportDefect(tc.verdict) &&
        store.campaigns.some((c) => c.id === tc.campaignId && c.status === "encours"),
    );
    const campaignId = firstReportable?.campaignId ?? store.campaigns[0]?.id ?? "";
    const devs = devsOf(store, campaignId);
    return {
      title: "",
      description: "",
      severity: "moyenne",
      priority: "moyenne",
      productId: productIdOf(store, firstReportable?.campaignId ?? store.campaigns[0]?.id ?? ""),
      // La campagne initiale vient de la liste complete (parite de la page
      // d'origine) : un filtre « en cours » ne retire que les options.
      campaignId: firstReportable?.campaignId ?? store.campaigns[0]?.id ?? "",
      featureId: firstReportable?.featureId ?? store.features[0]?.id ?? "",
      testId: firstReportable?.id ?? "",
      developer:
        currentUser?.name && devs.includes(currentUser.name) ? currentUser.name : (devs[0] ?? ""),
      proofFiles: [],
    };
  },

  save: async ({ values, online, store, t }) => {
    const testCase = store.tests.find((tc) => tc.id === values.testId);
    if (!testCase || !canReportDefect(testCase.verdict)) {
      throw new Error(t("pages.anomalies.test_not_failed"));
    }
    const productId = productIdOf(store, values.campaignId) || values.productId;
    const base = {
      productId,
      campaignId: values.campaignId,
      title: values.title.trim(),
      description: values.description,
      severity: values.severity,
      priority: values.priority,
      status: "nouvelle" as const,
      featureId: values.featureId,
      testId: values.testId,
      version: "4.12",
      reporter: store.currentUser?.name ?? "Marie Martin",
      assignee: values.developer,
      developer: values.developer,
      createdAt: new Date().toISOString().slice(0, 10),
      // RG-8 : delai de correction des anomalies hautes (7 jours sinon).
      targetDate: defaultCorrectionDate(values.severity, store.rules),
    };

    const numericFeatureId = Number(values.featureId);
    const numericCampaignId = Number(values.campaignId);
    const numericTestId = Number(values.testId);
    const reporterBackend = store.users.find((u) => u.active && u.name === base.reporter);
    const assigneeBackend = store.users.find((u) => u.active && u.name === values.developer);
    const eligibleForBackend =
      online &&
      Number.isInteger(numericFeatureId) &&
      numericFeatureId > 0 &&
      Number.isInteger(numericCampaignId) &&
      numericCampaignId > 0 &&
      Number.isInteger(numericTestId) &&
      numericTestId > 0;

    if (eligibleForBackend) {
      if (values.proofFiles.length === 0) {
        throw new Error(t("pages.anomalies.report_requires_captures"));
      }
      const { anomaly } = await api<{ anomaly: BackendAnomaly }>("/anomalies", {
        method: "POST",
        body: JSON.stringify({
          feature_id: numericFeatureId,
          campaign_id: numericCampaignId,
          test_case_id: numericTestId,
          description: base.title,
          correction_due_date: base.targetDate,
          severity: toBackendSeverity(values.severity),
          priority: toBackendSeverity(values.priority),
          reported_by: backendIdOf(reporterBackend?.id),
          assigned_to: backendIdOf(assigneeBackend?.id),
        }),
      });

      const results = await Promise.allSettled(
        values.proofFiles.map((file) =>
          uploadEvidence(
            "anomaly",
            String(anomaly.id),
            file,
            JSON.stringify({ name: file.name, type: "capture" }),
          ),
        ),
      );
      const failed = results.filter((r) => r.status === "rejected").length;
      if (failed > 0) {
        console.error(
          `[DHI] ${failed}/${values.proofFiles.length} capture(s) d'anomalie non enregistree(s)`,
        );
      }

      const mapped = mapBackendAnomaly(anomaly);
      store.addDefect({ ...mapped, productId: mapped.productId || productId });
      return `ANO-${anomaly.id}`;
    }

    // Hors base (local/demo) : sans connexion, impossible de persister les
    // captures, on refuse donc d'en garder dans le formulaire.
    if (values.proofFiles.length > 0) {
      throw new Error(t("pages.anomalies.login_required_for_captures"));
    }

    return store.addDefect(base);
  },
};
