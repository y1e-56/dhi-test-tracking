import api from './api';
import { Produit, ReleaseProduit, EnvironnementProduit } from '../types';
import { DEMO_STORAGE_KEYS } from './demoDataService';

interface ProduitBackend {
  id: number | string;
  name: string;
  description: string | null;
  owner_id: number | string | null;
  quality_manager_id: number | string | null;
  is_archived: boolean;
  created_by: number | string | null;
  created_at: string;
  updated_at: string;
  projects_count?: number;
  releases_count?: number;
  environments_count?: number;
}

function mapProduitFromBackend(p: ProduitBackend): Produit {
  return {
    id: String(p.id),
    nom: p.name,
    description: p.description ?? '',
    estArchive: Boolean(p.is_archived),
    ownerId: p.owner_id != null ? String(p.owner_id) : null,
    qualityManagerId: p.quality_manager_id != null ? String(p.quality_manager_id) : null,
    creePar: p.created_by != null ? String(p.created_by) : null,
    dateCreation: p.created_at,
    dateModification: p.updated_at,
    nbProjets: p.projects_count ?? 0,
    nbVersions: p.releases_count ?? 0,
    nbEnvironnements: p.environments_count ?? 0,
  };
}

// ─── Fallback local (mode démo sans backend) ───

function demoLoad<T>(key: string): T[] {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T[]) : [];
  } catch {
    return [];
  }
}

function demoSave<T>(key: string, data: T[]) {
  localStorage.setItem(key, JSON.stringify(data));
}

function uid(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 8);
}

function isoNow(): string {
  return new Date().toISOString();
}

function recomputeCounts(p: Produit): Produit {
  const nbVersions = demoLoad<ReleaseProduit>(DEMO_STORAGE_KEYS.releases).filter(r => r.produitId === p.id).length;
  const nbEnvironnements = demoLoad<EnvironnementProduit>(DEMO_STORAGE_KEYS.environnements).filter(e => e.produitId === p.id).length;
  const nbProjets = demoLoad<any>(DEMO_STORAGE_KEYS.projets).filter(pr => pr.produitId === p.id).length;
  return { ...p, nbProjets, nbVersions, nbEnvironnements };
}

function demoProduits(): Produit[] {
  return demoLoad<Produit>(DEMO_STORAGE_KEYS.produits).map(recomputeCounts);
}

function applyTransitionRelease(r: ReleaseProduit): ReleaseProduit {
  if (r.statut === 'released' && !r.livreeLe) return { ...r, livreeLe: isoNow() };
  if (r.statut !== 'released' && r.livreeLe) return { ...r, livreeLe: null };
  return r;
}

function notFound(): never {
  throw new Error('Ressource introuvable');
}

