import api from './api';
import { Produit, ReleaseProduit, EnvironnementProduit } from '../types';

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

export const productService = {
  /**
   * Liste les produits avec recherche / filtre / pagination geres cote client.
   * NOTE pour le backend : seul GET /products sans parametre renvoie un tableau
   * plat incluant projects_count / releases_count / environments_count ; des
   * qu'un parametre est passe, la reponse est enveloppee et sans compteurs.
   * Si le backend ajoute les compteurs dans la liste paginee, cette methode
   * pourra repasser sur des requetes serveur.
   */
  async listPaginated(filters: { page?: number; limit?: number; recherche?: string; statut?: 'actif' | 'archive' } = {}): Promise<{ data: Produit[]; pagination: { page: number; limit: number; total: number; totalPages: number } }> {
    try {
      const response = await api.get<ProduitBackend[]>('/products');
      let produits = response.data.map(mapProduitFromBackend);

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
    } catch (e) {
      console.error('[productService] Erreur listPaginated:', e);
      throw e;
    }
  },

  async create(produit: { nom: string; description?: string }): Promise<Produit> {
    try {
      const response = await api.post<{ product: ProduitBackend }>('/products', {
        name: produit.nom,
        description: produit.description || undefined,
      });
      return mapProduitFromBackend(response.data.product);
    } catch (e) {
      console.error('[productService] Erreur create:', e);
      throw e;
    }
  },

  async getById(id: string): Promise<Produit> {
    try {
      const response = await api.get<ProduitBackend>(`/products/${id}`);
      return mapProduitFromBackend(response.data);
    } catch (e) {
      console.error('[productService] Erreur getById:', e);
      throw e;
    }
  },

  async getReleases(id: string): Promise<ReleaseProduit[]> {
    try {
      const response = await api.get<any[]>(`/products/${id}/releases`);
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
    } catch (e) {
      console.error('[productService] Erreur getReleases:', e);
      throw e;
    }
  },

  async getEnvironments(id: string): Promise<EnvironnementProduit[]> {
    try {
      const response = await api.get<any[]>(`/products/${id}/environments`, { params: { includeInactive: true } });
      return response.data.map((e: any) => ({
        id: String(e.id),
        produitId: String(e.product_id),
        nom: e.name,
        type: e.type,
        description: e.description ?? '',
        actif: Boolean(e.is_active),
        dateCreation: e.created_at,
      }));
    } catch (err) {
      console.error('[productService] Erreur getEnvironments:', err);
      throw err;
    }
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
    } catch (e) {
      console.error('[productService] Erreur createEnvironment:', e);
      throw e;
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
    } catch (e) {
      console.error('[productService] Erreur updateEnvironment:', e);
      throw e;
    }
  },

  async deleteEnvironment(produitId: string, envId: string): Promise<void> {
    try {
      await api.delete(`/products/${produitId}/environments/${envId}`);
    } catch (e) {
      console.error('[productService] Erreur deleteEnvironment:', e);
      throw e;
    }
  },

  async getProjects(id: string): Promise<{ id: string; nom: string; description: string; statut: string }[]> {
    try {
      const response = await api.get<any[]>(`/products/${id}/projects`);
      return response.data.map((p: any) => ({
        id: String(p.id),
        nom: p.name,
        description: p.description ?? '',
        statut: p.status === 'archive' ? 'archive' : 'actif',
      }));
    } catch (e) {
      console.error('[productService] Erreur getProjects:', e);
      throw e;
    }
  },

  async update(id: string, data: { nom?: string; description?: string }): Promise<Produit> {
    try {
      const response = await api.put<{ product: ProduitBackend }>(`/products/${id}`, {
        ...(data.nom !== undefined ? { name: data.nom } : {}),
        ...(data.description !== undefined ? { description: data.description } : {}),
      });
      return mapProduitFromBackend(response.data.product);
    } catch (e) {
      console.error('[productService] Erreur update:', e);
      throw e;
    }
  },

  async delete(id: string): Promise<void> {
    try {
      await api.delete(`/products/${id}`);
    } catch (e) {
      console.error('[productService] Erreur delete:', e);
      throw e;
    }
  },

  async archive(id: string): Promise<Produit> {
    try {
      const response = await api.patch<{ product: ProduitBackend }>(`/products/${id}/archive`);
      return mapProduitFromBackend(response.data.product);
    } catch (e) {
      console.error('[productService] Erreur archive:', e);
      throw e;
    }
  },

  async unarchive(id: string): Promise<Produit> {
    try {
      const response = await api.patch<{ product: ProduitBackend }>(`/products/${id}/unarchive`);
      return mapProduitFromBackend(response.data.product);
    } catch (e) {
      console.error('[productService] Erreur unarchive:', e);
      throw e;
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
    } catch (e) {
      console.error('[productService] Erreur createRelease:', e);
      throw e;
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
    } catch (e) {
      console.error('[productService] Erreur updateRelease:', e);
      throw e;
    }
  },

  async deleteRelease(produitId: string, releaseId: string): Promise<void> {
    try {
      await api.delete(`/products/${produitId}/releases/${releaseId}`);
    } catch (e) {
      console.error('[productService] Erreur deleteRelease:', e);
      throw e;
    }
  },
};
