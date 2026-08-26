import { RegleAlerte, AlerteDeclenchee, Anomalie, Campagne, Projet } from '../types';

const REGLES_KEY = 'dhi_regles_alertes';
const ALERTES_KEY = 'dhi_alertes_declenchees';

function load<T>(key: string): T[] {
  try { return JSON.parse(localStorage.getItem(key) || '[]'); } catch { return []; }
}
function save<T>(key: string, data: T[]): void { localStorage.setItem(key, JSON.stringify(data)); }
function uid(): string { return `id_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`; }

export const alerteService = {
  reglesDefaut(): RegleAlerte[] {
    return [
      { id: uid(), nom: 'Anomalie critique', description: 'Alerte quand une anomalie critique est créée', type: 'anomalie_critique', seuil: 1, active: true, destinataires: [], dateCreation: new Date().toISOString() },
      { id: uid(), nom: 'Trop d\'anomalies ouvertes', description: 'Alerte quand le nombre d\'anomalies ouvertes dépasse le seuil', type: 'anomalie_ouverte', seuil: 10, active: true, destinataires: [], dateCreation: new Date().toISOString() },
      { id: uid(), nom: 'Couverture basse', description: 'Alerte quand la couverture tombe sous le seuil', type: 'couverture_basse', seuil: 60, active: true, destinataires: [], dateCreation: new Date().toISOString() },
      { id: uid(), nom: 'Délai dépassé', description: 'Alerte quand une campagne dépasse la date limite', type: 'delai_depasse', seuil: 1, active: true, destinataires: [], dateCreation: new Date().toISOString() },
      { id: uid(), nom: 'Score qualité bas', description: 'Alerte quand le score qualité tombe sous le seuil', type: 'score_basse', seuil: 70, active: true, destinataires: [], dateCreation: new Date().toISOString() },
    ];
  },

  listRegles(): RegleAlerte[] {
    const r = load<RegleAlerte>(REGLES_KEY);
    return r.length > 0 ? r : this.reglesDefaut();
  },

  sauvegarderRegle(regle: RegleAlerte): void {
    const all = load<RegleAlerte>(REGLES_KEY);
    const idx = all.findIndex((r) => r.id === regle.id);
    if (idx !== -1) { all[idx] = regle; } else { all.push(regle); }
    save(REGLES_KEY, all);
  },

  supprimerRegle(id: string): void {
    save(REGLES_KEY, load<RegleAlerte>(REGLES_KEY).filter((r) => r.id !== id));
  },

  listAlertes(): AlerteDeclenchee[] { return load<AlerteDeclenchee>(ALERTES_KEY); },

  marquerLue(id: string): void {
    const all = load<AlerteDeclenchee>(ALERTES_KEY);
    const a = all.find((x) => x.id === id);
    if (a) { a.lue = true; }
    save(ALERTES_KEY, all);
  },

  marquerToutesLues(): void {
    const all = load<AlerteDeclenchee>(ALERTES_KEY).map((a) => ({ ...a, lue: true }));
    save(ALERTES_KEY, all);
  },

  verifierAlertes(anomalies: Anomalie[], campagnes: Campagne[], projets: Projet[]): AlerteDeclenchee[] {
    const regles = this.listRegles();
    const nouvelles: AlerteDeclenchee[] = [];

    regles.forEach((regle) => {
      if (!regle.active) return;
      let declenche = false;
      let titre = '';
      let message = '';
      let priorite: 'info' | 'warning' | 'critical' = 'info';

      switch (regle.type) {
        case 'anomalie_critique': {
          const count = anomalies.filter((a) => a.priorite === 'critique' && !['cloturee', 'validee'].includes(a.statut)).length;
          if (count >= regle.seuil) { declenche = true; titre = `${count} anomalie(s) critique(s) ouverte(s)`; message = `Seuil atteint : ${count} >= ${regle.seuil}`; priorite = 'critical'; }
          break;
        }
        case 'anomalie_ouverte': {
          const count = anomalies.filter((a) => !['cloturee', 'validee'].includes(a.statut)).length;
          if (count >= regle.seuil) { declenche = true; titre = `${count} anomalie(s) ouverte(s)`; message = `Seuil dépassé : ${count} >= ${regle.seuil}`; priorite = 'warning'; }
          break;
        }
        case 'couverture_basse': {
          const totalTC = anomalies.length; // placeholder
          if (totalTC > 0) {
            const passants = anomalies.filter((a) => a.statut === 'cloturee').length;
            const taux = Math.round((passants / totalTC) * 100);
            if (taux < regle.seuil) { declenche = true; titre = `Couverture basse : ${taux}%`; message = `Seuil minimum : ${regle.seuil}%`; priorite = 'warning'; }
          }
          break;
        }
        case 'delai_depasse': {
          const now = Date.now();
          const depassees = campagnes.filter((c) => c.dateFin && new Date(c.dateFin).getTime() < now && c.statut !== 'terminee');
          if (depassees.length >= regle.seuil) { declenche = true; titre = `${depassees.length} campagne(s) en retard`; message = 'Des campagnes ont dépassé leur date de fin'; priorite = 'warning'; }
          break;
        }
        case 'score_basse': {
          const ouvertes = anomalies.filter((a) => !['cloturee', 'validee'].includes(a.statut)).length;
          const total = anomalies.length || 1;
          const score = Math.round(((total - ouvertes) / total) * 100);
          if (score < regle.seuil) { declenche = true; titre = `Score qualité : ${score}/100`; message = `Seuil minimum : ${regle.seuil}`; priorite = 'critical'; }
          break;
        }
      }

      if (declenche) {
        const al: AlerteDeclenchee = {
          id: uid(), regleId: regle.id, type: regle.type, titre, message,
          projetId: regle.projetId, priorite, lue: false,
          dateDeclenchement: new Date().toISOString(),
        };
        nouvelles.push(al);
      }
    });

    if (nouvelles.length > 0) {
      const all = load<AlerteDeclenchee>(ALERTES_KEY);
      all.unshift(...nouvelles);
      save(ALERTES_KEY, all);
    }

    return nouvelles;
  },
};
