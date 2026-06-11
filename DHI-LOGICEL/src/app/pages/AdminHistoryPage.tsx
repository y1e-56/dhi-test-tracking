import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Input } from '../components/ui/input';
import { History, Clock, User, Filter, Search, CheckCircle, AlertTriangle, XCircle, FileText } from 'lucide-react';

interface AuditEntry {
  id: string;
  type: 'creation' | 'modification' | 'suppression' | 'statut' | 'assignation';
  entity: 'utilisateur' | 'projet' | 'campagne' | 'fonctionnalite' | 'anomalie';
  entityId: string;
  entityName: string;
  userId: string;
  userName: string;
  action: string;
  details: string;
  timestamp: string;
}

export function AdminHistoryPage() {
  const { t } = useTranslation();
  const { currentUser, users } = useAuth();
  const { projets, campagnes, fonctionnalites, anomalies, notifications } = useData();
  const [filterType, setFilterType] = useState<'tous' | 'creation' | 'modification' | 'suppression' | 'statut' | 'assignation'>('tous');
  const [filterEntity, setFilterEntity] = useState<'tous' | 'utilisateur' | 'projet' | 'campagne' | 'fonctionnalite' | 'anomalie'>('tous');
  const [searchTerm, setSearchTerm] = useState('');

  if (!currentUser || currentUser.role !== 'admin') {
    return (
      <div className="text-center py-20">
        <History className="w-10 h-10 text-slate-300 mx-auto mb-3" />
        <p className="text-slate-500">{t('admin.history.access_denied')}</p>
      </div>
    );
  }

  // Générer des entrées d'audit à partir des données existantes
  const generateAuditEntries = (): AuditEntry[] => {
    const entries: AuditEntry[] = [];

    // Entrées pour les utilisateurs
    users.forEach((user: any) => {
      entries.push({
        id: `u-${user.id}`,
        type: 'creation',
        entity: 'utilisateur',
        entityId: user.id,
        entityName: `${user.prenom} ${user.nom}`,
        userId: user.id,
        userName: `${user.prenom} ${user.nom}`,
        action: t('admin.history.action_user_creation'),
        details: t('admin.history.details_role', { role: user.role }),
        timestamp: new Date().toISOString()
      });

      if (user.bloqueJusqua) {
        entries.push({
          id: `ub-${user.id}`,
          type: 'statut',
          entity: 'utilisateur',
          entityId: user.id,
          entityName: `${user.prenom} ${user.nom}`,
          userId: user.id,
          userName: `${user.prenom} ${user.nom}`,
          action: t('admin.history.action_user_blocked'),
          details: t('admin.history.details_blocked_until', { date: new Date(user.bloqueJusqua).toLocaleDateString('fr-FR') }),
          timestamp: user.bloqueJusqua.toISOString()
        });
      }
    });

    // Entrées pour les projets
    projets.forEach((projet: any) => {
      entries.push({
        id: `p-${projet.id}`,
        type: 'creation',
        entity: 'projet',
        entityId: projet.id,
        entityName: projet.nom,
        userId: projet.creePar,
        userName: users.find((u: any) => u.id === projet.creePar)?.prenom + ' ' + users.find((u: any) => u.id === projet.creePar)?.nom || t('common.unknown'),
        action: t('admin.history.action_project_creation'),
        details: t('admin.history.details_status', { status: projet.statut }),
        timestamp: projet.dateCreation
      });

      if (projet.statut === 'archive') {
        entries.push({
          id: `pa-${projet.id}`,
          type: 'statut',
          entity: 'projet',
          entityId: projet.id,
          entityName: projet.nom,
          userId: projet.creePar,
          userName: users.find((u: any) => u.id === projet.creePar)?.prenom + ' ' + users.find((u: any) => u.id === projet.creePar)?.nom || t('common.unknown'),
          action: t('admin.history.action_project_archived'),
          details: t('admin.history.details_project_archived'),
          timestamp: projet.dateCreation
        });
      }
    });

    // Entrées pour les campagnes
    campagnes.forEach((campagne: any) => {
      const chefNames = (campagne.chefTesteurIds || [])
        .map((id: string) => users.find((u: any) => u.id === id))
        .filter(Boolean)
        .map((u: any) => u.prenom + ' ' + u.nom)
        .join(', ');
      entries.push({
        id: `c-${campagne.id}`,
        type: 'creation',
        entity: 'campagne',
        entityId: campagne.id,
        entityName: campagne.nom,
        userId: (campagne.chefTesteurIds || [])[0] || '',
        userName: chefNames || t('common.unknown'),
        action: t('admin.history.action_campaign_creation'),
        details: t('admin.history.details_status', { status: campagne.statut }),
        timestamp: campagne.dateCreation
      });
    });

    // Entrées pour les fonctionnalités
    fonctionnalites.forEach((fonct: any) => {
      if (fonct.dateAssignation) {
        entries.push({
          id: `fa-${fonct.id}`,
          type: 'assignation',
          entity: 'fonctionnalite',
          entityId: fonct.id,
          entityName: fonct.nom,
          userId: fonct.testeurAssigneId || '',
          userName: users.find((u: any) => u.id === fonct.testeurAssigneId)?.prenom + ' ' + users.find((u: any) => u.id === fonct.testeurAssigneId)?.nom || t('common.unknown'),
          action: t('admin.history.action_feature_assignment'),
          details: t('admin.history.details_assigned_to', { name: users.find((u: any) => u.id === fonct.testeurAssigneId)?.prenom || t('common.unknown') }),
          timestamp: fonct.dateAssignation
        });
      }

      if (fonct.statut !== 'non_testee') {
        entries.push({
          id: `fs-${fonct.id}`,
          type: 'statut',
          entity: 'fonctionnalite',
          entityId: fonct.id,
          entityName: fonct.nom,
          userId: fonct.testeurAssigneId || '',
          userName: users.find((u: any) => u.id === fonct.testeurAssigneId)?.prenom + ' ' + users.find((u: any) => u.id === fonct.testeurAssigneId)?.nom || t('common.unknown'),
          action: t('admin.history.action_feature_status_change'),
          details: t('admin.history.details_status', { status: fonct.statut }),
          timestamp: fonct.dateAssignation || new Date().toISOString()
        });
      }
    });

    // Entrées pour les anomalies
    anomalies.forEach((anomalie: any) => {
      entries.push({
        id: `a-${anomalie.id}`,
        type: 'creation',
        entity: 'anomalie',
        entityId: anomalie.id,
        entityName: anomalie.titre,
        userId: anomalie.testeurId,
        userName: users.find((u: any) => u.id === anomalie.testeurId)?.prenom + ' ' + users.find((u: any) => u.id === anomalie.testeurId)?.nom || t('common.unknown'),
        action: t('admin.history.action_anomaly_creation'),
        details: t('admin.history.details_priority_dev', {
          priority: anomalie.priorite,
          dev: users.find((u: any) => u.id === anomalie.developpeurId)?.prenom || t('common.unknown')
        }),
        timestamp: anomalie.dateCreation
      });

      if (anomalie.statut !== 'nouvelle') {
        entries.push({
          id: `as-${anomalie.id}`,
          type: 'statut',
          entity: 'anomalie',
          entityId: anomalie.id,
          entityName: anomalie.titre,
          userId: anomalie.developpeurId || anomalie.testeurId,
          userName: users.find((u: any) => u.id === (anomalie.developpeurId || anomalie.testeurId))?.prenom + ' ' + users.find((u: any) => u.id === (anomalie.developpeurId || anomalie.testeurId))?.nom || t('common.unknown'),
          action: t('admin.history.action_anomaly_status_change'),
          details: t('admin.history.details_status', { status: anomalie.statut }),
          timestamp: anomalie.dateCreation
        });
      }
    });

    // Entrées pour les notifications
    notifications.forEach((notif: any) => {
      entries.push({
        id: `n-${notif.id}`,
        type: 'creation',
        entity: 'anomalie',
        entityId: notif.id,
        entityName: notif.titre,
        userId: notif.userId,
        userName: users.find((u: any) => u.id === notif.userId)?.prenom + ' ' + users.find((u: any) => u.id === notif.userId)?.nom || t('common.unknown'),
        action: t('admin.history.action_notification_sent'),
        details: notif.message,
        timestamp: notif.dateCreation
      });
    });

    // Trier par date décroissante
    return entries.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  };

  const auditEntries = generateAuditEntries();

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
