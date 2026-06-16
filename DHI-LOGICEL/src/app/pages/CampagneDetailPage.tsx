import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { ArrowLeft, Plus, TestTube, AlertTriangle, CheckCircle2, Clock, User, Play, Flag, X, Users, Trash2 } from 'lucide-react';
import { Fonctionnalite, Priorite, StatutFonctionnalite, TestCase } from '../types';
import { campaignService } from '../services/campaignService';
import { testCaseService } from '../services/testCaseService';
import { toast } from 'sonner';

export function CampagneDetailPage() {
  const { t } = useTranslation();
  const { campagneId } = useParams<{ campagneId: string }>();
  const { currentUser, users } = useAuth();
  const {
    campagnes, projets, fonctionnalites, anomalies,
    ajouterFonctionnalite, modifierFonctionnalite, modifierCampagne, ajouterNotification
  } = useData();
  const navigate = useNavigate();

  const isAdmin = currentUser?.role === 'admin';
  const [dialogOpen, setDialogOpen] = useState(false);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [ajoutMembreDialogOpen, setAjoutMembreDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('fonctionnalites');
  const [filtreStatut, setFiltreStatut] = useState<StatutFonctionnalite | 'tous'>('tous');
  const [formData, setFormData] = useState({
    nom: '', description: '', module: '',
    testeurAssigneId: '', developpeurAssigneId: '',
    priorite: 'moyenne' as Priorite
  });
  const [assignData, setAssignData] = useState({
    fonctionnaliteId: '', testeurAssigneId: '', developpeurAssigneId: '',
    priorite: 'moyenne' as Priorite
  });
  const [nouveauMembre, setNouveauMembre] = useState({
    userId: '', type: 'testeur' as 'testeur' | 'developpeur'
  });
  const [testCasesDialog, setTestCasesDialog] = useState(false);
  const [selectedFonctionnalite, setSelectedFonctionnalite] = useState<string | null>(null);
  const [testCases, setTestCases] = useState<TestCase[]>([]);
  const [newTestCase, setNewTestCase] = useState({ nom: '', steps: '', expectedResult: '', priority: 'moyenne' as Priorite });

  // Charger les cas de test quand une fonctionnalité est sélectionnée
  useEffect(() => {
    const loadTestCases = async () => {
      if (selectedFonctionnalite) {
        try {
          const cases = await testCaseService.list({ featureId: selectedFonctionnalite });
          setTestCases(cases);
        } catch (error) {
          console.error('Erreur chargement cas de test:', error);
        }
      }
    };
    loadTestCases();
  }, [selectedFonctionnalite]);

  const campagne = campagnes.find((c: any) => c.id === campagneId);
  const projet = projets.find((p: any) => p.id === campagne?.projetId);
  const isTerminee = campagne?.statut === 'terminee';
  const isArchive = campagne?.statut === 'archive';

  const handleChangerStatutCampagne = (statut: 'en_cours' | 'terminee') => {
    if (!campagneId) return;
    modifierCampagne(campagneId, { statut });
  };

  const handleAjouterMembre = async () => {
    if (!campagneId || !nouveauMembre.userId || !campagne) return;
    try {
      if (nouveauMembre.type === 'testeur') {
        const dedup = [...new Set(campagne.equipeTesteurs)];
        if (!dedup.includes(nouveauMembre.userId)) {
          await modifierCampagne(campagneId, { equipeTesteurs: [...dedup, nouveauMembre.userId] });
        }
      } else {
        const dedup = [...new Set(campagne.equipeDeveloppeurs)];
        if (!dedup.includes(nouveauMembre.userId)) {
          await modifierCampagne(campagneId, { equipeDeveloppeurs: [...dedup, nouveauMembre.userId] });
        }
      }
      setNouveauMembre({ userId: '', type: 'testeur' });
      setAjoutMembreDialogOpen(false);
    } catch (error) {
      console.error('Erreur lors de l\'ajout du membre:', error);
    }
  };

  const handleRetirerMembre = async (userId: string, type: 'testeur' | 'developpeur') => {
    if (!campagneId || !campagne) return;
    try {
      if (type === 'testeur') {
        await modifierCampagne(campagneId, { equipeTesteurs: campagne.equipeTesteurs.filter((id: string) => id !== userId) });
      } else {
        await modifierCampagne(campagneId, { equipeDeveloppeurs: campagne.equipeDeveloppeurs.filter((id: string) => id !== userId) });
      }
    } catch (error) {
      console.error('Erreur lors du retrait du membre:', error);
    }
  };

  const handleSupprimerCampagne = async () => {
    if (!campagneId) return;
    try {
      await campaignService.delete(campagneId);
      navigate('/campagnes');
    } catch (error) {
      alert(t('campagne.detail.delete_error') + ' ' + (error instanceof Error ? error.message : t('campagne.detail.delete_impossible')));
    }
  };

  const handleAjouterTestCase = async () => {
    if (!selectedFonctionnalite || !newTestCase.nom.trim()) {
      toast.error(t('campagne.detail.toast.testcase_name_required'));
      return;
    }
    try {
      await testCaseService.create({
        featureId: selectedFonctionnalite,
        nom: newTestCase.nom,
        steps: newTestCase.steps,
        expectedResult: newTestCase.expectedResult,
        priority: newTestCase.priority
      });
      setNewTestCase({ nom: '', steps: '', expectedResult: '', priority: 'moyenne' });
      const cases = await testCaseService.list({ featureId: selectedFonctionnalite });
      setTestCases(cases);
      toast.success(t('campagne.detail.toast.testcase_created'));
    } catch (error) {
      toast.error(t('campagne.detail.toast.testcase_error'));
      console.error(error);
    }
  };

  const handleSupprimerTestCase = async (testCaseId: string) => {
    if (!selectedFonctionnalite) return;
    try {
      await testCaseService.delete(testCaseId);
      const cases = await testCaseService.list({ featureId: selectedFonctionnalite });
      setTestCases(cases);
      toast.success(t('campagne.detail.toast.testcase_deleted'));
    } catch (error) {
      toast.error(t('campagne.detail.toast.testcase_delete_error'));
      console.error(error);
    }
  };

  const handleOpenAssignDialog = (fonctionnaliteId: string) => {
    setAssignData({ fonctionnaliteId, testeurAssigneId: '', developpeurAssigneId: '', priorite: 'moyenne' });
    setAssignDialogOpen(true);
  };

  const handleAssignerFonctionnalite = async () => {
    if (!assignData.fonctionnaliteId || !assignData.testeurAssigneId) return;
    try {
      await modifierFonctionnalite(assignData.fonctionnaliteId, {
        testeurAssigneId: assignData.testeurAssigneId,
        developpeurAssigneId: assignData.developpeurAssigneId || undefined,
        priorite: assignData.priorite,
        dateAssignation: new Date().toISOString()
      });
      setAssignDialogOpen(false);
    } catch (error) {
      console.error('Erreur lors de l\'assignation:', error);
    }
  };

  const fonctionnalitesCampagne = fonctionnalites.filter((f: any) => f.campagneId === campagneId);
  const anomaliesCampagne = anomalies.filter((a: any) => a.campagneId === campagneId);

  if (!campagne || !currentUser) {
    return <div className="text-center py-12"><p className="text-gray-500">{t('campagne.detail.not_found')}</p></div>;
  }

  const estChefProjet = projets.some(p => p.id === campagne.projetId && p.chefTesteurIds.includes(currentUser.id));
  const canEdit = currentUser.role === 'chef_testeur' && (campagne.chefTesteurIds.includes(currentUser.id) || estChefProjet);
  const canView = canEdit || currentUser.role === 'admin';

  if (!canView) {
    return <div className="text-center py-12"><p className="text-gray-500">{t('campagne.detail.access_denied')}</p></div>;
  }

  // Dédupliquer les IDs dans les équipes (évite les doublons)
  const equipeTesteursDedupliquee = [...new Set(campagne.equipeTesteurs)];
  const equipeDeveloppeursDedupliquee = [...new Set(campagne.equipeDeveloppeurs)];

  // Afficher TOUS les testeurs/développeurs disponibles
  const tousLesTesteurs = users.filter((u: any) => u.role === 'testeur');
  const tousLesDeveloppeurs = users.filter((u: any) => u.role === 'developpeur');

  // Pour l'affichage de l'équipe actuelle uniquement
  const testeurs = users.filter((u: any) => equipeTesteursDedupliquee.includes(String(u.id)));
  const developpeurs = users.filter((u: any) => equipeDeveloppeursDedupliquee.includes(String(u.id)));
  const fonctionnalitesFiltrees = fonctionnalitesCampagne.filter((f: any) => filtreStatut === 'tous' ? true : f.statut === filtreStatut);

  const stats = {
    total: fonctionnalitesCampagne.length,
    nonTestees: fonctionnalitesCampagne.filter((f: any) => f.statut === 'non_testee').length,
    conformes: fonctionnalitesCampagne.filter((f: any) => f.statut === 'conforme').length,
    anomalies: fonctionnalitesCampagne.filter((f: any) => f.statut === 'anomalie').length,
    anomaliesOuvertes: anomaliesCampagne.filter((a: any) => a.statut !== 'cloturee').length
  };

  const handleOpenDialog = () => {
    setFormData({ nom: '', description: '', module: '', testeurAssigneId: '', developpeurAssigneId: '', priorite: 'moyenne' as Priorite });
    setDialogOpen(true);
  };

  const handleAjouterFonctionnalite = async () => {
    if (!formData.nom.trim() || !formData.testeurAssigneId || !campagneId) return;
    try {
      await ajouterFonctionnalite({
        id: `f${Date.now()}`,
        campagneId,
        nom: formData.nom.trim(),
        description: formData.description.trim(),
        module: formData.module.trim(),
        testeurAssigneId: formData.testeurAssigneId,
        developpeurAssigneId: formData.developpeurAssigneId || undefined,
        statut: 'non_testee',
        priorite: formData.priorite,
        dateAssignation: new Date().toISOString()
      } as Fonctionnalite);
      setFormData({ nom: '', description: '', module: '', testeurAssigneId: '', developpeurAssigneId: '', priorite: 'moyenne' as Priorite });
      setDialogOpen(false);
    } catch (error) {
      console.error('Erreur lors de l\'ajout:', error);
    }
  };

  const getStatutBadge = (statut: StatutFonctionnalite) => {
    const config = {
      non_testee: { labelKey: 'campagne.detail.not_tested', className: 'bg-gray-100 text-gray-700' },
      conforme: { labelKey: 'campagne.detail.compliant', className: 'bg-green-100 text-green-700' },
      anomalie: { labelKey: 'common.anomalies', className: 'bg-red-100 text-red-700' }
    };
    const c = config[statut];
    return { ...c, label: t(c.labelKey) };
  };

  const getPrioriteBadge = (priorite: string) => {
    const config = {
      critique: 'bg-red-100 text-red-700', haute: 'bg-orange-100 text-orange-700',
      moyenne: 'bg-yellow-100 text-yellow-700', basse: 'bg-gray-100 text-gray-700'
    };
    return config[priorite as keyof typeof config];
  };

  const peutGerer = canEdit;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/campagnes')}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1">
          <h2 className="text-2xl font-semibold mb-1">{campagne.nom}</h2>
          <p className="text-gray-500">{projet?.nom}</p>
        </div>
        {campagne.statut === 'archive' && (
          <Badge className="bg-gray-100 text-gray-700 text-sm px-3 py-1">
            {t('campagne.detail.archived_badge')}
          </Badge>
        )}
        {peutGerer && campagne.statut === 'en_preparation' && (
          <Button variant="outline" className="gap-2 border-sky-300 text-sky-700 hover:bg-sky-50" onClick={() => handleChangerStatutCampagne('en_cours')}>
            <Play className="w-4 h-4" />{t('campagne.detail.start')}
          </Button>
        )}
        {peutGerer && campagne.statut === 'en_cours' && (
          <Button variant="outline" className="gap-2 border-emerald-300 text-emerald-700 hover:bg-emerald-50" onClick={() => handleChangerStatutCampagne('terminee')}>
            <Flag className="w-4 h-4" />{t('campagne.detail.end')}
          </Button>
        )}
        {peutGerer && !isArchive && (
          <>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={handleOpenDialog}>
                  <Plus className="w-4 h-4 mr-2" />{t('campagne.detail.assign_task')}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{t('campagne.detail.assign_title')}</DialogTitle>
                  <DialogDescription>{t('campagne.detail.assign_desc')}</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="nom">{t('campagne.detail.feature_name')}</Label>
                    <Input 
                      id="nom" 
                      value={formData.nom} 
                      onChange={(e) => setFormData({ ...formData, nom: e.target.value })} 
                      placeholder={t('campagne.detail.feature_name_placeholder')}
                      autoFocus
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="module">{t('campagne.detail.module')}</Label>
                    <Input id="module" value={formData.module} onChange={(e) => setFormData({ ...formData, module: e.target.value })} placeholder={t('campagne.detail.module_placeholder')} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">{t('campagne.detail.description')}</Label>
                    <Textarea id="description" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder={t('campagne.detail.description_placeholder')} rows={3} />
                  </div>
                  <div className="space-y-2">
                    <Label>{t('campagne.detail.priority')}</Label>
                    <Select value={formData.priorite || undefined} onValueChange={(value: Priorite) => setFormData({ ...formData, priorite: value })}>
                      <SelectTrigger><SelectValue placeholder={t('campagne.detail.select_priority')}>{formData.priorite && formData.priorite.charAt(0).toUpperCase() + formData.priorite.slice(1)}</SelectValue></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="critique">{t('priorite.critique')}</SelectItem>
                        <SelectItem value="haute">{t('priorite.haute')}</SelectItem>
                        <SelectItem value="moyenne">{t('priorite.moyenne')}</SelectItem>
                        <SelectItem value="basse">{t('priorite.basse')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>{t('campagne.detail.assign_to')}</Label>
                    <Select value={formData.testeurAssigneId || undefined} onValueChange={(value) => setFormData({ ...formData, testeurAssigneId: value })}>
                      <SelectTrigger><SelectValue placeholder={t('campagne.detail.select_tester')}>{formData.testeurAssigneId && tousLesTesteurs.find(t => t.id === formData.testeurAssigneId) ? `${tousLesTesteurs.find(t => t.id === formData.testeurAssigneId)?.prenom} ${tousLesTesteurs.find(t => t.id === formData.testeurAssigneId)?.nom}` : ''}</SelectValue></SelectTrigger>
                      <SelectContent>
                        {tousLesTesteurs.map(testeur => (
                          <SelectItem key={testeur.id} value={testeur.id}>{testeur.prenom} {testeur.nom}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>{t('campagne.detail.assign_dev')}</Label>
                    <Select value={formData.developpeurAssigneId || undefined} onValueChange={(value) => setFormData({ ...formData, developpeurAssigneId: value })}>
                      <SelectTrigger><SelectValue placeholder={t('campagne.detail.select_dev')}>{formData.developpeurAssigneId && tousLesDeveloppeurs.find(d => d.id === formData.developpeurAssigneId) ? `${tousLesDeveloppeurs.find(d => d.id === formData.developpeurAssigneId)?.prenom} ${tousLesDeveloppeurs.find(d => d.id === formData.developpeurAssigneId)?.nom}` : ''}</SelectValue></SelectTrigger>
                      <SelectContent>
                        {tousLesDeveloppeurs.map(dev => (
                          <SelectItem key={dev.id} value={dev.id}>{dev.prenom} {dev.nom}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setDialogOpen(false)}>{t('campagne.detail.cancel')}</Button>
                  <Button onClick={handleAjouterFonctionnalite}>{t('campagne.detail.assign')}</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            <Button variant="outline" className="gap-2 border-red-300 text-red-700 hover:bg-red-50"
              onClick={() => { if (confirm(t('campagne.detail.delete_confirm'))) handleSupprimerCampagne(); }}>
              <Trash2 className="w-4 h-4" />{t('campagne.detail.delete')}
            </Button>
          </>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card><CardHeader className="pb-3"><CardTitle className="text-sm font-medium text-gray-600">{t('campagne.detail.total')}</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{stats.total}</div></CardContent></Card>
        <Card><CardHeader className="pb-3"><CardTitle className="text-sm font-medium text-gray-600">{t('campagne.detail.not_tested')}</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-gray-600">{stats.nonTestees}</div></CardContent></Card>
        <Card><CardHeader className="pb-3"><CardTitle className="text-sm font-medium text-gray-600">{t('campagne.detail.compliant')}</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-green-600">{stats.conformes}</div></CardContent></Card>
        <Card><CardHeader className="pb-3"><CardTitle className="text-sm font-medium text-gray-600">{t('campagne.detail.anomalies_detected')}</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-red-600">{stats.anomalies}</div></CardContent></Card>
        <Card><CardHeader className="pb-3"><CardTitle className="text-sm font-medium text-gray-600">{t('campagne.detail.anomalies_open')}</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-orange-600">{stats.anomaliesOuvertes}</div></CardContent></Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="fonctionnalites">{t('campagne.detail.features_tab')}</TabsTrigger>
          <TabsTrigger value="testcases">{t('campagne.detail.testcases_tab')}</TabsTrigger>
          <TabsTrigger value="anomalies">{t('campagne.detail.anomalies_tab')}</TabsTrigger>
          <TabsTrigger value="equipe">{t('campagne.detail.team_tab')}</TabsTrigger>
        </TabsList>

        <TabsContent value="fonctionnalites" className="space-y-4">
          <div className="flex items-center gap-4">
            <h3 className="font-semibold">{t('campagne.detail.features_tab')}</h3>
            <Select value={filtreStatut} onValueChange={(value: StatutFonctionnalite | 'tous') => setFiltreStatut(value)}>
              <SelectTrigger className="w-48"><SelectValue placeholder={t('campagne.detail.filter_status')} /></SelectTrigger>
              <SelectContent>
                <SelectItem value="tous">{t('campagne.detail.all')}</SelectItem>
                <SelectItem value="non_testee">{t('campagne.detail.not_tested')}</SelectItem>
                <SelectItem value="conforme">{t('campagne.detail.compliant')}</SelectItem>
                <SelectItem value="anomalie">{t('common.anomalies')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-3">
            {fonctionnalitesFiltrees.map((fonctionnalite: any) => {
              const testeur = users.find((u: any) => u.id === fonctionnalite.testeurAssigneId);
              const statutBadge = getStatutBadge(fonctionnalite.statut);
              return (
                <Card key={fonctionnalite.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <h4 className="font-medium">{fonctionnalite.nom}</h4>
                          <Badge className={statutBadge.className}>{statutBadge.label}</Badge>
                          <Badge className={getPrioriteBadge(fonctionnalite.priorite)}>{t(`priorite.${fonctionnalite.priorite}`)}</Badge>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{fonctionnalite.description}</p>
                        <div className="flex gap-4 text-xs text-gray-500">
                          <span><strong>{t('campagne.detail.module')}:</strong> {fonctionnalite.module}</span>
                          <span><strong>{t('campagne.detail.tester_label')}:</strong> {testeur?.prenom} {testeur?.nom || t('campagne.detail.not_assigned')}</span>
                        </div>
                      </div>
                      {peutGerer && !isArchive && (
                        <Button size="sm" variant="outline"
                          onClick={() => handleOpenAssignDialog(fonctionnalite.id)}
                          disabled={fonctionnalite.statut === 'conforme' || isTerminee}>
                          {t('campagne.detail.assign')}
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
          {fonctionnalitesFiltrees.length === 0 && (
            <Card><CardContent className="py-12 text-center"><TestTube className="w-12 h-12 text-gray-300 mx-auto mb-4" /><p className="text-gray-500">{t('campagne.detail.no_features')}</p></CardContent></Card>
          )}
        </TabsContent>

        <TabsContent value="testcases" className="space-y-4">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>{t('campagne.detail.select_feature')}</Label>
              <Select value={selectedFonctionnalite || undefined} onValueChange={setSelectedFonctionnalite}>
                <SelectTrigger><SelectValue placeholder={t('campagne.detail.choose_feature')} /></SelectTrigger>
                <SelectContent>
                  {fonctionnalitesCampagne.map((f: any) => (
                    <SelectItem key={f.id} value={f.id}>{f.nom}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedFonctionnalite && (
              <div className="space-y-4">
                <Dialog open={testCasesDialog} onOpenChange={setTestCasesDialog}>
                  <DialogTrigger asChild>
                    <Button className="gap-2"><Plus className="w-4 h-4" />{t('campagne.detail.create_testcase')}</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>{t('campagne.detail.create_testcase_title')}</DialogTitle>
                      <DialogDescription>{t('campagne.detail.create_testcase_desc')}</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label>{t('campagne.detail.testcase_name')}</Label>
                        <Input
                          placeholder={t('campagne.detail.testcase_name_placeholder')}
                          value={newTestCase.nom}
                          onChange={(e) => setNewTestCase({ ...newTestCase, nom: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>{t('campagne.detail.test_steps')}</Label>
                        <Textarea
                          placeholder={t('campagne.detail.test_steps_placeholder')}
                          value={newTestCase.steps}
                          onChange={(e) => setNewTestCase({ ...newTestCase, steps: e.target.value })}
                          rows={3}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>{t('campagne.detail.expected_result')}</Label>
                        <Textarea
                          placeholder={t('campagne.detail.expected_result_placeholder')}
                          value={newTestCase.expectedResult}
                          onChange={(e) => setNewTestCase({ ...newTestCase, expectedResult: e.target.value })}
                          rows={2}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>{t('campagne.detail.testcase_priority')}</Label>
                        <Select value={newTestCase.priority} onValueChange={(value: Priorite) => setNewTestCase({ ...newTestCase, priority: value })}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="basse">{t('priorite.basse')}</SelectItem>
                            <SelectItem value="moyenne">{t('priorite.moyenne')}</SelectItem>
                            <SelectItem value="haute">{t('priorite.haute')}</SelectItem>
                            <SelectItem value="critique">{t('priorite.critique')}</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setTestCasesDialog(false)}>{t('campagne.detail.cancel')}</Button>
                      <Button onClick={handleAjouterTestCase}>{t('campagne.detail.create')}</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>

                <div className="space-y-3">
                  {testCases.map((tc) => (
                    <Card key={tc.id}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h4 className="font-medium">{tc.nom}</h4>
                              <Badge className={getPrioriteBadge(tc.priority)}>{t(`priorite.${tc.priority}`)}</Badge>
                            </div>
                            {tc.steps && (
                              <div className="mb-2">
                                <p className="text-sm font-medium text-gray-700 mb-1">{t('campagne.detail.steps_label')}</p>
                                <p className="text-sm text-gray-600 whitespace-pre-line">{tc.steps}</p>
                              </div>
                            )}
                            {tc.expectedResult && (
                              <div>
                                <p className="text-sm font-medium text-gray-700 mb-1">{t('campagne.detail.expected_result_label')}</p>
                                <p className="text-sm text-gray-600 whitespace-pre-line">{tc.expectedResult}</p>
                              </div>
                            )}
                          </div>
                          {peutGerer && !isArchive && (
                            <Button size="sm" variant="ghost" onClick={() => handleSupprimerTestCase(tc.id)}>
                              <Trash2 className="w-4 h-4 text-red-500" />
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  {testCases.length === 0 && (
                    <Card><CardContent className="py-12 text-center"><AlertTriangle className="w-12 h-12 text-gray-300 mx-auto mb-4" /><p className="text-gray-500">{t('campagne.detail.no_testcases')}</p></CardContent></Card>
                  )}
                </div>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="anomalies" className="space-y-4">
          <div className="space-y-3">
            {anomaliesCampagne.map((anomalie: any) => {
              const fonctionnalite = fonctionnalites.find((f: any) => f.id === anomalie.fonctionnaliteId);
              const testeur = users.find((u: any) => u.id === anomalie.testeurId);
              const developpeur = users.find((u: any) => u.id === anomalie.developpeurId);
              const statutBadge: Record<string, string> = {
                nouvelle: 'bg-red-100 text-red-700', en_cours: 'bg-blue-100 text-blue-700',
                resolution_signalee: 'bg-green-100 text-green-700', cloturee: 'bg-gray-100 text-gray-700'
              };
              return (
                <Card key={anomalie.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate(`/anomalies/${anomalie.id}`)}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <h4 className="font-medium">{anomalie.titre}</h4>
                          <Badge className={statutBadge[anomalie.statut] || 'bg-gray-100 text-gray-700'}>{t(`statut.${anomalie.statut}`)}</Badge>
                          <Badge className={getPrioriteBadge(anomalie.priorite)}>{t(`priorite.${anomalie.priorite}`)}</Badge>
                        </div>
                        <p className="text-sm text-gray-600 mb-2 line-clamp-2">{anomalie.description}</p>
                        <div className="flex gap-4 text-xs text-gray-500">
                          <span><strong>{t('campagne.detail.feature_label')}:</strong> {fonctionnalite?.nom}</span>
                          <span><strong>{t('campagne.detail.tester_label')}:</strong> {testeur?.prenom} {testeur?.nom}</span>
                          <span><strong>{t('campagne.detail.dev_label')}:</strong> {developpeur?.prenom} {developpeur?.nom}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
          {anomaliesCampagne.length === 0 && (
            <Card><CardContent className="py-12 text-center"><AlertTriangle className="w-12 h-12 text-gray-300 mx-auto mb-4" /><p className="text-gray-500">{t('common.no_anomalies')}</p></CardContent></Card>
          )}
        </TabsContent>

        <TabsContent value="equipe" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <CardTitle className="text-base">{t('campagne.detail.tester_team')}</CardTitle>
                {peutGerer && !isArchive && <Button size="sm" variant="outline" onClick={() => setAjoutMembreDialogOpen(true)}><Plus className="w-4 h-4 mr-1" />{t('campagne.detail.add')}</Button>}
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {testeurs.map((testeur: any) => (
                    <div key={testeur.id} className="flex items-center justify-between p-2 rounded-lg bg-gray-50">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-gray-400" />
                        <div>
                          <p className="text-sm font-medium">{testeur.prenom} {testeur.nom}</p>
                          <p className="text-xs text-gray-500">{testeur.email}</p>
                        </div>
                      </div>
                      {peutGerer && !isArchive && <Button size="sm" variant="ghost" onClick={() => handleRetirerMembre(testeur.id, 'testeur')}><X className="w-4 h-4" /></Button>}
                    </div>
                  ))}
                  {testeurs.length === 0 && <p className="text-sm text-gray-500 text-center py-4">{t('campagne.detail.no_tester')}</p>}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <CardTitle className="text-base">{t('campagne.detail.dev_team')}</CardTitle>
                {peutGerer && !isArchive && <Button size="sm" variant="outline" onClick={() => setAjoutMembreDialogOpen(true)}><Plus className="w-4 h-4 mr-1" />{t('campagne.detail.add')}</Button>}
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {developpeurs.map((dev: any) => (
                    <div key={dev.id} className="flex items-center justify-between p-2 rounded-lg bg-gray-50">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-gray-400" />
                        <div>
                          <p className="text-sm font-medium">{dev.prenom} {dev.nom}</p>
                          <p className="text-xs text-gray-500">{dev.email}</p>
                        </div>
                      </div>
                      {peutGerer && !isArchive && <Button size="sm" variant="ghost" onClick={() => handleRetirerMembre(dev.id, 'developpeur')}><X className="w-4 h-4" /></Button>}
                    </div>
                  ))}
                  {developpeurs.length === 0 && <p className="text-sm text-gray-500 text-center py-4">{t('campagne.detail.no_dev')}</p>}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Dialog assignation fonctionnalité existante */}
      <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('campagne.detail.existing_assign_title')}</DialogTitle>
            <DialogDescription>{t('campagne.detail.existing_assign_desc')}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>{t('campagne.detail.assign_to')}</Label>
              <Select value={assignData.testeurAssigneId || undefined} onValueChange={(value) => setAssignData({ ...assignData, testeurAssigneId: value })}>
                <SelectTrigger><SelectValue placeholder={t('campagne.detail.select_tester')}>{assignData.testeurAssigneId && tousLesTesteurs.find(t => t.id === assignData.testeurAssigneId) ? `${tousLesTesteurs.find(t => t.id === assignData.testeurAssigneId)?.prenom} ${tousLesTesteurs.find(t => t.id === assignData.testeurAssigneId)?.nom}` : ''}</SelectValue></SelectTrigger>
                <SelectContent>
                  {tousLesTesteurs.map((testeur: any) => (
                    <SelectItem key={testeur.id} value={testeur.id}>{testeur.prenom} {testeur.nom}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{t('campagne.detail.assign_dev')}</Label>
              <Select value={assignData.developpeurAssigneId || undefined} onValueChange={(value) => setAssignData({ ...assignData, developpeurAssigneId: value })}>
                <SelectTrigger><SelectValue placeholder={t('campagne.detail.select_dev')}>{assignData.developpeurAssigneId && tousLesDeveloppeurs.find(d => d.id === assignData.developpeurAssigneId) ? `${tousLesDeveloppeurs.find(d => d.id === assignData.developpeurAssigneId)?.prenom} ${tousLesDeveloppeurs.find(d => d.id === assignData.developpeurAssigneId)?.nom}` : ''}</SelectValue></SelectTrigger>
                <SelectContent>
                  {tousLesDeveloppeurs.map(dev => (
                    <SelectItem key={dev.id} value={dev.id}>{dev.prenom} {dev.nom}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{t('campagne.detail.priority')}</Label>
              <Select value={assignData.priorite || undefined} onValueChange={(value: Priorite) => setAssignData({ ...assignData, priorite: value })}>
                <SelectTrigger><SelectValue placeholder={t('campagne.detail.select_priority')} /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="critique">{t('priorite.critique')}</SelectItem>
                  <SelectItem value="haute">{t('priorite.haute')}</SelectItem>
                  <SelectItem value="moyenne">{t('priorite.moyenne')}</SelectItem>
                  <SelectItem value="basse">{t('priorite.basse')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignDialogOpen(false)}>{t('campagne.detail.cancel')}</Button>
            <Button onClick={handleAssignerFonctionnalite}>{t('campagne.detail.assign')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog ajout membre */}
      <Dialog open={ajoutMembreDialogOpen} onOpenChange={setAjoutMembreDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('campagne.detail.add_member_title')}</DialogTitle>
            <DialogDescription>{t('campagne.detail.add_member_desc')}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>{t('campagne.detail.member_type')}</Label>
              <Select value={nouveauMembre.type || undefined} onValueChange={(value: 'testeur' | 'developpeur') => setNouveauMembre({ ...nouveauMembre, type: value })}>
                <SelectTrigger><SelectValue placeholder={t('campagne.detail.select_role')} /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="testeur">{t('campagne.detail.tester_role')}</SelectItem>
                  <SelectItem value="developpeur">{t('campagne.detail.dev_role')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{t('campagne.detail.member')}</Label>
              <Select value={nouveauMembre.userId || undefined} onValueChange={(value) => setNouveauMembre({ ...nouveauMembre, userId: value })}>
                <SelectTrigger><SelectValue placeholder={t('campagne.detail.select_member')} /></SelectTrigger>
                <SelectContent>
                  {(nouveauMembre.type === 'testeur' ? tousLesTesteurs : tousLesDeveloppeurs)
                    .filter((u: any) => !(nouveauMembre.type === 'testeur' ? equipeTesteursDedupliquee : equipeDeveloppeursDedupliquee).includes(u.id))
                    .map((user: any) => (
                      <SelectItem key={user.id} value={user.id}>{user.prenom} {user.nom}</SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAjoutMembreDialogOpen(false)}>{t('campagne.detail.cancel')}</Button>
            <Button onClick={handleAjouterMembre}>{t('campagne.detail.add')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}