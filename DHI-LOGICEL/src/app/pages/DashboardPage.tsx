import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { BarChart3, TrendingUp, TrendingDown, Minus, Bug, TestTube, FolderKanban, Shield, Activity } from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { dashboardService, DashboardKPI, GraphiqueDonnee } from '../services/dashboardService';

function MiniBarChart({ data, height = 80 }: { data: GraphiqueDonnee[]; height?: number }) {
  const max = Math.max(...data.map((d) => d.valeur), 1);
  return (
    <div className="flex items-end gap-1" style={{ height }}>
      {data.map((d, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1">
          <div className="w-full rounded-t" style={{ height: `${(d.valeur / max) * (height - 20)}px`, backgroundColor: d.couleur || '#6366f1' }} />
          <span className="text-[10px] text-gray-500 truncate w-full text-center">{d.label}</span>
        </div>
      ))}
    </div>
  );
}

function KPICard({ kpi }: { kpi: DashboardKPI }) {
  const icons: Record<string, React.ElementType> = { folder: FolderKanban, bug: Bug, test: TestTube, alert: Shield, check: Activity, clipboard: BarChart3 };
  const Icon = icons[kpi.icon || ''] || Activity;
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="py-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide">{kpi.label}</p>
            <p className={`text-2xl font-bold ${kpi.color || 'text-gray-800'}`}>{kpi.valeur}</p>
          </div>
          <div className={`p-2 rounded-lg ${(kpi.color || '').replace('text-', 'bg-').replace('-600', '-50')}`}>
            <Icon className={`w-5 h-5 ${kpi.color || 'text-gray-400'}`} />
          </div>
          {kpi.tendance && (
            <div className="absolute top-2 right-2">
              {kpi.tendance === 'up' && <TrendingUp className="w-3 h-3 text-emerald-500" />}
              {kpi.tendance === 'down' && <TrendingDown className="w-3 h-3 text-red-500" />}
              {kpi.tendance === 'stable' && <Minus className="w-3 h-3 text-gray-400" />}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function DonutChart({ data, size = 120 }: { data: GraphiqueDonnee[]; size?: number }) {
  const total = data.reduce((s, d) => s + d.valeur, 0) || 1;
  let cumul = 0;
  const segments = data.map((d) => {
    const pct = (d.valeur / total) * 100;
    const start = cumul;
    cumul += pct;
    return { ...d, start, pct };
  });
  const r = size / 2 - 10;

  return (
    <div className="flex items-center gap-4">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {segments.map((seg, i) => {
          const dashArray = `${(seg.pct / 100) * 2 * Math.PI * r} ${2 * Math.PI * r}`;
          const dashOffset = -(seg.start / 100) * 2 * Math.PI * r;
          return <circle key={i} cx={size / 2} cy={size / 2} r={r} fill="none" stroke={seg.couleur} strokeWidth={20}
            strokeDasharray={dashArray} strokeDashoffset={dashOffset} />;
        })}
        <text x={size / 2} y={size / 2} textAnchor="middle" dominantBaseline="middle" className="text-lg font-bold fill-gray-800">{total}</text>
      </svg>
      <div className="space-y-1">
        {data.map((d, i) => (
          <div key={i} className="flex items-center gap-2 text-xs">
            <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: d.couleur }} />
            <span className="text-gray-600">{d.label}</span>
            <span className="font-medium">{d.valeur}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function DashboardPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { anomalies, campagnes, projets, testCases, produits } = useData();
  const [scope, setScope] = useState<'global' | 'projet'>('global');

  const kpis = useMemo(() => dashboardService.calculerKPIs(anomalies, campagnes, projets, testCases), [anomalies, campagnes, projets, testCases]);
  const statsAnomalies = useMemo(() => dashboardService.graphiqueStatutsAnomalies(anomalies), [anomalies]);
  const statsPriorites = useMemo(() => dashboardService.graphiquePriorites(anomalies), [anomalies]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-indigo-50">
            <BarChart3 className="w-6 h-6 text-indigo-600" />
          </div>
          <div>
            <h2 className="text-2xl font-semibold">Tableau de bord</h2>
            <p className="text-sm text-gray-500">Vue d'ensemble qualité</p>
          </div>
        </div>
        <div className="flex gap-2">
          {(['global', 'projet'] as const).map((s) => (
            <Button key={s} size="sm" variant={scope === s ? 'default' : 'outline'}
              onClick={() => setScope(s)}>
              {s === 'global' ? 'Global' : 'Par projet'}
            </Button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {kpis.map((kpi, i) => <KPICard key={i} kpi={kpi} />)}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-base">Statut des anomalies</CardTitle></CardHeader>
          <CardContent>
            {statsAnomalies.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-8">Aucune anomalie</p>
            ) : (
              <DonutChart data={statsAnomalies} />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Répartition par priorité</CardTitle></CardHeader>
          <CardContent>
            {statsPriorites.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-8">Aucune anomalie</p>
            ) : (
              <MiniBarChart data={statsPriorites} height={120} />
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Projets récents</CardTitle></CardHeader>
        <CardContent className="p-0">
          {projets.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-8">Aucun projet</p>
          ) : (
            <table className="w-full text-sm">
              <thead><tr className="border-b bg-gray-50">
                <th className="text-left py-3 px-4 font-medium text-gray-600">Projet</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Statut</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Campagnes</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Anomalies</th>
              </tr></thead>
              <tbody>
                {projets.slice(0, 5).map((p) => {
                  const pCampagnes = campagnes.filter((c) => c.projetId === p.id);
                  const pAnomalies = anomalies.filter((a) => pCampagnes.some((c) => c.id === a.campagneId));
                  return (
                    <tr key={p.id} className="border-b last:border-0 hover:bg-gray-50 cursor-pointer" onClick={() => navigate(`/projets/${p.id}`)}>
                      <td className="py-3 px-4 font-medium">{p.nom}</td>
                      <td className="py-3 px-4"><Badge variant="outline">{p.statut}</Badge></td>
                      <td className="py-3 px-4">{pCampagnes.length}</td>
                      <td className="py-3 px-4"><Badge className={pAnomalies.length > 0 ? 'bg-orange-100 text-orange-700' : 'bg-emerald-100 text-emerald-700'}>{pAnomalies.length}</Badge></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
