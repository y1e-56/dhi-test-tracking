import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { ArrowLeft, Rocket, CheckCircle2, XCircle, AlertTriangle, Shield, Plus, Trash2 } from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { goNogoService } from '../services/goNogoService';
import { CheckListItem, Derogation, DecisionGoNogo, VerdictGoNogo } from '../types';

const verdictConfig: Record<VerdictGoNogo, { label: string; cls: string; icon: React.ElementType }> = {
  go: { label: 'GO', cls: 'bg-emerald-100 text-emerald-800 border-2 border-emerald-400', icon: Rocket },
  no_go: { label: 'NO-GO', cls: 'bg-red-100 text-red-800 border-2 border-red-400', icon: XCircle },
  go_reserve: { label: 'GO RÉSERVÉ', cls: 'bg-amber-100 text-amber-800 border-2 border-amber-400', icon: AlertTriangle },
};

const statutCheckConfig: Record<string, { label: string; cls: string }> = {
  a_faire: { label: 'À faire', cls: 'bg-gray-100 text-gray-600' },
  en_cours: { label: 'En cours', cls: 'bg-blue-100 text-blue-700' },
  fait: { label: 'Fait', cls: 'bg-emerald-100 text-emerald-700' },
  na: { label: 'N/A', cls: 'bg-slate-100 text-slate-500' },
};

