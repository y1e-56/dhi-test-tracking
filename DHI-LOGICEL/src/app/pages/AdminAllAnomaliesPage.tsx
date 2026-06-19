import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { useNavigate } from 'react-router';
import { Card, CardContent, CardHeader } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Input } from '../components/ui/input';
import { AlertTriangle, Clock, CheckCircle2, Bug, Search, Loader2, ArrowRight, X, ExternalLink } from 'lucide-react';
import { StatutAnomalie, Priorite, AnomalieFilters, Anomalie } from '../types';
import { anomalyService } from '../services/anomalyService';
import { useDebounce } from '../hooks/useDebounce';
import { Pagination } from '../components/ui/Pagination';

const statutBadgeConfig: Record<StatutAnomalie, { labelKey: string; className: string }> = {
  nouvelle: { labelKey: 'statut.nouvelle', className: 'bg-red-100 text-red-700 border-red-200' },
  en_cours: { labelKey: 'statut.en_cours', className: 'bg-blue-100 text-blue-700 border-blue-200' },
  resolution_signalee: { labelKey: 'statut.resolution_signalee', className: 'bg-green-100 text-green-700 border-green-200' },
  validee: { labelKey: 'statut.validee', className: 'bg-green-200 text-green-800 border-green-300' },
  cloturee: { labelKey: 'statut.cloturee', className: 'bg-gray-100 text-gray-700 border-gray-200' }
};

const prioriteBadgeConfig: Record<Priorite, string> = {
  critique: 'bg-red-100 text-red-700 border-red-200',
  haute: 'bg-orange-100 text-orange-700 border-orange-200',
  moyenne: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  basse: 'bg-gray-100 text-gray-700 border-gray-200'
};

function getStatutIcon(statut: StatutAnomalie) {
  switch (statut) {
    case 'nouvelle': return <AlertTriangle className="w-5 h-5 text-red-600" />;
    case 'en_cours': return <Clock className="w-5 h-5 text-blue-600" />;
    case 'resolution_signalee':
    case 'validee':
    case 'cloturee': return <CheckCircle2 className="w-5 h-5 text-green-600" />;
    default: return <Bug className="w-5 h-5 text-gray-400" />;
  }
}

