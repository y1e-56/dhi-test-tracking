import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { dashboardService } from '../services/dashboardService';
import { Card, CardContent, CardHeader } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Input } from '../components/ui/input';
import { History, Clock, User, Search, CheckCircle, AlertTriangle, FileText, Loader2, ExternalLink, Bug, Users, LayoutDashboard, ChevronDown } from 'lucide-react';
import { HistoriqueAction } from '../types';
import { useDebounce } from '../hooks/useDebounce';
import { Pagination } from '../components/ui/pagination';
import { useNavigate } from 'react-router';

interface AuditEntry {
  id: string;
  type: 'creation' | 'modification' | 'suppression' | 'statut' | 'assignation';
  entity: 'utilisateur' | 'projet' | 'campagne' | 'fonctionnalite' | 'anomalie';
  entityName: string;
  userName: string;
  action: string;
  details: string;
  timestamp: string;
  entityId?: string;
}

const ACTION_TYPE_MAP: Record<string, AuditEntry['type']> = {
  created: 'creation',
  updated: 'modification',
  deleted: 'suppression',
  archived: 'statut',
  status_changed: 'statut',
  assigned: 'assignation',
  commented: 'modification',
  member_added: 'modification',
  member_removed: 'modification',
  test_case_created: 'modification',
  test_case_deleted: 'suppression',
};

const ENTITY_TYPE_MAP: Record<string, AuditEntry['entity']> = {
  user: 'utilisateur',
  project: 'projet',
  campaign: 'campagne',
  feature: 'fonctionnalite',
  anomaly: 'anomalie',
};

const ENTITY_TYPE_TO_ROUTE: Record<string, string> = {
  projet: '/projets/',
  campagne: '/campagnes/',
  anomalie: '/anomalies/',
  utilisateur: '/admin/utilisateurs/',
};

function toAuditEntry(h: HistoriqueAction): AuditEntry {
  const type = ACTION_TYPE_MAP[h.action] || 'modification';
  const entity = ENTITY_TYPE_MAP[h.entityType] || 'anomalie';
  return {
    id: h.id,
    type,
    entity,
    entityName: h.commentaire || '',
    userName: h.userName,
    action: h.commentaire || h.action,
    details: '',
    timestamp: h.date,
    entityId: h.entityId,
  };
}