export function GoNogoPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { projets, campagnes, anomalies, testCases, produits, fonctionnalites } = useData();

  const [projetId, setProjetId] = useState('');
  const [decision, setDecision] = useState<DecisionGoNogo | null>(null);
  const [verdict, setVerdict] = useState<VerdictGoNogo>('go');
  const [commentaires, setCommentaires] = useState('');
  const [nouvelleRef, setNouvelleRef] = useState('');
  const [nouvelleDesc, setNouvelleDesc] = useState('');
  const [nouveauRisque, setNouveauRisque] = useState('');
  const [nouvellesMesures, setNouvellesMesures] = useState('');

  const statsProjet = useMemo(() => {
    if (!projetId) return null;
    const campagnesProjet = campagnes.filter((c) => c.projetId === projetId);
    const campagnesIds = campagnesProjet.map((c) => c.id);
    const featuresProjet = fonctionnalites.filter((f) => campagnesIds.includes(f.campagneId));
    const featureIds = featuresProjet.map((f) => f.id);
    const projAnomalies = anomalies.filter((a) => campagnesIds.includes(a.campagneId));
    const projTC = testCases.filter((tc) => featureIds.includes(tc.featureId));
    const ouvertes = projAnomalies.filter((a) => !['cloturee', 'validee'].includes(a.statut)).length;
    const critiques = projAnomalies.filter((a) => a.priorite === 'critique' && !['cloturee', 'validee'].includes(a.statut)).length;
    const passants = projTC.filter((tc) => tc.status === 'passe').length;
    const taux = projTC.length > 0 ? Math.round((passants / projTC.length) * 100) : 0;
    return { total: projAnomalies.length, ouvertes, critiques, taux, totalTC: projTC.length };
  }, [projetId, anomalies, testCases, campagnes, fonctionnalites]);

  const initDecision = () => {
    if (!projetId || !statsProjet) return;
    const checklist = goNogoService.creerChecklistDefaut();
    const d: DecisionGoNogo = {
      id: `id_${Date.now()}`, projetId, versionId: 'latest',
      verdict: 'go', dateDecision: new Date().toISOString(),
      decisionParId: currentUser?.id || '', commentaires: '',
      checklist, derogations: [],
      scoreQualite: statsProjet.taux, anomaliesOuvertes: statsProjet.ouvertes,
      anomaliesCritiques: statsProjet.critiques, tauxCouverture: statsProjet.taux,
    };
    setDecision(d);
    setVerdict(goNogoService.calculerVerdict(d));
  };

  const toggleCheck = (id: string, val: string) => {
    if (!decision) return;
    setDecision({
      ...decision,
      checklist: decision.checklist.map((c) => c.id === id ? { ...c, statut: val as any } : c),
    });
  };

  const ajouterCheckItem = () => {
    if (!decision) return;
    setDecision({
      ...decision,
      checklist: [...decision.checklist, { id: `id_${Date.now()}`, description: 'Nouvel élément', statut: 'a_faire' }],
    });
  };

  const supprimerCheckItem = (id: string) => {
    if (!decision) return;
    setDecision({ ...decision, checklist: decision.checklist.filter((c) => c.id !== id) });
  };

  const demanderDerogation = () => {
    if (!decision || !nouvelleRef) return;
    const d = goNogoService.demanderDerogation(nouvelleRef, nouvelleDesc, nouveauRisque, nouvellesMesures, currentUser?.id || '');
    setDecision({ ...decision, derogations: [...decision.derogations, d] });
    setNouvelleRef(''); setNouvelleDesc(''); setNouveauRisque(''); setNouvellesMesures('');
  };

  const sauvegarder = () => {
    if (!decision) return;
    const d = { ...decision, verdict, commentaires, dateDecision: new Date().toISOString() };
    goNogoService.sauvegarderDecision(d);
    setDecision(d);
  };

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" className="-ml-2" onClick={() => navigate(-1)}>
        <ArrowLeft className="w-4 h-4 mr-2" />Retour
      </Button>

      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-indigo-50">
          <Rocket className="w-6 h-6 text-indigo-600" />
        </div>
        <div>
          <h2 className="text-2xl font-semibold">Go / No-Go Live</h2>
          <p className="text-sm text-gray-500">Décision de mise en production</p>
        </div>
      </div>

      {!decision ? (
        <Card>
          <CardHeader><CardTitle className="text-base">Sélectionner un projet</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Projet</Label>
              <select value={projetId} onChange={(e) => setProjetId(e.target.value)}
                className="w-full border rounded-md px-3 py-2 text-sm mt-1">
                <option value="">— Choisir un projet —</option>
                {projets.map((p) => <option key={p.id} value={p.id}>{p.nom}</option>)}
              </select>
            </div>
            {statsProjet && (
              <div className="grid grid-cols-4 gap-3">
                <div className="p-3 bg-gray-50 rounded-lg text-center">
                  <div className="text-2xl font-bold text-gray-800">{statsProjet.total}</div>
                  <p className="text-xs text-gray-500">Anomalies totales</p>
                </div>
                <div className="p-3 bg-orange-50 rounded-lg text-center">
                  <div className="text-2xl font-bold text-orange-600">{statsProjet.ouvertes}</div>
                  <p className="text-xs text-gray-500">Ouvertes</p>
                </div>
                <div className="p-3 bg-red-50 rounded-lg text-center">
                  <div className="text-2xl font-bold text-red-600">{statsProjet.critiques}</div>
                  <p className="text-xs text-gray-500">Critiques</p>
                </div>
                <div className="p-3 bg-emerald-50 rounded-lg text-center">
                  <div className="text-2xl font-bold text-emerald-600">{statsProjet.taux}%</div>
                  <p className="text-xs text-gray-500">Couverture</p>
                </div>
              </div>
            )}
            <Button onClick={initDecision} disabled={!projetId}>
              <Shield className="w-4 h-4 mr-2" />Lancer la décision
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <Badge className={verdictConfig[verdict].cls + ' text-sm px-4 py-2'}>
              {verdictConfig[verdict].label}
            </Badge>
            <div className="flex gap-2">
              {(['go', 'go_reserve', 'no_go'] as const).map((v) => (
                <Button key={v} size="sm" variant={verdict === v ? 'default' : 'outline'}
                  onClick={() => setVerdict(v)}>
                  {verdictConfig[v].label}
                </Button>
              ))}
            </div>
          </div>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Checklist de décision</CardTitle>
              <Button size="sm" variant="outline" onClick={ajouterCheckItem}>
                <Plus className="w-3 h-3 mr-1" />Ajouter
              </Button>
            </CardHeader>
            <CardContent className="space-y-2">
              {decision.checklist.map((item) => (
                <div key={item.id} className="flex items-center gap-3 p-2 rounded-lg bg-gray-50">
                  <select value={item.statut} onChange={(e) => toggleCheck(item.id, e.target.value)}
                    className="border rounded px-2 py-1 text-sm">
                    {Object.entries(statutCheckConfig).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                  </select>
                  <span className="flex-1 text-sm">{item.description}</span>
                  <Button size="sm" variant="ghost" onClick={() => supprimerCheckItem(item.id)}>
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Dérogations</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {decision.derogations.length > 0 && (
                <div className="space-y-2">
                  {decision.derogations.map((d) => (
                    <div key={d.id} className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline">{d.reference}</Badge>
                        <Badge className={d.statut === 'approuvee' ? 'bg-emerald-100 text-emerald-700' : d.statut === 'rejetee' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}>
                          {d.statut}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600">{d.description}</p>
                      <p className="text-xs text-gray-400 mt-1">Risque : {d.risque}</p>
                    </div>
                  ))}
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Référence</Label><Input value={nouvelleRef} onChange={(e) => setNouvelleRef(e.target.value)} placeholder="DER-001" className="mt-1" /></div>
                <div><Label>Risque</Label><Input value={nouveauRisque} onChange={(e) => setNouveauRisque(e.target.value)} placeholder="Risque identifié" className="mt-1" /></div>
              </div>
              <div><Label>Description</Label><Input value={nouvelleDesc} onChange={(e) => setNouvelleDesc(e.target.value)} placeholder="Description de la dérogation" className="mt-1" /></div>
              <div><Label>Mesures d'atténuation</Label><Textarea value={nouvellesMesures} onChange={(e) => setNouvellesMesures(e.target.value)} placeholder="Mesures prévues" className="mt-1" rows={2} /></div>
              <Button size="sm" onClick={demanderDerogation} disabled={!nouvelleRef}>
                <Plus className="w-3 h-3 mr-1" />Demander dérogation
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Commentaires</CardTitle></CardHeader>
            <CardContent>
              <Textarea value={commentaires} onChange={(e) => setCommentaires(e.target.value)}
                placeholder="Justification de la décision..." rows={3} />
            </CardContent>
          </Card>

          <Button onClick={sauvegarder} className="bg-indigo-600 hover:bg-indigo-700">
            <CheckCircle2 className="w-4 h-4 mr-2" />Sauvegarder la décision
          </Button>
        </div>
      )}
    </div>
  );
}
