import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { Campagne } from '../types';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Plus, User, X } from 'lucide-react';
import { toast } from 'sonner';

interface TeamTabProps {
  campagne: Campagne;
  peutGerer: boolean;
  readOnly: boolean;
}

export function TeamTab({ campagne, peutGerer, readOnly }: TeamTabProps) {
  const { t } = useTranslation();
  const { users, modifierCampagne } = useData();
  const [ajoutMembreDialogOpen, setAjoutMembreDialogOpen] = useState(false);
  const [nouveauMembre, setNouveauMembre] = useState({ userId: '', type: 'testeur' as 'testeur' | 'developpeur' });

  const equipeTesteursDedupliquee = [...new Set(campagne.equipeTesteurs)];
  const equipeDeveloppeursDedupliquee = [...new Set(campagne.equipeDeveloppeurs)];

  const testeurs = users.filter((u: any) => equipeTesteursDedupliquee.includes(String(u.id)));
  const developpeurs = users.filter((u: any) => equipeDeveloppeursDedupliquee.includes(String(u.id)));
  const tousLesTesteursApp = users.filter((u: any) => u.role === 'testeur');
  const tousLesDeveloppeursApp = users.filter((u: any) => u.role === 'developpeur');

  const handleAjouterMembre = async () => {
    if (!nouveauMembre.userId) return;
    try {
      if (nouveauMembre.type === 'testeur') {
        const dedup = [...new Set(campagne.equipeTesteurs)];
        if (!dedup.includes(nouveauMembre.userId)) {
          await modifierCampagne(campagne.id, { equipeTesteurs: [...dedup, nouveauMembre.userId] });
        }
      } else {
        const dedup = [...new Set(campagne.equipeDeveloppeurs)];
        if (!dedup.includes(nouveauMembre.userId)) {
          await modifierCampagne(campagne.id, { equipeDeveloppeurs: [...dedup, nouveauMembre.userId] });
        }
      }
      setNouveauMembre({ userId: '', type: 'testeur' });
      setAjoutMembreDialogOpen(false);
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  const handleRetirerMembre = async (userId: string, type: 'testeur' | 'developpeur') => {
    try {
      if (type === 'testeur') {
        await modifierCampagne(campagne.id, { equipeTesteurs: campagne.equipeTesteurs.filter((id: string) => id !== userId) });
      } else {
        await modifierCampagne(campagne.id, { equipeDeveloppeurs: campagne.equipeDeveloppeurs.filter((id: string) => id !== userId) });
      }
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base">{t('campagne.detail.tester_team')}</CardTitle>
            {peutGerer && !readOnly && <Button size="sm" variant="outline" onClick={() => setAjoutMembreDialogOpen(true)}><Plus className="w-4 h-4 mr-1" />{t('campagne.detail.add')}</Button>}
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {testeurs.map((testeur: any) => (
                <div key={testeur.id} className="flex items-center justify-between p-2 rounded-lg bg-gray-50">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium">{testeur.prenom} {testeur.nom}</p>
                      <p className="text-xs text-gray-500">{testeur.email}</p>
                    </div>
                  </div>
                  {peutGerer && !readOnly && <Button size="sm" variant="ghost" onClick={() => handleRetirerMembre(testeur.id, 'testeur')}><X className="w-4 h-4" /></Button>}
                </div>
              ))}
              {testeurs.length === 0 && <p className="text-sm text-gray-500 text-center py-4">{t('campagne.detail.no_tester')}</p>}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base">{t('campagne.detail.dev_team')}</CardTitle>
            {peutGerer && !readOnly && <Button size="sm" variant="outline" onClick={() => setAjoutMembreDialogOpen(true)}><Plus className="w-4 h-4 mr-1" />{t('campagne.detail.add')}</Button>}
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {developpeurs.map((dev: any) => (
                <div key={dev.id} className="flex items-center justify-between p-2 rounded-lg bg-gray-50">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium">{dev.prenom} {dev.nom}</p>
                      <p className="text-xs text-gray-500">{dev.email}</p>
                    </div>
                  </div>
                  {peutGerer && !readOnly && <Button size="sm" variant="ghost" onClick={() => handleRetirerMembre(dev.id, 'developpeur')}><X className="w-4 h-4" /></Button>}
                </div>
              ))}
              {developpeurs.length === 0 && <p className="text-sm text-gray-500 text-center py-4">{t('campagne.detail.no_dev')}</p>}
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={ajoutMembreDialogOpen} onOpenChange={setAjoutMembreDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('campagne.detail.add_member_title')}</DialogTitle>
            <DialogDescription>{t('campagne.detail.add_member_desc')}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>{t('campagne.detail.member_type')}</Label>
              <Select value={nouveauMembre.type} onValueChange={(value: 'testeur' | 'developpeur') => setNouveauMembre({ ...nouveauMembre, type: value })}>
                <SelectTrigger><SelectValue placeholder={t('campagne.detail.select_role')} /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="testeur">{t('campagne.detail.tester_role')}</SelectItem>
                  <SelectItem value="developpeur">{t('campagne.detail.dev_role')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{t('campagne.detail.member')}</Label>
              <Select value={nouveauMembre.userId || undefined} onValueChange={(value) => setNouveauMembre({ ...nouveauMembre, userId: value })}>
                <SelectTrigger><SelectValue placeholder={t('campagne.detail.select_member')} /></SelectTrigger>
                <SelectContent>
                  {(nouveauMembre.type === 'testeur' ? tousLesTesteursApp : tousLesDeveloppeursApp)
                    .filter((u: any) => !(nouveauMembre.type === 'testeur' ? equipeTesteursDedupliquee : equipeDeveloppeursDedupliquee).includes(String(u.id)))
                    .map((user: any) => (
                      <SelectItem key={user.id} value={user.id}>{user.prenom} {user.nom}</SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAjoutMembreDialogOpen(false)}>{t('campagne.detail.cancel')}</Button>
            <Button onClick={handleAjouterMembre}>{t('campagne.detail.add')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