export const productService = {
  /**
   * Liste les produits avec recherche / filtre / pagination geres cote client.
   * Dispose d'un fallback local (mode démo) lorsque le backend est indisponible.
   */
  async listPaginated(filters: { page?: number; limit?: number; recherche?: string; statut?: 'actif' | 'archive' } = {}): Promise<{ data: Produit[]; pagination: { page: number; limit: number; total: number; totalPages: number } }> {
    let produits: Produit[] = [];
    try {
      const response = await api.get<ProduitBackend[]>('/products');
      produits = response.data.map(mapProduitFromBackend);
    } catch {
      produits = [];
    }
    if (produits.length === 0) produits = demoProduits();

    if (filters.statut === 'actif') produits = produits.filter(p => !p.estArchive);
    else if (filters.statut === 'archive') produits = produits.filter(p => p.estArchive);

    if (filters.recherche) {
      const q = filters.recherche.toLowerCase();
      produits = produits.filter(p =>
        p.nom.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q)
      );
    }

    const limit = filters.limit ?? 20;
    const page = filters.page ?? 1;
    const total = produits.length;
    const totalPages = Math.max(1, Math.ceil(total / limit));

    return {
      data: produits.slice((page - 1) * limit, page * limit),
      pagination: { page, limit, total, totalPages },
    };
  },

  async create(produit: { nom: string; description?: string }): Promise<Produit> {
    try {
      const response = await api.post<{ product: ProduitBackend }>('/products', {
        name: produit.nom,
        description: produit.description || undefined,
      });
      return mapProduitFromBackend(response.data.product);
    } catch {
      const all = demoLoad<Produit>(DEMO_STORAGE_KEYS.produits);
      const p: Produit = {
        id: uid(),
        nom: produit.nom,
        description: produit.description || '',
        estArchive: false,
        dateCreation: isoNow(),
        dateModification: isoNow(),
        nbProjets: 0,
        nbVersions: 0,
        nbEnvironnements: 0,
      };
      all.push(p);
      demoSave(DEMO_STORAGE_KEYS.produits, all);
      return p;
    }
  },

  async getById(id: string): Promise<Produit> {
    try {
      const response = await api.get<ProduitBackend>(`/products/${id}`);
      return mapProduitFromBackend(response.data);
    } catch {
      const found = demoProduits().find(p => p.id === id);
      if (!found) notFound();
      return found;
    }
  },

  async getReleases(id: string): Promise<ReleaseProduit[]> {
    try {
      const response = await api.get<any[]>(`/products/${id}/releases`);
      if (response.data.length > 0) {
        return response.data.map((r: any) => ({
          id: String(r.id),
          produitId: String(r.product_id),
          version: r.version,
          description: r.description ?? '',
          statut: r.status ?? 'planned',
          datePrevue: r.planned_date ?? null,
          livreeLe: r.released_at ?? null,
          dateCreation: r.created_at,
        }));
      }
    } catch {
      // fallback ci-dessous
    }
    return demoLoad<ReleaseProduit>(DEMO_STORAGE_KEYS.releases).filter(r => r.produitId === id);
  },

  async getEnvironments(id: string): Promise<EnvironnementProduit[]> {
    try {
      const response = await api.get<any[]>(`/products/${id}/environments`, { params: { includeInactive: true } });
      if (response.data.length > 0) {
        return response.data.map((e: any) => ({
          id: String(e.id),
          produitId: String(e.product_id),
          nom: e.name,
          type: e.type,
          description: e.description ?? '',
          actif: Boolean(e.is_active),
          dateCreation: e.created_at,
        }));
      }
    } catch {
      // fallback ci-dessous
    }
    return demoLoad<EnvironnementProduit>(DEMO_STORAGE_KEYS.environnements).filter(e => e.produitId === id);
  },

  async createEnvironment(
    produitId: string,
    env: { nom: string; type: EnvironnementProduit['type']; description?: string; actif?: boolean }
  ): Promise<EnvironnementProduit> {
    try {
      const response = await api.post<{ environment: any }>(`/products/${produitId}/environments`, {
        name: env.nom,
        type: env.type,
        description: env.description || undefined,
        is_active: env.actif ?? true,
      });
      const e = response.data.environment;
      return {
        id: String(e.id),
        produitId: String(e.product_id),
        nom: e.name,
        type: e.type,
        description: e.description ?? '',
        actif: Boolean(e.is_active),
        dateCreation: e.created_at,
      };
    } catch {
      const all = demoLoad<EnvironnementProduit>(DEMO_STORAGE_KEYS.environnements);
      const created: EnvironnementProduit = {
        id: uid(),
        produitId,
        nom: env.nom,
        type: env.type,
        description: env.description || '',
        actif: env.actif ?? true,
        dateCreation: isoNow(),
      };
      all.push(created);
      demoSave(DEMO_STORAGE_KEYS.environnements, all);
      return created;
    }
  },

  async updateEnvironment(
    produitId: string,
    envId: string,
    env: { nom?: string; type?: EnvironnementProduit['type']; description?: string; actif?: boolean }
  ): Promise<void> {
    try {
      await api.put(`/products/${produitId}/environments/${envId}`, {
        ...(env.nom !== undefined ? { name: env.nom } : {}),
        ...(env.type !== undefined ? { type: env.type } : {}),
        ...(env.description !== undefined ? { description: env.description } : {}),
        ...(env.actif !== undefined ? { is_active: env.actif } : {}),
      });
    } catch {
      const all = demoLoad<EnvironnementProduit>(DEMO_STORAGE_KEYS.environnements);
      const idx = all.findIndex(e => e.id === envId && e.produitId === produitId);
      if (idx !== -1) all[idx] = { ...all[idx], ...env };
      demoSave(DEMO_STORAGE_KEYS.environnements, all);
    }
  },

  async deleteEnvironment(produitId: string, envId: string): Promise<void> {
    try {
      await api.delete(`/products/${produitId}/environments/${envId}`);
    } catch {
      const all = demoLoad<EnvironnementProduit>(DEMO_STORAGE_KEYS.environnements);
      demoSave(DEMO_STORAGE_KEYS.environnements, all.filter(e => !(e.id === envId && e.produitId === produitId)));
    }
  },

  async getProjects(id: string): Promise<{ id: string; nom: string; description: string; statut: string }[]> {
    try {
      const response = await api.get<any[]>(`/products/${id}/projects`);
      if (response.data.length > 0) {
        return response.data.map((p: any) => ({
          id: String(p.id),
          nom: p.name,
          description: p.description ?? '',
          statut: p.status === 'archive' ? 'archive' : 'actif',
        }));
      }
    } catch {
      // fallback ci-dessous
    }
    return demoLoad<any>(DEMO_STORAGE_KEYS.projets)
      .filter((p: any) => p.produitId === id)
      .map((p: any) => ({
        id: String(p.id),
        nom: p.nom,
        description: p.description ?? '',
        statut: p.statut,
      }));
  },

  async update(id: string, data: { nom?: string; description?: string }): Promise<Produit> {
    try {
      const response = await api.put<{ product: ProduitBackend }>(`/products/${id}`, {
        ...(data.nom !== undefined ? { name: data.nom } : {}),
        ...(data.description !== undefined ? { description: data.description } : {}),
      });
      return mapProduitFromBackend(response.data.product);
    } catch {
      const all = demoLoad<Produit>(DEMO_STORAGE_KEYS.produits);
      const idx = all.findIndex(p => p.id === id);
      if (idx !== -1) all[idx] = { ...all[idx], ...data, dateModification: isoNow() };
      demoSave(DEMO_STORAGE_KEYS.produits, all);
      return recomputeCounts(all[idx] ?? { id } as Produit);
    }
  },

  async delete(id: string): Promise<void> {
    try {
      await api.delete(`/products/${id}`);
    } catch {
      const all = demoLoad<Produit>(DEMO_STORAGE_KEYS.produits);
      demoSave(DEMO_STORAGE_KEYS.produits, all.filter(p => p.id !== id));
    }
  },

  async archive(id: string): Promise<Produit> {
    try {
      const response = await api.patch<{ product: ProduitBackend }>(`/products/${id}/archive`);
      return mapProduitFromBackend(response.data.product);
    } catch {
      const all = demoLoad<Produit>(DEMO_STORAGE_KEYS.produits);
      const idx = all.findIndex(p => p.id === id);
      if (idx !== -1) all[idx] = { ...all[idx], estArchive: true, dateModification: isoNow() };
      demoSave(DEMO_STORAGE_KEYS.produits, all);
      return recomputeCounts(all[idx] ?? { id } as Produit);
    }
  },

  async unarchive(id: string): Promise<Produit> {
    try {
      const response = await api.patch<{ product: ProduitBackend }>(`/products/${id}/unarchive`);
      return mapProduitFromBackend(response.data.product);
    } catch {
      const all = demoLoad<Produit>(DEMO_STORAGE_KEYS.produits);
      const idx = all.findIndex(p => p.id === id);
      if (idx !== -1) all[idx] = { ...all[idx], estArchive: false, dateModification: isoNow() };
      demoSave(DEMO_STORAGE_KEYS.produits, all);
      return recomputeCounts(all[idx] ?? { id } as Produit);
    }
  },

  async createRelease(
    produitId: string,
    release: { version: string; description?: string; statut?: ReleaseProduit['statut']; datePrevue?: string | null }
  ): Promise<ReleaseProduit> {
    try {
      const response = await api.post<{ release: any }>(`/products/${produitId}/releases`, {
        version: release.version,
        description: release.description || undefined,
        status: release.statut,
        planned_date: release.datePrevue ?? undefined,
      });
      const r = response.data.release;
      return {
        id: String(r.id),
        produitId: String(r.product_id),
        version: r.version,
        description: r.description ?? '',
        statut: r.status ?? 'planned',
        datePrevue: r.planned_date ?? null,
        livreeLe: r.released_at ?? null,
        dateCreation: r.created_at,
      };
    } catch {
      const all = demoLoad<ReleaseProduit>(DEMO_STORAGE_KEYS.releases);
      const created: ReleaseProduit = applyTransitionRelease({
        id: uid(),
        produitId,
        version: release.version,
        description: release.description || '',
        statut: release.statut ?? 'planned',
        datePrevue: release.datePrevue ?? null,
        livreeLe: null,
        dateCreation: isoNow(),
      });
      all.push(created);
      demoSave(DEMO_STORAGE_KEYS.releases, all);
      return created;
    }
  },

  async updateRelease(
    produitId: string,
    releaseId: string,
    release: { version?: string; description?: string; statut?: ReleaseProduit['statut']; datePrevue?: string | null }
  ): Promise<void> {
    try {
      await api.put(`/products/${produitId}/releases/${releaseId}`, {
        ...(release.version !== undefined ? { version: release.version } : {}),
        ...(release.description !== undefined ? { description: release.description } : {}),
        ...(release.statut !== undefined ? { status: release.statut } : {}),
        ...(release.datePrevue !== undefined ? { planned_date: release.datePrevue } : {}),
      });
    } catch {
      const all = demoLoad<ReleaseProduit>(DEMO_STORAGE_KEYS.releases);
      const idx = all.findIndex(r => r.id === releaseId && r.produitId === produitId);
      if (idx !== -1) all[idx] = applyTransitionRelease({ ...all[idx], ...release });
      demoSave(DEMO_STORAGE_KEYS.releases, all);
    }
  },

  async deleteRelease(produitId: string, releaseId: string): Promise<void> {
    try {
      await api.delete(`/products/${produitId}/releases/${releaseId}`);
    } catch {
      const all = demoLoad<ReleaseProduit>(DEMO_STORAGE_KEYS.releases);
      demoSave(DEMO_STORAGE_KEYS.releases, all.filter(r => !(r.id === releaseId && r.produitId === produitId)));
    }
  },
};