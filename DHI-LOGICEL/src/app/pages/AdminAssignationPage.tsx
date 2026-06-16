import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { useNavigate } from 'react-router';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Input } from '../components/ui/input';
import { UserPlus, Search } from 'lucide-react';

export function AdminAssignationPage() {
  const { t } = useTranslation();
  const { currentUser, users } = useAuth();
  const { fonctionnalites, campagnes, projets, modifierFonctionnalite } = useData();
  const navigate = useNavigate();

  const [filterCampagne, setFilterCampagne] = useState<string>('tous');
  const [filterTesteur, setFilterTesteur] = useState<string>('tous');
  const [searchTerm, setSearchTerm] = useState('');

  if (!currentUser || currentUser.role !== 'admin') {
    return (
      <div className="text-center py-20">
        <UserPlus className="w-10 h-10 text-slate-300 mx-auto mb-3" />
        <p className="text-slate-500">{t('admin.assignment.access_denied')}</p>
      </div>
    );
  }

  const testeurs = users.filter((u: any) => u.role === 'testeur');
  const fonctionnalitesNonAssignees = fonctionnalites.filter(f => !f.testeurAssigneId);
  const fonctionnalitesAssignees = fonctionnalites.filter(f => f.testeurAssigneId);

  const fonctionnalitesFiltrees = fonctionnalites.filter(fonct => {
    const matchCampagne = filterCampagne === 'tous' || fonct.campagneId === filterCampagne;
    const matchTesteur = filterTesteur === 'tous' || fonct.testeurAssigneId === filterTesteur;
    const matchSearch = !searchTerm ||
      fonct.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      fonct.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchCampagne && matchTesteur && matchSearch;
  });

  const handleAssigner = (fonctionnaliteId: string, testeurId: string) => {
    modifierFonctionnalite(fonctionnaliteId, { testeurAssigneId: testeurId, statut: 'non_testee' });
  };

  const handleDesassigner = (fonctionnaliteId: string) => {
    modifierFonctionnalite(fonctionnaliteId, { testeurAssigneId: '', statut: 'non_testee' });
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

  const stats = {
    total: fonctionnalites.length,
    nonAssignees: fonctionnalitesNonAssignees.length,
    assignees: fonctionnalitesAssignees.length,
    testees: fonctionnalites.filter(f => f.statut === 'conforme').length,
    anomalies: fonctionnalites.filter(f => f.statut === 'anomalie').length
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">{t('admin.assignment.title')}</h1>
        <p className="text-sm text-slate-500 mt-0.5">{t('admin.assignment.subtitle')}</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-0 shadow-sm overflow-hidden">
          <div className="h-0.5 bg-indigo-500" />
          <CardContent className="pt-4 pb-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{t('admin.assignment.total')}</p>
            <p className="text-3xl font-bold text-slate-900 mt-1">{stats.total}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm overflow-hidden">
          <div className="h-0.5 bg-gray-500" />
          <CardContent className="pt-4 pb-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{t('admin.assignment.unassigned')}</p>
            <p className="text-3xl font-bold text-gray-600 mt-1">{stats.nonAssignees}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm overflow-hidden">
          <div className="h-0.5 bg-blue-500" />
          <CardContent className="pt-4 pb-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{t('admin.assignment.assigned')}</p>
            <p className="text-3xl font-bold text-blue-600 mt-1">{stats.assignees}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm overflow-hidden">
          <div className="h-0.5 bg-emerald-500" />
          <CardContent className="pt-4 pb-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{t('admin.assignment.tested')}</p>
            <p className="text-3xl font-bold text-emerald-600 mt-1">{stats.testees}</p>
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
                placeholder={t('admin.assignment.search_placeholder')}
                className="pl-9 bg-white border-slate-200 h-9"
              />
            </div>
            <Select value={filterCampagne || undefined} onValueChange={setFilterCampagne}>
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
            <Select value={filterTesteur || undefined} onValueChange={setFilterTesteur}>
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
          <div className="space-y-2">
            {fonctionnalitesFiltrees.length === 0 && (
              <div className="py-10 text-center">
                <UserPlus className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                <p className="text-sm text-slate-400">{t('admin.assignment.no_features')}</p>
              </div>
            )}
            {fonctionnalitesFiltrees.map(fonct => {
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
                      <span><strong>{t('admin.assignment.campagne')}:</strong> {campagne?.nom}</span>
                      <span><strong>{t('admin.assignment.projet')}:</strong> {projet?.nom}</span>
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
        </CardContent>
      </Card>
    </div>
  );
}