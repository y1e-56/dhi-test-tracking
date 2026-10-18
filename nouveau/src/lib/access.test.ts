import { describe, expect, it } from "vitest";
import type { Campaign, Defect } from "@/lib/dhi-data";
import type { SessionUser } from "@/lib/dhi-store";
import { visibleDefects } from "@/lib/access";

const user = (name: string, role: string) =>
  ({ name, role, roles: [role] }) as unknown as SessionUser;
const campaigns = [
  { id: "c1", productId: "p1", owner: "Owner", testLeads: ["Chef"], testers: ["Testeur"] },
  { id: "c2", productId: "p1", owner: "Autre", testLeads: [], testers: [] },
] as unknown as Campaign[];
const defects = [
  { id: "1", campaignId: "c1", reporter: "Testeur" },
  { id: "2", campaignId: "c1", reporter: "Quelqu'un" },
  { id: "3", campaignId: "c2", reporter: "Quelqu'un" },
] as unknown as Defect[];
const ids = (u: SessionUser) => visibleDefects(defects, u, campaigns, []).map((d) => d.id);

describe("visibleDefects", () => {
  it("le chef testeur voit toutes les anomalies de ses campagnes, pas les autres", () => {
    expect(ids(user("Chef", "chef_testeur"))).toEqual(["1", "2"]);
  });

  it("le responsable de la campagne voit ses anomalies", () => {
    expect(ids(user("Owner", "chef_projet"))).toEqual(["1", "2"]);
  });

  it("le testeur ne voit que ce qu'il a declare ou ce qui lui est confie", () => {
    expect(ids(user("Testeur", "testeur"))).toEqual(["1"]);
  });

  it("un role qualite voit tout", () => {
    expect(ids(user("Admin", "admin"))).toEqual(["1", "2", "3"]);
  });
});
