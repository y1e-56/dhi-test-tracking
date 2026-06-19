import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { useNavigate } from 'react-router';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Input } from '../components/ui/input';
import { UserPlus, Search, Loader2, ExternalLink, Bug, Users, FolderKanban, LayoutDashboard } from 'lucide-react';
import { Fonctionnalite } from '../types';
import { featureService } from '../services/featureService';
import { useDebounce } from '../hooks/useDebounce';
import { Pagination } from '../components/ui/Pagination';

export function AdminAssignationPage() {
  const { t } = useTranslation();
  const { currentUser, users } = useAuth();
  const { campagnes, projets, modifierFonctionnalite } = useData();
  const navigate = useNavigate();

  const [features, setFeatures] = useState<Fonctionnalite[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const [filterCampagne, setFilterCampagne] = useState<string>('tous');
  const [filterTesteur, setFilterTesteur] = useState<string>('tous');
  const [searchTerm, setSearchTerm] = useState('');
  const [globalTotal, setGlobalTotal] = useState(0);
  const debouncedSearch = useDebounce(searchTerm, 300);

  const fetchFeatures = useCallback(async () => {
    setLoading(true);
    try {
      const result = await featureService.listPaginated({
        page,
        limit,
        campagneId: filterCampagne !== 'tous' ? filterCampagne : undefined,
        assigneeId: filterTesteur !== 'tous' ? filterTesteur : undefined,
        recherche: debouncedSearch || undefined,
      });
      setFeatures(result.data);
      setTotal(result.pagination.total);
      setTotalPages(result.pagination.totalPages);

      if (page === 1) setGlobalTotal(result.pagination.total);
    } finally {
      setLoading(false);
    }
  }, [page, limit, filterCampagne, filterTesteur, debouncedSearch]);

  useEffect(() => { fetchFeatures(); }, [fetchFeatures]);
  useEffect(() => { setPage(1); }, [filterCampagne, filterTesteur, debouncedSearch]);

  if (!currentUser || currentUser.role !== 'admin') {
    return (
      <div className="text-center py-20">
        <UserPlus className="w-10 h-10 text-slate-300 mx-auto mb-3" />
        <p className="text-slate-500">{t('admin.assignment.access_denied')}</p>
      </div>
    );
  }

  const testeurs = users.filter((u: any) => u.role === 'testeur');

  const handleAssigner = async (fonctionnaliteId: string, testeurId: string) => {
    await modifierFonctionnalite(fonctionnaliteId, { testeurAssigneId: testeurId, statut: 'non_testee' });
    fetchFeatures();
  };

  const handleDesassigner = async (fonctionnaliteId: string) => {
    await modifierFonctionnalite(fonctionnaliteId, { testeurAssigneId: '', statut: 'non_testee' });
    fetchFeatures();
  };

  const statutBadgeConfig: Record<string, { labelKey: string; className: string }> = {
    non_testee: { labelKey: 'admin.assignment.not_assigned', className: 'bg-gray-100 text-gray-700 border-gray-200' },
    conforme: { labelKey: 'admin.assignment.status_compliant', className: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
    anomalie: { labelKey: 'admin.assignment.status_anomaly', className: 'bg-red-100 text-red-700 border-red-200' }
  };

  const getStatutBadge = (statut: string) => {
    const found = statutBadgeConfig[statut as keyof typeof statutBadgeConfig];
    return found ? { label: t(found.labelKey), className: found.className } : { label: statut, className: 'bg-gray-100 text-gray-700 border-gray-200' };
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">{t('admin.assignment.title')}</h1>
        <p className="text-sm text-slate-500 mt-0.5">{t('admin.assignment.subtitle')}</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <button onClick={() => navigate('/admin/anomalies')} className="text-left">
          <Card className="border-0 shadow-sm overflow-hidden cursor-pointer hover:shadow-md transition-shadow hover:scale-[1.02] active:scale-[0.98]">
            <div className="h-1 bg-red-500" />
            <CardContent className="pt-5 pb-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500">{t('admin.assignment.go_anomalies')}</p>
                  <p className="text-xs text-slate-400 mt-2 font-medium">{t('admin.assignment.view_all_anomalies')}</p>
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
                  <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500">{t('admin.assignment.go_users')}</p>
                  <p className="text-xs text-slate-400 mt-2 font-medium">{t('admin.assignment.manage_users')}</p>
                </div>
                <div className="w-10 h-10 bg-purple-50 rounded-2xl flex items-center justify-center flex-shrink-0">
                  <Users className="w-5 h-5 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </button>
        <button onClick={() => navigate('/campagnes')} className="text-left">
          <Card className="border-0 shadow-sm overflow-hidden cursor-pointer hover:shadow-md transition-shadow hover:scale-[1.02] active:scale-[0.98]">
            <div className="h-1 bg-sky-500" />
            <CardContent className="pt-5 pb-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500">{t('admin.assignment.go_campaigns')}</p>
                  <p className="text-xs text-slate-400 mt-2 font-medium">{t('admin.assignment.view_campaigns')}</p>
                </div>
                <div className="w-10 h-10 bg-sky-50 rounded-2xl flex items-center justify-center flex-shrink-0">
                  <FolderKanban className="w-5 h-5 text-sky-600" />
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
                  <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500">{t('admin.assignment.go_dashboard')}</p>
                  <p className="text-xs text-slate-400 mt-2 font-medium">{t('admin.assignment.back_to_dashboard')}</p>
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
                placeholder={t('admin.assignment.search_placeholder')}
                className="pl-9 bg-white border-slate-200 h-9"
              />
            </div>
            <Select value={filterCampagne} onValueChange={(v) => { setFilterCampagne(v); setPage(1); }}>
              <SelectTrigger className="w-48 bg-white border-slate-200 h-9">
                <SelectValue placeholder={t('admin.assignment.filter_campaign')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="tous">{t('admin.assignment.all_campaigns')}</SelectItem>
                {campagnes.map(campagne => {
                  const projet = projets.find(p => p.id === campagne.projetId);
                  return (
                    <SelectItem key={campagne.id} value={campagne.id}>
                      {campagne.nom} ({projet?.nom})
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
            <Select value={filterTesteur} onValueChange={(v) => { setFilterTesteur(v); setPage(1); }}>
              <SelectTrigger className="w-48 bg-white border-slate-200 h-9">
                <SelectValue placeholder={t('admin.assignment.filter_tester')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="tous">{t('admin.assignment.all_testers')}</SelectItem>
                {testeurs.map(testeur => (
                  <SelectItem key={testeur.id} value={testeur.id}>
                    {testeur.prenom} {testeur.nom}
                  </SelectItem>
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
          ) : features.length === 0 ? (
            <div className="py-10 text-center">
              <UserPlus className="w-8 h-8 text-slate-200 mx-auto mb-2" />
              <p className="text-sm text-slate-400">{t('admin.assignment.no_features')}</p>
            </div>
          ) : (
            <div className="space-y-2">
              {features.map(fonct => {
                const campagne = campagnes.find(c => c.id === fonct.campagneId);
                const projet = projets.find(p => p.id === campagne?.projetId);
                const testeur = users.find((u: any) => u.id === fonct.testeurAssigneId);
                const statutBadge = getStatutBadge(fonct.statut);

                return (
                  <div key={fonct.id} className="flex items-start gap-4 p-4 rounded-xl border border-slate-100 hover:border-slate-200 hover:bg-slate-50 transition-colors">
                    <div className="flex-1 min-w-0 space-y-2">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <h3 className="font-medium text-slate-800">{fonct.nom}</h3>
                            <Badge className={statutBadge.className}>{statutBadge.label}</Badge>
                          </div>
                          <p className="text-sm text-slate-600 line-clamp-2 mb-2">{fonct.description}</p>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                        <span><strong>{t('admin.assignment.module')}:</strong> {fonct.module}</span>
                        <span>
                          <strong>{t('admin.assignment.campagne')}:</strong>{' '}
                          <button
                            onClick={() => navigate(`/campagnes/${campagne?.id}`)}
                            className="text-indigo-600 hover:text-indigo-800 hover:underline inline-flex items-center gap-0.5"
                          >
                            {campagne?.nom} <ExternalLink className="w-3 h-3" />
                          </button>
                        </span>
                        <span>
                          <strong>{t('admin.assignment.projet')}:</strong>{' '}
                          <button
                            onClick={() => navigate(`/projets/${projet?.id}`)}
                            className="text-indigo-600 hover:text-indigo-800 hover:underline inline-flex items-center gap-0.5"
                          >
                            {projet?.nom} <ExternalLink className="w-3 h-3" />
                          </button>
                        </span>
                        <span><strong>{t('admin.assignment.priorite')}:</strong> {t(`priorite.${fonct.priorite}`)}</span>
                      </div>

                      <div className="flex items-center gap-3 pt-2">
                        {fonct.testeurAssigneId ? (
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                              <span className="text-xs font-bold text-blue-700">
                                {testeur?.prenom[0]}{testeur?.nom[0]}
                              </span>
                            </div>
                            <span className="text-sm text-slate-700">
                              {t('admin.assignment.assigned_to')} {testeur?.prenom} {testeur?.nom}
                            </span>
                            <Button size="sm" variant="outline"
                              onClick={() => handleDesassigner(fonct.id)}
                              disabled={fonct.statut === 'conforme'}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50 h-8 text-xs">
                              {t('admin.assignment.unassign')}
                            </Button>
                          </div>
                        ) : fonct.statut === 'conforme' ? (
                          <span className="text-sm text-emerald-600 font-medium">{t('admin.assignment.not_assignable')}</span>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-slate-500">{t('admin.assignment.not_assigned')}</span>
                            <Select value={undefined} onValueChange={(value) => handleAssigner(fonct.id, value)}>
                              <SelectTrigger className="w-48 h-8 text-xs">
                                <SelectValue placeholder={t('admin.assignment.assign_to')} />
                              </SelectTrigger>
                              <SelectContent>
                                {testeurs.map(testeur => (
                                  <SelectItem key={testeur.id} value={testeur.id}>
                                    {testeur.prenom} {testeur.nom}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        )}
                      </div>
                    </div>
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
