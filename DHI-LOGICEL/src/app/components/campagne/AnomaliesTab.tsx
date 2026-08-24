import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import { useData } from '../../contexts/DataContext';
import { Card, CardContent } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Button } from '../../components/ui/button';
import { AlertTriangle, X, Search } from 'lucide-react';
import { useDebounce } from '../../hooks/useDebounce';

interface AnomaliesTabProps {
  campagneId: string;
}

export function AnomaliesTab({ campagneId }: AnomaliesTabProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { users, anomalies, fonctionnalites } = useData();
  const [filtreStatut, setFiltreStatut] = useState<string>('tous');
  const [filtreFonctionnaliteId, setFiltreFonctionnaliteId] = useState<string | null>(null);
  const [recherche, setRecherche] = useState('');
  const debouncedRecherche = useDebounce(recherche, 300);

  const anomaliesCampagne = anomalies.filter((a: any) => a.campagneId === campagneId && (!filtreFonctionnaliteId || a.fonctionnaliteId === filtreFonctionnaliteId));
  const anomaliesFiltrees = anomaliesCampagne.filter((a: any) => {
    if (filtreStatut !== 'tous' && a.statut !== filtreStatut) return false;
    if (debouncedRecherche) {
      const q = debouncedRecherche.toLowerCase();
      if (!a.titre?.toLowerCase().includes(q) && !a.description?.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const getPrioriteBadge = (priorite: string) => {
    const config: Record<string, string> = {
      critique: 'bg-red-100 text-red-700', haute: 'bg-orange-100 text-orange-700',
      moyenne: 'bg-yellow-100 text-yellow-700', basse: 'bg-gray-100 text-gray-700'
    };
    return config[priorite] || config.moyenne;
  };

  return (
    <div className="space-y-4">
      {filtreFonctionnaliteId && (
        <div className="flex items-center gap-2 text-sm">
          <span className="text-gray-600">{t('campagne.detail.feature_label')}: <strong>{fonctionnalites.find(f => f.id === filtreFonctionnaliteId)?.nom}</strong></span>
          <Button variant="ghost" size="sm" onClick={() => setFiltreFonctionnaliteId(null)} className="h-6 text-xs">
            <X className="w-3 h-3 mr-1" />{t('common.reset')}
          </Button>
        </div>
      )}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input value={recherche} onChange={e => setRecherche(e.target.value)} placeholder={t('common.search')} className="pl-9 bg-white border-slate-200 h-9" />
        </div>
        <Select value={filtreStatut} onValueChange={setFiltreStatut}>
          <SelectTrigger className="w-44"><SelectValue placeholder={t('campagne.detail.filter_status')} /></SelectTrigger>
          <SelectContent>
            <SelectItem value="tous">{t('campagne.detail.all')}</SelectItem>
            <SelectItem value="nouvelle">{t('statut.nouvelle')}</SelectItem>
            <SelectItem value="en_cours">{t('statut.en_cours')}</SelectItem>
            <SelectItem value="resolution_signalee">{t('statut.resolution_signalee')}</SelectItem>
            <SelectItem value="validee">{t('statut.validee')}</SelectItem>
            <SelectItem value="cloturee">{t('statut.cloturee')}</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-3">
        {anomaliesFiltrees.map((anomalie: any) => {
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
      {anomaliesFiltrees.length === 0 && (
        <Card><CardContent className="py-12 text-center"><AlertTriangle className="w-12 h-12 text-gray-300 mx-auto mb-4" /><p className="text-gray-500">{t('common.no_anomalies')}</p></CardContent></Card>
      )}
    </div>
  );
}
