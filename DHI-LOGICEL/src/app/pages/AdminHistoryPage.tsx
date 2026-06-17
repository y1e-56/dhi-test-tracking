import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { dashboardService } from '../services/dashboardService';
import { Card, CardContent, CardHeader } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Input } from '../components/ui/input';
import { History, Clock, User, Search, CheckCircle, AlertTriangle, FileText, Loader2 } from 'lucide-react';
import { HistoriqueAction } from '../types';

interface AuditEntry {
  id: string;
  type: 'creation' | 'modification' | 'suppression' | 'statut' | 'assignation';
  entity: 'utilisateur' | 'projet' | 'campagne' | 'fonctionnalite' | 'anomalie';
  entityName: string;
  userName: string;
  action: string;
  details: string;
  timestamp: string;
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
  };
}

export function AdminHistoryPage() {
  const { t } = useTranslation();
  const { currentUser } = useAuth();
  const [auditEntries, setAuditEntries] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<string>('tous');
  const [filterEntity, setFilterEntity] = useState<string>('tous');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const history = await dashboardService.getHistory();
        setAuditEntries(history.map(toAuditEntry));
      } catch (err) {
        console.error('Erreur chargement historique', err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (!currentUser || currentUser.role !== 'admin') {
    return (
      <div className="text-center py-20">
        <History className="w-10 h-10 text-slate-300 mx-auto mb-3" />
        <p className="text-slate-500">{t('admin.history.access_denied')}</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
        <span className="ml-2 text-slate-500">{t('common.loading')}</span>
      </div>
    );
  }

  const filteredEntries = auditEntries.filter(entry => {
    const matchType = filterType === 'tous' || entry.type === filterType;
    const matchEntity = filterEntity === 'tous' || entry.entity === filterEntity;
    const matchSearch = !searchTerm || 
      entry.entityName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.userName.toLowerCase().includes(searchTerm.toLowerCase());
    return matchType && matchEntity && matchSearch;
  });

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
    const icons = {
      utilisateur: User,
      projet: FileText,
      campagne: Clock,
      fonctionnalite: CheckCircle,
      anomalie: AlertTriangle
    };
    return icons[entity as keyof typeof icons] || FileText;
  };

  const stats = {
    total: auditEntries.length,
    creations: auditEntries.filter(e => e.type === 'creation').length,
    modifications: auditEntries.filter(e => e.type === 'modification').length,
    statuts: auditEntries.filter(e => e.type === 'statut').length,
    assignations: auditEntries.filter(e => e.type === 'assignation').length
  };

  return (
    <div className="space-y-6">
      <div>
          <h1 className="text-xl font-bold text-slate-900">{t('admin.history.title')}</h1>
          <p className="text-sm text-slate-500 mt-0.5">{t('admin.history.subtitle')}</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="border-0 shadow-sm overflow-hidden">
          <div className="h-0.5 bg-indigo-500" />
          <CardContent className="pt-4 pb-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{t('admin.history.total_actions')}</p>
            <p className="text-3xl font-bold text-slate-900 mt-1">{stats.total}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm overflow-hidden">
          <div className="h-0.5 bg-emerald-500" />
          <CardContent className="pt-4 pb-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{t('admin.history.creations')}</p>
            <p className="text-3xl font-bold text-emerald-600 mt-1">{stats.creations}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm overflow-hidden">
          <div className="h-0.5 bg-blue-500" />
          <CardContent className="pt-4 pb-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{t('admin.history.modifications')}</p>
            <p className="text-3xl font-bold text-blue-600 mt-1">{stats.modifications}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm overflow-hidden">
          <div className="h-0.5 bg-amber-500" />
          <CardContent className="pt-4 pb-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{t('admin.history.statuses')}</p>
            <p className="text-3xl font-bold text-amber-600 mt-1">{stats.statuts}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm overflow-hidden">
          <div className="h-0.5 bg-purple-500" />
          <CardContent className="pt-4 pb-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{t('admin.history.assignments')}</p>
            <p className="text-3xl font-bold text-purple-600 mt-1">{stats.assignations}</p>
          </CardContent>
        </Card>
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
            <Select value={filterType} onValueChange={(v: any) => setFilterType(v)}>
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
            <Select value={filterEntity} onValueChange={(v: any) => setFilterEntity(v)}>
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
          <div className="space-y-2">
            {filteredEntries.length === 0 && (
              <div className="py-10 text-center">
                <History className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                <p className="text-sm text-slate-400">{t('admin.history.no_entries')}</p>
              </div>
            )}
            {filteredEntries.map(entry => {
              const typeBadge = getTypeBadge(entry.type);
              const EntityIcon = getEntityIcon(entry.entity);

              return (
                <div
                  key={entry.id}
                  className="flex items-start gap-4 p-4 rounded-xl border border-slate-100 hover:border-slate-200 hover:bg-slate-50 transition-colors"
                >
                  <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <EntityIcon className="w-5 h-5 text-slate-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-sm font-semibold text-slate-800">{entry.action}</span>
                      <Badge className={`text-[10px] px-1.5 py-0 border ${typeBadge.className}`}>
                        {typeBadge.label}
                      </Badge>
                    </div>
                    <p className="text-sm text-slate-600 mb-1">{entry.entityName}</p>
                    <p className="text-xs text-slate-400">{entry.details}</p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-slate-400">
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        {entry.userName}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(entry.timestamp).toLocaleString('fr-FR')}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
