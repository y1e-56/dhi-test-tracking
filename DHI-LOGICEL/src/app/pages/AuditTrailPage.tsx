import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { ArrowLeft, History, Search, Filter, Trash2 } from 'lucide-react';
import { auditService } from '../services/auditService';
import { AuditEntry } from '../types';

const typeConfig: Record<string, { label: string; cls: string }> = {
  anomalie: { label: 'Anomalie', cls: 'bg-red-100 text-red-700' },
  campagne: { label: 'Campagne', cls: 'bg-indigo-100 text-indigo-700' },
  projet: { label: 'Projet', cls: 'bg-blue-100 text-blue-700' },
  produit: { label: 'Produit', cls: 'bg-purple-100 text-purple-700' },
  utilisateur: { label: 'Utilisateur', cls: 'bg-green-100 text-green-700' },
  test_case: { label: 'Cas de test', cls: 'bg-violet-100 text-violet-700' },
  fonctionnalite: { label: 'Fonctionnalité', cls: 'bg-cyan-100 text-cyan-700' },
  rapport: { label: 'Rapport', cls: 'bg-amber-100 text-amber-700' },
  alerte: { label: 'Alerte', cls: 'bg-orange-100 text-orange-700' },
  systeme: { label: 'Système', cls: 'bg-gray-100 text-gray-700' },
};

export function AuditTrailPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [entries, setEntries] = useState<AuditEntry[]>(auditService.lister());
  const [recherche, setRecherche] = useState('');
  const [filtreType, setFiltreType] = useState('');
  const [filtreDate, setFiltreDate] = useState('');

  const stats = useMemo(() => auditService.stats(), []);

  const filtrer = () => {
    const result = auditService.lister({
      entityType: filtreType || undefined,
      recherche: recherche || undefined,
      dateDebut: filtreDate || undefined,
    });
    setEntries(result);
  };

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" className="-ml-2" onClick={() => navigate(-1)}>
        <ArrowLeft className="w-4 h-4 mr-2" />Retour
      </Button>

      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-gray-50">
          <History className="w-6 h-6 text-gray-600" />
        </div>
        <div>
          <h2 className="text-2xl font-semibold">Audit Trail</h2>
          <p className="text-sm text-gray-500">{stats.total} actions enregistrées</p>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {Object.entries(stats.parType).sort(([, a], [, b]) => b - a).slice(0, 4).map(([type, count]) => (
          <Card key={type}>
            <CardContent className="py-3 text-center">
              <Badge className={typeConfig[type]?.cls || 'bg-gray-100 text-gray-700'}>{typeConfig[type]?.label || type}</Badge>
              <div className="text-xl font-bold mt-2">{count}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Filtres</CardTitle></CardHeader>
        <CardContent>
          <div className="flex gap-3 items-end">
            <div className="flex-1">
              <Label>Recherche</Label>
              <div className="relative mt-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input value={recherche} onChange={(e) => setRecherche(e.target.value)} placeholder="Rechercher..." className="pl-9" />
              </div>
            </div>
            <div>
              <Label>Type</Label>
              <select value={filtreType} onChange={(e) => setFiltreType(e.target.value)} className="w-40 border rounded px-3 py-2 text-sm mt-1">
                <option value="">Tous</option>
                {Object.entries(typeConfig).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </div>
            <div>
              <Label>Depuis</Label>
              <Input type="date" value={filtreDate} onChange={(e) => setFiltreDate(e.target.value)} className="mt-1" />
            </div>
            <Button onClick={filtrer}><Filter className="w-4 h-4 mr-2" />Filtrer</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {entries.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-12">Aucune entrée</p>
          ) : (
            <div className="divide-y max-h-[600px] overflow-y-auto">
              {entries.map((e) => (
                <div key={e.id} className="flex items-start gap-3 p-4 hover:bg-gray-50">
                  <Badge className={typeConfig[e.entityType]?.cls || 'bg-gray-100 text-gray-700'}>{typeConfig[e.entityType]?.label || e.entityType}</Badge>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{e.userName}</span>
                      <span className="text-xs text-gray-500">{e.action}</span>
                    </div>
                    <p className="text-xs text-gray-600 mt-1">{e.details}</p>
                    {(e.ancienValeur || e.nouvelleValeur) && (
                      <div className="flex gap-2 mt-1">
                        {e.ancienValeur && <span className="text-xs text-red-600 bg-red-50 px-1 rounded">-{e.ancienValeur}</span>}
                        {e.nouvelleValeur && <span className="text-xs text-emerald-600 bg-emerald-50 px-1 rounded">+{e.nouvelleValeur}</span>}
                      </div>
                    )}
                  </div>
                  <span className="text-xs text-gray-400 whitespace-nowrap">{new Date(e.date).toLocaleString('fr-FR')}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
