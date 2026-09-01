import { useMemo } from "react";
import {
  getUser,
  visibleProducts,
  visibleProjects,
  visibleCampaigns,
} from "@/lib/access";
import type { Campaign, Product, Project } from "@/lib/dhi-data";

export function useVisibleProducts(products: Product[]): Product[] {
  return useMemo(() => visibleProducts(products, getUser()), [products]);
}

export function useVisibleProductIds(products: Product[]): Set<string> {
  const visible = useVisibleProducts(products);
  return useMemo(() => new Set(visible.map((p) => p.id)), [visible]);
}

export function useVisibleProjects(
  projects: Project[],
  products: Product[],
): Project[] {
  return useMemo(() => visibleProjects(projects, products, getUser()), [projects, products]);
}

export function useVisibleCampaigns(
  campaigns: Campaign[],
  products: Product[],
): Campaign[] {
  return useMemo(() => visibleCampaigns(campaigns, products, getUser()), [campaigns, products]);
}
