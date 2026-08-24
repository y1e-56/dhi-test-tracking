import api from './api';
import { Produit } from '../types';

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
};
