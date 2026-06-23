import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { useNavigate } from 'react-router';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { CheckCircle2, XCircle, Clock, AlertTriangle, Sparkles, UserCheck, Search } from 'lucide-react';
import { StatutFonctionnalite, Anomalie, TestCase } from '../types';
import { suggerePriorite, suggereDeveloppeur } from '../services/aiService';
import { testCaseService } from '../services/testCaseService';
import { useDebounce } from '../hooks/useDebounce';

export function TesteurTachesPage() {
  const { t } = useTranslation();
  const { currentUser, users } = useAuth();
  const isAdmin = currentUser?.role === 'admin';
  const { 
    fonctionnalites, 
    campagnes, 
    projets,
    anomalies,
    changerStatutFonctionnalite,
    ajouterAnomalie,
    ajouterNotification
  } = useData();
  const navigate = useNavigate();
  
  const [dialogStatutOpen, setDialogStatutOpen] = useState(false);
  const [fonctionnaliteSelectionnee, setFonctionnaliteSelectionnee] = useState<string | null>(null);
  const [nouveauStatut, setNouveauStatut] = useState<StatutFonctionnalite>('conforme');
  const [descriptionAnomalie, setDescriptionAnomalie] = useState('');
  const [titreAnomalie, setTitreAnomalie] = useState('');
  const [developpeurSelectionne, setDeveloppeurSelectionne] = useState('');
  const [testCaseSelectionne, setTestCaseSelectionne] = useState('');
  const [testCases, setTestCases] = useState<TestCase[]>([]);
  const [priorite, setPriorite] = useState<'basse' | 'moyenne' | 'haute' | 'critique'>('moyenne');
  
  // États pour les filtres
  const [filtreStatut, setFiltreStatut] = useState<string>('tous');
  const [filtreCampagne, setFiltreCampagne] = useState<string>('tous');
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 300);
  
  // États pour les suggestions IA
  const [suggestionPriorite, setSuggestionPriorite] = useState<'basse' | 'moyenne' | 'haute' | 'critique' | null>(null);
  const [suggestionDeveloppeur, setSuggestionDeveloppeur] = useState<string | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const isFormAnomalieValide =
    nouveauStatut !== 'anomalie' ||
    (!!titreAnomalie && !!descriptionAnomalie && !!developpeurSelectionne);

  if (!currentUser || (currentUser.role !== 'testeur' && currentUser.role !== 'admin')) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">{t('testeur.tasks.access_denied')}</p>
      </div>
    );
  }

  // Pour l'admin, voir toutes les tâches. Pour le testeur, voir seulement les siennes
  const mesTaches = isAdmin
    ? fonctionnalites
    : fonctionnalites.filter(f => f.testeurAssigneId === currentUser.id);
  const developpeurs = users.filter(u => u.role === 'developpeur');

  const mesTachesFiltrees = mesTaches.filter(f => {
    if (filtreStatut !== 'tous' && f.statut !== filtreStatut) return false;
    if (filtreCampagne !== 'tous' && f.campagneId !== filtreCampagne) return false;
    if (debouncedSearch) {
      const q = debouncedSearch.toLowerCase();
      if (!f.nom?.toLowerCase().includes(q) && !f.description?.toLowerCase().includes(q) && !f.module?.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  // Grouper les tâches filtrées par campagne
  const tachesParCampagne = mesTachesFiltrees.reduce((acc, f) => {
    const campagneId = f.campagneId;
    if (!acc[campagneId]) acc[campagneId] = [];
    acc[campagneId].push(f);
    return acc;
  }, {} as Record<string, typeof mesTachesFiltrees>);

  const campagnesOrdonnees = Object.keys(tachesParCampagne).sort();

  // Effet pour suggérer la priorité quand le titre ou la description changent
  useEffect(() => {
    if (titreAnomalie || descriptionAnomalie) {
      const prioriteSuggeree = suggerePriorite(titreAnomalie, descriptionAnomalie);
      setSuggestionPriorite(prioriteSuggeree);
      setShowSuggestions(true);
    } else {
      setSuggestionPriorite(null);
      setShowSuggestions(false);
    }
  }, [titreAnomalie, descriptionAnomalie]);

  // Effet pour suggérer le développeur quand le titre ou la description changent
  useEffect(() => {
    if (titreAnomalie || descriptionAnomalie) {
      const fonctionnalite = fonctionnalites.find(f => f.id === fonctionnaliteSelectionnee);
      const devSuggere = suggereDeveloppeur(
        { titre: titreAnomalie, description: descriptionAnomalie, module: fonctionnalite?.module },
        anomalies,
        developpeurs
      );
      setSuggestionDeveloppeur(devSuggere);
    } else {
      setSuggestionDeveloppeur(null);
    }
  }, [titreAnomalie, descriptionAnomalie, fonctionnaliteSelectionnee, anomalies, developpeurs]);

  const handleOpenDialogStatut = (fonctionnaliteId: string, statut: StatutFonctionnalite) => {
    setFonctionnaliteSelectionnee(fonctionnaliteId);
    setNouveauStatut(statut);
    setDescriptionAnomalie('');
    setTitreAnomalie('');
    setDeveloppeurSelectionne('');
    setTestCaseSelectionne('');
    setTestCases([]);
    setPriorite('moyenne');
    setSuggestionPriorite(null);
    setSuggestionDeveloppeur(null);
    setShowSuggestions(false);
    setDialogStatutOpen(true);
  };

  useEffect(() => {
    const loadTestCases = async () => {
      if (!fonctionnaliteSelectionnee) return;
      try {
        const cases = await testCaseService.list({ featureId: fonctionnaliteSelectionnee });
        setTestCases(cases);
      } catch (e) {
        console.error('Erreur chargement cas de test', e);
      }
    };
    loadTestCases();
  }, [fonctionnaliteSelectionnee]);

  const handleChangerStatut = () => {
    if (!fonctionnaliteSelectionnee) return;

    const fonctionnalite = fonctionnalites.find(f => f.id === fonctionnaliteSelectionnee);
    if (!fonctionnalite) return;

    if (nouveauStatut === 'anomalie') {
      if (fonctionnalite.statut === 'conforme') return;
      if (!titreAnomalie || !descriptionAnomalie || !developpeurSelectionne) {
        return;
      }

      // Créer l'anomalie
      const nouvelleAnomalie: Anomalie = {
        id: `a${Date.now()}`,
        testCaseId: testCaseSelectionne || undefined,
        fonctionnaliteId: fonctionnalite.id,
        campagneId: fonctionnalite.campagneId,
        titre: titreAnomalie,
        description: descriptionAnomalie,
        testeurId: currentUser.id,
        developpeurId: developpeurSelectionne,
        statut: 'nouvelle',
        priorite,
        dateCreation: new Date().toISOString()
      };

      ajouterAnomalie(nouvelleAnomalie);

      // Notifier le développeur
      ajouterNotification({
        id: `n${Date.now()}`,
        userId: developpeurSelectionne,
        type: 'anomalie',
        titre: t('testeur.tasks.report_anomaly_title'),
        message: t('testeur.tasks.notification_message', { titre: titreAnomalie }),
        lue: false,
        dateCreation: new Date().toISOString(),
        lienUrl: `/anomalies/${nouvelleAnomalie.id}`
      });
    }

    changerStatutFonctionnalite(fonctionnalite.id, nouveauStatut, currentUser.id);
    setDialogStatutOpen(false);
  };

  const getStatutIcon = (statut: StatutFonctionnalite) => {
    switch (statut) {
      case 'conforme':
        return <CheckCircle2 className="w-4 h-4 text-green-600" />;
      case 'anomalie':
        return <XCircle className="w-4 h-4 text-red-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const statutBadgeConfigTester: Record<StatutFonctionnalite, { labelKey: string; className: string }> = {
    non_testee: { labelKey: 'testeur.tasks.not_tested', className: 'bg-gray-100 text-gray-700' },
    conforme: { labelKey: 'testeur.tasks.mark_compliant', className: 'bg-green-100 text-green-700' },
    anomalie: { labelKey: 'testeur.tasks.report_anomaly', className: 'bg-red-100 text-red-700' }
  };

  const getStatutBadge = (statut: StatutFonctionnalite) => {
    const found = statutBadgeConfigTester[statut];
    return found ? { label: t(found.labelKey), className: found.className } : { label: statut, className: 'bg-gray-100 text-gray-700' };
  };

  const getPrioriteBadge = (priorite: string) => {
    const config = {
      critique: 'bg-red-100 text-red-700',
      haute: 'bg-orange-100 text-orange-700',
      moyenne: 'bg-yellow-100 text-yellow-700',
      basse: 'bg-gray-100 text-gray-700'
    };
    return config[priorite as keyof typeof config];
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold mb-1">{t('testeur.tasks.title')}</h2>
        <p className="text-gray-500">{t('testeur.tasks.subtitle')}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setFiltreStatut('tous')}>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">{t('testeur.tasks.total')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mesTaches.length}</div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setFiltreStatut('non_testee')}>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">{t('testeur.tasks.not_tested')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {mesTaches.filter(t => t.statut === 'non_testee').length}
            </div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setFiltreStatut('conforme')}>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">{t('testeur.tasks.compliant')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {mesTaches.filter(t => t.statut === 'conforme').length}
            </div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setFiltreStatut('anomalie')}>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">{t('testeur.tasks.anomalies')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {mesTaches.filter(t => t.statut === 'anomalie').length}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder={t('common.search')}
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={filtreStatut} onValueChange={setFiltreStatut}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder={t('campagne.detail.filter_status')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="tous">{t('common.all')}</SelectItem>
            <SelectItem value="non_testee">{t('testeur.tasks.not_tested')}</SelectItem>
            <SelectItem value="conforme">{t('testeur.tasks.compliant')}</SelectItem>
            <SelectItem value="anomalie">{t('testeur.tasks.anomalies')}</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filtreCampagne} onValueChange={setFiltreCampagne}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder={t('testeur.tasks.campagne')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="tous">{t('common.all')}</SelectItem>
            {campagnes.map(c => (
              <SelectItem key={c.id} value={c.id}>{c.nom}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-8">
        {campagnesOrdonnees.map(campagneId => {
          const campagne = campagnes.find(c => c.id === campagneId);
          const taches = tachesParCampagne[campagneId];
          return (
            <div key={campagneId}>
              <div className="flex items-center gap-2 mb-3">
                <h3 className="text-lg font-semibold text-slate-800">{campagne?.nom || campagneId}</h3>
                <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">{taches.length}</span>
              </div>
              <div className="space-y-3">
                {taches.map((fonctionnalite) => {
                  const projet = projets.find(p => p.id === campagne?.projetId);
                  const statutBadge = getStatutBadge(fonctionnalite.statut);
                  const derniereAnomalie = anomalies
                    .filter(a => a.fonctionnaliteId === fonctionnalite.id)
                    .sort((a, b) => new Date(b.dateCreation).getTime() - new Date(a.dateCreation).getTime())[0];

          return (
            <Card key={fonctionnalite.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-3">
                    <div className="flex items-start gap-3">
                      {getStatutIcon(fonctionnalite.statut)}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-medium">{fonctionnalite.nom}</h3>
                          <Badge className={statutBadge.className}>
                            {statutBadge.label}
                          </Badge>
                          <Badge className={getPrioriteBadge(fonctionnalite.priorite)}>
                            {fonctionnalite.priorite}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{fonctionnalite.description}</p>
                        <div className="flex gap-4 text-xs text-gray-500">
                          <span><strong>{t('testeur.tasks.module')}:</strong> {fonctionnalite.module}</span>
                          <span><strong>{t('testeur.tasks.campagne')}:</strong> {campagne?.nom}</span>
                          <span><strong>{t('testeur.tasks.projet')}:</strong> {projet?.nom}</span>
                        </div>
                        {fonctionnalite.dateAssignation && (
                          <p className="text-xs text-gray-500 mt-1">
                            {t('testeur.tasks.assigned_on')} {new Date(fonctionnalite.dateAssignation).toLocaleDateString('fr-FR')}
                          </p>
                        )}
                        {derniereAnomalie && (
                          <button
                            onClick={() => navigate(`/anomalies/${derniereAnomalie.id}`)}
                            className="text-xs text-indigo-500 hover:text-indigo-700 font-medium mt-1"
                          >
                            {t('testeur.tasks.view_anomaly_history')}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {fonctionnalite.statut !== 'conforme' && (
                    <div className="flex flex-col gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-green-600 border-green-600 hover:bg-green-50"
                        onClick={() => handleOpenDialogStatut(fonctionnalite.id, 'conforme')}
                        disabled={isAdmin}
                      >
                        <CheckCircle2 className="w-4 h-4 mr-1" />
                        {t('testeur.tasks.mark_compliant')}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-red-600 border-red-600 hover:bg-red-50"
                        onClick={() => handleOpenDialogStatut(fonctionnalite.id, 'anomalie')}
                        disabled={isAdmin}
                      >
                        <AlertTriangle className="w-4 h-4 mr-1" />
                        {t('testeur.tasks.report_anomaly')}
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
              </div>
            </div>
          );
        })}
      </div>

      {mesTachesFiltrees.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <Clock className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">{t('testeur.tasks.no_tasks')}</p>
          </CardContent>
        </Card>
      )}

      <Dialog open={dialogStatutOpen} onOpenChange={setDialogStatutOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {nouveauStatut === 'conforme' ? t('testeur.tasks.mark_compliant_title') : t('testeur.tasks.report_anomaly_title')}
            </DialogTitle>
            <DialogDescription>
              {nouveauStatut === 'conforme'
                ? t('testeur.tasks.mark_compliant_desc')
                : t('testeur.tasks.report_anomaly_desc')}
            </DialogDescription>
          </DialogHeader>
          
          {nouveauStatut === 'anomalie' && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="titre">{t('testeur.tasks.anomaly_title')}</Label>
                <Input
                  id="titre"
                  value={titreAnomalie}
                  onChange={(e) => setTitreAnomalie(e.target.value)}
                  placeholder={t('testeur.tasks.anomaly_title_placeholder')}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="priorite">{t('testeur.tasks.priority')}</Label>
                <Select value={priorite} onValueChange={(value: any) => setPriorite(value)}>
                  <SelectTrigger>
                    <SelectValue placeholder={t('testeur.tasks.select_priority')}>{priorite && t(`priorite.${priorite}`)}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="critique">{t('priorite.critique')}</SelectItem>
                    <SelectItem value="haute">{t('priorite.haute')}</SelectItem>
                    <SelectItem value="moyenne">{t('priorite.moyenne')}</SelectItem>
                    <SelectItem value="basse">{t('priorite.basse')}</SelectItem>
                  </SelectContent>
                </Select>
                {suggestionPriorite && suggestionPriorite !== priorite && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="mt-1 gap-1 text-purple-600 hover:text-purple-700 hover:bg-purple-50"
                    onClick={() => setPriorite(suggestionPriorite)}
                  >
                    <Sparkles className="w-3 h-3" />
                    {t('testeur.tasks.ia_suggests')} {t(`priorite.${suggestionPriorite}`)}
                  </Button>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">{t('testeur.tasks.description')}</Label>
                <Textarea
                  id="description"
                  value={descriptionAnomalie}
                  onChange={(e) => setDescriptionAnomalie(e.target.value)}
                  placeholder={t('testeur.tasks.description_placeholder')}
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="developpeur">{t('testeur.tasks.notify_developer')}</Label>
                <Select value={developpeurSelectionne || undefined} onValueChange={setDeveloppeurSelectionne} onClear={() => setDeveloppeurSelectionne('')}>
                  <SelectTrigger>
                    <SelectValue placeholder={t('testeur.tasks.select_developer')}>{developpeurSelectionne && developpeurs.find(d => d.id === developpeurSelectionne) ? `${developpeurs.find(d => d.id === developpeurSelectionne)?.prenom} ${developpeurs.find(d => d.id === developpeurSelectionne)?.nom}` : ''}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {developpeurs.map(dev => (
                      <SelectItem key={dev.id} value={dev.id}>
                        {dev.prenom} {dev.nom}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {suggestionDeveloppeur && suggestionDeveloppeur !== developpeurSelectionne && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="mt-1 gap-1 text-purple-600 hover:text-purple-700 hover:bg-purple-50"
                    onClick={() => setDeveloppeurSelectionne(suggestionDeveloppeur)}
                  >
                    <UserCheck className="w-3 h-3" />
                    {t('testeur.tasks.ia_suggests')} {developpeurs.find(d => d.id === suggestionDeveloppeur)?.prenom} {developpeurs.find(d => d.id === suggestionDeveloppeur)?.nom}
                  </Button>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="testcase">{t('testeur.tasks.test_case')}</Label>
                <Select value={testCaseSelectionne || undefined} onValueChange={setTestCaseSelectionne} onClear={() => setTestCaseSelectionne('')}>
                  <SelectTrigger>
                    <SelectValue placeholder={testCases.length ? t('testeur.tasks.select_test_case') : t('testeur.tasks.no_test_case')}>{testCaseSelectionne && testCases.find(tc => tc.id === testCaseSelectionne) ? testCases.find(tc => tc.id === testCaseSelectionne)?.nom : ''}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {testCases.map(tc => (
                      <SelectItem key={tc.id} value={tc.id}>
                        {tc.nom}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {testCases.length === 0 && (
                  <p className="text-xs text-red-500">
                    {t('testeur.tasks.no_test_case_msg')}
                  </p>
                )}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogStatutOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button onClick={handleChangerStatut} disabled={!isFormAnomalieValide}>
              {t('common.confirm')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}