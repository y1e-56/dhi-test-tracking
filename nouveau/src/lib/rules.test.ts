import { describe, expect, it } from "vitest";
import type { ReferentialRule } from "@/lib/dhi-data";
import {
  defaultCorrectionDate,
  evaluateRule,
  formatThreshold,
  isCorrectionOverdue,
  thresholdLabel,
} from "@/lib/rules";

const rule = (over: Partial<ReferentialRule> = {}): ReferentialRule => ({
  id: "RG-4",
  domain: "Campagne",
  label: "Taux d'exécution minimal avant clôture",
  threshold: "≥ 95 %",
  active: true,
  value: 95,
  unit: "percent",
  comparator: "gte",
  mode: "warning",
  ...over,
});

describe("rules (miroir du moteur serveur)", () => {
  it("formate les seuils comme le serveur", () => {
    expect(formatThreshold({ value: 95, unit: "percent", comparator: "gte" })).toBe("≥ 95 %");
    expect(formatThreshold({ value: 7, unit: "days", comparator: "lte" })).toBe("≤ 7 jours");
    expect(formatThreshold({ value: 85, unit: "score", comparator: "gte" })).toBe("≥ 85/100");
    expect(formatThreshold({ value: 0, unit: "count", comparator: "lte" })).toBe("≤ 0");
  });

  it("retombe sur le texte historique sans seuil structuré", () => {
    expect(thresholdLabel(rule({ value: null, threshold: "100 %, types obligatoires" }))).toBe(
      "100 %, types obligatoires",
    );
  });

  it("évalue une valeur mesurée et produit le même message que le serveur", () => {
    const v = evaluateRule(rule(), 67)!;
    expect(v.ok).toBe(false);
    expect(v.message).toBe("RG-4 — Taux d'exécution minimal avant clôture : 67 % (attendu ≥ 95 %)");
    expect(evaluateRule(rule(), 95)!.ok).toBe(true);
    expect(evaluateRule(rule({ comparator: "lte", value: 0, unit: "count" }), 1)!.ok).toBe(false);
  });

  it("ignore une règle inactive ou sans seuil", () => {
    expect(evaluateRule(rule({ active: false }), 1)).toBeNull();
    expect(evaluateRule(rule({ value: null }), 1)).toBeNull();
    expect(evaluateRule(undefined, 1)).toBeNull();
  });
});

describe("RG-8 - delai de correction des anomalies hautes", () => {
  const today = new Date("2026-10-01T09:00:00Z");
  const rg8 = rule({ id: "RG-8", value: 3, unit: "days", comparator: "lte" });

  it("propose creation + RG-8 jours pour une gravite haute, 7 jours sinon", () => {
    expect(defaultCorrectionDate("haute", [rg8], today)).toBe("2026-10-04");
    expect(defaultCorrectionDate("moyenne", [rg8], today)).toBe("2026-10-08");
    expect(defaultCorrectionDate("haute", [{ ...rg8, active: false }], today)).toBe("2026-10-08");
  });

  it("signale une anomalie haute non fermee dont l'echeance est depassee", () => {
    const d = { severity: "haute", status: "ouverte", targetDate: "2026-09-30" };
    expect(isCorrectionOverdue(d, today)).toBe(true);
    expect(isCorrectionOverdue({ ...d, targetDate: "2026-10-01" }, today)).toBe(false);
    expect(isCorrectionOverdue({ ...d, status: "fermee" }, today)).toBe(false);
    expect(isCorrectionOverdue({ ...d, severity: "moyenne" }, today)).toBe(false);
  });
});
