import { useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, useNavigate } from 'react-router';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Switch } from '../components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../components/ui/alert-dialog';
import { ArrowLeft, Package, Tag, Server, FolderKanban, Loader2, AlertCircle, Plus, Pencil, Trash2 } from 'lucide-react';
import { Produit, ReleaseProduit, EnvironnementProduit } from '../types';
import { productService } from '../services/productService';
import { getErrorMessage } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const ENV_TYPES: EnvironnementProduit['type'][] = ['development', 'integration', 'staging', 'production'];

export function ProduitDetailPage() {
  const { t } = useTranslation();
  const { produitId } = useParams<{ produitId: string }>();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const peutGerer = currentUser?.role === 'admin' || currentUser?.role === 'chef_testeur';

  const [dialogEnvOpen, setDialogEnvOpen] = useState(false);
  const [envEnEdition, setEnvEnEdition] = useState<EnvironnementProduit | null>(null);
  const [envForm, setEnvForm] = useState({ nom: '', type: 'development' as EnvironnementProduit['type'], description: '', actif: true });
  const [envErrors, setEnvErrors] = useState({ nom: '' });
  const [envASupprimer, setEnvASupprimer] = useState<EnvironnementProduit | null>(null);
  const [suppressionEnCours, setSuppressionEnCours] = useState(false);

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

  const ouvrirDialogEnv = (env?: EnvironnementProduit) => {
    setEnvEnEdition(env ?? null);
    setEnvForm(env
      ? { nom: env.nom, type: env.type, description: env.description, actif: env.actif }
      : { nom: '', type: 'development', description: '', actif: true });
    setEnvErrors({ nom: '' });
    setDialogEnvOpen(true);
  };

  const soumettreEnv = async () => {
    if (!produitId) return;
    if (!envForm.nom.trim()) {
      setEnvErrors({ nom: t('products.env_name_required') });
      return;
    }
    try {
      if (envEnEdition) {
        await productService.updateEnvironment(produitId, envEnEdition.id, {
          nom: envForm.nom.trim(),
          type: envForm.type,
          description: envForm.description.trim(),
          actif: envForm.actif,
        });
        toast.success(t('products.toast.env_updated'));
      } else {
        await productService.createEnvironment(produitId, {
          nom: envForm.nom.trim(),
          type: envForm.type,
          description: envForm.description.trim() || undefined,
          actif: envForm.actif,
        });
        toast.success(t('products.toast.env_created'));
      }
      setDialogEnvOpen(false);
      fetchAll();
    } catch (error: any) {
      if (error?.response?.status === 409) {
        setEnvErrors({ nom: getErrorMessage(error) });
        return;
      }
      toast.error(getErrorMessage(error) || t('products.toast.env_error'));
    }
  };

  const confirmerSuppressionEnv = async () => {
    if (!produitId || !envASupprimer) return;
    setSuppressionEnCours(true);
    try {
      await productService.deleteEnvironment(produitId, envASupprimer.id);
      toast.success(t('products.toast.env_deleted'));
      setEnvASupprimer(null);
      fetchAll();
    } catch (error: any) {
      toast.error(getErrorMessage(error) || t('products.toast.env_error'));
    } finally {
      setSuppressionEnCours(false);
    }
  };

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
          {peutGerer && (
            <div className="flex justify-end mb-3">
              <Button size="sm" onClick={() => ouvrirDialogEnv()}>
                <Plus className="w-4 h-4 mr-2" />
                {t('products.env_new')}
              </Button>
            </div>
          )}
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
                    <div className="flex items-center justify-between mt-1">
                      <Badge variant={env.actif ? 'default' : 'secondary'}>
                        {env.actif ? t('products.env_active') : t('products.env_inactive')}
                      </Badge>
                      {peutGerer && (
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => ouvrirDialogEnv(env)} title={t('common.edit')}>
                            <Pencil className="w-3.5 h-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => setEnvASupprimer(env)} title={t('common.delete')}>
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      )}
                    </div>
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

      <Dialog open={dialogEnvOpen} onOpenChange={setDialogEnvOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{envEnEdition ? t('products.env_edit_title') : t('products.env_create_title')}</DialogTitle>
            <DialogDescription>{t('products.dialog.create_desc')}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="env-nom">{t('products.name_label')}</Label>
              <Input
                id="env-nom"
                value={envForm.nom}
                onChange={(e) => {
                  setEnvForm({ ...envForm, nom: e.target.value });
                  if (envErrors.nom) setEnvErrors({ nom: '' });
                }}
                placeholder={t('products.env_name_placeholder')}
                className={envErrors.nom ? 'border-red-500 focus:border-red-500' : ''}
              />
              {envErrors.nom && <p className="text-sm text-red-500">{envErrors.nom}</p>}
            </div>
            <div className="space-y-2">
              <Label>{t('products.env_type_label')}</Label>
              <Select value={envForm.type} onValueChange={(v) => setEnvForm({ ...envForm, type: v as EnvironnementProduit['type'] })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ENV_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {t(`products.env_type.${type}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="env-description">{t('common.description')}</Label>
              <Textarea
                id="env-description"
                value={envForm.description}
                onChange={(e) => setEnvForm({ ...envForm, description: e.target.value })}
                placeholder={t('products.description_placeholder')}
                rows={3}
              />
            </div>
            <div className="flex items-center justify-between rounded-lg border p-3">
              <Label htmlFor="env-actif" className="cursor-pointer">{t('products.env_active')}</Label>
              <Switch id="env-actif" checked={envForm.actif} onCheckedChange={(v) => setEnvForm({ ...envForm, actif: v })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogEnvOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button onClick={soumettreEnv}>
              {envEnEdition ? t('common.save') : t('common.create')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!envASupprimer} onOpenChange={(o) => !o && setEnvASupprimer(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('products.env_delete_title')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('products.env_delete_confirm', { nom: envASupprimer?.nom })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={suppressionEnCours}>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              disabled={suppressionEnCours}
              onClick={(e) => {
                e.preventDefault();
                confirmerSuppressionEnv();
              }}
            >
              {suppressionEnCours ? t('common.loading') : t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