export function AdminHistoryPage() {
  const { t } = useTranslation();
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const [auditEntries, setAuditEntries] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const [filterType, setFilterType] = useState<string>('tous');
  const [filterEntity, setFilterEntity] = useState<string>('tous');
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 300);

  // Accordéon : IDs des entrées d'historique ouvertes
  const [entreeOuverte, setEntreeOuverte] = useState<Set<string>>(new Set());
  const toggleEntree = (id: string) =>
    setEntreeOuverte(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    try {
      const result = await dashboardService.getHistoryPaginated({
        page,
        limit,
        typeAction: filterType !== 'tous' ? filterType : undefined,
        typeEntite: filterEntity !== 'tous' ? filterEntity : undefined,
        recherche: debouncedSearch || undefined,
      });
      setAuditEntries(result.data.map(toAuditEntry));
      setTotal(result.pagination.total);
      setTotalPages(result.pagination.totalPages);
    } finally {
      setLoading(false);
    }
  }, [page, limit, filterType, filterEntity, debouncedSearch]);

  useEffect(() => { fetchHistory(); }, [fetchHistory]);
  useEffect(() => { setPage(1); }, [filterType, filterEntity, debouncedSearch]);

  if (!currentUser || currentUser.role !== 'admin') {
    return (
      <div className="text-center py-20">
        <History className="w-10 h-10 text-slate-300 mx-auto mb-3" />
        <p className="text-slate-500">{t('admin.history.access_denied')}</p>
      </div>
    );
  }

  const getTypeBadge = (type: string) => {
    const config: Record<string, { labelKey: string; className: string }> = {
      creation: { labelKey: 'admin.history.badge_creation', className: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
      modification: { labelKey: 'admin.history.badge_modification', className: 'bg-blue-100 text-blue-700 border-blue-200' },
      suppression: { labelKey: 'admin.history.badge_suppression', className: 'bg-red-100 text-red-700 border-red-200' },
      statut: { labelKey: 'admin.history.badge_statut', className: 'bg-amber-100 text-amber-700 border-amber-200' },
      assignation: { labelKey: 'admin.history.badge_assignation', className: 'bg-purple-100 text-purple-700 border-purple-200' }
    };
    const found = config[type as keyof typeof config];
    return found ? { label: t(found.labelKey), className: found.className } : { label: type, className: 'bg-gray-100 text-gray-700' };
  };

  const getEntityIcon = (entity: string) => {
    const icons: Record<string, React.ComponentType<any>> = {
      utilisateur: User,
      projet: FileText,
      campagne: Clock,
      fonctionnalite: CheckCircle,
      anomalie: AlertTriangle
    };
    return icons[entity] || FileText;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">{t('admin.history.title')}</h1>
        <p className="text-sm text-slate-500 mt-0.5">{t('admin.history.subtitle')}</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <button onClick={() => navigate('/admin/anomalies')} className="text-left">
          <Card className="border-0 shadow-sm overflow-hidden cursor-pointer hover:shadow-md transition-shadow hover:scale-[1.02] active:scale-[0.98]">
            <div className="h-1 bg-red-500" />
            <CardContent className="pt-5 pb-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500">{t('admin.history.go_anomalies')}</p>
                  <p className="text-xs text-slate-400 mt-2 font-medium">{t('admin.history.view_all_anomalies')}</p>
                </div>
                <div className="w-10 h-10 bg-red-50 rounded-2xl flex items-center justify-center flex-shrink-0">
                  <Bug className="w-5 h-5 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </button>
        <button onClick={() => navigate('/admin/utilisateurs')} className="text-left">
          <Card className="border-0 shadow-sm overflow-hidden cursor-pointer hover:shadow-md transition-shadow hover:scale-[1.02] active:scale-[0.98]">
            <div className="h-1 bg-purple-500" />
            <CardContent className="pt-5 pb-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500">{t('admin.history.go_users')}</p>
                  <p className="text-xs text-slate-400 mt-2 font-medium">{t('admin.history.manage_users')}</p>
                </div>
                <div className="w-10 h-10 bg-purple-50 rounded-2xl flex items-center justify-center flex-shrink-0">
                  <Users className="w-5 h-5 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </button>
        <button onClick={() => navigate('/dashboard')} className="text-left">
          <Card className="border-0 shadow-sm overflow-hidden cursor-pointer hover:shadow-md transition-shadow hover:scale-[1.02] active:scale-[0.98]">
            <div className="h-1 bg-indigo-500" />
            <CardContent className="pt-5 pb-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500">{t('admin.history.go_dashboard')}</p>
                  <p className="text-xs text-slate-400 mt-2 font-medium">{t('admin.history.back_to_dashboard')}</p>
                </div>
                <div className="w-10 h-10 bg-indigo-50 rounded-2xl flex items-center justify-center flex-shrink-0">
                  <LayoutDashboard className="w-5 h-5 text-indigo-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </button>
      </div>

      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3 pt-4 px-5">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder={t('admin.history.search_placeholder')}
                className="pl-9 bg-white border-slate-200 h-9"
              />
            </div>
            <Select value={filterType} onValueChange={(v: any) => { setFilterType(v); setPage(1); }}>
              <SelectTrigger className="w-40 bg-white border-slate-200 h-9">
                <SelectValue placeholder={t('admin.history.filter_type')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="tous">{t('admin.history.all_types')}</SelectItem>
                <SelectItem value="creation">{t('admin.history.creations')}</SelectItem>
                <SelectItem value="modification">{t('admin.history.modifications')}</SelectItem>
                <SelectItem value="suppression">{t('admin.history.deletions')}</SelectItem>
                <SelectItem value="statut">{t('admin.history.statuses')}</SelectItem>
                <SelectItem value="assignation">{t('admin.history.assignments')}</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterEntity} onValueChange={(v: any) => { setFilterEntity(v); setPage(1); }}>
              <SelectTrigger className="w-40 bg-white border-slate-200 h-9">
                <SelectValue placeholder={t('admin.history.filter_entity')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="tous">{t('admin.history.all_entities')}</SelectItem>
                <SelectItem value="utilisateur">{t('admin.history.entity_users')}</SelectItem>
                <SelectItem value="projet">{t('admin.history.entity_projects')}</SelectItem>
                <SelectItem value="campagne">{t('admin.history.entity_campaigns')}</SelectItem>
                <SelectItem value="fonctionnalite">{t('admin.history.entity_features')}</SelectItem>
                <SelectItem value="anomalie">{t('admin.history.entity_anomalies')}</SelectItem>
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
          ) : auditEntries.length === 0 ? (
            <div className="py-10 text-center">
              <History className="w-8 h-8 text-slate-200 mx-auto mb-2" />
              <p className="text-sm text-slate-400">{t('admin.history.no_entries')}</p>
            </div>
          ) : (
            <div className="space-y-2">
              {auditEntries.map(entry => {
                const typeBadge = getTypeBadge(entry.type);
                const EntityIcon = getEntityIcon(entry.entity);
                const route = ENTITY_TYPE_TO_ROUTE[entry.entity];
                const canNavigate = route && entry.entityId;

                const isOpen = entreeOuverte.has(entry.id);

                return (
                  <div
                    key={entry.id}
                    className="rounded-xl border border-slate-100 hover:border-slate-200 transition-colors"
                  >
                    {/* En-tête cliquable */}
                    <button
                      onClick={() => toggleEntree(entry.id)}
                      className="flex items-center gap-4 p-4 w-full text-left group"
                    >
                      <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <EntityIcon className="w-5 h-5 text-slate-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-semibold text-slate-800">{entry.action}</span>
                          <Badge className={`text-[10px] px-1.5 py-0 border ${typeBadge.className}`}>
                            {typeBadge.label}
                          </Badge>
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5 truncate">
                          <User className="w-3 h-3 inline mr-1" />
                          {entry.userName} · {new Date(entry.timestamp).toLocaleString('fr-FR')}
                        </p>
                      </div>
                      <ChevronDown className={`w-4 h-4 text-slate-400 flex-shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {/* Détails déroulables */}
                    {isOpen && (
                      <div className="px-4 pb-4 pt-0 border-t border-slate-100 ml-14">
                        {entry.entityName && (
                          <p className="text-sm text-slate-600 mt-3 mb-2">{entry.entityName}</p>
                        )}
                        {entry.details && (
                          <p className="text-xs text-slate-400 mb-2">{entry.details}</p>
                        )}
                        <div className="flex items-center gap-3 text-xs text-slate-400">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {new Date(entry.timestamp).toLocaleString('fr-FR')}
                          </span>
                          {canNavigate && (
                            <button
                              onClick={e => { e.stopPropagation(); navigate(`${route}${entry.entityId}`); }}
                              className="flex items-center gap-1 text-indigo-500 hover:text-indigo-700 transition-colors"
                            >
                              <ExternalLink className="w-3 h-3" />
                              <span>{t('admin.history.view')} {entry.entity}</span>
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
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
