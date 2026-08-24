import { useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Loader2, Package, Search, FolderKanban, Tag, Server, AlertCircle } from 'lucide-react';
import { Produit } from '../types';
import { productService } from '../services/productService';
import { getErrorMessage } from '../services/api';
import { useDebounce } from '../hooks/useDebounce';
import { Pagination } from '../components/ui/pagination';

export function ProduitsPage() {
  const { t } = useTranslation();
  const { currentUser } = useAuth();

  const [produits, setProduits] = useState<Produit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 300);
  const [filter, setFilter] = useState<'tous' | 'actif' | 'archive'>('actif');

  const fetchProduits = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const result = await productService.listPaginated({
        page,
        limit,
        recherche: debouncedSearch || undefined,
        statut: filter === 'tous' ? undefined : filter,
      });
      setProduits(result.data);
      setTotal(result.pagination.total);
      setTotalPages(result.pagination.totalPages);
    } catch (e: any) {
      setError(getErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }, [page, limit, debouncedSearch, filter]);

  useEffect(() => { fetchProduits(); }, [fetchProduits]);
  useEffect(() => { setPage(1); }, [debouncedSearch, filter]);

  if (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'chef_testeur')) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">{t('common.error')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold mb-1">{t('nav.products')}</h2>
        <p className="text-gray-500">{t('products.subtitle')}</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder={t('products.search_placeholder')}
            className="pl-9 bg-white border-slate-200 h-9"
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant={filter === 'actif' ? 'default' : 'outline'}
            onClick={() => setFilter('actif')}
            size="sm"
          >
            {t('products.filter_active')}
          </Button>
          <Button
            variant={filter === 'archive' ? 'default' : 'outline'}
            onClick={() => setFilter('archive')}
            size="sm"
          >
            {t('products.filter_archived')}
          </Button>
          <Button
            variant={filter === 'tous' ? 'default' : 'outline'}
            onClick={() => setFilter('tous')}
            size="sm"
          >
            {t('products.filter_all')}
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
          <span className="ml-2 text-slate-500">{t('products.loading')}</span>
        </div>
      ) : error ? (
        <Card>
          <CardContent className="py-12 text-center">
            <AlertCircle className="w-12 h-12 text-red-300 mx-auto mb-4" />
            <p className="text-gray-500">{t('products.error')}</p>
            <p className="text-xs text-gray-400 mt-1">{error}</p>
            <Button variant="outline" size="sm" className="mt-4" onClick={fetchProduits}>
              {t('products.retry')}
            </Button>
          </CardContent>
        </Card>
      ) : produits.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">{t('products.empty')}</p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {produits.map((produit) => (
              <Card key={produit.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2 mb-2 min-w-0">
                      <Package className="w-5 h-5 text-indigo-600 shrink-0" />
                      <CardTitle className="text-lg truncate">{produit.nom}</CardTitle>
                    </div>
                    <Badge variant={produit.estArchive ? 'secondary' : 'default'}>
                      {produit.estArchive ? t('products.badge_archived') : t('products.badge_active')}
                    </Badge>
                  </div>
                  <CardDescription className="min-h-[2.5rem] line-clamp-2">
                    {produit.description || '—'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-600">
                    <span className="flex items-center gap-1.5">
                      <FolderKanban className="w-4 h-4 text-blue-500" />
                      {t('products.count_projects', { count: produit.nbProjets })}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Tag className="w-4 h-4 text-emerald-500" />
                      {t('products.count_releases', { count: produit.nbVersions })}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Server className="w-4 h-4 text-amber-500" />
                      {t('products.count_environments', { count: produit.nbEnvironnements })}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400">
                    {t('products.created_on')}{' '}
                    {new Date(produit.dateCreation).toLocaleDateString('fr-FR')}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
          <Pagination
            page={page}
            totalPages={totalPages}
            total={total}
            limit={limit}
            onPageChange={setPage}
            onLimitChange={(newLimit) => { setLimit(newLimit); setPage(1); }}
          />
        </>
      )}
    </div>
  );
}
