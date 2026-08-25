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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '../components/ui/alert-dialog';
import { ArrowLeft, FolderKanban, Loader2, AlertCircle, Plus, Pencil, Trash2, Calendar, Users, Tag, Activity, BarChart3 } from 'lucide-react';
import { Projet, Campagne, Fonctionnalite } from '../types';
import { projectService } from '../services/projectService';
import { getErrorMessage } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const STATUT_CAMPAGNE = ['en_preparation', 'en_cours', 'terminee', 'archive'] as const;

interface CampaignAvecStats extends Campagne {
  nbFeatures: number;
  nbAnomalies: number;
}

interface TeamMember {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
}

export function ProjetDetailPage() {
  const { t } = useTranslation();
  const { projetId } = useParams<{ projetId: string }>();
  const navigate = useNavigate();
  const { currentUser, users } = useAuth();
  const estAdmin = currentUser?.role === 'admin';
  const peutGerer = estAdmin;

  const [projet, setProjet] = useState<Projet | null>(null);
  const [campagnes, setCampagnes] = useState<CampaignAvecStats[]>([]);
  const [fonctionnalites, setFonctionnalites] = useState<Fonctionnalite[]>([]);
  const [equipe, setEquipe] = useState<{ testeurs: TeamMember[]; developpeurs: TeamMember[] }>({ testeurs: [], developpeurs: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [dialogEditOpen, setDialogEditOpen] = useState(false);
  const [editForm, setEditForm] = useState({ nom: '', description: '', dateDebut: '', dateFin: '' });
  const [editErrors, setEditErrors] = useState({ nom: '' });
  const [projetASupprimer, setProjetASupprimer] = useState(false);
  const [actionEnCours, setActionEnCours] = useState(false);

  const fetchAll = useCallback(async () => {
    if (!projetId) return;
    setLoading(true);
    setError('');
    try {
      const p = await projectService.getById(projetId);
      setProjet(p);

      const rawCampagnes = await projectService.getCampaigns(projetId);
      const campagnesAvecStats: CampaignAvecStats[] = await Promise.all(
        rawCampagnes.map(async (c) => {
          const stats = await projectService.getCampaignStats(c.id);
          return { ...c, nbFeatures: stats.totalFeatures, nbAnomalies: stats.totalAnomalies };
        })
      );
      setCampagnes(campagnesAvecStats);

      const allFeatures: Fonctionnalite[] = [];
      const allTesteurs = new Map<string, TeamMember>();
      const allDevs = new Map<string, TeamMember>();

      for (const c of campagnesAvecStats) {
        const features = await projectService.getFeaturesByCampaign(c.id);
        allFeatures.push(...features);
        const team = await projectService.getTeamMembers(c.id);
        team.testeurs.forEach((m: any) => allTesteurs.set(String(m.id), m));
        team.developpeurs.forEach((m: any) => allDevs.set(String(m.id), m));
      }
      setFonctionnalites(allFeatures);
      setEquipe({ testeurs: Array.from(allTesteurs.values()), developpeurs: Array.from(allDevs.values()) });
    } catch (err: any) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [projetId]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const ouvrirDialogEdit = () => {
    if (!projet) return;
    setEditForm({
      nom: projet.nom,
      description: projet.description,
      dateDebut: projet.dateDebut ? projet.dateDebut.substring(0, 10) : '',
      dateFin: projet.dateFin ? projet.dateFin.substring(0, 10) : '',
    });
    setEditErrors({ nom: '' });
    setDialogEditOpen(true);
  };

  const soumettreEdit = async () => {
    if (!projetId) return;
    if (!editForm.nom.trim()) {
      setEditErrors({ nom: t('campagne.list.required_name') });
      return;
    }
    try {
      await projectService.update(projetId, {
        nom: editForm.nom.trim(),
        description: editForm.description.trim(),
        dateDebut: editForm.dateDebut || undefined,
        dateFin: editForm.dateFin || undefined,
      });
      toast.success(t('quality.toast.criteria_updated'));
      setDialogEditOpen(false);
      fetchAll();
    } catch (error: any) {
      toast.error(getErrorMessage(error));
    }
  };

  const confirmerSuppression = async () => {
    if (!projetId) return;
    setActionEnCours(true);
    try {
      await projectService.delete(projetId);
      toast.success(t('quality.toast.criteria_deleted'));
      navigate('/projets');
    } catch (error: any) {
      toast.error(getErrorMessage(error));
    } finally {
      setActionEnCours(false);
    }
  };

  const gererArchivage = async () => {
    if (!projetId || !projet) return;
    setActionEnCours(true);
    try {
      if (projet.statut === 'archive') {
        await projectService.unarchive(projetId);
      } else {
        await projectService.archive(projetId);
      }
      fetchAll();
    } catch (error: any) {
      toast.error(getErrorMessage(error));
    } finally {
      setActionEnCours(false);
    }
  };

  const totalFeatures = fonctionnalites.length;
  const featuresConformes = fonctionnalites.filter((f) => f.statut === 'conforme').length;
  const featuresAnomalie = fonctionnalites.filter((f) => f.statut === 'anomalie').length;
  const totalAnomalies = campagnes.reduce((s, c) => s + c.nbAnomalies, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
        <span className="ml-2 text-slate-500">{t('products.loading')}</span>
      </div>
    );
  }

  if (error || !projet) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <AlertCircle className="w-12 h-12 text-red-300 mx-auto mb-4" />
          <p className="text-gray-500">{error || t('products.error')}</p>
          <Button variant="outline" size="sm" className="mt-4" onClick={() => navigate('/projets')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t('nav.projects')}
          </Button>
        </CardContent>
      </Card>
    );
  }

  const produitLien = projet.produitId ? (
    <Button variant="ghost" size="sm" className="p-0 h-auto text-indigo-600 hover:text-indigo-800" onClick={() => navigate(`/produits/${projet.produitId}`)}>
      {t('admin.assignment.projet')} →
    </Button>
  ) : null;

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" className="-ml-2" onClick={() => navigate('/projets')}>
        <ArrowLeft className="w-4 h-4 mr-2" />
        {t('nav.projects')}
      </Button>

      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-blue-50 shrink-0">
            <FolderKanban className="w-6 h-6 text-blue-600" />
          </div>
          <div className="min-w-0">
            <h2 className="text-2xl font-semibold truncate">{projet.nom}</h2>
            <p className="text-sm text-gray-500 line-clamp-1">{projet.description || '—'}</p>
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
                {projet.statut === 'archive' ? t('products.restore') : t('products.archive')}
              </Button>
              {estAdmin && (
                <Button variant="outline" size="sm" className="text-red-600 hover:bg-red-50 hover:text-red-700" onClick={() => setProjetASupprimer(true)}>
                  <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                  {t('common.delete')}
                </Button>
              )}
            </>
          )}
          <Badge variant={projet.statut === 'archive' ? 'secondary' : 'default'}>
            {projet.statut === 'archive' ? t('products.badge_archived') : t('products.badge_active')}
          </Badge>
        </div>
      </div>

      <Tabs defaultValue="campagnes">
        <TabsList>
          <TabsTrigger value="campagnes" className="gap-1.5">
            <Tag className="w-4 h-4" />
            {t('products.tab_releases')} ({campagnes.length})
          </TabsTrigger>
          <TabsTrigger value="features" className="gap-1.5">
            <Activity className="w-4 h-4" />
            {t('quality.tab_criteria')} ({totalFeatures})
          </TabsTrigger>
          <TabsTrigger value="equipe" className="gap-1.5">
            <Users className="w-4 h-4" />
            {t('quality.watchpoint_owner')} ({equipe.testeurs.length + equipe.developpeurs.length})
          </TabsTrigger>
          <TabsTrigger value="stats" className="gap-1.5">
            <BarChart3 className="w-4 h-4" />
            {t('quality.tab_score')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="campagnes" className="mt-4">
          {campagnes.length === 0 ? (
            <Card>
              <CardContent className="py-10 text-center">
                <Tag className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">{t('products.empty_releases')}</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {campagnes.map((c) => (
                <Card key={c.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate(`/campagnes/${c.id}`)}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base line-clamp-1">{c.nom}</CardTitle>
                      <Badge variant={c.statut === 'en_cours' ? 'default' : c.statut === 'terminee' ? 'secondary' : 'outline'}>
                        {t(`campagne.list.status_${c.statut === 'en_preparation' ? 'planned' : c.statut === 'en_cours' ? 'in_progress' : c.statut === 'terminee' ? 'completed' : 'archived'}`)}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="text-sm text-gray-600 space-y-1">
                    {c.description && <CardDescription className="line-clamp-2">{c.description}</CardDescription>}
                    <div className="flex items-center gap-3 text-xs text-gray-400">
                      {c.dateDebut && <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{new Date(c.dateDebut).toLocaleDateString('fr-FR')}</span>}
                      <span>{c.nbFeatures} features</span>
                      <span className={c.nbAnomalies > 0 ? 'text-red-500 font-medium' : ''}>{c.nbAnomalies} anomalies</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="features" className="mt-4">
          {fonctionnalites.length === 0 ? (
            <Card>
              <CardContent className="py-10 text-center">
                <Activity className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">{t('quality.criteria_empty')}</p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-0">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-gray-50">
                      <th className="text-left py-3 px-4 font-medium text-gray-600">Nom</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">Module</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">Priorité</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">Statut</th>
                    </tr>
                  </thead>
                  <tbody>
                    {fonctionnalites.map((f) => (
                      <tr key={f.id} className="border-b last:border-0 hover:bg-gray-50 cursor-pointer" onClick={() => navigate(`/fonctionnalites/${f.id}?campaignId=${f.campagneId}`)}>
                        <td className="py-3 px-4 font-medium">{f.nom}</td>
                        <td className="py-3 px-4 text-gray-500">{f.module || '—'}</td>
                        <td className="py-3 px-4">
                          <Badge variant={f.priorite === 'critique' ? 'destructive' : f.priorite === 'haute' ? 'default' : 'secondary'}>
                            {f.priorite}
                          </Badge>
                        </td>
                        <td className="py-3 px-4">
                          <Badge variant={f.statut === 'conforme' ? 'default' : f.statut === 'anomalie' ? 'destructive' : 'secondary'}>
                            {f.statut === 'conforme' ? 'Conforme' : f.statut === 'anomalie' ? 'Anomalie' : 'Non testée'}
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

        <TabsContent value="equipe" className="mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">{t('quality.watchpoint_owner')} — Testeurs ({equipe.testeurs.length})</CardTitle>
              </CardHeader>
              <CardContent>
                {equipe.testeurs.length === 0 ? (
                  <p className="text-sm text-gray-500">{t('quality.watchpoint_empty')}</p>
                ) : (
                  <div className="space-y-2">
                    {equipe.testeurs.map((m) => (
                      <div key={m.id} className="flex items-center gap-3 p-2 rounded-lg bg-gray-50">
                        <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-sm font-medium text-indigo-700">
                          {(m.first_name?.[0] ?? '').toUpperCase()}{(m.last_name?.[0] ?? '').toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-medium">{m.first_name} {m.last_name}</p>
                          <p className="text-xs text-gray-500">{m.email}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">{t('quality.watchpoint_owner')} — Développeurs ({equipe.developpeurs.length})</CardTitle>
              </CardHeader>
              <CardContent>
                {equipe.developpeurs.length === 0 ? (
                  <p className="text-sm text-gray-500">{t('quality.watchpoint_empty')}</p>
                ) : (
                  <div className="space-y-2">
                    {equipe.developpeurs.map((m) => (
                      <div key={m.id} className="flex items-center gap-3 p-2 rounded-lg bg-gray-50">
                        <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-sm font-medium text-emerald-700">
                          {(m.first_name?.[0] ?? '').toUpperCase()}{(m.last_name?.[0] ?? '').toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-medium">{m.first_name} {m.last_name}</p>
                          <p className="text-xs text-gray-500">{m.email}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="stats" className="mt-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="py-6 text-center">
                <div className="text-3xl font-bold text-blue-600">{campagnes.length}</div>
                <p className="text-sm text-gray-500 mt-1">{t('products.tab_releases')}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="py-6 text-center">
                <div className="text-3xl font-bold text-indigo-600">{totalFeatures}</div>
                <p className="text-sm text-gray-500 mt-1">Fonctionnalités</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="py-6 text-center">
                <div className="text-3xl font-bold text-emerald-600">{featuresConformes}</div>
                <p className="text-sm text-gray-500 mt-1">Conformes</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="py-6 text-center">
                <div className={`text-3xl font-bold ${totalAnomalies > 0 ? 'text-red-600' : 'text-gray-400'}`}>{totalAnomalies}</div>
                <p className="text-sm text-gray-500 mt-1">Anomalies</p>
              </CardContent>
            </Card>
          </div>
          {totalFeatures > 0 && (
            <Card className="mt-4">
              <CardHeader>
                <CardTitle className="text-base">Couverture</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Conformes</span>
                    <span className="font-medium">{Math.round((featuresConformes / totalFeatures) * 100)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="h-2 rounded-full bg-emerald-500" style={{ width: `${(featuresConformes / totalFeatures) * 100}%` }} />
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Anomalies</span>
                    <span className="font-medium">{Math.round((featuresAnomalie / totalFeatures) * 100)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="h-2 rounded-full bg-red-500" style={{ width: `${(featuresAnomalie / totalFeatures) * 100}%` }} />
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Non testées</span>
                    <span className="font-medium">{Math.round(((totalFeatures - featuresConformes - featuresAnomalie) / totalFeatures) * 100)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="h-2 rounded-full bg-gray-400" style={{ width: `${((totalFeatures - featuresConformes - featuresAnomalie) / totalFeatures) * 100}%` }} />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={dialogEditOpen} onOpenChange={setDialogEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('common.edit')}</DialogTitle>
            <DialogDescription>{projet.nom}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-nom">{t('campagne.list.required_name')}</Label>
              <Input
                id="edit-nom"
                value={editForm.nom}
                onChange={(e) => { setEditForm({ ...editForm, nom: e.target.value }); if (editErrors.nom) setEditErrors({ nom: '' }); }}
                className={editErrors.nom ? 'border-red-500 focus:border-red-500' : ''}
              />
              {editErrors.nom && <p className="text-sm text-red-500">{editErrors.nom}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-desc">{t('common.description')}</Label>
              <Textarea id="edit-desc" value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} rows={3} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-debut">{t('campagne.list.start_date')}</Label>
                <Input id="edit-debut" type="date" value={editForm.dateDebut} onChange={(e) => setEditForm({ ...editForm, dateDebut: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-fin">{t('campagne.list.end_date')}</Label>
                <Input id="edit-fin" type="date" value={editForm.dateFin} onChange={(e) => setEditForm({ ...editForm, dateFin: e.target.value })} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogEditOpen(false)}>{t('common.cancel')}</Button>
            <Button onClick={soumettreEdit}>{t('common.save')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={projetASupprimer} onOpenChange={(o) => !o && setProjetASupprimer(false)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('common.delete')}</AlertDialogTitle>
            <AlertDialogDescription>{t('products.delete_confirm', { nom: projet.nom })}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={actionEnCours}>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction className="bg-red-600 hover:bg-red-700" disabled={actionEnCours} onClick={(e) => { e.preventDefault(); confirmerSuppression(); }}>
              {actionEnCours ? t('common.loading') : t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
