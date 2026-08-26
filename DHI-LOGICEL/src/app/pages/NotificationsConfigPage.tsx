import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Switch } from '../components/ui/switch';
import { ArrowLeft, Settings, Save, Bell } from 'lucide-react';
import { ConfigNotifications } from '../types';

const CONFIG_KEY = 'dhi_config_notifications';

function loadConfig(): ConfigNotifications {
  try { return JSON.parse(localStorage.getItem(CONFIG_KEY) || 'null') || configDefaut(); } catch { return configDefaut(); }
}
function configDefaut(): ConfigNotifications {
  return { emailActif: false, anomaliesCritiques: true, anomaliesOuvertes: true, retardCampagnes: true, scoreQualite: true, allocations: true, frequence: 'instantane' };
}

export function NotificationsConfigPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [config, setConfig] = useState<ConfigNotifications>(loadConfig);
  const [sauvegarde, setSauvegarde] = useState(false);

  const sauvegarder = () => {
    localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
    setSauvegarde(true);
    setTimeout(() => setSauvegarde(false), 2000);
  };

  const toggle = (key: keyof ConfigNotifications) => {
    setConfig({ ...config, [key]: !config[key as keyof ConfigNotifications] });
  };

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" className="-ml-2" onClick={() => navigate(-1)}>
        <ArrowLeft className="w-4 h-4 mr-2" />Retour
      </Button>

      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-violet-50">
          <Settings className="w-6 h-6 text-violet-600" />
        </div>
        <div>
          <h2 className="text-2xl font-semibold">Configuration des notifications</h2>
          <p className="text-sm text-gray-500">Personnaliser les alertes reçues</p>
        </div>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Notifications par email</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-sm">Activer les notifications email</p>
              <p className="text-xs text-gray-500">Recevoir les alertes par email</p>
            </div>
            <Switch checked={config.emailActif} onCheckedChange={() => toggle('emailActif')} />
          </div>
          {config.emailActif && (
            <div>
              <Label>Adresse email</Label>
              <Input value={config.emailAdress || ''} onChange={(e) => setConfig({ ...config, emailAdress: e.target.value })}
                placeholder="votre@email.com" className="mt-1" type="email" />
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Types de notifications</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {([
            ['anomaliesCritiques', 'Anomalies critiques', 'Alerte immédiate sur les anomalies critiques'],
            ['anomaliesOuvertes', 'Anomalies ouvertes', 'Récapitulatif des anomalies en cours'],
            ['retardCampagnes', 'Retard campagnes', 'Alerte quand une campagne est en retard'],
            ['scoreQualite', 'Score qualité', 'Notification quand le score qualité change'],
            ['allocations', 'Allocations', 'Notification à l\'assignation à une campagne'],
          ] as const).map(([key, label, desc]) => (
            <div key={key} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium text-sm">{label}</p>
                <p className="text-xs text-gray-500">{desc}</p>
              </div>
              <Switch checked={config[key]} onCheckedChange={() => toggle(key)} />
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Fréquence</CardTitle></CardHeader>
        <CardContent>
          <div className="flex gap-3">
            {(['instantane', 'quotidien', 'hebdomadaire'] as const).map((f) => (
              <Button key={f} size="sm" variant={config.frequence === f ? 'default' : 'outline'}
                onClick={() => setConfig({ ...config, frequence: f })}>
                {f === 'instantane' ? 'Instantané' : f === 'quotidien' ? 'Quotidien' : 'Hebdomadaire'}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Button onClick={sauvegarder} className="bg-violet-600 hover:bg-violet-700">
        <Save className="w-4 h-4 mr-2" />
        {sauvegarde ? 'Sauvegardé !' : 'Sauvegarder'}
      </Button>
    </div>
  );
}
