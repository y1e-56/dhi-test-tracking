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
import { ArrowLeft, Package, Tag, Server, FolderKanban, Loader2, AlertCircle, Plus, Pencil, Trash2, ShieldCheck, Activity, AlertTriangle, History } from 'lucide-react';
import { Produit, ReleaseProduit, EnvironnementProduit, CritereQualite, ScoreQualite, PointCritique, HistoriqueQualite, SanteQualite } from '../types';
import { productService } from '../services/productService';
import { qualityService } from '../services/qualityService';
import { getErrorMessage } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const ENV_TYPES: EnvironnementProduit['type'][] = ['development', 'integration', 'staging', 'production'];
const RELEASE_STATUTS: ReleaseProduit['statut'][] = ['planned', 'in_progress', 'released', 'cancelled'];

export function ProduitDetailPage() {
  const { t } = useTranslation();
  const { produitId } = useParams<{ produitId: string }>();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const peutGerer = currentUser?.role === 'admin' || currentUser?.role === 'chef_testeur';
  const estAdmin = currentUser?.role === 'admin';

  const [produit, setProduit] = useState<Produit | null>(null);
  const [releases, setReleases] = useState<ReleaseProduit[]>([]);
  const [environments, setEnvironments] = useState<EnvironnementProduit[]>([]);
  const [projects, setProjects] = useState<{ id: string; nom: string; description: string; statut: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [dialogEnvOpen, setDialogEnvOpen] = useState(false);
  const [envEnEdition, setEnvEnEdition] = useState<EnvironnementProduit | null>(null);
  const [envForm, setEnvForm] = useState({ nom: '', type: 'development' as EnvironnementProduit['type'], description: '', actif: true });
  const [envErrors, setEnvErrors] = useState({ nom: '' });
  const [envASupprimer, setEnvASupprimer] = useState<EnvironnementProduit | null>(null);

  const [dialogRelOpen, setDialogRelOpen] = useState(false);
  const [relEnEdition, setRelEnEdition] = useState<ReleaseProduit | null>(null);
  const [relForm, setRelForm] = useState({ version: '', statut: 'planned' as ReleaseProduit['statut'], datePrevue: '', description: '' });
  const [relErrors, setRelErrors] = useState({ version: '' });
  const [relASupprimer, setRelASupprimer] = useState<ReleaseProduit | null>(null);

  const [dialogEditOpen, setDialogEditOpen] = useState(false);
  const [editForm, setEditForm] = useState({ nom: '', description: '' });
  const [editErrors, setEditErrors] = useState({ nom: '' });
  const [produitASupprimer, setProduitASupprimer] = useState(false);
  const [actionEnCours, setActionEnCours] = useState(false);

  const [criteres, setCriteres] = useState<CritereQualite[]>([]);
  const [score, setScore] = useState<ScoreQualite | null>(null);
  const [watchPoints, setWatchPoints] = useState<PointCritique[]>([]);
  const [historiqueQualite, setHistoriqueQualite] = useState<HistoriqueQualite[]>([]);

  const [dialogCritereOpen, setDialogCritereOpen] = useState(false);
  const [critereEnEdition, setCritereEnEdition] = useState<CritereQualite | null>(null);
  const [critereForm, setCritereForm] = useState({ nom: '', description: '', poids: 10, estBloquant: false });
  const [critereErrors, setCritereErrors] = useState({ nom: '', poids: '' });
  const [critereASupprimer, setCritereASupprimer] = useState<CritereQualite | null>(null);

  const [dialogWatchpointOpen, setDialogWatchpointOpen] = useState(false);
  const [watchpointEnEdition, setWatchpointEnEdition] = useState<PointCritique | null>(null);
  const [watchpointForm, setWatchpointForm] = useState({ description: '', contexte: '', criticite: 'moyenne' as PointCritique['criticite'], consequence: '', responsableId: '', responsableNom: '', criteresValidation: '', recommandations: '', statut: 'a_verifier' as PointCritique['statut'] });
  const [watchpointErrors, setWatchpointErrors] = useState({ description: '' });
  const [watchpointASupprimer, setWatchpointASupprimer] = useState<PointCritique | null>(null);

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
      setCriteres(qualityService.getCriteres(produitId));
      setScore(qualityService.getScore(produitId));
      setWatchPoints(qualityService.getPointsCritiques(produitId));
      setHistoriqueQualite(qualityService.getHistorique(produitId));
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
    setActionEnCours(true);
    try {
      await productService.deleteEnvironment(produitId, envASupprimer.id);
      toast.success(t('products.toast.env_deleted'));
      setEnvASupprimer(null);
      fetchAll();
    } catch (error: any) {
      toast.error(getErrorMessage(error) || t('products.toast.env_error'));
    } finally {
      setActionEnCours(false);
    }
  };

  const ouvrirDialogRel = (rel?: ReleaseProduit) => {
    setRelEnEdition(rel ?? null);
    setRelForm(rel
      ? {
          version: rel.version,
          statut: rel.statut,
          datePrevue: rel.datePrevue ? rel.datePrevue.substring(0, 10) : '',
          description: rel.description,
        }
      : { version: '', statut: 'planned', datePrevue: '', description: '' });
    setRelErrors({ version: '' });
    setDialogRelOpen(true);
  };

  const soumettreRel = async () => {
    if (!produitId) return;
    if (!relForm.version.trim()) {
      setRelErrors({ version: t('products.release_version_required') });
      return;
    }
    try {
      if (relEnEdition) {
        await productService.updateRelease(produitId, relEnEdition.id, {
          version: relForm.version.trim(),
          statut: relForm.statut,
          datePrevue: relForm.datePrevue || null,
          description: relForm.description.trim(),
        });
        toast.success(t('products.toast.release_updated'));
      } else {
        await productService.createRelease(produitId, {
          version: relForm.version.trim(),
          statut: relForm.statut,
          datePrevue: relForm.datePrevue || null,
          description: relForm.description.trim() || undefined,
        });
        toast.success(t('products.toast.release_created'));
      }
      setDialogRelOpen(false);
      fetchAll();
    } catch (error: any) {
      if (error?.response?.status === 409) {
        setRelErrors({ version: getErrorMessage(error) });
        return;
      }
      toast.error(getErrorMessage(error) || t('products.toast.release_error'));
    }
  };

  const confirmerSuppressionRel = async () => {
    if (!produitId || !relASupprimer) return;
    setActionEnCours(true);
    try {
      await productService.deleteRelease(produitId, relASupprimer.id);
      toast.success(t('products.toast.release_deleted'));
      setRelASupprimer(null);
      fetchAll();
    } catch (error: any) {
      toast.error(getErrorMessage(error) || t('products.toast.release_error'));
    } finally {
      setActionEnCours(false);
    }
  };

  const ouvrirDialogEdit = () => {
    if (!produit) return;
    setEditForm({ nom: produit.nom, description: produit.description });
    setEditErrors({ nom: '' });
    setDialogEditOpen(true);
  };

  const soumettreEdit = async () => {
    if (!produitId) return;
    if (!editForm.nom.trim()) {
      setEditErrors({ nom: t('products.name_required') });
      return;
    }
    try {
      await productService.update(produitId, {
        nom: editForm.nom.trim(),
        description: editForm.description.trim(),
      });
      toast.success(t('products.toast.product_updated'));
      setDialogEditOpen(false);
      fetchAll();
    } catch (error: any) {
      toast.error(getErrorMessage(error) || t('products.toast.product_error'));
    }
  };

  const confirmerSuppressionProduit = async () => {
    if (!produitId) return;
    setActionEnCours(true);
    try {
      await productService.delete(produitId);
      toast.success(t('products.toast.product_deleted'));
      navigate('/produits');
    } catch (error: any) {
      toast.error(getErrorMessage(error) || t('products.toast.product_error'));
    } finally {
      setActionEnCours(false);
    }
  };

  const gererArchivage = async () => {
    if (!produitId || !produit) return;
    setActionEnCours(true);
    try {
      if (produit.estArchive) {
        await productService.unarchive(produitId);
        toast.success(t('products.toast.product_restored'));
      } else {
        await productService.archive(produitId);
        toast.success(t('products.toast.product_archived'));
      }
      fetchAll();
    } catch (error: any) {
      toast.error(getErrorMessage(error) || t('products.toast.product_error'));
    } finally {
      setActionEnCours(false);
    }
  };

  const soumettreCritere = () => {
    if (!produitId) return;
    if (!critereForm.nom.trim()) {
      setCritereErrors({ nom: t('quality.criteria_name_required'), poids: '' });
      return;
    }
    if (critereForm.poids < 1 || critereForm.poids > 100) {
      setCritereErrors({ nom: '', poids: t('quality.criteria_weight_invalid') });
      return;
    }
    try {
      if (critereEnEdition) {
        qualityService.updateCritere(produitId, critereEnEdition.id, critereForm);
        toast.success(t('quality.toast.criteria_updated'));
      } else {
        qualityService.createCritere(produitId, critereForm);
        toast.success(t('quality.toast.criteria_created'));
      }
      setDialogCritereOpen(false);
      setCriteres(qualityService.getCriteres(produitId));
      setScore(qualityService.getScore(produitId));
    } catch {
      toast.error(t('products.toast.product_error'));
    }
  };

  const confirmerSuppressionCritere = () => {
    if (!produitId || !critereASupprimer) return;
    qualityService.deleteCritere(produitId, critereASupprimer.id);
    toast.success(t('quality.toast.criteria_deleted'));
    setCritereASupprimer(null);
    setCriteres(qualityService.getCriteres(produitId));
    setScore(qualityService.getScore(produitId));
  };

  const soumettreWatchpoint = () => {
    if (!produitId) return;
    if (!watchpointForm.description.trim()) {
      setWatchpointErrors({ description: t('quality.watchpoint_description_required') });
      return;
    }
    try {
      if (watchpointEnEdition) {
        qualityService.updatePointCritique(produitId, watchpointEnEdition.id, watchpointForm);
        toast.success(t('quality.toast.watchpoint_updated'));
      } else {
        qualityService.createPointCritique(produitId, watchpointForm);
        toast.success(t('quality.toast.watchpoint_created'));
      }
      setDialogWatchpointOpen(false);
      setWatchPoints(qualityService.getPointsCritiques(produitId));
    } catch {
      toast.error(t('products.toast.product_error'));
    }
  };

  const confirmerSuppressionWatchpoint = () => {
    if (!produitId || !watchpointASupprimer) return;
    qualityService.deletePointCritique(produitId, watchpointASupprimer.id);
    toast.success(t('quality.toast.watchpoint_deleted'));
    setWatchpointASupprimer(null);
    setWatchPoints(qualityService.getPointsCritiques(produitId));
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
        <div className="flex items-center gap-2 shrink-0">
          {peutGerer && (
            <>
              <Button variant="outline" size="sm" onClick={ouvrirDialogEdit}>
                <Pencil className="w-3.5 h-3.5 mr-1.5" />
                {t('common.edit')}
              </Button>
              <Button variant="outline" size="sm" onClick={gererArchivage} disabled={actionEnCours}>
                {produit.estArchive ? t('products.restore') : t('products.archive')}
              </Button>
              {estAdmin && (
                <Button variant="outline" size="sm" className="text-red-600 hover:bg-red-50 hover:text-red-700" onClick={() => setProduitASupprimer(true)}>
                  <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                  {t('common.delete')}
                </Button>
              )}
            </>
          )}
          <Badge variant={produit.estArchive ? 'secondary' : 'default'}>
            {produit.estArchive ? t('products.badge_archived') : t('products.badge_active')}
          </Badge>
          {score && (
            <Badge variant={score.sante === 'sain' ? 'default' : score.sante === 'critique' ? 'destructive' : 'secondary'}
              className={score.sante === 'a_surveiller' ? 'bg-amber-100 text-amber-800' : score.sante === 'a_risque' ? 'bg-orange-100 text-orange-800' : ''}>
              <Activity className="w-3 h-3 mr-1" />
              {t('quality.score_label')} {score.score}{t('quality.score_over')}
            </Badge>
          )}
        </div>
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
          <TabsTrigger value="score" className="gap-1.5">
            <Activity className="w-4 h-4" />
            {t('quality.tab_score')}
          </TabsTrigger>
          <TabsTrigger value="criteres" className="gap-1.5">
            <ShieldCheck className="w-4 h-4" />
            {t('quality.tab_criteria')} ({criteres.length})
          </TabsTrigger>
          <TabsTrigger value="watchpoints" className="gap-1.5">
            <AlertTriangle className="w-4 h-4" />
            {t('quality.tab_watchpoints')} ({watchPoints.length})
          </TabsTrigger>
          <TabsTrigger value="historique" className="gap-1.5">
            <History className="w-4 h-4" />
            {t('quality.tab_history')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="versions" className="mt-4">
          {peutGerer && (
            <div className="flex justify-end mb-3">
              <Button size="sm" onClick={() => ouvrirDialogRel()}>
                <Plus className="w-4 h-4 mr-2" />
                {t('products.release_new')}
              </Button>
            </div>
          )}
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
                    {r.livreeLe && (
                      <p className="text-emerald-600 font-medium">
                        {t('products.released_on')} : {new Date(r.livreeLe).toLocaleDateString('fr-FR')}
                      </p>
                    )}
                    {peutGerer && (
                      <div className="flex items-center gap-1 pt-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => ouvrirDialogRel(r)} title={t('common.edit')}>
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => setRelASupprimer(r)} title={t('common.delete')}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
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

        <TabsContent value="score" className="mt-4">
          {score && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="w-5 h-5" />
                    {t('quality.tab_score')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="text-center">
                    <div className="text-6xl font-bold">{score.score}</div>
                    <div className="text-lg text-gray-500">{t('quality.score_over')}</div>
                    <Badge
                      variant={score.sante === 'sain' ? 'default' : score.sante === 'critique' ? 'destructive' : 'secondary'}
                      className={`mt-2 text-sm px-3 py-1 ${score.sante === 'a_surveiller' ? 'bg-amber-100 text-amber-800' : score.sante === 'a_risque' ? 'bg-orange-100 text-orange-800' : ''}`}
                    >
                      {t(`quality.health_${score.sante}`)}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">{t('products.tab_score')} — {t('quality.criteria_description')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {[
                    { key: 'resultatsTests', label: t('quality.detail_results'), value: score.detail.resultatsTests },
                    { key: 'couverture', label: t('quality.detail_coverage'), value: score.detail.couverture },
                    { key: 'couvertureCritiques', label: t('quality.detail_critical_coverage'), value: score.detail.couvertureCritiques },
                    { key: 'incidents', label: t('quality.detail_incidents'), value: score.detail.incidents },
                    { key: 'nonFonctionnel', label: t('quality.detail_nonfunctional'), value: score.detail.nonFonctionnel },
                    { key: 'testabilite', label: t('quality.detail_testability'), value: score.detail.testabilite },
                    { key: 'controlesQualite', label: t('quality.detail_controls'), value: score.detail.controlesQualite },
                  ].map((item) => (
                    <div key={item.key} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">{item.label}</span>
                        <span className="font-medium">{item.value}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${item.value >= 80 ? 'bg-emerald-500' : item.value >= 60 ? 'bg-amber-500' : item.value >= 40 ? 'bg-orange-500' : 'bg-red-500'}`}
                          style={{ width: `${item.value}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="criteres" className="mt-4">
          {peutGerer && (
            <div className="flex justify-end mb-3">
              <Button size="sm" onClick={() => { setCritereEnEdition(null); setCritereForm({ nom: '', description: '', poids: 10, estBloquant: false }); setCritereErrors({ nom: '', poids: '' }); setDialogCritereOpen(true); }}>
                <Plus className="w-4 h-4 mr-2" />
                {t('quality.criteria_new')}
              </Button>
            </div>
          )}
          {criteres.length === 0 ? (
            <Card>
              <CardContent className="py-10 text-center">
                <ShieldCheck className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">{t('quality.criteria_empty')}</p>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="mb-3 text-sm text-gray-500">
                {t('quality.criteria_total_weight')} : {criteres.reduce((s, c) => s + c.poids, 0)}%
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {criteres.map((c) => (
                  <Card key={c.id}>
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base">{c.nom}</CardTitle>
                        <Badge variant={c.estBloquant ? 'destructive' : 'secondary'}>
                          {c.poids}%
                        </Badge>
                      </div>
                      {c.estBloquant && (
                        <CardDescription className="text-red-600 text-xs font-medium">
                          {t('quality.criteria_blocking')}
                        </CardDescription>
                      )}
                    </CardHeader>
                    <CardContent className="text-sm text-gray-600">
                      <p className="mb-2">{c.description || '—'}</p>
                      {peutGerer && (
                        <div className="flex items-center gap-1 pt-1">
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setCritereEnEdition(c); setCritereForm({ nom: c.nom, description: c.description, poids: c.poids, estBloquant: c.estBloquant }); setCritereErrors({ nom: '', poids: '' }); setDialogCritereOpen(true); }}>
                            <Pencil className="w-3.5 h-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => setCritereASupprimer(c)}>
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          )}
        </TabsContent>

        <TabsContent value="watchpoints" className="mt-4">
          {peutGerer && (
            <div className="flex justify-end mb-3">
              <Button size="sm" onClick={() => { setWatchpointEnEdition(null); setWatchpointForm({ description: '', contexte: '', criticite: 'moyenne', consequence: '', responsableId: '', responsableNom: '', criteresValidation: '', recommandations: '', statut: 'a_verifier' }); setWatchpointErrors({ description: '' }); setDialogWatchpointOpen(true); }}>
                <Plus className="w-4 h-4 mr-2" />
                {t('quality.watchpoint_new')}
              </Button>
            </div>
          )}
          {watchPoints.length === 0 ? (
            <Card>
              <CardContent className="py-10 text-center">
                <AlertTriangle className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">{t('quality.watchpoint_empty')}</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {watchPoints.map((wp) => (
                <Card key={wp.id}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base line-clamp-1">{wp.description}</CardTitle>
                      <Badge variant={wp.criticite === 'critique' ? 'destructive' : wp.criticite === 'haute' ? 'default' : 'secondary'}>
                        {t(`quality.criticality_${wp.criticite}`)}
                      </Badge>
                    </div>
                    <CardDescription>
                      {t(`quality.watchpoint_status_${wp.statut}`)}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="text-sm text-gray-600 space-y-1">
                    {wp.contexte && <p><span className="font-medium">{t('quality.watchpoint_context')} :</span> {wp.contexte}</p>}
                    {wp.consequence && <p><span className="font-medium">{t('quality.watchpoint_consequence')} :</span> {wp.consequence}</p>}
                    {wp.responsableNom && <p><span className="font-medium">{t('quality.watchpoint_owner')} :</span> {wp.responsableNom}</p>}
                    {wp.criteresValidation && <p><span className="font-medium">{t('quality.watchpoint_validation')} :</span> {wp.criteresValidation}</p>}
                    {peutGerer && (
                      <div className="flex items-center gap-1 pt-2">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setWatchpointEnEdition(wp); setWatchpointForm({ description: wp.description, contexte: wp.contexte, criticite: wp.criticite, consequence: wp.consequence, responsableId: wp.responsableId ?? '', responsableNom: wp.responsableNom, criteresValidation: wp.criteresValidation, recommandations: wp.recommandations, statut: wp.statut }); setWatchpointErrors({ description: '' }); setDialogWatchpointOpen(true); }}>
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => setWatchpointASupprimer(wp)}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="historique" className="mt-4">
          {historiqueQualite.length === 0 ? (
            <Card>
              <CardContent className="py-10 text-center">
                <History className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">{t('quality.history_empty')}</p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-0">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-gray-50">
                      <th className="text-left py-3 px-4 font-medium text-gray-600">{t('quality.history_date')}</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">{t('quality.history_score')}</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">{t('quality.history_health')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {historiqueQualite.map((h) => (
                      <tr key={h.id} className="border-b last:border-0">
                        <td className="py-3 px-4">{new Date(h.date).toLocaleString('fr-FR')}</td>
                        <td className="py-3 px-4 font-medium">{h.score}/100</td>
                        <td className="py-3 px-4">
                          <Badge variant={h.sante === 'sain' ? 'default' : h.sante === 'critique' ? 'destructive' : 'secondary'}
                            className={h.sante === 'a_surveiller' ? 'bg-amber-100 text-amber-800' : h.sante === 'a_risque' ? 'bg-orange-100 text-orange-800' : ''}>
                            {t(`quality.health_${h.sante}`)}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={dialogRelOpen} onOpenChange={setDialogRelOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{relEnEdition ? t('products.release_edit_title') : t('products.release_create_title')}</DialogTitle>
            <DialogDescription>{t('products.release_dialog_desc')}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="rel-version">{t('products.release_version_label')}</Label>
              <Input
                id="rel-version"
                value={relForm.version}
                onChange={(e) => {
                  setRelForm({ ...relForm, version: e.target.value });
                  if (relErrors.version) setRelErrors({ version: '' });
                }}
                placeholder="4.13.0"
                className={relErrors.version ? 'border-red-500 focus:border-red-500' : ''}
              />
              {relErrors.version && <p className="text-sm text-red-500">{relErrors.version}</p>}
            </div>
            <div className="space-y-2">
              <Label>{t('products.release_status_label')}</Label>
              <Select value={relForm.statut} onValueChange={(v) => setRelForm({ ...relForm, statut: v as ReleaseProduit['statut'] })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {RELEASE_STATUTS.map((s) => (
                    <SelectItem key={s} value={s}>
                      {t(`products.release_status.${s}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="rel-date">{t('products.planned_date')}</Label>
              <Input
                id="rel-date"
                type="date"
                value={relForm.datePrevue}
                onChange={(e) => setRelForm({ ...relForm, datePrevue: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="rel-description">{t('common.description')}</Label>
              <Textarea
                id="rel-description"
                value={relForm.description}
                onChange={(e) => setRelForm({ ...relForm, description: e.target.value })}
                placeholder={t('products.description_placeholder')}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogRelOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button onClick={soumettreRel}>
              {relEnEdition ? t('common.save') : t('common.create')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!relASupprimer} onOpenChange={(o) => !o && setRelASupprimer(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('products.release_delete_title')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('products.release_delete_confirm', { version: relASupprimer?.version })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={actionEnCours}>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              disabled={actionEnCours}
              onClick={(e) => {
                e.preventDefault();
                confirmerSuppressionRel();
              }}
            >
              {actionEnCours ? t('common.loading') : t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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
            <AlertDialogCancel disabled={actionEnCours}>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              disabled={actionEnCours}
              onClick={(e) => {
                e.preventDefault();
                confirmerSuppressionEnv();
              }}
            >
              {actionEnCours ? t('common.loading') : t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={dialogEditOpen} onOpenChange={setDialogEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('products.edit_title')}</DialogTitle>
            <DialogDescription>{t('products.edit_desc')}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-nom">{t('products.name_label')}</Label>
              <Input
                id="edit-nom"
                value={editForm.nom}
                onChange={(e) => {
                  setEditForm({ ...editForm, nom: e.target.value });
                  if (editErrors.nom) setEditErrors({ nom: '' });
                }}
                className={editErrors.nom ? 'border-red-500 focus:border-red-500' : ''}
              />
              {editErrors.nom && <p className="text-sm text-red-500">{editErrors.nom}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">{t('common.description')}</Label>
              <Textarea
                id="edit-description"
                value={editForm.description}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogEditOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button onClick={soumettreEdit}>
              {t('common.save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={produitASupprimer} onOpenChange={(o) => !o && setProduitASupprimer(false)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('products.delete_title')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('products.delete_confirm', { nom: produit.nom })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={actionEnCours}>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              disabled={actionEnCours}
              onClick={(e) => {
                e.preventDefault();
                confirmerSuppressionProduit();
              }}
            >
              {actionEnCours ? t('common.loading') : t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={dialogCritereOpen} onOpenChange={setDialogCritereOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{critereEnEdition ? t('quality.criteria_edit') : t('quality.criteria_new')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="crit-nom">{t('quality.criteria_name')}</Label>
              <Input
                id="crit-nom"
                value={critereForm.nom}
                onChange={(e) => { setCritereForm({ ...critereForm, nom: e.target.value }); if (critereErrors.nom) setCritereErrors({ ...critereErrors, nom: '' }); }}
                className={critereErrors.nom ? 'border-red-500 focus:border-red-500' : ''}
              />
              {critereErrors.nom && <p className="text-sm text-red-500">{critereErrors.nom}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="crit-desc">{t('quality.criteria_description')}</Label>
              <Textarea id="crit-desc" value={critereForm.description} onChange={(e) => setCritereForm({ ...critereForm, description: e.target.value })} rows={3} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="crit-poids">{t('quality.criteria_weight')}</Label>
              <Input
                id="crit-poids"
                type="number"
                min={1}
                max={100}
                value={critereForm.poids}
                onChange={(e) => { setCritereForm({ ...critereForm, poids: parseInt(e.target.value) || 0 }); if (critereErrors.poids) setCritereErrors({ ...critereErrors, poids: '' }); }}
                className={critereErrors.poids ? 'border-red-500 focus:border-red-500' : ''}
              />
              {critereErrors.poids && <p className="text-sm text-red-500">{critereErrors.poids}</p>}
            </div>
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <Label htmlFor="crit-bloquant" className="cursor-pointer">{t('quality.criteria_blocking')}</Label>
                <p className="text-xs text-gray-500">{t('quality.criteria_blocking_help')}</p>
              </div>
              <Switch id="crit-bloquant" checked={critereForm.estBloquant} onCheckedChange={(v) => setCritereForm({ ...critereForm, estBloquant: v })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogCritereOpen(false)}>{t('common.cancel')}</Button>
            <Button onClick={soumettreCritere}>{critereEnEdition ? t('common.save') : t('common.create')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!critereASupprimer} onOpenChange={(o) => !o && setCritereASupprimer(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('quality.criteria_delete_title')}</AlertDialogTitle>
            <AlertDialogDescription>{t('quality.criteria_delete_confirm', { nom: critereASupprimer?.nom })}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={(e) => { e.preventDefault(); confirmerSuppressionCritere(); }}>
              {t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={dialogWatchpointOpen} onOpenChange={setDialogWatchpointOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{watchpointEnEdition ? t('quality.watchpoint_edit') : t('quality.watchpoint_new')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
            <div className="space-y-2">
              <Label>{t('quality.watchpoint_description')}</Label>
              <Textarea
                value={watchpointForm.description}
                onChange={(e) => { setWatchpointForm({ ...watchpointForm, description: e.target.value }); if (watchpointErrors.description) setWatchpointErrors({ description: '' }); }}
                rows={2}
                className={watchpointErrors.description ? 'border-red-500 focus:border-red-500' : ''}
              />
              {watchpointErrors.description && <p className="text-sm text-red-500">{watchpointErrors.description}</p>}
            </div>
            <div className="space-y-2">
              <Label>{t('quality.watchpoint_context')}</Label>
              <Textarea value={watchpointForm.contexte} onChange={(e) => setWatchpointForm({ ...watchpointForm, contexte: e.target.value })} rows={2} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t('quality.watchpoint_criticality')}</Label>
                <Select value={watchpointForm.criticite} onValueChange={(v) => setWatchpointForm({ ...watchpointForm, criticite: v as PointCritique['criticite'] })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="faible">{t('quality.criticality_faible')}</SelectItem>
                    <SelectItem value="moyenne">{t('quality.criticality_moyenne')}</SelectItem>
                    <SelectItem value="haute">{t('quality.criticality_haute')}</SelectItem>
                    <SelectItem value="critique">{t('quality.criticality_critique')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{t('quality.watchpoint_status')}</Label>
                <Select value={watchpointForm.statut} onValueChange={(v) => setWatchpointForm({ ...watchpointForm, statut: v as PointCritique['statut'] })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="a_verifier">{t('quality.watchpoint_status_a_verifier')}</SelectItem>
                    <SelectItem value="en_cours">{t('quality.watchpoint_status_en_cours')}</SelectItem>
                    <SelectItem value="valide">{t('quality.watchpoint_status_valide')}</SelectItem>
                    <SelectItem value="non_valide">{t('quality.watchpoint_status_non_valide')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>{t('quality.watchpoint_consequence')}</Label>
              <Textarea value={watchpointForm.consequence} onChange={(e) => setWatchpointForm({ ...watchpointForm, consequence: e.target.value })} rows={2} />
            </div>
            <div className="space-y-2">
              <Label>{t('quality.watchpoint_validation')}</Label>
              <Textarea value={watchpointForm.criteresValidation} onChange={(e) => setWatchpointForm({ ...watchpointForm, criteresValidation: e.target.value })} rows={2} />
            </div>
            <div className="space-y-2">
              <Label>{t('quality.watchpoint_recommendations')}</Label>
              <Textarea value={watchpointForm.recommandations} onChange={(e) => setWatchpointForm({ ...watchpointForm, recommandations: e.target.value })} rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogWatchpointOpen(false)}>{t('common.cancel')}</Button>
            <Button onClick={soumettreWatchpoint}>{watchpointEnEdition ? t('common.save') : t('common.create')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!watchpointASupprimer} onOpenChange={(o) => !o && setWatchpointASupprimer(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('quality.watchpoint_delete_title')}</AlertDialogTitle>
            <AlertDialogDescription>{t('quality.watchpoint_delete_confirm')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={(e) => { e.preventDefault(); confirmerSuppressionWatchpoint(); }}>
              {t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
