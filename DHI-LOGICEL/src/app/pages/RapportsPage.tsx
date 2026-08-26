import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { ArrowLeft, FileText, Download, Table } from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { rapportService, TypeRapport, FormatRapport } from '../services/rapportService';

const typeRapportConfig: Record<TypeRapport, { label: string; desc: string; icon: React.ElementType }> = {
  couverture: { label: 'Couverture', desc: 'Rapport de couverture des tests', icon: Table },
  anomalies: { label: 'Anomalies', desc: 'Liste et statistiques des anomalies', icon: FileText },
  qualite: { label: 'Qualité', desc: 'Score et métriques qualité', icon: FileText },
  go_nogo: { label: 'Go/No-Go', desc: 'Décision de mise en production', icon: FileText },
  projet: { label: 'Projet', desc: 'Synthèse du projet', icon: FileText },
  produit: { label: 'Produit', desc: 'Synthèse du produit', icon: FileText },
};

export function RapportsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { anomalies, campagnes, projets, testCases, produits } = useData();

  const [typeSelectionne, setTypeSelectionne] = useState<TypeRapport | null>(null);
  const [format, setFormat] = useState<FormatRapport>('pdf');

  const generer = () => {
    if (!typeSelectionne) return;
    rapportService.genererRapport(
      { type: typeSelectionne, format, titre: typeRapportConfig[typeSelectionne].label },
      { anomalies, campagnes, projets, testCases, produits }
    );
  };

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" className="-ml-2" onClick={() => navigate(-1)}>
        <ArrowLeft className="w-4 h-4 mr-2" />Retour
      </Button>

      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-purple-50">
          <FileText className="w-6 h-6 text-purple-600" />
        </div>
        <div>
          <h2 className="text-2xl font-semibold">Rapports</h2>
          <p className="text-sm text-gray-500">Générer des rapports à partir des données</p>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {(Object.entries(typeRapportConfig) as [TypeRapport, typeof typeRapportConfig[TypeRapport]][]).map(([key, cfg]) => {
          const Icon = cfg.icon;
          return (
            <Card key={key} className={`cursor-pointer transition-all hover:shadow-md ${typeSelectionne === key ? 'ring-2 ring-indigo-500 border-indigo-300' : ''}`}
              onClick={() => setTypeSelectionne(key)}>
              <CardContent className="py-6 text-center">
                <Icon className={`w-8 h-8 mx-auto mb-3 ${typeSelectionne === key ? 'text-indigo-600' : 'text-gray-400'}`} />
                <h3 className="font-semibold">{cfg.label}</h3>
                <p className="text-xs text-gray-500 mt-1">{cfg.desc}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {typeSelectionne && (
        <Card>
          <CardHeader><CardTitle className="text-base">Options d'export</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-3">
              {(['pdf', 'csv'] as const).map((f) => (
                <Button key={f} size="sm" variant={format === f ? 'default' : 'outline'}
                  onClick={() => setFormat(f)}>
                  {f.toUpperCase()}
                </Button>
              ))}
            </div>
            <Button onClick={generer} className="bg-indigo-600 hover:bg-indigo-700">
              <Download className="w-4 h-4 mr-2" />Générer le rapport
            </Button>
            <p className="text-xs text-gray-400">
              Le rapport sera téléchargé automatiquement. {format === 'pdf' ? 'Le format PDF est un document HTML imprimable.' : 'Le format CSV est compatible avec Excel.'}
            </p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader><CardTitle className="text-base">Résumé des données</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 text-center">
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="text-xl font-bold">{projets.length}</div>
              <p className="text-xs text-gray-500">Projets</p>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="text-xl font-bold">{produits.length}</div>
              <p className="text-xs text-gray-500">Produits</p>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="text-xl font-bold">{campagnes.length}</div>
              <p className="text-xs text-gray-500">Campagnes</p>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="text-xl font-bold">{testCases.length}</div>
              <p className="text-xs text-gray-500">Cas de test</p>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="text-xl font-bold">{anomalies.length}</div>
              <p className="text-xs text-gray-500">Anomalies</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
