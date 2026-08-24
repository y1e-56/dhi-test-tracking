import { useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, useNavigate } from 'react-router';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { ArrowLeft, Package, Tag, Server, FolderKanban, Loader2, AlertCircle } from 'lucide-react';
import { Produit, ReleaseProduit, EnvironnementProduit } from '../types';
import { productService } from '../services/productService';
import { getErrorMessage } from '../services/api';

export function ProduitDetailPage() {
  const { t } = useTranslation();
  const { produitId } = useParams<{ produitId: string }>();
  const navigate = useNavigate();

  const [produit, setProduit] = useState<Produit | null>(null);
  const [releases, setReleases] = useState<ReleaseProduit[]>([]);
  const [environments, setEnvironments] = useState<EnvironnementProduit[]>([]);
  const [projects, setProjects] = useState<{ id: string; nom: string; description: string; statut: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchAll = useCallback(async () => {
    if (!produitId) return;
    setLoading(true);
    setError('');
    try {
      const [p, r, e, pr] = await Promise.all([
        productService.getById(produitId),
        productService.getReleases(produitId),
        productService.getEnvironments(produitId),
        productService.getProjects(produitId),
      ]);
      setProduit(p);
      setReleases(r);
      setEnvironments(e);
      setProjects(pr);
    } catch (err: any) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [produitId]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
        <span className="ml-2 text-slate-500">{t('products.loading')}</span>
      </div>
    );
  }

  if (error || !produit) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <AlertCircle className="w-12 h-12 text-red-300 mx-auto mb-4" />
          <p className="text-gray-500">{error || t('products.error')}</p>
          <Button variant="outline" size="sm" className="mt-4" onClick={() => navigate('/produits')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t('nav.products')}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" className="-ml-2" onClick={() => navigate('/produits')}>
        <ArrowLeft className="w-4 h-4 mr-2" />
        {t('nav.products')}
      </Button>

      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-indigo-50 shrink-0">
            <Package className="w-6 h-6 text-indigo-600" />
          </div>
          <div className="min-w-0">
            <h2 className="text-2xl font-semibold truncate">{produit.nom}</h2>
            <p className="text-sm text-gray-500 line-clamp-1">{produit.description || '—'}</p>
          </div>
        </div>
        <Badge variant={produit.estArchive ? 'secondary' : 'default'}>
          {produit.estArchive ? t('products.badge_archived') : t('products.badge_active')}
        </Badge>
      </div>

      <Tabs defaultValue="versions">
        <TabsList>
          <TabsTrigger value="versions" className="gap-1.5">
            <Tag className="w-4 h-4" />
            {t('products.tab_releases')} ({releases.length})
          </TabsTrigger>
          <TabsTrigger value="environnements" className="gap-1.5">
            <Server className="w-4 h-4" />
            {t('products.tab_environments')} ({environments.length})
          </TabsTrigger>
          <TabsTrigger value="projets" className="gap-1.5">
            <FolderKanban className="w-4 h-4" />
            {t('products.tab_projects')} ({projects.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="versions" className="mt-4">
          {releases.length === 0 ? (
            <Card>
              <CardContent className="py-10 text-center">
                <Tag className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">{t('products.empty_releases')}</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {releases.map((r) => (
                <Card key={r.id}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2 text-base">
                        <Tag className="w-4 h-4 text-emerald-500" />
                        v{r.version}
                      </CardTitle>
                      <Badge variant={r.statut === 'released' ? 'default' : r.statut === 'cancelled' ? 'destructive' : 'secondary'}>
                        {t(`products.release_status.${r.statut}`)}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="text-sm text-gray-600 space-y-1">
                    {r.description && <CardDescription>{r.description}</CardDescription>}
                    {r.datePrevue && (
                      <p>{t('products.planned_date')} : {new Date(r.datePrevue).toLocaleDateString('fr-FR')}</p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="environnements" className="mt-4">
          {environments.length === 0 ? (
            <Card>
              <CardContent className="py-10 text-center">
                <Server className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">{t('products.empty_environments')}</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {environments.map((env) => (
                <Card key={env.id}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2 text-base">
                        <Server className="w-4 h-4 text-amber-500" />
                        {env.nom}
                      </CardTitle>
                      <Badge variant="outline">{t(`products.env_type.${env.type}`)}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="text-sm text-gray-600">
                    {env.description && <CardDescription className="mb-2">{env.description}</CardDescription>}
                    <Badge variant={env.actif ? 'default' : 'secondary'}>
                      {env.actif ? t('products.env_active') : t('products.env_inactive')}
                    </Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="projets" className="mt-4">
          {projects.length === 0 ? (
            <Card>
              <CardContent className="py-10 text-center">
                <FolderKanban className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">{t('products.empty_projects')}</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {projects.map((p) => (
                <Card key={p.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate(`/campagnes?projetId=${p.id}`)}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2 text-base">
                        <FolderKanban className="w-4 h-4 text-blue-600" />
                        {p.nom}
                      </CardTitle>
                      <Badge variant={p.statut === 'actif' ? 'default' : 'secondary'}>
                        {p.statut === 'actif' ? t('products.badge_active') : t('products.badge_archived')}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="line-clamp-2">{p.description || '—'}</CardDescription>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
