import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { ArrowLeft, AlertTriangle } from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { detteQualiteService, DetteQualite, ResumeDette } from '../services/detteQualiteService';

const impactConfig: Record<string, { label: string; cls: string }> = {
  faible: { label: 'Faible', cls: 'bg-gray-100 text-gray-600' },
  moyen: { label: 'Moyen', cls: 'bg-yellow-100 text-yellow-700' },
  eleve: { label: 'Élevé', cls: 'bg-orange-100 text-orange-700' },
  critique: { label: 'Critique', cls: 'bg-red-100 text-red-700' },
};

export function DetteQualitePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { anomalies } = useData();

  const dettes = useMemo(() => {
    return anomalies
      .filter((a: any) => a.statut !== 'cloturee' && a.statut !== 'validee')
      .map((a: any) => {
        const jours = Math.floor((Date.now() - new Date(a.dateCreation).getTime()) / 86400000);
        const impact = a.priorite === 'critique' ? 'critique' : a.priorite === 'haute' ? 'eleve' : a.priorite === 'moyenne' ? 'moyen' : 'faible';
        return {
          id: a.id, anomalieId: a.id, campagneId: a.campagneId, projetId: '',
          module: '', priorite: a.priorite, statutAnomalie: a.statut,
          dateCreation: a.dateCreation, dateLimiteCorrection: a.dateLimiteCorrection,
          joursRetention: jours, impact, description: a.description,
        } as DetteQualite;
      });
  }, [anomalies]);

  const resume = detteQualiteService.calculerResume(dettes);

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" className="-ml-2" onClick={() => navigate(-1)}>
        <ArrowLeft className="w-4 h-4 mr-2" />Retour
      </Button>

      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-red-50">
          <AlertTriangle className="w-6 h-6 text-red-600" />
        </div>
        <div>
          <h2 className="text-2xl font-semibold">Dette qualité</h2>
          <p className="text-sm text-gray-500">Anomalies non résolues qui s'accumulent</p>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="py-6 text-center">
            <div className="text-3xl font-bold text-red-600">{resume.total}</div>
            <p className="text-sm text-gray-500 mt-1">Anomalies ouvertes</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-6 text-center">
            <div className="text-3xl font-bold text-orange-600">{resume.detteCritique}</div>
            <p className="text-sm text-gray-500 mt-1">Impact élevé/critique</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-6 text-center">
            <div className="text-3xl font-bold text-gray-700">{resume.ancienneteMoyenne}</div>
            <p className="text-sm text-gray-500 mt-1">Jours moyens d'ouverture</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-6 text-center">
            <div className="text-3xl font-bold text-indigo-600">{resume.parModule.length}</div>
            <p className="text-sm text-gray-500 mt-1">Modules touchés</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-base">Par niveau d'impact</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {(['critique', 'eleve', 'moyen', 'faible'] as const).map((imp) => (
              <div key={imp} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge className={impactConfig[imp].cls}>{impactConfig[imp].label}</Badge>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div className="h-2 rounded-full bg-current" style={{ width: `${resume.total > 0 ? (resume.parImpact[imp] / resume.total) * 100 : 0}%` }} />
                  </div>
                  <span className="text-sm font-medium w-8 text-right">{resume.parImpact[imp]}</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Par module</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {resume.parModule.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">Aucune dette</p>
            ) : (
              resume.parModule.map((m) => (
                <div key={m.module} className="flex items-center justify-between p-2 rounded-lg bg-gray-50">
                  <span className="text-sm font-medium">{m.module || 'Inconnu'}</span>
                  <Badge variant="secondary">{m.count}</Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Anomalies les plus anciennes</CardTitle></CardHeader>
        <CardContent className="p-0">
          {dettes.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-8">Aucune dette qualité</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Anomalie</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Impact</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Statut</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Jours ouverts</th>
                </tr>
              </thead>
              <tbody>
                {dettes.sort((a, b) => b.joursRetention - a.joursRetention).slice(0, 10).map((d) => (
                  <tr key={d.id} className="border-b last:border-0 hover:bg-gray-50 cursor-pointer" onClick={() => navigate(`/anomalies/${d.anomalieId}`)}>
                    <td className="py-3 px-4 font-medium truncate max-w-xs">{d.description}</td>
                    <td className="py-3 px-4"><Badge className={impactConfig[d.impact].cls}>{impactConfig[d.impact].label}</Badge></td>
                    <td className="py-3 px-4"><Badge variant="outline">{d.statutAnomalie}</Badge></td>
                    <td className="py-3 px-4 font-medium">{d.joursRetention}j</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
