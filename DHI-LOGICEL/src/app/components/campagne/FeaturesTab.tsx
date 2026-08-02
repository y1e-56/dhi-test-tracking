import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Plus, TestTube, Search, FileText } from 'lucide-react';
import { Fonctionnalite, Priorite, StatutFonctionnalite } from '../types';
import { useDebounce } from '../hooks/useDebounce';
import { featureService } from '../services/featureService';
import { getErrorMessage } from '../services/api';
import { toast } from 'sonner';

interface FeaturesTabProps {
  campagneId: string;
  peutGerer: boolean;
  readOnly: boolean;
  isEnPreparation: boolean;
  onOpenAssignDialog: (fonctionnaliteId: string) => void;
}

export function FeaturesTab({ campagneId, peutGerer, readOnly, isEnPreparation, onOpenAssignDialog }: FeaturesTabProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { users, fonctionnalites, ajouterFonctionnalite } = useData();
  const [filtreStatut, setFiltreStatut] = useState<StatutFonctionnalite | 'tous'>('tous');
  const [recherche, setRecherche] = useState('');
  const debouncedRecherche = useDebounce(recherche, 300);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    nom: '', description: '', module: '',
    testeurAssigneId: '', developpeurAssigneId: '',
    priorite: 'moyenne' as Priorite
  });
  const [erreurNom, setErreurNom] = useState('');

  const fonctionnalitesCampagne = fonctionnalites.filter((f: any) => f.campagneId === campagneId);
  const fonctionnalitesFiltrees = fonctionnalitesCampagne.filter((f: any) => {
    if (filtreStatut !== 'tous' && f.statut !== filtreStatut) return false;
    if (debouncedRecherche) {
      const q = debouncedRecherche.toLowerCase();
      if (!f.nom?.toLowerCase().includes(q) && !f.description?.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const tousLesTesteurs = users.filter((u: any) => u.role === 'testeur');
  const tousLesDeveloppeurs = users.filter((u: any) => u.role === 'developpeur');

  const getStatutBadge = (statut: StatutFonctionnalite) => {
    const config: Record<string, { labelKey: string; className: string }> = {
      non_testee: { labelKey: 'campagne.detail.not_tested', className: 'bg-gray-100 text-gray-700' },
      conforme: { labelKey: 'campagne.detail.compliant', className: 'bg-green-100 text-green-700' },
      anomalie: { labelKey: 'common.anomalies', className: 'bg-red-100 text-red-700' }
    };
    const c = config[statut] || config.non_testee;
    return { ...c, label: t(c.labelKey) };
  };

  const getPrioriteBadge = (priorite: string) => {
    const config: Record<string, string> = {
      critique: 'bg-red-100 text-red-700', haute: 'bg-orange-100 text-orange-700',
      moyenne: 'bg-yellow-100 text-yellow-700', basse: 'bg-gray-100 text-gray-700'
    };
    return config[priorite] || config.moyenne;
  };

  const handleAjouter = async () => {
    if (!formData.nom.trim() || !formData.testeurAssigneId) return;
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
      setFormData({ nom: '', description: '', module: '', testeurAssigneId: '', developpeurAssigneId: '', priorite: 'moyenne' });
      setErreurNom('');
      setDialogOpen(false);
    } catch (error: any) {
      if (error?.response?.status === 409) {
        setErreurNom(getErrorMessage(error));
        return;
      }
      console.error('Erreur:', error);
    }
  };

  const handleTelechargerDocument = async (feature: Fonctionnalite) => {
    try {
      const { blob, name } = await featureService.downloadAttachment(feature.id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = name;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      toast.error('Erreur lors du téléchargement du document');
      console.error(error);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input value={recherche} onChange={e => setRecherche(e.target.value)} placeholder={t('common.search')} className="pl-9 bg-white border-slate-200 h-9" />
        </div>
        <Select value={filtreStatut} onValueChange={(value: StatutFonctionnalite | 'tous') => setFiltreStatut(value)}>
          <SelectTrigger className="w-48"><SelectValue placeholder={t('campagne.detail.filter_status')} /></SelectTrigger>
          <SelectContent>
            <SelectItem value="tous">{t('campagne.detail.all')}</SelectItem>
            <SelectItem value="non_testee">{t('campagne.detail.not_tested')}</SelectItem>
            <SelectItem value="conforme">{t('campagne.detail.compliant')}</SelectItem>
            <SelectItem value="anomalie">{t('common.anomalies')}</SelectItem>
          </SelectContent>
        </Select>
        {peutGerer && !readOnly && (
          <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (open) setErreurNom(''); }}>
            <DialogTrigger asChild>
              <Button disabled={isEnPreparation}><Plus className="w-4 h-4 mr-2" />{t('campagne.detail.assign_task')}</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t('campagne.detail.assign_title')}</DialogTitle>
                <DialogDescription>{t('campagne.detail.assign_desc')}</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>{t('campagne.detail.feature_name')}</Label>
                  <Input value={formData.nom} onChange={e => { setFormData({ ...formData, nom: e.target.value }); setErreurNom(''); }} placeholder={t('campagne.detail.feature_name_placeholder')} autoFocus />
                  {erreurNom && (
                    <p className="text-sm font-medium text-destructive">{erreurNom}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>{t('campagne.detail.module')}</Label>
                  <Input value={formData.module} onChange={e => setFormData({ ...formData, module: e.target.value })} placeholder={t('campagne.detail.module_placeholder')} />
                </div>
                <div className="space-y-2">
                  <Label>{t('campagne.detail.description')}</Label>
                  <Textarea value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} placeholder={t('campagne.detail.description_placeholder')} rows={3} />
                </div>
                <div className="space-y-2">
                  <Label>{t('campagne.detail.priority')}</Label>
                  <Select value={formData.priorite} onValueChange={(value: Priorite) => setFormData({ ...formData, priorite: value })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
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
                  <Select value={formData.testeurAssigneId || undefined} onValueChange={v => setFormData({ ...formData, testeurAssigneId: v })}>
                    <SelectTrigger><SelectValue placeholder={t('campagne.detail.select_tester')} /></SelectTrigger>
                    <SelectContent>
                      {tousLesTesteurs.map(u => <SelectItem key={u.id} value={u.id}>{u.prenom} {u.nom}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>{t('campagne.detail.assign_dev')}</Label>
                  <Select value={formData.developpeurAssigneId || undefined} onValueChange={v => setFormData({ ...formData, developpeurAssigneId: v })}>
                    <SelectTrigger><SelectValue placeholder={t('campagne.detail.select_dev')} /></SelectTrigger>
                    <SelectContent>
                      {tousLesDeveloppeurs.map(u => <SelectItem key={u.id} value={u.id}>{u.prenom} {u.nom}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>{t('campagne.detail.cancel')}</Button>
                <Button onClick={handleAjouter}>{t('campagne.detail.assign')}</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="space-y-3">
        {fonctionnalitesFiltrees.map((fonctionnalite: any) => {
          const testeur = users.find((u: any) => u.id === fonctionnalite.testeurAssigneId);
          const statutBadge = getStatutBadge(fonctionnalite.statut);
          return (
            <Card key={fonctionnalite.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate(`/campagnes/${campagneId}?tab=anomalies&feature=${fonctionnalite.id}`)}>
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
                    {fonctionnalite.attachment && (
                      <button
                        onClick={(e) => { e.stopPropagation(); handleTelechargerDocument(fonctionnalite); }}
                        className="mt-2 flex items-center gap-1.5 text-xs text-indigo-600 hover:text-indigo-800 font-medium"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        {fonctionnalite.attachment.name}
                      </button>
                    )}
                  </div>
                  {peutGerer && !readOnly && (
                    <Button size="sm" variant="outline"
                      onClick={(e) => { e.stopPropagation(); onOpenAssignDialog(fonctionnalite.id); }}
                      disabled={fonctionnalite.statut === 'conforme' || isEnPreparation}>
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
    </div>
  );
}
