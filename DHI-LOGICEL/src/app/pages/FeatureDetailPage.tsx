import { useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, useNavigate, useSearchParams } from 'react-router';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../components/ui/alert-dialog';
import { ArrowLeft, Activity, AlertCircle, Loader2, Plus, Pencil, Trash2, Link2, Target, FileText } from 'lucide-react';
import { FeatureDetail, TestCaseItem, AnomalyItem, featureDetailService } from '../services/featureDetailService';
import { Exigence, Scenario, TypeExigence, TypeTest, Priorite } from '../types';
import { getErrorMessage } from '../services/api';

const TYPES_EXIGENCE: TypeExigence[] = ['fonctionnelle', 'securite', 'performance', 'disponibilite', 'ergonomie', 'accessibilite', 'maintenabilite', 'compatibilite', 'resilience', 'observabilite', 'documentation', 'testabilite', 'personnalisee'];
const TYPES_TEST: TypeTest[] = ['fonctionnel', 'integration', 'end_to_end', 'regression', 'unitaire', 'api', 'interface', 'securite', 'performance', 'charge', 'stress', 'endurance', 'resilience', 'compatibilite', 'accessibilite', 'ergonomie', 'disponibilite', 'recuperation', 'installation', 'migration', 'documentation', 'testabilite', 'personnalise'];
const LABELS_TYPES_EXIGENCE: Record<string, string> = {
  fonctionnelle: 'Fonctionnelle', securite: 'Sécurité', performance: 'Performance', disponibilite: 'Disponibilité',
  ergonomie: 'Ergonomie', accessibilite: 'Accessibilité', maintenabilite: 'Maintenabilité', compatibilite: 'Compatibilité',
  resilience: 'Résilience', observabilite: 'Observabilité', documentation: 'Documentation', testabilite: 'Testabilité', personnalisee: 'Personnalisée',
};
const LABELS_TYPES_TEST: Record<string, string> = {
  fonctionnel: 'Fonctionnel', integration: 'Intégration', end_to_end: 'End-to-end', regression: 'Régression',
  unitaire: 'Unitaire', api: 'API', interface: 'Interface', securite: 'Sécurité', performance: 'Performance',
  charge: 'Charge', stress: 'Stress', endurance: 'Endurance', resilience: 'Résilience', compatibilite: 'Compatibilité',
  accessibilite: 'Accessibilité', ergonomie: 'Ergonomie', disponibilite: 'Disponibilité', recuperation: 'Récupération',
  installation: 'Installation', migration: 'Migration', documentation: 'Documentation', testabilite: 'Testabilité', personnalise: 'Personnalisé',
};

