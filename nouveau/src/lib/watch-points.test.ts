import { describe, expect, it } from "vitest";
import type { WatchPoint } from "@/lib/dhi-data";
import { filterWatchPoints, hasActiveFilters, sortWatchPoints } from "@/lib/watch-points";

const wp = (over: Partial<WatchPoint>): WatchPoint => ({
  id: "1",
  productId: "p1",
  title: "Point",
  description: "",
  level: "info",
  status: "ouvert",
  owner: "Claire",
  createdAt: "2026-10-01",
  ...over,
});
const points = [
  wp({
    id: "a",
    title: "Latence du webhook",
    level: "vigilance",
    owner: "Claire",
    createdAt: "2026-10-02",
  }),
  wp({
    id: "b",
    title: "Pic de charge",
    description: "Trafic x5 au lancement",
    level: "critique",
    productId: "p2",
    owner: "Tom",
  }),
  wp({
    id: "c",
    title: "Libellés",
    level: "info",
    owner: "Claire",
    featureId: "f1",
    createdAt: "2026-10-03",
  }),
  wp({
    id: "d",
    title: "Sécurité 3DS",
    level: "critique",
    owner: "Claire",
    createdAt: "2026-10-05",
  }),
];
const ctx = {
  productName: (id: string) => (id === "p2" ? "Paiement" : "Catalogue"),
  featureName: (id: string | undefined) => (id === "f1" ? "Recherche produit" : ""),
  me: "Claire",
};
const ids = (list: WatchPoint[]) => list.map((w) => w.id);

describe("filterWatchPoints", () => {
  it("recherche dans titre, description, produit et fonctionnalite, sans accents", () => {
    expect(ids(filterWatchPoints(points, { q: "trafic" }, ctx))).toEqual(["b"]);
    expect(ids(filterWatchPoints(points, { q: "paiement" }, ctx))).toEqual(["b"]);
    expect(ids(filterWatchPoints(points, { q: "securite" }, ctx))).toEqual(["d"]);
    expect(ids(filterWatchPoints(points, { q: "recherche produit" }, ctx))).toEqual(["c"]);
  });

  it("filtre par produit, criticite, responsable et mes points", () => {
    expect(ids(filterWatchPoints(points, { produit: "p2" }, ctx))).toEqual(["b"]);
    expect(ids(filterWatchPoints(points, { niveau: "critique" }, ctx))).toEqual(["b", "d"]);
    expect(ids(filterWatchPoints(points, { responsable: "Tom" }, ctx))).toEqual(["b"]);
    expect(ids(filterWatchPoints(points, { mine: true, niveau: "critique" }, ctx))).toEqual(["d"]);
  });

  it("signale les filtres actifs", () => {
    expect(hasActiveFilters({})).toBe(false);
    expect(hasActiveFilters({ q: "  " })).toBe(false);
    expect(hasActiveFilters({ niveau: "critique" })).toBe(true);
  });
});

describe("sortWatchPoints", () => {
  it("critique d abord, puis les plus recents", () => {
    expect(ids(sortWatchPoints(points))).toEqual(["d", "b", "a", "c"]);
  });
});
