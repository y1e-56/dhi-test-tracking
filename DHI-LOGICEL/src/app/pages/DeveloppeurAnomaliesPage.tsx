import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { useNavigate } from 'react-router';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Textarea } from '../components/ui/textarea';
import { Label } from '../components/ui/label';
import { AlertTriangle, Clock, CheckCircle2, Code, Play, Search, ChevronDown } from 'lucide-react';
import { StatutAnomalie } from '../types';
import { useDebounce } from '../hooks/useDebounce';

export function DeveloppeurAnomaliesPage() {
  const { t } = useTranslation();
  const { currentUser, users } = useAuth();
  const isAdmin = currentUser?.role === 'admin';
  const { anomalies, fonctionnalites, campagnes, projets, changerStatutAnomalie, signalerResolution } = useData();
  const navigate = useNavigate();
  const [filtreStatut, setFiltreStatut] = useState<StatutAnomalie | 'tous'>('tous');
  const [filtreCampagne, setFiltreCampagne] = useState<string>('tous');
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 300);
  const [dialogResolutionOpen, setDialogResolutionOpen] = useState(false);
  const [anomalieSelectionnee, setAnomalieSelectionnee] = useState<string | null>(null);
  const [commentaireResolution, setCommentaireResolution] = useState('');

  // Accordéon : IDs des groupes campagne repliés (ouvert par défaut)
  const [campagnesRepliees, setCampagnesRepliees] = useState<Set<string>>(new Set());
  const toggleCampagne = (id: string) =>
    setCampagnesRepliees(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const handlePrendreEnCharge = (anomalieId: string) => {
    if (!currentUser) return;
    changerStatutAnomalie(anomalieId, 'en_cours', currentUser.id);
  };

  const openResolutionDialog = (anomalieId: string) => {
    setAnomalieSelectionnee(anomalieId);
    setCommentaireResolution('');
    setDialogResolutionOpen(true);
  };

  const handleSignalerResolution = async () => {
    if (!anomalieSelectionnee || !currentUser || !commentaireResolution.trim()) return;
    await signalerResolution(anomalieSelectionnee, currentUser.id, commentaireResolution.trim());
    setDialogResolutionOpen(false);
    setAnomalieSelectionnee(null);
    setCommentaireResolution('');
  };

  if (!currentUser || (currentUser.role !== 'developpeur' && currentUser.role !== 'admin')) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">{t('developpeur.anomalies.access_denied')}</p>
      </div>
    );
  }

  // Pour l'admin, voir toutes les anomalies. Pour le développeur, voir seulement les siennes
  const mesAnomalies = currentUser.role === 'admin'
    ? anomalies
    : anomalies.filter(a => a.developpeurId === currentUser.id);
  
  const anomaliesFiltrees = mesAnomalies.filter(a => {
    if (filtreStatut !== 'tous') {
      const correspondCloturee = filtreStatut === 'cloturee' && a.statut === 'validee';
      if (a.statut !== filtreStatut && !correspondCloturee) return false;
    }
    if (filtreCampagne !== 'tous' && a.campagneId !== filtreCampagne) return false;
    if (debouncedSearch) {
      const q = debouncedSearch.toLowerCase();
      if (!a.titre?.toLowerCase().includes(q) && !a.description?.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const anomaliesParCampagne = anomaliesFiltrees.reduce((acc, a) => {
    const cId = a.campagneId;
    if (!acc[cId]) acc[cId] = [];
    acc[cId].push(a);
    return acc;
  }, {} as Record<string, typeof anomaliesFiltrees>);

  const campagnesOrdonnees = Object.keys(anomaliesParCampagne).sort();

  const badgeConfigDev: Record<StatutAnomalie, { labelKey: string; className: string }> = {
    nouvelle: { labelKey: 'statut.nouvelle', className: 'bg-red-100 text-red-700' },
    en_cours: { labelKey: 'statut.en_cours', className: 'bg-blue-100 text-blue-700' },
    resolution_signalee: { labelKey: 'statut.resolution_signalee', className: 'bg-green-100 text-green-700' },
    validee: { labelKey: 'statut.validee', className: 'bg-green-200 text-green-800' },
    cloturee: { labelKey: 'statut.cloturee', className: 'bg-gray-100 text-gray-700' }
  };

  const getStatutBadge = (statut: StatutAnomalie) => {
    const found = badgeConfigDev[statut];
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

  const getStatutIcon = (statut: StatutAnomalie) => {
    switch (statut) {
      case 'nouvelle':
        return <AlertTriangle className="w-5 h-5 text-red-600" />;
      case 'en_cours':
        return <Clock className="w-5 h-5 text-blue-600" />;
      case 'resolution_signalee':
      case 'validee':
      case 'cloturee':
        return <CheckCircle2 className="w-5 h-5 text-green-600" />;
      default:
        return <Code className="w-5 h-5 text-gray-400" />;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold mb-1">{t('developpeur.anomalies.title')}</h2>
        <p className="text-gray-500">{t('developpeur.anomalies.subtitle')}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => { setFiltreStatut('tous'); setSearchTerm(''); }}>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">{t('developpeur.anomalies.total')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mesAnomalies.length}</div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setFiltreStatut('nouvelle')}>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">{t('developpeur.anomalies.new')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {mesAnomalies.filter(a => a.statut === 'nouvelle').length}
            </div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setFiltreStatut('en_cours')}>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">{t('developpeur.anomalies.in_progress')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {mesAnomalies.filter(a => a.statut === 'en_cours').length}
            </div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setFiltreStatut('resolution_signalee')}>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">{t('developpeur.anomalies.resolved')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {mesAnomalies.filter(a => a.statut === 'resolution_signalee').length}
            </div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setFiltreStatut('cloturee')}>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">{t('developpeur.anomalies.closed')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-600">
              {mesAnomalies.filter(a => a.statut === 'cloturee' || a.statut === 'validee').length}
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
        <Select value={filtreStatut} onValueChange={(value: any) => setFiltreStatut(value)}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder={t('developpeur.anomalies.choose_status')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="tous">{t('developpeur.anomalies.all')}</SelectItem>
            <SelectItem value="nouvelle">{t('statut.nouvelle')}</SelectItem>
            <SelectItem value="en_cours">{t('statut.en_cours')}</SelectItem>
            <SelectItem value="resolution_signalee">{t('statut.resolution_signalee')}</SelectItem>
            <SelectItem value="cloturee">{t('statut.cloturee')}</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filtreCampagne} onValueChange={setFiltreCampagne}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder={t('developpeur.anomalies.campagne')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="tous">{t('developpeur.anomalies.all')}</SelectItem>
            {campagnes.map(c => (
              <SelectItem key={c.id} value={c.id}>{c.nom}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-8">
        {campagnesOrdonnees.map(campagneId => {
          const campagne = campagnes.find(c => c.id === campagneId);
          const anomaliesCampagne = anomaliesParCampagne[campagneId];
          const estRepliee = campagnesRepliees.has(campagneId);
          return (
            <div key={campagneId}>
              <button
                onClick={() => toggleCampagne(campagneId)}
                className="flex items-center gap-2 mb-3 group w-full text-left"
              >
                <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${estRepliee ? '-rotate-90' : ''}`} />
                <h3 className="text-lg font-semibold text-slate-800 group-hover:text-indigo-600 transition-colors">
                  {campagne?.nom || campagneId}
                </h3>
                <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">{anomaliesCampagne.length}</span>
              </button>
              {!estRepliee && <div className="space-y-3">
                {anomaliesCampagne.map((anomalie) => {
                  const fonctionnalite = fonctionnalites.find(f => f.id === anomalie.fonctionnaliteId);
                  const projet = projets.find(p => p.id === campagne?.projetId);
                  const testeur = users.find(u => u.id === anomalie.testeurId);
                  const statutBadge = getStatutBadge(anomalie.statut);

                  return (
                    <Card 
                      key={anomalie.id} 
                      className="hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => navigate(`/anomalies/${anomalie.id}`)}
            >
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  {getStatutIcon(anomalie.statut)}
                  <div className="flex-1 space-y-2">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <h3 className="font-medium">{anomalie.titre}</h3>
                          <Badge className={statutBadge.className}>
                            {statutBadge.label}
                          </Badge>
                          <Badge className={getPrioriteBadge(anomalie.priorite)}>
                            {anomalie.priorite}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                          {anomalie.description}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        {anomalie.statut === 'nouvelle' && (
                          <Button 
                            size="sm"
                            variant="outline"
                            className="gap-2 border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                            onClick={(e) => {
                              e.stopPropagation();
                              handlePrendreEnCharge(anomalie.id);
                            }}
                            disabled={isAdmin}
                          >
                            <Play className="w-4 h-4" />
                            {t('developpeur.anomalies.take_charge')}
                          </Button>
                        )}
                        {anomalie.statut === 'en_cours' && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="gap-2 border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                            onClick={(e) => {
                              e.stopPropagation();
                              openResolutionDialog(anomalie.id);
                            }}
                            disabled={isAdmin}
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            {t('developpeur.anomalies.report_resolution')}
                          </Button>
                        )}
                        <Button 
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/anomalies/${anomalie.id}`);
                          }}
                        >
                          {t('developpeur.anomalies.view_details')}
                        </Button>
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
                      <span><strong>{t('developpeur.anomalies.fonctionnalite')}:</strong> {fonctionnalite?.nom}</span>
                      <span><strong>{t('developpeur.anomalies.campagne')}:</strong> {campagne?.nom}</span>
                      <span><strong>{t('developpeur.anomalies.projet')}:</strong> {projet?.nom}</span>
                      <span><strong>{t('developpeur.anomalies.created_by')}:</strong> {testeur?.prenom} {testeur?.nom}</span>
                    </div>
                    
                    <div className="text-xs text-gray-400">
                      {t('developpeur.anomalies.created_on')} {new Date(anomalie.dateCreation).toLocaleString('fr-FR')}
                    </div>

                    {anomalie.statut === 'resolution_signalee' && anomalie.commentaireResolution && (
                      <div className="mt-2 p-3 bg-green-50 rounded-lg border border-green-200">
                        <p className="text-xs font-medium text-green-800 mb-1">{t('developpeur.anomalies.resolution_label')}</p>
                        <p className="text-sm text-green-700">{anomalie.commentaireResolution}</p>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
                  );
                })}
              </div>}
            </div>
          );
        })}
      </div>

      {anomaliesFiltrees.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <Code className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">
              {filtreStatut === 'tous' 
                ? t('developpeur.anomalies.no_anomalies') 
                : `${t('developpeur.anomalies.no_anomalies_status')} "${getStatutBadge(filtreStatut as StatutAnomalie).label}"`}
            </p>
          </CardContent>
        </Card>
      )}

      <Dialog open={dialogResolutionOpen} onOpenChange={setDialogResolutionOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('developpeur.anomalies.resolution_dialog_title')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <Label className="text-sm">{t('developpeur.anomalies.resolution_comment')}</Label>
            <Textarea
              rows={4}
              value={commentaireResolution}
              onChange={(e) => setCommentaireResolution(e.target.value)}
              placeholder={t('developpeur.anomalies.resolution_placeholder')}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogResolutionOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button onClick={handleSignalerResolution} disabled={!commentaireResolution.trim()}>
              {t('developpeur.anomalies.send')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