export function FeatureDetailPage() {
  const { t } = useTranslation();
  const { featureId } = useParams<{ featureId: string }>();
  const [searchParams] = useSearchParams();
  const campaignId = searchParams.get('campaignId') || '';
  const navigate = useNavigate();

  const [feature, setFeature] = useState<FeatureDetail | null>(null);
  const [testCases, setTestCases] = useState<TestCaseItem[]>([]);
  const [anomalies, setAnomalies] = useState<AnomalyItem[]>([]);
  const [exigences, setExigences] = useState<Exigence[]>([]);
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Dialogs
  const [dialogExigenceOpen, setDialogExigenceOpen] = useState(false);
  const [dialogScenarioOpen, setDialogScenarioOpen] = useState(false);
  const [dialogTCOpen, setDialogTCOpen] = useState(false);
  const [exigenceEnEdition, setExigenceEnEdition] = useState<Exigence | null>(null);
  const [scenarioEnEdition, setScenarioEnEdition] = useState<Scenario | null>(null);
  const [idASupprimer, setIdASupprimer] = useState<{ type: string; id: string } | null>(null);

  // Form exigence
  const [formExigence, setFormExigence] = useState({ titre: '', description: '', type: 'fonctionnelle' as TypeExigence, criticite: 'moyenne' as Priorite });
  // Form scenario
  const [formScenario, setFormScenario] = useState({ nom: '', description: '', priorite: 'moyenne' as Priorite });
  // Form test case
  const [formTC, setFormTC] = useState({ name: '', description: '', type: 'fonctionnel', expected_result: '', priority: 'medium' });

  const fetchAll = useCallback(async () => {
    if (!featureId) return;
    setLoading(true);
    setError('');
    try {
      if (campaignId) {
        const f = await featureDetailService.getFeature(campaignId, featureId);
        setFeature(f);
        const tc = await featureDetailService.getTestCases(campaignId, featureId);
        setTestCases(tc);
      }
      const an = await featureDetailService.getAnomalies(featureId!);
      setAnomalies(an);
      setExigences(featureDetailService.listExigences(featureId!));
      setScenarios(featureDetailService.listScenarios(featureId!));
    } catch (err: any) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [featureId, campaignId]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // ─── EXIGENCES ───
  const ouvrirExigence = (ex?: Exigence) => {
    if (ex) { setExigenceEnEdition(ex); setFormExigence({ titre: ex.titre, description: ex.description, type: ex.type, criticite: ex.criticite }); }
    else { setExigenceEnEdition(null); setFormExigence({ titre: '', description: '', type: 'fonctionnelle', criticite: 'moyenne' }); }
    setDialogExigenceOpen(true);
  };
  const sauvegarderExigence = () => {
    if (!formExigence.titre.trim() || !featureId) return;
    if (exigenceEnEdition) {
      featureDetailService.updateExigence(exigenceEnEdition.id, formExigence);
    } else {
      featureDetailService.createExigence({ ...formExigence, fonctionnaliteId: featureId, campagneId: campaignId || '', statut: 'a_verifier' });
    }
    toast.success(t('quality.toast.criteria_updated'));
    setDialogExigenceOpen(false);
    setExigences(featureDetailService.listExigences(featureId!));
  };
  const supprimerExigence = () => {
    if (!idASupprimer || idASupprimer.type !== 'exigence') return;
    featureDetailService.deleteExigence(idASupprimer.id);
    toast.success(t('quality.toast.criteria_deleted'));
    setIdASupprimer(null);
    setExigences(featureDetailService.listExigences(featureId!));
  };

  // ─── SCÉNARIOS ───
  const ouvrirScenario = (sc?: Scenario) => {
    if (sc) { setScenarioEnEdition(sc); setFormScenario({ nom: sc.nom, description: sc.description, priorite: sc.priorite }); }
    else { setScenarioEnEdition(null); setFormScenario({ nom: '', description: '', priorite: 'moyenne' }); }
    setDialogScenarioOpen(true);
  };
  const sauvegarderScenario = () => {
    if (!formScenario.nom.trim() || !featureId) return;
    if (scenarioEnEdition) {
      featureDetailService.updateScenario(scenarioEnEdition.id, formScenario);
    } else {
      featureDetailService.createScenario({ ...formScenario, fonctionnaliteId: featureId, campagneId: campaignId || '' });
    }
    toast.success(t('quality.toast.criteria_updated'));
    setDialogScenarioOpen(false);
    setScenarios(featureDetailService.listScenarios(featureId!));
  };
  const supprimerScenario = () => {
    if (!idASupprimer || idASupprimer.type !== 'scenario') return;
    featureDetailService.deleteScenario(idASupprimer.id);
    toast.success(t('quality.toast.criteria_deleted'));
    setIdASupprimer(null);
    setScenarios(featureDetailService.listScenarios(featureId!));
  };

  // ─── TEST CASES ───
  const creerTC = async () => {
    if (!formTC.name.trim() || !campaignId || !featureId) return;
    try {
      await featureDetailService.createTestCase(campaignId, featureId, formTC);
      toast.success(t('quality.toast.criteria_updated'));
      setDialogTCOpen(false);
      setFormTC({ name: '', description: '', type: 'fonctionnel', expected_result: '', priority: 'medium' });
      const tc = await featureDetailService.getTestCases(campaignId, featureId);
      setTestCases(tc);
    } catch (err: any) { toast.error(getErrorMessage(err)); }
  };
  const supprimerTC = async () => {
    if (!idASupprimer || idASupprimer.type !== 'tc' || !campaignId || !featureId) return;
    try {
      await featureDetailService.deleteTestCase(campaignId, featureId, idASupprimer.id);
      toast.success(t('quality.toast.criteria_deleted'));
      setIdASupprimer(null);
      const tc = await featureDetailService.getTestCases(campaignId, featureId);
      setTestCases(tc);
    } catch (err: any) { toast.error(getErrorMessage(err)); }
  };

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-slate-400" /><span className="ml-2 text-slate-500">{t('products.loading')}</span></div>;
  if (error || !feature) return (
    <Card><CardContent className="py-12 text-center">
      <AlertCircle className="w-12 h-12 text-red-300 mx-auto mb-4" />
      <p className="text-gray-500">{error || t('products.error')}</p>
      <Button variant="outline" size="sm" className="mt-4" onClick={() => navigate(-1)}><ArrowLeft className="w-4 h-4 mr-2" />Retour</Button>
    </CardContent></Card>
  );

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" className="-ml-2" onClick={() => navigate(-1)}>
        <ArrowLeft className="w-4 h-4 mr-2" />Retour
      </Button>

      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-violet-50 shrink-0">
            <Activity className="w-6 h-6 text-violet-600" />
          </div>
          <div className="min-w-0">
            <h2 className="text-2xl font-semibold truncate">{feature.name}</h2>
            <p className="text-sm text-gray-500">{feature.module || '—'}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Badge variant={feature.priority === 'critical' ? 'destructive' : feature.priority === 'high' ? 'default' : 'secondary'}>
            {feature.priority}
          </Badge>
          <Badge variant={feature.status === 'conforme' ? 'default' : feature.status === 'anomaly_detected' ? 'destructive' : 'secondary'}>
            {feature.status === 'conforme' ? 'Conforme' : feature.status === 'anomaly_detected' ? 'Anomalie' : 'Non testée'}
          </Badge>
        </div>
      </div>

      <Tabs defaultValue="exigences">
        <TabsList>
          <TabsTrigger value="exigences" className="gap-1.5"><FileText className="w-4 h-4" />Exigences ({exigences.length})</TabsTrigger>
          <TabsTrigger value="scenarios" className="gap-1.5"><Target className="w-4 h-4" />Scénarios ({scenarios.length})</TabsTrigger>
          <TabsTrigger value="tc" className="gap-1.5"><Activity className="w-4 h-4" />Cas de test ({testCases.length})</TabsTrigger>
          <TabsTrigger value="anomalies" className="gap-1.5"><AlertCircle className="w-4 h-4" />Anomalies ({anomalies.length})</TabsTrigger>
          <TabsTrigger value="deps" className="gap-1.5"><Link2 className="w-4 h-4" />Dépendances</TabsTrigger>
        </TabsList>

        {/* ─── EXIGENCES ─── */}
        <TabsContent value="exigences" className="mt-4">
          <div className="flex justify-end mb-4">
            <Button size="sm" onClick={() => ouvrirExigence()}><Plus className="w-4 h-4 mr-1.5" />Ajouter</Button>
          </div>
          {exigences.length === 0 ? (
            <Card><CardContent className="py-10 text-center"><FileText className="w-10 h-10 text-gray-300 mx-auto mb-3" /><p className="text-gray-500">{t('quality.criteria_empty')}</p></CardContent></Card>
          ) : (
            <div className="space-y-2">
              {exigences.map((ex) => (
                <Card key={ex.id}>
                  <CardContent className="py-3 px-4 flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <p className="font-medium truncate">{ex.titre}</p>
                      <p className="text-sm text-gray-500 line-clamp-1">{ex.description}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge variant="outline">{LABELS_TYPES_EXIGENCE[ex.type]}</Badge>
                      <Badge variant={ex.criticite === 'critique' || ex.criticite === 'haute' ? 'destructive' : 'secondary'}>{ex.criticite}</Badge>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => ouvrirExigence(ex)}><Pencil className="w-3.5 h-3.5" /></Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-red-600" onClick={() => setIdASupprimer({ type: 'exigence', id: ex.id })}><Trash2 className="w-3.5 h-3.5" /></Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ─── SCÉNARIOS ─── */}
        <TabsContent value="scenarios" className="mt-4">
          <div className="flex justify-end mb-4">
            <Button size="sm" onClick={() => ouvrirScenario()}><Plus className="w-4 h-4 mr-1.5" />Ajouter</Button>
          </div>
          {scenarios.length === 0 ? (
            <Card><CardContent className="py-10 text-center"><Target className="w-10 h-10 text-gray-300 mx-auto mb-3" /><p className="text-gray-500">Aucun scénario</p></CardContent></Card>
          ) : (
            <div className="space-y-2">
              {scenarios.map((sc) => (
                <Card key={sc.id}>
                  <CardContent className="py-3 px-4 flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <p className="font-medium truncate">{sc.nom}</p>
                      <p className="text-sm text-gray-500 line-clamp-1">{sc.description}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge variant={sc.priorite === 'critique' || sc.priorite === 'haute' ? 'destructive' : 'secondary'}>{sc.priorite}</Badge>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => ouvrirScenario(sc)}><Pencil className="w-3.5 h-3.5" /></Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-red-600" onClick={() => setIdASupprimer({ type: 'scenario', id: sc.id })}><Trash2 className="w-3.5 h-3.5" /></Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ─── CAS DE TEST ─── */}
        <TabsContent value="tc" className="mt-4">
          <div className="flex justify-end mb-4">
            <Button size="sm" onClick={() => setDialogTCOpen(true)}><Plus className="w-4 h-4 mr-1.5" />Ajouter</Button>
          </div>
          {testCases.length === 0 ? (
            <Card><CardContent className="py-10 text-center"><Activity className="w-10 h-10 text-gray-300 mx-auto mb-3" /><p className="text-gray-500">{t('quality.criteria_empty')}</p></CardContent></Card>
          ) : (
            <Card><CardContent className="p-0">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Nom</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Type</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Priorité</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Statut</th>
                    <th className="w-10"></th>
                  </tr>
                </thead>
                <tbody>
                  {testCases.map((tc) => (
                    <tr key={tc.id} className="border-b last:border-0 hover:bg-gray-50">
                      <td className="py-3 px-4 font-medium">{tc.name}</td>
                      <td className="py-3 px-4"><Badge variant="outline">{LABELS_TYPES_TEST[tc.type] || tc.type}</Badge></td>
                      <td className="py-3 px-4"><Badge variant={tc.priority === 'critical' || tc.priority === 'high' ? 'destructive' : 'secondary'}>{tc.priority}</Badge></td>
                      <td className="py-3 px-4"><Badge variant={tc.status === 'passed' ? 'default' : tc.status === 'failed' ? 'destructive' : 'secondary'}>{tc.status}</Badge></td>
                      <td className="py-3 px-4"><Button variant="ghost" size="icon" className="h-7 w-7 text-red-600" onClick={() => setIdASupprimer({ type: 'tc', id: tc.id })}><Trash2 className="w-3.5 h-3.5" /></Button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent></Card>
          )}
        </TabsContent>

        {/* ─── ANOMALIES ─── */}
        <TabsContent value="anomalies" className="mt-4">
          {anomalies.length === 0 ? (
            <Card><CardContent className="py-10 text-center"><AlertCircle className="w-10 h-10 text-gray-300 mx-auto mb-3" /><p className="text-gray-500">{t('quality.watchpoint_empty')}</p></CardContent></Card>
          ) : (
            <div className="space-y-2">
              {anomalies.map((a) => (
                <Card key={a.id}>
                  <CardContent className="py-3 px-4 flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <p className="font-medium truncate">{a.title || a.ticket_id}</p>
                      <p className="text-sm text-gray-500 line-clamp-1">{a.description}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge variant={a.severity === 'critical' || a.severity === 'high' ? 'destructive' : 'secondary'}>{a.severity}</Badge>
                      <Badge variant={a.status === 'resolved' ? 'default' : 'secondary'}>{a.status}</Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ─── DÉPENDANCES ─── */}
        <TabsContent value="deps" className="mt-4">
          <Card><CardContent className="py-10 text-center">
            <Link2 className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">Gestion des dépendances entre cas de test — Semaine 2</p>
          </CardContent></Card>
        </TabsContent>
      </Tabs>

      {/* ─── DIALOG EXIGENCE ─── */}
      <Dialog open={dialogExigenceOpen} onOpenChange={setDialogExigenceOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{exigenceEnEdition ? 'Modifier' : 'Ajouter'} une exigence</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Titre *</Label>
              <Input value={formExigence.titre} onChange={(e) => setFormExigence({ ...formExigence, titre: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea value={formExigence.description} onChange={(e) => setFormExigence({ ...formExigence, description: e.target.value })} rows={3} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Type</Label>
                <Select value={formExigence.type} onValueChange={(v) => setFormExigence({ ...formExigence, type: v as TypeExigence })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {TYPES_EXIGENCE.map((te) => <SelectItem key={te} value={te}>{LABELS_TYPES_EXIGENCE[te]}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Criticité</Label>
                <Select value={formExigence.criticite} onValueChange={(v) => setFormExigence({ ...formExigence, criticite: v as any })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {['basse', 'moyenne', 'haute', 'critique'].map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogExigenceOpen(false)}>{t('common.cancel')}</Button>
            <Button onClick={sauvegarderExigence}>{t('common.save')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── DIALOG SCÉNARIO ─── */}
      <Dialog open={dialogScenarioOpen} onOpenChange={setDialogScenarioOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{scenarioEnEdition ? 'Modifier' : 'Ajouter'} un scénario</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nom *</Label>
              <Input value={formScenario.nom} onChange={(e) => setFormScenario({ ...formScenario, nom: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea value={formScenario.description} onChange={(e) => setFormScenario({ ...formScenario, description: e.target.value })} rows={3} />
            </div>
            <div className="space-y-2">
              <Label>Priorité</Label>
              <Select value={formScenario.priorite} onValueChange={(v) => setFormScenario({ ...formScenario, priorite: v as any })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {['basse', 'moyenne', 'haute', 'critique'].map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogScenarioOpen(false)}>{t('common.cancel')}</Button>
            <Button onClick={sauvegarderScenario}>{t('common.save')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── DIALOG TEST CASE ─── */}
      <Dialog open={dialogTCOpen} onOpenChange={setDialogTCOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Ajouter un cas de test</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2"><Label>Nom *</Label><Input value={formTC.name} onChange={(e) => setFormTC({ ...formTC, name: e.target.value })} /></div>
            <div className="space-y-2"><Label>Description</Label><Textarea value={formTC.description} onChange={(e) => setFormTC({ ...formTC, description: e.target.value })} rows={2} /></div>
            <div className="space-y-2"><Label>Résultat attendu</Label><Textarea value={formTC.expected_result} onChange={(e) => setFormTC({ ...formTC, expected_result: e.target.value })} rows={2} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Type</Label>
                <Select value={formTC.type} onValueChange={(v) => setFormTC({ ...formTC, type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{TYPES_TEST.map((tt) => <SelectItem key={tt} value={tt}>{LABELS_TYPES_TEST[tt]}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Priorité</Label>
                <Select value={formTC.priority} onValueChange={(v) => setFormTC({ ...formTC, priority: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{['low', 'medium', 'high', 'critical'].map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogTCOpen(false)}>{t('common.cancel')}</Button>
            <Button onClick={creerTC}>{t('common.save')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── SUPPRESSION ─── */}
      <AlertDialog open={!!idASupprimer} onOpenChange={(o) => !o && setIdASupprimer(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('common.delete')}</AlertDialogTitle>
            <AlertDialogDescription>{t('quality.toast.criteria_deleted')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={() => {
              if (idASupprimer?.type === 'exigence') supprimerExigence();
              else if (idASupprimer?.type === 'scenario') supprimerScenario();
              else if (idASupprimer?.type === 'tc') supprimerTC();
            }}>{t('common.delete')}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
