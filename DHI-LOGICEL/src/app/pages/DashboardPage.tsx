import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { useNavigate } from 'react-router';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import {
  FolderKanban, TestTube, AlertTriangle, CheckCircle2, Clock,
  TrendingUp, ArrowRight, Bug, BarChart3, Users
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface StatCardProps {
  label: string;
  value: number | string;
  sub?: string;
  icon: React.ElementType;
  accent: string;
  iconBg: string;
  iconColor: string;
  onClick?: () => void;
}

function StatCard({ label, value, sub, icon: Icon, accent, iconBg, iconColor, onClick }: StatCardProps) {
  return (
    <Card
      className={`overflow-hidden border-0 shadow-md hover:shadow-lg transition-shadow duration-300 ${onClick ? 'cursor-pointer hover:scale-[1.02] active:scale-[0.98]' : ''}`}
      onClick={onClick}
    >
      <div className={`h-1 ${accent}`} />
      <CardContent className="pt-6 pb-6">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500">{label}</p>
            <p className="text-3xl font-bold text-slate-900 mt-2 leading-none">{value}</p>
            {sub && <p className="text-xs text-slate-500 mt-2 font-medium">{sub}</p>}
          </div>
          <div className={`w-12 h-12 ${iconBg} rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm`}>
            <Icon className={`w-6 h-6 ${iconColor}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

const prioriteBadge: Record<string, string> = {
  critique: 'bg-red-100 text-red-700 border-red-200',
  haute: 'bg-orange-100 text-orange-700 border-orange-200',
  moyenne: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  basse: 'bg-slate-100 text-slate-600 border-slate-200',
};

export function DashboardPage() {
  const { currentUser, users } = useAuth();
  const { projets, campagnes, fonctionnalites, anomalies } = useData();
  const navigate = useNavigate();
  const { t } = useTranslation();

  if (!currentUser) return null;

  const projetsActifs = projets.filter(p => p.statut === 'actif');
  const campagnesEnCours = campagnes.filter(c => c.statut === 'en_cours');
  const anomaliesOuvertes = anomalies.filter(a => a.statut !== 'cloturee');

  const renderAdminDashboard = () => {
    const fonctionnalitesTestees = fonctionnalites.filter(f => f.statut !== 'non_testee');
    const avancementPct = fonctionnalites.length
      ? Math.round((fonctionnalitesTestees.length / fonctionnalites.length) * 100)
      : 0;

    // Stats globales KPI pour admin
    const totalUtilisateurs = users.length;
    const totalProjets = projets.length;
    const totalCampagnes = campagnes.length;
    const totalAnomalies = anomalies.length;
    const anomaliesResolues = anomalies.filter(a => a.statut === 'cloturee' || a.statut === 'validee').length;
    const tauxResolution = totalAnomalies > 0 ? Math.round((anomaliesResolues / totalAnomalies) * 100) : 0;
    const anomaliesCritiques = anomalies.filter(a => a.priorite === 'critique' && a.statut !== 'cloturee').length;

    return (
      <div className="space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900">{t('dashboard.admin_title')}</h1>
            <p className="text-sm text-slate-500 mt-0.5">
              {t('dashboard.greeting', { name: currentUser.prenom })} — {t('dashboard.admin_overview')}
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={() => navigate('/admin/history')}
              className="gap-1.5 bg-purple-600 hover:bg-purple-700 text-white shrink-0"
            >
              <BarChart3 className="w-4 h-4" />
              {t('dashboard.history_btn')}
            </Button>
            <Button
              size="sm"
              onClick={() => navigate('/admin/anomalies')}
              className="gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white shrink-0"
            >
              <Bug className="w-4 h-4" />
              {t('dashboard.all_anomalies_btn')}
            </Button>
          </div>
        </div>

        {/* Stats globales KPI */}
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
          <StatCard
            label={t('dashboard.users')}
            value={totalUtilisateurs}
            icon={Users}
            accent="bg-purple-500"
            iconBg="bg-purple-50"
            iconColor="text-purple-600"
            onClick={() => navigate('/admin/utilisateurs')}
          />
          <StatCard
            label={t('dashboard.projects')}
            value={totalProjets}
            sub={`${projetsActifs.length} ${t('dashboard.active')}`}
            icon={FolderKanban}
            accent="bg-indigo-500"
            iconBg="bg-indigo-50"
            iconColor="text-indigo-600"
            onClick={() => navigate('/projets')}
          />
          <StatCard
            label={t('dashboard.campaigns')}
            value={totalCampagnes}
            sub={`${campagnesEnCours.length} ${t('dashboard.in_progress')}`}
            icon={TestTube}
            accent="bg-sky-500"
            iconBg="bg-sky-50"
            iconColor="text-sky-600"
            onClick={() => navigate('/campagnes')}
          />
          <StatCard
            label={t('dashboard.anomalies')}
            value={totalAnomalies}
            sub={`${anomaliesCritiques} ${t('dashboard.critical')}`}
            icon={AlertTriangle}
            accent="bg-red-500"
            iconBg="bg-red-50"
            iconColor="text-red-600"
            onClick={() => navigate('/admin/anomalies')}
          />
          <StatCard
            label={t('dashboard.resolution_rate')}
            value={`${tauxResolution}%`}
            sub={`${anomaliesResolues} ${t('dashboard.resolved')}`}
            icon={TrendingUp}
            accent="bg-emerald-500"
            iconBg="bg-emerald-50"
            iconColor="text-emerald-600"
            onClick={() => navigate('/admin/anomalies')}
          />
          <StatCard
            label={t('dashboard.progress')}
            value={`${avancementPct}%`}
            sub={`${fonctionnalitesTestees.length} ${t('dashboard.tested')}`}
            icon={CheckCircle2}
            accent="bg-blue-500"
            iconBg="bg-blue-50"
            iconColor="text-blue-600"
            onClick={() => navigate('/reporting')}
          />
        </div>

        <div className="w-full bg-white rounded-xl border border-slate-200/80 overflow-hidden shadow-sm">
          <div className="px-4 py-2.5 flex items-center justify-between border-b border-slate-100">
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{t('dashboard.overall_progress')}</span>
            <span className="text-sm font-bold text-slate-700">{avancementPct}%</span>
          </div>
          <div className="px-4 py-3">
            <div className="w-full bg-slate-100 rounded-full h-2">
              <div
                className="h-2 rounded-full bg-gradient-to-r from-indigo-500 to-indigo-400 transition-all duration-700"
                style={{ width: `${avancementPct}%` }}
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3 pt-5 px-5">
              <CardTitle className="text-sm font-bold text-slate-800">{t('dashboard.active_campaigns')}</CardTitle>
            </CardHeader>
            <CardContent className="px-5 pb-5">
              {campagnesEnCours.length === 0 ? (
                <div className="py-6 text-center">
                  <TestTube className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                  <p className="text-sm text-slate-400">{t('dashboard.no_active_campaigns')}</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {campagnesEnCours.slice(0, 4).map(campagne => {
                    const projet = projets.find(p => p.id === campagne.projetId);
                    const fonctsCampagne = fonctionnalites.filter(f => f.campagneId === campagne.id);
                    const anomCampagne = anomalies.filter(a => a.campagneId === campagne.id && a.statut !== 'cloturee');
                    const pct = fonctsCampagne.length
                      ? Math.round((fonctsCampagne.filter(f => f.statut !== 'non_testee').length / fonctsCampagne.length) * 100)
                      : 0;

                    return (
                      <div
                        key={campagne.id}
                        className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer group"
                        onClick={() => navigate(`/campagnes/${campagne.id}`)}
                      >
                        <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center flex-shrink-0">
                          <TestTube className="w-4 h-4 text-indigo-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-semibold text-slate-800 truncate">{campagne.nom}</p>
                            {anomCampagne.length > 0 && (
                              <Badge className="bg-red-100 text-red-700 text-[10px] px-1.5 border-0 py-0">
                                {anomCampagne.length} {anomCampagne.length > 1 ? t('dashboard.anomalies_count') : t('dashboard.anomalie')}
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-slate-400 truncate">{projet?.nom}</p>
                          <div className="flex items-center gap-2 mt-1.5">
                            <div className="flex-1 bg-slate-100 rounded-full h-1">
                              <div
                                className="h-1 rounded-full bg-indigo-500"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                            <span className="text-[10px] font-mono text-slate-400">{pct}%</span>
                          </div>
                        </div>
                        <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-indigo-500 transition-colors flex-shrink-0" />
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3 pt-5 px-5">
              <CardTitle className="text-sm font-bold text-slate-800">{t('dashboard.recent_anomalies')}</CardTitle>
            </CardHeader>
            <CardContent className="px-5 pb-5">
              {anomaliesOuvertes.length === 0 ? (
                <div className="py-6 text-center">
                  <CheckCircle2 className="w-8 h-8 text-emerald-200 mx-auto mb-2" />
                  <p className="text-sm text-slate-400">{t('dashboard.no_open_anomalies')}</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {anomaliesOuvertes.slice(0, 4).map(anomalie => (
                    <div
                      key={anomalie.id}
                      className="flex items-start gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer group"
                      onClick={() => navigate(`/anomalies/${anomalie.id}`)}
                    >
                      <div className="w-8 h-8 bg-red-50 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Bug className="w-4 h-4 text-red-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <p className="text-sm font-semibold text-slate-800 truncate">{anomalie.titre}</p>
                          <Badge className={`text-[10px] px-1.5 border py-0 ${prioriteBadge[anomalie.priorite]}`}>
                            {t('priorite.' + anomalie.priorite)}
                          </Badge>
                        </div>
                        <p className="text-[10px] font-mono text-slate-400">
                          {new Date(anomalie.dateCreation).toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-indigo-500 transition-colors flex-shrink-0 mt-1" />
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <button
            onClick={() => navigate('/projets')}
            className="flex items-center gap-3 p-4 bg-white border border-slate-200 rounded-xl hover:border-indigo-300 hover:shadow-sm transition-all text-left group"
          >
            <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center">
              <FolderKanban className="w-5 h-5 text-indigo-600" />
            </div>
            <div className="flex-1">
              <div className="text-sm font-semibold text-slate-800">{t('dashboard.manage_projects')}</div>
              <div className="text-xs text-slate-400">{projetsActifs.length} {t('dashboard.active')}</div>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-500 transition-colors" />
          </button>

          <button
            onClick={() => navigate('/campagnes')}
            className="flex items-center gap-3 p-4 bg-white border border-slate-200 rounded-xl hover:border-indigo-300 hover:shadow-sm transition-all text-left group"
          >
            <div className="w-10 h-10 bg-sky-50 rounded-xl flex items-center justify-center">
              <TestTube className="w-5 h-5 text-sky-600" />
            </div>
            <div className="flex-1">
              <div className="text-sm font-semibold text-slate-800">{t('dashboard.manage_campaigns')}</div>
              <div className="text-xs text-slate-400">{campagnesEnCours.length} {t('dashboard.in_progress')}</div>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-500 transition-colors" />
          </button>

          <button
            onClick={() => navigate('/admin/utilisateurs')}
            className="flex items-center gap-3 p-4 bg-white border border-slate-200 rounded-xl hover:border-indigo-300 hover:shadow-sm transition-all text-left group"
          >
            <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center">
              <Users className="w-5 h-5 text-purple-600" />
            </div>
            <div className="flex-1">
              <div className="text-sm font-semibold text-slate-800">{t('dashboard.manage_users')}</div>
              <div className="text-xs text-slate-400">{totalUtilisateurs} comptes</div>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-500 transition-colors" />
          </button>

          <button
            onClick={() => navigate('/reporting')}
            className="flex items-center gap-3 p-4 bg-white border border-slate-200 rounded-xl hover:border-indigo-300 hover:shadow-sm transition-all text-left group"
          >
            <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-emerald-600" />
            </div>
            <div className="flex-1">
              <div className="text-sm font-semibold text-slate-800">{t('dashboard.reports')}</div>
              <div className="text-xs text-slate-400">{t('dashboard.export_pdf_excel')}</div>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-500 transition-colors" />
          </button>
        </div>
      </div>
    );
  };

  const renderChefTesteurDashboard = () => {
    const fonctionnalitesTestees = fonctionnalites.filter(f => f.statut !== 'non_testee');
    const avancementPct = fonctionnalites.length
      ? Math.round((fonctionnalitesTestees.length / fonctionnalites.length) * 100)
      : 0;

    return (
      <div className="space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900">{t('dashboard.chef_title')}</h1>
            <p className="text-sm text-slate-500 mt-0.5">
              {t('dashboard.greeting', { name: currentUser.prenom })} — {t('dashboard.chef_overview')}
            </p>
          </div>
          <Button
            size="sm"
            onClick={() => navigate('/reporting')}
            className="gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white shrink-0"
          >
            <BarChart3 className="w-4 h-4" />
            {t('dashboard.reporting_btn')}
          </Button>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label={`${t('dashboard.projects')} ${t('dashboard.active')}`}
            value={projetsActifs.length}
            sub={`${projets.filter(p => p.statut === 'archive').length} ${t('dashboard.archived')}`}
            icon={FolderKanban}
            accent="bg-indigo-500"
            iconBg="bg-indigo-50"
            iconColor="text-indigo-600"
            onClick={() => navigate('/projets')}
          />
          <StatCard
            label={t('dashboard.campaigns')}
            value={campagnesEnCours.length}
            sub={`${campagnes.filter(c => c.statut === 'en_preparation').length} ${t('dashboard.in_preparation')}`}
            icon={TestTube}
            accent="bg-sky-500"
            iconBg="bg-sky-50"
            iconColor="text-sky-600"
            onClick={() => navigate('/campagnes')}
          />
          <StatCard
            label={t('dashboard.anomalies')}
            value={anomaliesOuvertes.length}
            sub={`${anomalies.filter(a => a.priorite === 'critique').length} ${t('dashboard.critical')}`}
            icon={AlertTriangle}
            accent="bg-red-500"
            iconBg="bg-red-50"
            iconColor="text-red-600"
            onClick={() => navigate('/campagnes')}
          />
          <StatCard
            label={t('dashboard.progress')}
            value={`${avancementPct}%`}
            sub={`${fonctionnalitesTestees.length} / ${fonctionnalites.length} total`}
            icon={TrendingUp}
            accent="bg-emerald-500"
            iconBg="bg-emerald-50"
            iconColor="text-emerald-600"
            onClick={() => navigate('/reporting')}
          />
        </div>

        <div className="w-full bg-white rounded-xl border border-slate-200/80 overflow-hidden shadow-sm">
          <div className="px-4 py-2.5 flex items-center justify-between border-b border-slate-100">
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{t('dashboard.overall_progress')}</span>
            <span className="text-sm font-bold text-slate-700">{avancementPct}%</span>
          </div>
          <div className="px-4 py-3">
            <div className="w-full bg-slate-100 rounded-full h-2">
              <div
                className="h-2 rounded-full bg-gradient-to-r from-indigo-500 to-indigo-400 transition-all duration-700"
                style={{ width: `${avancementPct}%` }}
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3 pt-5 px-5">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-bold text-slate-800">{t('dashboard.active_campaigns')}</CardTitle>
                {currentUser.role === 'chef_testeur' && (
                  <button
                    onClick={() => navigate('/campagnes')}
                    className="text-xs text-indigo-600 hover:text-indigo-700 flex items-center gap-1 font-semibold"
                  >
                    {t('dashboard.see_all')} <ArrowRight className="w-3 h-3" />
                  </button>
                )}
              </div>
            </CardHeader>
            <CardContent className="px-5 pb-5">
              {campagnesEnCours.length === 0 ? (
                <div className="py-6 text-center">
                  <TestTube className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                  <p className="text-sm text-slate-400">{t('dashboard.no_active_campaigns')}</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {campagnesEnCours.slice(0, 4).map(campagne => {
                    const projet = projets.find(p => p.id === campagne.projetId);
                    const fonctsCampagne = fonctionnalites.filter(f => f.campagneId === campagne.id);
                    const anomCampagne = anomalies.filter(a => a.campagneId === campagne.id && a.statut !== 'cloturee');
                    const pct = fonctsCampagne.length
                      ? Math.round((fonctsCampagne.filter(f => f.statut !== 'non_testee').length / fonctsCampagne.length) * 100)
                      : 0;

                    return (
                      <div
                        key={campagne.id}
                        className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer group"
                        onClick={() => navigate(`/campagnes/${campagne.id}`)}
                      >
                        <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center flex-shrink-0">
                          <TestTube className="w-4 h-4 text-indigo-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-semibold text-slate-800 truncate">{campagne.nom}</p>
                            {anomCampagne.length > 0 && (
                              <Badge className="bg-red-100 text-red-700 text-[10px] px-1.5 border-0 py-0">
                                {anomCampagne.length} {anomCampagne.length > 1 ? t('dashboard.anomalies_count') : t('dashboard.anomalie')}
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-slate-400 truncate">{projet?.nom}</p>
                          <div className="flex items-center gap-2 mt-1.5">
                            <div className="flex-1 bg-slate-100 rounded-full h-1">
                              <div
                                className="h-1 rounded-full bg-indigo-500"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                            <span className="text-[10px] font-mono text-slate-400">{pct}%</span>
                          </div>
                        </div>
                        <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-indigo-500 transition-colors flex-shrink-0" />
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3 pt-5 px-5">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-bold text-slate-800">{t('dashboard.recent_anomalies')}</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="px-5 pb-5">
              {anomaliesOuvertes.length === 0 ? (
                    <div className="py-6 text-center">
                  <CheckCircle2 className="w-8 h-8 text-emerald-200 mx-auto mb-2" />
                  <p className="text-sm text-slate-400">{t('dashboard.no_open_anomalies')}</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {anomaliesOuvertes.slice(0, 4).map(anomalie => (
                    <div
                      key={anomalie.id}
                      className="flex items-start gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer group"
                      onClick={() => navigate(`/anomalies/${anomalie.id}`)}
                    >
                      <div className="w-8 h-8 bg-red-50 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Bug className="w-4 h-4 text-red-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <p className="text-sm font-semibold text-slate-800 truncate">{anomalie.titre}</p>
                          <Badge className={`text-[10px] px-1.5 border py-0 ${prioriteBadge[anomalie.priorite]}`}>
                            {t('priorite.' + anomalie.priorite)}
                          </Badge>
                        </div>
                        <p className="text-[10px] font-mono text-slate-400">
                          {new Date(anomalie.dateCreation).toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-indigo-500 transition-colors flex-shrink-0 mt-1" />
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => navigate('/projets')}
            className="flex items-center gap-3 p-4 bg-white border border-slate-200 rounded-xl hover:border-indigo-300 hover:shadow-sm transition-all text-left group"
          >
            <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center">
              <FolderKanban className="w-5 h-5 text-indigo-600" />
            </div>
            <div className="flex-1">
              <div className="text-sm font-semibold text-slate-800">{t('dashboard.manage_projects')}</div>
              <div className="text-xs text-slate-400">{projetsActifs.length} {t('dashboard.active')}</div>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-500 transition-colors" />
          </button>

          {currentUser.role === 'chef_testeur' && (
            <>
              <button
                onClick={() => navigate('/campagnes')}
                className="flex items-center gap-3 p-4 bg-white border border-slate-200 rounded-xl hover:border-indigo-300 hover:shadow-sm transition-all text-left group"
              >
                <div className="w-10 h-10 bg-sky-50 rounded-xl flex items-center justify-center">
                  <TestTube className="w-5 h-5 text-sky-600" />
                </div>
                <div className="flex-1">
                  <div className="text-sm font-semibold text-slate-800">{t('dashboard.manage_campaigns')}</div>
                  <div className="text-xs text-slate-400">{campagnesEnCours.length} {t('dashboard.in_progress')}</div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-500 transition-colors" />
              </button>

              <button
                onClick={() => navigate('/reporting')}
                className="flex items-center gap-3 p-4 bg-white border border-slate-200 rounded-xl hover:border-indigo-300 hover:shadow-sm transition-all text-left group"
              >
                <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center">
                  <BarChart3 className="w-5 h-5 text-emerald-600" />
                </div>
                <div className="flex-1">
                  <div className="text-sm font-semibold text-slate-800">{t('dashboard.reports')}</div>
                  <div className="text-xs text-slate-400">{t('dashboard.export_pdf_excel')}</div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-500 transition-colors" />
              </button>
            </>
          )}
        </div>
      </div>
    );
  };

  const renderTesteurDashboard = () => {
    const mesTaches = fonctionnalites.filter(f => f.testeurAssigneId === currentUser.id);
    const mesAnomalies = anomalies.filter(a => a.testeurId === currentUser.id);
    const nonTestees = mesTaches.filter(f => f.statut === 'non_testee').length;
    const conformes = mesTaches.filter(f => f.statut === 'conforme').length;
    const avecAnomalie = mesTaches.filter(f => f.statut === 'anomalie').length;
    const pct = mesTaches.length ? Math.round(((conformes + avecAnomalie) / mesTaches.length) * 100) : 0;

    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900">{t('dashboard.test_tasks_title')}</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {t('dashboard.tester_greeting', { name: currentUser.prenom, count: nonTestees })}
          </p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label={t('dashboard.assigned')}
            value={mesTaches.length}
            icon={TestTube}
            accent="bg-indigo-500"
            iconBg="bg-indigo-50"
            iconColor="text-indigo-600"
            onClick={() => navigate('/testeur/taches')}
          />
          <StatCard
            label={t('dashboard.to_test')}
            value={nonTestees}
            icon={Clock}
            accent="bg-amber-500"
            iconBg="bg-amber-50"
            iconColor="text-amber-600"
            onClick={() => navigate('/testeur/taches')}
          />
          <StatCard
            label={t('dashboard.compliant')}
            value={conformes}
            icon={CheckCircle2}
            accent="bg-emerald-500"
            iconBg="bg-emerald-50"
            iconColor="text-emerald-600"
            onClick={() => navigate('/testeur/taches')}
          />
          <StatCard
            label={t('dashboard.anomalies_created')}
            value={mesAnomalies.length}
            sub={`${mesAnomalies.filter(a => a.statut === 'resolution_signalee').length} ${t('dashboard.to_validate')}`}
            icon={AlertTriangle}
            accent="bg-red-500"
            iconBg="bg-red-50"
            iconColor="text-red-600"
            onClick={() => navigate('/testeur/taches')}
          />
        </div>

        {mesTaches.length > 0 && (
          <div className="bg-white rounded-xl border border-slate-200/80 overflow-hidden shadow-sm">
            <div className="px-4 py-2.5 flex items-center justify-between border-b border-slate-100">
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{t('dashboard.my_tasks_progress')}</span>
              <span className="text-sm font-bold text-slate-700">{pct}%</span>
            </div>
            <div className="px-4 py-3">
              <div className="w-full bg-slate-100 rounded-full h-2">
                <div
                  className="h-2 rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all duration-700"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <div className="flex gap-4 mt-2 text-[10px] text-slate-400">
                <span className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-emerald-400" /> {conformes} {t('dashboard.compliant_label')}
                </span>
                <span className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-red-400" /> {avecAnomalie} {t('dashboard.anomalies_label')}
                </span>
                <span className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-slate-300" /> {nonTestees} {t('dashboard.todo')}
                </span>
              </div>
            </div>
          </div>
        )}

        <Button
          onClick={() => navigate('/testeur/taches')}
          className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white"
        >
          <TestTube className="w-4 h-4" />
          {t('dashboard.see_my_tasks')}
          <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    );
  };

  const renderDeveloppeurDashboard = () => {
    const mesAnomalies = anomalies.filter(a => a.developpeurId === currentUser.id);
    const nouvelles = mesAnomalies.filter(a => a.statut === 'nouvelle').length;
    const enCours = mesAnomalies.filter(a => a.statut === 'en_cours').length;
    const resolues = mesAnomalies.filter(a => a.statut === 'resolution_signalee' || a.statut === 'cloturee').length;

    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900">{t('dashboard.dev_title')}</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {t('dashboard.dev_greeting', { name: currentUser.prenom, count: nouvelles })}
          </p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label={t('dashboard.total_assigned')}
            value={mesAnomalies.length}
            icon={Bug}
            accent="bg-slate-400"
            iconBg="bg-slate-100"
            iconColor="text-slate-600"
            onClick={() => navigate('/developpeur/anomalies')}
          />
          <StatCard
            label={t('dashboard.new')}
            value={nouvelles}
            icon={AlertTriangle}
            accent="bg-red-500"
            iconBg="bg-red-50"
            iconColor="text-red-600"
            onClick={() => navigate('/developpeur/anomalies')}
          />
          <StatCard
            label={t('dashboard.in_progress_dev')}
            value={enCours}
            icon={Clock}
            accent="bg-amber-500"
            iconBg="bg-amber-50"
            iconColor="text-amber-600"
            onClick={() => navigate('/developpeur/anomalies')}
          />
          <StatCard
            label={t('dashboard.resolved_dev')}
            value={resolues}
            icon={CheckCircle2}
            accent="bg-emerald-500"
            iconBg="bg-emerald-50"
            iconColor="text-emerald-600"
            onClick={() => navigate('/developpeur/anomalies')}
          />
        </div>

        {mesAnomalies.length > 0 && (
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3 pt-5 px-5">
              <CardTitle className="text-sm font-bold text-slate-800">{t('dashboard.priority_anomalies')}</CardTitle>
            </CardHeader>
            <CardContent className="px-5 pb-5">
              <div className="space-y-2">
                {mesAnomalies
                  .filter(a => a.statut !== 'cloturee')
                  .sort((a, b) => {
                    const order = { critique: 0, haute: 1, moyenne: 2, basse: 3 };
                    return (order[a.priorite as keyof typeof order] ?? 3) - (order[b.priorite as keyof typeof order] ?? 3);
                  })
                  .slice(0, 4)
                  .map(anomalie => (
                    <div
                      key={anomalie.id}
                      className="flex items-start gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer group"
                      onClick={() => navigate(`/anomalies/${anomalie.id}`)}
                    >
                      <div className="w-8 h-8 bg-red-50 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Bug className="w-4 h-4 text-red-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-slate-800 truncate">{anomalie.titre}</p>
                          <Badge className={`text-[10px] px-1.5 border py-0 ${prioriteBadge[anomalie.priorite]}`}>
                            {t('priorite.' + anomalie.priorite)}
                          </Badge>
                        </div>
                        <p className="text-[10px] font-mono text-slate-400 mt-0.5">
                          {t('dashboard.status')} : {t('statut.' + anomalie.statut)}
                        </p>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-indigo-500 transition-colors flex-shrink-0 mt-1" />
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        )}

        <Button
          onClick={() => navigate('/developpeur/anomalies')}
          className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white"
        >
          <Bug className="w-4 h-4" />
          {t('dashboard.see_my_anomalies')}
          <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    );
  };

  return (
    <div>
      {currentUser.role === 'admin' && renderAdminDashboard()}
      {currentUser.role === 'chef_testeur' && renderChefTesteurDashboard()}
      {currentUser.role === 'testeur' && renderTesteurDashboard()}
      {currentUser.role === 'developpeur' && renderDeveloppeurDashboard()}
    </div>
  );
}
