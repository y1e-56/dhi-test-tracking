import { useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Progress } from '../components/ui/progress';
import { ArrowLeft, Loader2, AlertTriangle, Layers, TestTube, Shield, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { CouvertureModule, CouvertureTypeTest, CouvertureCriticite, TrouTest, ScoreQualiteAvance } from '../types';
import { couvertureService } from '../services/couvertureService';
import { useData } from '../contexts/DataContext';

export function CouverturePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { fonctionnalites, anomalies } = useData();

  const [modules, setModules] = useState<CouvertureModule[]>([]);
  const [types, setTypes] = useState<CouvertureTypeTest[]>([]);
  const [criticite, setCriticite] = useState<CouvertureCriticite[]>([]);
  const [trous, setTrous] = useState<TrouTest[]>([]);
  const [score, setScore] = useState<ScoreQualiteAvance | null>(null);

  const calculer = useCallback(() => {
    const feats = fonctionnalites.map((f: any) => ({ module: f.module || 'Sans module', statut: f.statut, priorite: f.priorite }));
    const mods = couvertureService.calculerCouvertureModules(feats);
    const crits = couvertureService.calculerCouvertureCriticite(feats);
    const tcTypes = couvertureService.calculerCouvertureTypes([], []);
    const tr = couvertureService.detecterTrous(feats, [], mods, tcTypes);
    const sc = couvertureService.calculerScoreAvance('global', feats, mods, tcTypes);
    setModules(mods);
    setCriticite(crits);
    setTypes(tcTypes);
    setTrous(tr);
    setScore(sc);
  }, [fonctionnalites]);

  useEffect(() => { calculer(); }, [calculer]);

  const totalFeatures = fonctionnalites.length;
  const totalConformes = fonctionnalites.filter((f: any) => f.statut === 'conforme').length;
  const totalAnomalies = fonctionnalites.filter((f: any) => f.statut === 'anomalie').length;

  const getTendanceIcon = (tendance: string) => {
    if (tendance === 'amelioration') return <TrendingUp className="w-4 h-4 text-emerald-500" />;
    if (tendance === 'deterioration') return <TrendingDown className="w-4 h-4 text-red-500" />;
    return <Minus className="w-4 h-4 text-gray-400" />;
  };

  const getCouleurTaux = (taux: number) => taux >= 80 ? 'text-emerald-600' : taux >= 50 ? 'text-orange-500' : 'text-red-600';

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" className="-ml-2" onClick={() => navigate(-1)}>
        <ArrowLeft className="w-4 h-4 mr-2" />Retour
      </Button>

      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-indigo-50">
          <Layers className="w-6 h-6 text-indigo-600" />
        </div>
        <div>
          <h2 className="text-2xl font-semibold">Couverture des tests</h2>
          <p className="text-sm text-gray-500">Analyse multidimensionnelle de la couverture de test</p>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="py-6 text-center">
            <div className="text-3xl font-bold text-indigo-600">{totalFeatures}</div>
            <p className="text-sm text-gray-500 mt-1">Fonctionnalités</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-6 text-center">
            <div className="text-3xl font-bold text-emerald-600">{totalConformes}</div>
            <p className="text-sm text-gray-500 mt-1">Conformes</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-6 text-center">
            <div className="text-3xl font-bold text-red-600">{totalAnomalies}</div>
            <p className="text-sm text-gray-500 mt-1">Anomalies</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-6 text-center">
            <div className="flex items-center justify-center gap-2">
              <div className="text-3xl font-bold text-gray-700">{score?.scoreGlobal ?? 0}%</div>
              {score && getTendanceIcon(score.tendance)}
            </div>
            <p className="text-sm text-gray-500 mt-1">Score global</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="modules">
        <TabsList>
          <TabsTrigger value="modules" className="gap-1.5"><Layers className="w-4 h-4" />Par module ({modules.length})</TabsTrigger>
          <TabsTrigger value="types" className="gap-1.5"><TestTube className="w-4 h-4" />Par type ({types.length})</TabsTrigger>
          <TabsTrigger value="criticite" className="gap-1.5"><Shield className="w-4 h-4" />Par criticité</TabsTrigger>
          <TabsTrigger value="trous" className="gap-1.5"><AlertTriangle className="w-4 h-4" />Trous ({trous.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="modules" className="mt-4">
          {modules.length === 0 ? (
            <Card><CardContent className="py-10 text-center"><Layers className="w-10 h-10 text-gray-300 mx-auto mb-3" /><p className="text-gray-500">Aucune donnée de module</p></CardContent></Card>
          ) : (
            <div className="space-y-3">
              {modules.map((m) => (
                <Card key={m.module}>
                  <CardContent className="py-4 px-5">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <h4 className="font-medium">{m.module}</h4>
                        <p className="text-xs text-gray-500">{m.totalFonctionnalites} fonctionnalités</p>
                      </div>
                      <span className={`text-xl font-bold ${getCouleurTaux(m.tauxCouverture)}`}>{m.tauxCouverture}%</span>
                    </div>
                    <Progress value={m.tauxCouverture} className="mb-2" />
                    <div className="flex gap-4 text-xs text-gray-500">
                      <span><span className="text-emerald-600 font-medium">{m.couvertes}</span> conformes</span>
                      <span><span className="text-red-500 font-medium">{m.avecAnomalies}</span> anomalies</span>
                      <span><span className="text-gray-400 font-medium">{m.nonTestees}</span> non testées</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="types" className="mt-4">
          {types.length === 0 ? (
            <Card><CardContent className="py-10 text-center"><TestTube className="w-10 h-10 text-gray-300 mx-auto mb-3" /><p className="text-gray-500">Aucun type de test enregistré</p></CardContent></Card>
          ) : (
            <div className="space-y-3">
              {types.map((tt) => (
                <Card key={tt.type}>
                  <CardContent className="py-4 px-5 flex items-center justify-between">
                    <div>
                      <h4 className="font-medium capitalize">{tt.type.replace(/_/g, ' ')}</h4>
                      <p className="text-xs text-gray-500">{tt.totalCasTests} cas de test</p>
                    </div>
                    <div className="text-right">
                      <div className={`text-xl font-bold ${getCouleurTaux(tt.tauxReussite)}`}>{tt.tauxReussite}%</div>
                      <p className="text-xs text-gray-500">{tt.reussis}/{tt.executes} réussis</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="criticite" className="mt-4">
          <div className="space-y-3">
            {criticite.map((c) => (
              <Card key={c.criticite}>
                <CardContent className="py-4 px-5 flex items-center justify-between">
                  <div>
                    <Badge variant={c.criticite === 'critique' ? 'destructive' : c.criticite === 'haute' ? 'default' : 'secondary'}>
                      {c.criticite}
                    </Badge>
                    <p className="text-xs text-gray-500 mt-1">{c.totalFonctionnalites} fonctionnalités</p>
                  </div>
                  <div className="text-right">
                    <span className={`text-xl font-bold ${getCouleurTaux(c.tauxCouverture)}`}>{c.tauxCouverture}%</span>
                    <p className="text-xs text-gray-500">{c.couvertes}/{c.totalFonctionnalites} couvertes</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="trous" className="mt-4">
          {trous.length === 0 ? (
            <Card><CardContent className="py-10 text-center"><AlertTriangle className="w-10 h-10 text-gray-300 mx-auto mb-3" /><p className="text-gray-500">Aucun trou de test détecté</p></CardContent></Card>
          ) : (
            <div className="space-y-3">
              {trous.map((tr) => (
                <Card key={tr.id} className="border-orange-200">
                  <CardContent className="py-3 px-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <p className="font-medium">{tr.description}</p>
                        <p className="text-sm text-gray-500 mt-1">{tr.recommandation}</p>
                      </div>
                      <Badge variant={tr.criticite === 'critique' || tr.criticite === 'haute' ? 'destructive' : 'secondary'}>
                        {tr.criticite}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
