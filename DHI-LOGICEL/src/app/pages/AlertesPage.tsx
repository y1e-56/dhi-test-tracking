import { useState, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Switch } from '../components/ui/switch';
import { ArrowLeft, Bell, BellRing, Plus, Trash2, Eye, EyeOff, AlertTriangle, Info, Shield } from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { alerteService } from '../services/alerteService';
import { RegleAlerte, AlerteDeclenchee } from '../types';

const typeConfig: Record<string, { label: string; icon: React.ElementType }> = {
  anomalie_critique: { label: 'Anomalie critique', icon: AlertTriangle },
  anomalie_ouverte: { label: 'Anomalies ouvertes', icon: AlertTriangle },
  couverture_basse: { label: 'Couverture basse', icon: Shield },
  delai_depasse: { label: 'Délai dépassé', icon: AlertTriangle },
  score_basse: { label: 'Score bas', icon: AlertTriangle },
  campagne_retard: { label: 'Campagne en retard', icon: AlertTriangle },
  personnalise: { label: 'Personnalisé', icon: Bell },
};

const prioriteConfig: Record<string, { cls: string }> = {
  info: { cls: 'bg-blue-100 text-blue-700' },
  warning: { cls: 'bg-amber-100 text-amber-700' },
  critical: { cls: 'bg-red-100 text-red-700' },
};

export function AlertesPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { anomalies, campagnes, projets } = useData();

  const [regles, setRegles] = useState<RegleAlerte[]>([]);
  const [alertes, setAlertes] = useState<AlerteDeclenchee[]>([]);
  const [onglet, setOnglet] = useState<'alertes' | 'regles'>('alertes');
  const [nouvelleRegle, setNouvelleRegle] = useState(false);
  const [nomRegle, setNomRegle] = useState('');
  const [typeRegle, setTypeRegle] = useState<string>('anomalie_critique');
  const [seuilRegle, setSeuilRegle] = useState(1);

  useEffect(() => {
    setRegles(alerteService.listRegles());
    setAlertes(alerteService.listAlertes());
  }, []);

  const nonLues = useMemo(() => alertes.filter((a) => !a.lue).length, [alertes]);

  const verifier = () => {
    const nouvelles = alerteService.verifierAlertes(anomalies, campagnes, projets);
    setAlertes(alerteService.listAlertes());
    setRegles(alerteService.listRegles());
  };

  const ajouterRegle = () => {
    if (!nomRegle) return;
    const r: RegleAlerte = {
      id: `id_${Date.now()}`, nom: nomRegle, description: '', type: typeRegle as any,
      seuil: seuilRegle, active: true, destinataires: [], dateCreation: new Date().toISOString(),
    };
    alerteService.sauvegarderRegle(r);
    setRegles(alerteService.listRegles());
    setNouvelleRegle(false); setNomRegle(''); setSeuilRegle(1);
  };

  const toggleRegle = (id: string) => {
    const r = regles.find((x) => x.id === id);
    if (r) { r.active = !r.active; alerteService.sauvegarderRegle(r); setRegles([...regles]); }
  };

  const supprimerRegle = (id: string) => {
    alerteService.supprimerRegle(id);
    setRegles(alerteService.listRegles());
  };

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" className="-ml-2" onClick={() => navigate(-1)}>
        <ArrowLeft className="w-4 h-4 mr-2" />Retour
      </Button>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-amber-50">
            <BellRing className="w-6 h-6 text-amber-600" />
          </div>
          <div>
            <h2 className="text-2xl font-semibold">Alertes</h2>
            <p className="text-sm text-gray-500">
              {nonLues > 0 ? `${nonLues} non lue(s)` : 'Toutes lues'}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button size="sm" onClick={verifier}>
            <Bell className="w-4 h-4 mr-2" />Vérifier
          </Button>
          {nonLues > 0 && (
            <Button size="sm" variant="outline" onClick={() => { alerteService.marquerToutesLues(); setAlertes(alerteService.listAlertes()); }}>
              <Eye className="w-4 h-4 mr-2" />Tout marquer lu
            </Button>
          )}
        </div>
      </div>

      <div className="flex gap-2">
        {(['alertes', 'regles'] as const).map((o) => (
          <Button key={o} size="sm" variant={onglet === o ? 'default' : 'outline'} onClick={() => setOnglet(o)}>
            {o === 'alertes' ? `Alertes (${alertes.length})` : `Règles (${regles.length})`}
          </Button>
        ))}
      </div>

      {onglet === 'alertes' ? (
        <Card>
          <CardContent className="p-0">
            {alertes.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-12">Aucune alerte</p>
            ) : (
              <div className="divide-y">
                {alertes.map((a) => (
                  <div key={a.id} className={`flex items-start gap-4 p-4 ${a.lue ? 'bg-white' : 'bg-amber-50/50'}`}>
                    <div className={`p-2 rounded-lg ${prioriteConfig[a.priorite]?.cls || 'bg-gray-100'}`}>
                      {a.priorite === 'critical' ? <AlertTriangle className="w-4 h-4" /> : <Info className="w-4 h-4" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{a.titre}</span>
                        {!a.lue && <div className="w-2 h-2 bg-amber-500 rounded-full" />}
                      </div>
                      <p className="text-xs text-gray-500 mt-1">{a.message}</p>
                      <p className="text-xs text-gray-400 mt-1">{new Date(a.dateDeclenchement).toLocaleString('fr-FR')}</p>
                    </div>
                    {!a.lue && (
                      <Button size="sm" variant="ghost" onClick={() => { alerteService.marquerLue(a.id); setAlertes(alerteService.listAlertes()); }}>
                        <Eye className="w-3 h-3" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {nouvelleRegle ? (
            <Card>
              <CardHeader><CardTitle className="text-base">Nouvelle règle</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div><Label>Nom</Label><Input value={nomRegle} onChange={(e) => setNomRegle(e.target.value)} className="mt-1" /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Type</Label>
                    <select value={typeRegle} onChange={(e) => setTypeRegle(e.target.value)} className="w-full border rounded px-3 py-2 text-sm mt-1">
                      {Object.entries(typeConfig).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                    </select>
                  </div>
                  <div><Label>Seuil</Label><Input type="number" value={seuilRegle} onChange={(e) => setSeuilRegle(Number(e.target.value))} className="mt-1" /></div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={ajouterRegle}>Créer</Button>
                  <Button size="sm" variant="outline" onClick={() => setNouvelleRegle(false)}>Annuler</Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Button size="sm" onClick={() => setNouvelleRegle(true)}>
              <Plus className="w-4 h-4 mr-2" />Nouvelle règle
            </Button>
          )}

          <Card>
            <CardContent className="p-0">
              <table className="w-full text-sm">
                <thead><tr className="border-b bg-gray-50">
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Règle</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Type</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Seuil</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Active</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Actions</th>
                </tr></thead>
                <tbody>
                  {regles.map((r) => (
                    <tr key={r.id} className="border-b last:border-0">
                      <td className="py-3 px-4 font-medium">{r.nom}</td>
                      <td className="py-3 px-4"><Badge variant="outline">{typeConfig[r.type]?.label || r.type}</Badge></td>
                      <td className="py-3 px-4">{r.seuil}</td>
                      <td className="py-3 px-4">
                        <Switch checked={r.active} onCheckedChange={() => toggleRegle(r.id)} />
                      </td>
                      <td className="py-3 px-4">
                        <Button size="sm" variant="ghost" onClick={() => supprimerRegle(r.id)}>
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
