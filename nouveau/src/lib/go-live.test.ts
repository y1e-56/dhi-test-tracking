import { describe, expect, it } from "vitest";
import type { Campaign, Defect, ReferentialRule } from "@/lib/dhi-data";
import { goLiveCheck, releaseOpenHighDefects } from "@/lib/go-live";

const rules: ReferentialRule[] = [
  {
    id: "RG-9",
    domain: "Go Live",
    label: "Anomalies hautes ouvertes tolérées",
    threshold: "0",
    active: true,
    value: 0,
    unit: "count",
    comparator: "lte",
    mode: "blocking",
  },
  {
    id: "RG-10",
    domain: "Go Live",
    label: "Complétude checklist minimale pour GO",
    threshold: "≥ 85 %",
    active: true,
    value: 85,
    unit: "percent",
    comparator: "gte",
    mode: "warning",
  },
];

describe("goLiveCheck - RG-9 / RG-10", () => {
  it("GO conforme : ni refus ni reserve", () => {
    const c = goLiveCheck("GO", 0, 90, rules);
    expect(c.refused).toEqual([]);
    expect(c.warnings).toEqual([]);
  });

  it("GO avec anomalie haute ouverte : refuse (RG-9 bloquante)", () => {
    expect(goLiveCheck("GO", 1, 100, rules).refused.map((v) => v.id)).toEqual(["RG-9"]);
  });

  it("checklist insuffisante : reserve a confirmer (RG-10 en avertissement)", () => {
    const c = goLiveCheck("GO", 0, 50, rules);
    expect(c.refused).toEqual([]);
    expect(c.warnings[0]).toMatch(/^RG-10/);
  });

  it("GO conditionnel : tout devient reserve ; NO GO jamais freine", () => {
    const c = goLiveCheck("GO_CONDITIONNEL", 2, 50, rules);
    expect(c.refused).toEqual([]);
    expect(c.warnings).toHaveLength(2);
    expect(goLiveCheck("NO_GO", 5, 0, rules).warnings).toEqual([]);
  });
});

describe("releaseOpenHighDefects", () => {
  const campaigns = [
    { id: "c1", productId: "p1", version: "2.0" },
    { id: "c2", productId: "p1", version: "1.0" },
  ] as unknown as Campaign[];
  const defects = [
    { id: "1", campaignId: "c1", severity: "haute", status: "nouvelle" },
    { id: "2", campaignId: "c1", severity: "haute", status: "fermee" },
    { id: "3", campaignId: "c1", severity: "moyenne", status: "nouvelle" },
    { id: "4", campaignId: "c2", severity: "haute", status: "nouvelle" },
  ] as unknown as Defect[];

  it("ne compte que les hautes ouvertes des campagnes de la version", () => {
    expect(releaseOpenHighDefects(defects, campaigns, "p1", "2.0").map((d) => d.id)).toEqual(["1"]);
  });
});

describe("releaseOpenHighDefects - anomalies portant leur version", () => {
  it("compte sans voir la campagne (approbateur) grace au produit et a la version", () => {
    const defects = [
      {
        id: "7",
        campaignId: "c9",
        productId: "p1",
        version: "1.0",
        severity: "haute",
        status: "reouverte",
      },
      {
        id: "8",
        campaignId: "c9",
        productId: "p1",
        version: "0.9",
        severity: "haute",
        status: "nouvelle",
      },
    ] as unknown as Defect[];
    expect(releaseOpenHighDefects(defects, [], "p1", "1.0").map((d) => d.id)).toEqual(["7"]);
  });
});