export function AdminAllAnomaliesPage() {
  const { t } = useTranslation();
  const { currentUser } = useAuth();
  const { projets } = useData();
  const navigate = useNavigate();

  const [anomalies, setAnomalies] = useState<Anomalie[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<{ total: number; byStatus: Record<string, number> } | null>(null);

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const [filterStatut, setFilterStatut] = useState<string>('tous');
  const [filterPriorite, setFilterPriorite] = useState<string>('toutes');
  const [filterProjet, setFilterProjet] = useState<string>('tous');
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 300);

  const fetchAnomalies = useCallback(async () => {
    setLoading(true);
    try {
      const filters: AnomalieFilters = { page, limit };
      if (filterStatut !== 'tous') filters.statut = filterStatut as StatutAnomalie;
      if (filterProjet !== 'tous') filters.projetId = filterProjet;
      if (debouncedSearch) filters.recherche = debouncedSearch;

      const result = await anomalyService.list(filters);
      setAnomalies(result.data);
      setTotal(result.pagination.total);
      setTotalPages(result.pagination.totalPages);
    } finally {
      setLoading(false);
    }
  }, [page, limit, filterStatut, filterProjet, debouncedSearch]);

  const fetchStats = useCallback(async () => {
    try {
      const s = await anomalyService.getStats();
      setStats(s);
    } catch { }
  }, []);

  useEffect(() => { fetchAnomalies(); }, [fetchAnomalies]);
  useEffect(() => { fetchStats(); }, [fetchStats]);

  useEffect(() => { setPage(1); }, [filterStatut, filterProjet, debouncedSearch]);

  if (!currentUser || currentUser.role !== 'admin') {
    return (
      <div className="text-center py-20">
        <Bug className="w-10 h-10 text-slate-300 mx-auto mb-3" />
        <p className="text-slate-500">{t('admin.anomalies.access_denied')}</p>
      </div>
    );
  }

  const statCards = [
    { label: t('admin.anomalies.total'), value: stats?.total ?? 0, color: 'bg-indigo-500', filter: null },
    { label: t('statut.nouvelle'), value: stats?.byStatus?.nouvelle ?? 0, color: 'bg-red-500', filter: 'nouvelle' },
    { label: t('statut.en_cours'), value: stats?.byStatus?.en_cours ?? 0, color: 'bg-blue-500', filter: 'en_cours' },
    { label: t('statut.resolution_signalee'), value: stats?.byStatus?.resolution_signalee ?? 0, color: 'bg-amber-500', filter: 'resolution_signalee' },
    { label: t('statut.validee'), value: stats?.byStatus?.validee ?? 0, color: 'bg-emerald-500', filter: 'validee' },
    { label: t('statut.cloturee'), value: stats?.byStatus?.cloturee ?? 0, color: 'bg-gray-500', filter: 'cloturee' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">{t('admin.anomalies.title')}</h1>
        <p className="text-sm text-slate-500 mt-0.5">{t('admin.anomalies.subtitle')}</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        {statCards.map((card, i) => (
          <button
            key={i}
            onClick={() => { if (card.filter) { setFilterStatut(card.filter); setPage(1); } }}
            className={`card-hover ${card.filter ? 'cursor-pointer' : 'cursor-default'}`}
          >
            <Card className={`border-0 shadow-sm overflow-hidden ${card.filter ? 'hover:shadow-md transition-shadow' : ''}`}>
              <div className={`h-0.5 ${card.color}`} />
              <CardContent className="pt-4 pb-4 text-left">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{card.label}</p>
                <p className="text-3xl font-bold text-slate-900 mt-1">{card.value}</p>
              </CardContent>
            </Card>
          </button>
        ))}
      </div>

      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3 pt-4 px-5">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder={t('admin.anomalies.search_placeholder')}
                className="pl-9 bg-white border-slate-200 h-9"
              />
              {searchTerm && (
                <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2">
                  <X className="w-4 h-4 text-slate-400 hover:text-slate-600" />
                </button>
              )}
            </div>
            <Select value={filterStatut} onValueChange={(v) => { setFilterStatut(v); setPage(1); }}>
              <SelectTrigger className="w-40 bg-white border-slate-200 h-9">
                <SelectValue placeholder={t('admin.anomalies.filter_status')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="tous">{t('admin.anomalies.all_statuses')}</SelectItem>
                <SelectItem value="nouvelle">{t('statut.nouvelle')}</SelectItem>
                <SelectItem value="en_cours">{t('statut.en_cours')}</SelectItem>
                <SelectItem value="resolution_signalee">{t('statut.resolution_signalee')}</SelectItem>
                <SelectItem value="validee">{t('statut.validee')}</SelectItem>
                <SelectItem value="cloturee">{t('statut.cloturee')}</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterProjet} onValueChange={(v) => { setFilterProjet(v); setPage(1); }}>
              <SelectTrigger className="w-48 bg-white border-slate-200 h-9">
                <SelectValue placeholder={t('admin.anomalies.filter_project')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="tous">{t('admin.anomalies.all_projects')}</SelectItem>
                {projets.map(p => (
                  <SelectItem key={p.id} value={p.id}>{p.nom}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="px-5 pb-5">
          {loading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
              <span className="ml-2 text-slate-500">{t('common.loading')}</span>
            </div>
          ) : anomalies.length === 0 ? (
            <div className="py-10 text-center">
              <Bug className="w-8 h-8 text-slate-200 mx-auto mb-2" />
              <p className="text-sm text-slate-400">{t('admin.anomalies.no_anomalies')}</p>
            </div>
          ) : (
            <div className="space-y-2">
              {anomalies.map(anomalie => (
                <div
                  key={anomalie.id}
                  className="flex items-start gap-4 p-4 rounded-xl border border-slate-100 hover:border-slate-200 hover:bg-slate-50 transition-colors cursor-pointer group"
                  onClick={() => navigate(`/anomalies/${anomalie.id}`)}
                >
                  <div className="flex-shrink-0">
                    {getStatutIcon(anomalie.statut)}
                  </div>
                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <h3 className="font-medium text-slate-800">{anomalie.titre}</h3>
                          <Badge className={statutBadgeConfig[anomalie.statut].className}>
                            {t(statutBadgeConfig[anomalie.statut].labelKey)}
                          </Badge>
                          <Badge className={prioriteBadgeConfig[anomalie.priorite]}>
                            {t(`priorite.${anomalie.priorite}`)}
                          </Badge>
                        </div>
                        <p className="text-sm text-slate-600 line-clamp-2 mb-2">
                          {anomalie.description}
                        </p>
                      </div>
                      <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-500 transition-colors flex-shrink-0 mt-1" />
                    </div>

                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                      <span><strong>Anomalie:</strong> {anomalie.id}</span>
                      <span><strong>{t('admin.anomalies.testeur')}:</strong> {anomalie.testeurId}</span>
                      <span><strong>{t('admin.anomalies.developpeur')}:</strong> {anomalie.developpeurId || '—'}</span>
                      {anomalie.campagneId && (
                        <button
                          onClick={e => { e.stopPropagation(); navigate(`/campagnes/${anomalie.campagneId}`); }}
                          className="text-indigo-600 hover:text-indigo-800 hover:underline inline-flex items-center gap-0.5"
                        >
                          Campagne <ExternalLink className="w-3 h-3" />
                        </button>
                      )}
                    </div>

                    <div className="text-xs text-slate-400">
                      {t('admin.anomalies.created_on')} {new Date(anomalie.dateCreation).toLocaleString('fr-FR')}
                    </div>

                    {anomalie.statut === 'resolution_signalee' && anomalie.commentaireResolution && (
                      <div className="mt-2 p-3 bg-green-50 rounded-lg border border-green-200">
                        <p className="text-xs font-medium text-green-800 mb-1">{t('admin.anomalies.resolution_label')}</p>
                        <p className="text-sm text-green-700">{anomalie.commentaireResolution}</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          <Pagination
            page={page}
            totalPages={totalPages}
            total={total}
            limit={limit}
            onPageChange={setPage}
            onLimitChange={(newLimit) => { setLimit(newLimit); setPage(1); }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
